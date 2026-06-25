const scoreColor = (score) => {
  if (score >= 85) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (score >= 70) return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-red-200 bg-red-50 text-red-800";
};

const ScoreBadge = ({ score, grade }) => (
  <div className={`rounded-lg border p-5 ${scoreColor(score)}`}>
    <div className="text-sm font-semibold uppercase tracking-wide">ATS score</div>
    <div className="mt-2 flex items-end gap-3">
      <span className="text-5xl font-black leading-none">{score}</span>
      <span className="pb-1 text-2xl font-black">/100</span>
      <span className="ml-auto rounded-md bg-white px-3 py-1 text-xl font-black shadow-sm">
        {grade}
      </span>
    </div>
    <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/80">
      <div
        className="h-full rounded-full bg-current transition-all"
        style={{ width: `${score}%` }}
      />
    </div>
  </div>
);

export default ScoreBadge;
