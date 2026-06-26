const Anthropic = require("@anthropic-ai/sdk");
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

const TECH_KEYWORDS = [
  "Python",
  "TypeScript",
  "JavaScript",
  "Java",
  "SQL",
  "React",
  "Next.js",
  "Node.js",
  "Express",
  "MongoDB",
  "PostgreSQL",
  "FastAPI",
  "Spring Boot",
  "Docker",
  "Git",
  "GitHub",
  "Vercel",
  "Render",
  "AWS",
  "Tailwind CSS"
];

const cleanResumeLines = (resumeText = "") =>
  resumeText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

const isContactLine = (line) =>
  /@|linkedin|github|portfolio|https?:\/\/|\b\d{3}[-.)\s]?\d{3}[-.\s]?\d{4}\b/i.test(line);

const normalizeBullet = (line) => line.replace(/^[•*\-]\s*/, "").trim();

const getDetectedSkills = (resumeText) =>
  TECH_KEYWORDS.filter((skill) =>
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(resumeText)
  );

const buildSourceOnlyDemoRewrite = (resumeText) => {
  const lines = cleanResumeLines(resumeText);
  const name = lines.find((line) => !isContactLine(line) && line.length <= 80) || "Resume Rewrite";
  const contact = lines.filter(isContactLine).slice(0, 2).join(" | ");
  const skills = getDetectedSkills(resumeText);
  const highlights = lines
    .filter((line) => /^[•*\-]\s+/.test(line) || /\b(built|developed|implemented|created|led|managed|designed|analyzed|optimized|taught|conducted|deployed)\b/i.test(line))
    .map(normalizeBullet)
    .filter((line) => line.length > 20)
    .slice(0, 6);

  const rewrite = [name];

  if (contact) {
    rewrite.push(contact);
  }

  rewrite.push(
    "",
    "Summary",
    "Demo mode is enabled, so this local preview keeps claims limited to the uploaded resume. Configure Claude to generate the full AI rewrite.",
    ""
  );

  if (skills.length) {
    rewrite.push("Technical Skills", `Tools & Technologies: ${skills.join(", ")}`, "");
  }

  if (highlights.length) {
    rewrite.push("Resume Highlights", ...highlights.map((line) => `- ${line}`));
  } else {
    rewrite.push(
      "Extracted Resume Text",
      ...lines.slice(0, 8).map((line) => `- ${normalizeBullet(line)}`)
    );
  }

  return rewrite.join("\n");
};

const demoAnalysis = ({ includeRewrite, resumeText }) => ({
  provider: "demo",
  model: "demo-ai",
  score: 72,
  grade: "B-",
  roast:
    "Demo mode is on, so this is a local placeholder review. The real roast and rewrite require Claude to be available.",
  issues: [
    "Demo mode cannot judge the resume as accurately as Claude.",
    "Use stronger action verbs and outcomes where the source resume supports them.",
    "Group technical skills into recruiter-friendly categories.",
    "Make project and experience bullets easy to scan."
  ],
  rewrite: includeRewrite ? buildSourceOnlyDemoRewrite(resumeText) : null,
  usage: { inputTokens: 0, outputTokens: 0 }
});

const getAnthropicClient = () => {
  if (!config.anthropic.apiKey) return null;

  return new Anthropic({
    apiKey: config.anthropic.apiKey
  });
};

