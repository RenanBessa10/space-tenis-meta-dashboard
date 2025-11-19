import type { InsightMessage } from "../types/dashboard";

interface Props {
  insights: InsightMessage[];
}

const typeStyles: Record<InsightMessage["type"], string> = {
  success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  warning: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  info: "border-sky-400/30 bg-sky-500/10 text-sky-200",
};

export default function InsightsPanel({ insights }: Props) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/20">
      <p className="text-lg font-semibold mb-2">Insights gerados automaticamente</p>
      <div className="space-y-3">
        {insights.length === 0 && (
          <p className="text-sm text-slate-400">Sem insights para o período selecionado.</p>
        )}
        {insights.map((insight, idx) => (
          <div
            key={`${insight.message}-${idx}`}
            className={`rounded-xl border px-4 py-3 text-sm ${typeStyles[insight.type]}`}
          >
            {insight.message}
          </div>
        ))}
      </div>
    </div>
  );
}
