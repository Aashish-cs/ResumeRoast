const mongoose = require("mongoose");
module.exports = mongoose.model(
  "BillingEvent",
  new mongoose.Schema(
    { _id: String, user: mongoose.Schema.Types.ObjectId, type: String },
    { timestamps: true },
  ),
);
