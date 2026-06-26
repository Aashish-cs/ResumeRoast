import { Link } from "react-router-dom";

const TermsPage = () => (
  <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
    <div className="mb-8">
      <p className="text-sm font-bold uppercase text-orange-600">Legal</p>
      <h1 className="mt-2 text-4xl font-black tracking-normal">Terms of Service</h1>
      <p className="mt-3 text-sm text-zinc-500">Last updated: June 26, 2026</p>
    </div>

    <div className="space-y-8 text-sm leading-7 text-zinc-700">
      <section>
        <h2 className="text-xl font-black text-zinc-950">1. What ResumeRoast Does</h2>
        <p className="mt-2">
          ResumeRoast lets users upload a PDF resume and receive AI-generated resume
          feedback, an ATS-style score, a roast-style critique, issue suggestions,
          and rewritten resume text. The app is a resume assistance tool, not a
          recruiter, employer, career counselor, or hiring decision-maker.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">2. No Employment Guarantee</h2>
        <p className="mt-2">
          ResumeRoast does not guarantee interviews, job offers, hiring outcomes,
          ATS compatibility, recruiter responses, or salary improvements. AI output
          can be incomplete or inaccurate, so users should review and edit all
          suggestions before using them.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">3. Accounts and Security</h2>
        <p className="mt-2">
          Users are responsible for keeping their account login information secure.
          Passwords and security-question answers are hashed before storage, but
          users should avoid uploading resumes that contain information they do not
          want processed by the service.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">4. Subscription and Billing</h2>
        <p className="mt-2">
          Free users receive one resume analysis and rewrite per account. Pro users
          receive up to 10 analyses per day for $9 per month. Payments are processed
          by Stripe. ResumeRoast does not store full card numbers or card security
          codes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">5. Cancellation</h2>
        <p className="mt-2">
          Pro users can manage or cancel their subscription from the dashboard by
          using the Manage billing button. Cancellation stops future renewals, but
          access may continue until the end of the current billing period.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">6. User Content</h2>
        <p className="mt-2">
          Users keep ownership of the resume content they upload. By uploading a
          resume, users allow ResumeRoast to process that content to provide the
          analysis, rewrite, downloads, account history, and support for the service.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">7. Acceptable Use</h2>
        <p className="mt-2">
          Users may not use ResumeRoast to upload unlawful content, abuse the
          service, bypass usage limits, attack the application, reverse engineer
          private APIs, or use the app in a way that violates Stripe, hosting, or
          AI-provider policies.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">8. Changes</h2>
        <p className="mt-2">
          These terms may be updated as the project changes. Continued use of
          ResumeRoast after changes means the user accepts the updated terms.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">9. Related Policies</h2>
        <p className="mt-2">
          Review the{" "}
          <Link to="/privacy" className="font-semibold text-zinc-950 underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link to="/refund-policy" className="font-semibold text-zinc-950 underline">
            Refund and Cancellation Policy
          </Link>{" "}
          for more details.
        </p>
      </section>
    </div>
  </section>
);

export default TermsPage;
