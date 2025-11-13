import '../styles/table.css'

type Campaign = {
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

type CampaignTableProps = {
  campaigns: Campaign[]
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

export default function CampaignTable({ campaigns, isLoading }: CampaignTableProps) {
  if (isLoading && campaigns.length === 0) {
    return <div className="table-loading">Carregando campanhas...</div>
  }

  if (!isLoading && campaigns.length === 0) {
    return <div className="table-empty">Nenhuma campanha encontrada.</div>
  }

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
            <th>Freq.</th>
            <th>Compras</th>
            <th>Valor</th>
            <th>ROAS</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => (
            <tr key={campaign.campaign_id}>
              <td>{campaign.campaign_name}</td>
              <td>{campaign.objective}</td>
              <td>{formatCurrency(campaign.spend)}</td>
              <td>{campaign.impressions.toLocaleString('pt-BR')}</td>
              <td>{campaign.clicks.toLocaleString('pt-BR')}</td>
              <td>{formatNumber(campaign.ctr)}%</td>
              <td>{formatCurrency(campaign.cpc)}</td>
              <td>{formatCurrency(campaign.cpm)}</td>
              <td>{formatNumber(campaign.frequency)}</td>
              <td>{campaign.purchases}</td>
              <td>{formatCurrency(campaign.purchase_value)}</td>
              <td>{formatNumber(campaign.purchase_roas)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
