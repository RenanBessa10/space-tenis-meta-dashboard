import json
from typing import Any, Dict, List, Optional

import requests

from .config import get_settings

settings = get_settings()


class MetaAPIError(Exception):
    """Raised when the Meta Marketing API returns an error."""


def _get_meta_headers() -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.meta_access_token}",
    }


def fetch_insights_from_meta(
    date_preset: Optional[str] = "last_7d",
    since: Optional[str] = None,
    until: Optional[str] = None,
    limit: int = 100,
) -> List[Dict[str, Any]]:
    """Fetch campaign level insights from the Meta Marketing API.

    The request fetches active campaigns only and handles pagination until the
    requested limit is reached.
    """
    base_url = (
        f"https://graph.facebook.com/"
        f"{settings.meta_api_version}/"
        f"{settings.meta_ad_account_id}/insights"
    )

    params: Dict[str, Any] = {
        "fields": ",".join(
            [
                "campaign_id",
                "campaign_name",
                "objective",
                "impressions",
                "clicks",
                "spend",
                "actions",
                "action_values",
            ]
        ),
        "level": "campaign",
        "filtering": json.dumps(
            [
                {
                    "field": "campaign.effective_status",
                    "operator": "IN",
                    "value": ["ACTIVE"],
                }
            ]
        ),
    }

    if date_preset:
        params["date_preset"] = date_preset

    if since and until:
        params.pop("date_preset", None)
        params["time_range"] = json.dumps({"since": since, "until": until})

    all_data: List[Dict[str, Any]] = []
    next_page: Optional[str] = None

    while True:
        if next_page:
            params["after"] = next_page

        response = requests.get(base_url, headers=_get_meta_headers(), params=params, timeout=30)
        if response.status_code != 200:
            raise MetaAPIError(
                f"Erro ao buscar insights da Meta: {response.status_code} - {response.text}"
            )

        payload = response.json()
        insights = payload.get("data", [])
        all_data.extend(insights)

        paging = payload.get("paging", {})
        cursors = paging.get("cursors", {})
        next_page = cursors.get("after")

        if not next_page or len(all_data) >= limit:
            break

    return all_data[:limit]
