from __future__ import annotations

import json
import re
import asyncio
import sys
import os
import threading
import mimetypes
import subprocess
import smtplib
import shutil
import time
import uuid
from typing import Any
from email.mime.text import MIMEText
from pathlib import Path
from collections.abc import AsyncIterator

import httpx
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import FileResponse, Response, StreamingResponse

from .config import (
    agent_secret_values,
    ensure_agent_env_file,
    load_agent_environment,
    read_agent_env_values,
    settings,
    write_agent_env_values,
)
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
    ChatSummaryRequest,
    ChatSummaryResponse,
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
    OllamaModelDetailResponse,
    OllamaModelInfo,
    OllamaProviderRegisterRequest,
    OllamaPullJob,
    OllamaPullRequest,
    OllamaPullResponse,
    OllamaStatusResponse,
    UserPersonaProfile,
    UserPersonaSaveRequest,
    VisionCaptionRequest,
    VisionCaptionResponse,
    WorkspaceAgentRequest,
    WorkspaceAgentResponse,
    WorkspaceChatClearRequest,
    WorkspaceChatPruneRequest,
    WorkspaceChatSaveRequest,
    WorkspaceChatSession,
    WorkspaceDeleteRequest,
    WorkspaceEmailSettings,
    WorkspaceEmailSettingsResponse,
    WorkspaceFolderRequest,
    WorkspaceMetadataRequest,
    WorkspaceMetadataResponse,
    WorkspaceNode,
    WorkspaceToolCall,
    WorkspaceTreeResponse,
)
from .storage import (
    clear_global_background_image,
    delete_api_provider,
    delete_character,
    delete_chat_session,
    delete_lorebook,
    delete_persona,
    delete_workspace_chat_session,
    export_character_payload,
    get_api_provider,
    get_app_settings,
    get_asset_path,
    get_character,
    get_chat_session,
    get_global_background_path,
    get_lorebook,
    get_persona,
    get_workspace_chat_session,
    import_character_payload,
    import_local_gguf_model,
    list_api_providers,
    list_characters,
    list_chat_sessions,
    list_lorebooks,
    list_personas,
    list_workspace_chat_sessions,
    new_chat_id,
    prune_workspace_chat_tools,
    save_api_provider,
    save_app_settings,
    save_asset,
    save_asset_bytes,
    save_chat_session,
    save_character,
    save_lorebook,
    save_persona,
    save_workspace_chat_session,
    clear_workspace_chat_session,
    scan_gguf_models,
)


router = APIRouter()
local_engine = LocalLlamaEngine()
cloud_engine = CloudChatEngine()
ensure_agent_env_file()
_workspace_services_lock = threading.RLock()
_workspace_services: dict[str, subprocess.Popen[bytes]] = {}
_active_interrupts_lock = threading.RLock()
ACTIVE_INTERRUPTS: set[str] = set()
SECRET_MASK = "__SWEETROLL_STORED_SECRET__"
_external_fallback_lock = threading.RLock()
_external_fallback_config = ExternalApiFallbackConfig(
    enabled=settings.external_api_fallback_enabled,
    base_url=settings.external_api_base_url,
    model=settings.external_api_model,
    api_key=settings.external_api_key or None,
)
_ollama_pull_jobs_lock = threading.RLock()
_ollama_pull_jobs: dict[str, OllamaPullJob] = {}


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(storage_dir=str(settings.storage_dir))


@router.get("/logs", response_model=ConsoleLogResponse)
async def logs(limit: int = Query(500, ge=1, le=2000)) -> ConsoleLogResponse:
    lines, truncated = read_recent_logs(limit)
    return ConsoleLogResponse(lines=lines, text="\n".join(lines), truncated=truncated)


@router.get("/workspace/tree", response_model=WorkspaceTreeResponse)
async def workspace_tree() -> WorkspaceTreeResponse:
    root = _workspace_root()
    return WorkspaceTreeResponse(nodes=_workspace_nodes(root))


@router.post("/workspace/folders", response_model=WorkspaceTreeResponse)
async def create_workspace_folder(request: WorkspaceFolderRequest) -> WorkspaceTreeResponse:
    try:
        target = _resolve_workspace_path(request.path)
        target.mkdir(parents=True, exist_ok=True)
        return WorkspaceTreeResponse(nodes=_workspace_nodes(_workspace_root()))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/workspace/path", response_model=WorkspaceTreeResponse)
async def delete_workspace_path(request: WorkspaceDeleteRequest) -> WorkspaceTreeResponse:
    try:
        target = _resolve_workspace_path(request.path)
        if target == _workspace_root():
            raise ValueError("The workspace root cannot be deleted.")
        if target.is_dir():
            shutil.rmtree(target)
        elif target.is_file():
            target.unlink()
        else:
            raise FileNotFoundError(f"Workspace path not found: {request.path}")
        return WorkspaceTreeResponse(nodes=_workspace_nodes(_workspace_root()))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/workspace/metadata", response_model=WorkspaceMetadataResponse)
async def get_workspace_metadata() -> WorkspaceMetadataResponse:
    return WorkspaceMetadataResponse(metadata=_read_workspace_metadata())


@router.put("/workspace/metadata", response_model=WorkspaceMetadataResponse)
async def update_workspace_metadata(
    request: WorkspaceMetadataRequest,
) -> WorkspaceMetadataResponse:
    try:
        relative = _workspace_relative_path(_resolve_workspace_path(request.path))
        metadata = _read_workspace_metadata()
        metadata[relative] = {
            "metadata": request.metadata,
            "permissions": request.permissions,
        }
        _write_workspace_metadata(metadata)
        return WorkspaceMetadataResponse(metadata=metadata)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/workspace/agent", response_model=WorkspaceAgentResponse)
async def run_workspace_agent(request: WorkspaceAgentRequest) -> WorkspaceAgentResponse:
    started_at = time.monotonic()
    try:
        response = await _run_workspace_agent(request)
        return _with_workspace_metrics(response, request, started_at)
    except Exception as exc:
        return _with_workspace_metrics(WorkspaceAgentResponse(
            status="error",
            message=str(exc),
            assistant_text="",
            output="",
        ), request, started_at)


def _with_workspace_metrics(
    response: WorkspaceAgentResponse,
    request: WorkspaceAgentRequest,
    started_at: float,
) -> WorkspaceAgentResponse:
    elapsed = max(0.0, time.monotonic() - started_at)
    prompt_text = "\n".join([request.prompt, *[message.content for message in request.messages]])
    completion_text = "\n".join([response.assistant_text, response.output])
    prompt_tokens = _estimate_tokens(prompt_text)
    completion_tokens = _estimate_tokens(completion_text) if completion_text.strip() else 0
    return response.model_copy(
        update={
            "elapsed_seconds": round(elapsed, 3),
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens,
        }
    )


@router.post("/interrupt", response_model=dict[str, str])
async def interrupt_generation(request: Request) -> dict[str, str]:
    try:
        data = await request.json()
    except Exception:
        data = {}
    session_id = _workspace_session_id(str(data.get("session_id", "default")))
    with _active_interrupts_lock:
        ACTIVE_INTERRUPTS.add(session_id)
    return {"status": "signal_sent", "session_id": session_id}


@router.get("/workspace/chats", response_model=list[WorkspaceChatSession])
async def workspace_chats(folder_path: str | None = None) -> list[WorkspaceChatSession]:
    return list_workspace_chat_sessions(folder_path=folder_path)


@router.post("/workspace/chats", response_model=WorkspaceChatSession)
async def save_workspace_chat(request: WorkspaceChatSaveRequest) -> WorkspaceChatSession:
    try:
        return save_workspace_chat_session(request)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/workspace/chats/clear", response_model=WorkspaceChatSession)
async def clear_workspace_chat(request: WorkspaceChatClearRequest) -> WorkspaceChatSession:
    try:
        return clear_workspace_chat_session(request.id)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/workspace/chats/prune_tools", response_model=WorkspaceChatSession)
async def prune_workspace_chat(request: WorkspaceChatPruneRequest) -> WorkspaceChatSession:
    try:
        return prune_workspace_chat_tools(request.id)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.delete("/workspace/chats/{chat_id}", response_model=dict[str, str])
async def delete_workspace_chat(chat_id: str) -> dict[str, str]:
    try:
        delete_workspace_chat_session(chat_id)
        return {"status": "deleted", "id": chat_id}
    except Exception as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/workspace/services", response_model=dict[str, Any])
async def workspace_services() -> dict[str, Any]:
    return {"services": _workspace_service_statuses()}


@router.get("/workspace/email-settings", response_model=WorkspaceEmailSettingsResponse)
async def workspace_email_settings() -> WorkspaceEmailSettingsResponse:
    values = read_agent_env_values()
    return WorkspaceEmailSettingsResponse(
        provider=_smtp_provider_from_host(values.get("SMTP_SERVER", "")),
        smtp_server=values.get("SMTP_SERVER", ""),
        smtp_port=int(values.get("SMTP_PORT", "587") or "587"),
        smtp_email=values.get("SMTP_EMAIL", ""),
        has_password=bool(values.get("SMTP_PASSWORD")),
        presets=_smtp_presets(),
    )


@router.put("/workspace/email-settings", response_model=WorkspaceEmailSettingsResponse)
async def save_workspace_email_settings(
    request: WorkspaceEmailSettings,
) -> WorkspaceEmailSettingsResponse:
    current = read_agent_env_values()
    password = request.smtp_password.strip() or current.get("SMTP_PASSWORD", "")
    write_agent_env_values(
        {
            "SMTP_SERVER": request.smtp_server.strip(),
            "SMTP_PORT": str(request.smtp_port),
            "SMTP_EMAIL": request.smtp_email.strip(),
            "SMTP_PASSWORD": password,
        }
    )
    return await workspace_email_settings()


@router.post("/workspace/email-settings/test", response_model=ApiProviderTestResponse)
async def test_workspace_email_settings(
    request: WorkspaceEmailSettings,
) -> ApiProviderTestResponse:
    password = request.smtp_password.strip() or read_agent_env_values().get("SMTP_PASSWORD", "")
    if not all([request.smtp_server.strip(), request.smtp_email.strip(), password]):
        return ApiProviderTestResponse(
            ok=False,
            message="SMTP server, email address, and password/app-password are required.",
            status_code=0,
            endpoint=request.smtp_server.strip(),
        )
    try:
        if request.smtp_port == 465:
            client: smtplib.SMTP = smtplib.SMTP_SSL(
                request.smtp_server.strip(), request.smtp_port, timeout=12
            )
        else:
            client = smtplib.SMTP(request.smtp_server.strip(), request.smtp_port, timeout=12)
        with client:
            client.ehlo()
            if request.smtp_port != 465:
                client.starttls()
                client.ehlo()
            client.login(request.smtp_email.strip(), password)
            code, message = client.noop()
        return ApiProviderTestResponse(
            ok=200 <= int(code) < 400,
            message=f"SMTP login validated with code {code}: {message!r}",
            status_code=int(code),
            endpoint=request.smtp_server.strip(),
        )
    except smtplib.SMTPResponseException as exc:
        detail = exc.smtp_error.decode("utf-8", errors="replace") if isinstance(exc.smtp_error, bytes) else str(exc.smtp_error)
        return ApiProviderTestResponse(
            ok=False,
            message=f"SMTP rejected login with code {exc.smtp_code}: {detail}",
            status_code=int(exc.smtp_code),
            endpoint=request.smtp_server.strip(),
        )
    except Exception as exc:
        return ApiProviderTestResponse(
            ok=False,
            message=f"SMTP validation failed: {exc}",
            status_code=0,
            endpoint=request.smtp_server.strip(),
        )


def _smtp_presets() -> dict[str, dict[str, str | int]]:
    return {
        "gmail": {
            "label": "Gmail / Google Workspace",
            "smtp_server": "smtp.gmail.com",
            "smtp_port": 587,
        },
        "outlook": {
            "label": "Outlook / Hotmail / Live",
            "smtp_server": "smtp-mail.outlook.com",
            "smtp_port": 587,
        },
        "yahoo": {
            "label": "Yahoo Mail",
            "smtp_server": "smtp.mail.yahoo.com",
            "smtp_port": 587,
        },
        "zoho": {
            "label": "Zoho Mail",
            "smtp_server": "smtp.zoho.com",
            "smtp_port": 587,
        },
        "proton": {
            "label": "Proton Mail Bridge",
            "smtp_server": "127.0.0.1",
            "smtp_port": 1025,
        },
        "custom": {
            "label": "Custom SMTP",
            "smtp_server": "",
            "smtp_port": 587,
        },
    }


def _smtp_provider_from_host(host: str) -> str:
    lowered = (host or "").lower()
    if "gmail" in lowered:
        return "gmail"
    if "outlook" in lowered or "hotmail" in lowered or "live" in lowered:
        return "outlook"
    if "yahoo" in lowered:
        return "yahoo"
    if "zoho" in lowered:
        return "zoho"
    if lowered in {"127.0.0.1", "localhost"}:
        return "proton"
    return "custom"


def _workspace_root() -> Path:
    root = settings.workspace_dir.resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def _workspace_real_root() -> Path:
    return Path(os.path.realpath(os.path.abspath(str(_workspace_root()))))


def _workspace_metadata_path() -> Path:
    return _workspace_root() / ".workspace_meta.json"


def _resolve_workspace_path(relative_path: str | None = "") -> Path:
    root = _workspace_real_root()
    original_path = (relative_path or "").strip()
    raw_path = _normalize_workspace_tool_path(relative_path)
    if raw_path in {"", ".", "/"}:
        return root

    if re.match(r"^[A-Za-z]:", raw_path) or raw_path.startswith(("/", "\\")):
        target = Path(os.path.realpath(os.path.abspath(original_path))).resolve()
        try:
            target.relative_to(root)
            return target
        except ValueError as exc:
            raise ValueError(
                "Path security violation: absolute paths must resolve inside ./workspace."
            ) from exc

    parts = [part for part in raw_path.split("/") if part not in {"", "."}]
    if any(part == ".." for part in parts):
        raise ValueError("Path security violation: path traversal outside ./workspace is not allowed.")
    target = Path(os.path.realpath(os.path.abspath(str(root / Path(*parts))))).resolve()
    try:
        target.relative_to(root)
    except ValueError as exc:
        raise ValueError("Path security violation: path traversal outside ./workspace is not allowed.") from exc
    return target


