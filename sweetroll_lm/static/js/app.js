const DEFAULT_CHARACTER = {
  id: null,
  name: "Aria",
  description: "",
  personality: "",
  scenario: "",
  example_dialogue: "",
  first_message: "Welcome to SweetrollLM! Pull up a chair by the hearth and get comfortable. What kind of adventure or code are we cooking up today?",
  avatar_url: "",
  avatar_file: "",
};

const DEFAULT_PERSONA = {
  id: null,
  name: "User",
  description: "",
  avatar_url: "",
  avatar_file: "",
  is_default: false,
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
  selectedMessageIds: new Set(),
  editingMessageId: null,
  personas: [],
  activePersona: null,
  editingPersonaId: null,
  apiProviders: [],
  activeApiProviderId: null,
  editingApiProviderId: null,
  localModels: [],
  downloadedModelNames: new Set(),
  lastHfRepoId: "",
  lastHfFiles: [],
  downloadHideTimer: null,
  extensionsOpen: false,
  visionContext: "",
  visionAttachment: null,
  imageGenerating: false,
  logRefreshTimer: null,
  startupReady: false,
  setupWizardShown: false,
  setupStep: 1,
  lastDiagnosticKey: "",
};

const el = {};

document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

async function initializeApp() {
  cacheElements();
  bindEvents();
  applySavedTheme();
  pollStartupHealth();
  setChatTransparency(el.chatTransparency.value);
  setSidebarCollapsed(loadSidebarPreference(), { persist: false });
  updateInferenceVisibility();
  setCharacterEditor(DEFAULT_CHARACTER);
  setPersonaEditor(DEFAULT_PERSONA);
  applyCharacter(DEFAULT_CHARACTER, { resetChat: false });
  await Promise.all([
    loadCharacters(),
    loadPersonas(),
    loadLorebooks(),
    loadApiProviders(),
    refreshHealth(),
    refreshModels(),
  ]);
  resetChatToFirstMessage();
  installAutoScrollObserver();
  maybeShowSetupWizard();
}

function cacheElements() {
  [
    "connectionStatus",
    "startupOverlay",
    "startupStatus",
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
    "apiProviderSelect",
    "apiProviderList",
    "apiProviderName",
    "apiProviderDefault",
    "newApiProvider",
    "saveApiProvider",
    "deleteApiProvider",
    "apiProviderStatus",
    "baseUrl",
    "cloudModel",
    "apiKey",
    "appTheme",
    "temperature",
    "topP",
    "maxTokens",
    "textStreaming",
    "characterBackgrounds",
    "chatTransparency",
    "chatTransparencyValue",
    "resetSetupWizard",
    "personaSelect",
    "openPersonaRegistry",
    "characterName",
    "characterAvatar",
    "characterAvatarPreview",
    "systemPrompt",
    "activeLorebookDot",
    "activeLorebookStatus",
    "chatTitle",
    "chatSubtitle",
    "chatBackdrop",
    "chatHistorySelect",
    "exportChat",
    "deleteChat",
    "clearChat",
    "openConsoleLogs",
    "closeConsoleLogs",
    "refreshConsoleLogs",
    "consoleLogOutput",
    "consoleLogStatus",
    "setupStepBadge",
    "setupProviderSelect",
    "setupProviderType",
    "setupCloudModel",
    "setupApiKey",
    "setupSaveApi",
    "setupSkipApi",
    "setupScanModels",
    "setupOpenMarketplace",
    "setupSkipModels",
    "setupModelStatus",
    "setupPersonaName",
    "setupPersonaBio",
    "setupCreatePersona",
    "setupImportCharacter",
    "setupIdentityStatus",
    "setupBack",
    "setupNext",
    "setupFinish",
    "modelDiagnosticSubtitle",
    "modelDiagnosticMessage",
    "modelDiagnosticSolution",
    "closeModelDiagnostic",
    "diagnosticOpenMarketplace",
    "diagnosticDismiss",
    "toggleExtensions",
    "extensionsDrawer",
    "extensionStatus",
    "imageProvider",
    "imageEndpoint",
    "imageModel",
    "imageAspectRatio",
    "imageSteps",
    "imagePrompt",
    "imageNegativePrompt",
    "generateImage",
    "imageGenerationStatus",
    "visionDropzone",
    "visionImageInput",
    "visionEndpoint",
    "visionProvider",
    "visionAttachmentPreview",
    "visionCaptionStatus",
    "attachImage",
    "chatImageInput",
    "chatMessages",
    "chatForm",
    "messageInput",
    "sendButton",
    "bulkActionBar",
    "bulkSelectionCount",
    "deleteSelectedMessages",
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
    "importCharacter",
    "importCharacterFile",
    "newCharacter",
    "characterList",
    "characterEditorMode",
    "characterEditorAvatar",
    "characterEditorName",
    "characterEditorAvatarUrl",
    "characterAvatarFile",
    "characterEditorDescription",
    "characterEditorPersonality",
    "characterEditorScenario",
    "characterEditorExamples",
    "characterEditorFirstMessage",
    "saveCharacter",
    "useCharacter",
    "exportCharacter",
    "characterSaveStatus",
    "closePersonaRegistry",
    "newPersona",
    "personaList",
    "personaEditorMode",
    "personaEditorAvatar",
    "personaEditorName",
    "personaEditorAvatarUrl",
    "personaAvatarFile",
    "personaEditorDescription",
    "personaDefault",
    "savePersona",
    "usePersona",
    "personaSaveStatus",
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
  el.consoleLogsModal = document.getElementById("console-logs-modal");
  el.setupWizardModal = document.getElementById("setup-wizard-modal");
  el.modelDiagnosticModal = document.getElementById("model-diagnostic-modal");
  el.characterModal = document.getElementById("character-modal");
  el.personaModal = document.getElementById("persona-modal");
  el.lorebookModal = document.getElementById("lorebook-modal");
}

function bindEvents() {
  el.inferenceSource.addEventListener("change", updateInferenceVisibility);
  el.cloudProvider.addEventListener("change", updateCloudDefaults);
  el.apiProviderSelect.addEventListener("change", selectApiProvider);
  el.newApiProvider.addEventListener("click", newApiProviderDraft);
  el.saveApiProvider.addEventListener("click", saveApiProvider);
  el.deleteApiProvider.addEventListener("click", deleteApiProvider);
  el.refreshModels.addEventListener("click", refreshModels);
  el.loadModel.addEventListener("click", loadModel);
  el.unloadModel.addEventListener("click", unloadModel);
  el.toggleSidebar.addEventListener("click", () => {
    setSidebarCollapsed(!state.sidebarCollapsed);
  });

  el.openModelMarket.addEventListener("click", openModelMarket);
  el.closeModelMarket.addEventListener("click", () => closeModal(el.modelMarketModal));
  el.openConsoleLogs.addEventListener("click", openConsoleLogs);
  el.closeConsoleLogs.addEventListener("click", () => closeModal(el.consoleLogsModal));
  el.refreshConsoleLogs.addEventListener("click", fetchConsoleLogs);
  el.closeModelDiagnostic.addEventListener("click", () => closeModal(el.modelDiagnosticModal));
  el.diagnosticDismiss.addEventListener("click", () => closeModal(el.modelDiagnosticModal));
  el.diagnosticOpenMarketplace.addEventListener("click", () => {
    closeModal(el.modelDiagnosticModal);
    openModelMarket();
  });
  el.setupSaveApi.addEventListener("click", setupSaveApi);
  el.setupSkipApi.addEventListener("click", () => showSetupStep(2));
  el.setupScanModels.addEventListener("click", setupScanModels);
  el.setupOpenMarketplace.addEventListener("click", () => {
    openModelMarket();
    setupModelStatus("Marketplace opened. Download or select a GGUF, then return here.");
  });
  el.setupSkipModels.addEventListener("click", () => showSetupStep(3));
  el.setupCreatePersona.addEventListener("click", setupCreatePersona);
  el.setupImportCharacter.addEventListener("click", () => {
    openCharacterLibrary();
    el.importCharacterFile.click();
  });
  el.setupBack.addEventListener("click", () => showSetupStep(state.setupStep - 1));
  el.setupNext.addEventListener("click", () => showSetupStep(state.setupStep + 1));
  el.setupFinish.addEventListener("click", finishSetupWizard);
  el.openCharacterLibrary.addEventListener("click", openCharacterLibrary);
  el.editCurrentCharacter.addEventListener("click", openCharacterLibrary);
  el.closeCharacterLibrary.addEventListener("click", () => closeModal(el.characterModal));
  el.openPersonaRegistry.addEventListener("click", openPersonaRegistry);
  el.closePersonaRegistry.addEventListener("click", () => closeModal(el.personaModal));
  el.openLorebookEditor.addEventListener("click", openLorebookEditor);
  el.closeLorebookEditor.addEventListener("click", () => closeModal(el.lorebookModal));

  [el.modelMarketModal, el.consoleLogsModal, el.modelDiagnosticModal, el.characterModal, el.personaModal, el.lorebookModal].forEach((modal) => {
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
  document.querySelectorAll(".cookbook-search").forEach((button) => {
    button.addEventListener("click", () => searchCookbookModel(button.dataset.repo || ""));
  });
  el.importCharacter.addEventListener("click", () => el.importCharacterFile.click());
  el.importCharacterFile.addEventListener("change", importCharacterFile);
  el.newCharacter.addEventListener("click", () => setCharacterEditor(DEFAULT_CHARACTER));
  el.saveCharacter.addEventListener("click", saveCharacterCard);
  el.useCharacter.addEventListener("click", () => applyCharacter(editorCharacterPayload()));
  el.exportCharacter.addEventListener("click", exportCharacterCard);
  el.characterEditorName.addEventListener("input", updateCharacterEditorAvatar);
  el.characterEditorAvatarUrl.addEventListener("input", updateCharacterEditorAvatar);
  el.characterAvatarFile.addEventListener("change", handleCharacterAvatarFile);

  el.personaSelect.addEventListener("change", selectPersona);
  el.newPersona.addEventListener("click", () => setPersonaEditor(DEFAULT_PERSONA));
  el.savePersona.addEventListener("click", savePersonaCard);
  el.usePersona.addEventListener("click", () => applyPersona(editorPersonaPayload()));
  el.personaEditorName.addEventListener("input", updatePersonaEditorAvatar);
  el.personaEditorAvatarUrl.addEventListener("input", updatePersonaEditorAvatar);
  el.personaAvatarFile.addEventListener("change", handlePersonaAvatarFile);

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
  el.characterBackgrounds.addEventListener("change", updateChatBackground);
  el.appTheme.addEventListener("change", () => setAppTheme(el.appTheme.value));
  el.resetSetupWizard.addEventListener("click", () => {
    window.localStorage.removeItem("sweetroll_setup_complete");
    state.setupWizardShown = false;
    showSetupWizard();
  });
  el.chatTransparency.addEventListener("input", () => {
    setChatTransparency(el.chatTransparency.value);
  });
  el.clearChat.addEventListener("click", clearChat);
  el.exportChat.addEventListener("click", exportChatLogs);
  el.deleteChat.addEventListener("click", deleteActiveChat);
  el.deleteSelectedMessages.addEventListener("click", deleteSelectedMessages);
  el.chatHistorySelect.addEventListener("change", loadSelectedChat);
  el.toggleExtensions.addEventListener("click", toggleExtensionsDrawer);
  el.generateImage.addEventListener("click", generateImageFromExtension);
  el.attachImage.addEventListener("click", () => el.chatImageInput.click());
  el.chatImageInput.addEventListener("change", (event) => {
    handleImageAttachment(event.target.files?.[0]);
    event.target.value = "";
  });
  el.visionDropzone.addEventListener("click", () => el.visionImageInput.click());
  el.visionDropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      el.visionImageInput.click();
    }
  });
  el.visionImageInput.addEventListener("change", (event) => {
    handleImageAttachment(event.target.files?.[0]);
    event.target.value = "";
  });
  [el.chatForm, el.visionDropzone].forEach((dropTarget) => {
    dropTarget.addEventListener("dragover", (event) => {
      event.preventDefault();
      dropTarget.classList.add("drag-over");
    });
    dropTarget.addEventListener("dragleave", () => {
      dropTarget.classList.remove("drag-over");
    });
    dropTarget.addEventListener("drop", (event) => {
      event.preventDefault();
      dropTarget.classList.remove("drag-over");
      handleImageAttachment(event.dataTransfer?.files?.[0]);
    });
  });
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
    return window.localStorage.getItem("sweetroll-lm-sidebar-collapsed") === "true";
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
        "sweetroll-lm-sidebar-collapsed",
        String(state.sidebarCollapsed)
      );
    } catch {
      // Preference storage is a nicety; the live layout state is already applied.
    }
  }

  window.setTimeout(scrollChatToBottom, 240);
}

