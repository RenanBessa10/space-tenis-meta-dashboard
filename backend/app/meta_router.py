from datetime import date
from typing import List

from fastapi import APIRouter, Depends

from .deps import get_app_settings
from .models import CampaignInsight, DiagnosticsResponse, DiagnosticAlert, InsightsResponse

router = APIRouter(prefix="/meta", tags=["meta"])


_MOCK_INSIGHTS: List[CampaignInsight] = [
    CampaignInsight(
        campaign_id="CAMP001",
        campaign_name="Space Tênis - Conversões",
        objective="CONVERSIONS",
        spend=520.35,
        impressions=42000,
        clicks=560,
        ctr=1.33,
        cpc=0.93,
        cpm=12.39,
        frequency=3.2,
        purchases=48,
        purchase_value=3120.50,
        purchase_roas=5.99,
    ),
    CampaignInsight(
        campaign_id="CAMP002",
        campaign_name="Space Tênis - Reconhecimento",
        objective="AWARENESS",
        spend=310.10,
        impressions=98000,
        clicks=320,
        ctr=0.33,
        cpc=0.97,
        cpm=3.16,
        frequency=1.5,
        purchases=12,
        purchase_value=640.00,
        purchase_roas=2.06,
    ),
    CampaignInsight(
        campaign_id="CAMP003",
        campaign_name="Space Tênis - Remarketing",
        objective="SALES",
        spend=890.00,
        impressions=65000,
        clicks=450,
        ctr=0.69,
        cpc=1.98,
        cpm=13.69,
        frequency=5.2,
        purchases=35,
        purchase_value=2280.00,
        purchase_roas=2.56,
    ),
]


@router.get("/health")
def health_check() -> dict:
    return {"status": "ok"}


def _aggregate_kpis(insights: List[CampaignInsight]) -> dict:
    totals = {
        "spend": sum(item.spend for item in insights),
        "impressions": sum(item.impressions for item in insights),
        "clicks": sum(item.clicks for item in insights),
        "purchases": sum(item.purchases for item in insights),
        "purchase_value": sum(item.purchase_value for item in insights),
    }
    totals["ctr"] = (totals["clicks"] / totals["impressions"] * 100) if totals["impressions"] else 0
    totals["cpc"] = (totals["spend"] / totals["clicks"]) if totals["clicks"] else 0
    totals["cpm"] = (totals["spend"] / totals["impressions"] * 1000) if totals["impressions"] else 0
    totals["roas"] = (totals["purchase_value"] / totals["spend"]) if totals["spend"] else 0
    return totals


@router.get("/insights", response_model=InsightsResponse)
def get_insights(settings=Depends(get_app_settings)) -> InsightsResponse:
    return InsightsResponse(
        brand=settings.system_brand_name,
        date_generated=date.today(),
        kpis=_aggregate_kpis(_MOCK_INSIGHTS),
        campaigns=_MOCK_INSIGHTS,
    )


def _generate_alerts(insights: List[CampaignInsight]) -> List[DiagnosticAlert]:
    alerts: List[DiagnosticAlert] = []
    for insight in insights:
        if insight.ctr < 0.8:
            alerts.append(
                DiagnosticAlert(
                    level="warning",
                    message=f"CTR baixo na campanha {insight.campaign_name} ({insight.ctr:.2f}%).",
                    campaign_id=insight.campaign_id,
                    metric="ctr",
                )
            )
        if insight.cpc > 1.5:
            alerts.append(
                DiagnosticAlert(
                    level="warning",
                    message=f"CPC elevado na campanha {insight.campaign_name} (R$ {insight.cpc:.2f}).",
                    campaign_id=insight.campaign_id,
                    metric="cpc",
                )
            )
        if insight.cpm > 12:
            alerts.append(
                DiagnosticAlert(
                    level="warning",
                    message=f"CPM elevado na campanha {insight.campaign_name} (R$ {insight.cpm:.2f}).",
                    campaign_id=insight.campaign_id,
                    metric="cpm",
                )
            )
        if insight.frequency > 4:
            alerts.append(
                DiagnosticAlert(
                    level="info",
                    message=f"Frequência alta na campanha {insight.campaign_name} ({insight.frequency:.2f}).",
                    campaign_id=insight.campaign_id,
                    metric="frequency",
                )
            )
    return alerts


@router.get("/diagnostics", response_model=DiagnosticsResponse)
def get_diagnostics(settings=Depends(get_app_settings)) -> DiagnosticsResponse:
    return DiagnosticsResponse(
        brand=settings.system_brand_name,
        alerts=_generate_alerts(_MOCK_INSIGHTS),
    )
