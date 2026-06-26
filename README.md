# ResumeRoast

ResumeRoast is a full-stack resume review app that lets a user upload a PDF resume, receive an ATS-style score, get a blunt but useful roast, and download a rewritten resume. The project focuses on practical product scope: real auth, real database storage, real AI integration, and clear cost controls.

![ResumeRoast landing page](docs/screenshots/landing.png)

## What It Does

- Upload a PDF resume and extract text server-side.
- Generate an ATS score, letter grade, roast, issue list, and rewritten resume.
- Format rewrites as a compact, recruiter-friendly resume.
- Store users and analyses in MongoDB Atlas.
- Protect analysis history behind JWT authentication.
- Give each free account one analysis and rewrite.
- Keep Claude and database credentials server-side.
- Support PDF and DOCX downloads for rewritten resumes.

## Screenshots

### Results

![ResumeRoast results page](docs/screenshots/results.png)

### Dashboard

![ResumeRoast dashboard](docs/screenshots/dashboard.png)

### Upload

![ResumeRoast upload page](docs/screenshots/upload.png)

## Tech Stack

| Layer | Tools |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, Lucide icons |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB Atlas |
| AI | Claude Haiku 4.5 via Anthropic API |
| Auth | JWT, bcrypt password hashing |
| Files | PDF text extraction, PDFKit, DOCX export |
| Payments | Stripe subscription scaffolding |
| Optional services | AWS S3 for resume storage, SendGrid for receipt email |

## Architecture

```mermaid
flowchart LR
  A["React client"] --> B["Express API"]
  B --> C["MongoDB Atlas"]
  B --> D["Claude Haiku API"]
  B --> E["PDF/DOCX generation"]
  B -. optional .-> F["Stripe"]
  B -. optional .-> G["AWS S3"]
```

## Product Decisions

ResumeRoast is cost-aware by design. Each free user receives one real analysis and rewrite. The backend claims that free usage before calling Claude, which prevents duplicate free requests from racing each other.

The app does not return fake AI results when Claude is unavailable. If the API is busy, rate-limited, or missing a key, the server returns a clear error instead of inventing resume content.

Email verification is intentionally not included yet. Users sign up with an email, password, and security question. Password recovery uses the security question flow.

## Local Setup

Install dependencies:

```bash
npm install
```

Copy the environment template:

```bash
cp .env.example .env
```

Fill in the required local values:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/resumeroast?appName=Cluster0
JWT_SECRET=replace-with-a-long-random-string
CLIENT_URL=http://localhost:5173
VITE_API_URL=http://localhost:5001/api
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
USE_DEMO_AI=false
```

Start the app:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret used to sign auth tokens |
| `CLIENT_URL` | Frontend origin allowed by CORS; comma-separate multiple origins |
| `VITE_API_URL` | API base URL used by the React app |
| `ANTHROPIC_API_KEY` | Server-side Claude API key |
| `ANTHROPIC_MODEL` | Claude model, default `claude-haiku-4-5-20251001` |
| `ANTHROPIC_MAX_OUTPUT_TOKENS` | Output cap for analysis and rewrite responses |
| `FREE_ANALYSIS_LIMIT` | Free analyses per account, default `1` |
| `PRO_DAILY_ANALYSIS_LIMIT` | Paid daily analysis cap, default `10` |
| `RESUME_MAX_BYTES` | Max uploaded PDF size |
| `RESUME_MAX_CHARS` | Max extracted resume text sent to AI |
| `STRIPE_SECRET_KEY` | Optional Stripe billing secret |
| `AWS_S3_BUCKET` | Optional resume PDF storage bucket |
| `SENDGRID_API_KEY` | Optional email provider key |

## Demo Mode

For UI testing without spending API credits:

```env
USE_DEMO_AI=true
```

Demo mode is clearly labeled and only builds a source-limited placeholder from the uploaded resume text. It is not used as a fallback when Claude fails.

## API Routes

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

## Security and Cost Controls

- Passwords are hashed with bcrypt.
- Security answers are normalized and hashed.
- JWT auth protects uploads, dashboards, results, and downloads.
- Claude API key stays on the server.
- MongoDB credentials stay in environment variables.
- PDF uploads are size-limited.
- Extracted resume text is character-limited before AI calls.
- Free usage is enforced server-side with MongoDB counters.
- AI output tokens are capped with `ANTHROPIC_MAX_OUTPUT_TOKENS`.
- Express rate limiting is enabled for `/api` routes.
- Helmet and CORS are configured on the API.

## Deployment

The simplest production setup is:

| Service | Suggested host |
| --- | --- |
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| AI | Anthropic API |
| Payments | Stripe, when billing is enabled |

Production environment variables should be configured in the host dashboard, not committed to GitHub.

### Backend on Render

The repo includes `render.yaml` for the Express API. In Render, create a new Blueprint or Web Service from this GitHub repo.

Use these settings if creating a Web Service manually:

```text
Build Command: npm install
Start Command: npm run start --workspace server
```

Set these environment variables in Render:

```env
NODE_ENV=production
MONGODB_URI=your-mongodb-atlas-uri
JWT_SECRET=your-long-random-production-secret
CLIENT_URL=https://your-vercel-app.vercel.app
ANTHROPIC_API_KEY=your-anthropic-key
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
ANTHROPIC_MAX_OUTPUT_TOKENS=3200
USE_DEMO_AI=false
FREE_ANALYSIS_LIMIT=1
PRO_DAILY_ANALYSIS_LIMIT=10
RESUME_MAX_BYTES=5242880
RESUME_MAX_CHARS=12000
```

After Render deploys, test:

```text
https://your-render-service.onrender.com/api/health
```

### Frontend on Vercel

The repo includes `vercel.json` for the Vite client.

Set this Vercel environment variable:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

If importing manually, use:

```text
Build Command: npm run build --workspace client
Output Directory: client/dist
Install Command: npm install
```

After Vercel deploys, update the Render `CLIENT_URL` value to the final Vercel URL and redeploy the backend.

## Useful Scripts

```bash
npm run dev          # run frontend and backend together
npm run dev:client   # run Vite only
npm run dev:server   # run Express only
npm run build        # build the frontend
npm run start        # start the Express server
npm run lint         # run lightweight validation
```

## Current Status

The local app is fully wired with MongoDB Atlas and Claude Haiku. Deployment is the next major step.
