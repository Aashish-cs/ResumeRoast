const AppError = require("../utils/AppError");

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404, "NOT_FOUND"));
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Please check the submitted fields.",
      code: "VALIDATION_ERROR",
      details: err.message
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      message: "That email is already registered.",
      code: "DUPLICATE_EMAIL"
    });
  }

  const payload = {
    message: err.isOperational ? err.message : "Something went wrong.",
    code: err.code || "SERVER_ERROR"
  };

  if (err.retryAfterSeconds) {
    res.setHeader("Retry-After", String(err.retryAfterSeconds));
    payload.retryAfterSeconds = err.retryAfterSeconds;
  }

  if (process.env.NODE_ENV !== "production") {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};

module.exports = {
  notFound,
  errorHandler
};