function setChatTransparency(value) {
  const numeric = Math.max(0.1, Math.min(1, Number(value) || 0.82));
  document.documentElement.style.setProperty("--chat-bubble-opacity", numeric.toFixed(2));
  el.chatTransparencyValue.textContent = `${Math.round(numeric * 100)}%`;
}

function applySavedTheme() {
  let theme = "aurora-dark";
  try {
    theme = window.localStorage.getItem("sweetroll_lm_theme") || theme;
  } catch {
    theme = "aurora-dark";
  }
  setAppTheme(theme, { persist: false });
}

function setAppTheme(theme, options = {}) {
  const normalized = theme === "sweetroll-light" ? "sweetroll-light" : "aurora-dark";
  document.documentElement.dataset.theme = normalized;
  el.appTheme.value = normalized;
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", normalized === "sweetroll-light" ? "#FFFDF9" : "#05070b");
  }
  if (options.persist !== false) {
    try {
      window.localStorage.setItem("sweetroll_lm_theme", normalized);
    } catch {
      // Theme is already applied; storage is only for the next launch.
    }
  }
}

function toggleExtensionsDrawer() {
  state.extensionsOpen = !state.extensionsOpen;
  el.extensionsDrawer.classList.toggle("hidden", !state.extensionsOpen);
  el.toggleExtensions.setAttribute("aria-expanded", String(state.extensionsOpen));
  el.toggleExtensions.classList.toggle("is-active", state.extensionsOpen);
  window.setTimeout(scrollChatToBottom, 180);
}

function openModelMarket() {
  openModal(el.modelMarketModal, el.closeModelMarket);
  refreshModels();
}

function openCharacterLibrary() {
  openModal(el.characterModal, el.closeCharacterLibrary);
  loadCharacters();
}

function openPersonaRegistry() {
  openModal(el.personaModal, el.closePersonaRegistry);
  loadPersonas();
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
  if (modal === el.consoleLogsModal) {
    stopConsoleLogPolling();
  }
}

function closeAllModals() {
  [el.modelMarketModal, el.consoleLogsModal, el.modelDiagnosticModal, el.characterModal, el.personaModal, el.lorebookModal].forEach(closeModal);
}

