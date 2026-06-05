const DEFAULT_CHARACTER = {
  id: null,
  name: "Aria",
  description: "",
  personality: "",
  first_message: "Hello. I am Aria.",
  avatar_url: "",
  avatar_file: "",
};

const state = {
  messages: [],
  streaming: false,
  activeWriter: null,
  activeAssistantText: "",
  thinkingRow: null,
  thinkingBody: null,
  thinkingActive: false,
  sidebarCollapsed: false,
  downloadSource: null,
  activeChatId: null,
  chatSessions: [],
  autoScrollObserver: null,
  characters: [],
  activeCharacter: { ...DEFAULT_CHARACTER },
  editingCharacterId: null,
  lorebooks: [],
  activeLorebook: null,
  editingLorebookId: null,
  lorebookEnabled: false,
};

const el = {};

document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

async function initializeApp() {
  cacheElements();
  bindEvents();
  setSidebarCollapsed(loadSidebarPreference(), { persist: false });
  updateInferenceVisibility();
  setCharacterEditor(DEFAULT_CHARACTER);
  applyCharacter(DEFAULT_CHARACTER, { resetChat: false });
  await Promise.all([loadCharacters(), loadLorebooks(), refreshHealth(), refreshModels()]);
  resetChatToFirstMessage();
  installAutoScrollObserver();
}

function cacheElements() {
  [
    "connectionStatus",
    "appShell",
    "settingsSidebar",
    "toggleSidebar",
    "sourceBadge",
    "inferenceSource",
    "cloudPanel",
    "refreshModels",
    "localModelPath",
    "promptTemplate",
    "gpuLayers",
    "contextSize",
    "loadModel",
    "unloadModel",
    "modelStatus",
    "activeModelDot",
    "cloudProvider",
    "baseUrl",
    "cloudModel",
    "apiKey",
    "temperature",
    "topP",
    "maxTokens",
    "characterName",
    "characterAvatar",
    "characterAvatarPreview",
    "systemPrompt",
    "activeLorebookDot",
    "activeLorebookStatus",
    "chatTitle",
    "chatSubtitle",
    "chatHistorySelect",
    "exportChat",
    "deleteChat",
    "clearChat",
    "chatMessages",
    "chatForm",
    "messageInput",
    "sendButton",
    "openModelMarket",
    "closeModelMarket",
    "hfSearchForm",
    "hfRepoInput",
    "hfSearchButton",
    "hfResults",
    "downloadProgressPanel",
    "downloadProgressFill",
    "downloadProgressText",
    "downloadSpeedText",
    "downloadStatusText",
    "openCharacterLibrary",
    "closeCharacterLibrary",
    "editCurrentCharacter",
    "newCharacter",
    "characterList",
    "characterEditorMode",
    "characterEditorAvatar",
    "characterEditorName",
    "characterEditorAvatarUrl",
    "characterEditorDescription",
    "characterEditorPersonality",
    "characterEditorFirstMessage",
    "saveCharacter",
    "useCharacter",
    "characterSaveStatus",
    "openLorebookEditor",
    "closeLorebookEditor",
    "newLorebook",
    "lorebookList",
    "lorebookActive",
    "lorebookName",
    "addLoreEntry",
    "loreEntryList",
    "saveLorebook",
    "useLorebook",
    "lorebookSaveStatus",
  ].forEach((id) => {
    el[id] = document.getElementById(id);
  });
  el.modelMarketModal = document.getElementById("model-market-modal");
  el.characterModal = document.getElementById("character-modal");
  el.lorebookModal = document.getElementById("lorebook-modal");
}

