const { Document, Packer, Paragraph, TextRun } = require("docx");
const PDFDocument = require("pdfkit");
const Analysis = require("../models/Analysis");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { analyzeResumeWithClaude } = require("../services/anthropicService");
const { extractTextFromPdf, hashResumeText } = require("../services/pdfService");
const { uploadResumeToS3 } = require("../services/s3Service");

const serializeAnalysis = (analysis, canViewRewrite) => {
  const rewriteUnlocked = Boolean(canViewRewrite && analysis.rewriteUnlocked && analysis.rewrite);

  return {
    id: analysis._id.toString(),
    originalFileName: analysis.originalFileName,
    score: analysis.score,
    grade: analysis.grade,
    roast: analysis.roast,
    issues: analysis.issues,
    rewriteUnlocked,
    rewrite: rewriteUnlocked ? analysis.rewrite : undefined,
    model: analysis.model,
    createdAt: analysis.createdAt
  };
};

const claimFreeAnalysis = async (userId) => {
  const user = await User.findOneAndUpdate(
    { _id: userId, hasUsedFreeAnalysis: false },
    { $set: { hasUsedFreeAnalysis: true } },
    { new: true }
  );

  if (!user) {
    throw new AppError(
      "Your one free analysis is already used. Subscribe to unlock unlimited roasts and rewrites.",
      403,
      "FREE_ANALYSIS_USED"
    );
  }

  return user;
};

const releaseFreeAnalysis = async (userId) => {
  await User.updateOne({ _id: userId }, { $set: { hasUsedFreeAnalysis: false } });
};

const analyzeResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("Please upload a PDF resume.", 400, "RESUME_REQUIRED");
  }

  const isPaid = req.user.isPaidSubscriber();
  let freeSlotClaimed = false;

  if (!isPaid) {
    req.user = await claimFreeAnalysis(req.user._id);
    freeSlotClaimed = true;
  }

  try {
    const resumeText = await extractTextFromPdf(req.file.buffer);
    const resumeS3Key = await uploadResumeToS3({
      userId: req.user._id.toString(),
      file: req.file
    });

    const aiResult = await analyzeResumeWithClaude({
      resumeText,
      includeRewrite: isPaid
    });

    const analysis = await Analysis.create({
      user: req.user._id,
      originalFileName: req.file.originalname,
      resumeS3Key,
      resumeTextHash: hashResumeText(resumeText),
      score: aiResult.score,
      grade: aiResult.grade,
      roast: aiResult.roast,
      issues: aiResult.issues,
      rewrite: isPaid ? aiResult.rewrite : undefined,
      rewriteUnlocked: isPaid,
      model: "claude-sonnet-4-6",
      tokenUsage: {
        inputTokens: aiResult.usage?.inputTokens || 0,
        outputTokens: aiResult.usage?.outputTokens || 0
      }
    });

    res.status(201).json({
      analysis: serializeAnalysis(analysis, isPaid),
      user: req.user.toSafeJSON()
    });
  } catch (error) {
    if (freeSlotClaimed) {
      await releaseFreeAnalysis(req.user._id);
    }

    throw error;
  }
});

const listAnalyses = asyncHandler(async (req, res) => {
  const analyses = await Analysis.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(25);
  const canViewRewrite = req.user.isPaidSubscriber();

  res.json({
    analyses: analyses.map((analysis) => serializeAnalysis(analysis, canViewRewrite))
  });
});

const getAnalysis = asyncHandler(async (req, res) => {
  const analysis = await Analysis.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!analysis) {
    throw new AppError("Analysis not found.", 404, "ANALYSIS_NOT_FOUND");
  }

  res.json({
    analysis: serializeAnalysis(analysis, req.user.isPaidSubscriber())
  });
});

const requireDownloadableRewrite = async (req) => {
  if (!req.user.isPaidSubscriber()) {
    throw new AppError("An active subscription is required to download rewrites.", 403, "PAYWALL");
  }

  const analysis = await Analysis.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!analysis) {
    throw new AppError("Analysis not found.", 404, "ANALYSIS_NOT_FOUND");
  }

  if (!analysis.rewriteUnlocked || !analysis.rewrite) {
    throw new AppError(
      "This analysis does not have a rewrite. Re-run it after upgrading.",
      404,
      "REWRITE_NOT_AVAILABLE"
    );
  }

  return analysis;
};

const downloadRewritePdf = asyncHandler(async (req, res) => {
  const analysis = await requireDownloadableRewrite(req);
  const doc = new PDFDocument({ margin: 54 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="resumeroast-rewrite-${analysis._id}.pdf"`
  );

  doc.pipe(res);
  doc.fontSize(20).text("ResumeRoast Rewrite", { underline: true });
  doc.moveDown();
  doc.fontSize(11).text(analysis.rewrite, {
    lineGap: 4,
    align: "left"
  });
  doc.end();
});

const downloadRewriteDocx = asyncHandler(async (req, res) => {
  const analysis = await requireDownloadableRewrite(req);
  const children = analysis.rewrite.split(/\n+/).map(
    (line) =>
      new Paragraph({
        children: [new TextRun(line.trim() || " ")]
      })
  );
  const doc = new Document({
    sections: [
      {
        properties: {},
        children
      }
    ]
  });
  const buffer = await Packer.toBuffer(doc);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="resumeroast-rewrite-${analysis._id}.docx"`
  );
  res.send(buffer);
});

module.exports = {
  analyzeResume,
  listAnalyses,
  getAnalysis,
  downloadRewritePdf,
  downloadRewriteDocx
};
