from functools import lru_cache
from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    meta_access_token: str = Field(..., env="META_ACCESS_TOKEN")
    meta_ad_account_id: str = Field(..., env="META_AD_ACCOUNT_ID")
    meta_api_version: str = Field("v17.0", env="META_API_VERSION")
    openai_api_key: str = Field(..., env="OPENAI_API_KEY")
    system_brand_name: str = Field("Space Tênis", env="SYSTEM_BRAND_NAME")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
