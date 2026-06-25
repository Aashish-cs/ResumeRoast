const multer = require("multer");
const config = require("../config/env");
const AppError = require("../utils/AppError");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.resumeMaxBytes,
    files: 1
  },
  fileFilter: (req, file, callback) => {
    if (file.mimetype !== "application/pdf") {
      return callback(new AppError("Only PDF resumes are supported.", 400, "PDF_ONLY"));
    }

    callback(null, true);
  }
});

module.exports = upload;
