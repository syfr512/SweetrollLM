from __future__ import annotations

import json
import re
import uuid
import base64
import binascii
from pathlib import Path
from typing import Any

from .config import settings
from .schemas import (
    ApiProviderProfile,
    ApiProviderSaveRequest,
    AssetFile,
    AssetSaveRequest,
    CharacterProfile,
    CharacterSaveRequest,
    ChatSession,
    ChatSessionMessage,
    ChatSessionSaveRequest,
    LocalModelFile,
    LorebookEntry,
    LorebookProfile,
    LorebookSaveRequest,
    UserPersonaProfile,
    UserPersonaSaveRequest,
    utc_now_iso,
)


STORAGE_FOLDERS = (
    settings.storage_dir,
    settings.models_dir,
    settings.characters_dir,
    settings.chats_dir,
    settings.personas_dir,
    settings.lorebooks_dir,
    settings.extensions_dir,
    settings.assets_dir,
    settings.logs_dir,
)

ALLOWED_ASSET_MIME_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
}


def ensure_storage() -> None:
    for folder in STORAGE_FOLDERS:
        folder.mkdir(parents=True, exist_ok=True)


def scan_gguf_models() -> list[LocalModelFile]:
    ensure_storage()
    models: list[LocalModelFile] = []
    for path in sorted(settings.models_dir.rglob("*.gguf")):
        stat = path.stat()
        models.append(
            LocalModelFile(
                name=path.name,
                path=str(path),
                relative_path=str(path.relative_to(settings.models_dir)),
                size_bytes=stat.st_size,
            )
        )
    return models


def list_characters() -> list[CharacterProfile]:
    ensure_storage()
    characters = [
        _read_json_file(path, CharacterProfile)
        for path in sorted(settings.characters_dir.glob("*.json"))
    ]
    return [character for character in characters if character is not None]


def list_chat_sessions(character_id: str | None = None) -> list[ChatSession]:
    ensure_storage()
    chats = [
        _read_json_file(path, ChatSession)
        for path in sorted(
            settings.chats_dir.glob("*.json"),
            key=lambda item: item.stat().st_mtime,
            reverse=True,
        )
    ]
    sessions = [chat for chat in chats if chat is not None]
    if character_id:
        sessions = [chat for chat in sessions if chat.character_id == character_id]
    return sessions


def get_chat_session(chat_id: str) -> ChatSession:
    path = _json_path(settings.chats_dir, chat_id)
    chat = _read_json_file(path, ChatSession)
    if chat is None:
        raise FileNotFoundError(f"Chat session not found: {chat_id}")
    return chat


def save_chat_session(request: ChatSessionSaveRequest) -> ChatSession:
    ensure_storage()
    chat_id = _safe_id(request.id) if request.id else new_chat_id()
    path = _json_path(settings.chats_dir, chat_id)
    created_at = utc_now_iso()

    if path.exists():
        existing = _read_json_file(path, ChatSession)
        if existing:
            created_at = existing.created_at

    messages = [
        ChatSessionMessage(
            role=message.role,
            content=message.content,
            timestamp=message.timestamp or utc_now_iso(),
        )
        for message in request.messages
        if message.content.strip()
    ]
    chat = ChatSession(
        id=chat_id,
        character_id=request.character_id,
        title=(request.title or _chat_title(messages)).strip()[:120] or "Untitled Chat",
        messages=messages,
        created_at=created_at,
        updated_at=utc_now_iso(),
    )
    _write_json_file(path, chat.model_dump())
    return chat


def delete_chat_session(chat_id: str) -> None:
    path = _json_path(settings.chats_dir, chat_id)
    if not path.exists():
        raise FileNotFoundError(f"Chat session not found: {chat_id}")
    path.unlink()


def new_chat_id() -> str:
    return f"chat-{uuid.uuid4().hex[:12]}"


def list_api_providers() -> list[ApiProviderProfile]:
    ensure_storage()
    return _read_api_provider_registry()


def get_api_provider(provider_id: str) -> ApiProviderProfile:
    provider_id = _safe_id(provider_id)
    for provider in _read_api_provider_registry():
        if provider.id == provider_id:
            return provider
    raise FileNotFoundError(f"API provider not found: {provider_id}")


def get_default_api_provider() -> ApiProviderProfile | None:
    providers = _read_api_provider_registry()
    for provider in providers:
        if provider.is_default:
            return provider
    return providers[0] if providers else None


