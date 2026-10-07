from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "DevForge AI"
    app_env: str = "development"
    debug: bool = False
    frontend_url: str = "http://localhost:5173"
    secret_key: str = "change-me"
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/devforge"
    access_token_expire_minutes: int = 60


    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()