function bindEvents() {
  el.inferenceSource.addEventListener("change", updateInferenceVisibility);
  el.cloudProvider.addEventListener("change", updateCloudDefaults);
  el.refreshModels.addEventListener("click", refreshModels);
  el.loadModel.addEventListener("click", loadModel);
  el.unloadModel.addEventListener("click", unloadModel);
  el.toggleSidebar.addEventListener("click", () => {
    setSidebarCollapsed(!state.sidebarCollapsed);
  });

  el.openModelMarket.addEventListener("click", openModelMarket);
  el.closeModelMarket.addEventListener("click", () => closeModal(el.modelMarketModal));
  el.openCharacterLibrary.addEventListener("click", openCharacterLibrary);
  el.editCurrentCharacter.addEventListener("click", openCharacterLibrary);
  el.closeCharacterLibrary.addEventListener("click", () => closeModal(el.characterModal));
  el.openLorebookEditor.addEventListener("click", openLorebookEditor);
  el.closeLorebookEditor.addEventListener("click", () => closeModal(el.lorebookModal));

  [el.modelMarketModal, el.characterModal, el.lorebookModal].forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllModals();
    }
  });

  el.hfSearchForm.addEventListener("submit", searchHfModels);
  el.newCharacter.addEventListener("click", () => setCharacterEditor(DEFAULT_CHARACTER));
  el.saveCharacter.addEventListener("click", saveCharacterCard);
  el.useCharacter.addEventListener("click", () => applyCharacter(editorCharacterPayload()));
  el.characterEditorName.addEventListener("input", updateCharacterEditorAvatar);
  el.characterEditorAvatarUrl.addEventListener("input", updateCharacterEditorAvatar);

  el.newLorebook.addEventListener("click", newLorebookDraft);
  el.addLoreEntry.addEventListener("click", () => addLoreEntryRow());
  el.saveLorebook.addEventListener("click", saveLorebook);
  el.useLorebook.addEventListener("click", useLorebookFromEditor);
  el.lorebookActive.addEventListener("change", () => {
    state.lorebookEnabled = el.lorebookActive.checked;
    if (state.activeLorebook && state.editingLorebookId === state.activeLorebook.id) {
      state.activeLorebook.active = state.lorebookEnabled;
    }
    updateLorebookStatus();
  });

  el.characterName.addEventListener("input", updateCharacterPreview);
  el.characterAvatar.addEventListener("input", updateCharacterPreview);
  el.clearChat.addEventListener("click", clearChat);
  el.exportChat.addEventListener("click", exportChatLogs);
  el.deleteChat.addEventListener("click", deleteActiveChat);
  el.chatHistorySelect.addEventListener("change", loadSelectedChat);
  el.chatForm.addEventListener("submit", sendMessage);
  el.messageInput.addEventListener("input", autosizeComposer);
  el.messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      el.chatForm.requestSubmit();
    }
  });
}

function loadSidebarPreference() {
  try {
    return window.localStorage.getItem("local-tavern-sidebar-collapsed") === "true";
  } catch {
    return false;
  }
}

function setSidebarCollapsed(collapsed, options = {}) {
  state.sidebarCollapsed = Boolean(collapsed);
  el.appShell.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
  el.settingsSidebar.setAttribute("aria-hidden", String(state.sidebarCollapsed));
  if ("inert" in el.settingsSidebar) {
    el.settingsSidebar.inert = state.sidebarCollapsed;
  }
  el.toggleSidebar.setAttribute("aria-expanded", String(!state.sidebarCollapsed));

  if (options.persist !== false) {
    try {
      window.localStorage.setItem(
        "local-tavern-sidebar-collapsed",
        String(state.sidebarCollapsed)
      );
    } catch {
      // Preference storage is a nicety; the live layout state is already applied.
    }
  }

  window.setTimeout(scrollChatToBottom, 240);
}

function openModelMarket() {
  openModal(el.modelMarketModal, el.closeModelMarket);
  refreshModels();
}

function openCharacterLibrary() {
  openModal(el.characterModal, el.closeCharacterLibrary);
  loadCharacters();
}

function openLorebookEditor() {
  openModal(el.lorebookModal, el.closeLorebookEditor);
  loadLorebooks();
}

function openModal(modal, focusTarget) {
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  window.setTimeout(() => focusTarget.focus(), 0);
}

