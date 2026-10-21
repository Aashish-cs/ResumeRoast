const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  _id: String,
  count: Number,
  expiresAt: Date,
});
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const Counter = mongoose.model("RateCounter", schema);
const asyncHandler = require("../utils/asyncHandler");
module.exports = (scope, limit, windowMs = 60000) =>
  asyncHandler(async (req, res, next) => {
    const window = Math.floor(Date.now() / windowMs);
    const key = `${scope}:${req.user.id}:${window}`;
    let counter;
    try {
      counter = await Counter.findOneAndUpdate(
        { _id: key },
        {
          $inc: { count: 1 },
          $setOnInsert: { expiresAt: new Date((window + 2) * windowMs) },
        },
        { upsert: true, new: true },
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
      counter = await Counter.findOneAndUpdate(
        { _id: key },
        { $inc: { count: 1 } },
        { new: true },
      );
    }
    if (counter.count > limit) {
      res.set(
        "Retry-After",
        String(Math.ceil(((window + 1) * windowMs - Date.now()) / 1000)),
      );
      return res
        .status(429)
        .json({
          message: "Too many requests. Please wait.",
          code: "RATE_LIMITED",
        });
    }
    next();
  });
