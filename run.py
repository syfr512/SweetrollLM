from __future__ import annotations

import uvicorn

from sweetroll_lm.config import settings
from sweetroll_lm.logging_utils import setup_logging


if __name__ == "__main__":
    setup_logging(capture_stdio=True)
    uvicorn.run(
        "sweetroll_lm.main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
        log_config=None,
    )
