const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationTokenHash: String,
    emailVerificationExpires: Date,
    passwordResetTokenHash: String,
    passwordResetExpires: Date,
    hasUsedFreeAnalysis: {
      type: Boolean,
      default: false
    },
    stripeCustomerId: String,
    subscriptionStatus: {
      type: String,
      enum: [
        "inactive",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "incomplete",
        "incomplete_expired"
      ],
      default: "inactive"
    },
    subscriptionCurrentPeriodEnd: Date
  },
  { timestamps: true }
);

userSchema.methods.isPaidSubscriber = function isPaidSubscriber() {
  return ["active", "trialing"].includes(this.subscriptionStatus);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    emailVerified: this.emailVerified,
    hasUsedFreeAnalysis: this.hasUsedFreeAnalysis,
    subscriptionStatus: this.subscriptionStatus,
    subscriptionCurrentPeriodEnd: this.subscriptionCurrentPeriodEnd
  };
};

module.exports = mongoose.model("User", userSchema);
