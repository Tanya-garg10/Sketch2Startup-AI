from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./dev.db"
    cors_origins: str = "http://localhost:5173"
    firebase_project_id: str = ""
    firebase_storage_bucket: str = ""
    firebase_service_account_json: str = ""
    openai_api_key: str = ""

    class Config:
        env_file = "../.env"


settings = Settings()
