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
    ollama = "ollama"
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
    is_fallback: bool = False
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
    is_fallback: bool = False

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
    api_provider_id: str | None = None
    character_id: str | None = None
    persona_id: str | None = None
    lorebook_id: str | None = None
    lorebook_enabled: bool = False
    chat_summary: str = ""
    auto_summary_enabled: bool = False
    summary_message_count: int = 10
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


class ChatSummaryRequest(BaseModel):
    source: InferenceSource
    messages: list[ChatMessage]
    count: int = Field(default=10, ge=1, le=100)
    api_provider_id: str | None = None
    local: LocalSettings = Field(default_factory=LocalSettings)
    cloud: CloudSettings | None = None
    max_tokens: int = Field(default=512, ge=64, le=2048)


class ChatSummaryResponse(BaseModel):
    summary: str
    message_count: int


class WorkspaceNode(BaseModel):
    name: str
    path: str
    kind: Literal["file", "folder"]
    size_bytes: int = 0
    modified_at: str = ""
    children: list["WorkspaceNode"] = Field(default_factory=list)


class WorkspaceTreeResponse(BaseModel):
    root: str = "."
    nodes: list[WorkspaceNode] = Field(default_factory=list)


class WorkspacePathRequest(BaseModel):
    path: str = ""


class WorkspaceFolderRequest(BaseModel):
    path: str = Field(min_length=1, max_length=240)


class WorkspaceDeleteRequest(BaseModel):
    path: str = Field(min_length=1, max_length=240)


class WorkspaceMetadataRequest(BaseModel):
    path: str = ""
    metadata: dict[str, Any] = Field(default_factory=dict)
    permissions: dict[str, Any] = Field(default_factory=dict)


class WorkspaceMetadataResponse(BaseModel):
    metadata: dict[str, Any] = Field(default_factory=dict)


class WorkspaceToolCall(BaseModel):
    action: Literal[
        "list",
        "read",
        "write",
        "mkdir",
        "delete",
        "run",
        "run_terminal_command",
        "start_background_service",
        "send_automation_email",
        "run_automation_script",
        "execute_automation_task",
    ]
    path: str = ""
    content: str = ""
    command: str = ""
    target_dir: str = ""
    service_name: str = ""
    engine: str = ""
    mode: str = ""
    script_content: str = ""
    to: str = ""
    subject: str = ""
    body: str = ""
    reason: str = ""


class WorkspaceChatMessage(BaseModel):
    role: Literal["user", "assistant", "system", "tool"]
    content: str = Field(min_length=1)
    timestamp: str = Field(default_factory=utc_now_iso)


class WorkspaceChatSession(BaseModel):
    id: str
    folder_path: str = ""
    character_id: str | None = None
    title: str = "Workspace Chat"
    messages: list[WorkspaceChatMessage] = Field(default_factory=list)
    created_at: str
    updated_at: str


class WorkspaceChatSaveRequest(BaseModel):
    id: str | None = None
    folder_path: str = ""
    character_id: str | None = None
    title: str | None = None
    messages: list[WorkspaceChatMessage] = Field(default_factory=list)


class WorkspaceChatClearRequest(BaseModel):
    id: str = Field(min_length=1)


class WorkspaceChatPruneRequest(BaseModel):
    id: str = Field(min_length=1)


class WorkspaceAgentRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=8000)
    session_id: str = "default"
    control_level: Literal["read_only", "ask_first", "full_access"] = "full_access"
    character_id: str | None = None
    current_directory: str = ""
    vision_context: str = ""
    messages: list[WorkspaceChatMessage] = Field(default_factory=list)
    approved: bool = False
    pending_task: WorkspaceToolCall | None = None
    pending_tasks: list[WorkspaceToolCall] = Field(default_factory=list)
    source: InferenceSource = InferenceSource.cloud
    api_provider_id: str | None = None
    local: LocalSettings = Field(default_factory=LocalSettings)
    cloud: CloudSettings | None = None


class WorkspaceAgentResponse(BaseModel):
    status: Literal["completed", "needs_approval", "denied", "error", "interrupted"]
    message: str
    assistant_text: str = ""
    output: str = ""
    elapsed_seconds: float = 0.0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    pending_task: WorkspaceToolCall | None = None
    pending_tasks: list[WorkspaceToolCall] = Field(default_factory=list)
    context_messages: list[WorkspaceChatMessage] = Field(default_factory=list)


class ImageGenerationRequest(BaseModel):
    provider: Literal[
        "openai",
        "openrouter",
        "comfyui",
        "stable_diffusion",
        "flux",
        "dalle3",
        "custom",
    ] = "openai"
    api_provider_id: str | None = None
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


class ApiProviderTestResponse(BaseModel):
    ok: bool
    message: str
    status_code: int | None = None
    endpoint: str = ""


