# ResumeRoast

ResumeRoast is a deployed full-stack resume review app. Users create an account, upload a PDF resume, receive an ATS-style score, get a blunt but useful roast, and download a rewritten resume formatted for recruiters.

**Live app:** [resume-roast-client.vercel.app](https://resume-roast-client.vercel.app/)  
**API health:** [resumeroast-api.onrender.com/api/health](https://resumeroast-api.onrender.com/api/health)

![ResumeRoast landing page](docs/screenshots/landing.png)

## What Shipped

- Full React/Vite frontend deployed on Vercel.
- Express API deployed on Render.
- MongoDB Atlas production database.
- Claude Haiku 4.5 resume analysis and rewrite generation.
- Account signup, login, JWT auth, and protected dashboard routes.
- Security-question password recovery.
- PDF upload and server-side text extraction.
- ATS score, letter grade, roast, issue list, and full rewritten resume.
- PDF and DOCX downloads for rewritten resumes.
- One free analysis and rewrite per account.
- Server-side usage enforcement so users cannot bypass limits from the frontend.
- No fake AI fallback. If Claude is unavailable, the app returns a real retry/error state.

## Screenshots

### Results

![ResumeRoast results page](docs/screenshots/results.png)

### Dashboard

![ResumeRoast dashboard](docs/screenshots/dashboard.png)

### Upload

![ResumeRoast upload page](docs/screenshots/upload.png)

## Stack

| Layer | Implementation |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, React Router, Lucide icons |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB Atlas |
| AI | Claude Haiku 4.5 via Anthropic API |
| Auth | JWT, bcrypt password hashing |
| Resume parsing | Server-side PDF text extraction |
| Exports | PDFKit and DOCX generation |
| Deployment | Vercel frontend, Render backend |

## Architecture

```mermaid
flowchart LR
  U["User"] --> A["Vercel React client"]
  A --> B["Render Express API"]
  B --> C["MongoDB Atlas"]
  B --> D["Claude Haiku API"]
  B --> E["PDF/DOCX rewrite downloads"]
```

## Core Flow

1. A user signs up with name, email, password, and a security question.
2. Passwords and security answers are hashed before storage.
3. The user uploads a PDF resume.
4. The API extracts resume text from the PDF.
5. The backend claims the user's free analysis slot before calling Claude.
6. Claude returns structured JSON: score, grade, roast, issues, and rewrite.
7. The analysis is saved to MongoDB Atlas.
8. The user can revisit the result from the dashboard and download the rewrite as PDF or DOCX.

## AI Behavior

ResumeRoast uses Claude Haiku 4.5 with a strict JSON response contract. The rewrite is prompted into a compact new-grad resume format:

- centered name and contact line
- summary
- education
- grouped technical skills
- projects
- experience
- leadership and awards when supported by the source resume

The backend does not invent a fake result when Claude fails. Rate limits, missing keys, and temporary AI errors become explicit API errors instead of fabricated resume content.

## Security and Cost Controls

- `ANTHROPIC_API_KEY` stays server-side.
- `MONGODB_URI` stays server-side.
- JWT protects uploads, dashboard, result pages, and downloads.
- Passwords are hashed with bcrypt.
- Security answers are normalized and hashed with bcrypt.
- Free usage is stored in MongoDB and enforced server-side.
- PDF uploads are capped with `RESUME_MAX_BYTES`.
- Extracted resume text is capped with `RESUME_MAX_CHARS`.
- Claude output is capped with `ANTHROPIC_MAX_OUTPUT_TOKENS`.
- Express rate limiting is enabled on `/api` routes.
- Helmet and CORS are configured for production.

## Production Deployment

| Service | Deployment |
| --- | --- |
| Frontend | [Vercel](https://resume-roast-client.vercel.app/) |
| Backend | [Render](https://resumeroast-api.onrender.com/api/health) |
| Database | MongoDB Atlas |
| AI provider | Anthropic Claude Haiku |

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
