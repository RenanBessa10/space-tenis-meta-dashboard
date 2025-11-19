from functools import lru_cache
from typing import Optional

from pydantic import BaseSettings


class Settings(BaseSettings):
    META_ACCESS_TOKEN: str
    META_AD_ACCOUNT_ID: str
    META_API_VERSION: str = "v19.0"
    FRONTEND_ORIGINS: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
