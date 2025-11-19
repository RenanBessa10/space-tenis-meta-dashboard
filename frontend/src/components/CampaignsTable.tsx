import { useMemo, useState } from "react";
import type { CampaignRow } from "../types/dashboard";

interface Props {
  campaigns: CampaignRow[];
}

type SortKey = keyof Pick<
  CampaignRow,
  | "campaign_name"
  | "spend"
  | "impressions"
  | "reach"
  | "clicks"
  | "ctr"
  | "cpc"
  | "cpm"
  | "results"
  | "roas"
>;

const columns: { key: SortKey; label: string; isCurrency?: boolean; suffix?: string }[] = [
  { key: "campaign_name", label: "Campanha" },
  { key: "spend", label: "Investimento", isCurrency: true },
  { key: "impressions", label: "Impressões" },
  { key: "reach", label: "Alcance" },
  { key: "clicks", label: "Cliques" },
  { key: "ctr", label: "CTR", suffix: "%" },
  { key: "cpc", label: "CPC", isCurrency: true },
  { key: "cpm", label: "CPM", isCurrency: true },
  { key: "results", label: "Resultados" },
  { key: "roas", label: "ROAS" },
];

function formatCurrency(value?: number | null) {
  if (!value && value !== 0) return "-";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CampaignsTable({ campaigns }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const data = [...campaigns];
    data.sort((a, b) => {
      const valA = (a[sortKey] as number) ?? 0;
      const valB = (b[sortKey] as number) ?? 0;
      if (valA === valB) return 0;
      return direction === "asc" ? valA - valB : valB - valA;
    });
    return data;
  }, [campaigns, direction, sortKey]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("desc");
    }
  }

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-lg font-semibold">Campanhas</p>
          <p className="text-sm text-slate-400">Ordenação: {columns.find((c) => c.key === sortKey)?.label}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="py-2 px-3 cursor-pointer select-none"
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && <span>{direction === "asc" ? "▲" : "▼"}</span>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((campaign) => (
              <tr
                key={campaign.campaign_id}
                className="border-t border-slate-800 hover:bg-slate-800/50 transition"
              >
                {columns.map((col) => {
                  const raw = campaign[col.key];
                  let value: string;
                  if (col.isCurrency) {
                    value = typeof raw === "number" ? formatCurrency(raw) : "-";
                  } else if (typeof raw === "number") {
                    value = raw.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
                  } else if (raw) {
                    value = String(raw);
                  } else {
                    value = "-";
                  }
                  if (col.suffix && raw !== null && raw !== undefined && value !== "-") {
                    value = `${value}${col.suffix}`;
                  }
                  return (
                    <td key={col.key} className="py-2 px-3 whitespace-nowrap text-slate-100">
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
