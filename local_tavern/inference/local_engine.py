from __future__ import annotations

import asyncio
import gc
import logging
import os
import shlex
import subprocess
import threading
import time
from collections.abc import AsyncIterator
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx

from local_tavern.config import settings
from local_tavern.inference.prompt_templates import render_prompt
from local_tavern.schemas import ChatRequest, LocalModelLoadRequest, LocalModelStatus
from local_tavern.storage import resolve_model_path


logger = logging.getLogger(__name__)


@dataclass
class _LoadedModel:
    path: Path
    template: str
    n_ctx: int
    n_gpu_layers: int
    llm: Any


@dataclass
class _ExternalModel:
    path: Path
    template: str
    n_ctx: int
    base_url: str
    model_name: str


class _StreamError:
    def __init__(self, message: str) -> None:
        self.message = message


class _KoboldCppProcessManager:
    def __init__(self) -> None:
        self._process: subprocess.Popen[bytes] | None = None
        self._model: _ExternalModel | None = None
        self._lock = threading.RLock()

    @property
    def base_url(self) -> str:
        return f"http://{settings.koboldcpp_host}:{settings.koboldcpp_port}/v1"

    @property
    def model_name(self) -> str:
        return self._model.model_name if self._model else settings.external_api_model

    def is_ready(self) -> bool:
        with self._lock:
            return self._model is not None and self._process_is_running_locked()

    def status(self) -> LocalModelStatus | None:
        with self._lock:
            if not self._model:
                return None
            if self._process_is_running_locked():
                return LocalModelStatus(
                    loaded=True,
                    status="loaded",
                    model_path=str(self._model.path),
                    template=self._model.template,
                    n_ctx=self._model.n_ctx,
                    n_gpu_layers=0,
                    message=f"KoboldCPP backend ready at {self._model.base_url}",
                )
            model_path = str(self._model.path)
            self._model = None
            return LocalModelStatus(
                loaded=False,
                status="error",
                model_path=model_path,
                message="KoboldCPP backend process exited unexpectedly.",
                error_code="koboldcpp_process_exited",
            )

    async def load_model(
        self, model_path: Path, request: LocalModelLoadRequest
    ) -> LocalModelStatus:
        executable = _find_koboldcpp_executable()
        if executable is None:
            raise RuntimeError(
                "KoboldCPP executable not found. Place koboldcpp-oldpc.exe in the "
                "project root or bin folder, or set LOCAL_TAVERN_KOBOLDCPP_PATH."
            )

        async with asyncio.Lock():
            await asyncio.to_thread(self.stop)
            command = _build_koboldcpp_command(executable, model_path)
            logger.info("Launching managed KoboldCPP backend: %s", command)
            process = await asyncio.to_thread(_popen_hidden, command)
            with self._lock:
                self._process = process
                self._model = _ExternalModel(
                    path=model_path,
                    template=request.template.value,
                    n_ctx=request.n_ctx,
                    base_url=self.base_url,
                    model_name=model_path.stem,
                )

            try:
                await self._wait_until_ready(process)
            except Exception:
                await asyncio.to_thread(self.stop)
                raise

            status = self.status()
            if status is None:
                raise RuntimeError("KoboldCPP backend did not report a loaded model.")
            return status

    def stop(self) -> None:
        with self._lock:
            process = self._process
            self._process = None
            self._model = None
        if process is None:
            return
        if process.poll() is not None:
            return
        try:
            process.terminate()
            process.wait(timeout=5.0)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5.0)
        except OSError:
            logger.exception("Failed to stop managed KoboldCPP process cleanly.")

    async def _wait_until_ready(self, process: subprocess.Popen[bytes]) -> None:
        deadline = time.monotonic() + settings.koboldcpp_ready_timeout
        urls = [
            f"{self.base_url}/models",
            f"http://{settings.koboldcpp_host}:{settings.koboldcpp_port}/",
        ]

        async with httpx.AsyncClient(timeout=2.0) as client:
            while time.monotonic() < deadline:
                if process.poll() is not None:
                    raise RuntimeError(
                        f"KoboldCPP exited before becoming ready with code {process.returncode}."
                    )
                for url in urls:
                    try:
                        response = await client.get(url)
                    except httpx.HTTPError:
                        continue
                    if response.status_code < 500:
                        return
                await asyncio.sleep(0.5)

        raise RuntimeError(
            "KoboldCPP started but did not become ready before the timeout. "
            "Try a smaller model or increase LOCAL_TAVERN_KOBOLDCPP_READY_TIMEOUT."
        )

    def _process_is_running_locked(self) -> bool:
        return self._process is not None and self._process.poll() is None