class OllamaModelInfo(BaseModel):
    name: str
    model: str = ""
    modified_at: str = ""
    size_bytes: int = 0
    size_vram_bytes: int = 0
    digest: str = ""
    parameter_size: str = ""
    quantization_level: str = ""
    family: str = ""
    context_length: int | None = None
    expires_at: str = ""
    loaded: bool = False
    capabilities: list[str] = Field(default_factory=list)
    details: dict[str, Any] = Field(default_factory=dict)


class OllamaStatusResponse(BaseModel):
    running: bool
    base_url: str
    openai_base_url: str
    models: list[OllamaModelInfo] = Field(default_factory=list)
    message: str = ""


class OllamaPullRequest(BaseModel):
    model: str = Field(min_length=1, max_length=160)

    @field_validator("model")
    @classmethod
    def trim_model(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Ollama model name is required.")
        return value


class OllamaModelDetailResponse(BaseModel):
    model: str
    modelfile: str = ""
    parameters: str = ""
    template: str = ""
    system: str = ""
    license: str = ""
    details: dict[str, Any] = Field(default_factory=dict)
    model_info: dict[str, Any] = Field(default_factory=dict)
    capabilities: list[str] = Field(default_factory=list)
    message: str = ""


class OllamaPullJob(BaseModel):
    job_id: str
    model: str
    status: Literal["queued", "pulling", "completed", "error"] = "queued"
    percent: float = 0.0
    completed_bytes: int = 0
    total_bytes: int | None = None
    digest: str = ""
    message: str = ""


class OllamaPullResponse(BaseModel):
    status: Literal["completed", "error"]
    model: str
    message: str = ""
    raw: dict[str, Any] = Field(default_factory=dict)


class OllamaProviderRegisterRequest(BaseModel):
    model: str = Field(min_length=1, max_length=160)
    name: str = "Ollama Local"
    is_default: bool = True

    @field_validator("model", "name")
    @classmethod
    def trim_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Value is required.")
        return value


class WorkspaceEmailSettings(BaseModel):
    provider: str = "custom"
    smtp_server: str = ""
    smtp_port: int = Field(default=587, ge=1, le=65535)
    smtp_email: str = ""
    smtp_password: str = ""
    has_password: bool = False


class WorkspaceEmailSettingsResponse(BaseModel):
    provider: str = "custom"
    smtp_server: str = ""
    smtp_port: int = 587
    smtp_email: str = ""
    has_password: bool = False
    presets: dict[str, dict[str, str | int]] = Field(default_factory=dict)


class VisionCaptionRequest(BaseModel):
    provider: Literal[
        "llava",
        "qwen-vl",
        "openai",
        "openrouter",
        "google",
        "ollama",
        "custom",
    ] = "custom"
    api_provider_id: str | None = None
    endpoint: str = ""
    api_key: SecretStr | None = None
    model: str = ""
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


class LocalModelImportResponse(BaseModel):
    selected: bool = False
    message: str = ""
    model: LocalModelFile | None = None
    models: list[LocalModelFile] = Field(default_factory=list)


class LocalModelStatus(BaseModel):
    loaded: bool
    status: Literal["idle", "launching", "loaded", "error"] = "idle"
    model_path: str | None = None
    template: PromptTemplate | None = None
    n_ctx: int | None = None
    n_gpu_layers: int | None = None
    message: str = ""
    error_code: str | None = None
    diagnostic_title: str = ""
    diagnostic_message: str = ""
    diagnostic_solution: str = ""


class ExternalApiFallbackConfig(BaseModel):
    enabled: bool = True
    base_url: str = "http://127.0.0.1:5001/v1"
    model: str = "koboldcpp"
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


class AppAppearanceSettings(BaseModel):
    global_background_path: str = ""
    chat_bubble_opacity: float = Field(default=0.82, ge=0.1, le=1.0)
    background_image_opacity: float = Field(default=0.9, ge=0.0, le=1.0)
    updated_at: str = Field(default_factory=utc_now_iso)


class BackgroundSelectResponse(BaseModel):
    selected: bool
    settings: AppAppearanceSettings
    message: str = ""


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
    chat_background_url: str = ""
    chat_background_file: str = ""
    chat_backdrop_enabled: bool = True
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
    chat_background_url: str = ""
    chat_background_file: str = ""
    chat_backdrop_enabled: bool = True


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
    persona_id: str | None = None
    lorebook_id: str | None = None
    lorebook_enabled: bool | None = None
    chat_summary: str = ""
    auto_summary_enabled: bool = False
    summary_message_count: int = 10
    title: str = "Untitled Chat"
    messages: list[ChatSessionMessage] = Field(default_factory=list)
    created_at: str
    updated_at: str


class ChatSessionSaveRequest(BaseModel):
    id: str | None = None
    character_id: str | None = None
    persona_id: str | None = None
    lorebook_id: str | None = None
    lorebook_enabled: bool | None = None
    chat_summary: str = ""
    auto_summary_enabled: bool = False
    summary_message_count: int = 10
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
