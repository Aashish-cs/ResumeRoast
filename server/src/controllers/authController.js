const bcrypt = require("bcryptjs");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { createPlainToken, hashToken } = require("../utils/securityTokens");
const {
  sendVerificationEmail,
  sendPasswordResetEmail
} = require("../services/emailService");
const { signAuthToken } = require("../middleware/auth");

const createVerificationFields = () => {
  const token = createPlainToken();

  return {
    token,
    tokenHash: hashToken(token),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
  };
};

const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new AppError("Name, email, and password are required.", 400, "MISSING_FIELDS");
  }

  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters.", 400, "WEAK_PASSWORD");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    throw new AppError("That email is already registered.", 409, "DUPLICATE_EMAIL");
  }

  const verification = createVerificationFields();
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
    emailVerificationTokenHash: verification.tokenHash,
    emailVerificationExpires: verification.expires
  });

  const emailMeta = await sendVerificationEmail({ user, token: verification.token });

  res.status(201).json({
    message: "Account created. Please verify your email before analyzing a resume.",
    devVerificationUrl: emailMeta.verificationUrl
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

  if (!user.emailVerified) {
    throw new AppError("Please verify your email before logging in.", 403, "EMAIL_NOT_VERIFIED");
  }

  res.json({
    token: signAuthToken(user),
    user: user.toSafeJSON()
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const token = req.body.token || req.query.token;

  if (!token) {
    throw new AppError("Verification token is required.", 400, "TOKEN_REQUIRED");
  }

  const user = await User.findOne({
    emailVerificationTokenHash: hashToken(token),
    emailVerificationExpires: { $gt: new Date() }
  });

  if (!user) {
    throw new AppError("Verification link is invalid or expired.", 400, "INVALID_TOKEN");
  }

  user.emailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.json({
    message: "Email verified. You can log in now."
  });
});

const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email is required.", 400, "EMAIL_REQUIRED");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user || user.emailVerified) {
    return res.json({
      message: "If that account needs verification, a new email has been sent."
    });
  }

  const verification = createVerificationFields();
  user.emailVerificationTokenHash = verification.tokenHash;
  user.emailVerificationExpires = verification.expires;
  await user.save();

  const emailMeta = await sendVerificationEmail({ user, token: verification.token });

  res.json({
    message: "If that account needs verification, a new email has been sent.",
    devVerificationUrl: emailMeta.verificationUrl
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email is required.", 400, "EMAIL_REQUIRED");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    return res.json({
      message: "If that email exists, a reset link has been sent."
    });
  }

  const token = createPlainToken();
  user.passwordResetTokenHash = hashToken(token);
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const emailMeta = await sendPasswordResetEmail({ user, token });

  res.json({
    message: "If that email exists, a reset link has been sent.",
    devResetUrl: emailMeta.resetUrl
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw new AppError("Token and new password are required.", 400, "MISSING_FIELDS");
  }

  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters.", 400, "WEAK_PASSWORD");
  }

  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpires: { $gt: new Date() }
  });

  if (!user) {
    throw new AppError("Reset link is invalid or expired.", 400, "INVALID_TOKEN");
  }

  user.passwordHash = await bcrypt.hash(password, 12);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({
    message: "Password reset. You can log in now."
  });
});

module.exports = {
  signup,
  login,
  me,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword
};
