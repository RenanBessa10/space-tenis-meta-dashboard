from datetime import date

from fastapi.testclient import TestClient

from app.main import app
from app.config import Settings
from app.deps import get_app_settings


def override_settings() -> Settings:
    return Settings(
        meta_access_token="test",
        meta_ad_account_id="act_test",
        meta_api_version="v17.0",
        openai_api_key="sk-test",
        system_brand_name="Space Tênis",
    )


def setup_module(module):  # type: ignore[unused-argument]
    app.dependency_overrides[get_app_settings] = override_settings


def teardown_module(module):  # type: ignore[unused-argument]
    app.dependency_overrides.pop(get_app_settings, None)


client = TestClient(app)


def test_health_check():
    response = client.get("/meta/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_insights_response_contains_kpis_and_campaigns():
    response = client.get("/meta/insights")
    assert response.status_code == 200
    data = response.json()

    assert data["brand"] == "Space Tênis"
    assert data["date_generated"] == date.today().isoformat()
    assert "kpis" in data
    assert "campaigns" in data
    assert isinstance(data["campaigns"], list)
    assert len(data["campaigns"]) > 0


def test_diagnostics_returns_alerts():
    response = client.get("/meta/diagnostics")
    assert response.status_code == 200
    data = response.json()

    assert data["brand"] == "Space Tênis"
    assert "alerts" in data
    assert isinstance(data["alerts"], list)
    assert any(alert["metric"] == "ctr" for alert in data["alerts"])
