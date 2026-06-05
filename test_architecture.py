from __future__ import annotations

import asyncio
import json
import logging
import sys
import tempfile
import time
from pathlib import Path
from types import ModuleType, SimpleNamespace
from typing import Any

from local_tavern import model_downloader
from local_tavern import routes
from local_tavern import storage
from local_tavern.inference import cloud_engine
from local_tavern.inference import local_engine
from local_tavern.inference.local_engine import LocalLlamaEngine
from local_tavern.routes import _select_chat_engine
from local_tavern.schemas import ChatRequest, InferenceSource, LocalModelLoadRequest, ModelDownloadRequest


TOTAL_BYTES = 4096
CHUNKS = [b"a" * 1024, b"b" * 1024, b"c" * 1024, b"d" * 1024]


class FakeDownloadResponse:
    status_code = 200

    def __init__(self) -> None:
        self.headers = model_downloader.httpx.Headers({"x-linked-size": str(TOTAL_BYTES)})

    def __enter__(self) -> "FakeDownloadResponse":
        return self

    def __exit__(self, *args: object) -> None:
        return None

    def iter_bytes(self, chunk_size: int) -> Any:
        for chunk in CHUNKS:
            time.sleep(0.08)
            yield chunk

    def read(self) -> bytes:
        return b""


class FakeDownloadClient:
    def __init__(self, *args: object, **kwargs: object) -> None:
        return None

    def __enter__(self) -> "FakeDownloadClient":
        return self

    def __exit__(self, *args: object) -> None:
        return None

    def head(self, url: str) -> SimpleNamespace:
        return SimpleNamespace(
            status_code=200,
            headers=model_downloader.httpx.Headers({"x-linked-size": str(TOTAL_BYTES)}),
        )

    def stream(self, method: str, url: str) -> FakeDownloadResponse:
        if method != "GET":
            raise AssertionError(f"unexpected method: {method}")
        return FakeDownloadResponse()


class FakeManagedProcess:
    last_instance: "FakeManagedProcess | None" = None

    def __init__(self, *args: object, **kwargs: object) -> None:
        self.args = args
        self.kwargs = kwargs
        self.returncode = None
        self.terminated = False
        self.killed = False
        FakeManagedProcess.last_instance = self

    def poll(self) -> int | None:
        return self.returncode

    def terminate(self) -> None:
        self.terminated = True
        self.returncode = 0

    def kill(self) -> None:
        self.killed = True
        self.returncode = -9

    def wait(self, timeout: float | None = None) -> int:
        return self.returncode or 0


class FakeNativeLlama:
    def __init__(self, *args: object, **kwargs: object) -> None:
        self.args = args
        self.kwargs = kwargs


class FailingNativeLlama:
    def __init__(self, *args: object, **kwargs: object) -> None:
        raise OSError("0xc000001d STATUS_ILLEGAL_INSTRUCTION")


class FakeStreamResponse:
    status_code = 200

    async def __aenter__(self) -> "FakeStreamResponse":
        return self

    async def __aexit__(self, *args: object) -> None:
        return None

    async def aiter_lines(self) -> Any:
        yield 'data: {"choices":[{"delta":{"content":"fallback-ok"}}]}'
        yield "data: [DONE]"

    async def aread(self) -> bytes:
        return b""


class FakeAsyncClient:
    last_request: dict[str, Any] | None = None

    def __init__(self, *args: object, **kwargs: object) -> None:
        return None

    async def __aenter__(self) -> "FakeAsyncClient":
        return self

    async def __aexit__(self, *args: object) -> None:
        return None

    async def get(self, url: str) -> SimpleNamespace:
        return SimpleNamespace(status_code=200)

    def stream(self, method: str, url: str, headers: dict[str, str], json: dict[str, Any]) -> FakeStreamResponse:
        FakeAsyncClient.last_request = {
            "method": method,
            "url": url,
            "headers": headers,
            "json": json,
        }
        return FakeStreamResponse()