async function pollStartupHealth() {
  if (!el.startupOverlay) {
    return;
  }

  for (let attempt = 0; attempt < 80 && !state.startupReady; attempt += 1) {
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      if (response.ok) {
        state.startupReady = true;
        el.startupStatus.textContent = "SweetrollLM is ready.";
        window.setTimeout(hideStartupOverlay, 260);
        return;
      }
      el.startupStatus.textContent = "Waiting for the local backend...";
    } catch {
      el.startupStatus.textContent = "Waiting for the local backend...";
    }
    await sleep(220);
  }

  if (!state.startupReady) {
    el.startupStatus.textContent = "Still warming up. Check Console Logs if this persists.";
  }
}

function hideStartupOverlay() {
  el.startupOverlay.classList.add("startup-overlay-hidden");
  window.setTimeout(() => {
    el.startupOverlay.classList.add("hidden");
  }, 420);
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function openConsoleLogs() {
  openModal(el.consoleLogsModal, el.closeConsoleLogs);
  fetchConsoleLogs();
  stopConsoleLogPolling();
  state.logRefreshTimer = window.setInterval(fetchConsoleLogs, 2200);
}

function stopConsoleLogPolling() {
  if (state.logRefreshTimer) {
    window.clearInterval(state.logRefreshTimer);
    state.logRefreshTimer = null;
  }
}

async function fetchConsoleLogs() {
  try {
    const response = await fetch("/api/logs?limit=900", { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.detail || "Could not read backend logs");
    }
    el.consoleLogOutput.textContent = payload.text || "No log lines yet.";
    el.consoleLogOutput.scrollTop = el.consoleLogOutput.scrollHeight;
    el.consoleLogStatus.textContent = payload.truncated
      ? "Showing the latest log lines."
      : "Live log output is current.";
  } catch (error) {
    el.consoleLogOutput.textContent = `Log read failed: ${error.message}`;
    el.consoleLogStatus.textContent = "Could not read backend logs.";
  }
}

function setupComplete() {
  try {
    return window.localStorage.getItem("sweetroll_setup_complete") === "true";
  } catch {
    return true;
  }
}

function maybeShowSetupWizard() {
  if (!setupComplete()) {
    showSetupWizard();
  }
}

function showSetupWizard() {
  state.setupWizardShown = true;
  renderSetupProviderOptions();
  showSetupStep(1);
  openModal(el.setupWizardModal, el.setupProviderSelect);
}

function renderSetupProviderOptions() {
  el.setupProviderSelect.innerHTML = '<option value="">No saved provider</option>';
  state.apiProviders.forEach((provider) => {
    const option = document.createElement("option");
    option.value = provider.id;
    option.textContent = provider.name;
    el.setupProviderSelect.appendChild(option);
  });
}

function showSetupStep(step) {
  state.setupStep = Math.max(1, Math.min(3, Number(step) || 1));
  document.querySelectorAll(".setup-step").forEach((panel) => {
    panel.classList.toggle("active", Number(panel.dataset.setupStep) === state.setupStep);
  });
  document.querySelectorAll(".setup-dot").forEach((dot, index) => {
    dot.classList.toggle("active", index < state.setupStep);
  });
  el.setupStepBadge.textContent = `Step ${state.setupStep} of 3`;
  el.setupBack.disabled = state.setupStep === 1;
  el.setupNext.classList.toggle("hidden", state.setupStep === 3);
  el.setupFinish.classList.toggle("hidden", state.setupStep !== 3);
}

async function setupSaveApi() {
  const selectedProvider = el.setupProviderSelect.value;
  if (selectedProvider) {
    state.activeApiProviderId = selectedProvider;
    el.apiProviderSelect.value = selectedProvider;
    applyActiveApiProviderToFields();
    showSetupStep(2);
    return;
  }

  const apiKey = el.setupApiKey.value.trim();
  if (!apiKey) {
    showSetupStep(2);
    return;
  }

  const providerType = el.setupProviderType.value;
  const baseUrl =
    providerType === "openai"
      ? "https://api.openai.com/v1"
      : providerType === "openrouter"
        ? "https://openrouter.ai/api/v1"
        : el.baseUrl.value;
  try {
    const response = await fetch("/api/api-providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "First Cloud Profile",
        base_url: baseUrl,
        api_key: apiKey,
        default_model: el.setupCloudModel.value.trim() || "gpt-4o-mini",
        is_default: true,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Could not save API profile");
    }
    await loadApiProviders();
    state.activeApiProviderId = payload.id;
    showSetupStep(2);
  } catch (error) {
    setupModelStatus(`API profile skipped: ${error.message}`);
    showSetupStep(2);
  }
}

async function setupScanModels() {
  setupModelStatus("Scanning local GGUF storage...");
  await refreshModels();
  const count = state.localModels.length;
  setupModelStatus(
    count ? `Found ${count} local GGUF model${count === 1 ? "" : "s"}.` : "No GGUF models found yet."
  );
}

async function setupCreatePersona() {
  const name = el.setupPersonaName.value.trim();
  const description = el.setupPersonaBio.value.trim();
  if (!name && !description) {
    el.setupIdentityStatus.textContent = "Persona skipped. You can add one later.";
    return;
  }
  try {
    const response = await fetch("/api/personas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || "Player",
        description,
        is_default: true,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Could not save persona");
    }
    await loadPersonas();
    applyPersona(payload);
    el.setupIdentityStatus.textContent = "Persona saved and selected.";
  } catch (error) {
    el.setupIdentityStatus.textContent = error.message;
  }
}

function setupModelStatus(message) {
  el.setupModelStatus.textContent = message;
}

function finishSetupWizard() {
  try {
    window.localStorage.setItem("sweetroll_setup_complete", "true");
  } catch {
    // Failing localStorage should not block use of the app.
  }
  closeModal(el.setupWizardModal);
}

function updateInferenceVisibility() {
  const localMode = el.inferenceSource.value === "local";
  el.cloudPanel.classList.toggle("hidden", localMode);
  setCloudFieldsEnabled(!localMode);
  el.sourceBadge.textContent = localMode ? "Local" : "Cloud";
  el.sourceBadge.classList.toggle("badge-local", localMode);
  el.chatSubtitle.textContent = localMode ? "Local Engine Mode" : "Cloud API Mode";
  if (!localMode) {
    applyActiveApiProviderToFields();
  }
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

async function loadApiProviders() {
  try {
    const response = await fetch("/api/api-providers");
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Could not load API providers");
    }
    state.apiProviders = data;
    const active = defaultApiProvider() || state.apiProviders[0] || null;
    state.activeApiProviderId = active?.id || null;
    state.editingApiProviderId = active?.id || null;
    renderApiProviderSelect();
    renderApiProviderList();
    renderSetupProviderOptions();
    if (active) {
      setApiProviderEditor(active);
      applyApiProviderToFields(active);
    }
  } catch (error) {
    state.apiProviders = [];
    renderApiProviderSelect();
    renderApiProviderList();
    renderSetupProviderOptions();
    setApiProviderStatus(error.message || "Could not load API providers.");
  }
}

function renderApiProviderSelect() {
  el.apiProviderSelect.innerHTML = "";
  const manual = document.createElement("option");
  manual.value = "";
  manual.textContent = "Manual Cloud Fields";
  el.apiProviderSelect.appendChild(manual);

  state.apiProviders.forEach((provider) => {
    const option = document.createElement("option");
    option.value = provider.id;
    option.textContent = provider.is_default
      ? `${provider.name} (Default)`
      : provider.name;
    el.apiProviderSelect.appendChild(option);
  });
  el.apiProviderSelect.value = state.activeApiProviderId || "";
}

function renderApiProviderList() {
  el.apiProviderList.innerHTML = "";
  if (!state.apiProviders.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state compact-empty";
    empty.textContent = "No saved API profiles yet.";
    el.apiProviderList.appendChild(empty);
    return;
  }

  state.apiProviders.forEach((provider) => {
    const row = document.createElement("div");
    row.className = "provider-row";
    row.tabIndex = 0;
    row.setAttribute("role", "button");
    if (state.activeApiProviderId === provider.id) {
      row.classList.add("active");
    }

    const radio = document.createElement("span");
    radio.className = provider.is_default ? "provider-radio checked" : "provider-radio";

    const copy = document.createElement("span");
    copy.className = "provider-copy";
    const name = document.createElement("span");
    name.className = "provider-name";
    name.textContent = provider.name;
    const meta = document.createElement("span");
    meta.className = "provider-meta";
    meta.textContent = `${provider.default_model} - ${provider.base_url}`;
    copy.append(name, meta);

    const setDefault = document.createElement("button");
    setDefault.className = "message-action";
    setDefault.type = "button";
    setDefault.textContent = provider.is_default ? "Default" : "Make Default";
    setDefault.disabled = provider.is_default;
    setDefault.addEventListener("click", (event) => {
      event.stopPropagation();
      setDefaultApiProvider(provider);
    });

    row.append(radio, copy, setDefault);
    row.addEventListener("click", () => {
      state.activeApiProviderId = provider.id;
      state.editingApiProviderId = provider.id;
      setApiProviderEditor(provider);
      applyApiProviderToFields(provider);
      renderApiProviderSelect();
      renderApiProviderList();
    });
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        row.click();
      }
    });
    el.apiProviderList.appendChild(row);
  });
}

