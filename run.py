from __future__ import annotations

import uvicorn

from local_tavern.config import settings


if __name__ == "__main__":
    uvicorn.run(
        "local_tavern.main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
    )