class LocalLlamaEngine:
    def __init__(self) -> None:
        self._model: _LoadedModel | None = None
        self._koboldcpp = _KoboldCppProcessManager()
        self._lock = asyncio.Lock()
        self._last_error: tuple[str, str] | None = None

    def status(self) -> LocalModelStatus:
        if self._model:
            return LocalModelStatus(
                loaded=True,
                status="loaded",
                model_path=str(self._model.path),
                template=self._model.template,
                n_ctx=self._model.n_ctx,
                n_gpu_layers=self._model.n_gpu_layers,
                message="Model loaded",
            )

        external_status = self._koboldcpp.status()
        if external_status:
            return external_status

        if self._last_error:
            code, message = self._last_error
            return LocalModelStatus(
                loaded=False,
                status="error",
                message=message,
                error_code=code,
            )
        return LocalModelStatus(loaded=False, status="idle")

    async def load_model(self, request: LocalModelLoadRequest) -> LocalModelStatus:
        try:
            model_path = resolve_model_path(request.path)
        except Exception as exc:
            return self._record_load_error(
                "model_path_error",
                f"Model Path Error: {exc}",
                exc,
            )

        if not settings.native_llama_enabled:
            async with self._lock:
                await asyncio.to_thread(self._drop_loaded_model)
                self._last_error = None
                try:
                    return await self._koboldcpp.load_model(model_path, request)
                except Exception as exc:
                    return self._record_load_error(
                        _classify_koboldcpp_error(exc),
                        f"Managed KoboldCPP Error: {exc}",
                        exc,
                    )

        try:
            from llama_cpp import Llama
        except (ModuleNotFoundError, ImportError) as exc:
            logger.info(
                "llama-cpp-python is unavailable, falling back to embedded worker..."
            )
            async with self._lock:
                await asyncio.to_thread(self._drop_loaded_model)
                await asyncio.to_thread(self._koboldcpp.stop)
                try:
                    return await self._koboldcpp.load_model(model_path, request)
                except Exception as fallback_exc:
                    return self._record_load_error(
                        _classify_koboldcpp_error(fallback_exc),
                        "llama-cpp-python is not installed and managed KoboldCPP "
                        f"could not start. {fallback_exc}",
                        fallback_exc,
                    )
        except Exception as exc:
            code, message = _classify_native_load_error(exc)
            if code == "hardware_instruction_mismatch":
                logger.info("Legacy CPU detected, falling back to embedded worker...")
                async with self._lock:
                    await asyncio.to_thread(self._drop_loaded_model)
                    await asyncio.to_thread(self._koboldcpp.stop)
                    try:
                        return await self._koboldcpp.load_model(model_path, request)
                    except Exception as fallback_exc:
                        return self._record_load_error(
                            _classify_koboldcpp_error(fallback_exc),
                            f"{message} {fallback_exc}",
                            fallback_exc,
                        )
            return self._record_load_error(
                "llama_cpp_import_error",
                "llama-cpp-python is not installed. Install it with "
                "`pip install llama-cpp-python` or configure External API Fallback.",
                exc,
            )

        async with self._lock:
            await asyncio.to_thread(self._drop_loaded_model)
            await asyncio.to_thread(self._koboldcpp.stop)
            try:
                llm = await asyncio.to_thread(
                    Llama,
                    model_path=str(model_path),
                    n_ctx=request.n_ctx,
                    n_gpu_layers=request.n_gpu_layers,
                    verbose=request.verbose,
                )
            except Exception as exc:
                code, message = _classify_native_load_error(exc)
                if code == "hardware_instruction_mismatch":
                    logger.info(
                        "Legacy CPU detected, falling back to embedded worker..."
                    )
                    try:
                        return await self._koboldcpp.load_model(model_path, request)
                    except Exception as fallback_exc:
                        return self._record_load_error(
                            _classify_koboldcpp_error(fallback_exc),
                            f"{message} {fallback_exc}",
                            fallback_exc,
                        )
                return self._record_load_error(code, message, exc)

            self._model = _LoadedModel(
                path=model_path,
                template=request.template.value,
                n_ctx=request.n_ctx,
                n_gpu_layers=request.n_gpu_layers,
                llm=llm,
            )
            self._last_error = None
            return self.status()

    async def unload_model(self) -> LocalModelStatus:
        async with self._lock:
            await asyncio.to_thread(self._drop_loaded_model)
            await asyncio.to_thread(self._koboldcpp.stop)
            self._last_error = None
        return self.status()

    async def shutdown(self) -> None:
        async with self._lock:
            await asyncio.to_thread(self._drop_loaded_model)
            await asyncio.to_thread(self._koboldcpp.stop)

    def _drop_loaded_model(self) -> None:
        self._model = None
        gc.collect()

    def has_model(self) -> bool:
        return self._model is not None

    def has_external_engine(self) -> bool:
        return self._koboldcpp.is_ready()

    def external_base_url(self) -> str:
        return self._koboldcpp.base_url

    def external_model_name(self) -> str:
        return self._koboldcpp.model_name

    def _record_load_error(
        self, code: str, message: str, exc: Exception
    ) -> LocalModelStatus:
        if exc.__traceback__:
            logger.error(
                "Local engine activation failed: %s",
                message,
                exc_info=(type(exc), exc, exc.__traceback__),
            )
        else:
            logger.error("Local engine activation failed: %s", message)
        self._drop_loaded_model()
        self._last_error = (code, message)
        return self.status()

    async def stream_chat(self, request: ChatRequest) -> AsyncIterator[str]:
        if not self._model:
            raise RuntimeError("No local model is loaded.")

        prompt, stop = render_prompt(
            request.normalized_messages(), request.local.template
        )
        queue: asyncio.Queue[str | _StreamError | None] = asyncio.Queue()
        loop = asyncio.get_running_loop()
        llm = self._model.llm

        def worker() -> None:
            try:
                stream = llm.create_completion(
                    prompt=prompt,
                    max_tokens=request.max_tokens,
                    temperature=request.temperature,
                    top_p=request.top_p,
                    stream=True,
                    stop=stop,
                )
                for chunk in stream:
                    text = chunk.get("choices", [{}])[0].get("text", "")
                    if text:
                        loop.call_soon_threadsafe(queue.put_nowait, text)
            except Exception as exc:
                loop.call_soon_threadsafe(queue.put_nowait, _StreamError(str(exc)))
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, None)

        threading.Thread(target=worker, daemon=True).start()

        while True:
            item = await queue.get()
            if item is None:
                break
            if isinstance(item, _StreamError):
                raise RuntimeError(item.message)
            yield item