function closeModal(modal) {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

function closeAllModals() {
  [el.modelMarketModal, el.characterModal, el.lorebookModal].forEach(closeModal);
}

function updateInferenceVisibility() {
  const localMode = el.inferenceSource.value === "local";
  el.cloudPanel.classList.toggle("hidden", localMode);
  setCloudFieldsEnabled(!localMode);
  el.sourceBadge.textContent = localMode ? "Local" : "Cloud";
  el.sourceBadge.classList.toggle("badge-local", localMode);
  el.chatSubtitle.textContent = localMode ? "Local Engine Mode" : "Cloud API Mode";
}

function setCloudFieldsEnabled(enabled) {
  document.querySelectorAll("[data-cloud-field]").forEach((field) => {
    field.disabled = !enabled;
  });
}

function updateCloudDefaults() {
  if (el.cloudProvider.value === "openrouter") {
    el.baseUrl.value = "https://openrouter.ai/api/v1";
    if (!el.cloudModel.value || el.cloudModel.value === "gpt-4o-mini") {
      el.cloudModel.value = "openai/gpt-4o-mini";
    }
  } else if (el.cloudProvider.value === "openai") {
    el.baseUrl.value = "https://api.openai.com/v1";
    if (!el.cloudModel.value || el.cloudModel.value === "openai/gpt-4o-mini") {
      el.cloudModel.value = "gpt-4o-mini";
    }
  }
}

async function refreshHealth() {
  try {
    const response = await fetch("/api/health");
    const data = await response.json();
    el.connectionStatus.textContent = data.status === "ok" ? "Ready" : "Starting";
  } catch {
    el.connectionStatus.textContent = "Offline";
  }
}

async function refreshModels() {
  setModelStatus("Scanning models", false);
  const previousSelection = el.localModelPath.value;
  try {
    const response = await fetch("/api/models/local");
    const data = await response.json();
    const models = data.models || [];
    el.localModelPath.innerHTML = "";

    if (!models.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No GGUF files found";
      el.localModelPath.appendChild(option);
    } else {
      models.forEach((model) => {
        const option = document.createElement("option");
        option.value = model.path || model;
        option.textContent = model.relative_path
          ? `${model.relative_path} (${formatBytes(model.size_bytes)})`
          : String(model);
        el.localModelPath.appendChild(option);
      });
    }

    if (data.status?.loaded && data.status.model_path) {
      el.localModelPath.value = data.status.model_path;
    } else if (previousSelection) {
      el.localModelPath.value = previousSelection;
    }
    renderModelStatus(data.status);
  } catch (error) {
    setModelStatus(error.message || "Model scan failed", false);
  }
}

async function loadChatSessions() {
  if (!el.chatHistorySelect) {
    return;
  }
  const params = state.activeCharacter?.id
    ? `?character_id=${encodeURIComponent(state.activeCharacter.id)}`
    : "";
  try {
    const response = await fetch(`/api/chats${params}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Could not load chat history");
    }
    state.chatSessions = data;
    renderChatHistorySelect();
  } catch {
    state.chatSessions = [];
    renderChatHistorySelect();
  }
}

function renderChatHistorySelect() {
  const previous = state.activeChatId || "";
  el.chatHistorySelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Past Chats";
  el.chatHistorySelect.appendChild(placeholder);

  state.chatSessions.forEach((session) => {
    const option = document.createElement("option");
    option.value = session.id;
    option.textContent = `${session.title || "Untitled Chat"} - ${formatDateTime(
      session.updated_at
    )}`;
    el.chatHistorySelect.appendChild(option);
  });

  el.chatHistorySelect.value = previous;
}

async function loadSelectedChat() {
  const chatId = el.chatHistorySelect.value;
  if (!chatId) {
    return;
  }
  try {
    const response = await fetch(`/api/chats/${encodeURIComponent(chatId)}`);
    const session = await response.json();
    if (!response.ok) {
      throw new Error(session.detail || "Could not load chat");
    }
    state.activeChatId = session.id;
    state.messages = normalizeSessionMessages(session.messages || []);
    renderSessionMessages();
  } catch (error) {
    console.error(error);
  }
}

async function deleteActiveChat() {
  if (!state.activeChatId) {
    clearChat();
    return;
  }
  const chatId = state.activeChatId;
  try {
    await fetch(`/api/chats/${encodeURIComponent(chatId)}`, { method: "DELETE" });
  } catch (error) {
    console.error(error);
  } finally {
    clearChat();
    await loadChatSessions();
  }
}

function exportChatLogs() {
  const payload = {
    chat_id: state.activeChatId,
    character_id: state.activeCharacter?.id || null,
    character_name: characterName(),
    exported_at: new Date().toISOString(),
    messages: state.messages,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slugify(characterName())}-${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[:T]/g, "-")}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderSessionMessages() {
  el.chatMessages.innerHTML = "";
  if (!state.messages.length) {
    resetChatToFirstMessage();
    return;
  }
  state.messages.forEach((message) => {
    appendMessage(
      message.role,
      message.content,
      message.role === "user" ? "You" : characterName()
    );
  });
  scrollChatToBottom();
}

function normalizeSessionMessages(messages) {
  return messages
    .filter((message) => message.role !== "system" && message.content)
    .map((message) => ({
      role: message.role,
      content: message.content,
      timestamp: message.timestamp || new Date().toISOString(),
    }));
}

async function loadModel() {
  if (!el.localModelPath.value) {
    setModelStatus("Place a .gguf file in storage/models", false);
    return;
  }
  setBusy(true);
  setModelStatus("Loading model into memory", false);
  try {
    const response = await fetch("/api/models/load", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: el.localModelPath.value,
        template: el.promptTemplate.value,
        n_ctx: Number(el.contextSize.value),
        n_gpu_layers: Number(el.gpuLayers.value),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Model load failed");
    }
    renderModelStatus(data);
  } catch (error) {
    setModelStatus(error.message, false);
  } finally {
    setBusy(false);
  }
}

async function unloadModel() {
  setBusy(true);
  setModelStatus("Unloading model from memory", true);
  try {
    const response = await fetch("/api/models/unload", { method: "POST" });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Unload failed");
    }
    renderModelStatus(data);
  } catch (error) {
    setModelStatus(error.message || "Unload failed", false);
  } finally {
    setBusy(false);
  }
}

async function loadCharacters() {
  try {
    const response = await fetch("/api/characters");
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Could not load characters");
    }
    state.characters = data;
    renderCharacterList();
  } catch (error) {
    renderCharacterEmpty(error.message || "Could not load characters.");
  }
}

function renderCharacterList() {
  el.characterList.innerHTML = "";
  if (!state.characters.length) {
    renderCharacterEmpty("No saved character cards yet.");
    return;
  }

  state.characters.forEach((character) => {
    const button = document.createElement("button");
    button.className = "profile-row";
    if (state.activeCharacter?.id === character.id) {
      button.classList.add("active");
    }
    button.type = "button";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    renderAvatar(avatar, character.avatar_url || character.avatar_file, character.name);

    const copy = document.createElement("div");
    const name = document.createElement("div");
    name.className = "profile-name";
    name.textContent = character.name;
    const meta = document.createElement("div");
    meta.className = "profile-meta";
    meta.textContent = character.personality || character.description || "No card notes yet.";
    copy.append(name, meta);

    button.append(avatar, copy);
    button.addEventListener("click", () => {
      setCharacterEditor(character);
      applyCharacter(character);
      renderCharacterList();
    });
    el.characterList.appendChild(button);
  });
}

function renderCharacterEmpty(message) {
  el.characterList.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  el.characterList.appendChild(empty);
}

function setCharacterEditor(character) {
  const profile = normalizeCharacter(character);
  state.editingCharacterId = profile.id;
  el.characterEditorMode.textContent = profile.id ? "Saved" : "Draft";
  el.characterEditorName.value = profile.name;
  el.characterEditorAvatarUrl.value = profile.avatar_url || profile.avatar_file || "";
  el.characterEditorDescription.value = profile.description || "";
  el.characterEditorPersonality.value = profile.personality || "";
  el.characterEditorFirstMessage.value = profile.first_message || `Hello. I am ${profile.name}.`;
  updateCharacterEditorAvatar();
}

function editorCharacterPayload() {
  return {
    id: state.editingCharacterId,
    name: el.characterEditorName.value.trim() || "Assistant",
    description: el.characterEditorDescription.value.trim(),
    personality: el.characterEditorPersonality.value.trim(),
    first_message: el.characterEditorFirstMessage.value.trim(),
    avatar_url: el.characterEditorAvatarUrl.value.trim(),
    avatar_file: "",
  };
}

async function saveCharacterCard() {
  const payload = editorCharacterPayload();
  el.saveCharacter.disabled = true;
  setCharacterSaveStatus("Saving character card.");
  try {
    const response = await fetch("/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const saved = await response.json();
    if (!response.ok) {
      throw new Error(saved.detail || "Could not save character");
    }
    state.editingCharacterId = saved.id;
    setCharacterEditor(saved);
    applyCharacter(saved, { resetChat: false });
    await loadCharacters();
    setCharacterSaveStatus(`Saved ${saved.name}.`);
  } catch (error) {
    setCharacterSaveStatus(error.message || "Could not save character.");
  } finally {
    el.saveCharacter.disabled = false;
  }
}

function setCharacterSaveStatus(message) {
  el.characterSaveStatus.textContent = message;
}

function applyCharacter(character, options = { resetChat: true }) {
  const profile = normalizeCharacter(character);
  state.activeCharacter = profile;
  el.characterName.value = profile.name;
  el.characterAvatar.value = profile.avatar_url || profile.avatar_file || "";
  updateCharacterPreview();
  loadChatSessions();
  if (options.resetChat) {
    clearChat();
  }
}

function normalizeCharacter(character) {
  return {
    ...DEFAULT_CHARACTER,
    ...character,
    name: character?.name || DEFAULT_CHARACTER.name,
    first_message:
      character?.first_message || `Hello. I am ${character?.name || DEFAULT_CHARACTER.name}.`,
  };
}

function updateCharacterEditorAvatar() {
  const name = el.characterEditorName.value.trim() || "Assistant";
  renderAvatar(el.characterEditorAvatar, el.characterEditorAvatarUrl.value.trim(), name);
}

async function loadLorebooks() {
  try {
    const response = await fetch("/api/lorebooks");
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Could not load lorebooks");
    }
    state.lorebooks = data;
    const active = state.lorebooks.find((lorebook) => lorebook.active);
    if (active && !state.activeLorebook) {
      setLorebookEditor(active);
      useLorebook(active);
    } else if (!state.editingLorebookId) {
      newLorebookDraft();
    }
    renderLorebookList();
    updateLorebookStatus();
  } catch (error) {
    renderLorebookEmpty(error.message || "Could not load lorebooks.");
  }
}

function renderLorebookList() {
  el.lorebookList.innerHTML = "";
  if (!state.lorebooks.length) {
    renderLorebookEmpty("No lorebooks yet.");
    return;
  }

  state.lorebooks.forEach((lorebook) => {
    const button = document.createElement("button");
    button.className = "profile-row";
    if (state.activeLorebook?.id === lorebook.id && state.lorebookEnabled) {
      button.classList.add("active");
    }
    button.type = "button";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "WI";

    const copy = document.createElement("div");
    const name = document.createElement("div");
    name.className = "profile-name";
    name.textContent = lorebook.name;
    const meta = document.createElement("div");
    meta.className = "profile-meta";
    meta.textContent = `${lorebook.entries.length} entries - ${
      lorebook.active ? "active" : "inactive"
    }`;
    copy.append(name, meta);

    button.append(avatar, copy);
    button.addEventListener("click", () => {
      setLorebookEditor(lorebook);
      useLorebook(lorebook);
      renderLorebookList();
    });
    el.lorebookList.appendChild(button);
  });
}

function renderLorebookEmpty(message) {
  el.lorebookList.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  el.lorebookList.appendChild(empty);
}

function newLorebookDraft() {
  state.editingLorebookId = null;
  el.lorebookName.value = "Default Lorebook";
  el.lorebookActive.checked = false;
  el.loreEntryList.innerHTML = "";
  addLoreEntryRow();
  el.lorebookSaveStatus.textContent = "New lorebook draft.";
}

function setLorebookEditor(lorebook) {
  state.editingLorebookId = lorebook.id;
  el.lorebookName.value = lorebook.name || "Default Lorebook";
  el.lorebookActive.checked = Boolean(lorebook.active);
  el.loreEntryList.innerHTML = "";
  if (lorebook.entries?.length) {
    lorebook.entries.forEach((entry) => addLoreEntryRow(entry));
  } else {
    addLoreEntryRow();
  }
}

function addLoreEntryRow(entry = {}) {
  const row = document.createElement("div");
  row.className = "entry-row";
  row.dataset.entryId = entry.id || "";

  const header = document.createElement("div");
  header.className = "entry-row-header";
  const title = document.createElement("h3");
  title.textContent = "Lore Entry";

  const actions = document.createElement("div");
  actions.className = "entry-row-actions";
  const enabledLabel = document.createElement("label");
  enabledLabel.className = "toggle-row";
  const enabledInput = document.createElement("input");
  enabledInput.type = "checkbox";
  enabledInput.className = "entry-enabled";
  enabledInput.checked = entry.enabled !== false;
  const enabledText = document.createElement("span");
  enabledText.textContent = "Enabled";
  enabledLabel.append(enabledInput, enabledText);
  const removeButton = document.createElement("button");
  removeButton.className = "ghost-button";
  removeButton.type = "button";
  removeButton.textContent = "Remove";
  removeButton.addEventListener("click", () => row.remove());
  actions.append(enabledLabel, removeButton);
  header.append(title, actions);

  const keywords = document.createElement("input");
  keywords.className = "input entry-keywords";
  keywords.placeholder = "Excalibur, holy sword";
  keywords.value = (entry.keywords || []).join(", ");

  const content = document.createElement("textarea");
  content.className = "input textarea entry-content";
  content.placeholder = "A legendary blade forged in ancient times...";
  content.value = entry.content || "";

  row.append(header, labeledControl("Keywords", keywords), labeledControl("Description", content));
  el.loreEntryList.appendChild(row);
}

function labeledControl(label, control) {
  const wrapper = document.createElement("label");
  wrapper.className = "field";
  const span = document.createElement("span");
  span.textContent = label;
  wrapper.append(span, control);
  return wrapper;
}

function gatherLorebookPayload() {
  const entries = Array.from(el.loreEntryList.querySelectorAll(".entry-row")).map((row) => ({
    id: row.dataset.entryId || null,
    keywords: row
      .querySelector(".entry-keywords")
      .value.split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean),
    content: row.querySelector(".entry-content").value.trim(),
    enabled: row.querySelector(".entry-enabled").checked,
  }));

  return {
    id: state.editingLorebookId,
    name: el.lorebookName.value.trim() || "Default Lorebook",
    active: el.lorebookActive.checked,
    entries,
  };
}

async function saveLorebook() {
  const payload = gatherLorebookPayload();
  el.saveLorebook.disabled = true;
  el.lorebookSaveStatus.textContent = "Saving lorebook.";
  try {
    const response = await fetch("/api/lorebooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const saved = await response.json();
    if (!response.ok) {
      throw new Error(saved.detail || "Could not save lorebook");
    }
    setLorebookEditor(saved);
    useLorebook(saved);
    await loadLorebooks();
    el.lorebookSaveStatus.textContent = `Saved ${saved.name}.`;
  } catch (error) {
    el.lorebookSaveStatus.textContent = error.message || "Could not save lorebook.";
  } finally {
    el.saveLorebook.disabled = false;
  }
}

function useLorebookFromEditor() {
  useLorebook(gatherLorebookPayload());
  renderLorebookList();
}

function useLorebook(lorebook) {
  state.activeLorebook = lorebook.id ? lorebook : null;
  state.lorebookEnabled = Boolean(lorebook.id && el.lorebookActive.checked);
  updateLorebookStatus();
}

function updateLorebookStatus() {
  const active = state.activeLorebook && state.lorebookEnabled;
  el.activeLorebookDot.classList.toggle("loaded", Boolean(active));
  el.activeLorebookStatus.textContent = active
    ? `${state.activeLorebook.name} active`
    : "No active lorebook";
}

async function searchHfModels(event) {
  event.preventDefault();
  const repo = el.hfRepoInput.value.trim();
  if (!repo) {
    renderEmptyHfState("Enter a Hugging Face repo id like owner/model-GGUF.");
    return;
  }

  el.hfSearchButton.disabled = true;
  renderEmptyHfState("Searching Hugging Face for GGUF files.");
  try {
    const response = await fetch(`/api/models/search?repo=${encodeURIComponent(repo)}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Search failed");
    }
    renderHfResults(data.repo_id, data.files || []);
  } catch (error) {
    renderEmptyHfState(error.message || "Could not search that repository.");
  } finally {
    el.hfSearchButton.disabled = false;
  }
}

function renderHfResults(repoId, files) {
  el.hfResults.innerHTML = "";
  if (!files.length) {
    renderEmptyHfState("No .gguf files were found in this repository.");
    return;
  }

  files.forEach((file) => {
    const row = document.createElement("div");
    row.className = "market-file-row";

    const copy = document.createElement("div");
    const name = document.createElement("div");
    name.className = "market-file-name";
    name.textContent = file.filename;

    const meta = document.createElement("div");
    meta.className = "market-file-meta";
    meta.innerHTML = `<span class="badge">${escapeText(file.quantization || "GGUF")}</span>`;
    if (file.size_bytes) {
      const size = document.createElement("span");
      size.textContent = formatBytes(file.size_bytes);
      meta.appendChild(size);
    }

    const button = document.createElement("button");
    button.className = "secondary-button";
    button.type = "button";
    button.textContent = "Download";
    button.addEventListener("click", () => startModelDownload(repoId, file.filename, button));

    copy.append(name, meta);
    row.append(copy, button);
    el.hfResults.appendChild(row);
  });
}

function renderEmptyHfState(message) {
  el.hfResults.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  el.hfResults.appendChild(empty);
}

async function startModelDownload(repoId, filename, button) {
  button.disabled = true;
  showDownloadProgress({
    status: "queued",
    percent: 0,
    downloaded_bytes: 0,
    total_bytes: null,
    speed_bytes_s: 0,
    message: `Queued ${filename}`,
  });

  try {
    const response = await fetch("/api/models/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_id: repoId, filename }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Download could not start");
    }
    connectDownloadProgress(data.job_id);
  } catch (error) {
    showDownloadProgress({
      status: "error",
      percent: 0,
      downloaded_bytes: 0,
      total_bytes: null,
      speed_bytes_s: 0,
      message: error.message || "Download failed",
    });
    button.disabled = false;
  }
}

