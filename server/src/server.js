const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const config = require("./config/env");
const authRoutes = require("./routes/auth.routes");
const analysisRoutes = require("./routes/analysis.routes");
const billingRoutes = require("./routes/billing.routes");
const webhookRoutes = require("./routes/webhook.routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true
  })
);

app.use(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  webhookRoutes
);

app.use(express.json({ limit: "1mb" }));
app.use(morgan(config.env === "production" ? "combined" : "dev"));

app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "ResumeRoast API",
    demoAi: config.useDemoAi
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/analyses", analysisRoutes);
app.use("/api/billing", billingRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  if (!config.mongoUri) {
    throw new Error("MONGODB_URI is required. Copy .env.example to .env and fill it in.");
  }

  await mongoose.connect(config.mongoUri);
  app.listen(config.port, () => {
    console.log(`ResumeRoast API listening on http://localhost:${config.port}`);
  });
};

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
