const { AlignmentType, Document, Packer, Paragraph, TextRun } = require("docx");
const PDFDocument = require("pdfkit");
const Analysis = require("../models/Analysis");
const User = require("../models/User");
const config = require("../config/env");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { uploadResumeToS3 } = require("../services/s3Service");

const REWRITE_SECTION_HEADINGS = new Set([
  "Summary",
  "Education",
  "Technical Skills",
  "Projects",
  "Experience",
  "Leadership & Awards",
  "Resume Highlights",
  "Extracted Resume Text",
  "Awards",
  "Certifications",
]);

const serializeAnalysis = (analysis, canViewRewrite) => {
  const rewriteUnlocked = Boolean(
    canViewRewrite && analysis.rewriteUnlocked && analysis.rewrite,
  );

  return {
    id: analysis._id.toString(),
    originalFileName: analysis.originalFileName,
    status: analysis.status,
    error: analysis.error,
    score: analysis.score,
    grade: analysis.grade,
    roast: analysis.roast,
    issues: analysis.issues,
    rewriteUnlocked,
    rewrite: rewriteUnlocked ? analysis.rewrite : undefined,
    model: analysis.model,
    createdAt: analysis.createdAt,
  };
};

const analyzeResume = asyncHandler(async (req, res) => {
  if (!req.file || req.file.buffer.subarray(0, 5).toString() !== "%PDF-") {
    throw new AppError(
      "Please upload a valid PDF resume.",
      400,
      "RESUME_REQUIRED",
    );
  }
  const key = await uploadResumeToS3({ userId: req.user.id, file: req.file });
  let analysis;
  const session = await User.startSession();
  try {
    await session.withTransaction(async () => {
      // Serialize quota admission across API replicas using a write conflict on the user.
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $inc: { usageVersion: 1 } },
        { new: true, session },
      );
      const paid = user.isPaidSubscriber();
      const quotaKey = paid ? new Date().toISOString().slice(0, 10) : "free";
      const filter = { user: user._id, status: { $ne: "failed" } };
      if (paid) filter.createdAt = { $gte: new Date(`${quotaKey}T00:00:00Z`) };
      const used = await Analysis.countDocuments(filter).session(session);
      const limit = paid
        ? config.proDailyAnalysisLimit
        : config.freeAnalysisLimit;
      if (used >= limit)
        throw new AppError(
          "Analysis allowance used. Upgrade or try again tomorrow.",
          403,
          paid ? "PRO_ANALYSIS_LIMIT" : "FREE_ANALYSIS_USED",
        );
      [analysis] = await Analysis.create(
        [
          {
            user: user._id,
            originalFileName: req.file.originalname,
            resumeS3Key: key,
            status: "queued",
            quotaKey,
          },
        ],
        { session },
      );
      if (!paid)
        await User.updateOne(
          { _id: user._id },
          { $set: { hasUsedFreeAnalysis: true, freeAnalysesUsed: used + 1 } },
          { session },
        );
    });
  } catch (error) {
    await require("../services/s3Service")
      .deleteResume(key)
      .catch(() => {});
    throw error;
  } finally {
    await session.endSession();
  }
  res.status(202).json({ analysis: serializeAnalysis(analysis, true) });
});

const listAnalyses = asyncHandler(async (req, res) => {
  const analyses = await Analysis.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(25);

  res.json({
    analyses: analyses.map((analysis) => serializeAnalysis(analysis, true)),
  });
});

const getAnalysis = asyncHandler(async (req, res) => {
  const analysis = await Analysis.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!analysis) {
    throw new AppError("Analysis not found.", 404, "ANALYSIS_NOT_FOUND");
  }

  res.json({
    analysis: serializeAnalysis(analysis, true),
  });
});

const requireDownloadableRewrite = async (req) => {
  const analysis = await Analysis.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!analysis) {
    throw new AppError("Analysis not found.", 404, "ANALYSIS_NOT_FOUND");
  }

  if (!analysis.rewriteUnlocked || !analysis.rewrite) {
    throw new AppError(
      "This analysis does not have a rewrite. Re-run it after upgrading.",
      404,
      "REWRITE_NOT_AVAILABLE",
    );
  }

  return analysis;
};

