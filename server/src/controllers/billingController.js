const config = require("../config/env");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendReceiptEmail } = require("../services/emailService");
const { getStripe, requireStripePrice } = require("../services/stripeService");

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

const createCheckoutSession = asyncHandler(async (req, res) => {
  requireStripePrice();
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

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: req.user.stripeCustomerId,
    return_url: `${config.clientUrl}/dashboard`
  });

  res.json({ url: session.url });
});

const syncSubscription = async (subscription) => {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (!customerId) return null;

  return User.findOneAndUpdate(
    { stripeCustomerId: customerId },
    {
      $set: {
        subscriptionStatus: subscription.status || "inactive",
        subscriptionCurrentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : undefined
      }
    },
    { new: true }
  );
};

const handleStripeWebhook = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = config.stripe.webhookSecret
      ? stripe.webhooks.constructEvent(req.body, signature, config.stripe.webhookSecret)
      : JSON.parse(req.body.toString());
  } catch (error) {
    throw new AppError(`Webhook signature failed: ${error.message}`, 400, "WEBHOOK_ERROR");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    if (session.metadata?.userId && session.customer) {
      await User.findByIdAndUpdate(session.metadata.userId, {
        $set: {
          stripeCustomerId:
            typeof session.customer === "string" ? session.customer : session.customer.id
        }
      });
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
    const customerId =
      typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
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
