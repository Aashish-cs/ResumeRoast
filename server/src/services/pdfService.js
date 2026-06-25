const crypto = require("crypto");
const pdfParse = require("pdf-parse");
const config = require("../config/env");
const AppError = require("../utils/AppError");

const extractTextFromPdf = async (buffer) => {
  const parsed = await pdfParse(buffer);
  const text = parsed.text.replace(/\s+\n/g, "\n").replace(/[ \t]+/g, " ").trim();

  if (!text || text.length < 80) {
    throw new AppError(
      "I could not extract enough text from that PDF. Try exporting a text-based PDF instead of a scan.",
      400,
      "PDF_TEXT_EXTRACTION_FAILED"
    );
  }

  return text.slice(0, config.resumeMaxChars);
};

const hashResumeText = (text) => crypto.createHash("sha256").update(text).digest("hex");

module.exports = {
  extractTextFromPdf,
  hashResumeText
};
