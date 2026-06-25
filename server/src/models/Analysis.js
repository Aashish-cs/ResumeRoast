const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    originalFileName: {
      type: String,
      required: true
    },
    resumeS3Key: String,
    resumeTextHash: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    grade: {
      type: String,
      required: true
    },
    roast: {
      type: String,
      required: true
    },
    issues: {
      type: [String],
      default: []
    },
    rewrite: String,
    rewriteUnlocked: {
      type: Boolean,
      default: false
    },
    model: String,
    tokenUsage: {
      inputTokens: Number,
      outputTokens: Number
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Analysis", analysisSchema);
