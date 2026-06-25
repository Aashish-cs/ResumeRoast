import { Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const LockedRewrite = () => (
  <div className="panel overflow-hidden">
    <div className="border-b border-zinc-200 px-5 py-4">
      <div className="flex items-center gap-2 font-bold">
        <Lock className="h-4 w-4 text-orange-600" />
        Rewritten resume
      </div>
    </div>
    <div className="relative p-5">
      <div className="space-y-3 blur-[3px]">
        <div className="h-4 w-3/4 rounded bg-zinc-200" />
        <div className="h-3 w-full rounded bg-zinc-100" />
        <div className="h-3 w-11/12 rounded bg-zinc-100" />
        <div className="h-3 w-5/6 rounded bg-zinc-100" />
        <div className="h-4 w-1/2 rounded bg-zinc-200" />
        <div className="h-3 w-full rounded bg-zinc-100" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/72 px-4">
        <div className="max-w-sm rounded-lg border border-orange-200 bg-white p-5 text-center shadow-soft">
          <Sparkles className="mx-auto h-7 w-7 text-orange-600" />
          <h3 className="mt-3 text-lg font-black">Unlock the rewrite</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Subscribers get 30 analyses per month and downloadable PDF/DOCX rewrites.
          </p>
          <Link to="/pricing" className="button-primary mt-4 w-full">
            Subscribe to unlock
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default LockedRewrite;
