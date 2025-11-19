from collections import defaultdict
from typing import Any, Dict, List, Tuple

from .models import (
    CampaignRow,
    DashboardSummaryResponse,
    InsightMessage,
    KPIResponse,
    TimeSeriesPoint,
)

CONVERSION_ACTIONS = {
    "purchase",
    "subscribe",
    "complete_registration",
    "lead",
    "add_payment_info",
}


def _to_float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _to_int(value: Any) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def _extract_actions(insight: Dict[str, Any]) -> Tuple[int, float]:
    actions = insight.get("actions") or []
    action_values = insight.get("action_values") or []
    results = 0
    revenue = 0.0

    for action in actions:
        if action.get("action_type") in CONVERSION_ACTIONS:
            results += _to_int(action.get("value"))

    for action in action_values:
        if action.get("action_type") in CONVERSION_ACTIONS:
            revenue += _to_float(action.get("value"))

    return results, revenue


def _calc_ratios(spend: float, clicks: int, impressions: int, revenue: float):
    ctr = (clicks / impressions) if impressions > 0 else None
    cpc = (spend / clicks) if clicks > 0 else None
    cpm = (spend / impressions * 1000) if impressions > 0 else None
    roas = (revenue / spend) if spend > 0 and revenue > 0 else None
    return ctr, cpc, cpm, roas


def _build_kpis(insights: List[Dict[str, Any]]) -> Tuple[KPIResponse, Dict[str, Any]]:
    totals = defaultdict(float)
    totals_int = defaultdict(int)

    for insight in insights:
        totals["spend"] += _to_float(insight.get("spend"))
        totals_int["clicks"] += _to_int(insight.get("clicks"))
        totals_int["impressions"] += _to_int(insight.get("impressions"))
        totals_int["reach"] += _to_int(insight.get("reach"))
        results, revenue = _extract_actions(insight)
        totals_int["results"] += results
        totals["revenue"] += revenue

    ctr, cpc, cpm, roas = _calc_ratios(
        totals["spend"], totals_int["clicks"], totals_int["impressions"], totals["revenue"]
    )

    kpis = KPIResponse(
        spend=round(totals["spend"], 2),
        revenue=round(totals["revenue"], 2) if totals["revenue"] else None,
        roas=round(roas, 2) if roas is not None else None,
        clicks=totals_int["clicks"],
        impressions=totals_int["impressions"],
        reach=totals_int["reach"],
        ctr=round(ctr * 100, 2) if ctr is not None else None,
        cpc=round(cpc, 2) if cpc is not None else None,
        cpm=round(cpm, 2) if cpm is not None else None,
        results=totals_int["results"],
    )

    context = {
        "totals": totals,
        "totals_int": totals_int,
    }
    return kpis, context


def _build_timeseries(insights: List[Dict[str, Any]]) -> List[TimeSeriesPoint]:
    grouped: Dict[str, Dict[str, float]] = defaultdict(lambda: defaultdict(float))

    for insight in insights:
        day = insight.get("date_start")
        spend = _to_float(insight.get("spend"))
        clicks = _to_int(insight.get("clicks"))
        impressions = _to_int(insight.get("impressions"))
        results, revenue = _extract_actions(insight)

        grouped[day]["spend"] += spend
        grouped[day]["clicks"] += clicks
        grouped[day]["impressions"] += impressions
        grouped[day]["results"] += results
        grouped[day]["revenue"] += revenue

    series = []
    for day in sorted(grouped.keys()):
        bucket = grouped[day]
        series.append(
            TimeSeriesPoint(
                date=day,
                spend=round(bucket["spend"], 2),
                clicks=int(bucket["clicks"]),
                impressions=int(bucket["impressions"]),
                results=int(bucket["results"]),
                revenue=round(bucket["revenue"], 2) if bucket["revenue"] else None,
            )
        )
    return series