def _normalize_workspace_tool_path(relative_path: str | None = "") -> str:
    raw_path = (relative_path or "").strip().replace("\\", "/")
    while raw_path.startswith("./"):
        raw_path = raw_path[2:]
    if raw_path == "workspace":
        return ""
    for prefix in ("workspace/", "./workspace/"):
        if raw_path.startswith(prefix):
            return raw_path[len(prefix) :]
    return raw_path


def _workspace_relative_path(path: Path) -> str:
    root = _workspace_real_root()
    try:
        relative = Path(os.path.realpath(os.path.abspath(str(path)))).resolve().relative_to(root)
    except ValueError as exc:
        raise ValueError("Path security violation: path traversal outside ./workspace is not allowed.") from exc
    return relative.as_posix() or "."


def _workspace_nodes(parent: Path, depth: int = 0, max_depth: int = 5) -> list[WorkspaceNode]:
    if not parent.exists() or not parent.is_dir():
        return []
    nodes: list[WorkspaceNode] = []
    for child in sorted(parent.iterdir(), key=lambda item: (not item.is_dir(), item.name.lower())):
        if child.name == ".workspace_meta.json":
            continue
        try:
            stat = child.stat()
        except OSError:
            continue
        nodes.append(
            WorkspaceNode(
                name=child.name,
                path=_workspace_relative_path(child),
                kind="folder" if child.is_dir() else "file",
                size_bytes=0 if child.is_dir() else stat.st_size,
                modified_at=str(int(stat.st_mtime)),
                children=_workspace_nodes(child, depth + 1, max_depth)
                if child.is_dir() and depth < max_depth
                else [],
            )
        )
    return nodes


