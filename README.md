# Local Tavern

Phase 1 scaffold for an all-in-one local AI desktop chat application inspired by LM Studio, KoboldCPP, and SillyTavern.

## What Is Implemented

- FastAPI backend served on localhost.
- Native desktop launcher through `pywebview`.
- Dark local web interface served by the backend.
- Streaming chat endpoint using server-sent events.
- Inference Source toggle:
  - Local Engine Mode: offline `.gguf` inference through `llama-cpp-python`.
  - Cloud API Mode: OpenAI/OpenRouter-compatible async HTTP streaming.
- Local model scan/load/unload endpoints for `.gguf` files under `storage/models`.
- Hugging Face `.gguf` repository search and background downloads with SSE progress.
- Character, lorebook, and chat-session JSON persistence under local storage.
- Past chat history, clear-chat reset, and browser-side JSON export.
- Prompt templates for ChatML, Llama 3, Mistral, and plain instruction prompts.
- Client-side storage folder structure for models, characters, chats, and lorebooks.
- Small extension registry scaffold for future image generation, captioning, or tool modules.

Phase 3 character/lorebook persistence is intentionally not implemented yet.

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

For local `.gguf` inference:

```powershell
pip install -r requirements-local.txt
```

Place `.gguf` files in:

```text
storage/models/
```

## Run

Desktop window:

```powershell
python run.py
```

Backend-only browser mode:

```powershell
python -m local_tavern.main
```

Then open:

```text
http://127.0.0.1:7865
```

## Notes

- API keys are never written to disk by Phase 1. They are sent only from the browser UI to the local backend for the current cloud request.
- When Local Engine Mode is selected, cloud provider, base URL, model, and API key fields are hidden and disabled in the UI.
- Heavy dependencies are split out so the desktop shell and cloud mode can run without compiling `llama-cpp-python`.
