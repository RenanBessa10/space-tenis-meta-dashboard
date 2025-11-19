import { useEffect, useState } from "react";

interface FiltersBarProps {
  dateStart: string;
  dateEnd: string;
  onApply: (start: string, end: string) => void;
}

export default function FiltersBar({ dateStart, dateEnd, onApply }: FiltersBarProps) {
  const [start, setStart] = useState(dateStart);
  const [end, setEnd] = useState(dateEnd);

  useEffect(() => {
    setStart(dateStart);
    setEnd(dateEnd);
  }, [dateStart, dateEnd]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col md:flex-row gap-3 w-full">
        <label className="flex flex-col text-sm text-slate-300 w-full md:w-1/2">
          Data inicial
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1 rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </label>
        <label className="flex flex-col text-sm text-slate-300 w-full md:w-1/2">
          Data final
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="mt-1 rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </label>
      </div>
      <button
        className="w-full md:w-auto bg-brand-600 hover:bg-brand-500 transition text-white font-semibold rounded-xl px-5 py-2"
        onClick={() => onApply(start, end)}
      >
        Aplicar filtros
      </button>
    </div>
  );
}
