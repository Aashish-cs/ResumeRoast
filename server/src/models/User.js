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
      default: true
    },
    emailVerificationTokenHash: String,
    emailVerificationExpires: Date,
    passwordResetTokenHash: String,
    passwordResetExpires: Date,
    securityQuestion: {
      type: String,
      trim: true,
      required: true
    },
    securityAnswerHash: {
      type: String,
      required: true
    },
    hasUsedFreeAnalysis: {
      type: Boolean,
      default: false
    },
    freeAnalysesUsed: {
      type: Number,
      default: 0,
      min: 0
    },
    stripeCustomerId: {
      type: String,
      index: true,
      sparse: true
    },
    stripeSubscriptionId: String,
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
        "incomplete_expired",
        "paused"
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
    freeAnalysesUsed: this.freeAnalysesUsed || 0,
    hasStripeCustomer: Boolean(this.stripeCustomerId),
    subscriptionStatus: this.subscriptionStatus,
    subscriptionCurrentPeriodEnd: this.subscriptionCurrentPeriodEnd
  };
};

module.exports = mongoose.model("User", userSchema);
