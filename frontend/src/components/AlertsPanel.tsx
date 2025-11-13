import '../styles/alerts.css'

type Alert = {
  level: string
  message: string
  campaign_id: string
  metric: string
}

type AlertsPanelProps = {
  alerts: Alert[]
  isLoading: boolean
}

const levelToLabel: Record<string, string> = {
  warning: 'Atenção',
  info: 'Info',
  critical: 'Crítico'
}

export default function AlertsPanel({ alerts, isLoading }: AlertsPanelProps) {
  if (isLoading && alerts.length === 0) {
    return <div className="alerts-loading">Carregando alertas...</div>
  }

  if (!isLoading && alerts.length === 0) {
    return <div className="alerts-empty">Nenhum alerta no momento. Ótimo trabalho! 🚀</div>
  }

  return (
    <ul className="alerts-list">
      {alerts.map((alert) => (
        <li key={`${alert.campaign_id}-${alert.metric}`} className={`alert-item ${alert.level}`}>
          <div className="alert-header">
            <span className="level-tag">{levelToLabel[alert.level] ?? alert.level}</span>
            <span className="campaign-tag">{alert.campaign_id}</span>
          </div>
          <p>{alert.message}</p>
        </li>
      ))}
    </ul>
  )
}
