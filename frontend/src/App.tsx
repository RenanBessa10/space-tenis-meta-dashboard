import { useCallback, useEffect, useMemo, useState } from 'react'
import KPICard from './components/KPICard'
import CampaignTable from './components/CampaignTable'
import AlertsPanel from './components/AlertsPanel'
import PerformanceChart from './components/PerformanceChart'
import './styles/app.css'

type CampaignInsight = {
  campaign_id: string
  campaign_name: string
  objective: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  cpm: number
  frequency: number
  purchases: number
  purchase_value: number
  purchase_roas: number
}

type InsightsResponse = {
  brand: string
  date_generated: string
  kpis: Record<string, number>
  campaigns: CampaignInsight[]
}

type DiagnosticAlert = {
  level: string
  message: string
  campaign_id: string
  metric: string
}

type DiagnosticsResponse = {
  brand: string
  alerts: DiagnosticAlert[]
}

const API_BASE_URL = 'http://localhost:8000/meta'

function App() {
  const [insights, setInsights] = useState<InsightsResponse | null>(null)
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [insightsResponse, diagnosticsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/insights`),
        fetch(`${API_BASE_URL}/diagnostics`)
      ])

      if (!insightsResponse.ok || !diagnosticsResponse.ok) {
        throw new Error('Não foi possível carregar os dados. Verifique o backend.')
      }

      const insightsData: InsightsResponse = await insightsResponse.json()
      const diagnosticsData: DiagnosticsResponse = await diagnosticsResponse.json()

      setInsights(insightsData)
      setDiagnostics(diagnosticsData)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Erro inesperado ao carregar dados')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const kpiCards = useMemo(() => {
    if (!insights?.kpis) return []
    const mapping: Record<string, { label: string; prefix?: string; suffix?: string; decimals?: number }> = {
      spend: { label: 'Investimento', prefix: 'R$ ', decimals: 2 },
      impressions: { label: 'Impressões' },
      clicks: { label: 'Cliques' },
      ctr: { label: 'CTR', suffix: '%', decimals: 2 },
      cpc: { label: 'CPC', prefix: 'R$ ', decimals: 2 },
      cpm: { label: 'CPM', prefix: 'R$ ', decimals: 2 },
      roas: { label: 'ROAS', decimals: 2 }
    }

    return Object.entries(mapping).map(([key, meta]) => ({
      key,
      label: meta.label,
      value: insights.kpis[key] ?? 0,
      prefix: meta.prefix,
      suffix: meta.suffix,
      decimals: meta.decimals
    }))
  }, [insights])

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Space Tênis – Meta Ads Performance</h1>
          <p className="subtitle">Monitoramento diário das campanhas e diagnóstico inteligente.</p>
        </div>
        <button className="refresh-button" onClick={() => void fetchData()} disabled={isLoading}>
          {isLoading ? 'Atualizando...' : 'Atualizar dados'}
        </button>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <section className="kpi-grid">
        {kpiCards.map((kpi) => (
          <KPICard
            key={kpi.key}
            label={kpi.label}
            value={kpi.value}
            prefix={kpi.prefix}
            suffix={kpi.suffix}
            decimals={kpi.decimals}
          />
        ))}
      </section>

      <section className="content-grid">
        <div className="campaigns-panel">
          <h2>Campanhas</h2>
          <CampaignTable campaigns={insights?.campaigns ?? []} isLoading={isLoading} />
        </div>
        <div className="alerts-panel">
          <h2>Alertas</h2>
          <AlertsPanel alerts={diagnostics?.alerts ?? []} isLoading={isLoading} />
        </div>
      </section>

      <section className="charts-panel">
        <h2>Performance de Conversão</h2>
        <PerformanceChart campaigns={insights?.campaigns ?? []} />
      </section>
    </div>
  )
}

export default App
