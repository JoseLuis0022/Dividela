"""Configuración centralizada del backend, leída de variables de entorno.

Todo lo que dependa de "dónde estamos desplegados" (URLs, puertos, llaves)
vive aquí y nunca hardcodeado, para que el mismo build sirva en local,
LAN o detrás de un Cloudflare Tunnel con solo cambiar el .env.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # URL pública del frontend: se usa para CORS y para construir el link
    # que se codifica en el QR (FRONTEND_BASE_URL + /join/{session_id}).
    frontend_base_url: str = "http://localhost:5173"

    # Ruta del archivo SQLite (montado como volumen en Docker Compose).
    database_path: str = "/data/dividela.db"

    # OpenRouter: modelo de visión para leer los tickets.
    openrouter_api_key: str = ""
    openrouter_model: str = "google/gemini-2.5-flash-lite"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"


@lru_cache
def get_settings() -> Settings:
    return Settings()