def _read_workspace_metadata() -> dict[str, Any]:
    metadata_path = _workspace_metadata_path()
    if not metadata_path.exists():
        return {}
    try:
        data = json.loads(metadata_path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def _write_workspace_metadata(metadata: dict[str, Any]) -> None:
    _workspace_metadata_path().write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def _workspace_tree_prompt() -> str:
    lines: list[str] = []

    def walk(nodes: list[WorkspaceNode], depth: int = 0) -> None:
        for node in nodes:
            marker = "[dir]" if node.kind == "folder" else "[file]"
            lines.append(f"{'  ' * depth}{marker} {node.path}")
            walk(node.children, depth + 1)

    walk(_workspace_nodes(_workspace_root()))
    return "\n".join(lines) if lines else "(workspace is empty)"


def _workspace_character_prompt(character_id: str | None) -> str:
    if not character_id:
        return ""
    character = get_character(character_id)
    if not character:
        return ""
    parts = [
        f"Assigned agent character: {character.name}",
        f"Description: {character.description}".strip(),
        f"Personality: {character.personality}".strip(),
    ]
    if character.scenario:
        parts.append(f"Scenario: {character.scenario}")
    if character.example_dialogue:
        parts.append(f"Example dialogue: {character.example_dialogue}")
    return "\n".join(part for part in parts if part and not part.endswith(":"))


def _workspace_system_prompt(request: WorkspaceAgentRequest) -> str:
    character_prompt = _workspace_character_prompt(request.character_id)
    control_label = request.control_level.replace("_", " ").title()
    current_directory = _workspace_current_directory(request.current_directory)
    directory_context = ""
    if current_directory:
        directory_context = (
            f"Context: The user currently has the folder directory '{current_directory}' selected "
            "in their interface sidebar tree. Unless specified otherwise, paths for files you "
            "create or modify should be relative to this subfolder.\n\n"
        )
    visual_context = ""
    if request.vision_context.strip():
        visual_context = (
            "Visual context supplied by the user for this workspace turn:\n"
            f"{request.vision_context.strip()}\n\n"
        )
    return (
        "You are running inside SweetrollLM's Agentic Beta Workspace, a sandboxed "
        "folder-aware environment. You may reason about files only inside ./workspace. "
        "Never request or imply access outside that directory. You are a hyper-capable "
        "autonomous engineer. If Strategy A fails, you must immediately devise and attempt "
        "Strategy B without asking the user for guidance, while staying inside the workspace "
        "sandbox and using only user-authorized local resources. You have full codebase "
        "editing agency for projects located inside ./workspace: inspect files, rewrite code, "
        "run tests, repair UI/UX defects, and verify the result with local tools before "
        "answering. Operate as a stateful Reasoning-and-Execution Engine: break large tasks "
        "into a dynamic task tree in your private reasoning, then emit exactly ONE atomic "
        "tool action at a time. Before each tool action, your assistant text may include a "
        "brief structured monologue with Thought, Expected_State, and Action. After each tool "
        "result, treat the output plus a fresh directory or status observation as the next "
        "Observation phase before deciding the next atomic action.\n\n"
        f"{directory_context}"
        f"{visual_context}"
        f"Agent control level: {control_label}.\n"
        "Available workspace tree:\n"
        f"{_workspace_tree_prompt()}\n\n"
        f"{character_prompt}\n\n"
        "When a file-system action is needed, return compact JSON and no prose, using one of "
        "these actions: list, read, write, mkdir, delete, run, run_terminal_command, "
        "start_background_service, send_automation_email, execute_automation_task. "
        "Use run_terminal_command for shell commands that build, test, install local "
        "packages, or execute project scripts. Use start_background_service for long-running "
        "local servers or APIs that should keep running in the background. Use "
        "send_automation_email only when the user clearly asks for email dispatch. "
        "Use execute_automation_task for browser or desktop automation with Python scripts. "
        'Its schema is {"tool":"execute_automation_task","mode":"stealth","script_content":"..."}. '
        "DEFAULT STATE: You must always default to mode: stealth for web automation, mail "
        "dispatch, testing, and file operations. Perform tasks silently in system background "
        "memory using headless workflows so you do not interrupt the human user's active "
        "desktop workspace. EXCEPTIONAL STATE: You may only pivot to mode: desktop if the "
        "user explicitly requests to see visual interaction on their monitor, or if the "
        "target application is a local legacy executable that completely lacks a web "
        "interface, localport exposure, or headless alternative. "
        "In stealth mode, write headless Python using Playwright, requests, urllib, or other "
        "silent libraries. In desktop mode, write PyAutoGUI scripts to simulate physical "
        "hardware inputs. The script is written into the active workspace folder and executed "
        "with the server Python environment. If execution returns ModuleNotFoundError or "
        "ImportError, immediately use run_terminal_command to provision the missing package "
        "silently, for example pip install playwright pyautogui, then retry the automation. "
        "If direct background API calls, SMTP endpoints, or headless stealth scripts fail due "
        "to bad credentials, authentication blocks, expired sessions, MFA, permission denial, "
        "or network firewalls, you are strictly commanded to pivot to a visual desktop "
        "workflow rather than asking the user for credentials. You can trigger the host "
        "system's default, logged-in browser directly by writing a script that uses Python's "
        "built-in webbrowser library, for example import webbrowser; webbrowser.open(url). "
        "When pivoting to a visual browser workflow for emails, run strict recipient-domain "
        "analysis before composing the browser URL. If the recipient ends in @gmail.com, "
        "use Gmail compose: https://mail.google.com/mail/?view=cm&fs=1&to={recipient}&su={subject}&body={body}. "
        "If the recipient ends in @outlook.com, @hotmail.com, or @live.com, use Outlook "
        "compose: https://outlook.live.com/default.aspx?rru=compose&to={recipient}&subject={subject}&body={body}. "
        "For custom corporate domains or unresolved aliases, use the native OS protocol "
        "scheme mailto:{recipient}?subject={subject}&body={body}. Always URL-encode the "
        "recipient, subject, and body with urllib.parse.quote before calling webbrowser.open. "
        "If a background automation script or send_automation_email "
        "returns a credential error such as SMTP code 535, do not declare failure to the "
        "human user. Log the failure internally, immediately switch execute_automation_task "
        "from mode: stealth to mode: desktop, and generate a new script that opens the host "
        "browser visually. CRITICAL: Do not open a browser window and leave the task "
        "half-finished. When opening a composition interface like Gmail, your script must "
        "stay active to complete the execution chain. You must append a brief delay and an "
        "automated hardware keystroke directly into the generated .tmp_runtime.py script to "
        "execute the submit action autonomously. When generating desktop scripts that use "
        "webbrowser and pyautogui, you must also use pygetwindow to scan for, restore, "
        "activate, and maximize the target browser window before executing keyboard commands. "
        "Use this exact force-maximize and triple-strike browser delivery structure: "
        "import webbrowser; import time; import pyautogui; import pygetwindow as gw; "
        "webbrowser.open(compose_url, new=2); "
        "time.sleep(6.0); "
        "target_windows = [w for w in gw.getAllWindows() if \"Gmail\" in w.title or \"Compose\" in w.title or \"Firefox\" in w.title or \"Chrome\" in w.title]; "
        "print(f'focus_candidates={len(target_windows)}'); "
        "if target_windows: "
        "    win = target_windows[0]; "
        "    try: "
        "        win.minimize(); time.sleep(0.5); "
        "        win.restore(); win.maximize(); win.activate(); time.sleep(1.0); "
        "        print(f'focused_window={win.title}') "
        "    except Exception as e: print(f'Window activation warning: {e}') "
        "else: print('focus_candidates=0; attempting hotkey fallback'); "
        "# ABSOLUTE CANVAS FOCUS: always runs, never skipped. "
        "screen_width, screen_height = pyautogui.size(); "
        "pyautogui.click(screen_width // 2, screen_height // 2); "
        "time.sleep(1.0); "
        "Do not press Tab after the canvas click for Gmail compose; the physical click is the "
        "focus capture step and Tab may move focus into the formatting toolbar. "
        "pyautogui.hotkey('ctrl', 'enter'); "
        "print('Keystroke macro dispatched. Initiating validation sweep...'); "
        "time.sleep(5.0); "
        "active_compositions = [w for w in gw.getAllWindows() if \"Compose Mail\" in w.title]; "
        "if active_compositions: "
        "    pyautogui.screenshot('failed_automation_state.png'); "
        "    print('VERIFICATION_FAILURE: The compose window is still present on screen! Keystrokes were swallowed.'); "
        "    raise RuntimeError('Automation verification failed: Compose tab did not close.') "
        "else: print('VERIFICATION_SUCCESS: Compose window cleared cleanly from desktop stack.'). "
        "If window activation fails or no matching window is found, the script must still "
        "attempt the keystroke as a fallback and log the attempt context to stdout so the "
        "Critic Matrix can inspect what happened. "
        "Keyboard macros are strictly unreliable until web canvas focus is guaranteed, so "
        "desktop browser scripts must physically click the center of the maximized viewport "
        "before sending shortcut keys. After firing a submit macro, desktop scripts must "
        "perform a 5-second post-execution verification window sweep; if the compose or form "
        "window is still active, capture failed_automation_state.png in the workspace and "
        "raise RuntimeError so the recursive correction loop can retry with alternate mouse "
        "targets, Alt+S, tab-navigation, or Send-button click coordinates. "
        "Omniscient Vision Inspection Protocol: if post-execution desktop verification fails, "
        "capture a full-resolution desktop screenshot with pyautogui.screenshot('./workspace/failed_automation_state.png') "
        "or, when already running in the workspace cwd, pyautogui.screenshot('failed_automation_state.png'). "
        "Treat the screenshot path and stdout/stderr as evidence for the next correction loop. "
        "Multi-Turn Strategic Pivot Routine: if Strategy A such as Ctrl+Enter fails to clear "
        "the visual frame verification check, Strategy B is OS-level Alt+Tab focus cycling, "
        "Strategy C is alternate platform shortcut chords such as Alt+S for Outlook or "
        "universal mail systems, and Strategy D is physical viewport cursor navigation to "
        "click the on-screen Send button coordinates. "
        "You must rely entirely on the stdout/stderr reports from .tmp_runtime.py. If a script "
        "completes with exit_code=0 but your structural verification shows the task needs a "
        "follow-up action, do not tell the user to complete it manually. Regenerate, adjust "
        "timings, use backup keystroke combinations, or run another desktop automation step "
        "autonomously. "
        "If the user commands you to send the message yourself after a browser tab has been "
        "initialized, do not reply with a canned statement regarding SMTP restrictions. "
        "Immediately invoke execute_automation_task in desktop mode to simulate the necessary "
        "keyboard inputs on the host machine to complete the action. "
        "For terminal and service tools, include target_dir when the command should run inside "
        "a cloned repository or subfolder, for example "
        '{"tool":"run_terminal_command","command":"git status","target_dir":"SweetrollLM"}. '
        "Git Operations: You are fully authorized to use git commands via run_terminal_command. "
        "For authenticated remote actions, utilize the securely injected environment variables. "
        "Testing/Browsing: You are authorized to write script wrappers using Python urllib, "
        "requests, Playwright, Selenium, or installed frameworks to internally query, scrape, "
        "test localports, or verify deployed code assets without spawning an external UI window. "
        "When asked to send an email, if SMTP environment credentials are unavailable or "
        "incomplete, you are fully authorized to write and execute a headless or headed Python "
        "script via execute_automation_task to open a local browser wrapper, navigate to an "
        "email provider, or interface with available web automation targets. "
        "CRITICAL DIRECTIVE: You must inspect the execution metrics of every tool call you run. "
        "If a tool returns an exit_code other than 0, exit_code=timeout, or if a service log "
        "displays Error, Traceback, failed, or No such file, you have FAILED the step. "
        "You must not declare a task complete if a sub-command fails. Instead, use the next "
        "iteration of the loop to read the error output, diagnose the issue, execute a corrective "
        "command, and verify success. Examples include pulling remote changes before pushing, "
        "using git add -f for intentionally ignored files when the user asked for it, installing "
        "missing dependencies, fixing paths, then rerunning the failed check. Encourage yourself "
        "to run a validation, status, or file-read tool after an operation to prove the asset "
        "modification is live on disk before answering the user. "
        "If an internal structural tool like delete, read, or write fails or acts restricted, "
        "do not repeat the exact same structural call. Immediately pivot to an alternate "
        "system shell method such as PowerShell, cmd, bash, Python pathlib, or another terminal "
        "command that can achieve the user's objective inside the workspace sandbox. "
        "If pygetwindow fails to grab a specific browser tab title because of language "
        "differences, browser variants, or title timing, pivot the desktop script to iterate "
        "through all active window handles, look for broader workspace candidates such as "
        "browser process titles, or use safe universal focus sequences like Alt+Tab cycles "
        "with PyAutoGUI before firing input sequences. If an automation script cannot use a "
        "direct authenticated or network path, pivot to an alternate user-authorized local "
        "workflow such as a logged-in browser session, local socket query, terminal script, "
        "or OS-level layout command; do not attempt to bypass security controls or access "
        "resources the user has not authorized. "
        "RIGID SUCCESS VERIFICATION VECTOR: You are forbidden from declaring a task complete "
        "based on assumption. Before issuing a final text response, run a dedicated verification "
        "tool step. For file operations, verify the file exists and inspect relevant contents. "
        "For system state changes, execute a diagnostic query or status command. For desktop "
        "browser scripts, log validation hooks proving the script reached its final keystroke "
        "line without exceptions, such as printed focus candidates, focused window title, and "
        "hotkey dispatch confirmation. "
        "For a single action use "
        '{"tool":{"action":"read","path":"notes.txt","reason":"why this is needed"}}. '
        'Terminal shorthand is also accepted as {"tool":"run_terminal_command","command":"python -m pytest"}. '
        'Background service shorthand is {"tool":"start_background_service","service_name":"api","command":"python app.py"}. '
        'Email shorthand is {"tool":"send_automation_email","to":"person@example.com","subject":"Subject","body":"Message"}. '
        'Automation shorthand is {"tool":"execute_automation_task","mode":"stealth","script_content":"print(\'check\')"}. '
        "For multiple actions in one turn, prefer "
        '{"tools":[{"action":"write","path":"hello.py","content":"print(\'hi\')"},'
        '{"action":"run_terminal_command","command":"python hello.py"}]}. '
        "For writes include content. For commands include command. After SweetrollLM returns "
        "tool results, read those results and provide a final human-readable answer unless "
        "another tool is genuinely needed. If no tool is needed, answer normally."
    ).strip()


def _workspace_cloud_provider_from_url(base_url: str) -> CloudProvider:
    lowered = base_url.lower()
    if "openrouter" in lowered:
        return CloudProvider.openrouter
    if "openai" in lowered:
        return CloudProvider.openai
    if _is_ollama_base_url(base_url):
        return CloudProvider.ollama
    return CloudProvider.custom


def _workspace_cloud_settings(request: WorkspaceAgentRequest) -> CloudSettings | None:
    if request.api_provider_id:
        provider = get_api_provider(request.api_provider_id)
        if provider:
            return CloudSettings(
                provider=_workspace_cloud_provider_from_url(provider.base_url),
                base_url=provider.base_url,
                api_key=provider.api_key or None,
                model=provider.default_model or settings.external_api_model,
            )
    if request.cloud:
        return request.cloud
    if settings.external_api_base_url:
        return CloudSettings(
            provider=_workspace_cloud_provider_from_url(settings.external_api_base_url),
            base_url=settings.external_api_base_url,
            api_key=settings.external_api_key or None,
            model=settings.external_api_model,
        )
    return None


def _workspace_direct_intent_response(
    request: WorkspaceAgentRequest,
) -> WorkspaceAgentResponse | None:
    prompt = request.prompt.strip()
    lowered = prompt.lower()
    if not prompt:
        return None
    if request.control_level == "read_only" and _workspace_prompt_requires_mutation(lowered):
        return WorkspaceAgentResponse(
            status="denied",
            message="Read-Only mode blocked a workspace mutation.",
            assistant_text=(
                "Read-Only control level denied that workspace mutation. Switch to Ask First "
                "or Full Access to create, run, or delete files."
            ),
        )
    if request.control_level == "ask_first" and _workspace_prompt_requires_mutation(lowered):
        tool = _workspace_preview_direct_tool(request)
        if tool is not None:
            return WorkspaceAgentResponse(
                status="needs_approval",
                message=f"Direct workspace intent detected. Approve {tool.action} for {tool.path or tool.command or '.'}?",
                assistant_text="I detected an explicit workspace mutation and am waiting for your approval.",
                pending_task=tool,
                pending_tasks=[tool],
                context_messages=request.messages,
            )

    exact_response = _workspace_exact_reply_response(prompt)
    if exact_response is not None:
        return exact_response
    if _workspace_is_email_prompt(lowered):
        return _workspace_direct_email_response(request)
    if _workspace_is_destructive_prompt(lowered):
        return _workspace_direct_delete_response(request)
    if _workspace_is_python_create_run_prompt(lowered):
        return _workspace_direct_python_response(request)
    return None


def _workspace_exact_reply_response(prompt: str) -> WorkspaceAgentResponse | None:
    lowered = prompt.lower()
    if "reply exactly" not in lowered or "do not use tools" not in lowered:
        return None
    match = re.search(
        r"reply exactly\s+([\"']?)(?P<text>[^\"'.\n]+)\1",
        prompt,
        re.IGNORECASE,
    )
    if not match:
        return None
    text = match.group("text").strip()
    if not text:
        return None
    return WorkspaceAgentResponse(
        status="completed",
        message="Direct exact-response workspace prompt completed.",
        assistant_text=text,
        output="No tools needed.",
    )


def _workspace_prompt_requires_mutation(lowered_prompt: str) -> bool:
    return (
        _workspace_is_destructive_prompt(lowered_prompt)
        or _workspace_is_python_create_run_prompt(lowered_prompt)
        or _workspace_is_email_prompt(lowered_prompt)
    )


def _workspace_preview_direct_tool(request: WorkspaceAgentRequest) -> WorkspaceToolCall | None:
    lowered = request.prompt.lower()
    if _workspace_is_email_prompt(lowered):
        return _workspace_email_tool_from_prompt(request.prompt)
    if _workspace_is_destructive_prompt(lowered):
        paths = _workspace_prompt_file_targets(request.prompt)
        return WorkspaceToolCall(action="delete", path=paths[0] if paths else ".")
    if _workspace_is_python_create_run_prompt(lowered):
        return WorkspaceToolCall(action="write", path=_workspace_python_target_name(request.prompt))
    return None


def _workspace_is_destructive_prompt(lowered_prompt: str) -> bool:
    destructive = {"delete", "remove", "clear", "purge", "wipe", "erase"}
    return any(word in lowered_prompt for word in destructive) and (
        "workspace" in lowered_prompt
        or "file" in lowered_prompt
        or "folder" in lowered_prompt
        or "." in lowered_prompt
    )


def _workspace_is_python_create_run_prompt(lowered_prompt: str) -> bool:
    create_words = {"create", "make", "write", "generate", "build"}
    run_words = {"run", "execute", "test", "show output", "print output"}
    return (
        any(word in lowered_prompt for word in create_words)
        and ("python" in lowered_prompt or ".py" in lowered_prompt or "script" in lowered_prompt)
        and any(word in lowered_prompt for word in run_words)
    )


def _workspace_is_email_prompt(lowered_prompt: str) -> bool:
    email_words = (
        "send an email",
        "send email",
        "email ",
        "e-mail",
        "mail ",
        "message ",
    )
    return (
        any(word in lowered_prompt for word in email_words)
        and re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", lowered_prompt)
        is not None
    )


def _workspace_direct_email_response(request: WorkspaceAgentRequest) -> WorkspaceAgentResponse:
    tool = _workspace_email_tool_from_prompt(request.prompt)
    if not tool.to:
        return WorkspaceAgentResponse(
            status="completed",
            message="No email recipient found.",
            assistant_text=(
                "I detected an email request, but could not identify a valid recipient address."
            ),
            output="No email dispatch attempted.",
            context_messages=request.messages,
        )
    outputs = [_execute_workspace_tool_report(tool, request.current_directory, 1, 1)]
    browser_tool: WorkspaceToolCall | None = None
    if _workspace_email_output_needs_browser_pivot(outputs[-1]):
        browser_tool = _workspace_email_browser_fallback_tool(tool)
        outputs.append(_execute_workspace_tool_report(browser_tool, request.current_directory, 2, 2))
        if "dependency_provisioned=true" in outputs[-1].lower():
            outputs.append(_execute_workspace_tool_report(browser_tool, request.current_directory, 3, 3))
    output = "\n\n".join(outputs)
    fallback_success = any("verification_success" in item.lower() for item in outputs[1:])
    failure = _workspace_output_indicates_failure(output) and not fallback_success
    if failure:
        assistant_text = (
            f"I attempted to send the email to {tool.to}, but the mail transport returned an "
            "error or browser verification failed. Review the execution monitor for the exact "
            "SMTP/browser-pivot details."
        )
        status = "error"
        message = "Direct email dispatch failed."
    else:
        assistant_text = (
            f"Email dispatch to {tool.to} completed. Review the execution monitor for the "
            "transport confirmation."
        )
        status = "completed"
        message = "Direct email dispatch completed."
    return WorkspaceAgentResponse(
        status=status,
        message=message,
        assistant_text=assistant_text,
        output=output,
        pending_task=tool,
        pending_tasks=[item for item in [tool, browser_tool] if item is not None],
        context_messages=request.messages,
    )


def _workspace_email_output_needs_browser_pivot(output: str) -> bool:
    lowered = output.lower()
    return (
        '"browser_pivot_required": true' in lowered
        or '"browser_pivot_required":true' in lowered
    )


def _workspace_email_tool_from_prompt(prompt: str) -> WorkspaceToolCall:
    recipient_match = re.search(
        r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
        prompt,
        re.IGNORECASE,
    )
    recipient = recipient_match.group(0) if recipient_match else ""
    subject = _workspace_email_subject_from_prompt(prompt)
    body = _workspace_email_body_from_prompt(prompt, recipient)
    return WorkspaceToolCall(
        action="send_automation_email",
        to=recipient,
        subject=subject,
        body=body,
    )


def _workspace_email_browser_fallback_tool(email_tool: WorkspaceToolCall) -> WorkspaceToolCall:
    return WorkspaceToolCall(
        action="execute_automation_task",
        mode="desktop",
        script_content=_workspace_email_browser_fallback_script(
            email_tool.to,
            email_tool.subject,
            email_tool.body,
        ),
    )


def _workspace_email_subject_from_prompt(prompt: str) -> str:
    subject_match = re.search(
        r"(?:subject|title)\s*[:=]\s*[\"']?(.+?)[\"']?(?:\s+(?:body|message|saying)\b|$)",
        prompt,
        re.IGNORECASE | re.DOTALL,
    )
    if subject_match:
        subject = re.sub(r"\s+", " ", subject_match.group(1)).strip(" .;\"'")
        if subject:
            return subject[:160]
    quoted = re.findall(r"[\"']([^\"']{3,160})[\"']", prompt)
    if quoted:
        return quoted[0].strip()[:160]
    if "test" in prompt.lower():
        return "SweetrollLM automated workspace test"
    return "Message from SweetrollLM"


def _workspace_email_body_from_prompt(prompt: str, recipient: str) -> str:
    body_patterns = (
        r"(?:body|message)\s*[:=]\s*(.+)$",
        r"(?:saying|that says|with the text)\s+[\"']?(.+?)[\"']?$",
    )
    for pattern in body_patterns:
        match = re.search(pattern, prompt, re.IGNORECASE | re.DOTALL)
        if match:
            body = match.group(1).strip(" .;\"'")
            if body:
                return body[:5000]
    quoted = re.findall(r"[\"']([^\"']{3,5000})[\"']", prompt)
    if len(quoted) >= 2:
        return quoted[1].strip()[:5000]
    if len(quoted) == 1 and "subject" not in prompt.lower():
        return quoted[0].strip()[:5000]
    return (
        "This is a harmless SweetrollLM Agentic Workspace delivery test. "
        "No action is required."
    )


def _workspace_direct_python_response(request: WorkspaceAgentRequest) -> WorkspaceAgentResponse:
    filename = _workspace_python_target_name(request.prompt)
    content = _workspace_python_script_from_prompt(request.prompt)
    tools = [
        WorkspaceToolCall(action="write", path=filename, content=content),
        WorkspaceToolCall(action="read", path=filename),
        WorkspaceToolCall(action="run_terminal_command", command=f"python {filename}"),
    ]
    output = _execute_workspace_tools(tools, request.current_directory)
    assistant_text = (
        f"Created and ran `{filename}`. Review the execution monitor for the exact stdout."
    )
    if _workspace_output_indicates_failure(output):
        assistant_text = (
            f"I attempted to create and run `{filename}`, but verification found an error. "
            "The failure details are in the execution monitor."
        )
    return WorkspaceAgentResponse(
        status="completed",
        message="Direct workspace create/run intent completed.",
        assistant_text=assistant_text,
        output=output,
        pending_task=tools[0],
        pending_tasks=tools,
        context_messages=request.messages,
    )


def _workspace_python_target_name(prompt: str) -> str:
    paths = [path for path in _workspace_prompt_file_targets(prompt) if path.lower().endswith(".py")]
    if paths:
        return paths[0]
    return "workspace_script.py"


def _workspace_python_script_from_prompt(prompt: str) -> str:
    lowered = prompt.lower()
    print_match = re.search(r"print\s*\((.+?)\)", prompt, re.IGNORECASE | re.DOTALL)
    if print_match:
        expression = print_match.group(1).strip()
        if "\n" not in expression and len(expression) <= 500:
            return f"print({expression})\n"
    phrase_match = re.search(
        r"\bprints?\s+(['\"])(?P<text>.+?)\1",
        prompt,
        re.IGNORECASE | re.DOTALL,
    )
    if phrase_match:
        phrase = re.sub(r"\s+", " ", phrase_match.group("text").strip())
        if phrase:
            return f"print({json.dumps(phrase[:500])})\n"
    if "factorial" in lowered:
        return (
            "def factorial(n):\n"
            "    return 1 if n <= 1 else n * factorial(n - 1)\n\n"
            "print('factorial(5)=', factorial(5))\n"
        )
    if "fibonacci" in lowered:
        return (
            "def fibonacci(n):\n"
            "    values = [0, 1]\n"
            "    while len(values) < n:\n"
            "        values.append(values[-1] + values[-2])\n"
            "    return values[:n]\n\n"
            "print('fibonacci=', fibonacci(10))\n"
        )
    return (
        "from datetime import datetime\n\n"
        "def main():\n"
        "    print('SweetrollLM workspace script executed successfully.')\n"
        "    print('timestamp=', datetime.now().isoformat(timespec='seconds'))\n\n"
        "if __name__ == '__main__':\n"
        "    main()\n"
    )


def _workspace_direct_delete_response(request: WorkspaceAgentRequest) -> WorkspaceAgentResponse:
    targets = _workspace_delete_targets_from_prompt(request.prompt, request.current_directory)
    if not targets:
        return WorkspaceAgentResponse(
            status="completed",
            message="No delete target found.",
            assistant_text=(
                "I detected a delete request but could not identify a safe target inside the "
                "workspace. Name a file, folder, or say 'clear workspace files'."
            ),
            output="No workspace delete operation executed.",
            context_messages=request.messages,
        )
    tools: list[WorkspaceToolCall] = []
    for target in targets:
        tool = WorkspaceToolCall(action="delete", path=target)
        tools.append(tool)
    verify_tool = WorkspaceToolCall(action="list", path=_workspace_current_directory(request.current_directory))
    tools.append(verify_tool)
    output = _execute_workspace_tools(tools, request.current_directory)
    deleted = ", ".join(targets)
    assistant_text = f"Deleted requested workspace target(s): {deleted}."
    if _workspace_output_indicates_failure(output):
        assistant_text = (
            f"I attempted to delete {deleted}, but verification found an error. "
            "The failure details are in the execution monitor."
        )
    return WorkspaceAgentResponse(
        status="completed",
        message="Direct workspace delete intent completed.",
        assistant_text=assistant_text,
        output=output,
        pending_task=tools[0] if tools else None,
        pending_tasks=tools,
        context_messages=request.messages,
    )


def _workspace_delete_targets_from_prompt(prompt: str, current_directory: str | None) -> list[str]:
    targets = _workspace_prompt_file_targets(prompt)
    lowered = prompt.lower()
    if targets:
        return targets
    mentioned_targets = _workspace_existing_targets_mentioned(prompt, current_directory)
    if mentioned_targets:
        return mentioned_targets
    if "all files" in lowered or "clear workspace" in lowered or "wipe workspace" in lowered:
        directory = _resolve_workspace_path(_workspace_current_directory(current_directory))
        delete_targets = [
            _workspace_relative_path(child)
            for child in sorted(directory.iterdir(), key=lambda item: item.name.lower())
            if child.name not in {".workspace_meta.json", ".sweetroll_services.log"}
        ]
        return delete_targets
    return []


def _workspace_existing_targets_mentioned(prompt: str, current_directory: str | None) -> list[str]:
    lowered = prompt.lower().replace("\\", "/")
    base = _resolve_workspace_path(_workspace_current_directory(current_directory))
    candidates = sorted(
        [path for path in base.rglob("*") if path.name not in {".workspace_meta.json", ".sweetroll_services.log"}],
        key=lambda item: len(_workspace_relative_path(item)),
        reverse=True,
    )
    targets: list[str] = []
    for path in candidates:
        relative = _workspace_relative_path(path)
        aliases = {relative.lower(), path.name.lower()}
        if any(alias and re.search(rf"(?<![\w.-]){re.escape(alias)}(?![\w.-])", lowered) for alias in aliases):
            if relative not in targets:
                targets.append(relative)
    return targets


def _workspace_prompt_file_targets(prompt: str) -> list[str]:
    targets: list[str] = []
    quoted = re.findall(r"['\"]([^'\"]+\.[A-Za-z0-9_]+)['\"]", prompt)
    tokens = re.findall(r"(?<![@\w./-])([A-Za-z0-9_.-]+\.[A-Za-z0-9_]+)(?![\w.-])", prompt)
    for raw in [*quoted, *tokens]:
        cleaned = raw.strip().strip(".,;:!?)(").replace("\\", "/")
        if cleaned and cleaned not in targets:
            targets.append(cleaned)
    return targets


async def _run_workspace_agent(request: WorkspaceAgentRequest) -> WorkspaceAgentResponse:
    pending_tasks = _scope_workspace_tools(
        _workspace_pending_tasks(request), request.current_directory
    )
    if pending_tasks:
        pending_tool = pending_tasks[0]
        if _workspace_consume_interrupt(request.session_id):
            return _workspace_interrupted_response(request)
        if not request.approved:
            return WorkspaceAgentResponse(
                status="denied",
                message="Workspace task denied.",
                assistant_text="Task denied. No file or command operation was executed.",
                pending_task=pending_tool,
                pending_tasks=[pending_tool],
            )
        if request.control_level == "read_only" and _workspace_tool_requires_mutation(pending_tool):
            return WorkspaceAgentResponse(
                status="denied",
                message="Read-Only mode blocked a workspace mutation.",
                assistant_text="Read-Only control level denied that write, delete, folder, or command operation.",
                pending_task=pending_tool,
                pending_tasks=[pending_tool],
            )
        output = _execute_workspace_tool_report(pending_tool, request.current_directory, 1, 1)
        approved_messages = [
            ChatMessage(role=ChatRole.system, content=_workspace_system_prompt(request)),
            *_workspace_history_messages(request.messages),
            ChatMessage(
                role=ChatRole.user,
                content=(
                    "The user approved the pending workspace operation. "
                    "Use the tool results below to produce the final answer."
                ),
            ),
            ChatMessage(
                role=ChatRole.system,
                content=_workspace_tool_result_message([pending_tool], output, 0),
            ),
        ]
        return await _workspace_agent_loop(
            request,
            approved_messages,
            initial_outputs=[output],
            initial_tools=[pending_tool],
        )

    direct_response = _workspace_direct_intent_response(request)
    if direct_response is not None:
        return direct_response

    messages = [
        ChatMessage(role=ChatRole.system, content=_workspace_system_prompt(request)),
        *_workspace_history_messages(request.messages),
        ChatMessage(role=ChatRole.user, content=request.prompt),
    ]
    return await _workspace_agent_loop(request, messages)


async def _workspace_agent_loop(
    request: WorkspaceAgentRequest,
    messages: list[ChatMessage],
    initial_outputs: list[str] | None = None,
    initial_tools: list[WorkspaceToolCall] | None = None,
) -> WorkspaceAgentResponse:
    outputs = list(initial_outputs or [])
    executed_tools = list(initial_tools or [])
    max_iterations = 5
    retry_count = sum(1 for output in outputs if _workspace_output_indicates_failure(output))

    for iteration in range(1, max_iterations + 1):
        if _workspace_consume_interrupt(request.session_id):
            return _workspace_interrupted_response(request, outputs, executed_tools, messages)
        assistant_text = await _workspace_collect_llm_text(request, messages)
        tools = _scope_workspace_tools(
            _extract_workspace_tool_calls(assistant_text), request.current_directory
        )
        if not tools:
            latest_output = outputs[-1] if outputs else ""
            if _workspace_output_indicates_failure(latest_output) and retry_count < max_iterations:
                retry_count += 1
                messages.append(
                    ChatMessage(
                        role=ChatRole.system,
                        content=_workspace_failure_system_warning(latest_output, retry_count),
                    )
                )
                continue
            return WorkspaceAgentResponse(
                status="completed",
                message="Agent response completed.",
                assistant_text=assistant_text,
                output="\n\n".join(outputs),
                pending_task=executed_tools[0] if executed_tools else None,
                pending_tasks=executed_tools,
                context_messages=_workspace_response_context(messages),
            )

        messages.append(ChatMessage(role=ChatRole.assistant, content=assistant_text))
        for tool_index, tool in enumerate(tools, start=1):
            if _workspace_consume_interrupt(request.session_id):
                return _workspace_interrupted_response(request, outputs, executed_tools, messages)
            if request.control_level == "read_only" and _workspace_tool_requires_mutation(tool):
                return WorkspaceAgentResponse(
                    status="denied",
                    message="Read-Only mode blocked a workspace mutation.",
                    assistant_text="Read-Only mode denied this operation before it touched disk or shell.",
                    output="\n\n".join(outputs),
                    pending_task=tool,
                    pending_tasks=[tool],
                    context_messages=_workspace_response_context(messages),
                )
            if request.control_level == "ask_first" and _workspace_tool_requires_mutation(tool):
                return WorkspaceAgentResponse(
                    status="needs_approval",
                    message=_workspace_approval_message([tool]),
                    assistant_text=assistant_text,
                    output="\n\n".join(outputs),
                    pending_task=tool,
                    pending_tasks=[tool],
                    context_messages=_workspace_response_context(messages),
                )

            output = _execute_workspace_tool_report(
                tool,
                request.current_directory,
                tool_index,
                len(tools),
            )
            outputs.append(output)
            executed_tools.append(tool)
            messages.append(
                ChatMessage(
                    role=ChatRole.system,
                    content=_workspace_tool_result_message([tool], output, iteration),
                )
            )
            if _workspace_output_indicates_failure(output):
                retry_count += 1
                messages.append(
                    ChatMessage(
                        role=ChatRole.system,
                        content=_workspace_failure_system_warning(output, retry_count),
                    )
                )
                break

    combined_output = "\n\n".join(outputs)
    had_failure = any(_workspace_output_indicates_failure(output) for output in outputs)
    return WorkspaceAgentResponse(
        status="completed" if outputs and not had_failure else "error",
        message="Workspace actions completed." if outputs and not had_failure else "Workspace paused for review.",
        assistant_text=(
            "Done. I completed the workspace actions I could run. Check the execution monitor for exact command output."
            if outputs and not had_failure
            else (
                "I paused to avoid repeating a failing tool path. Use Context Flush for a clean slate, "
                "or adjust the request and try again."
            )
        ),
        output=combined_output,
        pending_task=executed_tools[0] if executed_tools else None,
        pending_tasks=executed_tools,
        context_messages=_workspace_response_context(messages),
    )


async def _workspace_collect_llm_text(
    request: WorkspaceAgentRequest, messages: list[ChatMessage]
) -> str:
    cloud_settings = _workspace_cloud_settings(request) if request.source == InferenceSource.cloud else request.cloud
    chat_request = ChatRequest(
        source=request.source,
        stream=False,
        messages=messages,
        local=request.local,
        cloud=cloud_settings,
    )
    chunks, _source = await _collect_chat_response(chat_request)
    return "".join(chunks).strip()


def _workspace_tool_result_message(
    tools: list[WorkspaceToolCall], output: str, iteration: int
) -> str:
    tool_names = ", ".join(tool.action for tool in tools)
    return (
        f"Workspace tool results for iteration {iteration} ({tool_names}). "
        "Use these results to continue reasoning. If the user's request is now satisfied, "
        "respond with a concise final answer and do not emit more JSON tool calls.\n\n"
        f"{output}"
    )


def _workspace_session_id(session_id: str | None) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_.:-]+", "-", (session_id or "default").strip()).strip("-")
    return cleaned[:120] or "default"


