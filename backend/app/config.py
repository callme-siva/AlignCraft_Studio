"""Configuration settings for AlignCraft Studio."""
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "AlignCraft Studio"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = int(os.getenv("PORT", "8010"))
    
    # API Keys
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", "")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    # Execution mode (Defaults to high-fidelity mock & simulation for instant zero-key runs)
    FORCE_MOCK: bool = os.getenv("FORCE_MOCK", "false").lower() in ("true", "1", "yes")

    # Data directory
    DATA_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
os.makedirs(settings.DATA_DIR, exist_ok=True)
