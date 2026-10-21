const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "completed",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    leaseToken: String,
    leaseUntil: Date,
    error: String,
    quotaKey: String,
    originalFileName: {
      type: String,
      required: true,
    },
    resumeS3Key: String,
    resumeTextHash: {
      type: String,
      required: false,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      required: false,
    },
    grade: {
      type: String,
      required: false,
    },
    roast: {
      type: String,
      required: false,
    },
    issues: {
      type: [String],
      default: [],
    },
    rewrite: String,
    rewriteUnlocked: {
      type: Boolean,
      default: false,
    },
    model: String,
    tokenUsage: {
      inputTokens: Number,
      outputTokens: Number,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Analysis", analysisSchema);