function selectApiProvider() {
  const provider = state.apiProviders.find((item) => item.id === el.apiProviderSelect.value);
  state.activeApiProviderId = provider?.id || null;
  state.editingApiProviderId = provider?.id || null;
  if (provider) {
    setApiProviderEditor(provider);
    applyApiProviderToFields(provider);
  }
  renderApiProviderList();
}

function newApiProviderDraft() {
  state.editingApiProviderId = null;
  el.apiProviderSelect.value = "";
  el.apiProviderName.value = "New Provider";
  el.cloudProvider.value = "custom";
  el.baseUrl.value = "http://127.0.0.1:11434/v1";
  el.cloudModel.value = "local-model";
  el.apiKey.value = "";
  el.apiProviderDefault.checked = !state.apiProviders.length;
  setApiProviderStatus("New provider draft.");
}

function setApiProviderEditor(provider) {
  state.editingApiProviderId = provider.id;
  el.apiProviderName.value = provider.name;
  el.cloudProvider.value = inferCloudProvider(provider.base_url);
  el.baseUrl.value = provider.base_url;
  el.cloudModel.value = provider.default_model;
  el.apiKey.value = provider.api_key || "";
  el.apiProviderDefault.checked = Boolean(provider.is_default);
}

function apiProviderPayload() {
  return {
    id: state.editingApiProviderId,
    name: el.apiProviderName.value.trim() || "API Provider",
    base_url: el.baseUrl.value.trim(),
    api_key: el.apiKey.value.trim(),
    default_model: el.cloudModel.value.trim() || "local-model",
    is_default: el.apiProviderDefault.checked,
  };
}

async function saveApiProvider() {
  const payload = apiProviderPayload();
  el.saveApiProvider.disabled = true;
  setApiProviderStatus("Saving provider.");
  try {
    const response = await fetch("/api/api-providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const saved = await response.json();
    if (!response.ok) {
      throw new Error(saved.detail || "Could not save provider");
    }
    state.activeApiProviderId = saved.id;
    state.editingApiProviderId = saved.id;
    await loadApiProviders();
    setApiProviderStatus(`Saved ${saved.name}.`);
  } catch (error) {
    setApiProviderStatus(error.message || "Could not save provider.");
  } finally {
    el.saveApiProvider.disabled = false;
  }
}

async function deleteApiProvider() {
  if (!state.editingApiProviderId) {
    newApiProviderDraft();
    return;
  }
  if (!window.confirm("Delete this local API provider profile?")) {
    return;
  }
  try {
    const response = await fetch(
      `/api/api-providers/${encodeURIComponent(state.editingApiProviderId)}`,
      { method: "DELETE" }
    );
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.detail || "Could not delete provider");
    }
    state.editingApiProviderId = null;
    state.activeApiProviderId = null;
    await loadApiProviders();
    setApiProviderStatus("Provider deleted.");
  } catch (error) {
    setApiProviderStatus(error.message || "Could not delete provider.");
  }
}

async function setDefaultApiProvider(provider) {
  const payload = {
    id: provider.id,
    name: provider.name,
    base_url: provider.base_url,
    api_key: provider.api_key || "",
    default_model: provider.default_model,
    is_default: true,
  };
  try {
    const response = await fetch("/api/api-providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const saved = await response.json();
    if (!response.ok) {
      throw new Error(saved.detail || "Could not set default provider");
    }
    state.activeApiProviderId = saved.id;
    await loadApiProviders();
    setApiProviderStatus(`${saved.name} is now the active default.`);
  } catch (error) {
    setApiProviderStatus(error.message || "Could not set default provider.");
  }
}

function applyActiveApiProviderToFields() {
  const provider = activeApiProvider();
  if (provider) {
    applyApiProviderToFields(provider);
  }
}

function applyApiProviderToFields(provider) {
  el.cloudProvider.value = inferCloudProvider(provider.base_url);
  el.baseUrl.value = provider.base_url;
  el.cloudModel.value = provider.default_model;
  el.apiKey.value = provider.api_key || "";
}

function activeApiProvider() {
  return (
    state.apiProviders.find((provider) => provider.id === state.activeApiProviderId) ||
    defaultApiProvider()
  );
}

function defaultApiProvider() {
  return state.apiProviders.find((provider) => provider.is_default) || null;
}

function inferCloudProvider(baseUrl) {
  const normalized = String(baseUrl || "").toLowerCase();
  if (normalized.includes("openrouter.ai")) {
    return "openrouter";
  }
  if (normalized.includes("api.openai.com")) {
    return "openai";
  }
  return "custom";
}

function setApiProviderStatus(message) {
  el.apiProviderStatus.textContent = message;
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
    state.localModels = models;
    state.downloadedModelNames = modelNameSet(models);
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
    if (state.lastHfFiles.length) {
      renderHfResults(state.lastHfRepoId, state.lastHfFiles);
    }
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

function modelNameSet(models) {
  const names = new Set();
  models.forEach((model) => {
    [model.name, model.relative_path, model.path].filter(Boolean).forEach((value) => {
      const normalized = String(value).replace(/\\/g, "/").toLowerCase();
      names.add(normalized);
      names.add(normalized.split("/").pop());
    });
  });
  return names;
}

function isModelDownloaded(filename) {
  const normalized = String(filename || "").replace(/\\/g, "/").toLowerCase();
  const basename = normalized.split("/").pop();
  return state.downloadedModelNames.has(normalized) || state.downloadedModelNames.has(basename);
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
    state.selectedMessageIds.clear();
    state.editingMessageId = null;
    renderSessionMessages();
  } catch (error) {
    console.error(error);
  }
}

async function deleteActiveChat() {
  if (!window.confirm("Delete the entire saved chat history for this conversation?")) {
    return;
  }
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
    persona_id: state.activePersona?.id || null,
    persona_name: personaName(),
    exported_at: new Date().toISOString(),
    messages: state.messages,
  };
  downloadJson(
    payload,
    `${slugify(characterName())}-${new Date()
    .toISOString()
    .slice(0, 19)
      .replace(/[:T]/g, "-")}.json`
  );
}