def _build_campaign_rows(insights: List[Dict[str, Any]]) -> List[CampaignRow]:
    grouped: Dict[str, Dict[str, Any]] = {}

    for insight in insights:
        campaign_id = insight.get("campaign_id") or "unknown"
        bucket = grouped.setdefault(
            campaign_id,
            {
                "campaign_name": insight.get("campaign_name") or "Sem nome",
                "spend": 0.0,
                "clicks": 0,
                "impressions": 0,
                "reach": 0,
                "results": 0,
                "revenue": 0.0,
            },
        )
        bucket["spend"] += _to_float(insight.get("spend"))
        bucket["clicks"] += _to_int(insight.get("clicks"))
        bucket["impressions"] += _to_int(insight.get("impressions"))
        bucket["reach"] += _to_int(insight.get("reach"))
        results, revenue = _extract_actions(insight)
        bucket["results"] += results
        bucket["revenue"] += revenue

    rows: List[CampaignRow] = []
    for campaign_id, values in grouped.items():
        ctr, cpc, cpm, roas = _calc_ratios(
            values["spend"], values["clicks"], values["impressions"], values["revenue"]
        )
        rows.append(
            CampaignRow(
                campaign_id=campaign_id,
                campaign_name=values["campaign_name"],
                spend=round(values["spend"], 2),
                clicks=values["clicks"],
                impressions=values["impressions"],
                reach=values["reach"],
                results=values["results"],
                revenue=round(values["revenue"], 2) if values["revenue"] else None,
                ctr=round(ctr * 100, 2) if ctr is not None else None,
                cpc=round(cpc, 2) if cpc is not None else None,
                cpm=round(cpm, 2) if cpm is not None else None,
                roas=round(roas, 2) if roas is not None else None,
            )
        )

    rows.sort(key=lambda r: r.spend, reverse=True)
    return rows


def _generate_insights(campaigns: List[CampaignRow], context: Dict[str, Any]) -> List[InsightMessage]:
    insights: List[InsightMessage] = []
    if not campaigns:
        return insights

    best_roas = max(campaigns, key=lambda c: c.roas or 0)
    if best_roas.roas:
        insights.append(
            InsightMessage(
                type="success",
                message=(
                    f"{best_roas.campaign_name} tem o melhor ROAS ({best_roas.roas:.2f}). "
                    "Considere aumentar o investimento."
                ),
            )
        )

    avg_cpc = sum((c.cpc or 0) for c in campaigns if c.cpc) / max(
        1, len([c for c in campaigns if c.cpc])
    )
    worst_cpc = max(campaigns, key=lambda c: c.cpc or 0)
    if worst_cpc.cpc and avg_cpc and worst_cpc.cpc > avg_cpc * 1.3:
        insights.append(
            InsightMessage(
                type="warning",
                message=(
                    f"{worst_cpc.campaign_name} apresenta CPC {worst_cpc.cpc:.2f} (30% acima da média). "
                    "Teste novos criativos ou segmentações."
                ),
            )
        )

    totals = context.get("totals", {})
    totals_int = context.get("totals_int", {})
    impressions = totals_int.get("impressions", 0)
    spend = totals.get("spend", 0)
    if impressions > 0:
        avg_cpm = (spend / impressions) * 1000
        high_cpm_campaign = max(campaigns, key=lambda c: c.cpm or 0)
        if high_cpm_campaign.cpm and high_cpm_campaign.cpm > avg_cpm * 1.2:
            insights.append(
                InsightMessage(
                    type="warning",
                    message=(
                        f"CPM de {high_cpm_campaign.campaign_name} ({high_cpm_campaign.cpm:.2f}) está bem acima da média. "
                        "Revise segmentações ou frequência."
                    ),
                )
            )

    heavy_spender = max(campaigns, key=lambda c: c.spend)
    if heavy_spender.spend > 0 and (heavy_spender.results or 0) == 0:
        insights.append(
            InsightMessage(
                type="info",
                message=(
                    f"{heavy_spender.campaign_name} consome R$ {heavy_spender.spend:.2f} mas gera poucos resultados. "
                    "Avalie otimizações."
                ),
            )
        )

    return insights


def build_dashboard_summary(insights_raw: List[Dict[str, Any]]) -> DashboardSummaryResponse:
    kpis, context = _build_kpis(insights_raw)
    timeseries = _build_timeseries(insights_raw)
    campaigns = _build_campaign_rows(insights_raw)
    insights = _generate_insights(campaigns, context)

    return DashboardSummaryResponse(
        kpis=kpis,
        timeseries=timeseries,
        campaigns=campaigns,
        insights=insights,
    )
