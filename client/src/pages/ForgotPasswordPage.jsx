import { KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const findQuestion = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setSecurityQuestion("");
    setError("");

    try {
      const data = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: { email },
        token: null
      });
      setMessage(data.message);
      setSecurityQuestion(data.securityQuestion || "");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const data = await apiRequest("/auth/reset-password", {
        method: "POST",
        body: { email, securityAnswer, password },
        token: null
      });
      setMessage(data.message);
      setSecurityAnswer("");
      setPassword("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="panel p-6">
        <KeyRound className="h-8 w-8 text-orange-600" />
        <h1 className="mt-4 text-2xl font-black">Reset password</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Enter your email, answer your security question, and choose a new password.
        </p>

        <form onSubmit={findQuestion} className="mt-6 space-y-4">
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
          <button className="button-secondary w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Find security question
          </button>
        </form>

        {securityQuestion && (
          <form onSubmit={resetPassword} className="mt-6 space-y-4 border-t border-zinc-200 pt-5">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm font-semibold text-zinc-700">
              {securityQuestion}
            </div>
            <div>
              <label className="text-sm font-semibold" htmlFor="securityAnswer">
                Security answer
              </label>
              <input
                className="input mt-1"
                id="securityAnswer"
                value={securityAnswer}
                onChange={(event) => setSecurityAnswer(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold" htmlFor="password">
                New password
              </label>
              <input
                className="input mt-1"
                id="password"
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <button className="button-primary w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Reset password
            </button>
          </form>
        )}

        {message && (
          <div className="mt-5 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm font-semibold text-teal-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <Link to="/login" className="mt-5 block text-sm font-semibold text-zinc-900 underline">
          Back to login
        </Link>
      </div>
    </section>
  );
};

export default ForgotPasswordPage;
