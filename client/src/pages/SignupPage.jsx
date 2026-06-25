import { Flame, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const securityQuestions = [
  "What city were you born in?",
  "What was the name of your first school?",
  "What is your favorite teacher's name?",
  "What was your childhood nickname?"
];

const SignupPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    securityQuestion: securityQuestions[0],
    securityAnswer: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();

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
      await signup(form);
      navigate("/upload");
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
            <h1 className="text-2xl font-black">Create account</h1>
            <p className="text-sm text-zinc-500">Two free roasts per account.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold" htmlFor="name">
              Name
            </label>
            <input
              className="input mt-1"
              id="name"
              name="name"
              value={form.name}
              onChange={updateField}
              required
            />
          </div>
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
              autoComplete="new-password"
              minLength={8}
              value={form.password}
              onChange={updateField}
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="securityQuestion">
              Security question
            </label>
            <select
              className="input mt-1"
              id="securityQuestion"
              name="securityQuestion"
              value={form.securityQuestion}
              onChange={updateField}
              required
            >
              {securityQuestions.map((question) => (
                <option key={question} value={question}>
                  {question}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="securityAnswer">
              Security answer
            </label>
            <input
              className="input mt-1"
              id="securityAnswer"
              name="securityAnswer"
              value={form.securityAnswer}
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
            Create account
          </button>
        </form>

        <div className="mt-5 text-sm text-zinc-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-zinc-900 underline">
            Log in
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SignupPage;
