import { Link } from "react-router-dom";

const PrivacyPage = () => (
  <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
    <div className="mb-8">
      <p className="text-sm font-bold uppercase text-orange-600">Legal</p>
      <h1 className="mt-2 text-4xl font-black tracking-normal">Privacy Policy</h1>
      <p className="mt-3 text-sm text-zinc-500">Last updated: June 26, 2026</p>
    </div>

    <div className="space-y-8 text-sm leading-7 text-zinc-700">
      <section>
        <h2 className="text-xl font-black text-zinc-950">1. Information Collected</h2>
        <p className="mt-2">
          ResumeRoast collects the information needed to run the app: account name,
          email address, hashed password, hashed security-question answer, uploaded
          resume files, extracted resume text, AI analysis results, usage counts,
          and subscription status.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">2. Payment Information</h2>
        <p className="mt-2">
          Payments are handled by Stripe. ResumeRoast stores Stripe customer and
          subscription identifiers so it can unlock Pro access, but it does not
          store full card numbers, card security codes, or bank account details.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">3. How Information Is Used</h2>
        <p className="mt-2">
          Information is used to create accounts, authenticate users, process resume
          uploads, generate AI feedback, enforce free and Pro usage limits, provide
          downloads, manage subscriptions, prevent abuse, and debug service issues.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">4. Service Providers</h2>
        <p className="mt-2">
          ResumeRoast uses third-party providers to operate the service, including
          Vercel for the frontend, Render for the API, MongoDB Atlas for the
          database, Anthropic for AI analysis, Stripe for billing, and optional
          email infrastructure for receipts or support messages.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">5. AI Processing</h2>
        <p className="mt-2">
          Resume text is sent to the configured AI provider so ResumeRoast can
          generate feedback and rewrites. Users should remove sensitive personal
          information from resumes before uploading if they do not want that
          information processed.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">6. Local Storage</h2>
        <p className="mt-2">
          The frontend stores an authentication token in the user's browser local
          storage so the user can stay logged in. Logging out removes that token
          from the browser.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">7. Data Retention</h2>
        <p className="mt-2">
          Account records and analysis history are kept so users can revisit prior
          results. Users who want account data removed can request deletion, subject
          to reasonable limits needed for fraud prevention, billing records, legal
          obligations, and security.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">8. Security</h2>
        <p className="mt-2">
          ResumeRoast uses hashed credentials, JWT authentication, server-side
          billing checks, upload limits, rate limiting, CORS restrictions, and
          Stripe webhook signature verification. No web app can guarantee perfect
          security.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">9. Billing and Refunds</h2>
        <p className="mt-2">
          Subscription billing and cancellation details are covered in the{" "}
          <Link to="/refund-policy" className="font-semibold text-zinc-950 underline">
            Refund and Cancellation Policy
          </Link>
          .
        </p>
      </section>
    </div>
  </section>
);

export default PrivacyPage;
