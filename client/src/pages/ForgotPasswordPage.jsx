import { Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [devLink, setDevLink] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setDevLink("");
    setError("");

    try {
      const data = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: { email },
        token: null
      });
      setMessage(data.message);
      setDevLink(data.devResetUrl || "");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="panel p-6">
        <Mail className="h-8 w-8 text-orange-600" />
        <h1 className="mt-4 text-2xl font-black">Reset password</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Enter your email and ResumeRoast will send a reset link.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-semibold" htmlFor="email">
              Email
            </label>
            <input
              className="input mt-1"
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          {message && (
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm font-semibold text-teal-800">
              {message}
              {devLink && (
                <a className="mt-2 block underline" href={devLink}>
                  Open local reset link
                </a>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <button className="button-primary w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send reset link
          </button>
        </form>

        <Link to="/login" className="mt-5 block text-sm font-semibold text-zinc-900 underline">
          Back to login
        </Link>
      </div>
    </section>
  );
};

export default ForgotPasswordPage;
