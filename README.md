# ResumeRoast

ResumeRoast is a deployed full-stack SaaS-style resume review app. Users create an account, upload a PDF resume, get an ATS-style score, receive a blunt but useful roast, and download a rewritten resume in recruiter-friendly PDF or DOCX format.

The app is built as a realistic portfolio project: real auth, real database persistence, real AI calls, real Stripe subscription infrastructure, and sandbox payments for safe demo testing.

## Live Demo

| Service | URL |
| --- | --- |
| App | [resume-roast-client.vercel.app](https://resume-roast-client.vercel.app/) |
| API health | [resumeroast-api.onrender.com/api/health](https://resumeroast-api.onrender.com/api/health) |

Demo payments run through **Stripe Sandbox**, so no real money moves. The integration can be switched to live Stripe keys when the product is ready to accept real payments.

![ResumeRoast landing page](docs/screenshots/landing.png)

## What It Does

- Account signup, login, JWT auth, and protected dashboard routes.
- Security-question password recovery instead of fake email verification.
- PDF resume upload with server-side text extraction.
- Claude Haiku 4.5 resume analysis and rewrite generation.
- ATS score, letter grade, issue list, roast, and rewritten resume.
- PDF and DOCX downloads for rewritten resumes.
- One free analysis and rewrite per account.
- Pro plan with 10 analyses per day.
- Stripe Checkout for the $9/month Pro subscription.
- Stripe Billing Portal for managing and canceling subscriptions.
- Stripe webhooks that sync subscription status to MongoDB.
- Dashboard support for scheduled cancellation states.
- Terms, privacy, refund, and cancellation pages.
- Server-side usage enforcement so limits cannot be bypassed from the frontend.

## Screenshots

### Results

![ResumeRoast results page](docs/screenshots/results.png)

### Dashboard

![ResumeRoast dashboard](docs/screenshots/dashboard.png)

### Upload

![ResumeRoast upload page](docs/screenshots/upload.png)

### Pricing

![ResumeRoast pricing page](docs/screenshots/pricing.png)

### Terms

![ResumeRoast terms page](docs/screenshots/terms.png)

## Tech Stack

| Layer | Implementation |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, React Router, Lucide icons |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB Atlas |
| AI | Claude Haiku 4.5 via Anthropic API |
| Auth | JWT, bcrypt password hashing |
| Resume parsing | Server-side PDF text extraction |
| Exports | PDFKit and DOCX generation |
| Billing | Stripe Checkout, Stripe Billing Portal, Stripe webhooks |
| Deployment | Vercel frontend, Render backend |

## Architecture

```mermaid
flowchart LR
  U["User"] --> A["Vercel React client"]
  A --> B["Render Express API"]
  B --> C["MongoDB Atlas"]
  B --> D["Claude Haiku API"]
  B --> E["Stripe Checkout + Portal"]
  E --> F["Stripe webhooks"]
  F --> B
  B --> G["PDF/DOCX downloads"]
```

## Core Flow

1. A user signs up with name, email, password, and a security question.
2. Passwords and security answers are hashed with bcrypt.
3. The user uploads a PDF resume.
4. The API extracts text from the PDF and caps input length.
5. The backend claims the user's free slot or checks Pro daily usage before calling AI.
6. Claude returns structured JSON with score, grade, roast, issues, and rewrite.
7. The analysis is saved to MongoDB Atlas.
8. The user can revisit the result from the dashboard and download the rewrite as PDF or DOCX.

## Billing Flow

ResumeRoast uses Stripe-hosted pages, so the app never handles card numbers directly.

1. A logged-in user clicks Subscribe with Stripe.
2. The API creates or reuses a Stripe customer for the MongoDB user.
3. Stripe Checkout handles the $9/month subscription.
4. Stripe redirects successful checkouts back to the dashboard.
5. Stripe sends subscription events to `/api/billing/webhook`.
6. The webhook verifies Stripe's signature and updates the user's subscription fields in MongoDB.
7. The dashboard reads MongoDB state, including active, inactive, and scheduled-cancellation states.
8. Pro users get 10 analyses per day. Free users get 1 total analysis and rewrite.

Sandbox testing uses Stripe's test card:

```text
4242 4242 4242 4242
Any future expiry, any CVC, any ZIP
```

## AI Behavior

ResumeRoast uses Claude Haiku 4.5 with a strict JSON response contract. The rewrite is prompted into a compact new-grad resume format:

- centered name and contact line
- summary
- education
- grouped technical skills
- projects
- experience
- leadership, awards, or certifications when supported by the source resume

The backend does not invent a fake resume result when Claude fails. Missing keys, rate limits, and temporary AI errors become explicit API errors instead of fabricated resume content.

## Security and Cost Controls

- `ANTHROPIC_API_KEY` stays server-side.
- `MONGODB_URI` stays server-side.
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` stay server-side.
- JWT protects uploads, dashboard, result pages, and downloads.
- Passwords are hashed with bcrypt.
- Security answers are normalized and hashed with bcrypt.
- Free and Pro usage limits are stored in MongoDB and enforced server-side.
- PDF uploads are capped with `RESUME_MAX_BYTES`.
- Extracted resume text is capped with `RESUME_MAX_CHARS`.
- Claude output is capped with `ANTHROPIC_MAX_OUTPUT_TOKENS`.
- Express rate limiting is enabled on `/api` routes.
- Helmet and CORS are configured for production.
- Production billing webhooks require Stripe signature verification.
- Legal pages disclose AI limitations, no employment guarantee, cancellation, and refund rules.

## API Surface

```text
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/forgot-password
POST /api/auth/reset-password

POST /api/analyses
GET  /api/analyses
GET  /api/analyses/:id
GET  /api/analyses/:id/download/pdf
GET  /api/analyses/:id/download/docx

POST /api/billing/checkout-session
POST /api/billing/portal-session
POST /api/billing/webhook
```

## Deployment

### Render API

The backend runs from the repository root.

```text
Build Command: npm install
Start Command: npm run start --workspace server
Health Check Path: /api/health
```

Production environment variables:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
CLIENT_URL=https://resume-roast-client.vercel.app
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
ANTHROPIC_MAX_OUTPUT_TOKENS=3200
USE_DEMO_AI=false
FREE_ANALYSIS_LIMIT=1
PRO_DAILY_ANALYSIS_LIMIT=10
RESUME_MAX_BYTES=5242880
RESUME_MAX_CHARS=12000
STRIPE_SECRET_KEY=sk_test_or_live_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=https://resume-roast-client.vercel.app/dashboard?checkout=success
STRIPE_CANCEL_URL=https://resume-roast-client.vercel.app/pricing?checkout=cancelled
```

### Stripe Sandbox Setup

```text
Product: ResumeRoast Pro
Price: $9/month recurring
Checkout endpoint: POST /api/billing/checkout-session
Portal endpoint: POST /api/billing/portal-session
Webhook endpoint: https://resumeroast-api.onrender.com/api/billing/webhook
```

Webhook events:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.payment_succeeded
```

### Vercel Client

The frontend deploys from the `client` directory.

```text
Root Directory: client
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

Production environment variable:

```env
VITE_API_URL=https://resumeroast-api.onrender.com/api
```

## Local Development

Install dependencies:

```bash
npm install
```

Create `.env`:

```bash
cp .env.example .env
```

Minimum local environment:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/resumeroast?appName=Cluster0
JWT_SECRET=replace-with-a-long-random-string
CLIENT_URL=http://localhost:5173
VITE_API_URL=http://localhost:5001/api
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
ANTHROPIC_MAX_OUTPUT_TOKENS=3200
USE_DEMO_AI=false
FREE_ANALYSIS_LIMIT=1
PRO_DAILY_ANALYSIS_LIMIT=10
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Run both apps:

```bash
npm run dev
```

Local URLs:

```text
Frontend: http://localhost:5173
API:      http://localhost:5001/api/health
```

## Repository Structure

```text
ResumeRoast/
  client/             React/Vite frontend
  server/             Express API, Mongo models, controllers, services
  docs/screenshots/   README screenshots
  render.yaml         Render API deployment config
  vercel.json         Vercel frontend deployment config
```

## Scripts

```bash
npm run dev          # run frontend and backend together
npm run dev:client   # run Vite only
npm run dev:server   # run Express only
npm run build        # build the frontend
npm run start        # start the Express server
npm run lint         # run lightweight validation
```

## Project Status

ResumeRoast is complete as a portfolio-ready full-stack project. The live app uses Stripe Sandbox for demo payments, which keeps testing safe while still proving the real subscription architecture works end to end.
