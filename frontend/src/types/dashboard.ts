export interface KPIResponse {
  spend: number;
  revenue: number | null;
  roas: number | null;
  clicks: number;
  impressions: number;
  reach: number;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  results: number;
}

export interface TimeSeriesPoint {
  date: string;
  spend: number;
  clicks: number;
  impressions: number;
  results: number;
  revenue: number | null;
}

export interface CampaignRow {
  campaign_id: string;
  campaign_name: string;
  spend: number;
  clicks: number;
  impressions: number;
  reach: number;
  results: number;
  revenue: number | null;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  roas: number | null;
}

export interface InsightMessage {
  type: "warning" | "success" | "info";
  message: string;
}

export interface DashboardSummaryResponse {
  kpis: KPIResponse;
  timeseries: TimeSeriesPoint[];
  campaigns: CampaignRow[];
  insights: InsightMessage[];
}
