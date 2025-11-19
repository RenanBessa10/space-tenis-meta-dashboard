from typing import Any, Dict, List

import requests
from requests import RequestException

from .config import get_settings


class MetaAPIError(Exception):
    """Raised when the Meta Marketing API request fails."""


BASE_URL = "https://graph.facebook.com"


def _get_meta_headers() -> Dict[str, str]:
    settings = get_settings()
    return {"Authorization": f"Bearer {settings.META_ACCESS_TOKEN}"}


def fetch_insights_from_meta(
    date_start: str,
    date_end: str,
    level: str = "campaign",
) -> List[Dict[str, Any]]:
    settings = get_settings()
    url = f"{BASE_URL}/{settings.META_API_VERSION}/{settings.META_AD_ACCOUNT_ID}/insights"
    params = {
        "time_range[since]": date_start,
        "time_range[until]": date_end,
        "level": level,
        "time_increment": 1,
        "fields": ",".join(
            [
                "campaign_id",
                "campaign_name",
                "date_start",
                "date_stop",
                "impressions",
                "reach",
                "clicks",
                "spend",
                "objective",
                "actions",
                "action_values",
            ]
        ),
    }

    try:
        response = requests.get(url, headers=_get_meta_headers(), params=params, timeout=30)
    except RequestException as exc:
        raise MetaAPIError("Erro de conexão com a Meta Marketing API.") from exc

    if response.status_code != 200:
        raise MetaAPIError(response.text)

    data = response.json()
    if "error" in data:
        raise MetaAPIError(str(data["error"]))

    return data.get("data", [])
