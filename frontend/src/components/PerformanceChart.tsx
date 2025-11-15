import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, Line } from 'recharts'
import '../styles/chart.css'

type Campaign = {
  campaign_id: string
  campaign_name: string
  spend: number
  conversions: number
  roas: number | null
}

type PerformanceChartProps = {
  campaigns: Campaign[]
}

export default function PerformanceChart({ campaigns }: PerformanceChartProps) {
  if (campaigns.length === 0) {
    return <div className="chart-empty">Sem dados suficientes para exibir o gráfico.</div>
  }

  const chartData = campaigns.map((campaign) => {
    const roas = campaign.roas ?? 0
    const revenue = roas > 0 ? campaign.spend * roas : 0

    return {
      name: campaign.campaign_name,
      Investimento: Number(campaign.spend.toFixed(2)),
      ReceitaEstimada: Number(revenue.toFixed(2)),
      ROAS: Number(roas.toFixed(2)),
      Conversoes: campaign.conversions
    }
  })

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
          <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} angle={-10} dy={12} />
          <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px'
            }}
          />
          <Legend wrapperStyle={{ color: 'var(--color-text)' }} />
          <Bar dataKey="Investimento" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="ReceitaEstimada" fill="var(--color-secondary)" radius={[6, 6, 0, 0]} />
          <Line type="monotone" dataKey="ROAS" stroke="var(--color-accent)" strokeWidth={3} yAxisId={0} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