function connectDownloadProgress(jobId) {
  if (state.downloadSource) {
    state.downloadSource.close();
  }

  state.downloadSource = new EventSource(
    `/api/models/download/progress?job_id=${encodeURIComponent(jobId)}`
  );

  state.downloadSource.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    if (payload.type !== "download") {
      return;
    }
    showDownloadProgress(payload);
    if (payload.status === "completed" || payload.status === "error") {
      state.downloadSource.close();
      state.downloadSource = null;
      if (payload.status === "completed") {
        refreshModels();
      }
    }
  };

  state.downloadSource.onerror = () => {
    showDownloadProgress({
      status: "error",
      percent: 0,
      downloaded_bytes: 0,
      total_bytes: null,
      speed_bytes_s: 0,
      message: "Progress connection interrupted",
    });
    state.downloadSource.close();
    state.downloadSource = null;
  };
}

function showDownloadProgress(payload) {
  el.downloadProgressPanel.classList.remove("hidden");
  const percent = Number(payload.percent || 0);
  const visualPercent =
    payload.status === "downloading" && percent === 0 ? 6 : Math.min(percent, 100);
  const downloaded = Number(payload.downloaded_bytes || 0);
  const total = payload.total_bytes ? Number(payload.total_bytes) : null;
  const bytesLabel = total
    ? `${formatBytes(downloaded)} / ${formatBytes(total)}`
    : formatBytes(downloaded);

  el.downloadProgressFill.style.width = `${Math.max(0, visualPercent)}%`;
  el.downloadStatusText.textContent = payload.message || statusLabel(payload.status);
  el.downloadSpeedText.textContent = `${formatBytes(payload.speed_bytes_s || 0)}/s`;
  el.downloadProgressText.textContent = `${percent.toFixed(1)}% - ${bytesLabel}`;
}

