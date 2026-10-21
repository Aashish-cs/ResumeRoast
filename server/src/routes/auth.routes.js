const express = require("express");
const {
  signup,
  login,
  me,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    await require("../models/User").updateOne(
      { _id: req.user._id },
      { $inc: { sessionVersion: 1 } },
    );
    require("../middleware/auth").clearSession(res);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
router.post("/signup", signup);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
