# ResumeRoast

ResumeRoast is a full-stack MERN-style SaaS app where users upload a PDF resume,
get an ATS score, receive a blunt roast, and get a rewritten resume. Free users
get two analyses, while subscribed users get a higher daily limit.

## Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express, MongoDB, JWT auth
- AI: Google Gemini using the free-tier-friendly `gemini-2.5-flash-lite` model
- Storage: AWS S3 for uploaded PDFs
- Payments: Stripe subscriptions and webhooks
- Email: SendGrid verification, password reset, and receipt emails

## Project Structure

```text
ResumeRoast/
  client/   React + Vite frontend
  server/   Express API, Mongo models, services, routes
```

I used a split `client` and `server` monorepo because it keeps the beginner
mental model clean: React runs on one port, Express runs on another, and each
side has its own package file.

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example env file:

   ```bash
   cp .env.example .env
   ```

3. Fill in at least:

   ```bash
   MONGODB_URI=your-mongodb-atlas-uri
   JWT_SECRET=a-long-random-secret
   CLIENT_URL=http://localhost:5173
   VITE_API_URL=http://localhost:5001/api
   ```

4. Start both apps:

   ```bash
   npm run dev
   ```

5. Open:

   ```text
   http://localhost:5173
   ```

### Local MongoDB Option

If you do not want to set up MongoDB Atlas yet, run MongoDB locally:

```bash
brew tap mongodb/brew
brew trust mongodb/brew
brew install mongodb-community@8.0
brew services start mongodb/brew/mongodb-community@8.0
```

Then use this in `.env`:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/resumeroast
USE_DEMO_AI=true
```

That is enough to test signup, email verification dev links, login, PDF upload,
demo analysis, and the free-tier paywall flow locally.

## Running Without Paid API Keys

For local development, `.env.example` sets:

```bash
USE_DEMO_AI=true
```

That makes the backend return a realistic fake AI response so you can test
signup, upload, results, dashboard, and paywall UI before wiring every external
service.

To use Gemini for real:

```bash
USE_DEMO_AI=false
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_FALLBACK_MODELS=gemini-2.0-flash-lite,gemini-2.0-flash
ALLOW_AI_FALLBACK=true
```

The backend tries the primary Gemini model first, then fallback Gemini models if
Google returns a temporary free-tier/high-demand error. If those are also busy,
`ALLOW_AI_FALLBACK=true` lets the portfolio demo return a fake analysis instead
of crashing.

## Stripe Setup

Create a recurring Stripe price for `$9/month`, then put that price id in:

```bash
STRIPE_PRICE_ID=price_...
```

For local webhook testing, install the Stripe CLI and run:

```bash
stripe listen --forward-to localhost:5001/api/billing/webhook
```

Copy the webhook signing secret into:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

The app checks `subscriptionStatus` from MongoDB, which is synced by Stripe
webhooks. It does not trust frontend state for paid access.

## Email Verification

If `SENDGRID_API_KEY` is missing, the server logs verification/reset links to
the terminal and also returns local-only dev links to the frontend. In
production, configure:

```bash
SENDGRID_API_KEY=your-key
FROM_EMAIL=no-reply@yourdomain.com
```

## AWS S3

Uploaded PDF resumes are sent to S3 when these are configured:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
```

For local development without AWS credentials, the upload still works and the
server skips S3 storage with a console message.

## Security and Cost-Control Decisions

- Free analyses are claimed atomically before the AI call to reduce
  duplicate/concurrent free usage.
- Free users get two analyses with rewrites, enforced server-side with
  `User.freeAnalysesUsed`.
- Pro users are capped by `PRO_DAILY_ANALYSIS_LIMIT`, defaulting to 10 analyses
  per day, so the portfolio deployment can stay cost-aware.
- The Gemini API key stays server-side. It is never exposed in the React app.
- Paid status is read from MongoDB after Stripe webhook sync, not from the
  frontend.
- PDF uploads are capped by `RESUME_MAX_BYTES`, defaulting to 5 MB.
- Extracted resume text is capped by `RESUME_MAX_CHARS`, defaulting to 12,000
  characters, to control AI token usage.
- Express rate limiting is enabled for `/api` routes.
- Helmet and CORS are configured on the API.
- S3 uploads use server-side encryption.
- Passwords are hashed with bcrypt before storage.
- Verification and reset tokens are stored as SHA-256 hashes, not raw tokens.

## Main API Routes

```text
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/verify-email
POST /api/auth/forgot-password
POST /api/auth/reset-password

GET  /api/analyses
POST /api/analyses
GET  /api/analyses/:id
GET  /api/analyses/:id/download/pdf
GET  /api/analyses/:id/download/docx

POST /api/billing/checkout-session
POST /api/billing/portal-session
POST /api/billing/webhook
```

## Deployment Notes

For AWS EC2:

1. Build the frontend:

   ```bash
   npm run build
   ```

2. Serve `client/dist` with Nginx or another static host.
3. Run the Express server with a process manager like `pm2`.
4. Set production env vars on the server.
5. Point Stripe webhooks to:

   ```text
   https://your-api-domain.com/api/billing/webhook
   ```

6. Configure MongoDB Atlas network access for your EC2 instance.
7. Configure S3 bucket permissions for the IAM user/role used by the server.

## Useful Scripts

```bash
npm run dev          # run client and server together
npm run dev:client   # run Vite only
npm run dev:server   # run Express only
npm run build        # build the frontend
npm run start        # start the Express server
```