def verify_downloader_stream_logic() -> tuple[bool, str]:
    original_settings = model_downloader.settings
    original_client = model_downloader.httpx.Client

    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            model_downloader.settings = SimpleNamespace(models_dir=Path(temp_dir))
            model_downloader.httpx.Client = FakeDownloadClient

            manager = model_downloader.ModelDownloadManager()
            job = manager.start_download(
                ModelDownloadRequest(
                    repo_id="Qwen/Qwen2.5-0.5B-Instruct-GGUF",
                    filename="tiny.Q4_K_M.gguf",
                )
            )

            snapshots = []
            deadline = time.monotonic() + 6.0
            while time.monotonic() < deadline:
                snapshot = manager.get_job(job.job_id)
                snapshots.append(snapshot)
                if snapshot.status in {"completed", "error"}:
                    break
                time.sleep(0.03)

            final = snapshots[-1]
            in_flight = [
                item
                for item in snapshots
                if item.status == "downloading"
                and item.downloaded_bytes > 0
                and item.speed_bytes_s > 0
                and item.percent > 0
            ]

            if final.status != "completed":
                return False, f"download ended with status={final.status} message={final.message}"
            if not in_flight:
                return False, "no in-flight progress snapshot showed positive speed, bytes, and percent"
            if final.downloaded_bytes != TOTAL_BYTES or final.total_bytes != TOTAL_BYTES:
                return False, f"byte accounting mismatch: {final.downloaded_bytes}/{final.total_bytes}"
            if final.percent != 100.0:
                return False, f"final percent was {final.percent}, expected 100.0"
            if not final.local_path or Path(final.local_path).stat().st_size != TOTAL_BYTES:
                return False, "final file was missing or wrong size"
            return True, "background stream reported speed, percent, total bytes, and completed cleanly"
        except Exception as exc:
            return False, str(exc)
        finally:
            model_downloader.settings = original_settings
            model_downloader.httpx.Client = original_client


