process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "integration-test-secret-only";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.STRIPE_SECRET_KEY = "sk_test_fake";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
process.env.STRIPE_PRICE_ID = "price_pro";
process.env.PRO_DAILY_ANALYSIS_LIMIT = "2";
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("supertest");
const Stripe = require("stripe");
const { EventEmitter } = require("events");
const childProcess = require("child_process");
let childMode = "success";
childProcess.fork = () => {
  const child = new EventEmitter();
  child.kill = () => {};
  child.send = () =>
    setTimeout(
      () =>
        child.emit("message", {
          ok: childMode === "success",
          result: {
            score: 75,
            grade: "B",
            roast: "Test roast",
            issues: [],
            rewrite: "Test rewrite",
            rewriteUnlocked: true,
          },
        }),
      25,
    );
  return child;
};
let uploadCalls = 0;
const storage = require("../src/services/s3Service");
storage.uploadResumeToS3 = async () => `test/${++uploadCalls}`;
storage.deleteResume = async () => {};
const subscription = {
  id: "sub_test",
  customer: "cus_test",
  status: "active",
  created: 100,
  metadata: {},
  items: { data: [{ price: { id: "price_pro" }, quantity: 1 }] },
};
const realStripe = new Stripe("sk_test_fake");
let checkoutCreates = 0;
const fakeStripe = {
  webhooks: realStripe.webhooks,
  subscriptions: {
    list: () => ({
      async *[Symbol.asyncIterator]() {
        yield subscription;
      },
    }),
  },
  checkout: {
    sessions: {
      retrieve: async () => ({
        id: "cs_test",
        mode: "subscription",
        customer: "cus_test",
        client_reference_id: billingUser.id,
        metadata: { userId: billingUser.id },
        status: "open",
        url: "https://checkout.stripe.test/session",
      }),
      create: async () => {
        checkoutCreates++;
        return { id: "cs_test", url: "https://checkout.stripe.test/session" };
      },
    },
  },
  customers: { create: async () => ({ id: "cus_test" }) },
  billingPortal: {
    sessions: { create: async () => ({ url: "https://billing.stripe.test" }) },
  },
};
require("../src/services/stripeService").getStripe = () => fakeStripe;
const { app } = require("../src/server");
const User = require("../src/models/User");
const Analysis = require("../src/models/Analysis");
const BillingEvent = require("../src/models/BillingEvent");
const { signAuthToken } = require("../src/middleware/auth");
const { runOne } = require("../src/worker");
const origin = "http://localhost:5173";
const cookie = (user) => `rr_session=${signAuthToken(user)}`;
let billingUser;
async function makeUser(extra = {}) {
  return User.create({
    name: "Test",
    email: `${new mongoose.Types.ObjectId()}@example.test`,
    passwordHash: "unused",
    securityQuestion: "Question",
    securityAnswerHash: "unused",
    ...extra,
  });
}
async function upload(user) {
  return request(app)
    .post("/api/analyses")
    .set("Origin", origin)
    .set("Cookie", cookie(user))
    .attach(
      "resume",
      Buffer.from("%PDF-1.4\nFake fixture; parser is tested separately."),
      { filename: "resume.pdf", contentType: "application/pdf" },
    );
}
function webhook(event, signature = true) {
  const payload = JSON.stringify({ livemode: false, ...event });
  return request(app)
    .post("/api/billing/webhook")
    .set("Content-Type", "application/json")
    .set(
      "stripe-signature",
      signature
        ? realStripe.webhooks.generateTestHeaderString({
            payload,
            secret: "whsec_test",
          })
        : "invalid",
    )
    .send(payload);
}
before(async () => {
  const uri = process.env.TEST_MONGODB_URI;
  if (!uri || !/127\.0\.0\.1|localhost/.test(uri))
    throw new Error(
      "TEST_MONGODB_URI must point to an isolated local replica set",
    );
  await mongoose.connect(uri, { dbName: `rr_test_${process.pid}` });
  await Promise.all([User.init(), Analysis.init(), BillingEvent.init()]);
  billingUser = await makeUser({ stripeCustomerId: "cus_test" });
});
after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
test("signup uses HttpOnly cookies without exposing JWT; logout revokes session", async () => {
  const result = await request(app)
    .post("/api/auth/signup")
    .set("Origin", origin)
    .send({
      name: "Cookie",
      email: "cookie@example.test",
      password: "StrongPass123",
      securityQuestion: "Question",
      securityAnswer: "Answer",
    });
  assert.equal(result.status, 201);
  assert.equal(result.body.token, undefined);
  assert.match(result.headers["set-cookie"][0], /HttpOnly/);
  const session = result.headers["set-cookie"][0].split(";")[0];
  assert.equal(
    (await request(app).get("/api/auth/me").set("Cookie", session)).status,
    200,
  );
  assert.equal(
    (
      await request(app)
        .post("/api/auth/logout")
        .set("Origin", origin)
        .set("Cookie", session)
    ).status,
    200,
  );
  assert.equal(
    (await request(app).get("/api/auth/me").set("Cookie", session)).status,
    401,
  );
});
test("cross-origin mutations and forged tokens are rejected", async () => {
  assert.equal(
    (
      await request(app)
        .post("/api/auth/login")
        .set("Origin", "https://evil.test")
        .send({})
    ).status,
    403,
  );
  assert.equal(
    (await request(app).get("/api/auth/me").set("Cookie", "rr_session=forged"))
      .status,
    401,
  );
});
test("RBAC protects queue metrics", async () => {
  const user = await makeUser();
  assert.equal(
    (await request(app).get("/api/admin/queue").set("Cookie", cookie(user)))
      .status,
    403,
  );
  user.role = "admin";
  await user.save();
  assert.equal(
    (await request(app).get("/api/admin/queue").set("Cookie", cookie(user)))
      .status,
    200,
  );
});
test("concurrent free submissions reserve exactly one slot and return 202", async () => {
  const user = await makeUser();
  const results = await Promise.all(
    Array.from({ length: 3 }, () => upload(user)),
  );
  assert.deepEqual(results.map((x) => x.status).sort(), [202, 403, 403]);
  assert.equal(await Analysis.countDocuments({ user: user._id }), 1);
  const job = results.find((x) => x.status === 202).body.analysis;
  assert.equal(job.status, "queued");
  const stranger = await makeUser();
  assert.equal(
    (
      await request(app)
        .get(`/api/analyses/${job.id}`)
        .set("Cookie", cookie(stranger))
    ).status,
    404,
  );
});
test("paid daily quota is atomic across concurrent submissions", async () => {
  const user = await makeUser({ subscriptionStatus: "active" });
  const results = await Promise.all(
    Array.from({ length: 3 }, () => upload(user)),
  );
  assert.deepEqual(results.map((x) => x.status).sort(), [202, 202, 403]);
});
test("account upload throttling returns 429", async () => {
  const user = await makeUser();
  for (let i = 0; i < 5; i++) await upload(user);
  const result = await upload(user);
  assert.equal(result.status, 429);
  assert.ok(result.headers["retry-after"]);
});
test("multiple workers claim distinct jobs and save results", async () => {
  await Analysis.updateMany({}, { $set: { status: "completed" } });
  const user = await makeUser();
  await Analysis.create(
    [1, 2].map((i) => ({
      user: user._id,
      originalFileName: `${i}.pdf`,
      resumeS3Key: `test/${i}`,
      status: "queued",
    })),
  );
  await Promise.all([runOne(), runOne()]);
  assert.equal(
    await Analysis.countDocuments({
      user: user._id,
      status: "completed",
      score: 75,
    }),
    2,
  );
});
test("expired leases recover and exhausted retries become failed", async () => {
  const user = await makeUser();
  const job = await Analysis.create({
    user: user._id,
    originalFileName: "retry.pdf",
    resumeS3Key: "key",
    status: "processing",
    attempts: 1,
    leaseUntil: new Date(0),
  });
  await runOne();
  assert.equal((await Analysis.findById(job.id)).status, "completed");
  await Analysis.updateOne(
    { _id: job.id },
    { $set: { status: "processing", attempts: 3, leaseUntil: new Date(0) } },
  );
  await runOne();
  assert.equal((await Analysis.findById(job.id)).status, "failed");
});
test("failed processing is retried at most three times", async () => {
  const user = await makeUser();
  const job = await Analysis.create({
    user: user._id,
    originalFileName: "bad.pdf",
    resumeS3Key: "bad",
    status: "queued",
  });
  childMode = "failure";
  await runOne();
  await runOne();
  await runOne();
  childMode = "success";
  assert.equal((await Analysis.findById(job.id)).status, "failed");
});
test("forged Stripe signatures fail closed", async () => {
  assert.equal(
    (
      await webhook(
        {
          id: "evt_invalid",
          type: "customer.subscription.updated",
          data: { object: subscription },
        },
        false,
      )
    ).status,
    400,
  );
});
test("duplicate and out-of-order Stripe events converge to current subscription", async () => {
  subscription.status = "canceled";
  const stale = {
    id: "evt_stale",
    type: "customer.subscription.updated",
    data: { object: { ...subscription, status: "active" } },
  };
  assert.equal((await webhook(stale)).status, 200);
  assert.equal(
    (await User.findById(billingUser.id)).subscriptionStatus,
    "canceled",
  );
  assert.equal((await webhook(stale)).body.duplicate, true);
  assert.equal(await BillingEvent.countDocuments({ _id: stale.id }), 1);
});
test("concurrent webhook deliveries can retry and preserve one event record each", async () => {
  subscription.status = "active";
  const events = Array.from({ length: 12 }, (_, i) => ({
    id: `evt_parallel_${i}`,
    type: "customer.subscription.updated",
    data: { object: subscription },
  }));
  const results = await Promise.all(events.map((event) => webhook(event)));
  for (let i = 0; i < results.length; i++) {
    assert.ok([200, 503].includes(results[i].status));
    if (results[i].status === 503)
      assert.equal((await webhook(events[i])).status, 200);
  }
  assert.equal(
    await BillingEvent.countDocuments({ _id: /^evt_parallel_/ }),
    12,
  );
  assert.equal(
    (await User.findById(billingUser.id)).subscriptionStatus,
    "active",
  );
});
test("checkout requests reuse the open session", async () => {
  subscription.status = "canceled";
  await User.updateOne(
    { _id: billingUser.id },
    { $set: { subscriptionStatus: "canceled" } },
  );
  for (let i = 0; i < 2; i++)
    assert.equal(
      (
        await request(app)
          .post("/api/billing/checkout-session")
          .set("Origin", origin)
          .set("Cookie", cookie(billingUser))
      ).status,
      200,
    );
  assert.equal(checkoutCreates, 1);
});
test("PDF parser extracts real PDF content", async () => {
  const PDFDocument = require("pdfkit");
  const doc = new PDFDocument();
  const chunks = [];
  const completed = new Promise((resolve) => {
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", resolve);
  });
  doc.text(
    "Resume test: Software engineer with experience building reliable services, database applications, and automated testing systems.",
  );
  doc.end();
  await completed;
  const { extractTextFromPdf } = require("../src/services/pdfService");
  assert.match(
    await extractTextFromPdf(Buffer.concat(chunks)),
    /Software engineer/,
  );
});

