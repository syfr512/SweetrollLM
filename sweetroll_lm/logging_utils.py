from __future__ import annotations

import logging
import sys
import threading
from logging.handlers import RotatingFileHandler
from pathlib import Path

from .config import settings


_ORIGINAL_STDOUT = sys.stdout
_ORIGINAL_STDERR = sys.stderr
_LOG_LOCK = threading.RLock()
_CONFIGURED = False


class StreamToLogger:
    def __init__(self, logger: logging.Logger, level: int) -> None:
        self.logger = logger
        self.level = level
        self._buffer = ""

    def write(self, message: str) -> int:
        if not message:
            return 0
        self._buffer += message
        while "\n" in self._buffer:
            line, self._buffer = self._buffer.split("\n", 1)
            if line.strip():
                self.logger.log(self.level, line.rstrip())
        return len(message)

    def flush(self) -> None:
        if self._buffer.strip():
            self.logger.log(self.level, self._buffer.rstrip())
        self._buffer = ""

    def isatty(self) -> bool:
        return False


def setup_logging(capture_stdio: bool = False) -> Path:
    global _CONFIGURED
    with _LOG_LOCK:
        settings.logs_dir.mkdir(parents=True, exist_ok=True)
        log_path = settings.app_log_path
        if not _CONFIGURED:
            file_handler = RotatingFileHandler(
                log_path,
                maxBytes=2_000_000,
                backupCount=3,
                encoding="utf-8",
            )
            file_handler.setFormatter(
                logging.Formatter(
                    "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
                    "%Y-%m-%d %H:%M:%S",
                )
            )
            file_handler.setLevel(logging.INFO)
            setattr(file_handler, "_sweetrolllm_file_handler", True)

            console_handler = logging.StreamHandler(_ORIGINAL_STDERR)
            console_handler.setFormatter(
                logging.Formatter("%(levelname)s: %(message)s")
            )
            console_handler.setLevel(logging.INFO)
            setattr(console_handler, "_sweetrolllm_console_handler", True)

            root_logger = logging.getLogger("")
            root_logger.setLevel(logging.INFO)
            if not any(
                getattr(handler, "_sweetrolllm_file_handler", False)
                for handler in root_logger.handlers
            ):
                root_logger.addHandler(file_handler)
            if not any(
                getattr(handler, "_sweetrolllm_console_handler", False)
                for handler in root_logger.handlers
            ):
                root_logger.addHandler(console_handler)

            for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access", "sweetroll_lm"):
                logger = logging.getLogger(logger_name)
                logger.setLevel(logging.INFO)
                logger.propagate = True
            _CONFIGURED = True

        if capture_stdio:
            sys.stdout = StreamToLogger(logging.getLogger("stdout"), logging.INFO)
            sys.stderr = StreamToLogger(logging.getLogger("stderr"), logging.ERROR)

        logging.getLogger("sweetroll_lm").info("SweetrollLM logging initialized at %s", log_path)
        return log_path


def read_recent_logs(limit: int = 500) -> tuple[list[str], bool]:
    log_path = settings.app_log_path
    if not log_path.exists():
        return ["SweetrollLM log file has not been created yet."], False

    lines = _tail_lines(log_path, max(1, min(limit, 2000)))
    truncated = len(lines) >= limit
    return lines, truncated


def _tail_lines(path: Path, limit: int) -> list[str]:
    with path.open("r", encoding="utf-8", errors="replace") as handle:
        lines = handle.readlines()
    return [line.rstrip("\n") for line in lines[-limit:]]