function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function uploadSelectedAsset(input, statusWriter) {
  const file = input.files?.[0];
  if (!file) {
    return null;
  }
  if (!["image/png", "image/jpeg"].includes(file.type)) {
    statusWriter("Only PNG and JPG avatar images are supported.");
    input.value = "";
    return null;
  }
  statusWriter(`Storing ${file.name}.`);
  const dataUrl = await readFileAsDataUrl(file);
  const response = await fetch("/api/assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, data_url: dataUrl }),
  });
  const payload = await response.json();
  if (!response.ok) {
    input.value = "";
    throw new Error(payload.detail || "Could not store avatar image");
  }
  input.value = "";
  return payload;
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Could not read file"));
    reader.readAsText(file);
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

function renderSessionMessages() {
  el.chatMessages.innerHTML = "";
  pruneSelectedMessages();
  updateBulkActionBar();
  if (!state.messages.length) {
    resetChatToFirstMessage();
    return;
  }
  state.messages.forEach((message, index) => {
    appendMessage(message, index);
  });
  scrollChatToBottom();
}

function normalizeSessionMessages(messages) {
  return messages
    .filter((message) => message.role !== "system" && message.content)
    .map((message) => ({
      id: message.id || createMessageId(),
      role: message.role,
      content: message.content,
      timestamp: message.timestamp || new Date().toISOString(),
      folded: Boolean(message.folded),
      hidden: Boolean(message.hidden),
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
      if (typeof data.detail === "object" && data.detail) {
        renderModelStatus(data.detail);
        return;
      }
      throw new Error(data.detail || "Model load failed");
    }
    renderModelStatus(data);
  } catch (error) {
    setModelStatus(error.message, false);
    showModelDiagnostic({
      error_code: "model_load_error",
      diagnostic_title: "Model Load Failed",
      diagnostic_message: error.message,
      diagnostic_solution: "Check Console Logs for details, then try a smaller model or a different quantization.",
    });
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
  el.characterEditorScenario.value = profile.scenario || "";
  el.characterEditorExamples.value = profile.example_dialogue || "";
  el.characterEditorFirstMessage.value = profile.first_message || DEFAULT_CHARACTER.first_message;
  el.characterAvatarFile.value = "";
  updateCharacterEditorAvatar();
}

function editorCharacterPayload() {
  const avatarValue = el.characterEditorAvatarUrl.value.trim();
  return {
    id: state.editingCharacterId,
    name: el.characterEditorName.value.trim() || "Assistant",
    description: el.characterEditorDescription.value.trim(),
    personality: el.characterEditorPersonality.value.trim(),
    scenario: el.characterEditorScenario.value.trim(),
    example_dialogue: el.characterEditorExamples.value.trim(),
    first_message: el.characterEditorFirstMessage.value.trim(),
    avatar_url: avatarValue.startsWith("/api/assets/") ? "" : avatarValue,
    avatar_file: avatarValue.startsWith("/api/assets/") ? avatarValue : "",
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
  updateChatBackground();
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
    description: character?.description || "",
    personality: character?.personality || "",
    scenario: character?.scenario || "",
    example_dialogue: character?.example_dialogue || "",
    first_message: character?.first_message || DEFAULT_CHARACTER.first_message,
    avatar_url: character?.avatar_url || "",
    avatar_file: character?.avatar_file || "",
  };
}

function updateCharacterEditorAvatar() {
  const name = el.characterEditorName.value.trim() || "Assistant";
  renderAvatar(el.characterEditorAvatar, el.characterEditorAvatarUrl.value.trim(), name);
}

async function importCharacterFile() {
  const file = el.importCharacterFile.files?.[0];
  if (!file) {
    return;
  }
  setCharacterSaveStatus(`Importing ${file.name}.`);
  try {
    const payload = JSON.parse(await readFileAsText(file));
    const response = await fetch("/api/characters/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const imported = await response.json();
    if (!response.ok) {
      throw new Error(imported.detail || "Could not import character");
    }
    setCharacterEditor(imported);
    applyCharacter(imported, { resetChat: false });
    await loadCharacters();
    setCharacterSaveStatus(`Imported ${imported.name}.`);
  } catch (error) {
    setCharacterSaveStatus(error.message || "Could not import character.");
  } finally {
    el.importCharacterFile.value = "";
  }
}

async function exportCharacterCard() {
  const characterId = state.editingCharacterId || state.activeCharacter?.id;
  if (!characterId) {
    downloadJson(portableCharacterPayload(editorCharacterPayload()), `${slugify(characterName())}.json`);
    return;
  }
  try {
    const response = await fetch(`/api/characters/${encodeURIComponent(characterId)}/export`);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Could not export character");
    }
    const name = payload?.data?.name || characterName();
    downloadJson(payload, `${slugify(name)}.json`);
    setCharacterSaveStatus(`Exported ${name}.`);
  } catch (error) {
    setCharacterSaveStatus(error.message || "Could not export character.");
  }
}

function portableCharacterPayload(profile) {
  return {
    spec: "chara_card_v2",
    spec_version: "2.0",
    data: {
      name: profile.name,
      description: profile.description,
      personality: profile.personality,
      scenario: profile.scenario,
      first_mes: profile.first_message,
      mes_example: profile.example_dialogue,
      avatar: profile.avatar_file || profile.avatar_url,
      creator_notes: "Exported from SweetrollLM.",
      alternate_greetings: [],
      tags: [],
      creator: "SweetrollLM",
      character_version: "1.0",
    },
  };
}

async function handleCharacterAvatarFile() {
  try {
    const asset = await uploadSelectedAsset(el.characterAvatarFile, setCharacterSaveStatus);
    if (!asset) {
      return;
    }
    el.characterEditorAvatarUrl.value = asset.url;
    updateCharacterEditorAvatar();
    setCharacterSaveStatus(`Stored avatar ${asset.filename}.`);
  } catch (error) {
    setCharacterSaveStatus(error.message || "Could not store avatar image.");
  }
}

async function loadPersonas() {
  try {
    const response = await fetch("/api/personas");
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Could not load personas");
    }
    state.personas = data;
    if (!state.activePersona && state.personas.length) {
      const defaultPersona = state.personas.find((persona) => persona.is_default);
      applyPersona(defaultPersona || state.personas[0], { renderList: false });
    }
    renderPersonaSelect();
    renderPersonaList();
  } catch (error) {
    state.personas = [];
    renderPersonaSelect();
    renderPersonaEmpty(error.message || "Could not load personas.");
  }
}

function renderPersonaSelect() {
  el.personaSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "No Persona";
  el.personaSelect.appendChild(placeholder);

  state.personas.forEach((persona) => {
    const option = document.createElement("option");
    option.value = persona.id;
    option.textContent = persona.is_default ? `${persona.name} (Default)` : persona.name;
    el.personaSelect.appendChild(option);
  });

  el.personaSelect.value = state.activePersona?.id || "";
}

function renderPersonaList() {
  el.personaList.innerHTML = "";
  if (!state.personas.length) {
    renderPersonaEmpty("No user personas yet.");
    return;
  }

  state.personas.forEach((persona) => {
    const button = document.createElement("button");
    button.className = "profile-row";
    if (state.activePersona?.id === persona.id) {
      button.classList.add("active");
    }
    button.type = "button";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    renderAvatar(avatar, persona.avatar_url || persona.avatar_file, persona.name);

    const copy = document.createElement("div");
    const name = document.createElement("div");
    name.className = "profile-name";
    name.textContent = persona.is_default ? `${persona.name}  Default` : persona.name;
    const meta = document.createElement("div");
    meta.className = "profile-meta";
    meta.textContent = persona.description || "No persona bio yet.";
    copy.append(name, meta);

    button.append(avatar, copy);
    button.addEventListener("click", () => {
      setPersonaEditor(persona);
      applyPersona(persona);
      renderPersonaList();
    });
    el.personaList.appendChild(button);
  });
}

function renderPersonaEmpty(message) {
  el.personaList.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  el.personaList.appendChild(empty);
}

function setPersonaEditor(persona) {
  const profile = normalizePersona(persona);
  state.editingPersonaId = profile.id;
  el.personaEditorMode.textContent = profile.id ? "Saved" : "Draft";
  el.personaEditorName.value = profile.name;
  el.personaEditorAvatarUrl.value = profile.avatar_url || profile.avatar_file || "";
  el.personaEditorDescription.value = profile.description || "";
  el.personaDefault.checked = Boolean(profile.is_default);
  el.personaAvatarFile.value = "";
  updatePersonaEditorAvatar();
}

function editorPersonaPayload() {
  const avatarValue = el.personaEditorAvatarUrl.value.trim();
  return {
    id: state.editingPersonaId,
    name: el.personaEditorName.value.trim() || "User",
    description: el.personaEditorDescription.value.trim(),
    avatar_url: avatarValue.startsWith("/api/assets/") ? "" : avatarValue,
    avatar_file: avatarValue.startsWith("/api/assets/") ? avatarValue : "",
    is_default: el.personaDefault.checked,
  };
}

async function savePersonaCard() {
  const payload = editorPersonaPayload();
  el.savePersona.disabled = true;
  setPersonaSaveStatus("Saving persona.");
  try {
    const response = await fetch("/api/personas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const saved = await response.json();
    if (!response.ok) {
      throw new Error(saved.detail || "Could not save persona");
    }
    setPersonaEditor(saved);
    applyPersona(saved, { renderList: false });
    await loadPersonas();
    setPersonaSaveStatus(`Saved ${saved.name}.`);
  } catch (error) {
    setPersonaSaveStatus(error.message || "Could not save persona.");
  } finally {
    el.savePersona.disabled = false;
  }
}

function applyPersona(persona, options = { renderList: true }) {
  const profile = normalizePersona(persona);
  state.activePersona = profile.id ? profile : null;
  el.personaSelect.value = profile.id || "";
  if (options.renderList !== false) {
    renderPersonaList();
  }
  if (options.renderMessages !== false && state.messages.length) {
    renderSessionMessages();
  }
}

function selectPersona() {
  const persona = state.personas.find((item) => item.id === el.personaSelect.value);
  applyPersona(persona || DEFAULT_PERSONA);
  if (persona) {
    setPersonaEditor(persona);
  }
}

function normalizePersona(persona) {
  return {
    ...DEFAULT_PERSONA,
    ...persona,
    name: persona?.name || DEFAULT_PERSONA.name,
    description: persona?.description || "",
    avatar_url: persona?.avatar_url || "",
    avatar_file: persona?.avatar_file || "",
    is_default: Boolean(persona?.is_default),
  };
}

function updatePersonaEditorAvatar() {
  const name = el.personaEditorName.value.trim() || "User";
  renderAvatar(el.personaEditorAvatar, el.personaEditorAvatarUrl.value.trim(), name);
}

async function handlePersonaAvatarFile() {
  try {
    const asset = await uploadSelectedAsset(el.personaAvatarFile, setPersonaSaveStatus);
    if (!asset) {
      return;
    }
    el.personaEditorAvatarUrl.value = asset.url;
    updatePersonaEditorAvatar();
    setPersonaSaveStatus(`Stored avatar ${asset.filename}.`);
  } catch (error) {
    setPersonaSaveStatus(error.message || "Could not store avatar image.");
  }
}

function setPersonaSaveStatus(message) {
  el.personaSaveStatus.textContent = message;
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
  await performHfSearch(repo);
}

async function searchCookbookModel(repo) {
  if (!repo) {
    return;
  }
  el.hfRepoInput.value = repo;
  await performHfSearch(repo);
}

async function performHfSearch(repo) {
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
  state.lastHfRepoId = repoId;
  state.lastHfFiles = files;
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
    button.type = "button";
    if (isModelDownloaded(file.filename)) {
      button.className = "secondary-button downloaded-button";
      button.disabled = true;
      button.textContent = "✓ Downloaded";
    } else {
      button.className = "secondary-button";
      button.textContent = "Download";
      button.addEventListener("click", () => startModelDownload(repoId, file.filename, button));
    }

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
        scheduleDownloadProgressHide();
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
  if (state.downloadHideTimer) {
    window.clearTimeout(state.downloadHideTimer);
    state.downloadHideTimer = null;
  }
  el.downloadProgressPanel.classList.remove("hidden");
  el.downloadProgressPanel.classList.remove("download-progress-closing");
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
  if (payload.status === "completed" || percent >= 100) {
    scheduleDownloadProgressHide();
  }
}

function scheduleDownloadProgressHide() {
  if (state.downloadHideTimer) {
    window.clearTimeout(state.downloadHideTimer);
  }
  state.downloadHideTimer = window.setTimeout(() => {
    el.downloadProgressPanel.classList.add("download-progress-closing");
    state.downloadHideTimer = window.setTimeout(() => {
      el.downloadProgressPanel.classList.add("hidden");
      el.downloadProgressPanel.classList.remove("download-progress-closing");
      state.downloadHideTimer = null;
    }, 260);
  }, 1400);
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

async function generateImageFromExtension() {
  const prompt = el.imagePrompt.value.trim();
  if (!prompt || state.imageGenerating) {
    el.imageGenerationStatus.textContent = prompt
      ? "Image generation is already running."
      : "Enter an image prompt first.";
    return;
  }

  state.imageGenerating = true;
  el.generateImage.disabled = true;
  el.extensionStatus.textContent = "Generating";
  el.imageGenerationStatus.textContent = "Submitting image request.";

  try {
    const response = await fetch("/api/extensions/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: el.imageProvider.value,
        endpoint: el.imageEndpoint.value.trim(),
        model: el.imageModel.value.trim(),
        prompt,
        negative_prompt: el.imageNegativePrompt.value.trim(),
        aspect_ratio: el.imageAspectRatio.value,
        steps: Number(el.imageSteps.value) || 24,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.detail || "Image generation request failed");
    }

    el.imageGenerationStatus.textContent = payload.message || "Image request completed.";
    el.extensionStatus.textContent =
      payload.status === "error" ? "Needs attention" : "Ready";

    if (payload.markdown) {
      await appendExtensionMessage(payload.markdown);
    }
  } catch (error) {
    el.extensionStatus.textContent = "Error";
    el.imageGenerationStatus.textContent = error.message;
  } finally {
    state.imageGenerating = false;
    el.generateImage.disabled = false;
  }
}

async function appendExtensionMessage(content) {
  const message = {
    id: createMessageId(),
    role: "assistant",
    content,
    timestamp: new Date().toISOString(),
    folded: false,
    hidden: false,
  };
  state.messages.push(message);
  appendMessage(message, state.messages.length - 1);
  await persistActiveChat();
}

async function handleImageAttachment(file) {
  if (!file) {
    return;
  }
  if (!file.type.startsWith("image/")) {
    el.visionCaptionStatus.textContent = "Attach a PNG, JPG, WebP, or GIF image.";
    return;
  }
  if (!state.extensionsOpen) {
    toggleExtensionsDrawer();
  }

  el.extensionStatus.textContent = "Captioning";
  el.visionCaptionStatus.textContent = `Reading ${file.name}.`;

  try {
    const dataUrl = await readFileAsDataUrl(file);
    state.visionAttachment = {
      filename: file.name,
      dataUrl,
      caption: "Captioning in progress...",
    };
    renderVisionAttachmentPreview();

    const response = await fetch("/api/extensions/vision/caption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: el.visionProvider.value,
        endpoint: el.visionEndpoint.value.trim(),
        filename: file.name,
        data_url: dataUrl,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.detail || "Vision caption request failed");
    }

    const caption = payload.caption || `The user attached ${file.name}.`;
    state.visionContext = `Attached image "${file.name}": ${caption}`;
    state.visionAttachment = {
      filename: file.name,
      dataUrl,
      caption,
      status: payload.status || "completed",
    };
    renderVisionAttachmentPreview();
    el.extensionStatus.textContent = payload.status === "error" ? "Ready" : "Ready";
    el.visionCaptionStatus.textContent =
      payload.message || "Image context is active for the next generations.";
  } catch (error) {
    state.visionContext = "";
    el.extensionStatus.textContent = "Error";
    el.visionCaptionStatus.textContent = error.message;
    renderVisionAttachmentPreview();
  }
}

function renderVisionAttachmentPreview() {
  el.visionAttachmentPreview.innerHTML = "";
  if (!state.visionAttachment) {
    el.visionAttachmentPreview.classList.add("hidden");
    return;
  }

  const image = document.createElement("img");
  image.src = state.visionAttachment.dataUrl;
  image.alt = state.visionAttachment.filename;

  const copy = document.createElement("div");
  copy.className = "attachment-copy";
  const title = document.createElement("strong");
  title.textContent = state.visionAttachment.filename;
  const caption = document.createElement("p");
  caption.textContent = state.visionAttachment.caption || "No caption yet.";
  copy.append(title, caption);

  const clear = document.createElement("button");
  clear.className = "message-action";
  clear.type = "button";
  clear.textContent = "Clear";
  clear.addEventListener("click", clearVisionContext);

  el.visionAttachmentPreview.append(image, copy, clear);
  el.visionAttachmentPreview.classList.remove("hidden");
}

function clearVisionContext() {
  state.visionContext = "";
  state.visionAttachment = null;
  renderVisionAttachmentPreview();
  el.visionCaptionStatus.textContent = "Visual context cleared.";
}

async function sendMessage(event) {
  event.preventDefault();
  const content = el.messageInput.value.trim();
  if (!content || state.streaming) {
    return;
  }

  el.messageInput.value = "";
  autosizeComposer();
  const userMessage = {
    id: createMessageId(),
    role: "user",
    content,
    timestamp: new Date().toISOString(),
    folded: false,
    hidden: false,
  };
  state.messages.push(userMessage);
  appendMessage(userMessage, state.messages.length - 1);

  const assistantBubble = appendThinkingMessage(characterName());
  state.activeAssistantText = "";
  state.activeWriter = null;

  setBusy(true);
  state.streaming = true;

  try {
    if (el.textStreaming.checked) {
      state.activeWriter = new Typewriter((text) => {
        state.activeAssistantText = text;
        assistantBubble.innerHTML = window.renderMarkdown(text);
        scrollChatToBottom();
      });
      await streamAssistantResponse(buildChatPayload());
      state.activeWriter.flush();
    } else {
      const result = await completeAssistantResponse(buildChatPayload());
      state.activeChatId = result.chat_id || state.activeChatId;
      state.activeAssistantText = result.text || "";
      cleanupThinkingIndicator();
      assistantBubble.innerHTML = window.renderMarkdown(state.activeAssistantText);
      scrollChatToBottom();
    }

    const assistantText = state.activeAssistantText.trim();
    if (assistantText) {
      state.messages.push({
        id: createMessageId(),
        role: "assistant",
        content: assistantText,
        timestamp: new Date().toISOString(),
        folded: false,
        hidden: false,
      });
      renderSessionMessages();
    } else if (state.thinkingActive) {
      removeThinkingIndicator();
    }
    window.setTimeout(loadChatSessions, 700);
  } catch (error) {
    cleanupThinkingIndicator();
    if (state.activeWriter) {
      state.activeWriter.flush();
    }
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

async function completeAssistantResponse(payload) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Chat request failed");
  }
  return data;
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
    messages: serializeMessagesForBackend(state.messages),
    system_prompt: el.systemPrompt.value,
    character_id: state.activeCharacter?.id || null,
    persona_id: state.activePersona?.id || null,
    lorebook_id: state.activeLorebook?.id || null,
    lorebook_enabled: Boolean(state.activeLorebook?.id && state.lorebookEnabled),
    vision_context: state.visionContext || "",
    local: {
      template: el.promptTemplate.value,
    },
    temperature: Number(el.temperature.value),
    top_p: Number(el.topP.value),
    max_tokens: Number(el.maxTokens.value),
  };

  if (source === "cloud") {
    const provider = activeApiProvider();
    payload.cloud = {
      provider: provider ? inferCloudProvider(provider.base_url) : el.cloudProvider.value,
      base_url: provider?.base_url || el.baseUrl.value,
      model: provider?.default_model || el.cloudModel.value,
      api_key: provider?.api_key || el.apiKey.value,
    };
  }

  return payload;
}

