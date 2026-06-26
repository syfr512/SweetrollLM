from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from .secrets import protect_secret, unprotect_secret


ROOT_DIR = Path(__file__).resolve().parent.parent
AGENT_ENV_KEYS = {
    "GITHUB_TOKEN",
    "SMTP_SERVER",
    "SMTP_PORT",
    "SMTP_EMAIL",
    "SMTP_PASSWORD",
}


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
    external_api_model: str = os.getenv("SWEETROLL_LM_EXTERNAL_API_MODEL", "koboldcpp")
    external_api_key: str = os.getenv("SWEETROLL_LM_EXTERNAL_API_KEY", "")
    ollama_base_url: str = os.getenv(
        "SWEETROLL_LM_OLLAMA_BASE_URL", "http://127.0.0.1:11434"
    )
    native_llama_enabled: bool = _env_bool("SWEETROLL_LM_NATIVE_LLAMA_ENABLED", True)
    native_import_fallback_enabled: bool = _env_bool(
        "SWEETROLL_LM_NATIVE_IMPORT_FALLBACK_ENABLED", True
    )
    max_response_tokens: int = int(os.getenv("SWEETROLL_LM_MAX_RESPONSE_TOKENS", "2048"))
    max_context_tokens: int = int(os.getenv("SWEETROLL_LM_MAX_CONTEXT_TOKENS", "8192"))
    context_safety_tokens: int = int(os.getenv("SWEETROLL_LM_CONTEXT_SAFETY_TOKENS", "256"))
    generation_timeout_seconds: float = float(
        os.getenv("SWEETROLL_LM_GENERATION_TIMEOUT_SECONDS", "300")
    )
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
    def personas_dir(self) -> Path:
        return self.storage_dir / "personas"

    @property
    def lorebooks_dir(self) -> Path:
        return self.storage_dir / "lorebooks"

    @property
    def extensions_dir(self) -> Path:
        return self.storage_dir / "extensions"

    @property
    def assets_dir(self) -> Path:
        return self.storage_dir / "assets"

    @property
    def logs_dir(self) -> Path:
        return self.storage_dir / "logs"

    @property
    def workspace_dir(self) -> Path:
        return self.root_dir / "workspace"

    @property
    def workspace_chats_dir(self) -> Path:
        return self.storage_dir / "workspace_chats"

    @property
    def app_log_path(self) -> Path:
        return self.logs_dir / "sweetrolllm.log"

    @property
    def api_providers_path(self) -> Path:
        return self.storage_dir / "api_providers.json"

    @property
    def app_settings_path(self) -> Path:
        return self.storage_dir / "app_settings.json"

    @property
    def agent_env_path(self) -> Path:
        return self.package_dir / ".env"


def ensure_agent_env_file() -> Path:
    path = settings.agent_env_path
    if not path.exists():
        path.write_text(
            "# SweetrollLM Agentic Workspace credentials.\n"
            "# Values are injected into workspace subprocesses and are never shown in the UI.\n"
            "GITHUB_TOKEN=\n"
            "SMTP_SERVER=\n"
            "SMTP_PORT=587\n"
            "SMTP_EMAIL=\n"
            "SMTP_PASSWORD=\n",
            encoding="utf-8",
        )
        try:
            path.chmod(0o600)
        except OSError:
            pass
    return path


def load_agent_environment() -> dict[str, str]:
    path = ensure_agent_env_file()
    env = dict(os.environ)
    for key, value in _read_agent_env_file(path).items():
        if key in AGENT_ENV_KEYS and value:
            env[key] = unprotect_secret(value)
    for key in AGENT_ENV_KEYS:
        if os.getenv(key):
            env[key] = os.getenv(key, "")
    return env


def agent_secret_values(env: dict[str, str] | None = None) -> list[str]:
    source = env or load_agent_environment()
    return [source[key] for key in AGENT_ENV_KEYS if source.get(key)]


def _read_agent_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return values
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key in AGENT_ENV_KEYS:
            values[key] = value
    return values


def read_agent_env_values() -> dict[str, str]:
    return {
        key: unprotect_secret(value)
        for key, value in _read_agent_env_file(ensure_agent_env_file()).items()
        if key in AGENT_ENV_KEYS
    }


def write_agent_env_values(values: dict[str, str], protect_keys: set[str] | None = None) -> None:
    protect_keys = protect_keys or {"GITHUB_TOKEN", "SMTP_PASSWORD"}
    current = _read_agent_env_file(ensure_agent_env_file())
    next_values = {key: current.get(key, "") for key in AGENT_ENV_KEYS}
    for key, value in values.items():
        if key not in AGENT_ENV_KEYS:
            continue
        value = value.strip()
        if value and key in protect_keys:
            value = protect_secret(value)
        next_values[key] = value
    lines = [
        "# SweetrollLM Agentic Workspace credentials.",
        "# Secret values may be protected with Windows DPAPI and are never shown in the UI.",
    ]
    for key in sorted(AGENT_ENV_KEYS):
        lines.append(f"{key}={_format_env_value(next_values.get(key, ''))}")
    path = ensure_agent_env_file()
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    try:
        path.chmod(0o600)
    except OSError:
        pass


def _format_env_value(value: str) -> str:
    if not value:
        return ""
    if any(char.isspace() for char in value) or any(char in value for char in ['"', "'", "#"]):
        escaped = value.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped}"'
    return value


settings = AppSettings()
