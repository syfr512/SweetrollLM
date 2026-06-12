from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Literal
from pathlib import PurePosixPath

from pydantic import BaseModel, Field, SecretStr, field_validator


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class InferenceSource(str, Enum):
    local = "local"
    cloud = "cloud"


class ChatRole(str, Enum):
    system = "system"
    user = "user"
    assistant = "assistant"


class CloudProvider(str, Enum):
    openai = "openai"
    openrouter = "openrouter"
    custom = "custom"


class PromptTemplate(str, Enum):
    chatml = "chatml"
    llama3 = "llama3"
    mistral = "mistral"
    plain = "plain"


class ChatMessage(BaseModel):
    role: ChatRole
    content: str = Field(min_length=1)
    timestamp: str | None = None


class LocalSettings(BaseModel):
    template: PromptTemplate = PromptTemplate.chatml


class CloudSettings(BaseModel):
    provider: CloudProvider = CloudProvider.openai
    base_url: str = "https://api.openai.com/v1"
    api_key: SecretStr | None = None
    model: str = "gpt-4o-mini"

    @field_validator("base_url")
    @classmethod
    def trim_base_url(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Base URL is required for cloud inference.")
        return value.rstrip("/")


class ApiProviderProfile(BaseModel):
    id: str
    name: str = Field(min_length=1, max_length=120)
    base_url: str = Field(min_length=1)
    api_key: str = ""
    default_model: str = Field(min_length=1)
    is_default: bool = False
    created_at: str
    updated_at: str

    @field_validator("base_url")
    @classmethod
    def trim_provider_base_url(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Base URL is required.")
        return value.rstrip("/")


class ApiProviderSaveRequest(BaseModel):
    id: str | None = None
    name: str = Field(min_length=1, max_length=120)
    base_url: str = Field(min_length=1)
    api_key: str = ""
    default_model: str = Field(min_length=1)
    is_default: bool = False

    @field_validator("base_url")
    @classmethod
    def trim_provider_base_url(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Base URL is required.")
        return value.rstrip("/")


class ChatRequest(BaseModel):
    chat_id: str | None = None
    source: InferenceSource
    messages: list[ChatMessage]
    system_prompt: str = ""
    character_id: str | None = None
    persona_id: str | None = None
    lorebook_id: str | None = None
    lorebook_enabled: bool = False
    vision_context: str = ""
    local: LocalSettings = Field(default_factory=LocalSettings)
    cloud: CloudSettings | None = None
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_p: float = Field(default=0.9, ge=0.0, le=1.0)
    max_tokens: int = Field(default=512, ge=1, le=8192)

    def normalized_messages(self) -> list[ChatMessage]:
        messages: list[ChatMessage] = []
        if self.system_prompt.strip():
            messages.append(
                ChatMessage(role=ChatRole.system, content=self.system_prompt.strip())
            )
        messages.extend(self.messages)
        return messages


class ChatCompletionResponse(BaseModel):
    chat_id: str
    source: str
    text: str


class ImageGenerationRequest(BaseModel):
    provider: Literal["comfyui", "stable_diffusion", "flux", "dalle3", "custom"] = "comfyui"
    endpoint: str = ""
    api_key: SecretStr | None = None
    model: str = ""
    prompt: str = Field(min_length=1, max_length=4000)
    negative_prompt: str = ""
    aspect_ratio: str = "1:1"
    steps: int = Field(default=24, ge=1, le=150)


class ImageGenerationResponse(BaseModel):
    status: Literal["completed", "prepared", "error"]
    message: str
    markdown: str = ""
    image_url: str = ""
    raw: dict[str, Any] = Field(default_factory=dict)


class VisionCaptionRequest(BaseModel):
    provider: Literal["llava", "qwen-vl", "openai", "custom"] = "custom"
    endpoint: str = ""
    api_key: SecretStr | None = None
    filename: str = "attached-image.png"
    data_url: str = Field(min_length=16)
    prompt: str = (
        "Describe this image for an AI roleplay character. Focus on visible subjects, "
        "mood, setting, composition, and details relevant to conversation."
    )


class VisionCaptionResponse(BaseModel):
    status: Literal["completed", "prepared", "error"]
    filename: str
    caption: str
    message: str = ""


class LocalModelLoadRequest(BaseModel):
    path: str
    template: PromptTemplate = PromptTemplate.chatml
    n_ctx: int = Field(default=4096, ge=512, le=131072)
    n_gpu_layers: int = Field(default=0, ge=-1, le=999)
    verbose: bool = False


class LocalModelFile(BaseModel):
    name: str
    path: str
    relative_path: str
    size_bytes: int


class LocalModelStatus(BaseModel):
    loaded: bool
    status: Literal["idle", "launching", "loaded", "error"] = "idle"
    model_path: str | None = None
    template: PromptTemplate | None = None
    n_ctx: int | None = None
    n_gpu_layers: int | None = None
    message: str = ""
    error_code: str | None = None


class ExternalApiFallbackConfig(BaseModel):
    enabled: bool = True
    base_url: str = "http://127.0.0.1:5001/v1"
    model: str = "local-model"
    api_key: SecretStr | None = None

    @field_validator("base_url")
    @classmethod
    def trim_external_base_url(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("External API base URL is required.")
        return value.rstrip("/")

    @field_validator("model")
    @classmethod
    def trim_external_model(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("External API model is required.")
        return value


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    storage_dir: str


class ConsoleLogResponse(BaseModel):
    lines: list[str] = Field(default_factory=list)
    text: str = ""
    truncated: bool = False


class CharacterProfile(BaseModel):
    id: str
    name: str = Field(min_length=1, max_length=120)
    description: str = ""
    personality: str = ""
    scenario: str = ""
    example_dialogue: str = ""
    first_message: str = ""
    avatar_url: str = ""
    avatar_file: str = ""
    created_at: str
    updated_at: str


class CharacterSaveRequest(BaseModel):
    id: str | None = None
    name: str = Field(min_length=1, max_length=120)
    description: str = ""
    personality: str = ""
    scenario: str = ""
    example_dialogue: str = ""
    first_message: str = ""
    avatar_url: str = ""
    avatar_file: str = ""


class AssetSaveRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=180)
    data_url: str = Field(min_length=16)


class AssetFile(BaseModel):
    filename: str
    url: str
    mime_type: str
    size_bytes: int


class UserPersonaProfile(BaseModel):
    id: str
    name: str = Field(min_length=1, max_length=120)
    description: str = ""
    avatar_url: str = ""
    avatar_file: str = ""
    is_default: bool = False
    created_at: str
    updated_at: str


class UserPersonaSaveRequest(BaseModel):
    id: str | None = None
    name: str = Field(min_length=1, max_length=120)
    description: str = ""
    avatar_url: str = ""
    avatar_file: str = ""
    is_default: bool = False


class LorebookEntry(BaseModel):
    id: str | None = None
    keywords: list[str] = Field(default_factory=list)
    content: str = ""
    enabled: bool = True

    @field_validator("keywords")
    @classmethod
    def clean_keywords(cls, value: list[str]) -> list[str]:
        seen: set[str] = set()
        cleaned: list[str] = []
        for keyword in value:
            normalized = keyword.strip()
            key = normalized.lower()
            if normalized and key not in seen:
                seen.add(key)
                cleaned.append(normalized)
        return cleaned


class LorebookProfile(BaseModel):
    id: str
    name: str = Field(min_length=1, max_length=120)
    active: bool = False
    entries: list[LorebookEntry] = Field(default_factory=list)
    created_at: str
    updated_at: str


class LorebookSaveRequest(BaseModel):
    id: str | None = None
    name: str = Field(min_length=1, max_length=120)
    active: bool = False
    entries: list[LorebookEntry] = Field(default_factory=list)


class ChatSessionMessage(BaseModel):
    role: ChatRole
    content: str = Field(min_length=1)
    timestamp: str = Field(default_factory=utc_now_iso)


class ChatSession(BaseModel):
    id: str
    character_id: str | None = None
    title: str = "Untitled Chat"
    messages: list[ChatSessionMessage] = Field(default_factory=list)
    created_at: str
    updated_at: str


class ChatSessionSaveRequest(BaseModel):
    id: str | None = None
    character_id: str | None = None
    title: str | None = None
    messages: list[ChatSessionMessage] = Field(default_factory=list)


class HuggingFaceModelFile(BaseModel):
    filename: str
    quantization: str
    size_bytes: int | None = None


class HuggingFaceSearchResponse(BaseModel):
    repo_id: str
    files: list[HuggingFaceModelFile]


class ModelDownloadRequest(BaseModel):
    repo_id: str = Field(min_length=1)
    filename: str = Field(min_length=1)

    @field_validator("repo_id")
    @classmethod
    def clean_repo_id(cls, value: str) -> str:
        value = value.strip()
        if not value or "/" not in value:
            raise ValueError("Use a Hugging Face repo id like owner/model.")
        return value

    @field_validator("filename")
    @classmethod
    def validate_filename(cls, value: str) -> str:
        value = value.strip()
        path = PurePosixPath(value)
        if path.is_absolute() or ".." in path.parts:
            raise ValueError("Invalid model filename.")
        if path.suffix.lower() != ".gguf":
            raise ValueError("Only .gguf files can be downloaded.")
        return value


class ModelDownloadJob(BaseModel):
    job_id: str
    repo_id: str
    filename: str
    status: Literal[
        "queued",
        "resolving",
        "downloading",
        "completed",
        "error",
        "idle",
    ]
    percent: float = 0.0
    downloaded_bytes: int = 0
    total_bytes: int | None = None
    speed_bytes_s: float = 0.0
    message: str = ""
    local_path: str | None = None
    error: str | None = None
