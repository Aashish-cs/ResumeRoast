const Anthropic = require("@anthropic-ai/sdk");
const config = require("../config/env");
const AppError = require("../utils/AppError");

const SYSTEM_PROMPT = `You are ResumeRoast, a sharp but useful resume reviewer.
Score resumes for ATS compatibility and recruiter readability.
Be blunt, witty, and specific, but do not insult protected traits or personal identity.
Return valid JSON only. No markdown fences, no preamble.
JSON shape:
{
  "score": number from 0 to 100,
  "grade": "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D" | "F",
  "roast": "one punchy paragraph",
  "issues": ["3 to 6 concrete resume issues"],
  "rewrite": "full improved resume text, or null when not requested"
}`;

const demoAnalysis = ({ includeRewrite }) => ({
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

const getAnthropicClient = () => {
  if (!config.anthropic.apiKey) return null;

  return new Anthropic({
    apiKey: config.anthropic.apiKey
  });
};

const extractJsonText = (message) => {
  const block = message.content.find((item) => item.type === "text");
  return block ? block.text.trim() : "";
};

const safeParseAnalysis = (rawText, includeRewrite) => {
  let data;

  try {
    data = JSON.parse(rawText);
  } catch (error) {
    throw new AppError("Claude returned invalid JSON. Please try again.", 502, "AI_JSON_ERROR");
  }

  const score = Math.max(0, Math.min(100, Number(data.score)));
  const issues = Array.isArray(data.issues)
    ? data.issues.map((issue) => String(issue).trim()).filter(Boolean).slice(0, 6)
    : [];

  if (!Number.isFinite(score) || !data.grade || !data.roast || issues.length < 3) {
    throw new AppError("Claude returned an incomplete analysis.", 502, "AI_SHAPE_ERROR");
  }

  return {
    score,
    grade: String(data.grade).slice(0, 3),
    roast: String(data.roast).trim(),
    issues,
    rewrite: includeRewrite && data.rewrite ? String(data.rewrite).trim() : null
  };
};

const analyzeResumeWithClaude = async ({ resumeText, includeRewrite }) => {
  if (config.useDemoAi || !config.anthropic.apiKey) {
    return demoAnalysis({ includeRewrite });
  }

  const client = getAnthropicClient();
  const prompt = `Analyze this resume text.

Important access rule:
- includeRewrite is ${includeRewrite}
- If includeRewrite is false, set "rewrite" to null and do not draft the improved resume.
- If includeRewrite is true, include a complete improved resume in "rewrite".

Resume text:
${resumeText}`;

  const message = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: includeRewrite ? 4200 : 1400,
    temperature: 0.4,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" }
      }
    ],
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const parsed = safeParseAnalysis(extractJsonText(message), includeRewrite);

  return {
    ...parsed,
    usage: {
      inputTokens: message.usage?.input_tokens || 0,
      outputTokens: message.usage?.output_tokens || 0
    }
  };
};

module.exports = {
  analyzeResumeWithClaude
};
