import os
from functools import lru_cache
from typing import List
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Tracemind"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    BACKEND_PORT: int = 8000
    FRONTEND_PORT: int = 5173

    # Database Settings
    DATABASE_URL: str = "postgresql+asyncpg://tracemind:tracemind_dev_password@localhost:5432/tracemind"
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_ECHO: bool = False

    # Redis Settings
    REDIS_URL: str = "redis://localhost:6379/0"

    # Authentication Settings
    SECRET_KEY: str = "change-this-to-a-random-secret-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # LLM Settings
    LLM_PROVIDER: str = "ollama"  # ollama, groq, openai_compat
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    OPENAI_COMPAT_BASE_URL: str = ""
    OPENAI_COMPAT_API_KEY: str = ""
    OPENAI_COMPAT_MODEL: str = ""

    # CORS Settings
    CORS_ORIGINS: List[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(",")]
        return v

@lru_cache()
def get_settings() -> Settings:
    """Returns a cached settings object."""
    return Settings()

settings = get_settings()
