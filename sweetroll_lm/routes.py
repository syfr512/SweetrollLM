from __future__ import annotations

import json
import re
import asyncio
import threading
from collections.abc import AsyncIterator

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response, StreamingResponse

from .config import settings
from .inference import CloudChatEngine, LocalLlamaEngine
from .inference.context import orchestrate_chat_context
from .model_downloader import download_manager
from .schemas import (
    CharacterProfile,
    CharacterSaveRequest,
    CloudProvider,
    CloudSettings,
    ChatRequest,
    ChatRole,
    ChatSession,
    ChatSessionMessage,
    ChatSessionSaveRequest,
    ExternalApiFallbackConfig,
    HealthResponse,
    HuggingFaceModelFile,
    HuggingFaceSearchResponse,
    InferenceSource,
    LocalModelLoadRequest,
    LocalModelStatus,
    LorebookProfile,
    LorebookSaveRequest,
    ModelDownloadJob,
    ModelDownloadRequest,
)
from .storage import (
    delete_character,
    delete_chat_session,
    delete_lorebook,
    get_character,
    get_chat_session,
    get_lorebook,
    list_characters,
    list_chat_sessions,
    list_lorebooks,
    new_chat_id,
    save_chat_session,
    save_character,
    save_lorebook,
    scan_gguf_models,
)


router = APIRouter()
local_engine = LocalLlamaEngine()
cloud_engine = CloudChatEngine()
_external_fallback_lock = threading.RLock()
_external_fallback_config = ExternalApiFallbackConfig(
    enabled=settings.external_api_fallback_enabled,
    base_url=settings.external_api_base_url,
    model=settings.external_api_model,
    api_key=settings.external_api_key or None,
)


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(storage_dir=str(settings.storage_dir))


@router.get("/characters", response_model=list[CharacterProfile])
async def characters() -> list[CharacterProfile]:
    return list_characters()


@router.post("/characters", response_model=CharacterProfile)
async def create_character(request: CharacterSaveRequest) -> CharacterProfile:
    try:
        return save_character(request)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/characters/{character_id}", response_model=CharacterProfile)
async def character_detail(character_id: str) -> CharacterProfile:
    try:
        return get_character(character_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/characters/{character_id}", response_model=CharacterProfile)
async def update_character(
    character_id: str, request: CharacterSaveRequest
) -> CharacterProfile:
    try:
        return save_character(request.model_copy(update={"id": character_id}))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/characters/{character_id}", status_code=204)
async def remove_character(character_id: str) -> Response:
    try:
        delete_character(character_id)
        return Response(status_code=204)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/lorebooks", response_model=list[LorebookProfile])
async def lorebooks() -> list[LorebookProfile]:
    return list_lorebooks()


@router.post("/lorebooks", response_model=LorebookProfile)
async def create_lorebook(request: LorebookSaveRequest) -> LorebookProfile:
    try:
        return save_lorebook(request)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/lorebooks/{lorebook_id}", response_model=LorebookProfile)
async def lorebook_detail(lorebook_id: str) -> LorebookProfile:
    try:
        return get_lorebook(lorebook_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/lorebooks/{lorebook_id}", response_model=LorebookProfile)
async def update_lorebook(
    lorebook_id: str, request: LorebookSaveRequest
) -> LorebookProfile:
    try:
        return save_lorebook(request.model_copy(update={"id": lorebook_id}))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/lorebooks/{lorebook_id}", status_code=204)
async def remove_lorebook(lorebook_id: str) -> Response:
    try:
        delete_lorebook(lorebook_id)
        return Response(status_code=204)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/chats", response_model=list[ChatSession])
async def chats(character_id: str | None = None) -> list[ChatSession]:
    return list_chat_sessions(character_id=character_id)


@router.post("/chats", response_model=ChatSession)
async def create_chat(request: ChatSessionSaveRequest) -> ChatSession:
    try:
        return save_chat_session(request)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/chats/{chat_id}", response_model=ChatSession)
async def chat_detail(chat_id: str) -> ChatSession:
    try:
        return get_chat_session(chat_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/chats/{chat_id}", status_code=204)
async def remove_chat(chat_id: str) -> Response:
    try:
        delete_chat_session(chat_id)
        return Response(status_code=204)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/models/local")
async def list_local_models() -> dict[str, object]:
    return {"models": scan_gguf_models(), "status": local_engine.status()}


@router.get("/models/search", response_model=HuggingFaceSearchResponse)
async def search_hugging_face_models(
    repo: str = Query(..., min_length=3),
) -> HuggingFaceSearchResponse:
    repo_id = repo.strip()
    try:
        from huggingface_hub import list_repo_files
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail="huggingface_hub is not installed. Install requirements.txt first.",
        ) from exc

    try:
        files = list_repo_files(repo_id=repo_id, repo_type="model")
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not read Hugging Face repository: {exc}",
        ) from exc

    gguf_files = [
        HuggingFaceModelFile(
            filename=filename,
            quantization=_extract_quantization(filename),
        )
        for filename in files
        if filename.lower().endswith(".gguf")
    ]
    return HuggingFaceSearchResponse(repo_id=repo_id, files=gguf_files)


@router.post("/models/download", response_model=ModelDownloadJob)
async def download_model(request: ModelDownloadRequest) -> ModelDownloadJob:
    try:
        return download_manager.start_download(request)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not start model download: {exc}",
        ) from exc


