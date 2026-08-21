from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[3]
DEFAULT_SQLITE_PATH = ROOT_DIR / "data" / "intellisurvey.db"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="INTELLISURVEY_",
        env_file=".env",
        extra="ignore",
    )

    project_name: str = "IntelliSurvey"
    version: str = "0.1.0"
    env: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = f"sqlite:///{DEFAULT_SQLITE_PATH.as_posix()}"
    cors_origins: list[str] = ["http://localhost:5173"]


settings = Settings()
