const config = require("../config/env");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendReceiptEmail } = require("../services/emailService");
const { getStripe, requireStripePrice } = require("../services/stripeService");

const getStripeId = (value) => (typeof value === "string" ? value : value?.id);

const stripTrailingSlash = (url) => url.replace(/\/+$/, "");

const getRequestClientUrl = (req) => {
  const origin = req.get("origin");

  if (origin && config.clientUrls.includes(origin)) {
    return stripTrailingSlash(origin);
  }

  return stripTrailingSlash(config.clientUrl);
};

const getPortalReturnUrl = (req) =>
  `${getRequestClientUrl(req)}/?billing=portal-return`;

const getOrCreateCustomer = async (user) => {
  const stripe = getStripe();

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: {
      userId: user._id.toString()
    }
  });

  user.stripeCustomerId = customer.id;
  await user.save();

  return customer.id;
};

const createPortalSession = async ({ req, stripeCustomerId }) => {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: getPortalReturnUrl(req)
  });
};

const getSubscriptionPeriodEnd = (subscription) => {
  const configuredItem = subscription.items?.data?.find(
    (item) => item.price?.id === config.stripe.priceId
  );
  const firstItem = subscription.items?.data?.[0];

  return (
    subscription.current_period_end ||
    configuredItem?.current_period_end ||
    firstItem?.current_period_end ||
    subscription.ended_at ||
    subscription.cancel_at ||
    null
  );
};

const dateFromStripeTimestamp = (timestamp) =>
  timestamp ? new Date(timestamp * 1000) : null;

const subscriptionIncludesConfiguredPrice = (subscription) => {
  if (!config.stripe.priceId) return true;

  return Boolean(
    subscription.items?.data?.some((item) => item.price?.id === config.stripe.priceId)
  );
};

const findUserForSubscription = async (subscription) => {
  const customerId = getStripeId(subscription.customer);
  const metadataUserId = subscription.metadata?.userId;

  if (customerId) {
    const user = await User.findOne({ stripeCustomerId: customerId });
    if (user) return user;
  }

  if (metadataUserId) {
    return User.findById(metadataUserId);
  }

  return null;
};

const createCheckoutSession = asyncHandler(async (req, res) => {
  requireStripePrice();

  if (req.user.isPaidSubscriber()) {
    if (!req.user.stripeCustomerId) {
      throw new AppError("This account is already Pro.", 409, "ALREADY_SUBSCRIBED");
    }

    const session = await createPortalSession({
      req,
      stripeCustomerId: req.user.stripeCustomerId
    });
    return res.json({ url: session.url, type: "portal" });
  }

  const stripe = getStripe();
  const customerId = await getOrCreateCustomer(req.user);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: req.user._id.toString(),
    line_items: [
      {
        price: config.stripe.priceId,
        quantity: 1
      }
    ],
    allow_promotion_codes: true,
    success_url: config.stripe.successUrl,
    cancel_url: config.stripe.cancelUrl,
    metadata: {
      userId: req.user._id.toString()
    },
    subscription_data: {
      metadata: {
        userId: req.user._id.toString()
      }
    }
  });

  res.json({ url: session.url });
});

const createBillingPortalSession = asyncHandler(async (req, res) => {
  if (!req.user.stripeCustomerId) {
    throw new AppError("No Stripe customer exists for this account yet.", 404, "NO_CUSTOMER");
  }

  const session = await createPortalSession({
    req,
    stripeCustomerId: req.user.stripeCustomerId
  });

  res.json({ url: session.url });
});

const syncSubscription = async (subscription) => {
  const user = await findUserForSubscription(subscription);
  const customerId = getStripeId(subscription.customer);
  const subscriptionId = getStripeId(subscription);

  if (!user || !customerId) return null;

  const periodEnd = getSubscriptionPeriodEnd(subscription);
  const subscriptionStatus = subscriptionIncludesConfiguredPrice(subscription)
    ? subscription.status || "inactive"
    : "inactive";

  user.stripeCustomerId = customerId;
  user.stripeSubscriptionId = subscriptionId || user.stripeSubscriptionId;
  user.subscriptionStatus = subscriptionStatus;
  user.subscriptionCurrentPeriodEnd = dateFromStripeTimestamp(periodEnd);
  user.subscriptionCancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);
  user.subscriptionCancelAt = dateFromStripeTimestamp(
    subscription.cancel_at || (subscription.cancel_at_period_end ? periodEnd : null)
  );
  user.subscriptionCanceledAt = dateFromStripeTimestamp(subscription.canceled_at);

  await user.save();
  return user;
};

const handleStripeWebhook = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  const signature = req.headers["stripe-signature"];
  let event;

  if (config.env === "production" && !config.stripe.webhookSecret) {
    throw new AppError(
      "STRIPE_WEBHOOK_SECRET is required for production billing webhooks.",
      503,
      "STRIPE_WEBHOOK_SECRET_MISSING"
    );
  }

  try {
    event = config.stripe.webhookSecret
      ? stripe.webhooks.constructEvent(req.body, signature, config.stripe.webhookSecret)
      : JSON.parse(req.body.toString());
  } catch (error) {
    throw new AppError(`Webhook signature failed: ${error.message}`, 400, "WEBHOOK_ERROR");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const customerId = getStripeId(session.customer);

    if (session.metadata?.userId && customerId) {
      await User.findByIdAndUpdate(session.metadata.userId, {
        $set: {
          stripeCustomerId: customerId
        }
      });
    }

    const subscriptionId = getStripeId(session.subscription);
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncSubscription(subscription);
    }
  }

  if (
    [
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted"
    ].includes(event.type)
  ) {
    await syncSubscription(event.data.object);
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;
    const customerId = getStripeId(invoice.customer);
    const user = await User.findOne({ stripeCustomerId: customerId });

    if (user) {
      await sendReceiptEmail({
        user,
        amountPaid: ((invoice.amount_paid || 0) / 100).toFixed(2),
        hostedInvoiceUrl: invoice.hosted_invoice_url
      });
    }
  }

  res.json({ received: true });
});

module.exports = {
  createCheckoutSession,
  createBillingPortalSession,
  handleStripeWebhook
};
