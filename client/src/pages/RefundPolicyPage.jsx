import { Link } from "react-router-dom";

const RefundPolicyPage = () => (
  <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
    <div className="mb-8">
      <p className="text-sm font-bold uppercase text-orange-600">Legal</p>
      <h1 className="mt-2 text-4xl font-black tracking-normal">
        Refund and Cancellation Policy
      </h1>
      <p className="mt-3 text-sm text-zinc-500">Last updated: June 26, 2026</p>
    </div>

    <div className="space-y-8 text-sm leading-7 text-zinc-700">
      <section>
        <h2 className="text-xl font-black text-zinc-950">1. Free Tier</h2>
        <p className="mt-2">
          Every account receives one free resume analysis and rewrite. Users can
          try the service before starting a paid subscription.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">2. Paid Subscription</h2>
        <p className="mt-2">
          ResumeRoast Pro costs $9 per month and includes up to 10 resume analyses
          per day, AI feedback, rewritten resume text, and PDF/DOCX downloads.
          Subscriptions renew monthly until canceled.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">3. How to Cancel</h2>
        <p className="mt-2">
          Users can cancel from the dashboard by clicking Manage billing and using
          the Stripe-hosted billing portal. Cancellation stops future renewal
          charges. Access may continue until the end of the current paid billing
          period.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">4. Refunds</h2>
        <p className="mt-2">
          Because AI analysis can create provider costs immediately, subscription
          charges are generally non-refundable after successful payment. Refund
          requests may be reviewed for duplicate charges, accidental checkout, or
          technical failures that prevented access to the paid service. This policy
          does not limit any refund rights required by law.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">5. Failed Payments</h2>
        <p className="mt-2">
          Stripe may retry failed subscription payments. If payment is not resolved,
          Pro access can be paused, canceled, or marked inactive by the app after
          Stripe updates the subscription status.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">6. No Hiring Guarantee</h2>
        <p className="mt-2">
          Refunds are not provided because a user did not receive interviews, job
          offers, recruiter responses, or a specific ATS result. ResumeRoast provides
          AI-generated suggestions, not employment outcomes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black text-zinc-950">7. Related Policies</h2>
        <p className="mt-2">
          This policy works together with the{" "}
          <Link to="/terms" className="font-semibold text-zinc-950 underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="font-semibold text-zinc-950 underline">
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </div>
  </section>
);

export default RefundPolicyPage;
