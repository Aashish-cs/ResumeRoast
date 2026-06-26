const { GoogleGenAI, Type } = require("@google/genai");
const config = require("../config/env");
const AppError = require("../utils/AppError");

const SYSTEM_PROMPT = `You are ResumeRoast, a sharp but useful resume reviewer.
Score resumes for ATS compatibility and recruiter readability.
Be blunt, witty, and specific, but do not insult protected traits or personal identity.
Return valid JSON matching the schema. No markdown fences, no preamble.
If rewrite is not requested, set rewrite to null and do not draft the improved resume.`;

const REWRITE_FORMAT_GUIDE = `When includeRewrite is true, format rewrite as a compact, ATS-friendly new-grad resume.

Use this plain-text structure, omitting sections that are not supported by the source resume:

Full Name
City, ST | phone | email | LinkedIn | GitHub | portfolio

Summary
One concise paragraph tailored to the candidate's strongest target role.

Education
School, Location
Degree | Graduation date
GPA, honors, scholarships, and relevant coursework only when present.

Technical Skills
Languages: ...
AI & Automation: ...
Backend & APIs: ...
Frontend: ...
Infrastructure: ...
Concepts: ...

Projects
Project Name - Project Type
Tech stack
- Action-led bullet with outcome, scope, or shipped feature.
- Action-led bullet with technologies and concrete impact when supported.

Experience
Company - Role
Location | Dates
- Action-led bullet with responsibility plus impact.
- Action-led bullet with tools, users, or measurable result when supported.

Leadership & Awards
- Leadership, honors, scholarships, awards, or campus involvement.

Rules for rewrite:
- Use plain text only. No markdown fences, no tables, no commentary.
- Use Title Case section headings exactly like the guide.
- Prefer Projects before Experience for recent CS grads when projects are more technical than work history.
- Preserve true names, schools, companies, dates, degrees, links, and locations from the resume.
- Never invent contact details, dates, degrees, employers, metrics, certifications, links, or GPA.
- Improve wording and organization, but keep claims grounded in the resume text.
- Use ASCII characters only. Use "- " for bullets and "|" for separators.`;

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
      description:
        "Full improved resume text in the requested compact resume format, or null when rewrite is not requested"
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
    ? `Candidate Name
City, ST | email@example.com | linkedin.com/in/candidate | github.com/candidate

Summary
Early-career software engineer with experience building full-stack web applications, integrating APIs, and shipping practical user-facing features. Strong foundation in JavaScript, React, Node.js, Express, MongoDB, and REST API design.

Education
University Name, City, ST
B.S. Computer Science | Graduation Date
Relevant Coursework: Data Structures, Algorithms, Database Systems, Software Engineering

Technical Skills
Languages: JavaScript, Java, SQL, HTML, CSS
Backend & APIs: Node.js, Express, REST APIs, JWT
Frontend: React, Vite, Tailwind CSS
Infrastructure: MongoDB, Git, GitHub, cloud deployment
Concepts: Authentication, access control, API integration, responsive design

Projects
ResumeRoast - Full-Stack Resume Analysis SaaS
React, Node.js, Express, MongoDB, Gemini API
- Built a freemium resume analysis app with authentication, PDF upload, AI scoring, roast feedback, and downloadable rewrites.
- Implemented server-side usage limits so free users receive two analyses while subscribers receive a higher daily allowance.
- Added security-question password recovery, environment-based configuration, and API fallback handling for local development.

Experience
Software Project Contributor - Full-Stack Development
Remote | 2026
- Developed user-facing workflows across React and Express with a focus on readable code, practical UX, and maintainable API routes.
- Integrated third-party services while keeping secrets server-side and documenting local setup for future contributors.`
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
      maxOutputTokens: includeRewrite ? 5200 : 1400,
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

Rewrite format guide:
${REWRITE_FORMAT_GUIDE}

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
