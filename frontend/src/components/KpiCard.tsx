interface KpiCardProps {
  label: string;
  value: string;
  helper?: string;
}

export default function KpiCard({ label, value, helper }: KpiCardProps) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/20">
      <p className="text-sm uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      {helper && <p className="text-xs text-slate-400 mt-1">{helper}</p>}
    </div>
  );
}
