const jwt = require("jsonwebtoken");
const config = require("../config/env");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const signAuthToken = (user) =>
  jwt.sign({ sub: user._id.toString() }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });

const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    throw new AppError("Please log in first.", 401, "UNAUTHENTICATED");
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch (error) {
    throw new AppError("Your session expired. Please log in again.", 401, "INVALID_TOKEN");
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new AppError("User not found.", 401, "INVALID_TOKEN");
  }

  req.user = user;
  next();
});

module.exports = {
  requireAuth,
  signAuthToken
};
