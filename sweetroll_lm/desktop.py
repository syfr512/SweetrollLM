from __future__ import annotations

import threading
import time
from urllib.request import urlopen

import uvicorn

from .config import settings
from .main import app


def run_desktop() -> None:
    url = f"http://{settings.host}:{settings.port}"
    server_thread = threading.Thread(target=_serve, daemon=True)
    server_thread.start()
    _wait_for_server(url)

    try:
        import webview
    except ImportError:
        print("pywebview is not installed. Open this URL in a browser instead:")
        print(url)
        server_thread.join()
        return

    webview.create_window(
        "SweetrollLM",
        url,
        width=1320,
        height=860,
        min_size=(980, 680),
        text_select=True,
    )
    webview.start()


def _serve() -> None:
    uvicorn.run(app, host=settings.host, port=settings.port, log_level="info")


def _wait_for_server(url: str, timeout_seconds: float = 10.0) -> None:
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        try:
            with urlopen(f"{url}/api/health", timeout=0.5):
                return
        except OSError:
            time.sleep(0.15)
    raise RuntimeError(f"Server did not start within {timeout_seconds} seconds.")

