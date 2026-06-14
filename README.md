<p align="center"><img src="storage/assets/logo.png" width="220" alt="SweetrollLM Logo"></p>

<h1 align="center">🛖 SweetrollLM: The Guildmaster's Secret AI Proxy</h1>

> "Let me guess... someone stole your sweetroll?" — Ancient Hold Guard

---

## ⚔️ Welcome, Weary Digital Traveler

Pull up a chair, lower your hood, and stop feeding gold coins to the corporate cloud lords just to flirt with a chatbot, interrogate a model, or build a lore-soaked roleplay den.

**SweetrollLM** is a local-first AI sandbox for rogue developers, degenerate gamers, character-card collectors, prompt alchemists, and anyone who believes their conversations belong in their own strongbox.

This is the tavern where:

- Your **GGUF models** live on your own disk.
- Your **characters, lorebooks, personas, and timelines** stay in local storage.
- Your **API keys** sit in isolated vault slots instead of getting mashed into one cursed config blob.
- Your **chat UI** can look like a moonlit inn, a haunted guild hall, or whatever wallpaper shrine your heart demands.

No bland corporate glass cube.
No "please subscribe to unlock personality."
No cloud overlord deciding your tavern closes at midnight.

Just you, your models, your characters, and a suspiciously cozy pile of sweetrolls.

---

## 🧙 Legendary Architecture Features

### 🧪 The Alchemist's Backdrop Canvas

SweetrollLM has a **dual-layer wallpaper engine** built for dramatic roleplay ambience without murdering readability.

The canvas priority spell fires in this order:

1. **Character Card Backdrop** — if the active character has custom card art enabled.
2. **Character Avatar Fallback** — if no separate backdrop exists, the character portrait becomes the scene.
3. **Uploaded Global Background** — a universal tavern wallpaper stored under `storage/assets/`.
4. **Theme Default Canvas** — the safe fallback when no art has been chosen.

Then come the twin sorcery sliders:

- **Image Dimmer** controls `--bg-image-opacity`, affecting only the background layer.
- **Chat Bubble Translucency** controls `--chat-bubble-opacity`, affecting only message surfaces.

The result: crisp art behind the chat, readable text in front, and enough glassy drama to make your character card feel like it paid rent.

> Your wallpaper is not a muddy black smudge anymore. The canvas breathes. The bubbles obey.

---

### 🔥 The Left-Sidebar Forge

Opening a giant marketplace modal just to mount a local model is peasant behavior.

The **Left-Sidebar Forge** gives Local Engine Mode its own context-aware GGUF control panel:

- Scan `storage/models/` for local `.gguf` scrolls.
- Pick a model from the inline dropdown.
- Load or unload the engine without leaving the chat.
- See the active model status immediately.
- Catch nasty failures inline, including:
  - out-of-memory crashes,
  - bad context sizing,
  - native `llama-cpp-python` loader failures,
  - legacy CPU instruction mismatch,
  - missing `koboldcpp-oldpc.exe` fallback worker.

Modern rigs can swing the native blade. Older machines can summon the headless old-PC Kobold worker from the shadows.

No panic. No random crash ritual. Just a clean diagnostic and a path forward.

---

### 🗝️ Multi-API Pocket Slots

Cloud keys deserve separate pockets. SweetrollLM treats provider configs like enchanted inventory slots, not one cursed junk drawer.

Each saved API profile owns its own isolated record:

- `id`
- `name`
- `base_url`
- `api_key`
- `default_model`
- active default flag
- alternate fallback flag

That means you can keep:

- OpenRouter for free tavern experiments,
- OpenAI for polished spellcraft,
- Ollama for local OpenAI-compatible routing,
- Groq for fast side quests,
- KoboldCPP for the old reliable basement engine,
- custom endpoints for whatever forbidden artifact you are testing at 3 AM.

Saving a new profile no longer overwrites your active default. The vault has slots now. Civilization has advanced.

---

### The Compact Guild Ledger

The interface has been reforged into a slimmer, sharper command deck so the tavern no longer eats your whole screen like an overfed draugr.

The left sidebar now uses collapsible accordion panels for:

- **Inference / Local Engine** - switch routing modes, scan GGUF files, and load or unload local models without opening the marketplace.
- **Cloud API** - manage provider profiles and fallback keys in a tighter editor layout.
- **Generation Settings** - tune theme, background, streaming, tokens, temperature, and transparency without permanent vertical clutter.
- **Characters / Chats** - keep personas, character cards, past timelines, system prompt, and lorebook status in one compact campaign shelf.