function appendMessage(message, index) {
  const normalized = ensureClientMessage(message);
  const role = normalized.role;
  const name = role === "user" ? personaName() : characterName();
  const row = document.createElement("article");
  row.className = `message-row ${role}`;
  row.dataset.messageId = normalized.id;
  row.classList.toggle("message-collapsed", Boolean(normalized.folded));
  row.classList.toggle("message-hidden", Boolean(normalized.hidden));

  const selector = document.createElement("input");
  selector.className = "message-select";
  selector.type = "checkbox";
  selector.title = "Select message";
  selector.checked = state.selectedMessageIds.has(normalized.id);
  selector.addEventListener("change", () => {
    toggleMessageSelection(normalized.id, selector.checked);
  });

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  renderAvatar(
    avatar,
    role === "assistant" ? characterAvatar() : personaAvatar(),
    role === "assistant" ? name : personaName()
  );

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const label = document.createElement("div");
  label.className = "message-name";
  const labelText = document.createElement("span");
  labelText.textContent = name;
  label.append(labelText, createMessageToolbar(normalized, index));

  const body = document.createElement("div");
  body.className = "message-content";
  if (state.editingMessageId === normalized.id) {
    renderMessageEditor(body, normalized);
  } else if (normalized.hidden) {
    body.textContent = "Message hidden";
  } else {
    body.innerHTML = window.renderMarkdown(normalized.content);
  }

  bubble.append(label, body);
  row.append(selector, avatar, bubble);
  el.chatMessages.appendChild(row);
  scrollChatToBottom();
  return body;
}

