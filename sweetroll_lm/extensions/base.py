from __future__ import annotations

from typing import Protocol

from fastapi import FastAPI


class Extension(Protocol):
    name: str

    async def startup(self, app: FastAPI) -> None:
        ...

