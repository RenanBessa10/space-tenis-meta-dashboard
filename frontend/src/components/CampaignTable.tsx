import '../styles/table.css'

type Campaign = {
  campaign_id: string
  campaign_name: string
  objective?: string | null
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  cpm: number
  conversions: number
  cpa: number | null
  roas: number | null
}

type CampaignTableProps = {
  campaigns: Campaign[]
  avgCtr: number
  isLoading: boolean
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

const formatNumber = (value: number, decimals = 2) =>
  value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })

export default function CampaignTable({ campaigns, avgCtr, isLoading }: CampaignTableProps) {
  if (isLoading && campaigns.length === 0) {
    return <div className="table-loading">Carregando campanhas...</div>
  }

  if (!isLoading && campaigns.length === 0) {
    return <div className="table-empty">Nenhuma campanha encontrada.</div>
  }

  const lowCtrThreshold = avgCtr > 0 ? avgCtr * 0.7 : 0

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Campanha</th>
            <th>Objetivo</th>
            <th>Investimento</th>
            <th>Impressões</th>
            <th>Cliques</th>
            <th>CTR</th>
            <th>CPC</th>
            <th>CPM</th>
            <th>Conversões</th>
            <th>CPA</th>
            <th>ROAS</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => {
            const isLowCtr = lowCtrThreshold > 0 && campaign.ctr < lowCtrThreshold
            return (
              <tr key={campaign.campaign_id} className={isLowCtr ? 'low-ctr' : undefined}>
                <td>{campaign.campaign_name}</td>
                <td>{campaign.objective ?? '—'}</td>
                <td>{formatCurrency(campaign.spend)}</td>
                <td>{campaign.impressions.toLocaleString('pt-BR')}</td>
                <td>{campaign.clicks.toLocaleString('pt-BR')}</td>
                <td>{formatNumber(campaign.ctr)}%</td>
                <td>{formatCurrency(campaign.cpc)}</td>
                <td>{formatCurrency(campaign.cpm)}</td>
                <td>{campaign.conversions}</td>
                <td>{campaign.cpa ? formatCurrency(campaign.cpa) : '—'}</td>
                <td>{campaign.roas ? `${formatNumber(campaign.roas)}x` : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
