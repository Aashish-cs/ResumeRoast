const { randomUUID } = require("crypto");
const config = require("../config/env");
const User = require("../models/User");
const BillingEvent = require("../models/BillingEvent");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const withBillingLock = require("../services/billingLock");
const { getStripe, requireStripePrice } = require("../services/stripeService");
const id = (value) => (typeof value === "string" ? value : value?.id);
const date = (value) => (value ? new Date(value * 1000) : null);
const validSubscription = (sub) =>
  sub.items?.data?.some(
    (item) => item.price?.id === config.stripe.priceId && item.quantity === 1,
  );
async function currentSubscription(stripe, customer) {
  const subscriptions = [];
  for await (const sub of stripe.subscriptions.list({
    customer,
    status: "all",
    limit: 100,
  })) {
    if (validSubscription(sub)) subscriptions.push(sub);
  }
  return subscriptions.sort(
    (a, b) =>
      Number(["active", "trialing"].includes(b.status)) -
        Number(["active", "trialing"].includes(a.status)) ||
      b.created - a.created,
  )[0];
}
const createCheckoutSession = asyncHandler(async (req, res) => {
  requireStripePrice();
  const stripe = getStripe();
  const result = await withBillingLock(req.user._id, async (user, save) => {
    let customer = user.stripeCustomerId;
    if (!customer) {
      customer = (
        await stripe.customers.create(
          { email: user.email, name: user.name, metadata: { userId: user.id } },
          { idempotencyKey: `customer:${user.id}` },
        )
      ).id;
      await save({ $set: { stripeCustomerId: customer } });
    }
    const existing = await currentSubscription(stripe, customer);
    if (
      existing &&
      ["active", "trialing", "past_due", "unpaid"].includes(existing.status)
    ) {
      const portal = await stripe.billingPortal.sessions.create({
        customer,
        return_url: config.clientUrl + "/dashboard",
      });
      return { url: portal.url, type: "portal" };
    }
    if (user.checkoutSessionId) {
      const session = await stripe.checkout.sessions.retrieve(
        user.checkoutSessionId,
      );
      if (session.status === "open") return { url: session.url };
      if (session.status === "complete" && session.payment_status === "unpaid")
        throw new AppError(
          "Your payment is still pending.",
          409,
          "PAYMENT_PENDING",
        );
    }
    let attempt = user.checkoutAttempt;
    if (!attempt || user.checkoutSessionId) {
      attempt = randomUUID();
      await save({
        $set: { checkoutAttempt: attempt },
        $unset: { checkoutSessionId: 1 },
      });
    }
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer,
        client_reference_id: user.id,
        line_items: [{ price: config.stripe.priceId, quantity: 1 }],
        success_url: config.stripe.successUrl,
        cancel_url: config.stripe.cancelUrl,
        metadata: { userId: user.id },
        subscription_data: { metadata: { userId: user.id } },
      },
      { idempotencyKey: `checkout:${user.id}:${attempt}` },
    );
    await save({ $set: { checkoutSessionId: session.id } });
    return { url: session.url };
  });
  res.json(result);
});
const createBillingPortalSession = asyncHandler(async (req, res) => {
  if (!req.user.stripeCustomerId)
    throw new AppError("No billing account yet.", 404, "NO_CUSTOMER");
  const session = await getStripe().billingPortal.sessions.create({
    customer: req.user.stripeCustomerId,
    return_url: config.clientUrl + "/dashboard",
  });
  res.json({ url: session.url });
});
const supported = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
]);
const handleStripeWebhook = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  if (!config.stripe.webhookSecret)
    throw new AppError(
      "Webhook signing secret required.",
      503,
      "WEBHOOK_NOT_CONFIGURED",
    );
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      config.stripe.webhookSecret,
    );
  } catch (_) {
    throw new AppError("Invalid webhook signature.", 400, "WEBHOOK_ERROR");
  }
  if (!supported.has(event.type)) return res.json({ received: true });
  if (event.livemode !== config.stripe.secretKey.startsWith("sk_live_"))
    throw new AppError("Payment mode mismatch.", 400, "PAYMENT_MODE_MISMATCH");
  if (await BillingEvent.exists({ _id: event.id }))
    return res.json({ received: true, duplicate: true });
  const object = event.data.object;
  const customer = id(object.customer);
  const user = await User.findOne({ stripeCustomerId: customer });
  if (!user)
    throw new AppError(
      "Customer is not linked yet. Retry delivery.",
      503,
      "CUSTOMER_UNLINKED",
    );
  await withBillingLock(user._id, async (lockedUser, save) => {
    if (await BillingEvent.exists({ _id: event.id })) return;
    if (event.type.startsWith("checkout.session.")) {
      const checkout = await stripe.checkout.sessions.retrieve(object.id);
      if (
        checkout.mode !== "subscription" ||
        id(checkout.customer) !== customer ||
        checkout.client_reference_id !== user.id ||
        checkout.metadata?.userId !== user.id
      )
        throw new AppError(
          "Checkout ownership mismatch.",
          400,
          "INVALID_CHECKOUT",
        );
    }
    // Refetch under the customer lock: delivery order cannot restore stale access.
    const sub = await currentSubscription(stripe, customer);
    if (
      sub &&
      (id(sub.customer) !== customer ||
        (sub.metadata?.userId && sub.metadata.userId !== user.id))
    )
      throw new AppError(
        "Subscription ownership mismatch.",
        400,
        "INVALID_SUBSCRIPTION",
      );
    const end =
      sub?.current_period_end || sub?.items?.data?.[0]?.current_period_end;
    const session = await User.startSession();
    try {
      await session.withTransaction(async () => {
        await save(
          {
            $set: {
              stripeSubscriptionId: sub?.id || null,
              subscriptionStatus: sub?.status || "inactive",
              subscriptionCurrentPeriodEnd: date(end),
              subscriptionCancelAtPeriodEnd: Boolean(sub?.cancel_at_period_end),
              subscriptionCancelAt: date(sub?.cancel_at),
              subscriptionCanceledAt: date(sub?.canceled_at),
            },
          },
          { session },
        );
        await BillingEvent.create(
          [{ _id: event.id, user: user._id, type: event.type }],
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
  });
  res.json({ received: true });
});
module.exports = {
  createCheckoutSession,
  createBillingPortalSession,
  handleStripeWebhook,
  validSubscription,
};