function statusLabel(status) {
  if (status === "completed") {
    return "Download complete";
  }
  if (status === "error") {
    return "Download failed";
  }
  if (status === "resolving") {
    return "Resolving file metadata";
  }
  return "Downloading model";
}

async function sendMessage(event) {
  event.preventDefault();
  const content = el.messageInput.value.trim();
  if (!content || state.streaming) {
    return;
  }

  el.messageInput.value = "";
  autosizeComposer();
  appendMessage("user", content, "You");
  state.messages.push({
    role: "user",
    content,
    timestamp: new Date().toISOString(),
  });

  const assistantBubble = appendThinkingMessage(characterName());
  state.activeAssistantText = "";
  state.activeWriter = new Typewriter((text) => {
    state.activeAssistantText = text;
    assistantBubble.innerHTML = window.renderMarkdown(text);
    scrollChatToBottom();
  });

  setBusy(true);
  state.streaming = true;

  try {
    await streamAssistantResponse(buildChatPayload());
    state.activeWriter.flush();
    if (state.activeAssistantText.trim()) {
      state.messages.push({
        role: "assistant",
        content: state.activeAssistantText,
        timestamp: new Date().toISOString(),
      });
    } else if (state.thinkingActive) {
      removeThinkingIndicator();
    }
    window.setTimeout(loadChatSessions, 700);
  } catch (error) {
    cleanupThinkingIndicator();
    state.activeWriter.flush();
    assistantBubble.innerHTML = window.renderMarkdown(`**Error:** ${error.message}`);
  } finally {
    state.activeWriter = null;
    state.thinkingRow = null;
    state.thinkingBody = null;
    state.thinkingActive = false;
    state.streaming = false;
    setBusy(false);
    el.messageInput.focus();
  }
}

