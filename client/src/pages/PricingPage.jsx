import { CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";

const PricingPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const subscribe = async () => {
    if (!user) {
      navigate("/login", { state: { from: { pathname: "/pricing" } } });
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/billing/checkout-session", { method: "POST" });
      window.location.href = data.url;
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-black tracking-normal">Unlock the rewrite</h1>
        <p className="mt-3 text-zinc-600">
          Free users get 1 honest analysis with a rewrite. Subscribers get 10
          analyses per day.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-lg rounded-lg border-2 border-zinc-950 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">Pro</h2>
            <p className="mt-1 text-sm text-zinc-500">Monthly subscription</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black">$9</div>
            <div className="text-sm text-zinc-500">per month</div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {[
            "10 resume analyses per day",
            "Full improved resume text",
            "Downloadable PDF and DOCX",
            "Re-run analyses after edits"
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
              {feature}
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <button className="button-primary mt-7 w-full" onClick={subscribe} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          Subscribe with Stripe
        </button>
      </div>

      <div className="mt-8 text-center text-sm text-zinc-500">
        <Link to="/upload" className="font-semibold text-zinc-900 underline">
          Try your free roast first
        </Link>
      </div>
    </section>
  );
};

export default PricingPage;
