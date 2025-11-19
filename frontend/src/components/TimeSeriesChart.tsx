import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimeSeriesPoint } from "../types/dashboard";

interface Props {
  data: TimeSeriesPoint[];
}

function formatCurrency(value: number | string): string {
  const num = typeof value === "number" ? value : Number(value);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function TimeSeriesChart({ data }: Props) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-lg font-semibold">Desempenho diário</p>
          <p className="text-sm text-slate-400">Investimento x Resultados</p>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 0 }}>
            <defs>
              <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorResults" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis yAxisId="left" stroke="#94a3b8" tickFormatter={(v) => formatCurrency(v).replace("R$", "R$")} />
            <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                borderColor: "#1e293b",
                borderRadius: "0.75rem",
              }}
              formatter={(value, name) => {
                if (name === "spend") {
                  return [formatCurrency(Number(value)), "Investimento"];
                }
                return [Number(value).toLocaleString("pt-BR"), "Resultados"];
              }}
              labelFormatter={(label) => `Dia ${label}`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="spend"
              name="Investimento"
              stroke="#6366f1"
              fillOpacity={1}
              fill="url(#colorSpend)"
              yAxisId="left"
            />
            <Area
              type="monotone"
              dataKey="results"
              name="Resultados"
              stroke="#14b8a6"
              fillOpacity={1}
              fill="url(#colorResults)"
              yAxisId="right"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
