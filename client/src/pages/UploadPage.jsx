import { FileText, Loader2, UploadCloud } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const setPdfFile = (candidate) => {
    setError("");

    if (!candidate) return;

    if (candidate.type !== "application/pdf") {
      setError("Please choose a PDF file.");
      return;
    }

    setFile(candidate);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    setPdfFile(event.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setError("Choose a PDF resume first.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/analyses", {
        method: "POST",
        body: formData
      });
      await refreshUser();
      navigate(`/results/${data.analysis.id}`);
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.code === "FREE_ANALYSIS_USED") {
        setTimeout(() => navigate("/pricing"), 1200);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-normal">Upload your resume</h1>
        <p className="mt-3 max-w-2xl text-zinc-600">
          PDF only. The server extracts text, caps input length, and gates paid rewrite
          generation before calling Claude.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="panel p-5 sm:p-7">
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition ${
            dragging ? "border-orange-500 bg-orange-50" : "border-zinc-300 bg-zinc-50"
          }`}
        >
          <input
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(event) => setPdfFile(event.target.files?.[0])}
          />
          <UploadCloud className="h-12 w-12 text-orange-600" />
          <div className="mt-4 text-lg font-black">Drop PDF here or click to browse</div>
          {file ? (
            <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700">
              <FileText className="h-4 w-4 shrink-0 text-teal-600" />
              <span className="truncate">{file.name}</span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">Maximum size is controlled by the API.</p>
          )}
        </label>

        {loading && (
          <div className="mt-6 space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
              <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
              Analyzing resume
            </div>
            <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-10/12 animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-7/12 animate-pulse rounded bg-zinc-100" />
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <button className="button-primary mt-6 w-full sm:w-auto" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          Roast my resume
        </button>
      </form>
    </section>
  );
};

export default UploadPage;
