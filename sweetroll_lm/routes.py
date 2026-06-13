from __future__ import annotations

import json
import re
import asyncio
import threading
import mimetypes
from typing import Any
from collections.abc import AsyncIterator

import httpx
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import FileResponse, Response, StreamingResponse

from .config import settings
from .inference import CloudChatEngine, LocalLlamaEngine
from .inference.context import orchestrate_chat_context
from .logging_utils import read_recent_logs
from .model_downloader import download_manager
from .schemas import (
    AppAppearanceSettings,
    ApiProviderProfile,
    ApiProviderSaveRequest,
    ApiProviderTestResponse,
    BackgroundSelectResponse,
    CharacterProfile,
    CharacterSaveRequest,
    AssetFile,
    AssetSaveRequest,
    CloudProvider,
    CloudSettings,
    ChatCompletionResponse,
    ChatRequest,
    ChatMessage,
    ChatRole,
    ChatSession,
    ChatSessionMessage,
    ChatSessionSaveRequest,
    ConsoleLogResponse,
    ExternalApiFallbackConfig,
    HealthResponse,
    HuggingFaceModelFile,
    HuggingFaceSearchResponse,
    ImageGenerationRequest,
    ImageGenerationResponse,
    InferenceSource,
    LocalModelImportResponse,
    LocalModelLoadRequest,
    LocalModelStatus,
    LorebookProfile,
    LorebookSaveRequest,
    ModelDownloadJob,
    ModelDownloadRequest,
    UserPersonaProfile,
    UserPersonaSaveRequest,
    VisionCaptionRequest,
    VisionCaptionResponse,
)
from .storage import (
    clear_global_background_image,
    delete_api_provider,
    delete_character,
    delete_chat_session,
    delete_lorebook,
    delete_persona,
    export_character_payload,
    get_api_provider,
    get_app_settings,
    get_asset_path,
    get_character,
    get_chat_session,
    get_global_background_path,
    get_lorebook,
    get_persona,
    import_character_payload,
    import_local_gguf_model,
    list_api_providers,
    list_characters,
    list_chat_sessions,
    list_lorebooks,
    list_personas,
    new_chat_id,
    save_api_provider,
    save_app_settings,
    save_asset,
    save_asset_bytes,
    save_chat_session,
    save_character,
    save_lorebook,
    save_persona,
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


@router.get("/logs", response_model=ConsoleLogResponse)
async def logs(limit: int = Query(500, ge=1, le=2000)) -> ConsoleLogResponse:
    lines, truncated = read_recent_logs(limit)
    return ConsoleLogResponse(lines=lines, text="\n".join(lines), truncated=truncated)


@router.get("/app-settings", response_model=AppAppearanceSettings)
async def app_settings() -> AppAppearanceSettings:
    return get_app_settings()


@router.put("/app-settings", response_model=AppAppearanceSettings)
async def update_app_settings(request: AppAppearanceSettings) -> AppAppearanceSettings:
    try:
        return save_app_settings(request)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/app-settings/background/upload", response_model=BackgroundSelectResponse)
async def upload_app_background(request: Request) -> BackgroundSelectResponse:
    try:
        filename, content, media_type = await _read_multipart_image(request, "background")
        asset = save_asset_bytes(filename, content, media_type)
        current = get_app_settings()
        app_settings = save_app_settings(
            current.model_copy(update={"global_background_path": asset.url})
        )
        return BackgroundSelectResponse(
            selected=True,
            settings=app_settings,
            message=f"Global chat background uploaded as {asset.filename}.",
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/app-settings/background/clear", response_model=AppAppearanceSettings)
async def clear_app_background() -> AppAppearanceSettings:
    try:
        return clear_global_background_image()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/app-settings/background")
async def app_background_file() -> FileResponse:
    try:
        path = get_global_background_path()
        media_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        return FileResponse(path, media_type=media_type)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/api-providers", response_model=list[ApiProviderProfile])
async def api_providers() -> list[ApiProviderProfile]:
    return list_api_providers()


@router.post("/api-providers", response_model=ApiProviderProfile)
async def create_api_provider(request: ApiProviderSaveRequest) -> ApiProviderProfile:
    try:
        return save_api_provider(request)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/api-providers/test", response_model=ApiProviderTestResponse)
async def test_api_provider(request: ApiProviderSaveRequest) -> ApiProviderTestResponse:
    return await _test_api_provider_connection(request)


@router.get("/api-providers/{provider_id}", response_model=ApiProviderProfile)
async def api_provider_detail(provider_id: str) -> ApiProviderProfile:
    try:
        return get_api_provider(provider_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/api-providers/{provider_id}", response_model=ApiProviderProfile)
async def update_api_provider(
    provider_id: str, request: ApiProviderSaveRequest
) -> ApiProviderProfile:
    try:
        return save_api_provider(request.model_copy(update={"id": provider_id}))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/api-providers/{provider_id}", status_code=204)
async def remove_api_provider(provider_id: str) -> Response:
    try:
        delete_api_provider(provider_id)
        return Response(status_code=204)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/characters", response_model=list[CharacterProfile])
async def characters() -> list[CharacterProfile]:
    return list_characters()


@router.post("/characters", response_model=CharacterProfile)
async def create_character(request: CharacterSaveRequest) -> CharacterProfile:
    try:
        return save_character(request)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/characters/import", response_model=CharacterProfile)
async def import_character(payload: dict[str, Any]) -> CharacterProfile:
    try:
        return import_character_payload(payload)
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


@router.get("/characters/{character_id}/export")
async def export_character(character_id: str) -> dict[str, Any]:
    try:
        return export_character_payload(character_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
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


@router.get("/personas", response_model=list[UserPersonaProfile])
async def personas() -> list[UserPersonaProfile]:
    return list_personas()


@router.post("/personas", response_model=UserPersonaProfile)
async def create_persona(request: UserPersonaSaveRequest) -> UserPersonaProfile:
    try:
        return save_persona(request)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/personas/{persona_id}", response_model=UserPersonaProfile)
async def persona_detail(persona_id: str) -> UserPersonaProfile:
    try:
        return get_persona(persona_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/personas/{persona_id}", response_model=UserPersonaProfile)
async def update_persona(
    persona_id: str, request: UserPersonaSaveRequest
) -> UserPersonaProfile:
    try:
        return save_persona(request.model_copy(update={"id": persona_id}))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/personas/{persona_id}", status_code=204)
async def remove_persona(persona_id: str) -> Response:
    try:
        delete_persona(persona_id)
        return Response(status_code=204)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/assets", response_model=AssetFile)
async def upload_asset(request: AssetSaveRequest) -> AssetFile:
    try:
        return save_asset(request)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/assets/{filename}")
async def asset(filename: str) -> FileResponse:
    try:
        path = get_asset_path(filename)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    media_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return FileResponse(path, media_type=media_type)


@router.post("/extensions/image/generate", response_model=ImageGenerationResponse)
async def generate_image(request: ImageGenerationRequest) -> ImageGenerationResponse:
    endpoint = request.endpoint.strip()
    if not endpoint:
        return ImageGenerationResponse(
            status="prepared",
            message="Image generation request prepared. Add a local or cloud endpoint to run it.",
            markdown=_render_prepared_image_markdown(request),
        )

    try:
        headers = _extension_headers(request.api_key)
        payload = _build_image_generation_payload(request)
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(endpoint, headers=headers, json=payload)
            response.raise_for_status()
        data = response.json()
        image_url = _extract_image_url(data)
        markdown = (
            f"![Generated image]({image_url})"
            if image_url
            else _render_image_job_markdown(request, data)
        )
        return ImageGenerationResponse(
            status="completed",
            message="Image generation request completed.",
            markdown=markdown,
            image_url=image_url,
            raw=_compact_extension_payload(data),
        )
    except httpx.HTTPStatusError as exc:
        return ImageGenerationResponse(
            status="error",
            message=f"Image backend returned HTTP {exc.response.status_code}: {exc.response.text[:240]}",
            markdown="**Image generation failed.** Check the configured endpoint and backend logs.",
        )
    except httpx.RequestError as exc:
        return ImageGenerationResponse(
            status="error",
            message=f"Could not reach image backend: {exc}",
            markdown="**Image generation failed.** The configured endpoint is not reachable.",
        )
    except Exception as exc:
        return ImageGenerationResponse(
            status="error",
            message=f"Image generation failed: {exc}",
            markdown="**Image generation failed.**",
        )


@router.post("/extensions/vision/caption", response_model=VisionCaptionResponse)
async def caption_image(request: VisionCaptionRequest) -> VisionCaptionResponse:
    endpoint = request.endpoint.strip()
    if not endpoint:
        caption = _prepared_caption(request)
        return VisionCaptionResponse(
            status="prepared",
            filename=request.filename,
            caption=caption,
            message="No vision endpoint configured; attached image context was prepared locally.",
        )

    try:
        headers = _extension_headers(request.api_key)
        payload = _build_vision_caption_payload(request)
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(endpoint, headers=headers, json=payload)
            response.raise_for_status()
        data = response.json()
        caption = _extract_caption(data)
        if not caption:
            caption = _prepared_caption(request)
        return VisionCaptionResponse(
            status="completed",
            filename=request.filename,
            caption=caption,
            message="Vision caption generated.",
        )
    except httpx.HTTPStatusError as exc:
        caption = _prepared_caption(request)
        return VisionCaptionResponse(
            status="error",
            filename=request.filename,
            caption=caption,
            message=f"Vision backend returned HTTP {exc.response.status_code}: {exc.response.text[:240]}",
        )
    except httpx.RequestError as exc:
        caption = _prepared_caption(request)
        return VisionCaptionResponse(
            status="error",
            filename=request.filename,
            caption=caption,
            message=f"Could not reach vision backend: {exc}",
        )
    except Exception as exc:
        caption = _prepared_caption(request)
        return VisionCaptionResponse(
            status="error",
            filename=request.filename,
            caption=caption,
            message=f"Vision captioning failed: {exc}",
        )


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


@router.post("/models/import-local", response_model=LocalModelImportResponse)
async def import_local_model() -> LocalModelImportResponse:
    try:
        selected, models = await asyncio.to_thread(import_local_gguf_model)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not import local GGUF model: {exc}",
        ) from exc
    return LocalModelImportResponse(
        selected=selected is not None,
        message=(
            f"Imported {selected.name} into storage/models."
            if selected
            else "No model selected. Showing scanned local models."
        ),
        model=selected,
        models=models,
    )


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
    prepared_request = _prepare_generation_request(orchestrate_chat_context(request))

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
            async with asyncio.timeout(settings.generation_timeout_seconds):
                async for token in engine.stream_chat(engine_request):
                    assistant_parts.append(token)
                    yield _event({"type": "token", "text": token})
        except TimeoutError as exc:
            fallback_request = _fallback_request_for_cloud_failure(prepared_request, exc)
            if assistant_parts or fallback_request is None:
                yield _event(
                    {
                        "type": "error",
                        "message": "Generation timed out before the model returned a complete response.",
                    }
                )
                return
            yield _event(
                {
                    "type": "meta",
                    "source": "cloud_fallback",
                    "chat_id": chat_id,
                    "message": "Primary provider timed out; using alternate fallback profile.",
                }
            )
            async with asyncio.timeout(settings.generation_timeout_seconds):
                async for token in cloud_engine.stream_chat(fallback_request):
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
            return
        except Exception as exc:
            fallback_request = _fallback_request_for_cloud_failure(prepared_request, exc)
            if assistant_parts or fallback_request is None:
                yield _event({"type": "error", "message": str(exc)})
                return
            yield _event(
                {
                    "type": "meta",
                    "source": "cloud_fallback",
                    "chat_id": chat_id,
                    "message": "Primary provider failed; using alternate fallback profile.",
                }
            )
            async with asyncio.timeout(settings.generation_timeout_seconds):
                async for token in cloud_engine.stream_chat(fallback_request):
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
            return
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

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/chat", response_model=ChatCompletionResponse)
async def complete_chat(request: ChatRequest) -> ChatCompletionResponse:
    chat_id = request.chat_id or new_chat_id()
    request = request.model_copy(update={"chat_id": chat_id})
    prepared_request = _prepare_generation_request(orchestrate_chat_context(request))
    assistant_parts: list[str] = []

    try:
        assistant_parts, engine_source = await _collect_chat_response(prepared_request)
    except TimeoutError as exc:
        raise HTTPException(
            status_code=408,
            detail="Generation timed out before the model returned a complete response.",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    assistant_text = "".join(assistant_parts).strip()
    if assistant_text:
        try:
            await asyncio.to_thread(_save_completed_chat, request, chat_id, assistant_text)
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Response completed but chat persistence failed: {exc}",
            ) from exc

    return ChatCompletionResponse(
        chat_id=chat_id,
        source=engine_source,
        text=assistant_text,
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


async def _collect_chat_response(request: ChatRequest) -> tuple[list[str], str]:
    assistant_parts: list[str] = []
    engine, engine_request, engine_source = _select_chat_engine(request)
    try:
        async with asyncio.timeout(settings.generation_timeout_seconds):
            async for token in engine.stream_chat(engine_request):
                assistant_parts.append(token)
        return assistant_parts, engine_source
    except TimeoutError as exc:
        fallback_request = _fallback_request_for_cloud_failure(request, exc)
        if assistant_parts or fallback_request is None:
            raise
    except Exception as exc:
        fallback_request = _fallback_request_for_cloud_failure(request, exc)
        if assistant_parts or fallback_request is None:
            raise

    fallback_parts: list[str] = []
    async with asyncio.timeout(settings.generation_timeout_seconds):
        async for token in cloud_engine.stream_chat(fallback_request):
            fallback_parts.append(token)
    return fallback_parts, "cloud_fallback"


def _fallback_request_for_cloud_failure(
    request: ChatRequest, exc: BaseException
) -> ChatRequest | None:
    if request.source != InferenceSource.cloud:
        return None
    if not _is_fallback_trigger(exc):
        return None
    fallback = _fallback_api_provider(request)
    if fallback is None:
        return None
    return request.model_copy(
        update={
            "api_provider_id": fallback.id,
            "cloud": CloudSettings(
                provider=_cloud_provider_from_base_url(fallback.base_url),
                base_url=fallback.base_url,
                model=fallback.default_model,
                api_key=fallback.api_key or None,
            ),
        }
    )


def _fallback_api_provider(request: ChatRequest) -> ApiProviderProfile | None:
    current_id = request.api_provider_id or ""
    current_cloud = request.cloud
    for provider in list_api_providers():
        if not provider.is_fallback or provider.id == current_id:
            continue
        if (
            current_cloud
            and provider.base_url.rstrip("/") == current_cloud.base_url.rstrip("/")
            and provider.default_model == current_cloud.model
        ):
            continue
        return provider
    return None


def _is_fallback_trigger(exc: BaseException) -> bool:
    if isinstance(exc, TimeoutError):
        return True
    text = str(exc).lower()
    return any(
        marker in text
        for marker in (
            "http 408",
            "http 409",
            "http 425",
            "http 429",
            "http 500",
            "http 502",
            "http 503",
            "http 504",
            "rate limit",
            "rate-limit",
            "timeout",
            "timed out",
            "temporarily unavailable",
        )
    )


def _cloud_provider_from_base_url(base_url: str) -> CloudProvider:
    normalized = base_url.lower()
    if "openrouter.ai" in normalized:
        return CloudProvider.openrouter
    if "api.openai.com" in normalized:
        return CloudProvider.openai
    return CloudProvider.custom


async def _test_api_provider_connection(
    request: ApiProviderSaveRequest,
) -> ApiProviderTestResponse:
    base_url = request.base_url.strip().rstrip("/")
    model = request.default_model.strip()
    if not base_url:
        return ApiProviderTestResponse(ok=False, message="Base URL is required.")
    if not model:
        return ApiProviderTestResponse(ok=False, message="Select or enter a model first.")

    headers = {"Content-Type": "application/json"}
    if request.api_key.strip():
        headers["Authorization"] = f"Bearer {request.api_key.strip()}"
    if _cloud_provider_from_base_url(base_url) == CloudProvider.openrouter:
        headers["X-Title"] = "SweetrollLM"

    models_url = f"{base_url}/models"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            models_response = await client.get(models_url, headers=headers)
            if models_response.status_code == 200:
                return ApiProviderTestResponse(
                    ok=True,
                    message="Connection validated through the provider model registry.",
                    status_code=models_response.status_code,
                    endpoint=models_url,
                )
            if models_response.status_code in {401, 403}:
                return ApiProviderTestResponse(
                    ok=False,
                    message="Authentication failed. Check the API key for this profile.",
                    status_code=models_response.status_code,
                    endpoint=models_url,
                )

            chat_url = f"{base_url}/chat/completions"
            probe_payload = {
                "model": model,
                "messages": [{"role": "user", "content": "ping"}],
                "max_tokens": 1,
                "temperature": 0,
                "stream": False,
            }
            chat_response = await client.post(chat_url, headers=headers, json=probe_payload)
            if 200 <= chat_response.status_code < 300:
                return ApiProviderTestResponse(
                    ok=True,
                    message="Connection validated through a one-token chat probe.",
                    status_code=chat_response.status_code,
                    endpoint=chat_url,
                )
            return ApiProviderTestResponse(
                ok=False,
                message=(
                    f"Provider rejected the validation request with HTTP "
                    f"{chat_response.status_code}: {chat_response.text[:240]}"
                ),
                status_code=chat_response.status_code,
                endpoint=chat_url,
            )
    except httpx.TimeoutException:
        return ApiProviderTestResponse(
            ok=False,
            message="Connection test timed out. Verify the endpoint is reachable.",
            endpoint=models_url,
        )
    except httpx.RequestError as exc:
        return ApiProviderTestResponse(
            ok=False,
            message=f"Connection failed: {exc}",
            endpoint=models_url,
        )
    except Exception as exc:
        return ApiProviderTestResponse(
            ok=False,
            message=f"Provider validation failed: {exc}",
            endpoint=models_url,
        )


def _prepare_generation_request(request: ChatRequest) -> ChatRequest:
    max_tokens = max(1, min(request.max_tokens, settings.max_response_tokens))
    context_limit = max(512, settings.max_context_tokens)
    if request.source == InferenceSource.local:
        status = local_engine.status()
        if status.loaded and status.n_ctx:
            context_limit = min(context_limit, status.n_ctx)

    prompt_budget = max(
        128,
        context_limit - max_tokens - max(0, settings.context_safety_tokens),
    )
    system_prompt, system_cost = _trim_system_prompt(request.system_prompt, prompt_budget)
    message_budget = max(64, prompt_budget - system_cost)
    messages = _truncate_messages_for_budget(request.messages, message_budget)
    return request.model_copy(
        update={
            "max_tokens": max_tokens,
            "system_prompt": system_prompt,
            "messages": messages,
        }
    )


def _truncate_messages_for_budget(
    messages: list[ChatMessage], token_budget: int
) -> list[ChatMessage]:
    if not messages:
        return []

    kept: list[ChatMessage] = []
    remaining = max(32, token_budget)

    for message in reversed(messages):
        cost = _estimate_tokens(message.content)
        if cost <= remaining:
            kept.append(message)
            remaining -= cost
            continue
        if not kept:
            kept.append(
                message.model_copy(
                    update={
                        "content": _trim_text_to_token_budget(
                            message.content,
                            remaining,
                        )
                    }
                )
            )
        break

    kept.reverse()
    return kept


def _trim_system_prompt(system_prompt: str, prompt_budget: int) -> tuple[str, int]:
    if not system_prompt.strip():
        return "", 0
    system_budget = max(64, min(prompt_budget // 2, prompt_budget - 64))
    trimmed = _trim_text_to_token_budget(system_prompt.strip(), system_budget)
    return trimmed, _estimate_tokens(trimmed)


def _trim_text_to_token_budget(text: str, token_budget: int) -> str:
    if _estimate_tokens(text) <= token_budget:
        return text
    max_chars = max(96, token_budget * 4)
    return "[Earlier context truncated]\n" + text[-max_chars:].lstrip()


def _estimate_tokens(text: str) -> int:
    return max(1, (len(text) + 3) // 4)


def _extension_headers(api_key: Any) -> dict[str, str]:
    headers = {"Content-Type": "application/json"}
    if api_key:
        secret = api_key.get_secret_value()
        if secret:
            headers["Authorization"] = f"Bearer {secret}"
    return headers


def _build_image_generation_payload(request: ImageGenerationRequest) -> dict[str, Any]:
    common = {
        "prompt": request.prompt,
        "negative_prompt": request.negative_prompt,
        "aspect_ratio": request.aspect_ratio,
        "steps": request.steps,
    }
    if request.model.strip():
        common["model"] = request.model.strip()

    if request.provider == "comfyui":
        return {
            "prompt": common,
            "client_id": "sweetroll-lm",
        }
    if request.provider == "stable_diffusion":
        width, height = _aspect_ratio_dimensions(request.aspect_ratio)
        return {
            "prompt": request.prompt,
            "negative_prompt": request.negative_prompt,
            "steps": request.steps,
            "width": width,
            "height": height,
        }
    if request.provider in {"dalle3", "flux"}:
        payload = {
            "model": request.model.strip() or request.provider,
            "prompt": request.prompt,
            "n": 1,
            "size": _aspect_ratio_size(request.aspect_ratio),
        }
        return payload
    return common


def _build_vision_caption_payload(request: VisionCaptionRequest) -> dict[str, Any]:
    model = request.model.strip() or request.provider
    if request.provider in {"openai", "openrouter", "google"}:
        return {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": request.prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": request.data_url},
                        },
                    ],
                }
            ],
            "max_tokens": 512,
        }
    if request.provider == "ollama":
        return {
            "model": model,
            "prompt": request.prompt,
            "images": [_strip_data_url_prefix(request.data_url)],
            "stream": False,
        }
    return {
        "model": model,
        "prompt": request.prompt,
        "image": request.data_url,
        "images": [request.data_url],
        "filename": request.filename,
    }


def _strip_data_url_prefix(data_url: str) -> str:
    if "," in data_url and data_url.startswith("data:"):
        return data_url.split(",", 1)[1]
    return data_url


async def _read_multipart_image(request: Request, field_name: str) -> tuple[str, bytes, str]:
    content_type = request.headers.get("content-type", "")
    match = re.search(r'boundary=(?:"([^"]+)"|([^;]+))', content_type, flags=re.IGNORECASE)
    if not match:
        raise ValueError("Upload request must be multipart/form-data.")
    boundary = (match.group(1) or match.group(2) or "").strip()
    if not boundary:
        raise ValueError("Upload request is missing a multipart boundary.")

    delimiter = f"--{boundary}".encode("utf-8")
    body = await request.body()
    for raw_part in body.split(delimiter):
        part = raw_part.strip(b"\r\n")
        if not part or part == b"--":
            continue
        if part.endswith(b"--"):
            part = part[:-2].rstrip(b"\r\n")
        header_blob, separator, content = part.partition(b"\r\n\r\n")
        if not separator:
            continue
        headers = _parse_multipart_headers(header_blob)
        disposition = headers.get("content-disposition", "")
        name = _multipart_header_param(disposition, "name")
        filename = _multipart_header_param(disposition, "filename")
        if name != field_name or not filename:
            continue
        if content.endswith(b"\r\n"):
            content = content[:-2]
        media_type = headers.get("content-type") or mimetypes.guess_type(filename)[0] or ""
        if not media_type.startswith("image/"):
            raise ValueError("Global background upload must be an image file.")
        return filename, content, media_type
    raise ValueError("No background image file was included in the upload.")


def _parse_multipart_headers(header_blob: bytes) -> dict[str, str]:
    headers: dict[str, str] = {}
    for line in header_blob.decode("utf-8", errors="replace").split("\r\n"):
        name, separator, value = line.partition(":")
        if separator:
            headers[name.strip().lower()] = value.strip()
    return headers


def _multipart_header_param(header_value: str, parameter: str) -> str:
    match = re.search(
        rf'{re.escape(parameter)}=(?:"([^"]*)"|([^;]*))',
        header_value,
        flags=re.IGNORECASE,
    )
    if not match:
        return ""
    return (match.group(1) or match.group(2) or "").strip()


def _extract_image_url(data: dict[str, Any]) -> str:
    for key in ("image_url", "url", "output_url"):
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()

    for key in ("images", "data", "output"):
        value = data.get(key)
        if not isinstance(value, list):
            continue
        for item in value:
            if isinstance(item, str) and item.strip():
                if item.startswith(("http://", "https://", "data:image/")):
                    return item
                return f"data:image/png;base64,{item}"
            if isinstance(item, dict):
                for nested_key in ("url", "image_url", "b64_json"):
                    nested = item.get(nested_key)
                    if isinstance(nested, str) and nested.strip():
                        if nested_key == "b64_json":
                            return f"data:image/png;base64,{nested.strip()}"
                        return nested.strip()
    return ""


def _extract_caption(data: dict[str, Any]) -> str:
    for key in ("caption", "description", "text", "output", "response", "message"):
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
        if isinstance(value, dict) and isinstance(value.get("content"), str):
            return value["content"].strip()

    choices = data.get("choices")
    if isinstance(choices, list) and choices:
        first = choices[0]
        if isinstance(first, dict):
            message = first.get("message")
            if isinstance(message, dict) and isinstance(message.get("content"), str):
                return message["content"].strip()
            if isinstance(message, dict) and isinstance(message.get("content"), list):
                parts = [
                    item.get("text", "")
                    for item in message["content"]
                    if isinstance(item, dict)
                ]
                text = "\n".join(part for part in parts if part).strip()
                if text:
                    return text
            if isinstance(first.get("text"), str):
                return first["text"].strip()

    return ""


def _render_prepared_image_markdown(request: ImageGenerationRequest) -> str:
    details = [
        "**Image generation request prepared.**",
        f"- Provider: {request.provider}",
        f"- Aspect ratio: {request.aspect_ratio}",
        f"- Steps: {request.steps}",
    ]
    if request.negative_prompt.strip():
        details.append(f"- Negative prompt: {request.negative_prompt.strip()}")
    details.append(f"\nPrompt: {request.prompt.strip()}")
    return "\n".join(details)


def _render_image_job_markdown(
    request: ImageGenerationRequest, data: dict[str, Any]
) -> str:
    prompt_id = data.get("prompt_id") or data.get("id") or data.get("job_id")
    if prompt_id:
        return (
            "**Image generation job submitted.**\n"
            f"- Provider: {request.provider}\n"
            f"- Job ID: `{prompt_id}`\n"
            f"- Prompt: {request.prompt.strip()}"
        )
    return _render_prepared_image_markdown(request)


def _prepared_caption(request: VisionCaptionRequest) -> str:
    mime_type = "image"
    if request.data_url.startswith("data:") and ";" in request.data_url:
        mime_type = request.data_url[5 : request.data_url.find(";")] or "image"
    return (
        f"The user attached `{request.filename}` ({mime_type}). A vision backend was not "
        "available, so treat this as an image attachment and ask concise clarifying "
        "questions if visual specifics matter."
    )


def _aspect_ratio_dimensions(aspect_ratio: str) -> tuple[int, int]:
    ratio_map = {
        "1:1": (1024, 1024),
        "4:3": (1024, 768),
        "3:4": (768, 1024),
        "16:9": (1152, 648),
        "9:16": (648, 1152),
        "21:9": (1344, 576),
    }
    return ratio_map.get(aspect_ratio, (1024, 1024))


def _aspect_ratio_size(aspect_ratio: str) -> str:
    size_map = {
        "1:1": "1024x1024",
        "4:3": "1024x768",
        "3:4": "768x1024",
        "16:9": "1792x1024",
        "9:16": "1024x1792",
        "21:9": "1792x768",
    }
    return size_map.get(aspect_ratio, "1024x1024")


def _compact_extension_payload(data: dict[str, Any]) -> dict[str, Any]:
    compact: dict[str, Any] = {}
    for key, value in data.items():
        if isinstance(value, str) and len(value) > 500:
            compact[key] = f"{value[:500]}..."
        else:
            compact[key] = value
    return compact


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
