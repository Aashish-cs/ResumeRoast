const bcrypt = require("bcryptjs");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { signAuthToken } = require("../middleware/auth");

const normalizeSecurityAnswer = (answer) => {
  return String(answer || "").trim().toLowerCase();
};

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, securityQuestion, securityAnswer } = req.body;

  if (!name || !email || !password || !securityQuestion || !securityAnswer) {
    throw new AppError(
      "Name, email, password, security question, and security answer are required.",
      400,
      "MISSING_FIELDS"
    );
  }

  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters.", 400, "WEAK_PASSWORD");
  }

  if (normalizeSecurityAnswer(securityAnswer).length < 2) {
    throw new AppError("Security answer must be at least 2 characters.", 400, "WEAK_ANSWER");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    throw new AppError("That email is already registered.", 409, "DUPLICATE_EMAIL");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const securityAnswerHash = await bcrypt.hash(normalizeSecurityAnswer(securityAnswer), 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
    emailVerified: true,
    securityQuestion,
    securityAnswerHash
  });

  res.status(201).json({
    message: "Account created. You can log in now.",
    token: signAuthToken(user),
    user: user.toSafeJSON()
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required.", 400, "MISSING_FIELDS");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !passwordMatches) {
    throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
  }

  res.json({
    token: signAuthToken(user),
    user: user.toSafeJSON()
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email is required.", 400, "EMAIL_REQUIRED");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user || !user.securityQuestion) {
    return res.json({
      message: "If that account exists, its security question will appear."
    });
  }

  res.json({
    message: "Answer your security question to reset your password.",
    email: user.email,
    securityQuestion: user.securityQuestion
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, securityAnswer, password } = req.body;

  if (!email || !securityAnswer || !password) {
    throw new AppError(
      "Email, security answer, and new password are required.",
      400,
      "MISSING_FIELDS"
    );
  }

  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters.", 400, "WEAK_PASSWORD");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user || !user.securityAnswerHash) {
    throw new AppError("Security answer is incorrect.", 400, "INVALID_SECURITY_ANSWER");
  }

  const answerMatches = await bcrypt.compare(
    normalizeSecurityAnswer(securityAnswer),
    user.securityAnswerHash
  );

  if (!answerMatches) {
    throw new AppError("Security answer is incorrect.", 400, "INVALID_SECURITY_ANSWER");
  }

  user.passwordHash = await bcrypt.hash(password, 12);
  await user.save();

  res.json({
    message: "Password reset. You can log in now."
  });
});

module.exports = {
  signup,
  login,
  me,
  forgotPassword,
  resetPassword
};
