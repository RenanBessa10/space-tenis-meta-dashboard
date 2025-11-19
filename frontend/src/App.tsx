import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import FiltersBar from "./components/FiltersBar";
import KpiCard from "./components/KpiCard";
import TimeSeriesChart from "./components/TimeSeriesChart";
import CampaignsTable from "./components/CampaignsTable";
import InsightsPanel from "./components/InsightsPanel";
import { fetchDashboardSummary } from "./services/api";
import type { DashboardSummaryResponse } from "./types/dashboard";

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatNumber(value?: number | null) {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString("pt-BR");
}

export default function App() {
  const formatDate = (date: Date) => date.toISOString().slice(0, 10);
  const buildInitialStart = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return formatDate(d);
  };

  const [dateStart, setDateStart] = useState(buildInitialStart);
  const [dateEnd, setDateEnd] = useState(() => formatDate(new Date()));
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchDashboardSummary(dateStart, dateEnd);
        if (!cancelled) {
          setData(response);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          const fallbackMessage =
            err instanceof Error ? err.message : "Não foi possível carregar os dados. Tente novamente mais tarde.";
          setError(fallbackMessage);
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [dateStart, dateEnd]);

  function handleApply(start: string, end: string) {
    setDateStart(start);
    setDateEnd(end);
  }

  return (
    <Layout>
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.3em] text-brand-400">Space Tênis</p>
        <h1 className="text-3xl font-semibold">Painel de Campanhas</h1>
        <p className="text-slate-400">Dashboard de Meta Ads com visão executiva.</p>
      </header>

      <FiltersBar dateStart={dateStart} dateEnd={dateEnd} onApply={handleApply} />

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 text-red-200 rounded-2xl p-4">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="text-center text-slate-400">Carregando dados...</div>
      )}

      {data && !isLoading && (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Investimento" value={formatCurrency(data.kpis.spend)} helper="Período selecionado" />
            <KpiCard label="Resultados" value={formatNumber(data.kpis.results)} helper="Conversões" />
            <KpiCard label="ROAS" value={data.kpis.roas ? data.kpis.roas.toFixed(2) : "-"} helper="Retorno sobre gasto" />
            <KpiCard
              label="CPC médio"
              value={data.kpis.cpc ? formatCurrency(data.kpis.cpc) : "-"}
              helper="Custo por clique"
            />
          </section>

          <TimeSeriesChart data={data.timeseries} />

          <CampaignsTable campaigns={data.campaigns} />

          <InsightsPanel insights={data.insights} />
        </div>
      )}
    </Layout>
  );
}
