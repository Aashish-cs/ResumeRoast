const { readResume } = require("./services/s3Service");
const { extractTextFromPdf, hashResumeText } = require("./services/pdfService");
const { analyzeResumeWithAi } = require("./services/aiService");
process.once("message", async ({ key }) => {
  try {
    const text = await extractTextFromPdf(await readResume(key));
    const result = await analyzeResumeWithAi({
      resumeText: text,
      includeRewrite: true,
    });
    process.send({
      ok: true,
      result: {
        score: result.score,
        grade: result.grade,
        roast: result.roast,
        issues: result.issues,
        rewrite: result.rewrite,
        model: result.model,
        tokenUsage: result.usage,
        resumeTextHash: hashResumeText(text),
        rewriteUnlocked: true,
      },
    });
  } catch (_) {
    process.send({ ok: false });
  }
});
