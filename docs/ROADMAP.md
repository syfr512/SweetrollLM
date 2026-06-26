# SweetrollLM Roadmap

SweetrollLM is aiming to become a local-first alternative for users who want the customization depth of SillyTavern, the model handling of LM Studio, and the focused agent workspace feel of Codex, Odysseus, Claude, and Antigravity.

This roadmap keeps the project direction public and easy to index.

## 1. Ollama Workflow Maturity

SweetrollLM now includes first-class Ollama support for detecting a local Ollama server, listing installed models, inspecting loaded models, showing model context/size/family/quantization metadata, validating the OpenAI-compatible chat endpoint, streaming pull progress, selecting Ollama as a local runtime source, and registering Ollama as a saved provider profile.

The next step is making the Ollama workflow feel as native as the GGUF manager:

- Start, stop, and switch models without manual endpoint setup where the local environment allows it.
- Recommend Ollama models by hardware tier.
- Route chat, vision, and workspace tasks through Ollama where model capability allows.
- Add clearer capability warnings for chat-only, vision, and tool-capable Ollama models.

This would make SweetrollLM easier for users who do not want to manage GGUF files manually.

## 2. Model Capability Registry

SweetrollLM should maintain a local model capability map:

- Chat.
- Vision.
- Image generation.
- Tool use.
- Function calling.
- Long context.
- Low-memory CPU mode.
- Roleplay tuning.

The UI should warn users when they select a chat-only model for image captioning or a tiny model for agentic workspace tasks.

## 3. Agentic Workspace Hardening

The workspace should continue moving toward a reliable local coding and automation environment:

- Task planning with visible steps.
- File diffs before writes.
- Shell output summarized inline.
- Safer ask-first approvals by default.
- Workspace checkpoints and rollback.
- Git status, diff, commit, and branch controls.
- Browser automation with explicit user-visible permissions.
- MCP-style tool adapters.
- Project-specific memory and instructions.

The target is practical autonomy, not noisy automation.

## 4. SillyTavern-Class Roleplay Depth

SweetrollLM should continue expanding character chat features:

- Character groups and multi-character rooms.
- Alternate greetings and greeting randomization.
- Swipe/regenerate variants with persistent branches.
- Author notes and depth controls.
- Lorebook priority, insertion order, and token budget controls.
- Character tags, favorites, and quick switcher.
- PNG card metadata import/export.
- Chat tree branching and timeline comparison.

## 5. Tavo-Style Minimal UI Polish

The interface should remain calmer than the early prototype:

- Less border noise.
- Smaller controls.
- Clear navigation sections.
- More settings moved into Settings instead of the main rail.
- Model selection visible from the composer.
- Workspace tools collapsed until needed.
- Consistent empty states.
- Better mobile and small-window behavior.

## 6. Desktop Release Quality

To become easy to recommend, SweetrollLM should ship with:

- A signed Windows installer.
- Portable ZIP release.
- Auto-update checks.
- GitHub Releases with screenshots and changelog.
- Minimal telemetry-free diagnostics.
- Full user data export/import.
- A clean docs site or GitHub Pages landing page.

## 7. Discovery And Community

To become visible outside GitHub:

- Add GitHub repository topics for `local-ai`, `llm`, `gguf`, `sillytavern`, `ollama`, `koboldcpp`, `roleplay-ai`, `agentic-ai`, `fastapi`, and `desktop-app`.
- Publish tagged GitHub Releases.
- Add a short demo GIF to the README.
- Publish a small GitHub Pages landing page.
- Share a launch post in relevant local AI and roleplay communities.
- Write comparison docs: SweetrollLM vs SillyTavern, SweetrollLM vs LM Studio, SweetrollLM vs Ollama WebUI.