const getRewriteLines = (rewrite) =>
  rewrite.split(/\r?\n/).map((line) => line.trim());

const getContentIndexes = (lines) =>
  lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line)
    .map(({ index }) => index);

const renderRewritePdf = (doc, rewrite) => {
  const lines = getRewriteLines(rewrite);
  const contentIndexes = getContentIndexes(lines);
  const firstContentIndex = contentIndexes[0];
  const secondContentIndex = contentIndexes[1];

  lines.forEach((line, index) => {
    if (!line) {
      doc.moveDown(0.45);
      return;
    }

    if (index === firstContentIndex) {
      doc
        .font("Times-Bold")
        .fontSize(20)
        .fillColor("#18181b")
        .text(line, { align: "center" });
      return;
    }

    if (index === secondContentIndex) {
      doc
        .font("Times-Roman")
        .fontSize(10)
        .fillColor("#3f3f46")
        .text(line, { align: "center", lineGap: 2 });
      return;
    }

    if (REWRITE_SECTION_HEADINGS.has(line)) {
      doc.moveDown(0.55);
      doc.font("Times-Bold").fontSize(13).fillColor("#18181b").text(line);
      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor("#18181b")
        .lineWidth(0.4)
        .stroke();
      doc.moveDown(0.25);
      return;
    }

    if (line.startsWith("- ")) {
      doc
        .font("Times-Roman")
        .fontSize(10.5)
        .fillColor("#27272a")
        .text(`- ${line.slice(2)}`, {
          indent: 14,
          hangingIndent: 8,
          lineGap: 2,
        });
      return;
    }

    const labelMatch = line.match(/^([^:]{2,32}):\s*(.*)$/);

    if (labelMatch) {
      doc
        .font("Times-Bold")
        .fontSize(10.5)
        .fillColor("#18181b")
        .text(`${labelMatch[1]}:`, { continued: true });
      doc.font("Times-Roman").fillColor("#27272a").text(` ${labelMatch[2]}`, {
        lineGap: 2,
      });
      return;
    }

    doc.font("Times-Roman").fontSize(10.5).fillColor("#27272a").text(line, {
      lineGap: 2,
    });
  });
};

const buildRewriteDocxChildren = (rewrite) => {
  const lines = getRewriteLines(rewrite);
  const contentIndexes = getContentIndexes(lines);
  const firstContentIndex = contentIndexes[0];
  const secondContentIndex = contentIndexes[1];

  return lines.map((line, index) => {
    if (!line) {
      return new Paragraph({ text: "" });
    }

    if (index === firstContentIndex) {
      return new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: line, bold: true, size: 32 })],
      });
    }

    if (index === secondContentIndex) {
      return new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: line, size: 20 })],
      });
    }

    if (REWRITE_SECTION_HEADINGS.has(line)) {
      return new Paragraph({
        spacing: { before: 220, after: 80 },
        children: [new TextRun({ text: line, bold: true, size: 26 })],
      });
    }

    return new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun(line)],
    });
  });
};

const downloadRewritePdf = asyncHandler(async (req, res) => {
  const analysis = await requireDownloadableRewrite(req);
  const doc = new PDFDocument({ margin: 54 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="resumeroast-rewrite-${analysis._id}.pdf"`,
  );

  doc.pipe(res);
  renderRewritePdf(doc, analysis.rewrite);
  doc.end();
});

const downloadRewriteDocx = asyncHandler(async (req, res) => {
  const analysis = await requireDownloadableRewrite(req);
  const children = buildRewriteDocxChildren(analysis.rewrite);
  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="resumeroast-rewrite-${analysis._id}.docx"`,
  );
  res.send(buffer);
});

module.exports = {
  analyzeResume,
  listAnalyses,
  getAnalysis,
  downloadRewritePdf,
  downloadRewriteDocx,
};
