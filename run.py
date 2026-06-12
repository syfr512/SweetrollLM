from __future__ import annotations

import uvicorn

from sweetroll_lm.config import settings


if __name__ == "__main__":
    uvicorn.run(
        "sweetroll_lm.main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
    )