async function streamAssistantResponse(payload) {
  const response = await fetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok || !response.body) {
    throw new Error("Streaming request failed");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      handleStreamEvent(rawEvent);
      boundary = buffer.indexOf("\n\n");
    }
  }
}

function handleStreamEvent(rawEvent) {
  const dataLine = rawEvent
    .split("\n")
    .find((line) => line.startsWith("data:"));
  if (!dataLine) {
    return;
  }
  const payload = JSON.parse(dataLine.replace(/^data:\s*/, ""));
  if (payload.type === "meta" && payload.chat_id) {
    state.activeChatId = payload.chat_id;
  } else if (payload.type === "token") {
    handoffThinkingIndicator();
    state.activeWriter.push(payload.text);
    scrollChatToBottom();
  } else if (payload.type === "done" && payload.chat_id) {
    state.activeChatId = payload.chat_id;
  } else if (payload.type === "error") {
    cleanupThinkingIndicator();
    throw new Error(payload.message);
  }
}

function buildChatPayload() {
  const source = el.inferenceSource.value;
  const payload = {
    source,
    chat_id: state.activeChatId,
    messages: state.messages,
    system_prompt: el.systemPrompt.value,
    character_id: state.activeCharacter?.id || null,
    lorebook_id: state.activeLorebook?.id || null,
    lorebook_enabled: Boolean(state.activeLorebook?.id && state.lorebookEnabled),
    local: {
      template: el.promptTemplate.value,
    },
    temperature: Number(el.temperature.value),
    top_p: Number(el.topP.value),
    max_tokens: Number(el.maxTokens.value),
  };

  if (source === "cloud") {
    payload.cloud = {
      provider: el.cloudProvider.value,
      base_url: el.baseUrl.value,
      model: el.cloudModel.value,
      api_key: el.apiKey.value,
    };
  }

  return payload;
}