def _workspace_consume_interrupt(session_id: str | None) -> bool:
    normalized = _workspace_session_id(session_id)
    with _active_interrupts_lock:
        if normalized not in ACTIVE_INTERRUPTS:
            return False
        ACTIVE_INTERRUPTS.discard(normalized)
        return True


def _workspace_interrupted_response(
    request: WorkspaceAgentRequest,
    outputs: list[str] | None = None,
    executed_tools: list[WorkspaceToolCall] | None = None,
    messages: list[ChatMessage] | None = None,
) -> WorkspaceAgentResponse:
    return WorkspaceAgentResponse(
        status="interrupted",
        message="Workspace agent execution was interrupted by the user.",
        assistant_text="Execution stopped by user request.",
        output="\n\n".join(outputs or []),
        pending_task=(executed_tools or [None])[0],
        pending_tasks=executed_tools or [],
        context_messages=_workspace_response_context(messages or []),
    )


def _workspace_failure_system_warning(error_content: str, retry_count: int) -> str:
    if _workspace_is_verification_failure(error_content):
        return (
            "[SYSTEM CRITICAL: Verification failed. The window did not close, meaning your "
            "input was ignored. Your screen state has been captured to "
            "./workspace/failed_automation_state.png. Pivot immediately: change mouse click "
            "targets, utilize an alternative shortcut like pyautogui.hotkey('alt', 's'), or "
            "use tab-navigation variations to hit the blue Send button. Analyze stdout/stderr, "
            "modify the desktop automation script, and execute a corrected "
            f"execute_automation_task block immediately. Retry count: {retry_count}.]"
        )
    return (
        "[SYSTEM WARNING: Your previous tool call failed with the following traceback/error: "
        f"{error_content}. Analyze the root cause (e.g., window title mismatch, path "
        "resolution error, missing focus, missing dependency, non-zero exit code, syntax or "
        "indentation bug). Modify your script structure, choose an alternate workspace-local "
        "strategy, and execute a corrected tool block immediately. Do not ask the user for "
        f"guidance unless all {retry_count} correction attempts have exhausted the available "
        "tool strategies.]"
    )


def _workspace_output_indicates_failure(output: str) -> bool:
    if not output:
        return False
    lowered = output.lower()
    if re.search(r"(?m)^exit_code=(?!0\b)[^\n]+", output):
        return True
    failure_markers = (
        '"status": "error"',
        '"status":"error"',
        '"status": "rejected"',
        '"status":"rejected"',
        "path security violation",
        "traceback",
        "indentationerror",
        "runtimeerror",
        "syntaxerror",
        "modulenotfounderror",
        "importerror",
        "filenotfounderror",
        "permissionerror",
        "dependency_error=true",
        "launch_error",
        "exit_code=timeout",
        "focus_candidates=0",
        "verification_failure",
        "automation verification failed",
        "empty visual capture",
        "no visible output",
        "command rejected",
        "failed",
    )
    return any(marker in lowered for marker in failure_markers)


def _workspace_is_verification_failure(output: str) -> bool:
    lowered = output.lower()
    return "verification_failure" in lowered or "automation verification failed" in lowered


def _workspace_pending_tasks(request: WorkspaceAgentRequest) -> list[WorkspaceToolCall]:
    if request.pending_tasks:
        return request.pending_tasks
    if request.pending_task:
        return [request.pending_task]
    return []


def _workspace_history_messages(messages: list[Any]) -> list[ChatMessage]:
    history: list[ChatMessage] = []
    for message in messages[-24:]:
        content = getattr(message, "content", "").strip()
        if not content:
            continue
        role = getattr(message, "role", "system")
        if role == "user":
            history.append(ChatMessage(role=ChatRole.user, content=content))
        elif role == "assistant":
            history.append(ChatMessage(role=ChatRole.assistant, content=content))
        else:
            history.append(ChatMessage(role=ChatRole.system, content=f"Workspace {role}: {content}"))
    return history


def _workspace_response_context(messages: list[ChatMessage]) -> list[Any]:
    context: list[Any] = []
    for message in messages[1:][-32:]:
        role = message.role.value
        if role not in {"user", "assistant", "system"}:
            role = "system"
        context.append(
            {
                "role": role,
                "content": message.content,
            }
        )
    return context


def _workspace_approval_message(tools: list[WorkspaceToolCall]) -> str:
    if len(tools) == 1:
        tool = tools[0]
        return tool.reason or f"Agent requested permission to {tool.action}."
    summary = ", ".join(tool.action for tool in tools[:4])
    if len(tools) > 4:
        summary += f", and {len(tools) - 4} more"
    return f"Agent requested permission to run {len(tools)} workspace operations: {summary}."


