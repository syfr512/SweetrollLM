from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent.parent


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class AppSettings:
    host: str = os.getenv("SWEETROLL_LM_HOST", "127.0.0.1")
    port: int = int(os.getenv("SWEETROLL_LM_PORT", "7865"))
    root_dir: Path = ROOT_DIR
    package_dir: Path = Path(__file__).resolve().parent
    storage_dir: Path = Path(
        os.getenv("SWEETROLL_LM_STORAGE", str(ROOT_DIR / "storage"))
    ).resolve()
    external_api_fallback_enabled: bool = _env_bool(
        "SWEETROLL_LM_EXTERNAL_API_FALLBACK_ENABLED", True
    )
    external_api_base_url: str = os.getenv(
        "SWEETROLL_LM_EXTERNAL_API_BASE_URL", "http://127.0.0.1:5001/v1"
    )
    external_api_model: str = os.getenv("SWEETROLL_LM_EXTERNAL_API_MODEL", "local-model")
    external_api_key: str = os.getenv("SWEETROLL_LM_EXTERNAL_API_KEY", "")
    native_llama_enabled: bool = _env_bool("SWEETROLL_LM_NATIVE_LLAMA_ENABLED", True)
    koboldcpp_executable_path: str = os.getenv("SWEETROLL_LM_KOBOLDCPP_PATH", "")
    koboldcpp_host: str = os.getenv("SWEETROLL_LM_KOBOLDCPP_HOST", "127.0.0.1")
    koboldcpp_port: int = int(os.getenv("SWEETROLL_LM_KOBOLDCPP_PORT", "5001"))
    koboldcpp_ready_timeout: float = float(
        os.getenv("SWEETROLL_LM_KOBOLDCPP_READY_TIMEOUT", "90")
    )
    koboldcpp_args: str = os.getenv(
        "SWEETROLL_LM_KOBOLDCPP_ARGS",
        '--model "{model}" --port {port} --usecpu --noavx2',
    )

    @property
    def static_dir(self) -> Path:
        return self.package_dir / "static"

    @property
    def models_dir(self) -> Path:
        return self.storage_dir / "models"

    @property
    def characters_dir(self) -> Path:
        return self.storage_dir / "characters"

    @property
    def chats_dir(self) -> Path:
        return self.storage_dir / "chats"

    @property
    def lorebooks_dir(self) -> Path:
        return self.storage_dir / "lorebooks"

    @property
    def extensions_dir(self) -> Path:
        return self.storage_dir / "extensions"


settings = AppSettings()
