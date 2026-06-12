from __future__ import annotations

from fastapi import FastAPI

from .base import Extension


class ExtensionRegistry:
    def __init__(self) -> None:
        self._extensions: list[Extension] = []

    def register(self, extension: Extension) -> None:
        self._extensions.append(extension)

    async def startup(self, app: FastAPI) -> None:
        for extension in self._extensions:
            await extension.startup(app)

    @property
    def names(self) -> list[str]:
        return [extension.name for extension in self._extensions]


extension_registry = ExtensionRegistry()