@router.get("/models/download/progress")
async def download_model_progress(job_id: str | None = None) -> StreamingResponse:
    async def events() -> AsyncIterator[str]:
        while True:
            snapshot = download_manager.get_job(job_id)
            yield _event({"type": "download", **snapshot.model_dump()})
            if snapshot.status in {"completed", "error"}:
                break
            if snapshot.status == "idle":
                await asyncio.sleep(2.0)
            else:
                await asyncio.sleep(0.5)

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/models/status", response_model=LocalModelStatus)
async def local_model_status() -> LocalModelStatus:
    return local_engine.status()


@router.post("/models/load", response_model=LocalModelStatus)
async def load_local_model(request: LocalModelLoadRequest) -> LocalModelStatus:
    try:
        return await local_engine.load_model(request)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/models/unload", response_model=LocalModelStatus)
async def unload_local_model() -> LocalModelStatus:
    return await local_engine.unload_model()


@router.get("/inference/external-fallback", response_model=ExternalApiFallbackConfig)
async def get_external_fallback() -> ExternalApiFallbackConfig:
    with _external_fallback_lock:
        fallback = _external_fallback_config.model_copy()
    if local_engine.has_external_engine():
        return fallback.model_copy(
            update={
                "enabled": True,
                "base_url": local_engine.external_base_url(),
                "model": local_engine.external_model_name(),
                "api_key": None,
            }
        )
    return fallback


@router.post("/inference/external-fallback", response_model=ExternalApiFallbackConfig)
async def set_external_fallback(
    request: ExternalApiFallbackConfig,
) -> ExternalApiFallbackConfig:
    global _external_fallback_config
    with _external_fallback_lock:
        _external_fallback_config = request
        return _external_fallback_config.model_copy()


@router.post("/chat/stream")
async def stream_chat(request: ChatRequest) -> StreamingResponse:
    chat_id = request.chat_id or new_chat_id()
    request = request.model_copy(update={"chat_id": chat_id})
    prepared_request = orchestrate_chat_context(request)

    async def events() -> AsyncIterator[str]:
        assistant_parts: list[str] = []
        yield _event(
            {
                "type": "meta",
                "source": prepared_request.source.value,
                "chat_id": chat_id,
            }
        )
        try:
            engine, engine_request, engine_source = _select_chat_engine(prepared_request)
            if engine_source != prepared_request.source.value:
                yield _event(
                    {
                        "type": "meta",
                        "source": engine_source,
                        "chat_id": chat_id,
                    }
                )
            async for token in engine.stream_chat(engine_request):
                assistant_parts.append(token)
                yield _event({"type": "token", "text": token})
            assistant_text = "".join(assistant_parts).strip()
            if assistant_text:
                asyncio.create_task(
                    asyncio.to_thread(
                        _save_completed_chat,
                        request,
                        chat_id,
                        assistant_text,
                    )
                )
            yield _event({"type": "done", "chat_id": chat_id})
        except Exception as exc:
            yield _event({"type": "error", "message": str(exc)})

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _select_chat_engine(request: ChatRequest) -> tuple[object, ChatRequest, str]:
    if request.source != InferenceSource.local:
        return cloud_engine, request, request.source.value
    if local_engine.has_model():
        return local_engine, request, request.source.value

    with _external_fallback_lock:
        fallback = _external_fallback_config.model_copy()
    if local_engine.has_external_engine():
        fallback = fallback.model_copy(
            update={
                "enabled": True,
                "base_url": local_engine.external_base_url(),
                "model": local_engine.external_model_name(),
                "api_key": None,
            }
        )
    if not fallback.enabled:
        return local_engine, request, request.source.value

    fallback_request = request.model_copy(
        update={
            "source": InferenceSource.cloud,
            "cloud": CloudSettings(
                provider=CloudProvider.custom,
                base_url=fallback.base_url,
                model=fallback.model,
                api_key=fallback.api_key,
            ),
        }
    )
    return cloud_engine, fallback_request, "external_fallback"


async def shutdown_runtime() -> None:
    await local_engine.shutdown()


def _event(payload: dict[str, object]) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


def _extract_quantization(filename: str) -> str:
    match = re.search(
        r"(?i)(?:^|[-_.])((?:IQ|Q)\d(?:_[A-Z0-9]+){0,3}|BF16|FP16|F16|FP32|F32)(?:[-_.]|$)",
        filename,
    )
    return match.group(1).upper() if match else "GGUF"


def _save_completed_chat(
    request: ChatRequest, chat_id: str, assistant_text: str
) -> ChatSession:
    messages = [
        ChatSessionMessage(
            role=message.role,
            content=message.content,
            timestamp=message.timestamp or "",
        )
        for message in request.messages
        if message.role != ChatRole.system and message.content.strip()
    ]
    messages.append(
        ChatSessionMessage(
            role=ChatRole.assistant,
            content=assistant_text,
        )
    )
    return save_chat_session(
        ChatSessionSaveRequest(
            id=chat_id,
            character_id=request.character_id,
            messages=messages,
        )
    )
