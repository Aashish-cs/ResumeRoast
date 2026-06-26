import { Download, FileText, Flame, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LockedRewrite from "../components/LockedRewrite";
import RewritePreview from "../components/RewritePreview";
import ScoreBadge from "../components/ScoreBadge";
import { apiRequest, downloadRewrite } from "../lib/api";

const ResultsPage = () => {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState("");

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        const data = await apiRequest(`/analyses/${id}`);
        setAnalysis(data.analysis);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [id]);

  const handleDownload = async (format) => {
    setDownloading(format);
    setError("");

    try {
      await downloadRewrite({ analysisId: id, format });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloading("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-zinc-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading results
      </div>
    );
  }

  if (error && !analysis) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-normal">Roast results</h1>
          <p className="mt-2 text-zinc-600">{analysis.originalFileName}</p>
        </div>
        <Link to="/upload" className="button-secondary">
          Roast another
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <ScoreBadge score={analysis.score} grade={analysis.grade} />

          <div className="panel p-5">
            <div className="mb-4 flex items-center gap-2 font-bold">
              <FileText className="h-4 w-4 text-teal-600" />
              Issues found
            </div>
            <ul className="space-y-3">
              {analysis.issues.map((issue) => (
                <li key={issue} className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-700">
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="roast-panel p-5">
            <div className="mb-3 flex items-center gap-2 text-lg font-black">
              <Flame className="h-5 w-5" />
              The roast
            </div>
            <p className="text-lg font-semibold leading-8">{analysis.roast}</p>
          </div>

          {analysis.rewriteUnlocked ? (
            <div className="panel overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="font-bold">Rewritten resume</div>
                <div className="flex gap-2">
                  <button
                    className="button-secondary"
                    onClick={() => handleDownload("pdf")}
                    disabled={Boolean(downloading)}
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </button>
                  <button
                    className="button-secondary"
                    onClick={() => handleDownload("docx")}
                    disabled={Boolean(downloading)}
                  >
                    <Download className="h-4 w-4" />
                    DOCX
                  </button>
                </div>
              </div>
              <RewritePreview text={analysis.rewrite} />
            </div>
          ) : (
            <LockedRewrite />
          )}
        </div>
      </div>
    </section>
  );
};

export default ResultsPage;
