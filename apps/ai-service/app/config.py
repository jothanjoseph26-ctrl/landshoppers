from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    """Environment-driven settings. Loads from process env (export before uvicorn)."""

    host: str = "0.0.0.0"
    port: int = 8000
    fixture_mode: bool = True
    audit_to_db: bool = False
    database_url: str | None = None
    rate_limit_per_minute: int = 120
    anthropic_api_key: str | None = None
    openai_api_key: str | None = None
    xai_api_key: str | None = None

    @classmethod
    def from_env(cls) -> Settings:
        port_raw = os.getenv("PORT") or os.getenv("AI_SERVICE_PORT") or "8000"
        fixture = os.getenv("AI_FIXTURE_MODE", "true").lower() in ("1", "true", "yes")
        audit_db = os.getenv("AI_AUDIT_TO_DB", "").lower() in ("1", "true", "yes")
        rlm = int(os.getenv("AI_RATE_LIMIT_PER_MINUTE", "120"))
        return cls(
            host=os.getenv("AI_SERVICE_HOST", "0.0.0.0"),
            port=int(port_raw),
            fixture_mode=fixture,
            audit_to_db=audit_db,
            database_url=os.getenv("DATABASE_URL"),
            rate_limit_per_minute=rlm,
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            xai_api_key=os.getenv("XAI_API_KEY"),
        )

    def use_llm(self) -> bool:
        return not self.fixture_mode and bool(
            self.anthropic_api_key or self.openai_api_key or self.xai_api_key
        )


def get_settings() -> Settings:
    return Settings.from_env()
