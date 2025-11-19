from typing import List, Optional

from pydantic import BaseModel


class KPIResponse(BaseModel):
    spend: float
    revenue: Optional[float]
    roas: Optional[float]
    clicks: int
    impressions: int
    reach: int
    ctr: Optional[float]
    cpc: Optional[float]
    cpm: Optional[float]
    results: int


class TimeSeriesPoint(BaseModel):
    date: str
    spend: float
    clicks: int
    impressions: int
    results: int
    revenue: Optional[float]


class CampaignRow(BaseModel):
    campaign_id: str
    campaign_name: str
    spend: float
    clicks: int
    impressions: int
    reach: int
    results: int
    revenue: Optional[float]
    ctr: Optional[float]
    cpc: Optional[float]
    cpm: Optional[float]
    roas: Optional[float]


class InsightMessage(BaseModel):
    type: str
    message: str


class DashboardSummaryResponse(BaseModel):
    kpis: KPIResponse
    timeseries: List[TimeSeriesPoint]
    campaigns: List[CampaignRow]
    insights: List[InsightMessage]


class DashboardQueryParams(BaseModel):
    date_start: str
    date_end: str
