import { KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiRequest } from "../lib/api";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const token = searchParams.get("token") || "";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const data = await apiRequest("/auth/reset-password", {
        method: "POST",
        body: { token, password },
        token: null
      });
      setMessage(data.message);
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
        <h1 className="mt-4 text-2xl font-black">Choose a new password</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

          {message && (
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm font-semibold text-teal-800">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <button className="button-primary w-full" disabled={loading || !token}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Reset password
          </button>
        </form>

        <Link to="/login" className="mt-5 block text-sm font-semibold text-zinc-900 underline">
          Back to login
        </Link>
      </div>
    </section>
  );
};

export default ResetPasswordPage;