The whole workspace is scaled down for actual use: tighter buttons, cleaner top bars, single-line headers, smaller form rhythm, and less wasted vertical air. More tavern table. Less ceremonial paperwork.

---

### The Latest-Reply Command Sigils

The newest assistant message bubble now carries a power-user execution toolbar, visible only when it matters: on the most recent active character reply.

Its four sigils are built for branching, polishing, and roleplay momentum:

- **Retry with Variant Preservation** - rerolls the assistant response while keeping the old attempt in that message slot's variant archive.
- **Variant History Paging (`< x / y >`)** - cycles between saved generation paths and mutates the active chat state so future context follows the selected branch.
- **Continue Generation** - asks the active local or cloud engine to keep writing from the end of the last assistant reply without needing another user prompt.
- **Contextual Input Suggestions** - asks the model to draft a likely next user response, then places it directly into the composer for editing instead of auto-sending it.

The toolbar is event-delegated through the persistent chat log, so re-rendering the message list does not kill the buttons. A proper adventurer keeps their blades sharp after every redraw.

---

## 📜 Other Tavern Tools

SweetrollLM also brings the goods:

- **Streaming chat via Server-Sent Events** with optional full-response rendering.
- **SillyTavern-style character cards** with import/export support.
- **Lorebooks / World Info** that inject context when keywords awaken.
- **User personas** so the AI knows who walked into the tavern.
- **Persistent chat timelines** with branching session history.
- **Message controls** for edit, copy, fold, hide, select, and bulk delete.
- **Latest-reply execution toolbar** for retry variants, continuation, branch paging, and suggested user replies.
- **Hugging Face GGUF marketplace** with search, local detection, and background downloads.
- **Dynamic fallback inference** from native `llama-cpp-python` to embedded `koboldcpp-oldpc.exe`.
- **Collapsible compact sidebar** with accordion sections for local inference, cloud profiles, generation settings, characters, and chats.
- **Live console log viewer** for watching the engine chant in real time.

---

## 🕯️ Installation & Rituals

### 1. Clone the Guild Hall

```bash
git clone https://github.com/syfr512/SweetrollLM.git
cd SweetrollLM
```

### 2. Cast the Installation Ritual

Double-click the installer once:

```text
install.bat
```

That single ritual creates the local `venv/`, activates it, and pulls down the required dependencies.

### 3. Stock the Model Cellar

Drop your `.gguf` models into:

```text
storage/models/
```

If your CPU is an older warrior without modern AVX2 battle runes, place this binary in the project root:

```text
koboldcpp-oldpc.exe
```

SweetrollLM will try native inference first, then fall back to the headless old-PC worker if the hardware cries for mercy.

### 4. Forge a Desktop Shortcut

Want a proper tavern sigil on your Desktop? Double-click this once:

```text
create_shortcut.bat
```

It creates a native Windows shortcut named `SweetrollLM.lnk` pointing straight at the local launcher.

Under the hood, the shortcut forge uses a PowerShell-backed Windows COM call, so paths with spaces behave properly. It also binds the custom tavern sigil at:

```text
sweetroll_lm/static/assets/icon.ico
```

### 5. Open the Tavern

Double-click:

```text
start.bat
```

The tavern opens at:

```text
http://127.0.0.1:7865
```

`start.bat` starts the server and opens SweetrollLM in app-mode, so you get a clean desktop-window feel without browser clutter.

---

## 🧭 Suggested First Quest

1. Put a small GGUF model in `storage/models/`.
2. Launch SweetrollLM.
3. Open **Local Engine Mode**.
4. Use the **Left-Sidebar Forge** to scan and load it.
5. Import a character card.
6. Add a global wallpaper.
7. Slide the translucency until the tavern looks illegal.
8. Begin the campaign.

---

## 🛡️ License

SweetrollLM is released under the **GNU Affero General Public License v3.0**.

Translation from legalese: build with it, modify it, share it, fork it, improve it, but do not sneak into the night wearing our cloak and sell a closed-source rebrand to unsuspecting villagers.

---

## 🍺 Final Toast

SweetrollLM is for people who want their AI frontends weird, powerful, local, moddable, dramatic, and entirely under their command.

The fire is lit.
The model cellar is open.
The guild table has room.

**Now roll initiative, traveler.**