def _extract_workspace_tool_call(text: str) -> WorkspaceToolCall | None:
    tools = _extract_workspace_tool_calls(text)
    return tools[0] if tools else None


def _extract_workspace_tool_calls(text: str) -> list[WorkspaceToolCall]:
    tools: list[WorkspaceToolCall] = []
    seen: set[str] = set()
    for payload in _iter_json_values(text):
        for tool in _workspace_tools_from_payload(payload):
            key = tool.model_dump_json()
            if key not in seen:
                seen.add(key)
                tools.append(tool)
    return tools


def _iter_json_values(text: str) -> list[Any]:
    decoder = json.JSONDecoder()
    values: list[Any] = []
    index = 0
    while index < len(text):
        match = re.search(r"[\[{]", text[index:])
        if not match:
            break
        start = index + match.start()
        try:
            value, offset = decoder.raw_decode(text[start:])
        except json.JSONDecodeError:
            index = start + 1
            continue
        values.append(value)
        index = start + offset
    return values


def _workspace_tools_from_payload(payload: Any) -> list[WorkspaceToolCall]:
    if isinstance(payload, list):
        tools: list[WorkspaceToolCall] = []
        for item in payload:
            tools.extend(_workspace_tools_from_payload(item))
        return tools
    if not isinstance(payload, dict):
        return []

    candidates: list[Any] = []
    shorthand_tool = payload.get("tool")
    if isinstance(shorthand_tool, str) and shorthand_tool in WorkspaceToolCall.model_fields["action"].annotation.__args__:
        normalized = dict(payload)
        normalized["action"] = normalized.pop("tool")
        if "cwd" in normalized and "target_dir" not in normalized:
            normalized["target_dir"] = normalized["cwd"]
        candidates.append(normalized)
    if payload.get("tool") == "run_terminal_command" and payload.get("command"):
        candidates.append(
            {
                "action": "run_terminal_command",
                "command": payload.get("command", ""),
                "target_dir": payload.get("target_dir", payload.get("cwd", "")),
                "reason": payload.get("reason", ""),
            }
        )
    if payload.get("tool") == "start_background_service" and payload.get("command"):
        candidates.append(
            {
                "action": "start_background_service",
                "command": payload.get("command", ""),
                "service_name": payload.get("service_name", ""),
                "target_dir": payload.get("target_dir", payload.get("cwd", "")),
                "reason": payload.get("reason", ""),
            }
        )
    if payload.get("tool") == "run_automation_script":
        legacy_engine = str(payload.get("engine", "")).strip().lower()
        candidates.append(
            {
                "action": "execute_automation_task",
                "engine": payload.get("engine", ""),
                "mode": payload.get("mode", "desktop" if legacy_engine == "pyautogui" else "stealth"),
                "script_content": payload.get("script_content", payload.get("script", "")),
                "target_dir": payload.get("target_dir", payload.get("cwd", "")),
                "reason": payload.get("reason", ""),
            }
        )
    if payload.get("tool") == "execute_automation_task":
        candidates.append(
            {
                "action": "execute_automation_task",
                "mode": payload.get("mode", ""),
                "script_content": payload.get("script_content", payload.get("script", "")),
                "target_dir": payload.get("target_dir", payload.get("cwd", "")),
                "reason": payload.get("reason", ""),
            }
        )
    if payload.get("tool") == "send_automation_email":
        candidates.append(
            {
                "action": "send_automation_email",
                "to": payload.get("to", ""),
                "subject": payload.get("subject", ""),
                "body": payload.get("body", ""),
                "reason": payload.get("reason", ""),
            }
        )
    if isinstance(payload.get("tools"), list):
        candidates.extend(payload["tools"])
    if isinstance(payload.get("workspace_tools"), list):
        candidates.extend(payload["workspace_tools"])
    for key in ("tool", "workspace_tool", "tool_call"):
        if key in payload:
            candidates.append(payload[key])
    if payload.get("action"):
        candidates.append(payload)

    tools: list[WorkspaceToolCall] = []
    for candidate in candidates:
        if isinstance(candidate, list):
            tools.extend(_workspace_tools_from_payload(candidate))
            continue
        if isinstance(candidate, dict) and candidate.get("action"):
            try:
                normalized_candidate = dict(candidate)
                if "cwd" in normalized_candidate and "target_dir" not in normalized_candidate:
                    normalized_candidate["target_dir"] = normalized_candidate["cwd"]
                if "script" in normalized_candidate and "script_content" not in normalized_candidate:
                    normalized_candidate["script_content"] = normalized_candidate["script"]
                if normalized_candidate.get("action") == "run_automation_script":
                    engine = str(normalized_candidate.get("engine", "")).strip().lower()
                    normalized_candidate["action"] = "execute_automation_task"
                    normalized_candidate.setdefault(
                        "mode", "desktop" if engine == "pyautogui" else "stealth"
                    )
                if normalized_candidate.get("action") == "execute_automation_task":
                    mode = str(normalized_candidate.get("mode", "")).strip().lower()
                    engine = str(normalized_candidate.get("engine", "")).strip().lower()
                    if not mode:
                        normalized_candidate["mode"] = "desktop" if engine == "pyautogui" else "stealth"
                tools.append(WorkspaceToolCall.model_validate(normalized_candidate))
            except Exception:
                continue
    return tools


def _workspace_tool_requires_mutation(tool: WorkspaceToolCall) -> bool:
    return tool.action in {
        "write",
        "mkdir",
        "delete",
        "run",
        "run_terminal_command",
        "start_background_service",
        "send_automation_email",
        "run_automation_script",
        "execute_automation_task",
    }


def _workspace_current_directory(current_directory: str | None) -> str:
    raw_path = _normalize_workspace_tool_path(current_directory)
    if raw_path in {"", ".", "/"}:
        return ""
    target = _resolve_workspace_path(raw_path)
    if target.exists() and target.is_file():
        target = target.parent
    if target == _workspace_root():
        return ""
    return _workspace_relative_path(target)


def _scope_workspace_tools(
    tools: list[WorkspaceToolCall], current_directory: str | None
) -> list[WorkspaceToolCall]:
    scoped_directory = _workspace_current_directory(current_directory)
    if not scoped_directory:
        return tools
    return [_scope_workspace_tool(tool, scoped_directory) for tool in tools]


def _scope_workspace_tool(tool: WorkspaceToolCall, current_directory: str) -> WorkspaceToolCall:
    if tool.action not in {"list", "read", "write", "mkdir", "delete"} or not tool.path:
        return tool
    raw_path = (tool.path or "").strip().replace("\\", "/")
    normalized = _normalize_workspace_tool_path(raw_path)
    if not normalized or normalized in {".", current_directory}:
        return tool.model_copy(update={"path": current_directory})
    if raw_path.startswith(("/", "\\", "./workspace/", "workspace/")):
        return tool.model_copy(update={"path": normalized})
    if normalized == current_directory or normalized.startswith(f"{current_directory}/"):
        return tool.model_copy(update={"path": normalized})
    return tool.model_copy(update={"path": f"{current_directory}/{normalized}"})


def _execute_workspace_tools(
    tools: list[WorkspaceToolCall], current_directory: str | None = ""
) -> str:
    tools = _scope_workspace_tools(tools, current_directory)
    total = len(tools)
    return "\n\n".join(
        _execute_workspace_tool_report(tool, current_directory, index, total)
        for index, tool in enumerate(tools, start=1)
    )


def _execute_workspace_tool_report(
    tool: WorkspaceToolCall,
    current_directory: str | None,
    index: int,
    total: int,
) -> str:
    target = _redact_workspace_secrets(
        tool.path
        or tool.command
        or tool.to
        or tool.service_name
        or tool.mode
        or tool.engine
        or tool.target_dir
        or "."
    )
    try:
        result = _execute_workspace_tool(tool, current_directory)
    except Exception as exc:
        result = _workspace_tool_error_result(exc)
    return f"[{index}/{total}] {tool.action}: {target}\n{_redact_workspace_secrets(result)}"


