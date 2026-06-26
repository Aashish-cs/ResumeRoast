import {
  CheckCircle2,
  FileText,
  Flame,
  Gauge,
  Lock,
  ShieldCheck,
  UploadCloud
} from "lucide-react";
import { Link } from "react-router-dom";

const HeroMockup = () => (
  <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[62%] overflow-hidden lg:block">
    <div className="absolute left-8 top-12 h-[620px] w-[760px] rotate-[-2deg] rounded-lg border border-white/10 bg-zinc-100 shadow-2xl">
      <div className="flex h-12 items-center gap-2 border-b border-zinc-200 bg-white px-5">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-amber-400" />
        <span className="h-3 w-3 rounded-full bg-emerald-400" />
        <span className="ml-4 h-5 w-44 rounded bg-zinc-100" />
      </div>

      <div className="grid h-[568px] grid-cols-[0.82fr_1.18fr] gap-4 bg-zinc-50 p-5">
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-xs font-black uppercase text-emerald-700">
              ATS Score
            </div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-5xl font-black text-emerald-800">
                86<span className="text-xl">/100</span>
              </div>
              <div className="rounded-md bg-white px-3 py-2 text-xl font-black text-emerald-700">
                A-
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white">
              <div className="h-2 w-[86%] rounded-full bg-emerald-700" />
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-center gap-2 font-black text-zinc-950">
              <FileText className="h-4 w-4 text-teal-600" />
              Issues found
            </div>
            <div className="mt-4 space-y-3">
              {[
                "Add impact metrics to project bullets.",
                "Group skills by recruiter scan pattern.",
                "Lead project lines with shipped features."
              ].map((issue) => (
                <div
                  key={issue}
                  className="rounded-md border border-zinc-100 bg-zinc-50 p-3 text-xs font-semibold leading-5 text-zinc-600"
                >
                  {issue}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-center gap-2 font-black text-zinc-950">
              <Flame className="h-4 w-4 text-orange-600" />
              The roast
            </div>
            <p className="mt-3 text-sm font-bold leading-7 text-zinc-800">
              Close to hireable, but a few bullets still hide from metrics.
              The projects are strong. The impact needs to be louder.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <div className="font-black">Rewritten resume</div>
              <div className="flex gap-2">
                <span className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-black">
                  PDF
                </span>
                <span className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-black">
                  DOCX
                </span>
              </div>
            </div>
            <div className="p-5 font-serif text-zinc-900">
              <div className="text-center text-2xl font-bold">Alex Morgan</div>
              <div className="mt-1 text-center text-xs text-zinc-500">
                Austin, TX | alex@example.com | github.com/alexmorgan
              </div>
              {[
                "Summary",
                "Technical Skills",
                "Projects",
                "Experience"
              ].map((section, index) => (
                <div key={section} className="mt-5">
                  <div className="border-b border-zinc-300 pb-1 text-base font-bold">
                    {section}
                  </div>
                  <div className="mt-2 space-y-2">
                    <div
                      className={`h-2 rounded ${
                        index === 0 ? "bg-zinc-700" : "bg-zinc-300"
                      }`}
                    />
                    <div className="h-2 w-[86%] rounded bg-zinc-300" />
                    <div className="h-2 w-[72%] rounded bg-zinc-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="absolute left-[510px] top-[90px] h-[700px] w-1 rotate-[21deg] rounded-full bg-orange-600/70" />
    <div className="absolute left-[430px] top-[78px] h-[720px] w-1 rotate-[-8deg] rounded-full bg-teal-500/70" />
    <div className="absolute left-[470px] top-[92px] h-[700px] w-1 rotate-[-8deg] rounded-full bg-teal-500/50" />
    <div className="absolute bottom-20 left-[190px] rounded-md border border-white/15 bg-zinc-950/80 px-4 py-3 shadow-2xl backdrop-blur">
      <div className="text-xs font-black uppercase text-zinc-400">Parse time</div>
      <div className="mt-1 text-2xl font-black text-white">42s</div>
    </div>
  </div>
);

const LandingPage = () => (
  <>
    <section className="relative overflow-hidden bg-zinc-950 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,24,27,1),rgba(24,24,27,0.92),rgba(24,24,27,0.64))]" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:36px_36px]" />
      <HeroMockup />

      <div className="relative mx-auto flex min-h-[640px] max-w-6xl items-center px-4 py-16 sm:px-6">
        <div className="max-w-2xl lg:max-w-[460px]">
          <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-orange-100 backdrop-blur">
            <Flame className="h-4 w-4" />
            1 free roast and rewrite.
          </div>
          <h1 className="mt-6 text-5xl font-black leading-tight tracking-normal sm:text-6xl">
            ResumeRoast
          </h1>
          <p className="mt-5 max-w-[390px] text-lg leading-8 text-zinc-100">
            Upload a PDF resume, get an ATS score, a blunt roast, a clear list
            of fixes, and a rewritten resume.
          </p>
          <div className="mt-6 grid max-w-[390px] gap-3 text-sm font-semibold text-zinc-200 sm:grid-cols-2">
            <div className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-2">
              0 fake fallbacks
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-2">
              PDF + DOCX
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-2">
              Stripe sandbox
            </div>
          </div>
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
        <div className="panel overflow-hidden">
          <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-4">
            <div className="text-sm font-bold uppercase text-zinc-500">
              Launch-ready pieces
            </div>
          </div>
          <div className="divide-y divide-zinc-100">
            {[
              ["Subscription sync", "Checkout, portal, webhooks, cancellation state.", ShieldCheck],
              ["Useful free tier", "One full analysis and rewrite before payment.", Flame],
              ["Exportable rewrite", "Formatted PDF and DOCX resume downloads.", FileText]
            ].map(([title, copy, Icon]) => (
              <div key={title} className="flex gap-3 px-5 py-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                <div>
                  <div className="font-black">{title}</div>
                  <div className="mt-1 text-sm leading-6 text-zinc-600">{copy}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-zinc-200 p-5">
            <Link to="/pricing" className="button-primary w-full">
              View Pro plan
            </Link>
          </div>
        </div>
      </div>
    </section>
  </>
);

export default LandingPage;
