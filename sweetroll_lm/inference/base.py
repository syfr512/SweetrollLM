from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Protocol

from sweetroll_lm.schemas import ChatRequest


class InferenceEngine(Protocol):
    async def stream_chat(self, request: ChatRequest) -> AsyncIterator[str]:
        ...