async def verify_external_fallback_routing() -> tuple[bool, str]:
    original_routes_local_engine = routes.local_engine
    original_async_client = cloud_engine.httpx.AsyncClient
    original_local_async_client = local_engine.httpx.AsyncClient
    original_popen = local_engine.subprocess.Popen
    original_local_settings = local_engine.settings
    original_storage_settings = storage.settings
    missing_module = object()
    original_llama_cpp = sys.modules.get("llama_cpp", missing_module)
    cloud_engine.httpx.AsyncClient = FakeAsyncClient
    local_engine.httpx.AsyncClient = FakeAsyncClient
    local_engine.subprocess.Popen = FakeManagedProcess

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_root = Path(temp_dir)
        model_dir = temp_root / "storage" / "models"
        bin_dir = temp_root / "bin"
        model_dir.mkdir(parents=True)
        bin_dir.mkdir(parents=True)
        model_path = model_dir / "presentation-test.gguf"
        executable_path = bin_dir / "koboldcpp-oldpc.exe"
        model_path.write_bytes(b"GGUF")
        executable_path.write_bytes(b"fake exe")

        fake_settings = SimpleNamespace(
            native_llama_enabled=True,
            koboldcpp_executable_path="",
            koboldcpp_host="127.0.0.1",
            koboldcpp_port=5001,
            koboldcpp_ready_timeout=2.0,
            koboldcpp_args='--model "{model}" --port {port} --usecpu --noavx2',
            root_dir=temp_root,
            package_dir=temp_root,
            external_api_model="local-model",
        )
        fake_storage_settings = SimpleNamespace(models_dir=model_dir)
        local_engine.settings = fake_settings
        storage.settings = fake_storage_settings

        try:
            managed_engine = LocalLlamaEngine()
            routes.local_engine = managed_engine
            FakeManagedProcess.last_instance = None
            native_module = ModuleType("llama_cpp")
            native_module.Llama = FakeNativeLlama
            sys.modules["llama_cpp"] = native_module
            native_status = await managed_engine.load_model(
                LocalModelLoadRequest(
                    path="presentation-test.gguf",
                    template="chatml",
                    n_ctx=4096,
                    n_gpu_layers=0,
                )
            )
            if not native_status.loaded or native_status.message != "Model loaded":
                return False, f"native path did not load first: {native_status}"
            if FakeManagedProcess.last_instance is not None:
                return False, "managed worker launched despite native success"

            await managed_engine.unload_model()
            failing_module = ModuleType("llama_cpp")
            failing_module.Llama = FailingNativeLlama
            sys.modules["llama_cpp"] = failing_module
            local_status = await managed_engine.load_model(
                LocalModelLoadRequest(
                    path="presentation-test.gguf",
                    template="chatml",
                    n_ctx=4096,
                    n_gpu_layers=0,
                )
            )
            if not local_status.loaded or local_status.status != "loaded":
                return False, f"managed engine did not report loaded: {local_status}"

            launched = FakeManagedProcess.last_instance
            if launched is None:
                return False, "managed subprocess was not launched"
            command = list(launched.args[0])
            if "koboldcpp-oldpc.exe" not in Path(command[0]).name:
                return False, f"official old-PC executable was not selected: {command[0]}"
            if "--usecpu" not in command or "--noavx2" not in command:
                return False, f"old-PC flags missing from command: {command}"
            if str(model_path) not in command:
                return False, f"model path missing from command: {command}"

            request = ChatRequest(
                source=InferenceSource.local,
                messages=[{"role": "user", "content": "Say hello for the architecture test."}],
                max_tokens=16,
            )
            engine, routed_request, source = _select_chat_engine(request)
            if source != "external_fallback":
                return False, f"router selected {source}, expected external_fallback"
            if routed_request.source != InferenceSource.cloud or routed_request.cloud is None:
                return False, "router did not package request as cloud-compatible fallback"
            if routed_request.cloud.base_url != "http://127.0.0.1:5001/v1":
                return False, f"unexpected fallback URL: {routed_request.cloud.base_url}"

            tokens = []
            async for token in engine.stream_chat(routed_request):
                tokens.append(token)

            captured = FakeAsyncClient.last_request
            if tokens != ["fallback-ok"]:
                return False, f"unexpected streamed tokens: {tokens}"
            if not captured:
                return False, "external fallback did not issue a cloud-engine request"
            if captured["method"] != "POST":
                return False, f"unexpected method: {captured['method']}"
            if not captured["url"].endswith("/chat/completions"):
                return False, f"unexpected endpoint: {captured['url']}"
            if "Authorization" in captured["headers"]:
                return False, "loopback custom fallback unexpectedly required Authorization"
            payload = captured["json"]
            if not payload.get("stream"):
                return False, "fallback payload did not request streaming"
            if payload.get("messages", [{}])[-1].get("content") != request.messages[-1].content:
                return False, "fallback payload did not preserve the user prompt"

            await managed_engine.shutdown()
            if not launched.terminated:
                return False, "managed subprocess was not terminated on shutdown"
            return True, "managed KoboldCPP launched hidden, routed prompt, and shut down cleanly"
        except Exception as exc:
            return False, str(exc)
        finally:
            routes.local_engine = original_routes_local_engine
            cloud_engine.httpx.AsyncClient = original_async_client
            local_engine.httpx.AsyncClient = original_local_async_client
            local_engine.subprocess.Popen = original_popen
            local_engine.settings = original_local_settings
            storage.settings = original_storage_settings
            if original_llama_cpp is missing_module:
                sys.modules.pop("llama_cpp", None)
            else:
                sys.modules["llama_cpp"] = original_llama_cpp


async def main() -> int:
    logging.getLogger("local_tavern.inference.local_engine").setLevel(logging.CRITICAL)
    downloader_ok, downloader_message = verify_downloader_stream_logic()
    fallback_ok, fallback_message = await verify_external_fallback_routing()

    print(
        f"Downloader Stream Logic: {'PASS' if downloader_ok else 'FAIL'} - "
        f"{downloader_message}"
    )
    print(
        f"External Fallback Routing: {'PASS' if fallback_ok else 'FAIL'} - "
        f"{fallback_message}"
    )
    print(f"Overall: {'PASS' if downloader_ok and fallback_ok else 'FAIL'}")
    return 0 if downloader_ok and fallback_ok else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
