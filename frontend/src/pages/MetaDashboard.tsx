import { useCallback, useEffect, useMemo, useState } from 'react'
import KPICard from '../components/KPICard'
import CampaignTable from '../components/CampaignTable'
import PerformanceChart from '../components/PerformanceChart'
import '../styles/app.css'
import '../styles/insights.css'

type CampaignInsight = {
  campaign_id: string
  campaign_name: string
  objective?: string | null
  impressions: number
  clicks: number
  spend: number
  ctr: number
  cpc: number
  cpm: number
  conversions: number
  cpa: number | null
  roas: number | null
}

type Summary = {
  total_spend?: number
  total_impressions?: number
  total_clicks?: number
  total_conversions?: number
  total_revenue?: number
  avg_ctr?: number
  avg_cpc?: number
  avg_cpm?: number
  avg_cpa?: number | null
  avg_roas?: number | null
  error?: string
}

type MetaDashboardResponse = {
  summary: Summary
  campaigns: CampaignInsight[]
  insights: string[]
}

const API_BASE_URL = 'http://localhost:8000/meta'

const PERIOD_OPTIONS = [
  { value: 'last_7d', label: 'Últimos 7 dias' },
  { value: 'last_30d', label: 'Últimos 30 dias' },
  { value: 'this_month', label: 'Este mês' }
]

export default function MetaDashboard() {
  const [dashboard, setDashboard] = useState<MetaDashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [datePreset, setDatePreset] = useState('last_7d')

  const fetchData = useCallback(async (preset: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const url = new URL(`${API_BASE_URL}/insights`)
      url.searchParams.set('date_preset', preset)

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error('Não foi possível carregar os dados. Verifique o backend.')
      }

      const data: MetaDashboardResponse = await response.json()
      setDashboard(data)

      if (data.summary?.error) {
        setError(data.summary.error)
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Erro inesperado ao carregar dados')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData(datePreset)
  }, [datePreset, fetchData])

  const summary = dashboard?.summary ?? {}
  const campaigns = dashboard?.campaigns ?? []
  const avgCtr = summary.avg_ctr ?? 0

  const kpiCards = useMemo(() => {
    return [
      { key: 'total_spend', label: 'Investimento total', value: summary.total_spend ?? 0, prefix: 'R$ ', decimals: 2 },
      { key: 'avg_ctr', label: 'CTR médio', value: summary.avg_ctr ?? 0, suffix: '%', decimals: 2 },
      { key: 'avg_cpc', label: 'CPC médio', value: summary.avg_cpc ?? 0, prefix: 'R$ ', decimals: 2 },
      { key: 'total_conversions', label: 'Conversões totais', value: summary.total_conversions ?? 0, decimals: 0 },
      { key: 'avg_cpm', label: 'CPM médio', value: summary.avg_cpm ?? 0, prefix: 'R$ ', decimals: 2 },
      { key: 'avg_roas', label: 'ROAS médio', value: summary.avg_roas ?? 0, suffix: 'x', decimals: 2 }
    ]
  }, [summary])

  const insights = dashboard?.insights ?? []

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Space Tênis – Meta Ads Performance</h1>
          <p className="subtitle">Monitoramento inteligente das campanhas com insights automáticos.</p>
        </div>
        <div className="header-actions">
          <select
            className="period-select"
            value={datePreset}
            onChange={(event) => setDatePreset(event.target.value)}
            disabled={isLoading}
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="refresh-button" onClick={() => void fetchData(datePreset)} disabled={isLoading}>
            {isLoading ? 'Atualizando...' : 'Atualizar dados'}
          </button>
        </div>
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
          <CampaignTable campaigns={campaigns} avgCtr={avgCtr} isLoading={isLoading} />
        </div>
        <div className="insights-panel">
          <h2>Insights automáticos</h2>
          {isLoading && insights.length === 0 ? (
            <div className="insights-loading">Carregando insights...</div>
          ) : insights.length === 0 ? (
            <div className="insights-empty">Nenhum insight gerado para o período.</div>
          ) : (
            <ul className="insights-list">
              {insights.map((insight, index) => (
                <li key={`insight-${index}`}>{insight}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="charts-panel">
        <h2>Performance estimada</h2>
        <PerformanceChart campaigns={campaigns} />
      </section>
    </div>
  )
}
