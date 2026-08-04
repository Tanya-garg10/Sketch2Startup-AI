from pydantic_settings import BaseSettings
from pathlib import Path

# Resolve .env path: look in server directory first, then project root
_server_env = Path(__file__).resolve().parents[2] / ".env"
_root_env = Path(__file__).resolve().parents[3] / ".env"
_env_file = str(_server_env) if _server_env.exists() else str(_root_env)


class Settings(BaseSettings):
    database_url: str = "sqlite:///./dev.db"
    cors_origins: str = "http://localhost:5173"
    firebase_project_id: str = ""
    firebase_storage_bucket: str = ""
    firebase_service_account_json: str = ""
    tavily_api_key: str = ""
    groq_api_key: str = ""
    gemini_api_key: str = ""
    anthropic_api_key: str = ""

    # Demo mode — set explicitly via env var; auto-detected only as fallback
    demo_mode: bool = False

    model_config = {"env_file": _env_file, "extra": "ignore"}

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.demo_mode:
            has_ai = bool(self.tavily_api_key or self.groq_api_key)
            if not has_ai:
                object.__setattr__(self, "demo_mode", True)
                print("Warning: Running in DEMO MODE — no credentials found")
            else:
                active = []
                if self.groq_api_key:    active.append("Groq")
                if self.tavily_api_key:  active.append("Tavily")
                print(f"Running in PRODUCTION MODE — active: {', '.join(active)} (Demo Auth)")


settings = Settings()
