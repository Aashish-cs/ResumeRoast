# Asynchronous processing, authentication, and billing

## Runtime architecture

React uploads a PDF to the Express API. The API validates the header, stores the private encrypted object in S3, and transactionally reserves quota while inserting an Analysis job into MongoDB. It returns HTTP 202 and a job ID. S3 stores files; MongoDB is the durable queue. A separate Node worker atomically claims jobs and forks a memory-limited child for S3 retrieval, PDF extraction, and Claude. The client polls the ownership-protected results endpoint.

Each child has a 120-second deadline. Jobs use 150-second leases, attempt counters, and fencing tokens. Crashed workers are recovered after lease expiry; three failed attempts produce a visible failed status and release quota by excluding that job from admission counts. A retry after an ambiguous Claude response can make another billable Claude call; processing is at least once, not exactly once.

MongoDB must be a replica set (Atlas is supported). Transactions serialize admission through a user write and enforce one free analysis or ten analyses per UTC day for Pro accounts. Existing completed analyses count toward limits. Failed jobs do not. The session endpoint derives usage display fields from these same job counts.

## Sessions and authorization

JWTs are in HttpOnly cookies, with Secure and SameSite=None in production. All mutation routes except signature-verified Stripe webhooks require an allowlisted Origin. JWT verification only accepts HS256 and checks the user's session version; logout and password reset revoke prior sessions. Existing localStorage tokens are removed, so users must sign in again.

For reliable browser behavior deploy frontend and API under the same parent domain, such as app.example.com and api.example.com. The existing vercel.app/onrender.com combination is cross-site, and browsers blocking third-party cookies can prevent login. Configure exact HTTPS origins in CLIENT_URL. Never restore localStorage tokens as a workaround.

Roles are user/admin, managed by an operator directly in MongoDB. Signup cannot assign roles. GET /api/admin/queue exposes aggregate counts only to admins. Analysis reads/downloads enforce ownership. MongoDB account counters protect upload, download, and billing routes across replicas; auth/IP limits are process-local and should be supplemented by ingress limits when scaling. Rate limits mitigate abuse; they cannot guarantee all scraping is prevented. The demo-account quota-reset bypass was removed.

## Billing consistency

All environments require signed Stripe events. Handlers validate test/live mode, linked customers, Checkout ownership, subscription price and quantity. Customer creation and Checkout use idempotency keys. Open Checkout sessions are reused. A MongoDB lease serializes each customer's billing operations. Expired operations cannot commit through the fenced update.

On each accepted event, Stripe subscriptions are refetched under the lock. The current eligible subscription determines access, so stale deliveries do not restore an obsolete subscription. Subscription state and the unique event receipt commit in one MongoDB transaction. Busy locks return 503 so Stripe retries; duplicate completed events return 200. Subscribe to checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed, customer.subscription.created/updated/deleted, invoice.payment_succeeded, and invoice.payment_failed. Automatic custom receipt email was removed from the webhook path; configure Stripe receipts instead.

## Deployment

1. Configure a private S3 bucket, block public access, and grant API PutObject/DeleteObject and worker GetObject permissions for resumes/*. IAM roles use the AWS credential chain; explicit access keys remain supported. Configure an S3 lifecycle rule for raw PDF retention and failed-upload orphans (for example 7 days). Result documents stay in MongoDB.
2. Set AWS_S3_BUCKET, AWS_REGION, MONGODB_URI, CLIENT_URL, a random JWT_SECRET of at least 32 characters, ANTHROPIC_API_KEY, and Stripe keys/price/webhook secret. Never commit .env.
3. Deploy both API (`npm start`) and worker (`npm run worker`) with the same MongoDB/S3 configuration. Scale by adding worker processes; each processes one job at a time.
4. Deploy the updated client with VITE_API_URL. Set same-site custom domains before production cookie rollout. Configure webhook subscriptions above.
5. Run real sandbox end-to-end checks before routing production traffic. Docker Compose is for local development; it uses an isolated MongoDB replica set but still requires a configured S3 bucket and Claude key. `docker compose up --build` runs all services. Docker images and CI workflow have been added; their remote execution is a separate deployment check.

## Evidence and resume wording

`TEST_MONGODB_URI=mongodb://127.0.0.1:27017/?replicaSet=rs0 npm test` creates and drops only a process-specific test database. Tests use real MongoDB transactions and real PDF extraction, while S3, Claude worker responses, and Stripe network calls are mocked. They cover cookie issuance/revocation, Origin protection, RBAC, ownership, concurrent quotas, throttling, competing workers, lease recovery, retries, signature verification, duplicate/stale/concurrent webhooks, and Checkout reuse.

These checks do not establish a production timeout rate or heavy-payment throughput. Measure upload request latency/timeouts, queue age, job success/failure rate, and Stripe event processing/retry counts under a documented staging load. Only claim a measured zero timeout rate with the request count, duration, workload, and environment recorded.

Defensible bullets after deployment validation:
- Built an asynchronous resume-analysis pipeline using private AWS S3 storage, a durable MongoDB queue, and isolated Node.js worker processes for PDF extraction and Claude analysis, returning job IDs without waiting for AI completion.
- Implemented HttpOnly JWT sessions, role-based admin access, per-resource ownership checks, Origin validation, and distributed account rate limits to restrict API abuse.
- Integrated Stripe Checkout with idempotent session creation, signature and ownership validation, and transactional webhook deduplication to synchronize subscription state under duplicate and out-of-order delivery.

## Local validation recorded October 21, 2026

- 19 integration tests passed against an isolated local MongoDB replica set.
- 25 simultaneous upload admissions all returned HTTP 202 with workers stopped; local p95 was 64 ms and maximum 66 ms. S3 was mocked, so this is an API-admission regression check, not a cloud benchmark.
- Frontend production build and server syntax checks passed.
- Production dependency audit reported zero known vulnerabilities after compatible dependency updates and a React Router upgrade. Development-only Tailwind/nodemon dependency advisories remain and require a separate tooling migration.
- Docker is not installed on the current machine. Container builds and GitHub Actions execution remain unverified until run on a Docker host/CI.
- Live S3, Claude, Stripe sandbox, custom-domain cookie behavior, and deployment were not exercised.

Stripe design references: [Webhook delivery and duplicate handling](https://docs.stripe.com/webhooks), [Idempotent requests](https://docs.stripe.com/api/idempotent_requests).