function appendMessage(role, content, name) {
  const row = document.createElement("article");
  row.className = `message-row ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  renderAvatar(
    avatar,
    role === "assistant" ? characterAvatar() : "",
    role === "assistant" ? name : "You"
  );

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const label = document.createElement("div");
  label.className = "message-name";
  label.textContent = name;

  const body = document.createElement("div");
  body.className = "message-content";
  body.innerHTML = window.renderMarkdown(content);

  bubble.append(label, body);
  row.append(avatar, bubble);
  el.chatMessages.appendChild(row);
  scrollChatToBottom();
  return body;
}

function appendThinkingMessage(name) {
  const body = appendMessage("assistant", "", name);
  body.classList.add("thinking-content", "animate-pulse");
  body.innerHTML = "";

  const label = document.createElement("span");
  label.textContent = `${name} is thinking`;

  const dots = document.createElement("span");
  dots.className = "typing-dots";
  dots.setAttribute("aria-hidden", "true");
  for (let index = 0; index < 3; index += 1) {
    dots.appendChild(document.createElement("span"));
  }

  body.append(label, dots);
  state.thinkingBody = body;
  state.thinkingRow = body.closest(".message-row");
  state.thinkingActive = true;
  scrollChatToBottom();
  return body;
}

function handoffThinkingIndicator() {
  if (!state.thinkingActive) {
    return;
  }
  cleanupThinkingIndicator();
}

function cleanupThinkingIndicator() {
  if (!state.thinkingBody) {
    return;
  }
  state.thinkingBody.classList.remove("thinking-content", "animate-pulse");
  state.thinkingBody.innerHTML = "";
  state.thinkingActive = false;
}

function removeThinkingIndicator() {
  if (state.thinkingRow?.parentElement) {
    state.thinkingRow.remove();
  }
  state.thinkingRow = null;
  state.thinkingBody = null;
  state.thinkingActive = false;
}

function clearChat() {
  state.activeChatId = null;
  el.chatHistorySelect.value = "";
  resetChatToFirstMessage();
}

function resetChatToFirstMessage() {
  state.messages = [];
  el.chatMessages.innerHTML = "";
  const content = firstMessage();
  appendMessage("assistant", content, characterName());
  state.messages.push({
    role: "assistant",
    content,
    timestamp: new Date().toISOString(),
  });
  scrollChatToBottom();
}

function updateCharacterPreview() {
  el.chatTitle.textContent = characterName();
  renderAvatar(el.characterAvatarPreview, characterAvatar(), characterName());
}

function renderAvatar(target, avatarUrl, name) {
  target.innerHTML = "";
  if (avatarUrl) {
    const img = document.createElement("img");
    img.src = avatarUrl;
    img.alt = name;
    img.onerror = () => {
      target.innerHTML = "";
      target.textContent = initials(name);
    };
    target.appendChild(img);
    return;
  }
  target.textContent = initials(name);
}

function firstMessage() {
  return state.activeCharacter?.first_message || `Hello. I am ${characterName()}.`;
}

function characterName() {
  return el.characterName.value.trim() || "Assistant";
}

function characterAvatar() {
  return el.characterAvatar.value.trim();
}

function initials(name) {
  return (name || "A")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function setBusy(busy) {
  el.sendButton.disabled = busy;
  el.loadModel.disabled = busy;
  el.unloadModel.disabled = busy;
  el.refreshModels.disabled = busy;
}

function setModelStatus(message, loaded) {
  el.modelStatus.textContent = message;
  el.activeModelDot.classList.toggle("loaded", Boolean(loaded));
}

function renderModelStatus(status) {
  if (!status?.loaded) {
    setModelStatus(status?.message || "No model loaded", false);
    return;
  }
  const filename = status.model_path.split(/[\\/]/).pop();
  setModelStatus(`${filename} loaded (${status.template})`, true);
}

function autosizeComposer() {
  el.messageInput.style.height = "auto";
  el.messageInput.style.height = `${Math.min(el.messageInput.scrollHeight, 180)}px`;
}

function scrollChatToBottom() {
  window.requestAnimationFrame(() => {
    el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
  });
}

function installAutoScrollObserver() {
  if (state.autoScrollObserver) {
    state.autoScrollObserver.disconnect();
  }
  state.autoScrollObserver = new MutationObserver(() => {
    scrollChatToBottom();
  });
  state.autoScrollObserver.observe(el.chatMessages, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

function formatBytes(bytes) {
  const numericBytes = Number(bytes || 0);
  if (!numericBytes) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = numericBytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function formatDateTime(value) {
  if (!value) {
    return "Unknown";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function slugify(value) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "chat"
  );
}

function escapeText(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

class Typewriter {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.queue = "";
    this.text = "";
    this.timer = null;
  }

  push(token) {
    this.queue += token;
    if (!this.timer) {
      this.timer = window.setInterval(() => this.tick(), 16);
    }
  }

  tick() {
    if (!this.queue.length) {
      window.clearInterval(this.timer);
      this.timer = null;
      return;
    }
    const take = Math.min(
      this.queue.length,
      Math.max(1, Math.ceil(this.queue.length / 10))
    );
    this.text += this.queue.slice(0, take);
    this.queue = this.queue.slice(take);
    this.onUpdate(this.text);
  }

  flush() {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    if (this.queue.length) {
      this.text += this.queue;
      this.queue = "";
      this.onUpdate(this.text);
    }
  }
}