test('checkout ownership mismatch cannot alter subscription state', async () => {
  const original = fakeStripe.checkout.sessions.retrieve;
  fakeStripe.checkout.sessions.retrieve = async () => ({mode: 'subscription', customer: 'cus_other', client_reference_id: billingUser.id});
  const event = {id: 'evt_bad_owner', type: 'checkout.session.completed', data: {object: {id: 'cs_bad', customer: 'cus_test'}}};
  assert.equal((await webhook(event)).status, 400);
  assert.equal(await BillingEvent.countDocuments({_id: event.id}), 0);
  fakeStripe.checkout.sessions.retrieve = original;
});
test('unconfigured product price does not grant premium access', async () => {
  subscription.status = 'active';
  subscription.items.data[0].price.id = 'price_unrelated';
  assert.equal((await webhook({id: 'evt_wrong_price', type: 'customer.subscription.updated', data: {object: subscription}})).status, 200);
  assert.equal((await User.findById(billingUser.id)).subscriptionStatus, 'inactive');
  subscription.items.data[0].price.id = 'price_pro';
});
test('event receipt failure rolls back entitlement update and remains retryable', async () => {
  await User.updateOne({_id: billingUser.id}, {$set: {subscriptionStatus: 'inactive'}});
  const original = BillingEvent.create;
  BillingEvent.create = async () => {throw new Error('Simulated receipt persistence failure');};
  const event = {id: 'evt_rollback', type: 'customer.subscription.updated', data: {object: subscription}};
  assert.equal((await webhook(event)).status, 500);
  assert.equal((await User.findById(billingUser.id)).subscriptionStatus, 'inactive');
  BillingEvent.create = original;
  assert.equal((await webhook(event)).status, 200);
  assert.equal((await User.findById(billingUser.id)).subscriptionStatus, 'active');
});
test('expired billing lease cannot commit stale state', async () => {
  const withBillingLock = require('../src/services/billingLock');
  await assert.rejects(withBillingLock(billingUser.id, async (user, save) => {
    await User.updateOne({_id: user.id}, {$set: {billingLockUntil: new Date(0)}});
    await save({$set: {subscriptionStatus: 'canceled'}});
  }), error => error.code === 'BILLING_LEASE_EXPIRED');
  assert.equal((await User.findById(billingUser.id)).subscriptionStatus, 'active');
});
test('25 concurrent upload requests complete while analysis workers are stopped', async () => {
  const users = await Promise.all(Array.from({length: 25}, () => makeUser()));
  const durations = [];
  const results = await Promise.all(users.map(async user => {
    const start = performance.now();
    const result = await upload(user);
    durations.push(performance.now() - start);
    return result;
  }));
  assert.ok(results.every(result => result.status === 202));
  assert.ok(results.every(result => result.body.analysis.status === 'queued'));
  durations.sort((a, b) => a - b);
  console.log(JSON.stringify({scenario: 'local admission, mocked S3, workers stopped', requests: 25, accepted: 25, p95Ms: Math.round(durations[23]), maxMs: Math.round(durations[24])}));
});
