from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Legal Contract AI Backend"
    runtime_dir: Path = Path("./runtime")
    database_url: str = "sqlite:///./runtime/contracts.db"
    templates_path: Path = Path("../article_templates/templates_approved.json")

    ocr_model_id: str = "datalab-to/chandra-ocr-2"
    ocr_batch_size: int = 3
    ocr_max_new_tokens: int = 3120
    ocr_attention_implementation: str = "sdpa"

    qwen_model_id: str = "Qwen/Qwen3.5-4B"
    qwen_max_new_tokens: int = 4196
    qwen_max_input_tokens: int = 4196

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def jobs_dir(self) -> Path:
        return self.runtime_dir / "jobs"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
