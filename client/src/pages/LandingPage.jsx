import { CheckCircle2, Flame, Gauge, Lock, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";

const LandingPage = () => (
  <>
    <section
      className="relative overflow-hidden bg-zinc-950 text-white"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(24,24,27,0.94), rgba(24,24,27,0.72), rgba(24,24,27,0.4)), url('/resume-preview.png')",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <div className="mx-auto flex min-h-[620px] max-w-6xl items-center px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-orange-100 backdrop-blur">
            <Flame className="h-4 w-4" />
            1 free roast and rewrite.
          </div>
          <h1 className="mt-6 text-5xl font-black leading-tight tracking-normal sm:text-6xl">
            ResumeRoast
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-100">
            Upload a PDF resume, get an ATS score, a blunt roast, a clear list
            of fixes, and a rewritten resume.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/upload" className="button-primary bg-orange-600 hover:bg-orange-500">
              <UploadCloud className="h-4 w-4" />
              Upload resume
            </Link>
            <Link
              to="/pricing"
              className="button-secondary border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              See pricing
            </Link>
          </div>
        </div>
      </div>
    </section>

    <section className="border-y border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:grid-cols-3 sm:px-6">
        {[
          ["ATS score", "A 0-100 score with a recruiter-friendly letter grade.", Gauge],
          ["Free roast", "Specific weaknesses shown before any payment step.", Flame],
          ["Free rewrite", "The first analysis includes full rewritten resume text.", Lock]
        ].map(([title, copy, Icon]) => (
          <div key={title} className="flex gap-3 rounded-lg border border-zinc-200 p-4">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
            <div>
              <h2 className="font-bold">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-600">{copy}</p>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 className="text-3xl font-black tracking-normal">
            Built for a quick honest read.
          </h2>
          <p className="mt-4 max-w-2xl text-zinc-600">
            The free tier is intentionally useful: score, roast, issues, and
            rewrites. The paid tier adds 10 analyses per day.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              "1 free analysis per account",
              "Server-side subscription checks",
              "PDF text extraction before AI calls",
              "Stripe webhook status sync"
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-5">
          <div className="text-sm font-bold uppercase text-zinc-500">Pricing teaser</div>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-5xl font-black">$9</span>
            <span className="pb-2 text-zinc-500">per month</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-600">
            10 analyses/day, full rewritten resumes, and PDF/DOCX downloads.
          </p>
          <Link to="/pricing" className="button-primary mt-5 w-full">
            Upgrade
          </Link>
        </div>
      </div>
    </section>
  </>
);

export default LandingPage;