def save_api_provider(request: ApiProviderSaveRequest) -> ApiProviderProfile:
    ensure_storage()
    providers = _read_api_provider_registry()
    provider_id = _safe_id(request.id) if request.id else _new_id(request.name)
    created_at = utc_now_iso()
    existing_index: int | None = None

    for index, provider in enumerate(providers):
        if provider.id == provider_id:
            existing_index = index
            created_at = provider.created_at
            break

    is_default = request.is_default or not providers
    provider = ApiProviderProfile(
        id=provider_id,
        name=request.name.strip(),
        base_url=request.base_url.strip().rstrip("/"),
        api_key=request.api_key.strip(),
        default_model=request.default_model.strip(),
        is_default=is_default,
        created_at=created_at,
        updated_at=utc_now_iso(),
    )

    if is_default:
        providers = [
            item.model_copy(update={"is_default": False})
            for item in providers
            if item.id != provider_id
        ]
    elif existing_index is not None:
        providers.pop(existing_index)

    providers.append(provider)
    providers.sort(key=lambda item: item.name.lower())
    if providers and not any(item.is_default for item in providers):
        providers[0] = providers[0].model_copy(update={"is_default": True})
    _write_api_provider_registry(providers)
    return provider


def delete_api_provider(provider_id: str) -> None:
    provider_id = _safe_id(provider_id)
    providers = _read_api_provider_registry()
    next_providers = [provider for provider in providers if provider.id != provider_id]
    if len(next_providers) == len(providers):
        raise FileNotFoundError(f"API provider not found: {provider_id}")
    if next_providers and not any(provider.is_default for provider in next_providers):
        next_providers[0] = next_providers[0].model_copy(update={"is_default": True})
    _write_api_provider_registry(next_providers)


def get_character(character_id: str) -> CharacterProfile:
    path = _json_path(settings.characters_dir, character_id)
    character = _read_json_file(path, CharacterProfile)
    if character is None:
        raise FileNotFoundError(f"Character not found: {character_id}")
    return character


def save_character(request: CharacterSaveRequest) -> CharacterProfile:
    ensure_storage()
    character_id = _safe_id(request.id) if request.id else _new_id(request.name)
    path = _json_path(settings.characters_dir, character_id)
    created_at = utc_now_iso()

    if path.exists():
        existing = _read_json_file(path, CharacterProfile)
        if existing:
            created_at = existing.created_at

    character = CharacterProfile(
        id=character_id,
        name=request.name.strip(),
        description=request.description.strip(),
        personality=request.personality.strip(),
        scenario=request.scenario.strip(),
        example_dialogue=request.example_dialogue.strip(),
        first_message=request.first_message.strip(),
        avatar_url=request.avatar_url.strip(),
        avatar_file=request.avatar_file.strip(),
        created_at=created_at,
        updated_at=utc_now_iso(),
    )
    _write_json_file(path, character.model_dump())
    return character


def import_character_payload(payload: dict[str, Any]) -> CharacterProfile:
    request = character_request_from_portable_payload(payload)
    return save_character(request)


def character_request_from_portable_payload(
    payload: dict[str, Any],
) -> CharacterSaveRequest:
    data = _character_payload_data(payload)
    name = _first_text(data, "name", "char_name", "character_name") or "Imported Character"
    description = _first_text(data, "description", "desc")
    personality = _first_text(data, "personality", "persona")
    scenario = _first_text(data, "scenario", "world_scenario")
    first_message = _first_text(
        data,
        "first_message",
        "first_mes",
        "firstMessage",
        "greeting",
        "initial_message",
    )
    example_dialogue = _first_text(
        data,
        "example_dialogue",
        "mes_example",
        "example_messages",
        "sample_dialogue",
    )
    avatar_url = _first_text(data, "avatar_url", "avatarUrl", "avatar")
    avatar_file = _first_text(data, "avatar_file", "avatarFile")

    return CharacterSaveRequest(
        name=name,
        description=description,
        personality=personality,
        scenario=scenario,
        example_dialogue=example_dialogue,
        first_message=first_message,
        avatar_url=avatar_url,
        avatar_file=avatar_file,
    )


def export_character_payload(character_id: str) -> dict[str, Any]:
    character = get_character(character_id)
    avatar = character.avatar_file or character.avatar_url
    return {
        "spec": "chara_card_v2",
        "spec_version": "2.0",
        "data": {
            "name": character.name,
            "description": character.description,
            "personality": character.personality,
            "scenario": character.scenario,
            "first_mes": character.first_message,
            "mes_example": character.example_dialogue,
            "avatar": avatar,
            "creator_notes": "Exported from SweetrollLM.",
            "system_prompt": "",
            "post_history_instructions": "",
            "alternate_greetings": [],
            "tags": [],
            "creator": "SweetrollLM",
            "character_version": "1.0",
            "extensions": {
                "sweetroll_lm": {
                    "id": character.id,
                    "created_at": character.created_at,
                    "updated_at": character.updated_at,
                    "avatar_url": character.avatar_url,
                    "avatar_file": character.avatar_file,
                }
            },
        },
    }


