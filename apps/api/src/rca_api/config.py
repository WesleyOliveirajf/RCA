from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    supabase_url: str
    supabase_service_key: str = ""

    sisplan_odbc_driver: str = "{ODBC Driver 17 for SQL Server}"
    sisplan_dsn: str = ""
    sisplan_host: str = ""
    sisplan_db: str = ""
    sisplan_user: str = ""
    sisplan_pass: str = ""
    sisplan_port: int = 1433
    sisplan_excel_path: str = ""
    sisplan_excel_sheet: str = "Consulta1"
    sisplan_excel_range: str = "A1:T"
    sisplan_excel_odbc_driver: str = "{Microsoft Excel Driver (*.xls, *.xlsx, *.xlsm, *.xlsb)}"

    n8n_webhook_url: str = ""
    n8n_webhook_secret: str = ""

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:5173"
    environment: Literal["development", "staging", "production"] = "development"

    sentry_dsn: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