def _execute_workspace_tool(
    tool: WorkspaceToolCall, current_directory: str | None = ""
) -> str:
    if tool.action == "list":
        target = _resolve_workspace_path(tool.path)
        if not target.exists():
            raise FileNotFoundError(f"Workspace path not found: {tool.path or '.'}")
        if target.is_file():
            return f"{_workspace_relative_path(target)} ({target.stat().st_size} bytes)"
        names = [
            f"{'[dir]' if child.is_dir() else '[file]'} {_workspace_relative_path(child)}"
            for child in sorted(target.iterdir(), key=lambda item: (not item.is_dir(), item.name.lower()))
            if child.name != ".workspace_meta.json"
        ]
        return "\n".join(names) or "(empty folder)"

    if tool.action == "read":
        target = _resolve_workspace_path(tool.path)
        if not target.is_file():
            raise FileNotFoundError(f"Workspace file not found: {tool.path}")
        content = target.read_text(encoding="utf-8", errors="replace")
        return content[:30000] + ("\n[truncated]" if len(content) > 30000 else "")

    if tool.action == "write":
        target = _resolve_workspace_path(tool.path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(tool.content or "", encoding="utf-8")
        return f"Wrote {_workspace_relative_path(target)} ({len(tool.content or '')} characters)."

    if tool.action == "mkdir":
        target = _resolve_workspace_path(tool.path)
        target.mkdir(parents=True, exist_ok=True)
        return f"Created folder {_workspace_relative_path(target)}."

    if tool.action == "delete":
        target = _resolve_workspace_path(tool.path)
        if target == _workspace_root():
            raise ValueError("The workspace root cannot be deleted.")
        if target.is_dir():
            shutil.rmtree(target)
            return f"Deleted folder tree {_workspace_relative_path(target)}."
        if target.is_file():
            target.unlink()
            return f"Deleted file {_workspace_relative_path(target)}."
        raise FileNotFoundError(f"Workspace path not found: {tool.path}")

    if tool.action == "start_background_service":
        return _start_workspace_background_service(tool, current_directory)

    if tool.action == "send_automation_email":
        return _send_workspace_automation_email(tool)

    if tool.action in {"run_automation_script", "execute_automation_task"}:
        return _execute_workspace_automation_task(tool, current_directory)

    if tool.action in {"run", "run_terminal_command"}:
        command = (tool.command or "").strip()
        if not command:
            raise ValueError("No command was provided.")
        _validate_workspace_command(command)
        command = _workspace_python_command(command)
        command_cwd = _workspace_command_cwd(tool, current_directory)
        env = load_agent_environment()
        try:
            result = subprocess.run(
                command,
                cwd=command_cwd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=90,
                env=env,
            )
        except subprocess.TimeoutExpired as exc:
            stdout = _decode_timeout_output(exc.stdout)
            stderr = _decode_timeout_output(exc.stderr)
            return (
                "exit_code=timeout\n"
                f"cwd={_workspace_relative_path(command_cwd)}\n"
                "stdout:\n"
                f"{stdout.strip() or '(empty)'}\n"
                "stderr:\n"
                f"{stderr.strip() or '(empty)'}\n"
                "Command exceeded SweetrollLM's 90 second workspace timeout and was terminated."
            )
        return (
            f"exit_code={result.returncode}\n"
            f"cwd={_workspace_relative_path(command_cwd)}\n"
            f"stdout:\n{result.stdout.strip() or '(empty)'}\n"
            f"stderr:\n{result.stderr.strip() or '(empty)'}"
        )

    raise ValueError(f"Unsupported workspace tool action: {tool.action}")


def _workspace_tool_error_result(exc: Exception) -> str:
    message = str(exc) or exc.__class__.__name__
    is_path_violation = "Path security violation" in message or "outside ./workspace" in message
    payload = {
        "status": "rejected" if is_path_violation else "error",
        "error": "Path security violation" if is_path_violation else exc.__class__.__name__,
        "message": message,
        "suggested_fix": (
            "Relocalize all file access, generation targets, and execution paths strictly "
            "to relative subdirectories inside the active workspace folder."
            if is_path_violation
            else (
                "Inspect the traceback or error text, modify the script/command/tool call, "
                "and retry with a corrected workspace-local strategy."
            )
        ),
    }
    return json.dumps(payload, ensure_ascii=False)


def _workspace_command_cwd(
    tool: WorkspaceToolCall | None, current_directory: str | None
) -> Path:
    scoped_directory = _workspace_tool_target_directory(tool, current_directory)
    if not scoped_directory:
        return _workspace_root()
    target = _resolve_workspace_path(scoped_directory)
    if not target.exists() or not target.is_dir():
        return _workspace_root()
    return target


def _workspace_tool_target_directory(
    tool: WorkspaceToolCall | None, current_directory: str | None
) -> str:
    target_dir = (tool.target_dir if tool else "") or ""
    if not target_dir.strip():
        return _workspace_current_directory(current_directory)
    normalized = _normalize_workspace_tool_path(target_dir)
    current = _workspace_current_directory(current_directory)
    if not normalized or normalized == ".":
        return current
    if target_dir.strip().replace("\\", "/").startswith(("/", "./workspace/", "workspace/")):
        return _workspace_current_directory(normalized)
    if current and not normalized.startswith(f"{current}/") and normalized != current:
        normalized = f"{current}/{normalized}"
    return _workspace_current_directory(normalized)


def _decode_timeout_output(value: str | bytes | None) -> str:
    if value is None:
        return ""
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return value


def _workspace_python_command(command: str) -> str:
    stripped = command.strip()
    python_executable = _shell_quote(str(sys.executable))

    def replace_command(match: re.Match[str]) -> str:
        prefix = match.group(1) or ""
        executable = match.group(2).lower()
        if executable in {"python", "python3", "py"}:
            return f"{prefix}{python_executable}"
        if executable in {"pip", "pip3"}:
            return f"{prefix}{python_executable} -m pip"
        return f"{prefix}{python_executable} -m playwright"

    return re.sub(
        r"(?i)(^|\s*(?:&&|\|\||;)\s*)(python|python3|py|pip|pip3|playwright)\b",
        replace_command,
        stripped,
    )


def _shell_quote(value: str) -> str:
    return '"' + value.replace('"', r'\"') + '"'


def _start_workspace_background_service(
    tool: WorkspaceToolCall, current_directory: str | None
) -> str:
    command = (tool.command or "").strip()
    if not command:
        raise ValueError("No background service command was provided.")
    _validate_workspace_command(command)
    command = _workspace_python_command(command)
    service_name = _safe_workspace_service_name(tool.service_name or "workspace-service")
    command_cwd = _workspace_command_cwd(tool, current_directory)
    env = load_agent_environment()

    with _workspace_services_lock:
        existing = _workspace_services.get(service_name)
        if existing and existing.poll() is None:
            return json.dumps(
                {
                    "status": "success",
                    "message": (
                        f"Service '{service_name}' is already running in the background "
                        f"on PID {existing.pid}."
                    ),
                    "service_name": service_name,
                    "pid": existing.pid,
                    "log_file": ".sweetroll_services.log",
                    "cwd": _workspace_relative_path(command_cwd),
                },
                ensure_ascii=False,
            )

        log_path = _workspace_service_log_path()
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with log_path.open("a", encoding="utf-8", errors="replace") as log_handle:
            log_handle.write(
                f"\n\n--- SweetrollLM service '{service_name}' starting in "
                f"{_workspace_relative_path(command_cwd)} ---\n"
            )
            log_handle.flush()
            process = subprocess.Popen(
                command,
                cwd=command_cwd,
                shell=True,
                stdin=subprocess.DEVNULL,
                stdout=log_handle,
                stderr=subprocess.STDOUT,
                env=env,
                creationflags=_workspace_process_creationflags(),
            )
        _workspace_services[service_name] = process

    return json.dumps(
        {
            "status": "success",
            "message": (
                f"Service '{service_name}' started in the background on PID "
                f"{process.pid}. Monitoring via logs."
            ),
            "service_name": service_name,
            "pid": process.pid,
            "log_file": ".sweetroll_services.log",
            "cwd": _workspace_relative_path(command_cwd),
        },
        ensure_ascii=False,
    )


def _send_workspace_automation_email(tool: WorkspaceToolCall) -> str:
    env = load_agent_environment()
    smtp_server = env.get("SMTP_SERVER", "").strip()
    smtp_port = int(env.get("SMTP_PORT", "587") or "587")
    smtp_email = env.get("SMTP_EMAIL", "").strip()
    smtp_password = env.get("SMTP_PASSWORD", "")
    recipient = tool.to.strip()
    subject = tool.subject.strip() or "SweetrollLM Automation"
    body = tool.body
    if not all([smtp_server, smtp_email, smtp_password, recipient]):
        return json.dumps(
            {
                "status": "error",
                "smtp_code": 0,
                "message": (
                    "SMTP configuration is incomplete. Set SMTP_SERVER, SMTP_PORT, "
                    "SMTP_EMAIL, SMTP_PASSWORD, and provide a recipient."
                ),
                "browser_pivot_required": True,
                "recommended_tool": "execute_automation_task",
                "recommended_mode": "desktop",
                "fallback_instruction": _workspace_email_browser_pivot_instruction(
                    recipient, subject, body
                ),
            },
            ensure_ascii=False,
        )

    message = MIMEText(body, "plain", "utf-8")
    message["From"] = smtp_email
    message["To"] = recipient
    message["Subject"] = subject

    try:
        if smtp_port == 465:
            client: smtplib.SMTP = smtplib.SMTP_SSL(smtp_server, smtp_port, timeout=30)
        else:
            client = smtplib.SMTP(smtp_server, smtp_port, timeout=30)
        with client:
            client.ehlo()
            if smtp_port != 465:
                client.starttls()
                client.ehlo()
            client.login(smtp_email, smtp_password)
            refused = client.sendmail(smtp_email, [recipient], message.as_string())
            smtp_code, smtp_message = client.noop()
    except smtplib.SMTPResponseException as exc:
        message = exc.smtp_error.decode("utf-8", errors="replace") if isinstance(exc.smtp_error, bytes) else str(exc.smtp_error)
        return json.dumps(
            {
                "status": "error",
                "smtp_code": exc.smtp_code,
                "message": message,
                "browser_pivot_required": _workspace_should_browser_pivot(exc.smtp_code, message),
                "recommended_tool": "execute_automation_task",
                "recommended_mode": "desktop",
                "fallback_instruction": _workspace_email_browser_pivot_instruction(
                    recipient, subject, body
                ),
            },
            ensure_ascii=False,
        )
    except Exception as exc:
        message = str(exc)
        return json.dumps(
            {
                "status": "error",
                "smtp_code": 0,
                "message": message,
                "browser_pivot_required": _workspace_should_browser_pivot(0, message),
                "recommended_tool": "execute_automation_task",
                "recommended_mode": "desktop",
                "fallback_instruction": _workspace_email_browser_pivot_instruction(
                    recipient, subject, body
                ),
            },
            ensure_ascii=False,
        )

    status = "success" if not refused else "partial"
    return json.dumps(
        {
            "status": status,
            "smtp_code": smtp_code,
            "smtp_message": smtp_message.decode("utf-8", errors="replace")
            if isinstance(smtp_message, bytes)
            else str(smtp_message),
            "refused": refused,
            "message": f"Email dispatch to {recipient} completed with SMTP code {smtp_code}.",
        },
        ensure_ascii=False,
    )


def _workspace_should_browser_pivot(status_code: int, message: str) -> bool:
    lowered = message.lower()
    if status_code in {401, 403, 421, 450, 451, 454, 530, 534, 535, 550, 553, 554}:
        return True
    indicators = (
        "auth",
        "credential",
        "password",
        "login",
        "permission",
        "denied",
        "forbidden",
        "unauthorized",
        "firewall",
        "blocked",
        "mfa",
        "2fa",
        "captcha",
        "timeout",
        "network",
    )
    return any(indicator in lowered for indicator in indicators)


def _workspace_email_browser_pivot_instruction(
    recipient: str, subject: str, body: str
) -> str:
    compose_strategy = _workspace_mail_compose_strategy(recipient)
    return (
        "Pivot to execute_automation_task with mode='desktop'. Write a Python script using "
        "urllib.parse.quote and webbrowser.open to launch a mail composition workspace with "
        "the recipient, subject, and body URL-encoded. "
        f"Selected provider strategy: {compose_strategy}. "
        "After opening the browser, keep the script active, focus the page with pygetwindow "
        "plus a physical center-screen pyautogui click, submit with keyboard or click macros, "
        "and verify the compose frame closed. Do not ask the user to press send when the user "
        "has instructed you to complete delivery. "
        f"Recipient: {recipient or '(missing)'}; Subject: {subject or '(empty)'}; "
        f"Body length: {len(body or '')} characters."
    )


def _workspace_mail_compose_strategy(recipient: str) -> str:
    address = (recipient or "").strip().lower()
    if address.endswith("@gmail.com"):
        return (
            "gmail; compose_url = "
            "'https://mail.google.com/mail/?view=cm&fs=1&to={recipient}&su={subject}&body={body}'"
        )
    if address.endswith(("@outlook.com", "@hotmail.com", "@live.com")):
        return (
            "outlook; compose_url = "
            "'https://outlook.live.com/default.aspx?rru=compose&to={recipient}&subject={subject}&body={body}'"
        )
    return "native-mailto; compose_url = 'mailto:{recipient}?subject={subject}&body={body}'"


def _workspace_email_browser_fallback_script(recipient: str, subject: str, body: str) -> str:
    recipient_literal = json.dumps(recipient or "")
    subject_literal = json.dumps(subject or "")
    body_literal = json.dumps(body or "")
    return f"""
import time
import urllib.parse
import webbrowser

import pyautogui
import pygetwindow as gw

recipient = {recipient_literal}
subject = {subject_literal}
body = {body_literal}

encoded_to = urllib.parse.quote(recipient)
encoded_subject = urllib.parse.quote(subject)
encoded_body = urllib.parse.quote(body)

if recipient.lower().endswith("@gmail.com"):
    compose_url = f"https://mail.google.com/mail/?view=cm&fs=1&to={{encoded_to}}&su={{encoded_subject}}&body={{encoded_body}}"
    provider = "gmail"
elif recipient.lower().endswith(("@outlook.com", "@hotmail.com", "@live.com")):
    compose_url = f"https://outlook.live.com/default.aspx?rru=compose&to={{encoded_to}}&subject={{encoded_subject}}&body={{encoded_body}}"
    provider = "outlook"
else:
    compose_url = f"mailto:{{encoded_to}}?subject={{encoded_subject}}&body={{encoded_body}}"
    provider = "mailto"

print(f"provider={{provider}}")
print(f"opening={{compose_url[:160]}}...")
webbrowser.open(compose_url, new=2)
time.sleep(8.0)

window_terms = ("Gmail", "Compose", "Mail", "Outlook", "Firefox", "Chrome", "Edge")
target_windows = [w for w in gw.getAllWindows() if any(term.lower() in (w.title or "").lower() for term in window_terms)]
print(f"focus_candidates={{len(target_windows)}}")
if target_windows:
    win = target_windows[0]
    try:
        win.minimize()
        time.sleep(0.5)
        win.restore()
        win.maximize()
        win.activate()
        time.sleep(1.2)
        print(f"focused_window={{win.title}}")
    except Exception as exc:
        print(f"Window activation warning: {{exc}}")
else:
    print("Window activation warning: no matching browser/mail window found.")

screen_width, screen_height = pyautogui.size()
pyautogui.click(screen_width // 2, screen_height // 2)
time.sleep(1.0)

if provider == "outlook":
    pyautogui.hotkey("alt", "s")
else:
    pyautogui.hotkey("ctrl", "enter")
print("Keystroke macro dispatched. Initiating validation sweep...")
time.sleep(5.0)

active_compositions = [
    w for w in gw.getAllWindows()
    if any(term in (w.title or "") for term in ("Compose Mail", "New Message", "Untitled Message"))
]
if active_compositions:
    print("hotkey_result=compose_still_present; attempting physical Send button click")
    try:
        win = active_compositions[0]
        win.restore()
        win.maximize()
        win.activate()
        time.sleep(0.8)
    except Exception as exc:
        print(f"Physical click focus warning: {{exc}}")
    # Full-page Gmail compose places Send near the lower-left content well.
    # Popup compose windows place Send closer to the lower-right. Try both safe candidates.
    click_targets = [
        (max(120, int(screen_width * 0.22)), max(80, screen_height - 66)),
        (max(120, screen_width - 520), max(80, screen_height - 55)),
    ]
    for x, y in click_targets:
        pyautogui.click(x, y)
        print(f"physical_send_click={{x}},{{y}}")
        time.sleep(4.0)
        active_compositions = [
            w for w in gw.getAllWindows()
            if any(term in (w.title or "") for term in ("Compose Mail", "New Message", "Untitled Message"))
        ]
        if not active_compositions:
            break

if active_compositions:
    try:
        pyautogui.screenshot("failed_automation_state.png")
        print("captured=failed_automation_state.png")
    except Exception as exc:
        print(f"screenshot warning: {{exc}}")
    print("VERIFICATION_FAILURE: A compose window is still present on screen.")
    raise RuntimeError("Automation verification failed: compose window did not close.")

print("VERIFICATION_SUCCESS: Email compose window cleared or send macro dispatched without a remaining compose frame.")
"""


def _execute_workspace_automation_task(
    tool: WorkspaceToolCall, current_directory: str | None
) -> str:
    mode = (tool.mode or "").strip().lower()
    if not mode:
        legacy_engine = (tool.engine or "").strip().lower()
        mode = "desktop" if legacy_engine == "pyautogui" else "stealth"
    if mode not in {"stealth", "desktop"}:
        raise ValueError("Automation mode must be either stealth or desktop.")
    script_content = tool.script_content.strip()
    if not script_content:
        raise ValueError("No automation script_content was provided.")

    command_cwd = _workspace_command_cwd(tool, current_directory)
    command_cwd.mkdir(parents=True, exist_ok=True)
    script_path = command_cwd / ".tmp_runtime.py"
    script_path.write_text(
        (
            "# Generated by SweetrollLM Agentic Workspace.\n"
            f"# Automation mode: {mode}\n"
            f"# Active workspace cwd: {_workspace_relative_path(command_cwd)}\n"
            "# Save diagnostic screenshots relative to this cwd, e.g. failed_automation_state.png.\n"
            "# Stealth mode is for headless/browser/request workflows.\n"
            "# Desktop mode is for PyAutoGUI and visible OS interaction.\n\n"
            f"{tool.script_content}\n"
        ),
        encoding="utf-8",
    )

    env = load_agent_environment()
    try:
        process = subprocess.Popen(
            [sys.executable, str(script_path)],
            cwd=command_cwd,
            shell=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=env,
            creationflags=_workspace_process_creationflags(),
        )
        stdout, stderr = process.communicate(timeout=90)
    except subprocess.TimeoutExpired as exc:
        try:
            process.kill()
            stdout, stderr = process.communicate(timeout=5)
        except Exception:
            stdout = _decode_timeout_output(getattr(exc, "stdout", None))
            stderr = _decode_timeout_output(getattr(exc, "stderr", None))
        dependency_hint = _workspace_automation_dependency_hint(stdout, stderr)
        if dependency_hint:
            dependency_hint = f"\n{dependency_hint}"
        return (
            "exit_code=timeout\n"
            f"mode={mode}\n"
            f"cwd={_workspace_relative_path(command_cwd)}\n"
            f"script={_workspace_relative_path(script_path)}\n"
            "stdout:\n"
            f"{stdout.strip() or '(empty)'}\n"
            "stderr:\n"
            f"{stderr.strip() or '(empty)'}\n"
            "Automation task exceeded SweetrollLM's 90 second timeout and was terminated."
            f"{dependency_hint}"
        )
    except OSError as exc:
        return (
            "exit_code=launch_error\n"
            f"mode={mode}\n"
            f"cwd={_workspace_relative_path(command_cwd)}\n"
            f"script={_workspace_relative_path(script_path)}\n"
            "stdout:\n(empty)\n"
            f"stderr:\n{exc}"
        )

    provisioning_report = _workspace_auto_provision_automation_dependencies(stdout, stderr)
    dependency_hint = _workspace_automation_dependency_hint(stdout, stderr)
    if dependency_hint:
        dependency_hint = f"\n{dependency_hint}"
    if provisioning_report:
        provisioning_report = f"\n{provisioning_report}"
    return (
        f"exit_code={process.returncode}\n"
        f"mode={mode}\n"
        f"cwd={_workspace_relative_path(command_cwd)}\n"
        f"script={_workspace_relative_path(script_path)}\n"
        f"stdout:\n{stdout.strip() or '(empty)'}\n"
        f"stderr:\n{stderr.strip() or '(empty)'}"
        f"{dependency_hint}"
        f"{provisioning_report}"
    )


def _workspace_automation_dependency_hint(stdout: str, stderr: str) -> str:
    missing_modules = _workspace_missing_python_modules(stdout, stderr)
    if not missing_modules and not _workspace_has_import_failure(stdout, stderr):
        return ""
    package_hint = " ".join(_workspace_python_package_for_module(name) for name in missing_modules)
    package_hint = " ".join(dict.fromkeys(package_hint.split()))
    install_hint = (
        f"Suggested corrective action: run_terminal_command {_shell_quote(str(sys.executable))} -m pip install {package_hint}"
        if package_hint
        else "Suggested corrective action: inspect stderr and install the missing Python package."
    )
    if any(name == "playwright" for name in missing_modules):
        install_hint += f" && {_shell_quote(str(sys.executable))} -m playwright install"
    return (
        "dependency_error=true\n"
        f"missing_modules={', '.join(missing_modules) or 'unknown'}\n"
        f"{install_hint}"
    )


def _workspace_auto_provision_automation_dependencies(stdout: str, stderr: str) -> str:
    missing_modules = _workspace_missing_python_modules(stdout, stderr)
    if not missing_modules:
        return ""

    env = load_agent_environment()
    packages = [
        _workspace_python_package_for_module(module)
        for module in missing_modules
    ]
    packages = list(dict.fromkeys(package for package in packages if package))
    if not packages:
        return ""

    results: list[str] = [
        "auto_dependency_provisioning=attempted",
        f"dependencies={','.join(missing_modules)}",
        f"packages={' '.join(packages)}",
    ]
    install_result = subprocess.run(
        [sys.executable, "-m", "pip", "install", *packages],
        cwd=_workspace_root(),
        capture_output=True,
        text=True,
        timeout=180,
        env=env,
        creationflags=_workspace_process_creationflags(),
    )
    results.extend(
        [
            f"pip_exit_code={install_result.returncode}",
            f"pip_stdout={_single_line_log(install_result.stdout)}",
            f"pip_stderr={_single_line_log(install_result.stderr)}",
        ]
    )

    browser_exit_code = "skipped"
    browser_stdout = ""
    browser_stderr = "playwright not requested; browser install skipped."
    if install_result.returncode != 0:
        browser_stderr = "pip install failed; browser install skipped."
    elif "playwright" in missing_modules:
        browser_result = subprocess.run(
            [sys.executable, "-m", "playwright", "install"],
            cwd=_workspace_root(),
            capture_output=True,
            text=True,
            timeout=300,
            env=env,
            creationflags=_workspace_process_creationflags(),
        )
        browser_exit_code = str(browser_result.returncode)
        browser_stdout = browser_result.stdout
        browser_stderr = browser_result.stderr

    provisioned = install_result.returncode == 0 and (
        "playwright" not in missing_modules or browser_exit_code == "0"
    )
    results.extend(
        [
            f"playwright_browser_install_exit_code={browser_exit_code}",
            f"playwright_browser_stdout={_single_line_log(browser_stdout)}",
            f"playwright_browser_stderr={_single_line_log(browser_stderr)}",
            f"dependency_provisioned={str(provisioned).lower()}",
            (
                "next_action=Retry execute_automation_task with the original script now that "
                "the active SweetrollLM Python environment has been provisioned."
                if provisioned
                else "next_action=Read the provisioning stderr, correct the environment issue, then retry."
            ),
        ]
    )
    return "\n".join(results)


def _workspace_missing_python_modules(stdout: str, stderr: str) -> list[str]:
    combined = f"{stdout}\n{stderr}"
    if "ModuleNotFoundError" not in combined and "ImportError" not in combined:
        return []
    return sorted(
        {
            match.group(1)
            for match in re.finditer(r"No module named ['\"]([^'\"]+)['\"]", combined)
            if match.group(1)
        }
    )


def _workspace_has_import_failure(stdout: str, stderr: str) -> bool:
    combined = f"{stdout}\n{stderr}"
    return "ModuleNotFoundError" in combined or "ImportError" in combined


def _single_line_log(value: str, limit: int = 800) -> str:
    cleaned = " ".join((value or "").split())
    return cleaned[:limit] + ("..." if len(cleaned) > limit else "") or "(empty)"


def _workspace_python_package_for_module(module_name: str) -> str:
    mapping = {
        "bs4": "beautifulsoup4",
        "cv2": "opencv-python",
        "PIL": "pillow",
        "pygetwindow": "pygetwindow",
        "pyautogui": "pyautogui",
        "sklearn": "scikit-learn",
    }
    return mapping.get(module_name, module_name)


def _run_workspace_automation_script(
    tool: WorkspaceToolCall, current_directory: str | None
) -> str:
    legacy_engine = (tool.engine or "").strip().lower()
    mode = tool.mode or ("desktop" if legacy_engine == "pyautogui" else "stealth")
    return _execute_workspace_automation_task(tool.model_copy(update={"mode": mode}), current_directory)


def _workspace_service_statuses() -> list[dict[str, Any]]:
    statuses: list[dict[str, Any]] = []
    with _workspace_services_lock:
        for name, process in list(_workspace_services.items()):
            return_code = process.poll()
            statuses.append(
                {
                    "service_name": name,
                    "pid": process.pid,
                    "running": return_code is None,
                    "return_code": return_code,
                    "log_file": ".sweetroll_services.log",
                }
            )
            if return_code is not None:
                _workspace_services.pop(name, None)
    return statuses


def _stop_workspace_services() -> None:
    with _workspace_services_lock:
        services = list(_workspace_services.items())
        _workspace_services.clear()
    for _name, process in services:
        if process.poll() is not None:
            continue
        try:
            process.terminate()
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)
        except OSError:
            continue