function createMessageToolbar(message, index) {
  const toolbar = document.createElement("div");
  toolbar.className = "message-toolbar";

  toolbar.append(
    messageActionButton("Edit", () => startMessageEdit(message.id)),
    messageActionButton("Copy", () => copyMessageText(message.content)),
    messageActionButton(message.folded ? "Expand" : "Fold", () =>
      toggleMessageFold(message.id)
    ),
    messageActionButton(message.hidden ? "Unhide" : "Hide", () =>
      toggleMessageHidden(message.id)
    )
  );
  return toolbar;
}

function messageActionButton(label, handler) {
  const button = document.createElement("button");
  button.className = "message-action";
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", handler);
  return button;
}

function renderMessageEditor(body, message) {
  const textarea = document.createElement("textarea");
  textarea.className = "input textarea message-edit-textarea";
  textarea.value = message.content;

  const actions = document.createElement("div");
  actions.className = "message-edit-actions";
  const cancel = document.createElement("button");
  cancel.className = "secondary-button";
  cancel.type = "button";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", () => {
    state.editingMessageId = null;
    renderSessionMessages();
  });

  const save = document.createElement("button");
  save.className = "primary-button";
  save.type = "button";
  save.textContent = "Save";
  save.addEventListener("click", () => saveMessageEdit(message.id, textarea.value));

  actions.append(cancel, save);
  body.append(textarea, actions);
  window.setTimeout(() => {
    textarea.focus();
    textarea.selectionStart = textarea.value.length;
    textarea.selectionEnd = textarea.value.length;
  }, 0);
}

