from __future__ import annotations

import json
from collections.abc import AsyncIterator
from urllib.parse import urlparse

import httpx

from sweetroll_lm.inference.prompt_templates import stop_tokens_for_template
from sweetroll_lm.schemas import ChatRequest, CloudProvider


class CloudChatEngine:
    async def stream_chat(self, request: ChatRequest) -> AsyncIterator[str]:
        if request.cloud is None:
            raise RuntimeError("Cloud settings are required for Cloud API Mode.")

        api_key = (
            request.cloud.api_key.get_secret_value()
            if request.cloud.api_key is not None
            else ""
        )
        if (
            _requires_api_key(request.cloud.provider, request.cloud.base_url)
            and not api_key.strip()
        ):
            raise RuntimeError("An API key is required for Cloud API Mode.")

        url = _chat_completions_url(request.cloud.base_url)
        headers = {"Content-Type": "application/json"}
        if api_key.strip():
            headers["Authorization"] = f"Bearer {api_key.strip()}"
        if request.cloud.provider == CloudProvider.openrouter:
            headers["X-Title"] = "SweetrollLM"

        payload = {
            "model": request.cloud.model,
            "messages": [
                {"role": message.role.value, "content": message.content}
                for message in request.normalized_messages()
            ],
            "temperature": request.temperature,
            "top_p": request.top_p,
            "max_tokens": request.max_tokens,
            "stop": stop_tokens_for_template(request.local.template),
            "stream": True,
        }

        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as res:
                    if res.status_code >= 400:
                        body = await res.aread()
                        raise RuntimeError(
                            f"Cloud request failed with HTTP {res.status_code}: "
                            f"{body.decode('utf-8', errors='replace')}"
                        )

                    async for line in res.aiter_lines():
                        line = line.strip()
                        if not line or not line.startswith("data:"):
                            continue
                        data = line.removeprefix("data:").strip()
                        if data == "[DONE]":
                            break
                        token = _extract_token(data)
                        if token:
                            yield token
        except httpx.ConnectError as exc:
            raise RuntimeError(
                "External API connection failed. Start KoboldCPP/Ollama or update "
                f"the fallback base URL. Tried: {url}"
            ) from exc
        except httpx.HTTPError as exc:
            raise RuntimeError(f"External API request failed: {exc}") from exc


def _chat_completions_url(base_url: str) -> str:
    normalized = base_url.rstrip("/")
    if normalized.endswith("/chat/completions"):
        return normalized
    return f"{normalized}/chat/completions"


def _requires_api_key(provider: CloudProvider, base_url: str) -> bool:
    if provider in {CloudProvider.openai, CloudProvider.openrouter}:
        return True
    return not _is_loopback_url(base_url)


def _is_loopback_url(base_url: str) -> bool:
    host = (urlparse(base_url).hostname or "").lower()
    return host in {"localhost", "127.0.0.1", "::1", "0.0.0.0"}


def _extract_token(data: str) -> str:
    try:
        payload = json.loads(data)
    except json.JSONDecodeError:
        return ""

    choices = payload.get("choices") or []
    if not choices:
        return ""
    choice = choices[0]
    delta = choice.get("delta") or {}
    return delta.get("content") or choice.get("text") or ""