def _find_koboldcpp_executable() -> Path | None:
    configured = settings.koboldcpp_executable_path.strip()
    if configured:
        path = Path(configured).expanduser().resolve()
        return path if path.exists() and path.is_file() else None

    names = ["koboldcpp-oldpc.exe", "koboldcpp.exe"]
    if os.name != "nt":
        names.extend(["koboldcpp-oldpc", "koboldcpp"])

    roots = [
        settings.root_dir,
        settings.root_dir / "bin",
        settings.package_dir / "bin",
    ]
    for root in roots:
        for name in names:
            path = (root / name).resolve()
            if path.exists() and path.is_file():
                return path
    return None


def _build_koboldcpp_command(executable: Path, model_path: Path) -> list[str]:
    args_template = settings.koboldcpp_args.strip()
    args = shlex.split(
        args_template.format(
            model=str(model_path),
            port=settings.koboldcpp_port,
            host=settings.koboldcpp_host,
        )
    )
    return [str(executable), *args]


def _popen_hidden(command: list[str]) -> subprocess.Popen[bytes]:
    startupinfo = None
    creationflags = 0
    if os.name == "nt":
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        startupinfo.wShowWindow = subprocess.SW_HIDE
        creationflags |= getattr(subprocess, "CREATE_NO_WINDOW", 0)

    return subprocess.Popen(
        command,
        cwd=str(settings.root_dir),
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        startupinfo=startupinfo,
        creationflags=creationflags,
    )


def _classify_koboldcpp_error(exc: Exception) -> str:
    normalized = str(exc).lower()
    if "executable not found" in normalized or "koboldcpp executable not found" in normalized:
        return "koboldcpp_executable_missing"
    if "timeout" in normalized or "did not become ready" in normalized:
        return "koboldcpp_ready_timeout"
    if "exited before becoming ready" in normalized:
        return "koboldcpp_process_exited"
    return "koboldcpp_launch_error"


def _classify_native_load_error(exc: Exception) -> tuple[str, str]:
    raw = f"{type(exc).__name__}: {exc}"
    normalized = raw.lower()
    if (
        "0xc000001d" in normalized
        or "status_illegal_instruction" in normalized
        or "illegal instruction" in normalized
        or "avx2" in normalized
    ):
        return (
            "hardware_instruction_mismatch",
            "Hardware Instruction Mismatch: Your CPU does not support AVX2 "
            "extensions required by this native llama-cpp-python wheel. "
            "Falling back to managed KoboldCPP old-PC mode.",
        )
    if (
        isinstance(exc, OSError)
        or "dll load failed" in normalized
        or "winerror" in normalized
        or "could not load" in normalized
        or "load library" in normalized
        or "failed to load" in normalized
    ):
        return (
            "native_binary_load_error",
            "Native Binary Load Error: llama-cpp-python could not load on this "
            "machine.",
        )
    return ("model_load_error", f"Model Load Error: {exc}")
