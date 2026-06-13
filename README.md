# SweetrollLM

![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-35d0a0)
![Runtime: Python + FastAPI](https://img.shields.io/badge/runtime-Python%20%2B%20FastAPI-5ad7ff)
![Interface: Aurora Dark](https://img.shields.io/badge/interface-Aurora%20Dark-a78bfa)
![Models: GGUF Ready](https://img.shields.io/badge/models-GGUF%20ready-f5f7fb)

SweetrollLM is an open-source, local-first AI chat workstation for character roleplay, lorebooks, personas, GGUF model management, and OpenAI-compatible API routing. It blends SillyTavern-style customization with LM Studio-style local model control, wrapped in a minimalist Aurora Dark browser-app interface.

The project is built for a practical spread of hardware: modern systems can run native `llama-cpp-python`, older CPUs can fall back to a managed `koboldcpp-oldpc.exe` worker, and cloud or local OpenAI-compatible endpoints can be swapped through isolated provider profiles.

## Highlights

| Module | Status |
| --- | --- |
| Local GGUF chat | Native llama-cpp first, managed KoboldCPP fallback second |
| Cloud routing | Multi-profile OpenAI-compatible provider registry |
| Character system | SillyTavern-compatible JSON import/export, avatars, card backdrops |
| Lorebooks | Keyword-triggered World Info context injection |
| Personas | Multiple user identities with persistent default selection |
| Chat sessions | File-backed timelines, restore menu, export, edit, fold, hide, bulk delete |
| Marketplace | Hugging Face GGUF search, local downloaded detection, background progress tracking |
| UI customization | Dual-layer wallpapers, independent canvas and bubble opacity controls |

## Advanced UI Customization & Inference Routing

### Dual-Layer Custom Backdrops

SweetrollLM renders chat wallpapers through a strict local-first priority chain:

1. Character Card Backdrop
2. Character Avatar Fallback
3. Web-Native Uploaded Global Background
4. Theme Default Canvas

Character cards can define a dedicated backdrop asset. If that field is empty but custom card backdrops are enabled, SweetrollLM uses the character avatar as the immersive chat wallpaper. If no character-specific visual is available, the app falls back to the user-selected global background stored under `storage/assets/`. If no custom visual exists, the active theme canvas is used.

The global background picker is fully browser-native. It uses a hidden HTML file input, uploads through `/api/app-settings/background/upload`, stores media safely under `storage/assets/`, and persists the resulting `/api/assets/...` reference in `storage/app_settings.json`.

### Decoupled Canvas Controls

The background system uses separate rendering controls for the image layer and message layer:

| Control | CSS / Runtime Target | Behavior |
| --- | --- | --- |
| Background Opacity | `--bg-image-opacity` | Dims only the absolute `.chat-backdrop` image layer |
| Chat Transparency | `--chat-bubble-opacity` | Repaints `.bubble` surfaces in real time while keeping text opaque |

The opacity sliders are intentionally independent. Users can keep wallpaper art crisp while making message cards translucent, or dim loud artwork without changing chat readability. The bubble renderer applies immediate DOM repainting for existing messages and newly streamed messages, so transparency updates do not wait for a backend save cycle.

### Inline Local Inference Panel

Local Engine Mode now exposes a compact GGUF controller directly in the left settings sidebar. The panel is context-aware and appears only when local inference is selected.

It supports:

- Inline model scan for `storage/models/`
- GGUF dropdown selection without opening the marketplace modal
- Load and unload controls
- Active model status sync
- Inline exception reporting for out-of-memory, invalid context, worker startup, and native load failures

The full marketplace remains available for Hugging Face search and downloads, but routine local model loading can happen without leaving the chat workspace.

### Multi-API Profile Slots

Cloud API configuration uses an isolated provider registry instead of a single overwritten settings block. Each provider profile owns its own stable slot with:

- `id`
- `name`
- `base_url`
- `api_key`
- `default_model`
- default provider flag
- alternate fallback flag

Saving a new profile appends or updates by unique identity instead of mutating the active default. This keeps OpenRouter, Ollama, Groq, KoboldCPP, OpenAI, and custom endpoints available side by side.

## Inference Architecture

```text
SweetrollLM UI
  -> FastAPI localhost backend
    -> Local GGUF path
      -> llama-cpp-python native load
      -> managed koboldcpp-oldpc.exe fallback worker
    -> Cloud/API path
      -> active provider profile
      -> alternate fallback provider on timeout/rate failure
    -> context orchestration
      -> character card
      -> persona
      -> lorebook injections
      -> recent chat history
```

Native model loading is attempted first on capable hardware. If the CPU or wheel fails with an AVX/AVX2, DLL, or illegal-instruction failure, the backend catches the error and can launch the legacy KoboldCPP worker headlessly. This keeps the server alive and routes chat through the fallback endpoint automatically.

## Local Storage Layout

| Path | Purpose |
| --- | --- |
| `storage/models/` | Downloaded and manually placed GGUF files |
| `storage/characters/` | Character profile JSON files |
| `storage/personas/` | User persona JSON files |
| `storage/lorebooks/` | Lorebook and World Info JSON files |
| `storage/chats/` | Conversation timelines |
| `storage/assets/` | Uploaded avatars, card backdrops, global wallpapers, media assets |
| `storage/extensions/` | Extension configuration data |
| `storage/app_settings.json` | Local appearance settings such as wallpaper and opacity values |
| `storage/api_providers.json` | Local cloud provider registry |

Heavy model binaries, private runtime state, uploaded assets, logs, and local settings are excluded from Git by default.

## One-Click Windows Setup

| Step | Action |
| --- | --- |
| 1 | Place `.gguf` models in `storage/models/` or download them from the marketplace. |
| 2 | On older PCs, place `koboldcpp-oldpc.exe` in the project root or `bin/`. |
| 3 | Double-click `install.bat` once to create `venv/` and install dependencies. |
| 4 | Double-click `start.bat` to launch SweetrollLM in a standalone app-mode browser window. |

```powershell
install.bat
start.bat
```

Default local URL:

```text
http://127.0.0.1:7865
```

## Developer Surface

| Layer | Files |
| --- | --- |
| Application entry | `run.py`, `sweetroll_lm/main.py` |
| API routes | `sweetroll_lm/routes.py` |
| Persistence | `sweetroll_lm/storage.py` |
| Schemas | `sweetroll_lm/schemas.py` |
| Local and cloud inference | `sweetroll_lm/inference/` |
| Frontend shell | `sweetroll_lm/static/index.html` |
| Frontend runtime | `sweetroll_lm/static/js/app.js` |
| Theme and layout | `sweetroll_lm/static/css/tailwind.css` |
| Architecture smoke tests | `test_architecture.py` |

## Verification

```powershell
python -m compileall sweetroll_lm test_architecture.py
node --check sweetroll_lm\static\js\app.js
python test_architecture.py
```

Expected architecture result:

```text
Overall: PASS
```

## License

SweetrollLM is released under the GNU Affero General Public License v3.0. You can study, modify, and share the code, and networked derivatives must preserve the same open-source freedoms.
