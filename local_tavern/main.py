from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .extensions.registry import extension_registry
from .routes import router, shutdown_runtime
from .storage import ensure_storage


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    await extension_registry.startup(app)
    try:
        yield
    finally:
        await shutdown_runtime()


def create_app() -> FastAPI:
    ensure_storage()

    app = FastAPI(
        title="Local Tavern",
        description="Local desktop AI chat backend",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.include_router(router, prefix="/api")
    app.mount(
        "/static",
        StaticFiles(directory=settings.static_dir),
        name="static",
    )

    @app.get("/")
    async def index() -> FileResponse:
        return FileResponse(settings.static_dir / "index.html")

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "local_tavern.main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
    )
