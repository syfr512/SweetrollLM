# SweetrollLM

![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-35d0a0)
![Runtime: Python + FastAPI](https://img.shields.io/badge/runtime-Python%20%2B%20FastAPI-5ad7ff)
![UI: Local Browser App](https://img.shields.io/badge/UI-local%20browser%20app-ff5dd1)
![Models: GGUF Ready](https://img.shields.io/badge/models-GGUF%20ready-f5f7fb)

SweetrollLM is an open-source, local-first AI chat interface for roleplay, characters, lorebooks, personas, model management, and creative extensions. It bridges the deep customization of SillyTavern with the self-contained simplicity of LM Studio, then adds adaptive hardware routing for older PCs that cannot run modern native inference wheels.

## Signature Feature

### Dynamic Dual-Compatibility Inference Routing

SweetrollLM loads GGUF models intelligently:

| Machine Type | First Attempt | Automatic Recovery |
| --- | --- | --- |
| Modern CPU/GPU systems | Native `llama-cpp-python` loading | Direct local inference with no worker process |
| Legacy CPUs without AVX2 | Native load is attempted and safely caught | Headless `koboldcpp-oldpc.exe` worker starts automatically |
| External engines | OpenAI-compatible endpoint routing | KoboldCPP, Ollama, OpenRouter, Groq, or custom APIs |

If native loading hits an AVX/AVX2 mismatch, DLL initialization failure, or Illegal Instruction crash condition, SweetrollLM catches it, keeps the backend alive, and falls back to the embedded old-PC worker without asking the user to open a second app.

## One-Click Setup

| Step | Action |
| --- | --- |
| 1 | Place `.gguf` models in the project root or `storage/models/`. On legacy PCs, place `koboldcpp-oldpc.exe` in the project root or `bin/`. |
| 2 | Double-click `install.bat` once to create `venv/` and install dependencies. |
| 3 | Double-click `start.bat` to launch the server and open SweetrollLM in a standalone Edge/Chrome app-mode window at `http://127.0.0.1:7865`. |

```powershell
install.bat
start.bat
```

## Feature Matrix

| Area | Highlights |
| --- | --- |
| Chat Core | SSE token streaming, optional full-response mode, typewriter rendering, auto-scroll anchoring, stop-token safety, context trimming |
| Characters | SillyTavern-style character import/export, avatar assets, first messages, descriptions, personality, scenario, example dialogue |
| Lorebooks | Keyword-triggered World Info injection into hidden context blocks |
| Personas | Multiple user personas with names, bios, avatars, and active default selection |
| Sessions | Local chat history persistence, restore menu, JSON/Markdown export, bulk delete, inline edit/copy/fold/hide controls |
| Marketplace | Hugging Face GGUF search, background downloader, live progress, local downloaded detection |
| Cookbook | Curated roleplay model recommendations for lightweight, balanced, and enthusiast hardware tiers |
| APIs | Provider registry for OpenRouter, Ollama, Groq, KoboldCPP, OpenAI-compatible endpoints, and custom base URLs |
| Creative Extensions | Image generation connectors, VLM captioning hooks, drag-and-drop image context, chat transparency controls |
| Production Shell | App-mode Windows launcher, Skyrim-inspired startup overlay, SEO metadata, and live backend console log viewer |
| First-Run Polish | Tavo-inspired setup wizard, branded taskbar icon, Aurora Dark and Sweetroll Light themes, hardware diagnostics |

## Creative Extensions

SweetrollLM includes a multimodal Extensions drawer inside the chat deck:

| Extension | Local Targets | Cloud Targets | Chat Behavior |
| --- | --- | --- | --- |
| Image Generation | ComfyUI `/prompt`, Stable Diffusion APIs | Flux-compatible, DALL-E-style JSON APIs | Appends generated image markdown or submitted job cards into the active conversation |
| Vision Captioning | LLaVA, Qwen-VL, Ollama/custom VLM endpoints | Vision API-compatible routes | Converts uploaded images into hidden visual context so characters can respond to what the user attaches |

The extension layer is intentionally adapter-shaped: bring your own endpoint, keep all chat state local, and expand the connector logic without rewriting the core interface.

## Local Storage Layout

| Path | Purpose |
| --- | --- |
| `storage/models/` | Downloaded and manually placed GGUF models |
| `storage/characters/` | Character profile JSON files |
| `storage/lorebooks/` | World Info and lorebook JSON files |
| `storage/personas/` | User persona profiles |
| `storage/chats/` | Conversation histories |
| `storage/assets/` | Uploaded avatars and local media assets |
| `storage/extensions/` | Future extension-specific local data |

Heavy binaries and private runtime data stay out of Git by default.

## Architecture

```text
Browser UI
  -> FastAPI backend on localhost
    -> Native llama-cpp-python engine
    -> Headless koboldcpp-oldpc.exe fallback worker
    -> OpenAI-compatible cloud/local API providers
    -> File-based storage under ./storage
```

| Layer | Files |
| --- | --- |
| App entry | `run.py`, `sweetroll_lm/main.py` |
| API routes | `sweetroll_lm/routes.py` |
| Inference | `sweetroll_lm/inference/` |
| Persistence | `sweetroll_lm/storage.py` |
| Frontend | `sweetroll_lm/static/index.html`, `sweetroll_lm/static/js/app.js`, `sweetroll_lm/static/css/tailwind.css` |

## Development Checks

```powershell
python -m compileall sweetroll_lm test_architecture.py
python test_architecture.py
```

Expected result:

```text
Overall: PASS
```

## License

SweetrollLM is released under the GNU Affero General Public License v3.0. You can study it, modify it, and share it, and networked derivatives must preserve the same open-source freedoms.
