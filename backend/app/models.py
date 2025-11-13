from datetime import date
from typing import List
from pydantic import BaseModel, Field


class CampaignInsight(BaseModel):
    campaign_id: str = Field(..., description="Unique identifier for the campaign")
    campaign_name: str
    objective: str
    spend: float
    impressions: int
    clicks: int
    ctr: float = Field(..., description="Click-through rate as a percentage")
    cpc: float = Field(..., description="Cost per click")
    cpm: float = Field(..., description="Cost per mille")
    frequency: float
    purchases: int
    purchase_value: float
    purchase_roas: float


class InsightsResponse(BaseModel):
    brand: str
    date_generated: date
    kpis: dict
    campaigns: List[CampaignInsight]


class DiagnosticAlert(BaseModel):
    level: str = Field(..., description="Severity level, e.g., warning or critical")
    message: str
    campaign_id: str
    metric: str


class DiagnosticsResponse(BaseModel):
    brand: str
    alerts: List[DiagnosticAlert]
