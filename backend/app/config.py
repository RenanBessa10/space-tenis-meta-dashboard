from functools import lru_cache

from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    META_ACCESS_TOKEN: str = Field("", env="META_ACCESS_TOKEN")
    META_AD_ACCOUNT_ID: str = Field("", env="META_AD_ACCOUNT_ID")
    META_API_VERSION: str = Field("v17.0", env="META_API_VERSION")
    OPENAI_API_KEY: str = Field("", env="OPENAI_API_KEY")
    SYSTEM_BRAND_NAME: str = Field("Space Tênis", env="SYSTEM_BRAND_NAME")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Return a cached settings instance."""

    return Settings()
