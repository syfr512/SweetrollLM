from __future__ import annotations

import json
import re
import uuid
from pathlib import Path

from .config import settings
from .schemas import (
    CharacterProfile,
    CharacterSaveRequest,
    ChatSession,
    ChatSessionMessage,
    ChatSessionSaveRequest,
    LocalModelFile,
    LorebookEntry,
    LorebookProfile,
    LorebookSaveRequest,
    utc_now_iso,
)


STORAGE_FOLDERS = (
    settings.storage_dir,
    settings.models_dir,
    settings.characters_dir,
    settings.chats_dir,
    settings.lorebooks_dir,
    settings.extensions_dir,
)


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
        first_message=request.first_message.strip(),
        avatar_url=request.avatar_url.strip(),
        avatar_file=request.avatar_file.strip(),
        created_at=created_at,
        updated_at=utc_now_iso(),
    )
    _write_json_file(path, character.model_dump())
    return character


def delete_character(character_id: str) -> None:
    path = _json_path(settings.characters_dir, character_id)
    if not path.exists():
        raise FileNotFoundError(f"Character not found: {character_id}")
    path.unlink()


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