def delete_character(character_id: str) -> None:
    path = _json_path(settings.characters_dir, character_id)
    if not path.exists():
        raise FileNotFoundError(f"Character not found: {character_id}")
    path.unlink()


def list_personas() -> list[UserPersonaProfile]:
    ensure_storage()
    personas = [
        _read_json_file(path, UserPersonaProfile)
        for path in sorted(settings.personas_dir.glob("*.json"))
    ]
    return [persona for persona in personas if persona is not None]


def get_persona(persona_id: str) -> UserPersonaProfile:
    path = _json_path(settings.personas_dir, persona_id)
    persona = _read_json_file(path, UserPersonaProfile)
    if persona is None:
        raise FileNotFoundError(f"Persona not found: {persona_id}")
    return persona


def get_default_persona() -> UserPersonaProfile | None:
    for persona in list_personas():
        if persona.is_default:
            return persona
    personas = list_personas()
    return personas[0] if personas else None


def save_persona(request: UserPersonaSaveRequest) -> UserPersonaProfile:
    ensure_storage()
    persona_id = _safe_id(request.id) if request.id else _new_id(request.name)
    path = _json_path(settings.personas_dir, persona_id)
    created_at = utc_now_iso()

    if path.exists():
        existing = _read_json_file(path, UserPersonaProfile)
        if existing:
            created_at = existing.created_at

    if request.is_default:
        _clear_default_personas(except_id=persona_id)

    persona = UserPersonaProfile(
        id=persona_id,
        name=request.name.strip(),
        description=request.description.strip(),
        avatar_url=request.avatar_url.strip(),
        avatar_file=request.avatar_file.strip(),
        is_default=request.is_default,
        created_at=created_at,
        updated_at=utc_now_iso(),
    )
    _write_json_file(path, persona.model_dump())
    return persona


def delete_persona(persona_id: str) -> None:
    path = _json_path(settings.personas_dir, persona_id)
    if not path.exists():
        raise FileNotFoundError(f"Persona not found: {persona_id}")
    path.unlink()


def save_asset(request: AssetSaveRequest) -> AssetFile:
    ensure_storage()
    header, _, encoded = request.data_url.partition(",")
    if not encoded or not header.startswith("data:"):
        raise ValueError("Asset data must be a browser data URL.")
    mime_type = header[5:].split(";", 1)[0].lower()
    extension = ALLOWED_ASSET_MIME_TYPES.get(mime_type)
    if extension is None:
        raise ValueError("Only PNG and JPG images can be stored as local assets.")
    try:
        content = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError("Asset image data could not be decoded.") from exc
    if not content:
        raise ValueError("Asset image data is empty.")

    stem = re.sub(r"[^a-zA-Z0-9_-]+", "-", Path(request.filename).stem).strip("-")
    stem = stem[:48] or "asset"
    filename = f"{stem}-{uuid.uuid4().hex[:10]}{extension}"
    path = _asset_path(filename)
    path.write_bytes(content)
    return AssetFile(
        filename=filename,
        url=f"/api/assets/{filename}",
        mime_type=mime_type,
        size_bytes=len(content),
    )


def get_asset_path(filename: str) -> Path:
    path = _asset_path(filename)
    if not path.exists() or not path.is_file():
        raise FileNotFoundError(f"Asset not found: {filename}")
    return path


def list_lorebooks() -> list[LorebookProfile]:
    ensure_storage()
    lorebooks = [
        _read_json_file(path, LorebookProfile)
        for path in sorted(settings.lorebooks_dir.glob("*.json"))
    ]
    return [lorebook for lorebook in lorebooks if lorebook is not None]


def get_lorebook(lorebook_id: str) -> LorebookProfile:
    path = _json_path(settings.lorebooks_dir, lorebook_id)
    lorebook = _read_json_file(path, LorebookProfile)
    if lorebook is None:
        raise FileNotFoundError(f"Lorebook not found: {lorebook_id}")
    return lorebook


def save_lorebook(request: LorebookSaveRequest) -> LorebookProfile:
    ensure_storage()
    lorebook_id = _safe_id(request.id) if request.id else _new_id(request.name)
    path = _json_path(settings.lorebooks_dir, lorebook_id)
    created_at = utc_now_iso()

    if path.exists():
        existing = _read_json_file(path, LorebookProfile)
        if existing:
            created_at = existing.created_at

    entries = [
        LorebookEntry(
            id=_safe_id(entry.id) if entry.id else uuid.uuid4().hex,
            keywords=entry.keywords,
            content=entry.content.strip(),
            enabled=entry.enabled,
        )
        for entry in request.entries
        if entry.content.strip() and entry.keywords
    ]
    lorebook = LorebookProfile(
        id=lorebook_id,
        name=request.name.strip(),
        active=request.active,
        entries=entries,
        created_at=created_at,
        updated_at=utc_now_iso(),
    )
    _write_json_file(path, lorebook.model_dump())
    return lorebook


