const express = require("express");
const {
  analyzeResume,
  listAnalyses,
  getAnalysis,
  downloadRewritePdf,
  downloadRewriteDocx
} = require("../controllers/analysisController");
const { requireAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.use(requireAuth);
router.get("/", listAnalyses);
router.post("/", upload.single("resume"), analyzeResume);
router.get("/:id", getAnalysis);
router.get("/:id/download/pdf", downloadRewritePdf);
router.get("/:id/download/docx", downloadRewriteDocx);

module.exports = router;