function startMessageEdit(messageId) {
  state.editingMessageId = messageId;
  renderSessionMessages();
}

async function saveMessageEdit(messageId, value) {
  const message = findMessage(messageId);
  const content = value.trim();
  if (!message || !content) {
    return;
  }
  message.content = content;
  message.timestamp = new Date().toISOString();
  state.editingMessageId = null;
  renderSessionMessages();
  await persistActiveChat();
}

async function copyMessageText(content) {
  try {
    await navigator.clipboard.writeText(content);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = content;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

function toggleMessageFold(messageId) {
  const message = findMessage(messageId);
  if (!message) {
    return;
  }
  message.folded = !message.folded;
  renderSessionMessages();
}

function toggleMessageHidden(messageId) {
  const message = findMessage(messageId);
  if (!message) {
    return;
  }
  message.hidden = !message.hidden;
  renderSessionMessages();
}

function toggleMessageSelection(messageId, selected) {
  if (selected) {
    state.selectedMessageIds.add(messageId);
  } else {
    state.selectedMessageIds.delete(messageId);
  }
  updateBulkActionBar();
}

function updateBulkActionBar() {
  pruneSelectedMessages();
  const count = state.selectedMessageIds.size;
  el.bulkActionBar.classList.toggle("hidden", count === 0);
  el.bulkSelectionCount.textContent = `${count} selected`;
}

function pruneSelectedMessages() {
  const liveIds = new Set(state.messages.map((message) => message.id));
  Array.from(state.selectedMessageIds).forEach((messageId) => {
    if (!liveIds.has(messageId)) {
      state.selectedMessageIds.delete(messageId);
    }
  });
}

async function deleteSelectedMessages() {
  if (!state.selectedMessageIds.size) {
    return;
  }
  const selected = new Set(state.selectedMessageIds);
  state.messages = state.messages.filter((message) => !selected.has(message.id));
  state.selectedMessageIds.clear();
  state.editingMessageId = null;
  if (!state.messages.length) {
    resetChatToFirstMessage();
  } else {
    renderSessionMessages();
  }
  await persistActiveChat();
}

async function persistActiveChat() {
  try {
    const response = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: state.activeChatId,
        character_id: state.activeCharacter?.id || null,
        messages: serializeMessagesForBackend(state.messages),
      }),
    });
    const saved = await response.json();
    if (!response.ok) {
      throw new Error(saved.detail || "Could not save chat");
    }
    state.activeChatId = saved.id;
    window.setTimeout(loadChatSessions, 250);
    return saved;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function serializeMessagesForBackend(messages) {
  return messages
    .filter((message) => message.role && message.content?.trim())
    .map((message) => ({
      role: message.role,
      content: message.content,
      timestamp: message.timestamp || new Date().toISOString(),
    }));
}

function findMessage(messageId) {
  return state.messages.find((message) => message.id === messageId);
}

function ensureClientMessage(message) {
  if (!message.id) {
    message.id = createMessageId();
  }
  if (!message.timestamp) {
    message.timestamp = new Date().toISOString();
  }
  message.folded = Boolean(message.folded);
  message.hidden = Boolean(message.hidden);
  return message;
}

function createMessageId() {
  if (window.crypto?.randomUUID) {
    return `msg-${window.crypto.randomUUID()}`;
  }
  return `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function appendThinkingMessage(name) {
  const row = document.createElement("article");
  row.className = "message-row assistant";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  renderAvatar(avatar, characterAvatar(), name);

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const header = document.createElement("div");
  header.className = "message-name";
  const labelText = document.createElement("span");
  labelText.textContent = name;
  header.appendChild(labelText);

  const body = document.createElement("div");
  body.className = "message-content";
  body.classList.add("thinking-content", "animate-pulse");
  body.innerHTML = "";

  const thinkingLabel = document.createElement("span");
  thinkingLabel.textContent = `${name} is thinking`;

  const dots = document.createElement("span");
  dots.className = "typing-dots";
  dots.setAttribute("aria-hidden", "true");
  for (let index = 0; index < 3; index += 1) {
    dots.appendChild(document.createElement("span"));
  }

  body.append(thinkingLabel, dots);
  bubble.append(header, body);
  row.append(avatar, bubble);
  el.chatMessages.appendChild(row);
  state.thinkingBody = body;
  state.thinkingRow = row;
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
  state.selectedMessageIds.clear();
  state.editingMessageId = null;
  resetChatToFirstMessage();
}

function resetChatToFirstMessage() {
  state.messages = [];
  el.chatMessages.innerHTML = "";
  state.selectedMessageIds.clear();
  state.editingMessageId = null;
  updateBulkActionBar();
  const content = firstMessage();
  const first = {
    id: createMessageId(),
    role: "assistant",
    content,
    timestamp: new Date().toISOString(),
    folded: false,
    hidden: false,
  };
  state.messages.push(first);
  appendMessage(first, 0);
  scrollChatToBottom();
}

function updateCharacterPreview() {
  el.chatTitle.textContent = characterName();
  renderAvatar(el.characterAvatarPreview, characterAvatar(), characterName());
  updateChatBackground();
}

function updateChatBackground() {
  const enabled = el.characterBackgrounds?.checked;
  const avatar = characterAvatar();
  if (!enabled || !avatar) {
    el.chatBackdrop.classList.remove("active");
    el.chatBackdrop.style.backgroundImage = "";
    return;
  }
  el.chatBackdrop.style.backgroundImage = `url("${avatar.replace(/"/g, '\\"')}")`;
  el.chatBackdrop.classList.add("active");
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
  return state.activeCharacter?.first_message || DEFAULT_CHARACTER.first_message;
}

function characterName() {
  return el.characterName.value.trim() || "Assistant";
}

function characterAvatar() {
  return el.characterAvatar.value.trim();
}

function personaName() {
  return state.activePersona?.name || "You";
}

function personaAvatar() {
  return state.activePersona?.avatar_file || state.activePersona?.avatar_url || "";
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
    if (status?.status === "error" || status?.error_code) {
      showModelDiagnostic(status);
    }
    return;
  }
  const filename = status.model_path.split(/[\\/]/).pop();
  setModelStatus(`${filename} loaded (${status.template})`, true);
}

function showModelDiagnostic(status) {
  const title = status.diagnostic_title || "Model Load Diagnostic";
  const message =
    status.diagnostic_message || status.message || "SweetrollLM caught a local model loading failure.";
  const solution =
    status.diagnostic_solution ||
    "Check Console Logs for details, then try a smaller model or a different quantization.";
  const key = `${status.error_code || title}:${message}:${solution}`;
  if (state.lastDiagnosticKey === key) {
    return;
  }
  state.lastDiagnosticKey = key;
  el.modelDiagnosticSubtitle.textContent = title;
  el.modelDiagnosticMessage.textContent = message;
  el.modelDiagnosticSolution.textContent = solution;
  openModal(el.modelDiagnosticModal, el.closeModelDiagnostic);
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
