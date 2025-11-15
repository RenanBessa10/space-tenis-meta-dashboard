from typing import List, Optional

from fastapi import APIRouter, Query

from .meta_client import MetaAPIError, fetch_insights_from_meta
from .schemas import CampaignInsight, MetaDashboardResponse

router = APIRouter(prefix="/meta", tags=["meta"])


def _safe_float(value: Optional[object]) -> float:
    try:
        return float(value) if value is not None else 0.0
    except (TypeError, ValueError):
        return 0.0


@router.get("/insights", response_model=MetaDashboardResponse)
def get_meta_insights(
    date_preset: Optional[str] = Query("last_7d"),
    since: Optional[str] = Query(None),
    until: Optional[str] = Query(None),
) -> MetaDashboardResponse:
    """Return account summary, campaign list, and automated insights."""
    try:
        raw = fetch_insights_from_meta(
            date_preset=date_preset,
            since=since,
            until=until,
            limit=200,
        )
    except MetaAPIError as exc:
        return MetaDashboardResponse(
            summary={"error": str(exc)},
            campaigns=[],
            insights=[
                "Não foi possível buscar dados reais da Meta. Verifique o token, ID da conta e versão da API.",
            ],
        )

    campaigns: List[CampaignInsight] = []

    total_spend = 0.0
    total_impressions = 0
    total_clicks = 0
    total_conversions = 0
    total_revenue = 0.0

    for item in raw:
        impressions = int(item.get("impressions", 0) or 0)
        clicks = int(item.get("clicks", 0) or 0)
        spend = _safe_float(item.get("spend"))

        actions = item.get("actions", []) or []
        action_values = item.get("action_values", []) or []

        conversions = 0
        revenue = 0.0

        for action in actions:
            if action.get("action_type") in {"purchase", "offsite_conversion"}:
                conversions += int(action.get("value", 0) or 0)

        for action_value in action_values:
            if action_value.get("action_type") in {"purchase", "offsite_conversion"}:
                revenue += _safe_float(action_value.get("value"))

        ctr = (clicks / impressions * 100) if impressions > 0 else 0.0
        cpc = (spend / clicks) if clicks > 0 else 0.0
        cpm = (spend / impressions * 1000) if impressions > 0 else 0.0
        cpa = (spend / conversions) if conversions > 0 else None
        roas = (revenue / spend) if spend > 0 and revenue > 0 else None

        campaigns.append(
            CampaignInsight(
                campaign_id=item.get("campaign_id", ""),
                campaign_name=item.get("campaign_name", "Sem nome"),
                objective=item.get("objective"),
                impressions=impressions,
                clicks=clicks,
                spend=spend,
                ctr=ctr,
                cpc=cpc,
                cpm=cpm,
                conversions=conversions,
                cpa=cpa,
                roas=roas,
            )
        )

        total_spend += spend
        total_impressions += impressions
        total_clicks += clicks
        total_conversions += conversions
        total_revenue += revenue

    avg_ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0.0
    avg_cpc = (total_spend / total_clicks) if total_clicks > 0 else 0.0
    avg_cpm = (total_spend / total_impressions * 1000) if total_impressions > 0 else 0.0
    avg_cpa = (total_spend / total_conversions) if total_conversions > 0 else None
    avg_roas = (total_revenue / total_spend) if total_spend > 0 and total_revenue > 0 else None

    insights: List[str] = [
        (
            "Investimento total no período: R$ "
            f"{total_spend:.2f} | CTR médio: {avg_ctr:.2f}% | CPC médio: R$ {avg_cpc:.2f}"
        )
    ]

    if avg_cpm > 0:
        insights.append(f"CPM médio: R$ {avg_cpm:.2f}.")

    if avg_cpa:
        insights.append(f"CPA médio: R$ {avg_cpa:.2f}.")

    if avg_roas:
        insights.append(f"ROAS médio: {avg_roas:.2f}x.")

    for campaign in campaigns:
        if avg_ctr > 0 and campaign.ctr < avg_ctr * 0.7:
            insights.append(
                (
                    f"A campanha '{campaign.campaign_name}' está com CTR {campaign.ctr:.2f}% "
                    f"(abaixo da média de {avg_ctr:.2f}%). Vale testar novos criativos ou públicos."
                )
            )

        if avg_cpc > 0 and campaign.cpc > avg_cpc * 1.3:
            insights.append(
                (
                    f"A campanha '{campaign.campaign_name}' está com CPC R$ {campaign.cpc:.2f} "
                    f"(acima da média de R$ {avg_cpc:.2f}). Considere ajustar segmentação ou excluir posicionamentos ruins."
                )
            )

        if avg_roas and campaign.roas and campaign.roas < avg_roas * 0.8:
            insights.append(
                (
                    f"A campanha '{campaign.campaign_name}' apresenta ROAS {campaign.roas:.2f}x "
                    f"(abaixo do ROAS médio de {avg_roas:.2f}x). Avalie otimizações de ofertas e landing pages."
                )
            )

        if avg_cpa and campaign.cpa and campaign.cpa > avg_cpa * 1.2:
            insights.append(
                (
                    f"A campanha '{campaign.campaign_name}' está com CPA R$ {campaign.cpa:.2f}, "
                    f"superior ao CPA médio de R$ {avg_cpa:.2f}."
                )
            )

    summary = {
        "total_spend": total_spend,
        "total_impressions": total_impressions,
        "total_clicks": total_clicks,
        "total_conversions": total_conversions,
        "total_revenue": total_revenue,
        "avg_ctr": avg_ctr,
        "avg_cpc": avg_cpc,
        "avg_cpm": avg_cpm,
        "avg_cpa": avg_cpa,
        "avg_roas": avg_roas,
    }

    return MetaDashboardResponse(
        summary=summary,
        campaigns=campaigns,
        insights=insights,
    )
