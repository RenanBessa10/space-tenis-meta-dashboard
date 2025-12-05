from typing import Any, Dict, List

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _sample_meta_payload() -> List[Dict[str, Any]]:
    return [
        {
            "campaign_id": "123",
            "campaign_name": "Campanha Teste",
            "objective": "CONVERSIONS",
            "impressions": "1000",
            "clicks": "80",
            "spend": "120.50",
            "actions": [{"action_type": "purchase", "value": "6"}],
            "action_values": [{"action_type": "purchase", "value": "720.00"}],
        },
        {
            "campaign_id": "456",
            "campaign_name": "Campanha Awareness",
            "objective": "AWARENESS",
            "impressions": "5000",
            "clicks": "60",
            "spend": "200.00",
            "actions": [],
            "action_values": [],
        },
    ]


def test_meta_insights_response(monkeypatch):
    from app import routes_meta

    def mock_fetch_insights_from_meta(*args: Any, **kwargs: Any):  # type: ignore[unused-argument]
        return _sample_meta_payload()

    monkeypatch.setattr(routes_meta, "fetch_insights_from_meta", mock_fetch_insights_from_meta)

    response = client.get("/meta/insights")

    assert response.status_code == 200
    data = response.json()

    assert "summary" in data
    assert "campaigns" in data
    assert "insights" in data

    summary = data["summary"]
    assert summary["total_spend"] == 320.5
    assert summary["total_impressions"] == 6000
    assert summary["total_clicks"] == 140
    assert summary["total_conversions"] == 6

    campaigns = data["campaigns"]
    assert len(campaigns) == 2
    assert campaigns[0]["campaign_name"] == "Campanha Teste"
    assert campaigns[0]["conversions"] == 6
    assert campaigns[0]["roas"] == pytest.approx(5.9751, rel=1e-3)

    insights = data["insights"]
    assert isinstance(insights, list)
    assert len(insights) >= 2
    assert any("CTR" in insight for insight in insights)
