import '../styles/kpi-card.css'

type KPICardProps = {
  label: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
}

const formatNumber = (value: number, decimals = 0) =>
  value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })

export default function KPICard({ label, value, prefix = '', suffix = '', decimals = 0 }: KPICardProps) {
  return (
    <article className="kpi-card">
      <h3>{label}</h3>
      <p>
        {prefix}
        {formatNumber(value, decimals)}
        {suffix}
      </p>
    </article>
  )
}