def delete_lorebook(lorebook_id: str) -> None:
    path = _json_path(settings.lorebooks_dir, lorebook_id)
    if not path.exists():
        raise FileNotFoundError(f"Lorebook not found: {lorebook_id}")
    path.unlink()


def resolve_model_path(path_value: str) -> Path:
    raw_path = Path(path_value).expanduser()
    path = raw_path if raw_path.is_absolute() else settings.models_dir / raw_path
    path = path.resolve()

    if path.suffix.lower() != ".gguf":
        raise ValueError("Only .gguf model files can be loaded.")
    if not path.exists():
        raise FileNotFoundError(f"Model file not found: {path}")
    if not path.is_file():
        raise ValueError(f"Model path is not a file: {path}")
    return path


def _json_path(folder: Path, item_id: str) -> Path:
    safe_id = _safe_id(item_id)
    path = (folder / f"{safe_id}.json").resolve()
    folder_root = folder.resolve()
    if folder_root not in path.parents:
        raise ValueError("Resolved storage path escaped the local storage folder.")
    return path


def _read_json_file(path: Path, model_type: type) -> object | None:
    try:
        with path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
        return model_type.model_validate(payload)
    except (OSError, json.JSONDecodeError, ValueError):
        return None


def _write_json_file(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.with_suffix(".json.tmp")
    with temp_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
    temp_path.replace(path)


def _read_api_provider_registry() -> list[ApiProviderProfile]:
    try:
        with settings.api_providers_path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
    except (OSError, json.JSONDecodeError):
        return []
    if not isinstance(payload, list):
        return []

    providers: list[ApiProviderProfile] = []
    for item in payload:
        if not isinstance(item, dict):
            continue
        try:
            providers.append(ApiProviderProfile.model_validate(item))
        except ValueError:
            continue
    return providers


def _write_api_provider_registry(providers: list[ApiProviderProfile]) -> None:
    settings.api_providers_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = settings.api_providers_path.with_suffix(".json.tmp")
    with temp_path.open("w", encoding="utf-8") as handle:
        json.dump(
            [provider.model_dump() for provider in providers],
            handle,
            ensure_ascii=False,
            indent=2,
        )
    temp_path.replace(settings.api_providers_path)


def _character_payload_data(payload: dict[str, Any]) -> dict[str, Any]:
    data = payload.get("data")
    if isinstance(data, dict):
        merged = dict(payload)
        merged.update(data)
        return merged
    return payload


def _first_text(payload: dict[str, Any], *keys: str) -> str:
    for key in keys:
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
        if isinstance(value, list):
            joined = "\n".join(str(item).strip() for item in value if str(item).strip())
            if joined:
                return joined
    return ""


def _clear_default_personas(except_id: str) -> None:
    for persona in list_personas():
        if persona.id == except_id or not persona.is_default:
            continue
        _write_json_file(
            _json_path(settings.personas_dir, persona.id),
            persona.model_copy(update={"is_default": False, "updated_at": utc_now_iso()}).model_dump(),
        )


def _asset_path(filename: str) -> Path:
    safe_name = Path(filename).name
    if not re.fullmatch(r"[A-Za-z0-9_.-]{1,180}", safe_name):
        raise ValueError("Invalid asset filename.")
    suffix = Path(safe_name).suffix.lower()
    if suffix not in {".png", ".jpg", ".jpeg"}:
        raise ValueError("Only PNG and JPG assets can be used.")
    path = (settings.assets_dir / safe_name).resolve()
    folder_root = settings.assets_dir.resolve()
    if folder_root not in path.parents:
        raise ValueError("Resolved asset path escaped the local assets folder.")
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _new_id(name: str) -> str:
    stem = re.sub(r"[^a-zA-Z0-9_-]+", "-", name.strip().lower()).strip("-")
    stem = stem[:48] or "profile"
    return f"{stem}-{uuid.uuid4().hex[:8]}"


def _chat_title(messages: list[ChatSessionMessage]) -> str:
    for message in messages:
        if message.role.value == "user":
            return message.content.replace("\n", " ")[:80]
    if messages:
        return messages[0].content.replace("\n", " ")[:80]
    return "Untitled Chat"


def _safe_id(value: str | None) -> str:
    if not value:
        raise ValueError("An id is required.")
    if not re.fullmatch(r"[A-Za-z0-9_-]{1,80}", value):
        raise ValueError("Invalid id. Use letters, numbers, hyphens, or underscores.")
    return value
