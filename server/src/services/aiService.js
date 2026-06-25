const { GoogleGenAI, Type } = require("@google/genai");
const config = require("../config/env");
const AppError = require("../utils/AppError");

const SYSTEM_PROMPT = `You are ResumeRoast, a sharp but useful resume reviewer.
Score resumes for ATS compatibility and recruiter readability.
Be blunt, witty, and specific, but do not insult protected traits or personal identity.
Return valid JSON matching the schema. No markdown fences, no preamble.
If rewrite is not requested, set rewrite to null and do not draft the improved resume.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.NUMBER,
      description: "ATS compatibility score from 0 to 100"
    },
    grade: {
      type: Type.STRING,
      description: "Letter grade such as A, B+, C-, D, or F"
    },
    roast: {
      type: Type.STRING,
      description: "One blunt, witty, useful paragraph"
    },
    issues: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Three to six concrete resume issues"
    },
    rewrite: {
      type: Type.STRING,
      nullable: true,
      description: "Full improved resume text, or null when rewrite is not requested"
    }
  },
  required: ["score", "grade", "roast", "issues", "rewrite"]
};

const demoAnalysis = ({ includeRewrite }) => ({
  provider: "demo",
  model: "demo-ai",
  score: 72,
  grade: "B-",
  roast:
    "This resume has potential, but right now it reads like it was assembled during a fire drill in a spreadsheet. The bones are there; the impact needs a louder microphone.",
  issues: [
    "Several bullets describe responsibilities instead of measurable outcomes.",
    "The summary is broad and could fit too many candidates.",
    "Technical skills need tighter grouping for ATS keyword matching.",
    "Experience bullets should start with stronger action verbs.",
    "Projects need clearer business or user impact."
  ],
  rewrite: includeRewrite
    ? `SUMMARY
Results-oriented software engineer with experience building full-stack applications, integrating APIs, and shipping practical user-facing features. Strong foundation in Java, JavaScript, React, Node.js, and MongoDB.

EXPERIENCE
- Built and maintained full-stack features across React, Express, and MongoDB with a focus on readable code and reliable user flows.
- Integrated third-party services including payments, email, cloud storage, and AI APIs while protecting secrets and user data.
- Improved project structure, documentation, and setup steps to make local development faster for new contributors.

PROJECTS
ResumeRoast
- Built a freemium resume analysis SaaS with authentication, PDF upload, AI scoring, Stripe subscriptions, and server-side access control.
- Implemented backend gating so paid resume rewrites are generated and returned only for active subscribers.

SKILLS
Java, JavaScript, React, Node.js, Express, MongoDB, REST APIs, AWS S3, Stripe, Git`
    : null,
  usage: { inputTokens: 0, outputTokens: 0 }
});

const demoFallbackAnalysis = ({ includeRewrite }) => ({
  ...demoAnalysis({ includeRewrite }),
  model: "demo-ai-fallback"
});

const getGeminiClient = () => {
  if (!config.gemini.apiKey) return null;

  return new GoogleGenAI({
    apiKey: config.gemini.apiKey
  });
};

const safeParseAnalysis = (rawText, includeRewrite) => {
  let data;

  try {
    data = JSON.parse(rawText);
  } catch (error) {
    throw new AppError("Gemini returned invalid JSON. Please try again.", 502, "AI_JSON_ERROR");
  }

  const score = Math.max(0, Math.min(100, Number(data.score)));
  const issues = Array.isArray(data.issues)
    ? data.issues.map((issue) => String(issue).trim()).filter(Boolean).slice(0, 6)
    : [];

  if (!Number.isFinite(score) || !data.grade || !data.roast || issues.length < 3) {
    throw new AppError("Gemini returned an incomplete analysis.", 502, "AI_SHAPE_ERROR");
  }

  return {
    score,
    grade: String(data.grade).slice(0, 3),
    roast: String(data.roast).trim(),
    issues,
    rewrite: includeRewrite && data.rewrite ? String(data.rewrite).trim() : null
  };
};

const isTransientAiError = (error) => {
  const status = error.status || error.code;
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
};

const getModelAttempts = () => {
  const attempts = [config.gemini.model, ...config.gemini.fallbackModels];
  return [...new Set(attempts.filter(Boolean))];
};

const generateWithModel = async ({ client, model, prompt, includeRewrite }) => {
  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.4,
      maxOutputTokens: includeRewrite ? 4200 : 1400,
      responseMimeType: "application/json",
      responseSchema
    }
  });

  const parsed = safeParseAnalysis(response.text || "", includeRewrite);
  const usage = response.usageMetadata || {};

  return {
    ...parsed,
    provider: "gemini",
    model,
    usage: {
      inputTokens: usage.promptTokenCount || 0,
      outputTokens: usage.candidatesTokenCount || 0
    }
  };
};

const analyzeResumeWithAi = async ({ resumeText, includeRewrite }) => {
  if (config.useDemoAi || !config.gemini.apiKey) {
    return demoAnalysis({ includeRewrite });
  }

  const client = getGeminiClient();
  const prompt = `Analyze this resume text.

Access rule:
- includeRewrite is ${includeRewrite}
- If includeRewrite is false, set rewrite to null.
- If includeRewrite is true, include a complete improved resume in rewrite.

Resume text:
${resumeText}`;

  let lastError;

  for (const model of getModelAttempts()) {
    try {
      return await generateWithModel({
        client,
        model,
        prompt,
        includeRewrite
      });
    } catch (error) {
      lastError = error;

      if (!isTransientAiError(error)) {
        throw error;
      }
    }
  }

  if (config.allowAiFallback && isTransientAiError(lastError)) {
    return demoFallbackAnalysis({ includeRewrite });
  }

  throw lastError;
};

module.exports = {
  analyzeResumeWithAi
};
