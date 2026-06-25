const express = require("express");
const {
  signup,
  login,
  me,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword
} = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
