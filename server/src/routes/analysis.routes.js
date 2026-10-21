const express = require("express");
const {
  analyzeResume,
  listAnalyses,
  getAnalysis,
  downloadRewritePdf,
  downloadRewriteDocx,
} = require("../controllers/analysisController");
const { requireAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.use(requireAuth);
router.get("/", listAnalyses);
router.post(
  "/",
  require("../middleware/accountLimit")("uploads", 5),
  upload.single("resume"),
  analyzeResume,
);
router.get("/:id", getAnalysis);
router.get(
  "/:id/download/pdf",
  require("../middleware/accountLimit")("downloads", 20),
  downloadRewritePdf,
);
router.get(
  "/:id/download/docx",
  require("../middleware/accountLimit")("downloads", 20),
  downloadRewriteDocx,
);

module.exports = router;
