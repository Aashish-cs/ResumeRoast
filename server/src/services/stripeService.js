const Stripe = require("stripe");
const config = require("../config/env");
const AppError = require("../utils/AppError");

let stripe;

const getStripe = () => {
  if (!config.stripe.secretKey) {
    throw new AppError("Stripe is not configured yet.", 503, "STRIPE_NOT_CONFIGURED");
  }

  if (!stripe) {
    stripe = new Stripe(config.stripe.secretKey);
  }

  return stripe;
};

const requireStripePrice = () => {
  if (!config.stripe.priceId) {
    throw new AppError("STRIPE_PRICE_ID is missing.", 503, "STRIPE_PRICE_MISSING");
  }
};

const isPaidStatus = (status) => ["active", "trialing"].includes(status);

module.exports = {
  getStripe,
  requireStripePrice,
  isPaidStatus
};