const safeParseAnalysis = (rawText, includeRewrite) => {
  let data;

  try {
    data = JSON.parse(rawText);
  } catch (error) {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new AppError("Claude returned invalid JSON. Please try again.", 502, "AI_JSON_ERROR");
    }

    try {
      data = JSON.parse(jsonMatch[0]);
    } catch (nestedError) {
      throw new AppError("Claude returned invalid JSON. Please try again.", 502, "AI_JSON_ERROR");
    }
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

const isTransientAiError = (error) => {
  const status = error.status || error.code;
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
};

const parseRetryDelaySeconds = (value) => {
  if (!value) return null;

  if (typeof value === "string") {
    if (/^\d+$/.test(value)) {
      return Math.max(1, Number(value));
    }

    const secondMatch = value.match(/^(\d+(?:\.\d+)?)s$/i);
    if (secondMatch) {
      return Math.max(1, Math.ceil(Number(secondMatch[1])));
    }

    const minuteMatch = value.match(/^(\d+(?:\.\d+)?)m$/i);
    if (minuteMatch) {
      return Math.max(1, Math.ceil(Number(minuteMatch[1]) * 60));
    }
  }

  if (typeof value === "object") {
    const seconds = Number(value.seconds || 0);
    const nanos = Number(value.nanos || 0);

    if (Number.isFinite(seconds) || Number.isFinite(nanos)) {
      return Math.max(1, Math.ceil(seconds + nanos / 1_000_000_000));
    }
  }

  return null;
};

const findRetryAfterSeconds = (value, seen = new Set()) => {
  if (!value) return null;

  if (typeof value === "string") {
    const retryDelayJson = value.match(/"retryDelay"\s*:\s*"([^"]+)"/i);
    if (retryDelayJson) {
      return parseRetryDelaySeconds(retryDelayJson[1]);
    }

    const retryDelayText = value.match(/retryDelay[^0-9]*(\d+(?:\.\d+)?s)/i);
    if (retryDelayText) {
      return parseRetryDelaySeconds(retryDelayText[1]);
    }

    return null;
  }

  if (typeof value !== "object" || seen.has(value)) return null;
  seen.add(value);

  if (typeof value.message === "string") {
    const parsed = findRetryAfterSeconds(value.message, seen);
    if (parsed) return parsed;
  }

  if (Object.prototype.hasOwnProperty.call(value, "retryDelay")) {
    const parsed = parseRetryDelaySeconds(value.retryDelay);
    if (parsed) return parsed;
  }

  for (const nestedValue of Object.values(value)) {
    const parsed = findRetryAfterSeconds(nestedValue, seen);
    if (parsed) return parsed;
  }

  return null;
};

const formatWait = (seconds) => {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;

  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
};

const buildAiWaitError = (error) => {
  const status = error?.status || error?.code;
  const retryHeader = error?.headers?.["retry-after"] || error?.headers?.get?.("retry-after");
  const retryAfterSeconds =
    parseRetryDelaySeconds(retryHeader) ||
    findRetryAfterSeconds(error) ||
    (status === 429 ? 60 : 30);
  const isRateLimited = status === 429;
  const waitMessage = formatWait(retryAfterSeconds);
  const appError = new AppError(
    isRateLimited
      ? `Claude is rate-limited. Please wait ${waitMessage} and try again.`
      : `Claude is busy right now. Please wait ${waitMessage} and try again.`,
    isRateLimited ? 429 : 503,
    isRateLimited ? "AI_RATE_LIMITED" : "AI_TEMPORARILY_UNAVAILABLE"
  );

  appError.retryAfterSeconds = retryAfterSeconds;
  return appError;
};

const extractClaudeText = (message) =>
  (message.content || [])
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text)
    .join("\n")
    .trim();

const generateWithClaude = async ({ client, prompt, includeRewrite }) => {
  const message = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: includeRewrite ? config.anthropic.maxOutputTokens : 1200,
    temperature: 0.3,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const parsed = safeParseAnalysis(extractClaudeText(message), includeRewrite);
  const usage = message.usage || {};

  return {
    ...parsed,
    provider: "anthropic",
    model: config.anthropic.model,
    usage: {
      inputTokens: usage.input_tokens || 0,
      outputTokens: usage.output_tokens || 0
    }
  };
};

const analyzeResumeWithAi = async ({ resumeText, includeRewrite }) => {
  if (config.useDemoAi) {
    return demoAnalysis({ includeRewrite, resumeText });
  }

  if (!config.anthropic.apiKey) {
    throw new AppError(
      "Claude is not configured. Add ANTHROPIC_API_KEY on the server before running real analyses.",
      503,
      "AI_NOT_CONFIGURED"
    );
  }

  const client = getAnthropicClient();
  const prompt = `Analyze this resume text.

Access rule:
- includeRewrite is ${includeRewrite}
- If includeRewrite is false, set rewrite to null.
- If includeRewrite is true, include a complete improved resume in rewrite.

Return exactly one JSON object with this shape:
{
  "score": 0,
  "grade": "B",
  "roast": "one blunt but useful paragraph",
  "issues": ["issue 1", "issue 2", "issue 3"],
  "rewrite": "full improved resume text or null"
}

Rewrite format guide:
${REWRITE_FORMAT_GUIDE}

Resume text:
${resumeText}`;

  try {
    return await generateWithClaude({
      client,
      prompt,
      includeRewrite
    });
  } catch (error) {
    if (isTransientAiError(error)) {
      throw buildAiWaitError(error);
    }

    throw error;
  }
};

module.exports = {
  analyzeResumeWithAi
};
