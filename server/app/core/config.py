from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    database_url: str = "sqlite:///./dev.db"
    cors_origins: str = "http://localhost:5173"
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    openai_api_key: str = ""
    class Config:
        env_file = "../.env"
settings = Settings()