def _workspace_service_log_path() -> Path:
    return _workspace_root() / ".sweetroll_services.log"


def _safe_workspace_service_name(name: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_.-]+", "-", name.strip()).strip("-")
    return cleaned[:64] or "workspace-service"


def _workspace_process_creationflags() -> int:
    return getattr(subprocess, "CREATE_NO_WINDOW", 0)


def _redact_workspace_secrets(text: str) -> str:
    redacted = text
    for secret in agent_secret_values():
        if secret and len(secret) >= 4:
            redacted = redacted.replace(secret, "[redacted]")
    return redacted


def _validate_workspace_command(command: str) -> None:
    normalized_command = command.replace("\\", "/")
    if re.search(r"(^|[;&|]\s*)cd\s+\.\.($|\s|[;&|])", normalized_command, re.IGNORECASE):
        raise ValueError(
            "Path security violation: command attempts to change directory outside ./workspace."
        )
    if re.search(r"(^|[\s\"'])\.\.(?:/|$)", normalized_command):
        raise ValueError(
            "Path security violation: command references a parent directory outside ./workspace."
        )
    for token in _workspace_absolute_path_tokens(command):
        if not _workspace_command_path_allowed(token):
            raise ValueError(
                "Path security violation: command references an absolute path outside "
                f"./workspace: {token}"
            )
    blocked_tokens = ["powershell -enc", "format ", "shutdown", "reg delete", "taskkill", "curl ", "wget "]
    lowered = command.lower()
    if any(token in lowered for token in blocked_tokens):
        raise ValueError("Command rejected by SweetrollLM workspace guardrails.")


def _workspace_absolute_path_tokens(command: str) -> list[str]:
    tokens: list[str] = []
    windows_pattern = r"(?i)(?:\"([A-Z]:[\\/][^\"]+)\"|'([A-Z]:[\\/][^']+)'|(?<![\w:/])([A-Z]:[\\/][^\s&|;]+))"
    unix_pattern = r"(?:\"(/[^\"]+)\"|'(/[^']+)'|(?<![\w:/])(/[^\s&|;]+))"
    for pattern in (windows_pattern, unix_pattern):
        for match in re.finditer(pattern, command):
            token = next((group for group in match.groups() if group), "")
            if token and not token.startswith("//"):
                tokens.append(token)
    return tokens


def _workspace_command_path_allowed(path_text: str) -> bool:
    try:
        candidate = Path(os.path.realpath(os.path.abspath(path_text))).resolve()
    except OSError:
        return False
    try:
        candidate.relative_to(_workspace_real_root())
        return True
    except ValueError:
        pass
    try:
        return candidate == Path(os.path.realpath(os.path.abspath(sys.executable))).resolve()
    except OSError:
        return False


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


def _public_api_provider(provider: ApiProviderProfile) -> ApiProviderProfile:
    return provider.model_copy(
        update={"api_key": SECRET_MASK if provider.api_key.strip() else ""}
    )


def _api_provider_request_with_secret(
    request: ApiProviderSaveRequest,
) -> ApiProviderSaveRequest:
    api_key = request.api_key.strip()
    if api_key and api_key != SECRET_MASK:
        return request

    existing: ApiProviderProfile | None = None
    if request.id:
        try:
            existing = get_api_provider(request.id)
        except Exception:
            existing = None
    if existing is None:
        requested_name = request.name.strip().lower()
        for provider in list_api_providers():
            if provider.name.strip().lower() == requested_name:
                existing = provider
                break

    if existing and existing.api_key.strip():
        return request.model_copy(update={"api_key": existing.api_key})
    if api_key == SECRET_MASK:
        return request.model_copy(update={"api_key": ""})
    return request


def _chat_request_with_api_provider(request: ChatRequest) -> ChatRequest:
    if request.source != InferenceSource.cloud or not request.api_provider_id:
        return request
    provider = get_api_provider(request.api_provider_id)
    cloud = CloudSettings(
        provider=_cloud_provider_from_base_url(provider.base_url),
        base_url=provider.base_url,
        model=provider.default_model,
        api_key=provider.api_key or None,
    )
    return request.model_copy(update={"cloud": cloud})


def _ollama_native_base_url(base_url: str | None = None) -> str:
    value = (base_url or settings.ollama_base_url or "http://127.0.0.1:11434").strip()
    value = value.rstrip("/")
    if value.endswith("/v1"):
        value = value[:-3].rstrip("/")
    return value


def _ollama_openai_base_url(base_url: str | None = None) -> str:
    return f"{_ollama_native_base_url(base_url)}/v1"


def _is_ollama_base_url(base_url: str) -> bool:
    normalized = base_url.lower().rstrip("/")
    if "ollama" in normalized:
        return True
    return normalized.startswith(("http://127.0.0.1:11434", "http://localhost:11434"))


async def _ollama_status(base_url: str | None = None) -> OllamaStatusResponse:
    native_base = _ollama_native_base_url(base_url)
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{native_base}/api/tags")
            response.raise_for_status()
        payload = response.json()
        models = [
            _ollama_model_info(item)
            for item in payload.get("models", [])
            if isinstance(item, dict)
        ]
        running_models = await _ollama_running_models(native_base)
        models = _merge_ollama_running_status(models, running_models)
        return OllamaStatusResponse(
            running=True,
            base_url=native_base,
            openai_base_url=_ollama_openai_base_url(native_base),
            models=models,
            message=(
                f"Ollama is running with {len(models)} installed model"
                f"{'' if len(models) == 1 else 's'}."
            ),
        )
    except httpx.RequestError as exc:
        return OllamaStatusResponse(
            running=False,
            base_url=native_base,
            openai_base_url=_ollama_openai_base_url(native_base),
            models=[],
            message=f"Ollama is not reachable at {native_base}: {exc}",
        )
    except Exception as exc:
        return OllamaStatusResponse(
            running=False,
            base_url=native_base,
            openai_base_url=_ollama_openai_base_url(native_base),
            models=[],
            message=f"Ollama status check failed: {exc}",
        )


async def _ollama_running_models(base_url: str | None = None) -> list[OllamaModelInfo]:
    native_base = _ollama_native_base_url(base_url)
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{native_base}/api/ps")
            response.raise_for_status()
        payload = response.json()
        return [
            _ollama_model_info(item, loaded=True)
            for item in payload.get("models", [])
            if isinstance(item, dict)
        ]
    except Exception:
        return []


async def _ollama_model_detail(model: str, base_url: str | None = None) -> OllamaModelDetailResponse:
    native_base = _ollama_native_base_url(base_url)
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(f"{native_base}/api/show", json={"model": model})
            if response.status_code >= 400:
                return OllamaModelDetailResponse(
                    model=model,
                    message=(
                        f"Ollama show returned HTTP {response.status_code}: "
                        f"{response.text[:240]}"
                    ),
                )
        payload = response.json()
        return OllamaModelDetailResponse(
            model=model,
            modelfile=str(payload.get("modelfile") or ""),
            parameters=str(payload.get("parameters") or ""),
            template=str(payload.get("template") or ""),
            system=str(payload.get("system") or ""),
            license=str(payload.get("license") or ""),
            details=payload.get("details") if isinstance(payload.get("details"), dict) else {},
            model_info=payload.get("model_info") if isinstance(payload.get("model_info"), dict) else {},
            capabilities=[
                str(capability)
                for capability in payload.get("capabilities", [])
                if isinstance(capability, str)
            ],
            message="Model metadata loaded.",
        )
    except httpx.RequestError as exc:
        return OllamaModelDetailResponse(
            model=model,
            message=f"Could not reach Ollama metadata endpoint: {exc}",
        )
    except Exception as exc:
        return OllamaModelDetailResponse(
            model=model,
            message=f"Ollama metadata lookup failed: {exc}",
        )


def _merge_ollama_running_status(
    models: list[OllamaModelInfo], running: list[OllamaModelInfo]
) -> list[OllamaModelInfo]:
    running_by_name = {
        (item.name or item.model): item
        for item in running
        if item.name or item.model
    }
    merged: list[OllamaModelInfo] = []
    seen: set[str] = set()
    for model in models:
        key = model.name or model.model
        active = running_by_name.get(key)
        if active:
            model = model.model_copy(
                update={
                    "loaded": True,
                    "expires_at": active.expires_at,
                    "size_vram_bytes": active.size_vram_bytes,
                    "capabilities": model.capabilities or active.capabilities,
                }
            )
        merged.append(model)
        seen.add(key)
    for key, active in running_by_name.items():
        if key not in seen:
            merged.append(active)
    return merged


