import { Flame, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DEMO_CREDENTIALS = {
  email: "demo@resumeroast.dev",
  password: "DemoPass123!"
};

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

  const submitCredentials = async (credentials) => {
    setLoading(true);
    setError("");

    try {
      await login(credentials);
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await submitCredentials(form);
  };

  const loginWithDemo = async () => {
    setForm(DEMO_CREDENTIALS);
    await submitCredentials(DEMO_CREDENTIALS);
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

        <div className="mb-5 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm">
          <div className="font-black text-zinc-950">Recruiter demo login</div>
          <div className="mt-3 grid gap-2 text-zinc-700">
            <div className="flex items-center justify-between gap-3">
              <span className="shrink-0 font-semibold">Username</span>
              <span className="min-w-0 break-all text-right font-mono text-xs">
                {DEMO_CREDENTIALS.email}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="shrink-0 font-semibold">Password</span>
              <span className="min-w-0 break-all text-right font-mono text-xs">
                {DEMO_CREDENTIALS.password}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="button-secondary mt-4 w-full border-orange-200 bg-white"
            onClick={loginWithDemo}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Log in with demo
          </button>
          <p className="mt-3 text-xs leading-5 text-zinc-500">
            Shared portfolio account. Please do not upload private resumes.
          </p>
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
