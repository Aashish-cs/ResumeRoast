const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });

const numberFromEnv = (name, fallback) => {
  const raw = process.env[name];
  if (!raw) return fallback;

  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
};

const listFromEnv = (name, fallback) => {
  const raw = process.env[name];
  if (!raw) return fallback;

  const values = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return values.length ? values : fallback;
};

const clientUrls = listFromEnv("CLIENT_URL", ["http://localhost:5173"]);

const config = {
  env: process.env.NODE_ENV || "development",
  port: numberFromEnv("PORT", 5001),
  clientUrl: clientUrls[0],
  clientUrls,
  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "dev-only-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  resumeMaxBytes: numberFromEnv("RESUME_MAX_BYTES", 5 * 1024 * 1024),
  resumeMaxChars: numberFromEnv("RESUME_MAX_CHARS", 12000),
  freeAnalysisLimit: numberFromEnv("FREE_ANALYSIS_LIMIT", 1),
  proDailyAnalysisLimit: numberFromEnv("PRO_DAILY_ANALYSIS_LIMIT", 10),
  useDemoAi: process.env.USE_DEMO_AI === "true",
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
    maxOutputTokens: numberFromEnv("ANTHROPIC_MAX_OUTPUT_TOKENS", 3200)
  },
  aws: {
    region: process.env.AWS_REGION || "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    bucket: process.env.AWS_S3_BUCKET || ""
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    priceId: process.env.STRIPE_PRICE_ID || "",
    successUrl:
      process.env.STRIPE_SUCCESS_URL ||
      `${clientUrls[0]}/dashboard?checkout=success`,
    cancelUrl:
      process.env.STRIPE_CANCEL_URL ||
      `${clientUrls[0]}/pricing?checkout=cancelled`
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || "",
    fromEmail: process.env.FROM_EMAIL || "no-reply@resumeroast.local"
  }
};

if (config.env === "production") {
  const required = ["MONGODB_URI", "JWT_SECRET", "CLIENT_URL", "ANTHROPIC_API_KEY"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Missing required production env vars: ${missing.join(", ")}`);
  }
}

module.exports = config;
