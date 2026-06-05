# Local Tavern

An open-source, dual-compatible local AI chat interface optimized for performance and ease of use. Local Tavern bridges the deep customization of SillyTavern with the self-contained simplicity of LM Studio, giving roleplay, model management, and local-first chat workflows a clean single-app home.

## The Killer Feature: Adaptive Hardware Intelligence

Local Tavern features **Dynamic Dual-Compatibility Inference Routing**.

When you load a GGUF model, the app first attempts to run it completely natively through `llama-cpp-python`. On high-end and modern systems, this keeps inference direct, fast, and self-contained.

If the machine uses a legacy CPU architecture and native loading triggers an AVX2/AVX mismatch, DLL initialization failure, or Illegal Instruction error, Local Tavern catches the failure safely instead of crashing. It then instantly initializes an embedded `koboldcpp-oldpc.exe` process in the background, headlessly, and routes generation through its OpenAI-compatible local API.

The result: modern systems get native inference, older systems still get a smooth local GGUF workflow, and the user does not have to manually launch a separate KoboldCPP window.

## Ultra-Simple Installation & Launch

### Step 1

Place your favorite GGUF models in the root folder or `storage/models/`.

If you are using an older PC, make sure `koboldcpp-oldpc.exe` is in the project root directory.

### Step 2

Double-click `install.bat` once.

It automatically creates an isolated `venv` environment and installs the lightweight dependencies needed to run the app.

### Step 3

Double-click `start.bat` to launch.

The app boots the local Uvicorn server and opens exactly one tab in your default browser at `http://127.0.0.1:7865`.

## Features Checklist

- Streaming text generation via Server-Sent Events (SSE).
- Local model marketplace with Hugging Face search and background download progress tracking.
- Dynamic GGUF loading with native `llama-cpp-python` first and legacy KoboldCPP worker fallback when needed.
- Built-in prompt formatting cards for ChatML, Llama 3, and Mistral.
- Cloud API mode for OpenAI-compatible endpoints such as OpenRouter, Ollama, and KoboldCPP.
- Full character card persistence for names, descriptions, personalities, first messages, and avatars.
- Lorebook and World Info keyword scanning with contextual prompt injection.
- Conversation history persistence with clear chat, session restore, and export support.
- Local-first storage under `storage/` for models, characters, lorebooks, chats, and extension data.

## License

Local Tavern is released under the GNU Affero General Public License v3.0. Community contributions are welcome, and derivative networked versions must preserve the same open-source freedoms.
