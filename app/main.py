import json
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .aggregations import build_dashboard_summary
from .config import get_settings
from .meta_client import MetaAPIError, fetch_insights_from_meta
from .models import DashboardSummaryResponse

settings = get_settings()

DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "https://bolt.new",
]

raw_origins = settings.FRONTEND_ORIGINS
allowed_origins = (
    [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    if raw_origins
    else DEFAULT_ALLOWED_ORIGINS
)

app = FastAPI(title="Space Tênis Meta Dashboard")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


MOCK_PATH = Path(__file__).parent / "mock" / "meta_insights_sample.json"


def load_mock_data() -> list[dict]:
    try:
        with MOCK_PATH.open() as fh:
            payload = json.load(fh)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail="Arquivo de mock não encontrado.") from exc
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail="Não foi possível ler o arquivo de mock.") from exc

    return payload.get("data", payload)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/meta/insights")
def get_meta_insights(
    date_start: str = Query(..., description="Data inicial no formato YYYY-MM-DD"),
    date_end: str = Query(..., description="Data final no formato YYYY-MM-DD"),
):
    try:
        data = fetch_insights_from_meta(date_start, date_end)
        return {"data": data}
    except MetaAPIError as exc:
        mock = load_mock_data()
        return {"data": mock, "source": "mock", "error": str(exc)}


@app.get("/api/dashboard/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    date_start: str = Query(..., description="Data inicial no formato YYYY-MM-DD"),
    date_end: str = Query(..., description="Data final no formato YYYY-MM-DD"),
):
    try:
        insights = fetch_insights_from_meta(date_start, date_end)
    except MetaAPIError:
        insights = load_mock_data()

    if not insights:
        raise HTTPException(status_code=502, detail="Não foi possível obter dados de insights.")

    summary = build_dashboard_summary(insights)
    return summary
