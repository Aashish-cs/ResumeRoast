const jwt = require("jsonwebtoken");
const config = require("../config/env");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const cookieOptions = {
  httpOnly: true,
  secure: config.env === "production",
  sameSite: "lax",
  path: "/api",
};
const signAuthToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), version: user.sessionVersion || 0 },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn, algorithm: "HS256" },
  );
const setSession = (res, user) =>
  res.cookie("rr_session", signAuthToken(user), cookieOptions);
const clearSession = (res) => res.clearCookie("rr_session", cookieOptions);
const requireAuth = asyncHandler(async (req, res, next) => {
  const token = (req.headers.cookie || "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("rr_session="))
    ?.slice(11);
  let payload;
  try {
    payload = jwt.verify(token || "", config.jwtSecret, {
      algorithms: ["HS256"],
    });
  } catch (_) {
    throw new AppError("Please log in again.", 401, "UNAUTHENTICATED");
  }
  const user = await User.findById(payload.sub);
  if (!user || payload.version !== (user.sessionVersion || 0))
    throw new AppError("Session expired.", 401, "INVALID_TOKEN");
  req.user = user;
  next();
});
const requireRole =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user?.role || "user")
      ? next()
      : next(new AppError("Access denied.", 403, "FORBIDDEN"));
// Credentialed cross-site cookies require a strict Origin check on every mutation.
const protectOrigin = (req, res, next) => {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    !config.clientUrls.includes(req.headers.origin)
  )
    return next(
      new AppError("Untrusted request origin.", 403, "INVALID_ORIGIN"),
    );
  next();
};
module.exports = {
  requireAuth,
  requireRole,
  protectOrigin,
  signAuthToken,
  setSession,
  clearSession,
};
