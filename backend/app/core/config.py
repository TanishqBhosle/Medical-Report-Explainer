import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Medical Report Explainer"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "supersecretchangeinproductionsecuritykeyformedsystem"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    ALGORITHM: str = "HS256"

    DATABASE_URL: str = "sqlite:///./medical_explainer.db"
    STORAGE_DIR: str = "./storage"

    MAX_UPLOAD_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    MAX_PAGE_LIMIT: int = 10
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "png", "jpg", "jpeg"]
    ALLOWED_MIME_TYPES: List[str] = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
    ]

    ENVIRONMENT: str = "development"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "*"]

    @field_validator("ALLOWED_EXTENSIONS", "ALLOWED_MIME_TYPES", "CORS_ORIGINS", mode="before")
    def assemble_list(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
