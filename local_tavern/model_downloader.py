from __future__ import annotations

import errno
import os
import re
import threading
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import quote

import httpx

from .config import settings
from .schemas import ModelDownloadJob, ModelDownloadRequest
from .storage import ensure_storage


CHUNK_SIZE = 1024 * 1024


@dataclass
class _MutableDownloadJob:
    job_id: str
    repo_id: str
    filename: str
    status: str = "queued"
    percent: float = 0.0
    downloaded_bytes: int = 0
    total_bytes: int | None = None
    speed_bytes_s: float = 0.0
    message: str = "Queued"
    local_path: str | None = None
    error: str | None = None

    def snapshot(self) -> ModelDownloadJob:
        return ModelDownloadJob(
            job_id=self.job_id,
            repo_id=self.repo_id,
            filename=self.filename,
            status=self.status,  # type: ignore[arg-type]
            percent=round(self.percent, 2),
            downloaded_bytes=self.downloaded_bytes,
            total_bytes=self.total_bytes,
            speed_bytes_s=round(self.speed_bytes_s, 2),
            message=self.message,
            local_path=self.local_path,
            error=self.error,
        )


class ModelDownloadManager:
    def __init__(self) -> None:
        self._jobs: dict[str, _MutableDownloadJob] = {}
        self._active_job_id: str | None = None
        self._lock = threading.RLock()

    def start_download(self, request: ModelDownloadRequest) -> ModelDownloadJob:
        ensure_storage()
        job_id = uuid.uuid4().hex
        job = _MutableDownloadJob(
            job_id=job_id,
            repo_id=request.repo_id,
            filename=request.filename,
        )
        with self._lock:
            self._jobs[job_id] = job
            self._active_job_id = job_id

        thread = threading.Thread(
            target=self._download_worker,
            args=(job_id,),
            name=f"model-download-{job_id[:8]}",
            daemon=True,
        )
        thread.start()
        return job.snapshot()

    def get_job(self, job_id: str | None = None) -> ModelDownloadJob:
        with self._lock:
            selected_id = job_id or self._active_job_id
            if selected_id and selected_id in self._jobs:
                return self._jobs[selected_id].snapshot()
        return ModelDownloadJob(
            job_id="idle",
            repo_id="",
            filename="",
            status="idle",
            message="No active download",
        )

    def _download_worker(self, job_id: str) -> None:
        job = self._require_job(job_id)
        target_dir = settings.models_dir / _safe_repo_dir(job.repo_id)
        final_path = target_dir / Path(job.filename)
        part_path = final_path.with_suffix(f"{final_path.suffix}.part")
        target_dir.mkdir(parents=True, exist_ok=True)
        final_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            self._update(
                job_id,
                status="resolving",
                message="Resolving Hugging Face file metadata",
            )
            url = _hf_resolve_url(job.repo_id, job.filename)
            headers = _hf_headers()
            total_bytes = _resolve_file_size(url, headers)
            if final_path.exists() and total_bytes and final_path.stat().st_size == total_bytes:
                self._update(
                    job_id,
                    status="completed",
                    percent=100.0,
                    downloaded_bytes=total_bytes,
                    total_bytes=total_bytes,
                    speed_bytes_s=0.0,
                    message="Model already downloaded",
                    local_path=str(final_path),
                )
                return

            self._update(
                job_id,
                total_bytes=total_bytes,
                status="downloading",
                message="Opening Hugging Face download stream",
            )

            timeout = httpx.Timeout(connect=30.0, read=120.0, write=120.0, pool=30.0)
            with httpx.Client(
                follow_redirects=True,
                timeout=timeout,
                headers=headers,
            ) as client:
                with client.stream("GET", url) as response:
                    if response.status_code >= 400:
                        body = response.read().decode("utf-8", errors="replace")
                        raise RuntimeError(
                            f"Hugging Face returned HTTP {response.status_code}: {body}"
                        )

                    response_total = _size_from_headers(response.headers)
                    if response_total:
                        total_bytes = response_total
                        self._update(job_id, total_bytes=total_bytes)

                    downloaded = 0
                    previous_bytes = 0
                    previous_time = time.monotonic()
                    start_time = previous_time
                    with part_path.open("wb") as file:
                        for chunk in response.iter_bytes(chunk_size=CHUNK_SIZE):
                            if not chunk:
                                continue
                            file.write(chunk)
                            downloaded += len(chunk)

                            now = time.monotonic()
                            elapsed = max(now - previous_time, 0.001)
                            speed = max(downloaded - previous_bytes, 0) / elapsed
                            previous_bytes = downloaded
                            previous_time = now

                            percent = 0.0
                            if total_bytes and total_bytes > 0:
                                percent = min(downloaded / total_bytes * 100, 99.9)

                            self._update(
                                job_id,
                                status="downloading",
                                downloaded_bytes=downloaded,
                                total_bytes=total_bytes,
                                speed_bytes_s=speed,
                                percent=percent,
                                message="Downloading model",
                            )

                    if total_bytes and downloaded != total_bytes:
                        raise RuntimeError(
                            f"Download ended early: received {downloaded} of {total_bytes} bytes."
                        )

                    part_path.replace(final_path)
                    total_elapsed = max(time.monotonic() - start_time, 0.001)
                    self._update(
                        job_id,
                        status="completed",
                        percent=100.0,
                        downloaded_bytes=downloaded,
                        total_bytes=total_bytes or downloaded,
                        speed_bytes_s=downloaded / total_elapsed,
                        message="Download complete",
                        local_path=str(final_path),
                    )
        except OSError as exc:
            if exc.errno == errno.ENOSPC:
                message = "Insufficient disk space for this model."
            elif exc.errno is not None:
                message = f"Disk error: {exc}"
            else:
                message = f"Download failed: {exc}"
            self._mark_error(job_id, message)
        except Exception as exc:
            self._mark_error(job_id, f"Download failed: {exc}")
        finally:
            if self.get_job(job_id).status == "error":
                try:
                    part_path.unlink(missing_ok=True)
                except OSError:
                    pass

    def _require_job(self, job_id: str) -> _MutableDownloadJob:
        with self._lock:
            return self._jobs[job_id]

    def _update(self, job_id: str, **changes: Any) -> None:
        with self._lock:
            job = self._jobs[job_id]
            for key, value in changes.items():
                setattr(job, key, value)

    def _mark_error(self, job_id: str, message: str) -> None:
        self._update(
            job_id,
            status="error",
            message=message,
            error=message,
            speed_bytes_s=0.0,
        )


def _resolve_file_size(url: str, headers: dict[str, str]) -> int | None:
    timeout = httpx.Timeout(connect=20.0, read=40.0, write=40.0, pool=20.0)
    try:
        with httpx.Client(follow_redirects=True, timeout=timeout, headers=headers) as client:
            response = client.head(url)
            if response.status_code < 400:
                return _size_from_headers(response.headers)
    except Exception:
        return None
    return None


def _size_from_headers(headers: httpx.Headers) -> int | None:
    for key in ("x-linked-size", "content-length"):
        value = headers.get(key)
        if not value:
            continue
        try:
            size = int(value)
        except ValueError:
            continue
        if size > 0:
            return size
    return None


def _hf_resolve_url(repo_id: str, filename: str) -> str:
    return (
        "https://huggingface.co/"
        f"{quote(repo_id, safe='/')}/resolve/main/{quote(filename, safe='/')}"
    )


def _hf_headers() -> dict[str, str]:
    headers = {
        "Accept-Encoding": "identity",
        "User-Agent": "local-tavern-model-downloader/1.0",
    }
    token = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_HUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _safe_repo_dir(repo_id: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "__", repo_id).strip("_") or "model"


download_manager = ModelDownloadManager()
