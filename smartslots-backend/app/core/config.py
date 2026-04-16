import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "SmartSlots"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "smartslots-secret-key-change-in-production-2024")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smartslots.db")

    class Config:
        env_file = ".env"


settings = Settings()
