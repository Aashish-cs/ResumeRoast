import { CreditCard, FileText, Loader2, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";

const DashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [analysisData] = await Promise.all([
          apiRequest("/analyses"),
          refreshUser()
        ]);
        setAnalyses(analysisData.analyses);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [refreshUser]);

  const openPortal = async () => {
    setPortalLoading(true);
    setError("");

    try {
      const data = await apiRequest("/billing/portal-session", { method: "POST" });
      window.location.href = data.url;
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-normal">Dashboard</h1>
          <p className="mt-2 text-zinc-600">Welcome back, {user.name}.</p>
        </div>
        <Link to="/upload" className="button-primary">
          <UploadCloud className="h-4 w-4" />
          New analysis
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="panel p-5">
          <h2 className="font-black">Account</h2>
          <div className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">Email</span>
              <span className="truncate font-semibold">{user.email}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">Free analysis</span>
              <span className="font-semibold">
                {user.hasUsedFreeAnalysis ? "Used" : "Available"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">Subscription</span>
              <span className="rounded-md bg-zinc-100 px-2 py-1 font-semibold capitalize">
                {user.subscriptionStatus.replace("_", " ")}
              </span>
            </div>
          </div>

          <button
            className="button-secondary mt-6 w-full"
            onClick={openPortal}
            disabled={portalLoading}
          >
            {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            Manage billing
          </button>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="font-black">Past analyses</h2>
          </div>

          {loading ? (
            <div className="p-5 text-zinc-500">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              Loading
            </div>
          ) : analyses.length ? (
            <div className="divide-y divide-zinc-200">
              {analyses.map((analysis) => (
                <Link
                  key={analysis.id}
                  to={`/results/${analysis.id}`}
                  className="flex flex-col gap-3 p-5 transition hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-semibold">
                      <FileText className="h-4 w-4 shrink-0 text-teal-600" />
                      <span className="truncate">{analysis.originalFileName}</span>
                    </div>
                    <div className="mt-1 text-sm text-zinc-500">
                      {new Date(analysis.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-zinc-100 px-3 py-1 text-sm font-black">
                      {analysis.grade}
                    </span>
                    <span className="text-sm font-semibold text-zinc-600">
                      {analysis.score}/100
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-zinc-500">
              No analyses yet.
              <div className="mt-4">
                <Link to="/upload" className="button-secondary">
                  Upload a resume
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DashboardPage;