def _ollama_model_info(item: dict[str, Any], loaded: bool = False) -> OllamaModelInfo:
    details = item.get("details") if isinstance(item.get("details"), dict) else {}
    context_length = details.get("context_length")
    if not isinstance(context_length, int):
        context_length = None
    return OllamaModelInfo(
        name=str(item.get("name") or item.get("model") or "").strip(),
        model=str(item.get("model") or item.get("name") or "").strip(),
        modified_at=str(item.get("modified_at") or ""),
        size_bytes=int(item.get("size") or 0),
        size_vram_bytes=int(item.get("size_vram") or 0),
        digest=str(item.get("digest") or ""),
        parameter_size=str(details.get("parameter_size") or ""),
        quantization_level=str(details.get("quantization_level") or ""),
        family=str(details.get("family") or ""),
        context_length=context_length,
        expires_at=str(item.get("expires_at") or ""),
        loaded=loaded,
        capabilities=[
            str(capability)
            for capability in item.get("capabilities", [])
            if isinstance(capability, str)
        ],
        details=details,
    )


def _start_ollama_pull_job(model: str) -> OllamaPullJob:
    job = OllamaPullJob(
        job_id=f"ollama-{uuid.uuid4().hex[:12]}",
        model=model,
        status="queued",
        message=f"Queued Ollama pull for {model}.",
    )
    with _ollama_pull_jobs_lock:
        _ollama_pull_jobs[job.job_id] = job
    worker = threading.Thread(
        target=_run_ollama_pull_job,
        args=(job.job_id,),
        daemon=True,
    )
    worker.start()
    return job


def _ollama_pull_snapshot(job_id: str) -> OllamaPullJob:
    with _ollama_pull_jobs_lock:
        job = _ollama_pull_jobs.get(job_id)
        if job is None:
            raise FileNotFoundError(job_id)
        return job.model_copy(deep=True)


def _update_ollama_pull_job(job_id: str, **updates: Any) -> OllamaPullJob | None:
    with _ollama_pull_jobs_lock:
        job = _ollama_pull_jobs.get(job_id)
        if job is None:
            return None
        next_job = job.model_copy(update=updates)
        _ollama_pull_jobs[job_id] = next_job
        return next_job


def _run_ollama_pull_job(job_id: str) -> None:
    try:
        job = _ollama_pull_snapshot(job_id)
    except FileNotFoundError:
        return

    base_url = _ollama_native_base_url()
    _update_ollama_pull_job(
        job_id,
        status="pulling",
        message=f"Connecting to Ollama to pull {job.model}.",
    )
    last_completed = 0
    last_total: int | None = None
    last_digest = ""

    try:
        with httpx.Client(timeout=None) as client:
            with client.stream(
                "POST",
                f"{base_url}/api/pull",
                json={"model": job.model, "stream": True},
            ) as response:
                if response.status_code >= 400:
                    body = response.read().decode("utf-8", errors="replace")
                    _update_ollama_pull_job(
                        job_id,
                        status="error",
                        message=(
                            f"Ollama rejected pull with HTTP {response.status_code}: "
                            f"{body[:240]}"
                        ),
                    )
                    return

                for line in response.iter_lines():
                    if not line:
                        continue
                    try:
                        payload = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    status_text = str(payload.get("status") or "Pulling model layers.")
                    digest = str(payload.get("digest") or last_digest)
                    completed = payload.get("completed")
                    total = payload.get("total")
                    if isinstance(completed, int):
                        last_completed = completed
                    if isinstance(total, int) and total > 0:
                        last_total = total
                    if digest:
                        last_digest = digest
                    percent = (
                        min(100.0, (last_completed / last_total) * 100.0)
                        if last_total
                        else 0.0
                    )
                    _update_ollama_pull_job(
                        job_id,
                        status="pulling",
                        percent=percent,
                        completed_bytes=last_completed,
                        total_bytes=last_total,
                        digest=last_digest,
                        message=status_text,
                    )

        _update_ollama_pull_job(
            job_id,
            status="completed",
            percent=100.0,
            completed_bytes=last_total or last_completed,
            total_bytes=last_total,
            digest=last_digest,
            message=f"Ollama model '{job.model}' is available locally.",
        )
    except httpx.RequestError as exc:
        _update_ollama_pull_job(
            job_id,
            status="error",
            message=f"Could not reach Ollama at {base_url}: {exc}",
        )
    except Exception as exc:
        _update_ollama_pull_job(
            job_id,
            status="error",
            message=f"Ollama pull failed: {exc}",
        )


@router.get("/api-providers", response_model=list[ApiProviderProfile])
async def api_providers() -> list[ApiProviderProfile]:
    return [_public_api_provider(provider) for provider in list_api_providers()]


@router.post("/api-providers", response_model=ApiProviderProfile)
async def create_api_provider(request: ApiProviderSaveRequest) -> ApiProviderProfile:
    try:
        return _public_api_provider(save_api_provider(_api_provider_request_with_secret(request)))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/api-providers/test", response_model=ApiProviderTestResponse)
async def test_api_provider(request: ApiProviderSaveRequest) -> ApiProviderTestResponse:
    return await _test_api_provider_connection(_api_provider_request_with_secret(request))


@router.get("/ollama/status", response_model=OllamaStatusResponse)
async def ollama_status() -> OllamaStatusResponse:
    return await _ollama_status()


@router.get("/ollama/models", response_model=list[OllamaModelInfo])
async def ollama_models() -> list[OllamaModelInfo]:
    status = await _ollama_status()
    if not status.running:
        raise HTTPException(status_code=503, detail=status.message)
    return status.models


@router.get("/ollama/ps", response_model=list[OllamaModelInfo])
async def ollama_loaded_models() -> list[OllamaModelInfo]:
    status = await _ollama_status()
    if not status.running:
        raise HTTPException(status_code=503, detail=status.message)
    return await _ollama_running_models(status.base_url)


@router.get("/ollama/show/{model:path}", response_model=OllamaModelDetailResponse)
async def ollama_show(model: str) -> OllamaModelDetailResponse:
    model = model.strip()
    if not model:
        raise HTTPException(status_code=400, detail="Ollama model name is required.")
    status = await _ollama_status()
    if not status.running:
        raise HTTPException(status_code=503, detail=status.message)
    return await _ollama_model_detail(model, status.base_url)


@router.post("/ollama/pull", response_model=OllamaPullJob)
async def ollama_pull(request: OllamaPullRequest) -> OllamaPullJob:
    return _start_ollama_pull_job(request.model)


@router.get("/ollama/pull/jobs/{job_id}", response_model=OllamaPullJob)
async def ollama_pull_job(job_id: str) -> OllamaPullJob:
    try:
        return _ollama_pull_snapshot(job_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Ollama pull job not found.") from exc


@router.get("/ollama/pull/progress")
async def ollama_pull_progress(job_id: str) -> StreamingResponse:
    async def events() -> AsyncIterator[str]:
        while True:
            try:
                snapshot = _ollama_pull_snapshot(job_id)
            except FileNotFoundError:
                yield _event(
                    {
                        "type": "ollama_pull",
                        "job_id": job_id,
                        "status": "error",
                        "message": "Ollama pull job not found.",
                    }
                )
                break
            yield _event({"type": "ollama_pull", **snapshot.model_dump()})
            if snapshot.status in {"completed", "error"}:
                break
            await asyncio.sleep(0.35)

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/ollama/register", response_model=ApiProviderProfile)
async def ollama_register(
    request: OllamaProviderRegisterRequest,
) -> ApiProviderProfile:
    status = await _ollama_status()
    if not status.running:
        raise HTTPException(status_code=503, detail=status.message)

    installed = {model.name for model in status.models}
    if request.model not in installed:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Ollama model '{request.model}' is not installed. Pull it first "
                "or choose an installed model."
            ),
        )

    provider_request = ApiProviderSaveRequest(
        name=request.name,
        base_url=status.openai_base_url,
        api_key="",
        default_model=request.model,
        is_default=request.is_default,
        is_fallback=False,
    )
    try:
        return _public_api_provider(save_api_provider(provider_request))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/api-providers/{provider_id}", response_model=ApiProviderProfile)
async def api_provider_detail(provider_id: str) -> ApiProviderProfile:
    try:
        return _public_api_provider(get_api_provider(provider_id))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/api-providers/{provider_id}", response_model=ApiProviderProfile)
async def update_api_provider(
    provider_id: str, request: ApiProviderSaveRequest
) -> ApiProviderProfile:
    try:
        resolved = _api_provider_request_with_secret(
            request.model_copy(update={"id": provider_id})
        )
        return _public_api_provider(save_api_provider(resolved))
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
    request = _extension_request_with_api_profile(request, "image")
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
    request = _extension_request_with_api_profile(request, "vision")
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
    request = _chat_request_with_api_provider(request.model_copy(update={"chat_id": chat_id}))
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
    request = _chat_request_with_api_provider(request.model_copy(update={"chat_id": chat_id}))
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


@router.post("/chat/summary", response_model=ChatSummaryResponse)
async def summarize_chat(request: ChatSummaryRequest) -> ChatSummaryResponse:
    source_messages = [
        message
        for message in request.messages[-request.count :]
        if message.role != ChatRole.system and message.content.strip()
    ]
    if not source_messages:
        return ChatSummaryResponse(summary="", message_count=0)

    transcript = "\n".join(
        f"{message.role.value}: {_trim_text_to_token_budget(message.content, 650)}"
        for message in source_messages
    )
    summary_request = ChatRequest(
        source=request.source,
        messages=[
            ChatMessage(
                role=ChatRole.user,
                content=(
                    "Summarize the following chat excerpt for future continuity. "
                    "Keep important facts, decisions, character state, user preferences, "
                    "open loops, image context, and unresolved goals. Avoid filler.\n\n"
                    f"{transcript}"
                ),
            )
        ],
        system_prompt=(
            "You write compact but complete memory summaries for an AI chat client. "
            "Return only the summary text."
        ),
        api_provider_id=request.api_provider_id,
        local=request.local,
        cloud=request.cloud,
        max_tokens=request.max_tokens,
    )
    summary_request = _chat_request_with_api_provider(summary_request)
    prepared_request = _prepare_generation_request(summary_request)
    try:
        assistant_parts, _engine_source = await _collect_chat_response(prepared_request)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return ChatSummaryResponse(
        summary="".join(assistant_parts).strip(),
        message_count=len(source_messages),
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
    if _is_ollama_base_url(base_url):
        return CloudProvider.ollama
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

    if _is_ollama_base_url(base_url):
        return await _test_ollama_provider_connection(base_url, model)

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


async def _test_ollama_provider_connection(
    base_url: str, model: str
) -> ApiProviderTestResponse:
    native_base = _ollama_native_base_url(base_url)
    tags_url = f"{native_base}/api/tags"
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            tags_response = await client.get(tags_url)
            if tags_response.status_code >= 400:
                return ApiProviderTestResponse(
                    ok=False,
                    message=(
                        f"Ollama model registry returned HTTP "
                        f"{tags_response.status_code}: {tags_response.text[:240]}"
                    ),
                    status_code=tags_response.status_code,
                    endpoint=tags_url,
                )
            payload = tags_response.json()
            installed = {
                str(item.get("name") or item.get("model") or "")
                for item in payload.get("models", [])
                if isinstance(item, dict)
            }
            if model not in installed:
                return ApiProviderTestResponse(
                    ok=False,
                    message=(
                        f"Ollama is running, but '{model}' is not installed. "
                        "Pull it first or choose an installed model."
                    ),
                    status_code=tags_response.status_code,
                    endpoint=tags_url,
                )

            chat_url = f"{_ollama_openai_base_url(native_base)}/chat/completions"
            probe_payload = {
                "model": model,
                "messages": [{"role": "user", "content": "ping"}],
                "max_tokens": 1,
                "temperature": 0,
                "stream": False,
            }
            chat_response = await client.post(chat_url, json=probe_payload)
            if 200 <= chat_response.status_code < 300:
                return ApiProviderTestResponse(
                    ok=True,
                    message=(
                        f"Ollama validated with '{model}' through the "
                        "OpenAI-compatible chat endpoint."
                    ),
                    status_code=chat_response.status_code,
                    endpoint=chat_url,
                )
            return ApiProviderTestResponse(
                ok=False,
                message=(
                    f"Ollama chat probe failed with HTTP {chat_response.status_code}: "
                    f"{chat_response.text[:240]}"
                ),
                status_code=chat_response.status_code,
                endpoint=chat_url,
            )
    except httpx.TimeoutException:
        return ApiProviderTestResponse(
            ok=False,
            message="Ollama validation timed out. Check whether the selected model is still loading.",
            endpoint=tags_url,
        )
    except httpx.RequestError as exc:
        return ApiProviderTestResponse(
            ok=False,
            message=f"Could not reach Ollama at {native_base}: {exc}",
            endpoint=tags_url,
        )
    except Exception as exc:
        return ApiProviderTestResponse(
            ok=False,
            message=f"Ollama validation failed: {exc}",
            endpoint=tags_url,
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
        secret = api_key.get_secret_value() if hasattr(api_key, "get_secret_value") else str(api_key)
        if secret:
            headers["Authorization"] = f"Bearer {secret}"
    return headers


def _extension_request_with_api_profile(
    request: ImageGenerationRequest | VisionCaptionRequest,
    kind: str,
) -> ImageGenerationRequest | VisionCaptionRequest:
    provider_id = (request.api_provider_id or "").strip()
    if not provider_id:
        return request
    try:
        profile = get_api_provider(provider_id)
    except Exception:
        return request
    endpoint = request.endpoint.strip()
    base_url = profile.base_url.rstrip("/")
    if not endpoint:
        if kind == "vision" and _is_ollama_base_url(base_url):
            endpoint = f"{_ollama_native_base_url(base_url)}/api/generate"
        else:
            suffix = "/images/generations" if kind == "image" else "/chat/completions"
            endpoint = f"{base_url}{suffix}"
    request_api_key = str(request.api_key or "").strip()
    if request_api_key == SECRET_MASK:
        request_api_key = ""
    update: dict[str, Any] = {
        "endpoint": endpoint,
        "api_key": request_api_key or profile.api_key,
        "model": request.model.strip() or profile.default_model,
    }
    if kind == "vision":
        update["provider"] = _cloud_provider_from_base_url(profile.base_url)
    elif request.provider in {"openai", "openrouter"}:
        update["provider"] = _cloud_provider_from_base_url(profile.base_url)
    return request.model_copy(update=update)


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
    if request.provider in {"openai", "dalle3", "flux", "openrouter"}:
        payload = {
            "model": request.model.strip() or ("dall-e-3" if request.provider == "openai" else request.provider),
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
    _stop_workspace_services()
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
            persona_id=request.persona_id,
            lorebook_id=request.lorebook_id,
            lorebook_enabled=request.lorebook_enabled,
            chat_summary=request.chat_summary,
            auto_summary_enabled=request.auto_summary_enabled,
            summary_message_count=request.summary_message_count,
            messages=messages,
        )
    )
