import { Flame, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const destination = location.state?.from?.pathname || "/dashboard";

  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(form);
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="panel p-6">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-600 text-white">
            <Flame className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-black">Log in</h1>
            <p className="text-sm text-zinc-500">Welcome back to ResumeRoast.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold" htmlFor="email">
              Email
            </label>
            <input
              className="input mt-1"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={updateField}
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="password">
              Password
            </label>
            <input
              className="input mt-1"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={updateField}
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <button className="button-primary w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Log in
          </button>
        </form>

        <div className="mt-5 flex flex-col gap-2 text-sm text-zinc-600">
          <Link to="/forgot-password" className="font-semibold text-zinc-900 underline">
            Forgot password?
          </Link>
          <span>
            New here?{" "}
            <Link to="/signup" className="font-semibold text-zinc-900 underline">
              Create an account
            </Link>
          </span>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
