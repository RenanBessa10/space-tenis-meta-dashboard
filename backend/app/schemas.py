from typing import List, Optional

from pydantic import BaseModel


class CampaignInsight(BaseModel):
    campaign_id: str
    campaign_name: str
    objective: Optional[str]
    impressions: int
    clicks: int
    spend: float
    ctr: float
    cpc: float
    cpm: float
    conversions: int
    cpa: Optional[float]
    roas: Optional[float]


class MetaDashboardResponse(BaseModel):
    summary: dict
    campaigns: List[CampaignInsight]
    insights: List[str]
