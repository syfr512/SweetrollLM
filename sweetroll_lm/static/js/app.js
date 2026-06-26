const DEFAULT_CHARACTER = {
  id: null,
  name: "",
  description: "",
  personality: "",
  scenario: "",
  example_dialogue: "",
  first_message: "Welcome to SweetrollLM! Pull up a chair by the hearth and get comfortable. What kind of adventure or code are we cooking up today?",
  avatar_url: "",
  avatar_file: "",
  chat_background_url: "",
  chat_background_file: "",
  chat_backdrop_enabled: true,
};

const DEFAULT_PERSONA = {
  id: null,
  name: "User",
  description: "",
  avatar_url: "",
  avatar_file: "",
  is_default: false,
};

const CUSTOM_MODEL_VALUE = "__custom__";

const CLOUD_MODEL_CATALOG = {
  openrouter: [
    "openai/gpt-4o",
    "deepseek/deepseek-chat",
    "deepseek/deepseek-r1",
    "anthropic/claude-3.5-sonnet",
    "anthropic/claude-3.5-haiku",
    "anthropic/claude-3-opus",
    "google/gemini-2.5-pro",
    "google/gemini-2.5-flash",
    "google/gemini-2.0-flash-001",
    "google/gemini-flash-1.5",
    "google/gemini-pro-1.5",
    "x-ai/grok-3",
    "x-ai/grok-3-mini",
    "meta-llama/llama-3.3-70b-instruct",
    "meta-llama/llama-3-70b-instruct",
    "meta-llama/llama-3-8b-instruct",
    "meta-llama/llama-3.1-8b-instruct",
    "meta-llama/llama-3.1-70b-instruct",
    "meta-llama/llama-3.1-405b-instruct",
    "meta-llama/llama-3.2-3b-instruct:free",
    "meta-llama/llama-3.2-11b-vision-instruct",
    "meta-llama/llama-3.2-90b-vision-instruct",
    "qwen/qwen-2.5-vl-72b-instruct",
    "qwen/qwen-2.5-vl-32b-instruct",
    "qwen/qwen-2.5-vl-7b-instruct",
    "google/gemma-3-27b-it",
    "google/gemma-3-12b-it",
    "google/gemma-3-4b-it",
    "qwen/qwen3-235b-a22b",
    "qwen/qwen3-32b",
    "qwen/qwen3-14b",
    "qwen/qwen-2.5-7b-instruct",
    "qwen/qwen-2.5-14b-instruct",
    "qwen/qwen-2.5-32b-instruct",
    "qwen/qwen-2.5-72b-instruct",
    "qwen/qwen-2.5-coder-32b-instruct",
    "mistralai/mistral-large",
    "mistralai/mistral-medium",
    "mistralai/mistral-small-3.1-24b-instruct",
    "mistralai/mistral-7b-instruct",
    "mistralai/mistral-nemo",
    "mistralai/pixtral-12b",
    "mistralai/pixtral-large",
    "moonshotai/kimi-k2",
    "perplexity/sonar",
    "perplexity/sonar-pro",
    "nousresearch/hermes-3-llama-3.1-405b",
    "nousresearch/hermes-3-llama-3.1-70b",
    "gryphe/mythomax-l2-13b",
    "cohere/command-r-plus",
    "cohere/command-r",
    "openai/gpt-4o-mini",
    "openai/gpt-4.1-mini",
    "openai/o4-mini",
    "openai/o3-mini",
    "openai/gpt-image-1",
    "black-forest-labs/flux-1.1-pro",
    "black-forest-labs/flux-dev",
    "stability-ai/sdxl",
  ],
  openai: [
    "gpt-4o-mini",
    "gpt-4o",
    "gpt-4.1-mini",
    "gpt-4.1",
    "gpt-4.1-nano",
    "gpt-4.5-preview",
    "o4-mini",
    "o3-mini",
    "o3",
    "gpt-4-turbo",
    "gpt-image-1",
    "dall-e-3",
    "dall-e-2",
  ],
  ollama: [
    "llama3.2:1b",
    "llama3.2:3b",
    "llama3.1:8b",
    "qwen2.5:0.5b",
    "qwen2.5:1.5b",
    "qwen2.5:3b",
    "qwen2.5:7b",
    "mistral:7b",
    "gemma3:1b",
    "gemma3:4b",
    "phi4-mini",
    "llava",
    "moondream",
  ],
  custom: [
    "koboldcpp",
    "llama3",
    "llama3.1",
    "llama3.2",
    "mistral",
    "mistral-nemo",
    "qwen2.5",
    "qwen3",
    "deepseek-r1",
    "gemma3",
    "phi4",
  ],
};

const VISION_MODEL_CATALOG = {
  openrouter: [
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
    "openai/gpt-4.1",
    "openai/gpt-4.1-mini",
    "google/gemini-2.5-pro",
    "google/gemini-2.5-flash",
    "google/gemini-2.0-flash-001",
    "anthropic/claude-3.5-sonnet",
    "anthropic/claude-3.5-haiku",
    "qwen/qwen-2.5-vl-72b-instruct",
    "qwen/qwen-2.5-vl-32b-instruct",
    "qwen/qwen-2.5-vl-7b-instruct",
    "meta-llama/llama-3.2-90b-vision-instruct",
    "meta-llama/llama-3.2-11b-vision-instruct",
    "mistralai/pixtral-12b",
    "google/gemma-3-27b-it",
    "google/gemma-3-12b-it",
  ],
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1", "o4-mini"],
  google: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
  ollama: ["llava", "llava:13b", "llava:34b", "bakllava", "moondream", "qwen2.5vl:7b", "qwen2.5vl:32b"],
  llava: ["llava", "llava-v1.6", "llava-next", "llava:13b", "llava:34b", "bakllava"],
  "qwen-vl": ["qwen2.5-vl-7b-instruct", "qwen2.5-vl-32b-instruct", "qwen2.5-vl-72b-instruct", "qwen-vl-plus", "qwen-vl-max"],
  custom: ["gpt-4o", "gemini-2.5-flash", "qwen2.5-vl-7b-instruct", "llava", "vision-model"],
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
  chatSettings: {
    persona_id: null,
    lorebook_id: null,
    lorebook_enabled: null,
    chat_summary: "",
    auto_summary_enabled: false,
    summary_message_count: 10,
  },
  autoScrollObserver: null,
  characters: [],
  activeCharacter: null,
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
  ollama: {
    running: false,
    base_url: "http://127.0.0.1:11434",
    openai_base_url: "http://127.0.0.1:11434/v1",
    models: [],
    message: "",
  },
  ollamaSelectedModel: "",
  ollamaPullSource: null,
  appSettings: {
    global_background_path: "",
    chat_bubble_opacity: 0.82,
    background_image_opacity: 0.9,
    updated_at: "",
  },
  appSettingsSaveTimer: null,
  backgroundRevision: 0,
  localModels: [],
  downloadedModelNames: new Set(),
  lastHfRepoId: "",
  lastHfFiles: [],
  downloadHideTimer: null,
  extensionsOpen: false,
  visionContext: "",
  visionAttachment: null,
  chatPendingImage: null,
  workspacePendingImage: null,
  imageGenerating: false,
  logRefreshTimer: null,
  startupReady: false,
  setupWizardShown: false,
  setupStep: 1,
  lastDiagnosticKey: "",
  setupSelectedModelPath: "",
  validatedApiProviderKey: "",
  pendingNewChat: false,
  workspaceTree: [],
  workspaceSelectedPath: "",
  workspaceSelectedKind: "",
  workspaceChats: [],
  workspaceChatId: null,
  workspaceMessages: [],
  workspacePendingTask: null,
  workspacePendingContext: [],
  workspaceRunning: false,
  workspaceDrag: null,
  workspaceOffset: { x: 0, y: 0 },
  workspaceEmailPresets: {},
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
  setChatTransparency(el.chatTransparency.value, { persist: false });
  setBackgroundImageOpacity(el.backgroundOpacitySlider.value, { persist: false });
  setSidebarCollapsed(loadSidebarPreference(), { persist: false });
  setSidebarMode("chat");
  renderCloudModelControl();
  renderVisionModelControl();
  loadExtensionConfig();
  updateInferenceVisibility();
  setCharacterEditor(DEFAULT_CHARACTER);
  setPersonaEditor(DEFAULT_PERSONA);
  await Promise.all([
    loadCharacters(),
    loadPersonas(),
    loadLorebooks(),
    loadApiProviders(),
    loadOllamaStatus({ quiet: true }),
    loadAppSettings(),
    refreshHealth(),
    refreshModels(),
  ]);
  renderNoCharacterPlaceholder();
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
    "sidebarLocalModelPanel",
    "sidebarRefreshModels",
    "sidebarLocalModelPath",
    "sidebarLoadModel",
    "sidebarUnloadModel",
    "sidebarActiveModelDot",
    "sidebarModelStatus",
    "sidebarModelInlineError",
    "sidebarOllamaPanel",
    "sidebarRefreshOllama",
    "sidebarOllamaDot",
    "sidebarOllamaStatusText",
    "sidebarOllamaModelSelect",
    "sidebarOllamaCapabilityBadges",
    "sidebarOllamaModelMeta",
    "sidebarUseOllamaLocal",
    "sidebarOpenOllamaCloudPanel",
    "sidebarOllamaInlineStatus",
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
    "apiProviderFallback",
    "newApiProvider",
    "testApiProvider",
    "saveApiProvider",
    "deleteApiProvider",
    "apiProviderStatus",
    "ollamaStatusText",
    "ollamaStatusBadge",
    "ollamaModelSelect",
    "ollamaCapabilityBadges",
    "ollamaModelMeta",
    "ollamaPullProgress",
    "ollamaPullProgressBar",
    "ollamaPullProgressText",
    "ollamaPullModel",
    "refreshOllama",
    "pullOllamaModel",
    "useOllamaProvider",
    "ollamaInlineStatus",
    "baseUrl",
    "cloudModelSelect",
    "cloudModel",
    "apiKey",
    "appTheme",
    "selectGlobalBackground",
    "globalBgFileInput",
    "clearGlobalBackground",
    "globalBackgroundStatus",
    "temperature",
    "topP",
    "maxTokens",
    "textStreaming",
    "characterBackgrounds",
    "chatTransparency",
    "chatTransparencyValue",
    "backgroundOpacitySlider",
    "backgroundOpacityValue",
    "resetSetupWizard",
    "personaSelect",
    "openPersonaRegistry",
    "characterName",
    "characterAvatar",
    "characterAvatarPreview",
    "sidebarCharacterList",
    "chatHistoryShelf",
    "toggleHistoryShelf",
    "newChatSidebar",
    "systemPrompt",
    "activeLorebookDot",
    "activeLorebookStatus",
    "chatTitle",
    "chatSubtitle",
    "quickInferenceSource",
    "quickApiProvider",
    "quickModelLabel",
    "chatMain",
    "chatBackdrop",
    "chatHistorySelect",
    "openChatSettings",
    "closeChatSettings",
    "chatPersonaSelect",
    "chatLorebookSelect",
    "chatLorebookEnabled",
    "chatSummaryText",
    "chatAutoSummaryEnabled",
    "chatSummaryCount",
    "autoSummarizeChat",
    "chatGalleryGrid",
    "chatGalleryCount",
    "saveChatSettings",
    "clearChatSettings",
    "chatSettingsStatus",
    "exportChat",
    "deleteChat",
    "clearChat",
    "newChat",
    "openWorkspace",
    "workspaceWindow",
    "workspaceDragHandle",
    "toggleWorkspaceFiles",
    "toggleWorkspaceConfig",
    "workspaceRefresh",
    "closeWorkspace",
    "workspaceNewFolder",
    "workspaceDeletePath",
    "workspaceEditMetadata",
    "workspaceTree",
    "workspacePathStatus",
    "workspaceNewChat",
    "workspaceClearChat",
    "workspaceContextFlush",
    "workspaceChatList",
    "workspaceChatLog",
    "workspaceExecutionLog",
    "workspaceForm",
    "workspacePrompt",
    "workspaceAttachImage",
    "workspaceImageInput",
    "workspaceAttachmentPreview",
    "workspaceSend",
    "workspaceStop",
    "workspaceAgentCharacter",
    "workspaceAgentCharacterField",
    "workspaceAgentBase",
    "workspaceControlLevel",
    "workspaceModeBadge",
    "workspaceEmailProvider",
    "workspaceSmtpServer",
    "workspaceSmtpPort",
    "workspaceSmtpEmail",
    "workspaceSmtpPassword",
    "workspaceSaveEmailSettings",
    "workspaceTestEmailSettings",
    "workspaceEmailStatus",
    "openConsoleLogs",
    "closeConsoleLogs",
    "refreshConsoleLogs",
    "consoleLogOutput",
    "consoleLogStatus",
    "setupStepBadge",
    "setupProviderSelect",
    "setupProviderType",
    "setupCloudModelSelect",
    "setupCustomModel",
    "setupApiKey",
    "setupTestApi",
    "setupSaveApi",
    "setupSkipApi",
    "setupScanModels",
    "setupOpenMarketplace",
    "setupSkipModels",
    "setupModelList",
    "setupLoadModel",
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
    "imageApiProvider",
    "imageEndpoint",
    "imageModel",
    "imageAspectRatio",
    "imageSteps",
    "imagePrompt",
    "imageNegativePrompt",
    "saveImageConfig",
    "generateImage",
    "imageGenerationStatus",
    "visionEndpoint",
    "visionProvider",
    "visionApiProvider",
    "visionModelSelect",
    "visionModel",
    "visionPrompt",
    "saveVisionConfig",
    "visionCaptionStatus",
    "attachImage",
    "quickGenerateImage",
    "chatImageInput",
    "chatAttachmentPreview",
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
    "characterEditorBackdrop",
    "characterEditorBackgroundUrl",
    "characterBackgroundFile",
    "characterEditorDescription",
    "characterEditorPersonality",
    "characterEditorScenario",
    "characterEditorExamples",
    "characterEditorFirstMessage",
    "saveCharacter",
    "useCharacter",
    "exportCharacter",
    "deleteCharacter",
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
    "deletePersona",
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
    "deleteLorebook",
    "lorebookSaveStatus",
  ].forEach((id) => {
    el[id] = document.getElementById(id);
  });
  el.modelMarketModal = document.getElementById("model-market-modal");
  el.workspaceModal = document.getElementById("workspace-modal");
  el.consoleLogsModal = document.getElementById("console-logs-modal");
  el.chatSettingsModal = document.getElementById("chat-settings-modal");
  el.setupWizardModal = document.getElementById("setup-wizard-modal");
  el.modelDiagnosticModal = document.getElementById("model-diagnostic-modal");
  el.characterModal = document.getElementById("character-modal");
  el.personaModal = document.getElementById("persona-modal");
  el.lorebookModal = document.getElementById("lorebook-modal");
  el.newChatModal = document.getElementById("new-chat-modal");
  el.confirmNewChat = document.getElementById("confirmNewChat");
  el.cancelNewChat = document.getElementById("cancelNewChat");
  el.cancelNewChatSecondary = document.getElementById("cancelNewChatSecondary");
}

function bindEvents() {
  bindSidebarAccordions();
  bindSideMenu();
  el.inferenceSource.addEventListener("change", updateInferenceVisibility);
  el.quickInferenceSource.addEventListener("change", () => {
    el.inferenceSource.value = el.quickInferenceSource.value;
    updateInferenceVisibility();
  });
  el.quickApiProvider.addEventListener("change", () => {
    state.activeApiProviderId = el.quickApiProvider.value || null;
    state.editingApiProviderId = state.activeApiProviderId;
    if (state.activeApiProviderId) {
      const provider = state.apiProviders.find((item) => item.id === state.activeApiProviderId);
      if (provider) {
        setApiProviderEditor(provider);
        applyApiProviderToFields(provider);
      }
    }
    renderApiProviderSelect();
    renderApiProviderList();
    syncQuickModelControls();
  });
  el.cloudProvider.addEventListener("change", updateCloudDefaults);
  el.cloudModelSelect.addEventListener("change", () => {
    handleModelSelectChange(el.cloudModelSelect, el.cloudModel);
    state.validatedApiProviderKey = "";
  });
  [el.baseUrl, el.cloudModel, el.apiKey, el.apiProviderName].forEach((field) => {
    field.addEventListener("input", () => {
      state.validatedApiProviderKey = "";
    });
  });
  el.apiProviderSelect.addEventListener("change", selectApiProvider);
  el.newApiProvider.addEventListener("click", newApiProviderDraft);
  el.testApiProvider.addEventListener("click", testApiProvider);
  el.saveApiProvider.addEventListener("click", saveApiProvider);
  el.deleteApiProvider.addEventListener("click", deleteApiProvider);
  el.refreshOllama.addEventListener("click", () => loadOllamaStatus());
  el.ollamaModelSelect.addEventListener("change", () => {
    setOllamaSelectedModel(el.ollamaModelSelect.value, { loadDetail: true });
  });
  el.sidebarRefreshOllama.addEventListener("click", () => loadOllamaStatus());
  el.sidebarOllamaModelSelect.addEventListener("change", () => {
    setOllamaSelectedModel(el.sidebarOllamaModelSelect.value, { loadDetail: true });
  });
  el.sidebarUseOllamaLocal.addEventListener("click", useOllamaLocalRuntime);
  el.sidebarOpenOllamaCloudPanel.addEventListener("click", () => {
    el.inferenceSource.value = "cloud";
    updateInferenceVisibility();
    el.cloudProvider.value = "ollama";
    updateCloudDefaults();
  });
  el.pullOllamaModel.addEventListener("click", pullOllamaModel);
  el.useOllamaProvider.addEventListener("click", useOllamaProvider);
  el.refreshModels.addEventListener("click", refreshModels);
  el.loadModel.addEventListener("click", loadModel);
  el.unloadModel.addEventListener("click", unloadModel);
  el.sidebarRefreshModels.addEventListener("click", refreshModels);
  el.sidebarLoadModel.addEventListener("click", () => loadModelFromSidebar());
  el.sidebarUnloadModel.addEventListener("click", unloadModel);
  el.sidebarLocalModelPath.addEventListener("change", () => {
    el.localModelPath.value = el.sidebarLocalModelPath.value;
    setSidebarModelError("");
  });
  el.localModelPath.addEventListener("change", () => {
    el.sidebarLocalModelPath.value = el.localModelPath.value;
    setSidebarModelError("");
  });
  el.toggleSidebar.addEventListener("click", () => {
    setSidebarCollapsed(!state.sidebarCollapsed);
  });

  el.openModelMarket.addEventListener("click", openModelMarket);
  el.closeModelMarket.addEventListener("click", () => closeModal(el.modelMarketModal));
  el.openWorkspace.addEventListener("click", openWorkspace);
  el.closeWorkspace.addEventListener("click", closeWorkspaceInline);
  el.toggleWorkspaceFiles.addEventListener("click", () => toggleWorkspacePanel("files"));
  el.toggleWorkspaceConfig.addEventListener("click", () => toggleWorkspacePanel("config"));
  el.workspaceRefresh.addEventListener("click", loadWorkspaceTree);
  el.workspaceNewFolder.addEventListener("click", createWorkspaceFolder);
  el.workspaceDeletePath.addEventListener("click", deleteWorkspacePath);
  el.workspaceEditMetadata.addEventListener("click", editWorkspaceMetadata);
  el.workspaceForm.addEventListener("submit", sendWorkspacePrompt);
  el.workspacePrompt.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      el.workspaceForm.requestSubmit();
    }
  });
  el.workspaceAttachImage.addEventListener("click", () => el.workspaceImageInput.click());
  el.workspaceImageInput.addEventListener("change", (event) => {
    stageImageAttachment(event.target.files?.[0], "workspace");
    event.target.value = "";
  });
  el.workspaceStop.addEventListener("click", interruptWorkspaceGeneration);
  el.workspaceControlLevel.addEventListener("change", updateWorkspaceModeBadge);
  el.workspaceAgentCharacter.addEventListener("change", saveWorkspaceChatSession);
  el.workspaceTree.addEventListener("click", handleWorkspaceTreeClick);
  el.workspaceNewChat.addEventListener("click", createWorkspaceChatForSelection);
  el.workspaceClearChat.addEventListener("click", clearWorkspaceChat);
  el.workspaceContextFlush.addEventListener("click", pruneWorkspaceChatContext);
  el.workspaceChatList.addEventListener("click", handleWorkspaceChatListClick);
  el.workspaceChatLog.addEventListener("click", handleWorkspaceApprovalClick);
  el.workspaceEmailProvider.addEventListener("change", applyWorkspaceEmailPreset);
  el.workspaceSaveEmailSettings.addEventListener("click", saveWorkspaceEmailSettings);
  el.workspaceTestEmailSettings.addEventListener("click", testWorkspaceEmailSettings);
  bindWorkspaceDrag();
  el.openConsoleLogs.addEventListener("click", openConsoleLogs);
  el.closeConsoleLogs.addEventListener("click", () => closeModal(el.consoleLogsModal));
  el.refreshConsoleLogs.addEventListener("click", fetchConsoleLogs);
  el.closeModelDiagnostic.addEventListener("click", () => closeModal(el.modelDiagnosticModal));
  el.diagnosticDismiss.addEventListener("click", () => closeModal(el.modelDiagnosticModal));
  el.diagnosticOpenMarketplace.addEventListener("click", () => {
    closeModal(el.modelDiagnosticModal);
    openModelMarket();
  });
  el.setupTestApi.addEventListener("click", setupTestApi);
  el.setupSaveApi.addEventListener("click", setupSaveApi);
  el.setupSkipApi.addEventListener("click", () => showSetupStep(2));
  el.setupProviderType.addEventListener("change", renderSetupCloudModelControl);
  el.setupCloudModelSelect.addEventListener("change", () =>
    handleModelSelectChange(el.setupCloudModelSelect, el.setupCustomModel)
  );
  el.setupScanModels.addEventListener("click", setupScanModels);
  el.setupLoadModel.addEventListener("click", setupLoadSelectedModel);
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
  el.openChatSettings.addEventListener("click", openChatSettings);
  el.closeChatSettings.addEventListener("click", () => closeModal(el.chatSettingsModal));
  el.saveChatSettings.addEventListener("click", saveChatSettings);
  el.clearChatSettings.addEventListener("click", clearChatSettings);
  el.autoSummarizeChat.addEventListener("click", autoSummarizeChat);

  [
    el.modelMarketModal,
    el.consoleLogsModal,
    el.modelDiagnosticModal,
    el.characterModal,
    el.personaModal,
    el.lorebookModal,
    el.newChatModal,
    el.chatSettingsModal,
  ].forEach((modal) => {
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
  el.useCharacter.addEventListener("click", async () => {
    await applyCharacter(editorCharacterPayload());
    closeModal(el.characterModal);
  });
  el.exportCharacter.addEventListener("click", exportCharacterCard);
  el.deleteCharacter.addEventListener("click", deleteCharacterCard);
  el.characterEditorName.addEventListener("input", updateCharacterEditorAvatar);
  el.characterEditorAvatarUrl.addEventListener("input", updateCharacterEditorAvatar);
  el.characterEditorBackgroundUrl.addEventListener("input", () => {
    if (state.activeCharacter?.id && state.activeCharacter.id === state.editingCharacterId) {
      const value = el.characterEditorBackgroundUrl.value.trim();
      if (value.startsWith("/api/assets/")) {
        state.activeCharacter.chat_background_file = value;
        state.activeCharacter.chat_background_url = "";
      } else {
        state.activeCharacter.chat_background_url = value;
        state.activeCharacter.chat_background_file = "";
      }
      updateChatBackground();
    }
  });
  el.characterEditorBackdrop.addEventListener("change", () => {
    if (state.activeCharacter?.id && state.activeCharacter.id === state.editingCharacterId) {
      state.activeCharacter.chat_backdrop_enabled = el.characterEditorBackdrop.checked;
      updateChatBackground();
    }
  });
  el.characterAvatarFile.addEventListener("change", handleCharacterAvatarFile);
  el.characterBackgroundFile.addEventListener("change", handleCharacterBackgroundFile);

  el.personaSelect.addEventListener("change", selectPersona);
  el.newPersona.addEventListener("click", () => setPersonaEditor(DEFAULT_PERSONA));
  el.savePersona.addEventListener("click", savePersonaCard);
  el.usePersona.addEventListener("click", () => applyPersona(editorPersonaPayload()));
  el.deletePersona.addEventListener("click", deletePersonaCard);
  el.personaEditorName.addEventListener("input", updatePersonaEditorAvatar);
  el.personaEditorAvatarUrl.addEventListener("input", updatePersonaEditorAvatar);
  el.personaAvatarFile.addEventListener("change", handlePersonaAvatarFile);

  el.newLorebook.addEventListener("click", newLorebookDraft);
  el.addLoreEntry.addEventListener("click", () => addLoreEntryRow());
  el.saveLorebook.addEventListener("click", saveLorebook);
  el.useLorebook.addEventListener("click", useLorebookFromEditor);
  el.deleteLorebook.addEventListener("click", deleteLorebookCard);
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
  el.selectGlobalBackground.addEventListener("click", selectGlobalBackground);
  el.globalBgFileInput.addEventListener("change", handleGlobalBackgroundFile);
  el.clearGlobalBackground.addEventListener("click", clearGlobalBackground);
  el.resetSetupWizard.addEventListener("click", () => {
    window.localStorage.removeItem("sweetroll_setup_complete");
    state.setupWizardShown = false;
    showSetupWizard();
  });
  el.chatTransparency.addEventListener("input", function () {
    const alphaValue = parseChatTransparencyValue(this.value);
    document.documentElement.style.setProperty(
      "--chat-bubble-opacity",
      alphaValue.toFixed(2)
    );
    setChatTransparency(alphaValue, { cssAlreadyApplied: true });
  });
  el.backgroundOpacitySlider.addEventListener("input", () => {
    setBackgroundImageOpacity(el.backgroundOpacitySlider.value);
  });
  el.clearChat.addEventListener("click", clearChat);
  el.exportChat.addEventListener("click", exportChatLogs);
  el.deleteChat.addEventListener("click", deleteActiveChat);
  el.newChat.addEventListener("click", startNewChat);
  el.newChatSidebar.addEventListener("click", startNewChat);
  el.toggleHistoryShelf.addEventListener("click", toggleHistoryShelf);
  el.confirmNewChat.addEventListener("click", confirmStartNewChat);
  el.cancelNewChat.addEventListener("click", cancelStartNewChat);
  el.cancelNewChatSecondary.addEventListener("click", cancelStartNewChat);
  el.deleteSelectedMessages.addEventListener("click", deleteSelectedMessages);
  if (el.chatHistorySelect) {
    el.chatHistorySelect.addEventListener("change", loadSelectedChat);
  }
  el.toggleExtensions.addEventListener("click", toggleExtensionsDrawer);
  el.imageApiProvider.addEventListener("change", () => applyExtensionApiProfileDefaults("image"));
  el.saveImageConfig.addEventListener("click", saveImageExtensionConfig);
  el.generateImage.addEventListener("click", generateImageFromExtension);
  el.saveVisionConfig.addEventListener("click", saveVisionExtensionConfig);
  el.visionApiProvider.addEventListener("change", () => applyExtensionApiProfileDefaults("vision"));
  el.visionProvider.addEventListener("change", renderVisionModelControl);
  el.visionModelSelect.addEventListener("change", () =>
    handleModelSelectChange(el.visionModelSelect, el.visionModel)
  );
  el.attachImage.addEventListener("click", () => el.chatImageInput.click());
  el.quickGenerateImage.addEventListener("click", quickGenerateImageFromComposer);
  el.chatImageInput.addEventListener("change", (event) => {
    stageImageAttachment(event.target.files?.[0], "chat");
    event.target.value = "";
  });
  [el.chatForm].forEach((dropTarget) => {
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
      stageImageAttachment(event.dataTransfer?.files?.[0], "chat");
    });
  });
  el.chatForm.addEventListener("submit", sendMessage);
  el.chatMessages.addEventListener("pointerdown", handleMessageExecutionPointerDown);
  el.chatMessages.addEventListener("click", handleMessageExecutionClick);
  el.messageInput.addEventListener("input", autosizeComposer);
  el.messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      el.chatForm.requestSubmit();
    }
  });
}

function bindSideMenu() {
  document.querySelectorAll("[data-side-action]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const action = event.currentTarget.dataset.sideAction || "";
      setActiveSideMenu(action);
      if (event.currentTarget.id && [
        "openWorkspace",
        "openCharacterLibrary",
        "openPersonaRegistry",
        "openLorebookEditor",
        "openModelMarket",
      ].includes(event.currentTarget.id)) {
        return;
      }
      handleSideMenuAction(action);
    });
  });
}

function setActiveSideMenu(action) {
  if (!action) {
    return;
  }
  document.querySelectorAll(".side-menu-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.sideAction === action);
  });
}

function handleSideMenuAction(action) {
  if (action === "home") {
    setSidebarMode("chat");
    closeWorkspaceInline();
    el.chatMain?.scrollIntoView?.({ block: "nearest" });
    return;
  }
  if (action === "workspace") {
    openWorkspace();
    return;
  }
  if (action === "settings") {
    if (el.settingsSidebar?.dataset.mode === "settings") {
      setSidebarMode("chat");
      setActiveSideMenu("home");
      return;
    }
    openSettingsSection();
    return;
  }
  if (action === "characters") {
    setSidebarMode("chat");
    openCharacterLibrary();
    return;
  }
  if (action === "personas") {
    setSidebarMode("chat");
    openPersonaRegistry();
    return;
  }
  if (action === "lorebooks") {
    setSidebarMode("chat");
    openLorebookEditor();
    return;
  }
  if (action === "models") {
    setSidebarMode("settings");
    openModelMarket();
  }
}

function openSettingsSection() {
  closeWorkspaceInline();
  setSidebarMode("settings");
  setActiveSideMenu("settings");
  ["inference", "generation", "cloud"].forEach((key) => {
    const section = document.querySelector(`[data-accordion-key="${key}"]`);
    if (section) {
      setAccordionCollapsed(section, false);
    }
  });
  const target = document.querySelector('[data-accordion-key="inference"]');
  target?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
}

function setSidebarMode(mode = "chat") {
  if (!el.settingsSidebar) {
    return;
  }
  el.settingsSidebar.dataset.mode = mode;
  document.querySelectorAll("[data-settings-panel]").forEach((panel) => {
    panel.classList.toggle("sidebar-panel-hidden", mode !== "settings");
  });
  document.querySelectorAll("[data-chat-panel]").forEach((panel) => {
    panel.classList.toggle("sidebar-panel-hidden", mode !== "chat");
  });
}

function bindSidebarAccordions() {
  document.querySelectorAll("[data-accordion-section]").forEach((section) => {
    const toggle = section.querySelector("[data-accordion-toggle]");
    const body = section.querySelector("[data-accordion-body]");
    if (!toggle || !body) {
      return;
    }
    const key = section.dataset.accordionKey || "";
    const storageKey = key ? `sweetroll-lm-accordion-${key}` : "";
    const saved = storageKey ? window.localStorage.getItem(storageKey) : null;
    const defaultCollapsed = section.dataset.accordionDefaultCollapsed === "true";
    setAccordionCollapsed(section, saved === null ? defaultCollapsed : saved === "true", {
      persist: false,
    });
    toggle.addEventListener("click", () => {
      setAccordionCollapsed(section, !section.classList.contains("collapsed"));
    });
  });
}

function setAccordionCollapsed(section, collapsed, options = {}) {
  const persist = options.persist !== false;
  const toggle = section.querySelector("[data-accordion-toggle]");
  const arrow = section.querySelector(".accordion-arrow");
  const key = section.dataset.accordionKey || "";
  section.classList.toggle("collapsed", Boolean(collapsed));
  if (toggle) {
    toggle.setAttribute("aria-expanded", String(!collapsed));
  }
  if (arrow) {
    arrow.textContent = collapsed ? ">" : "v";
  }
  if (persist && key) {
    try {
      window.localStorage.setItem(`sweetroll-lm-accordion-${key}`, String(Boolean(collapsed)));
    } catch (error) {
      console.warn("Unable to persist accordion preference", error);
    }
  }
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

function setChatTransparency(value, options = {}) {
  const numeric = parseChatTransparencyValue(value);
  if (options.cssAlreadyApplied !== true) {
    document.documentElement.style.setProperty("--chat-bubble-opacity", numeric.toFixed(2));
  }
  el.chatTransparency.value = String(Math.round(numeric * 100));
  el.chatTransparencyValue.textContent = `${Math.round(numeric * 100)}%`;
  state.appSettings.chat_bubble_opacity = numeric;
  applyChatBubbleOpacityToDom(numeric);
  if (options.persist !== false) {
    scheduleAppSettingsSave();
  }
}

function parseChatTransparencyValue(value) {
  const raw = Number(value);
  const normalized = raw > 1 ? raw / 100 : raw;
  return Math.max(0.1, Math.min(1, Number.isFinite(normalized) ? normalized : 0.82));
}

function applyChatBubbleOpacityToDom(value = state.appSettings.chat_bubble_opacity) {
  const alpha = parseChatTransparencyValue(value);
  const styleSource = el.chatMain || document.documentElement;
  const styles = window.getComputedStyle(styleSource);
  const assistantRgb =
    normalizeRgbChannels(styles.getPropertyValue("--surface-color-rgb")) || "20, 20, 26";
  const userRgb =
    normalizeRgbChannels(styles.getPropertyValue("--user-surface-color-rgb")) || "28, 32, 40";
  document.querySelectorAll(".bubble, .message-bubble, .chat-message-card").forEach((bubble) => {
    const rgb = bubble.closest(".message-row.user") ? userRgb : assistantRgb;
    const color = `rgba(${rgb}, ${alpha.toFixed(2)})`;
    bubble.style.setProperty("--chat-bubble-opacity", alpha.toFixed(2));
    bubble.style.setProperty("background", color, "important");
    bubble.style.setProperty("background-color", color, "important");
  });
}

function normalizeRgbChannels(value) {
  const parts = String(value || "")
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isFinite(part));
  if (parts.length !== 3) {
    return "";
  }
  return parts.map((part) => Math.max(0, Math.min(255, Math.round(part)))).join(", ");
}

function setBackgroundImageOpacity(value, options = {}) {
  const raw = Number(value);
  const normalized = raw > 1 ? raw / 100 : raw;
  const numeric = Math.max(0, Math.min(1, Number.isFinite(normalized) ? normalized : 0.9));
  document.documentElement.style.setProperty("--bg-image-opacity", numeric.toFixed(2));
  el.backgroundOpacitySlider.value = String(Math.round(numeric * 100));
  el.backgroundOpacityValue.textContent = `${Math.round(numeric * 100)}%`;
  state.appSettings.background_image_opacity = numeric;
  if (options.persist !== false) {
    scheduleAppSettingsSave();
  }
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
  updateChatBackground();
}

async function loadAppSettings() {
  try {
    const response = await fetch("/api/app-settings");
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Could not load app settings");
    }
    state.appSettings = normalizeAppSettings(data);
  } catch (error) {
    state.appSettings = normalizeAppSettings({});
    console.warn(error.message || "Could not load app settings.");
  }
  applyAppSettingsVisuals();
  renderGlobalBackgroundStatus();
  updateChatBackground();
}

function normalizeAppSettings(settingsPayload) {
  return {
    global_background_path: settingsPayload?.global_background_path || "",
    chat_bubble_opacity: normalizeOpacity(settingsPayload?.chat_bubble_opacity, 0.82, 0.1),
    background_image_opacity: normalizeOpacity(settingsPayload?.background_image_opacity, 0.9, 0),
    updated_at: settingsPayload?.updated_at || "",
  };
}

function normalizeOpacity(value, fallback, minimum) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(minimum, Math.min(1, numeric));
}

function applyAppSettingsVisuals() {
  setChatTransparency(state.appSettings.chat_bubble_opacity, { persist: false });
  setBackgroundImageOpacity(state.appSettings.background_image_opacity, { persist: false });
}

function scheduleAppSettingsSave() {
  window.clearTimeout(state.appSettingsSaveTimer);
  state.appSettingsSaveTimer = window.setTimeout(saveAppSettings, 450);
}

async function flushAppSettingsSave() {
  if (!state.appSettingsSaveTimer) {
    return;
  }
  window.clearTimeout(state.appSettingsSaveTimer);
  state.appSettingsSaveTimer = null;
  await saveAppSettings();
}

async function saveAppSettings() {
  state.appSettingsSaveTimer = null;
  try {
    const response = await fetch("/api/app-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        global_background_path: state.appSettings.global_background_path || "",
        chat_bubble_opacity: state.appSettings.chat_bubble_opacity,
        background_image_opacity: state.appSettings.background_image_opacity,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Could not save appearance settings");
    }
    state.appSettings = normalizeAppSettings(payload);
    renderGlobalBackgroundStatus();
  } catch (error) {
    console.warn(error.message || "Could not save appearance settings.");
  }
}

function selectGlobalBackground() {
  el.globalBgFileInput.value = "";
  el.globalBgFileInput.click();
}

async function handleGlobalBackgroundFile() {
  const file = el.globalBgFileInput.files?.[0];
  if (!file) {
    return;
  }
  if (!file.type.startsWith("image/")) {
    renderGlobalBackgroundStatus("Select an image file for the global background.");
    el.globalBgFileInput.value = "";
    return;
  }
  el.selectGlobalBackground.disabled = true;
  renderGlobalBackgroundStatus(`Uploading ${file.name}.`);
  try {
    await flushAppSettingsSave();
    const form = new FormData();
    form.append("background", file, file.name);
    const response = await fetch("/api/app-settings/background/upload", {
      method: "POST",
      body: form,
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Could not upload background");
    }
    state.appSettings = normalizeAppSettings(payload.settings);
    state.backgroundRevision += 1;
    applyAppSettingsVisuals();
    renderGlobalBackgroundStatus(payload.message || "Global background updated.");
    updateChatBackground();
  } catch (error) {
    renderGlobalBackgroundStatus(error.message || "Could not upload background.");
  } finally {
    el.selectGlobalBackground.disabled = false;
    el.globalBgFileInput.value = "";
  }
}

async function clearGlobalBackground() {
  el.clearGlobalBackground.disabled = true;
  try {
    await flushAppSettingsSave();
    const response = await fetch("/api/app-settings/background/clear", { method: "POST" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Could not clear background");
    }
    state.appSettings = normalizeAppSettings(payload);
    state.backgroundRevision += 1;
    applyAppSettingsVisuals();
    renderGlobalBackgroundStatus("Global background cleared.");
    updateChatBackground();
  } catch (error) {
    renderGlobalBackgroundStatus(error.message || "Could not clear background.");
  } finally {
    el.clearGlobalBackground.disabled = false;
  }
}

function renderGlobalBackgroundStatus(message = "") {
  if (!el.globalBackgroundStatus) {
    return;
  }
  if (message) {
    el.globalBackgroundStatus.textContent = message;
    return;
  }
  const path = state.appSettings?.global_background_path || "";
  el.globalBackgroundStatus.textContent = path
    ? `Using ${shortenPath(path)}`
    : "Theme default active.";
}

function shortenPath(pathValue) {
  const text = String(pathValue || "");
  if (text.length <= 58) {
    return text;
  }
  return `...${text.slice(-55)}`;
}

function toggleExtensionsDrawer() {
  state.extensionsOpen = !state.extensionsOpen;
  el.extensionsDrawer.classList.toggle("hidden", !state.extensionsOpen);
  el.toggleExtensions.setAttribute("aria-expanded", String(state.extensionsOpen));
  el.toggleExtensions.classList.toggle("is-active", state.extensionsOpen);
  window.setTimeout(scrollChatToBottom, 180);
}

function loadExtensionConfig() {
  try {
    const raw = window.localStorage.getItem("sweetroll_lm_extension_config");
    if (!raw) {
      return;
    }
    const config = JSON.parse(raw);
    if (config.image) {
      el.imageProvider.value = config.image.provider || el.imageProvider.value;
      el.imageApiProvider.value = config.image.api_provider_id || "";
      el.imageEndpoint.value = config.image.endpoint || "";
      el.imageModel.value = config.image.model || "";
      el.imageAspectRatio.value = config.image.aspect_ratio || el.imageAspectRatio.value;
      el.imageSteps.value = config.image.steps || el.imageSteps.value;
      el.imageNegativePrompt.value = config.image.negative_prompt || "";
    }
    if (config.vision) {
      el.visionProvider.value = config.vision.provider || el.visionProvider.value;
      el.visionApiProvider.value = config.vision.api_provider_id || "";
      el.visionEndpoint.value = config.vision.endpoint || "";
      el.visionPrompt.value = config.vision.prompt || el.visionPrompt.value;
      renderVisionModelControl(config.vision.model || "");
    }
  } catch {
    // Optional local preference; malformed storage should never block chat.
  }
}

function saveImageExtensionConfig() {
  const provider = extensionApiProvider("image");
  writeExtensionConfig({
    image: {
      provider: el.imageProvider.value,
      api_provider_id: el.imageApiProvider.value || provider?.id || null,
      endpoint: extensionEndpoint("image", provider),
      model: el.imageModel.value.trim(),
      aspect_ratio: el.imageAspectRatio.value,
      steps: Number(el.imageSteps.value) || 24,
      negative_prompt: el.imageNegativePrompt.value.trim(),
    },
  });
  el.imageGenerationStatus.textContent = "Image generation configuration saved.";
}

function saveVisionExtensionConfig() {
  const provider = extensionApiProvider("vision");
  writeExtensionConfig({
    vision: {
      provider: el.visionProvider.value,
      api_provider_id: el.visionApiProvider.value || provider?.id || null,
      endpoint: extensionEndpoint("vision", provider),
      model: selectedModelValue(el.visionModelSelect, el.visionModel),
      prompt: el.visionPrompt.value.trim(),
    },
  });
  el.visionCaptionStatus.textContent = "Vision captioning configuration saved.";
}

function writeExtensionConfig(partial) {
  try {
    const current = JSON.parse(
      window.localStorage.getItem("sweetroll_lm_extension_config") || "{}"
    );
    window.localStorage.setItem(
      "sweetroll_lm_extension_config",
      JSON.stringify({ ...current, ...partial })
    );
  } catch {
    // The live controls still work if browser storage is unavailable.
  }
}

function renderVisionModelControl(currentValue = "") {
  populateModelSelector(
    el.visionModelSelect,
    el.visionModel,
    el.visionProvider?.value || "custom",
    currentValue || selectedModelValue(el.visionModelSelect, el.visionModel),
    VISION_MODEL_CATALOG
  );
}

async function openWorkspace() {
  mountWorkspaceInline();
  setSidebarMode("workspace");
  setActiveSideMenu("workspace");
  el.chatMain.classList.add("workspace-mode");
  el.workspaceModal.classList.remove("hidden");
  el.workspaceModal.setAttribute("aria-hidden", "false");
  syncWorkspacePanelToggles();
  window.setTimeout(() => el.workspacePrompt.focus(), 0);
  await loadCharacters();
  populateWorkspaceCharacters();
  updateWorkspaceModeBadge();
  await loadWorkspaceTree();
  await loadWorkspaceChatsForSelection();
  await loadWorkspaceEmailSettings();
  await refreshWorkspaceServices();
}

function mountWorkspaceInline() {
  if (el.workspaceModal.classList.contains("workspace-inline")) {
    return;
  }
  el.workspaceModal.className = "workspace-inline hidden";
  el.workspaceModal.setAttribute("role", "region");
  el.workspaceModal.setAttribute("aria-label", "Agentic Workspace");
  el.workspaceModal.setAttribute("aria-hidden", "true");
  el.workspaceModal.removeAttribute("aria-modal");
  el.workspaceWindow.style.transform = "";
  state.workspaceOffset = { x: 0, y: 0 };
  el.chatMain.insertBefore(el.workspaceModal, el.chatMessages);
}

function closeWorkspaceInline() {
  if (!el.workspaceModal) {
    return;
  }
  el.workspaceModal.classList.add("hidden");
  el.workspaceModal.setAttribute("aria-hidden", "true");
  el.chatMain.classList.remove("workspace-mode");
  if (document.activeElement && el.workspaceModal.contains(document.activeElement)) {
    el.messageInput.focus();
  }
  if (!state.activeCharacter) {
    renderNoCharacterPlaceholder();
  }
  setSidebarMode("chat");
  setActiveSideMenu("home");
}

function toggleWorkspacePanel(panel) {
  const className = panel === "files" ? "hide-files" : "hide-config";
  const button = panel === "files" ? el.toggleWorkspaceFiles : el.toggleWorkspaceConfig;
  const hidden = el.workspaceWindow.classList.toggle(className);
  button.setAttribute("aria-pressed", String(!hidden));
  button.classList.toggle("is-active", !hidden);
}

function syncWorkspacePanelToggles() {
  const filesVisible = !el.workspaceWindow.classList.contains("hide-files");
  const configVisible = !el.workspaceWindow.classList.contains("hide-config");
  el.toggleWorkspaceFiles.setAttribute("aria-pressed", String(filesVisible));
  el.toggleWorkspaceConfig.setAttribute("aria-pressed", String(configVisible));
  el.toggleWorkspaceFiles.classList.toggle("is-active", filesVisible);
  el.toggleWorkspaceConfig.classList.toggle("is-active", configVisible);
}

function bindWorkspaceDrag() {
  el.workspaceDragHandle.addEventListener("pointerdown", (event) => {
    if (el.workspaceModal.classList.contains("workspace-inline")) {
      return;
    }
    if (event.target.closest("button")) {
      return;
    }
    state.workspaceDrag = {
      startX: event.clientX,
      startY: event.clientY,
      baseX: state.workspaceOffset.x,
      baseY: state.workspaceOffset.y,
    };
    el.workspaceDragHandle.setPointerCapture?.(event.pointerId);
  });
  el.workspaceDragHandle.addEventListener("pointermove", (event) => {
    if (!state.workspaceDrag) {
      return;
    }
    const nextX = state.workspaceDrag.baseX + event.clientX - state.workspaceDrag.startX;
    const nextY = state.workspaceDrag.baseY + event.clientY - state.workspaceDrag.startY;
    state.workspaceOffset = { x: nextX, y: nextY };
    el.workspaceWindow.style.transform = `translate(${nextX}px, ${nextY}px)`;
  });
  el.workspaceDragHandle.addEventListener("pointerup", () => {
    state.workspaceDrag = null;
  });
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
  closeWorkspaceInline();
  [
    el.modelMarketModal,
    el.consoleLogsModal,
    el.modelDiagnosticModal,
    el.characterModal,
    el.personaModal,
    el.lorebookModal,
    el.newChatModal,
    el.chatSettingsModal,
  ].forEach(closeModal);
}

function populateWorkspaceCharacters() {
  const current = el.workspaceAgentCharacter.value;
  el.workspaceAgentCharacter.innerHTML = '<option value="">Base System Prompt</option>';
  state.characters.forEach((character) => {
    const option = document.createElement("option");
    option.value = character.id;
    option.textContent = character.name;
    el.workspaceAgentCharacter.appendChild(option);
  });
  if ([...el.workspaceAgentCharacter.options].some((option) => option.value === current)) {
    el.workspaceAgentCharacter.value = current;
  } else if (state.activeCharacter?.id) {
    el.workspaceAgentCharacter.value = state.activeCharacter.id;
  }
  const hasCharacters = state.characters.length > 0;
  el.workspaceAgentCharacterField.classList.toggle("hidden", !hasCharacters);
  el.workspaceAgentBase.classList.toggle("hidden", hasCharacters);
}

function updateWorkspaceModeBadge() {
  const label = el.workspaceControlLevel.options[el.workspaceControlLevel.selectedIndex]?.textContent || "Read-Only";
  el.workspaceModeBadge.textContent = label.replace(" (Authorization Required)", "");
}

async function loadWorkspaceEmailSettings() {
  try {
    const response = await fetch("/api/workspace/email-settings", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Could not load email settings.");
    }
    state.workspaceEmailPresets = payload.presets || {};
    el.workspaceEmailProvider.value = payload.provider || "custom";
    el.workspaceSmtpServer.value = payload.smtp_server || "";
    el.workspaceSmtpPort.value = String(payload.smtp_port || 587);
    el.workspaceSmtpEmail.value = payload.smtp_email || "";
    el.workspaceSmtpPassword.value = "";
    el.workspaceEmailStatus.textContent = payload.has_password
      ? "SMTP password is saved locally. Leave blank to keep it."
      : "No SMTP password saved. Browser fallback remains available.";
  } catch (error) {
    el.workspaceEmailStatus.textContent = error.message || "Could not load SMTP settings.";
  }
}

function applyWorkspaceEmailPreset() {
  const preset = state.workspaceEmailPresets?.[el.workspaceEmailProvider.value];
  if (!preset || el.workspaceEmailProvider.value === "custom") {
    return;
  }
  el.workspaceSmtpServer.value = preset.smtp_server || "";
  el.workspaceSmtpPort.value = String(preset.smtp_port || 587);
}

function workspaceEmailPayload() {
  return {
    provider: el.workspaceEmailProvider.value || "custom",
    smtp_server: el.workspaceSmtpServer.value.trim(),
    smtp_port: Number(el.workspaceSmtpPort.value || 587),
    smtp_email: el.workspaceSmtpEmail.value.trim(),
    smtp_password: el.workspaceSmtpPassword.value,
  };
}

async function saveWorkspaceEmailSettings() {
  el.workspaceSaveEmailSettings.disabled = true;
  el.workspaceEmailStatus.textContent = "Saving SMTP settings locally.";
  try {
    const response = await fetch("/api/workspace/email-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(workspaceEmailPayload()),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Could not save SMTP settings.");
    }
    el.workspaceSmtpPassword.value = "";
    el.workspaceEmailStatus.textContent = payload.has_password
      ? "SMTP settings saved. Password is retained as a protected local secret."
      : "SMTP settings saved without a password.";
  } catch (error) {
    el.workspaceEmailStatus.textContent = error.message || "Could not save SMTP settings.";
  } finally {
    el.workspaceSaveEmailSettings.disabled = false;
  }
}

async function testWorkspaceEmailSettings() {
  el.workspaceTestEmailSettings.disabled = true;
  el.workspaceEmailStatus.textContent = "Testing SMTP login.";
  try {
    const response = await fetch("/api/workspace/email-settings/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(workspaceEmailPayload()),
    });
    const payload = await response.json();
    el.workspaceEmailStatus.textContent = payload.message || (payload.ok ? "SMTP login validated." : "SMTP validation failed.");
  } catch (error) {
    el.workspaceEmailStatus.textContent = error.message || "SMTP validation failed.";
  } finally {
    el.workspaceTestEmailSettings.disabled = false;
  }
}

async function loadWorkspaceTree() {
  el.workspaceTree.innerHTML = '<p class="muted">Scanning ./workspace...</p>';
  try {
    const response = await fetch("/api/workspace/tree", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Could not read workspace tree.");
    }
    state.workspaceTree = payload.nodes || [];
    renderWorkspaceTree();
  } catch (error) {
    el.workspaceTree.innerHTML = "";
    appendWorkspaceLog(`Workspace tree error: ${error.message}`);
  }
}

function renderWorkspaceTree() {
  el.workspaceTree.innerHTML = "";
  if (!state.workspaceTree.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "The workspace folder is empty.";
    el.workspaceTree.appendChild(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  state.workspaceTree.forEach((node) => fragment.appendChild(workspaceNodeElement(node, 0)));
  el.workspaceTree.appendChild(fragment);
}

function workspaceNodeElement(node, depth) {
  const wrapper = document.createElement("div");
  wrapper.className = "workspace-node-wrap";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "workspace-node";
  button.dataset.path = node.path;
  button.dataset.kind = node.kind;
  button.classList.toggle("selected", state.workspaceSelectedPath === node.path);
  button.style.setProperty("--node-depth", String(depth));
  button.textContent = `${node.kind === "folder" ? "[+]" : "[file]"} ${node.name}`;
  wrapper.appendChild(button);

  if (node.children?.length) {
    const children = document.createElement("div");
    children.className = "workspace-node-children";
    node.children.forEach((child) => children.appendChild(workspaceNodeElement(child, depth + 1)));
    wrapper.appendChild(children);
  }
  return wrapper;
}

async function handleWorkspaceTreeClick(event) {
  const button = event.target.closest(".workspace-node");
  if (!button && event.target === el.workspaceTree) {
    state.workspaceSelectedPath = "";
    state.workspaceSelectedKind = "";
    el.workspacePathStatus.textContent = "Selected: Root Workspace";
    renderWorkspaceTree();
    await loadWorkspaceChatsForSelection();
    return;
  }
  if (!button) {
    return;
  }
  state.workspaceSelectedPath = button.dataset.path || "";
  state.workspaceSelectedKind = button.dataset.kind || "";
  el.workspacePathStatus.textContent = state.workspaceSelectedPath
    ? `Selected: ${state.workspaceSelectedPath}`
    : "No folder selected.";
  renderWorkspaceTree();
  await loadWorkspaceChatsForSelection();
}

async function createWorkspaceFolder() {
  const base = state.workspaceSelectedPath || "";
  const name = window.prompt("Folder name inside ./workspace", base ? `${base}/new-folder` : "new-folder");
  if (!name) {
    return;
  }
  try {
    const response = await fetch("/api/workspace/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: name.trim() }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Could not create folder.");
    }
    state.workspaceTree = payload.nodes || [];
    state.workspaceSelectedPath = name.trim();
    renderWorkspaceTree();
    appendWorkspaceLog(`Created folder: ${state.workspaceSelectedPath}`);
  } catch (error) {
    appendWorkspaceLog(`Create folder failed: ${error.message}`);
  }
}

async function deleteWorkspacePath() {
  if (!state.workspaceSelectedPath) {
    appendWorkspaceLog("Select a workspace file or folder before deleting.");
    return;
  }
  if (!window.confirm(`Delete ${state.workspaceSelectedPath}? Empty folders and files only.`)) {
    return;
  }
  try {
    const response = await fetch("/api/workspace/path", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: state.workspaceSelectedPath }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Could not delete workspace path.");
    }
    appendWorkspaceLog(`Deleted: ${state.workspaceSelectedPath}`);
    state.workspaceSelectedPath = "";
    state.workspaceTree = payload.nodes || [];
    renderWorkspaceTree();
  } catch (error) {
    appendWorkspaceLog(`Delete failed: ${error.message}`);
  }
}

async function editWorkspaceMetadata() {
  const path = state.workspaceSelectedPath || ".";
  const note = window.prompt(`Metadata note for ${path}`, "");
  if (note === null) {
    return;
  }
  const permissionMode = window.prompt("Permission label for this path", "inherit");
  if (permissionMode === null) {
    return;
  }
  try {
    const response = await fetch("/api/workspace/metadata", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path,
        metadata: { note },
        permissions: { mode: permissionMode || "inherit", edited_from_ui: true },
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Could not save workspace metadata.");
    }
    appendWorkspaceLog(`Saved metadata for ${path}.`);
  } catch (error) {
    appendWorkspaceLog(`Metadata save failed: ${error.message}`);
  }
}

async function sendWorkspacePrompt(event) {
  event.preventDefault();
  const prompt = el.workspacePrompt.value.trim();
  const hasImage = Boolean(state.workspacePendingImage);
  if ((!prompt && !hasImage) || state.workspaceRunning) {
    return;
  }
  await ensureWorkspaceChatSession();
  const history = state.workspaceMessages.slice();
  state.workspaceRunning = true;
  el.workspaceSend.disabled = true;
  el.workspaceStop.disabled = false;
  let workspacePrompt = prompt;
  let transientVisionContext = "";
  try {
    const imagePayload = await prepareImageForSend("workspace", prompt);
    transientVisionContext = imagePayload.visionContext;
    const visiblePrompt = [prompt, imagePayload.messageSuffix].filter(Boolean).join("\n\n");
    workspacePrompt = prompt || "Analyze the attached image and respond with useful observations.";
    el.workspacePrompt.value = "";
    appendWorkspaceMessage("user", "You", visiblePrompt || workspacePrompt);
    state.workspaceMessages.push(workspaceChatMessage("user", visiblePrompt || workspacePrompt));
    saveWorkspaceChatSession();
    appendWorkspaceLog("Agent request dispatched.");
    const response = await fetch("/api/workspace/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        workspaceAgentPayload(workspacePrompt, {
          messages: history,
          vision_context: transientVisionContext,
        })
      ),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || payload.message || "Workspace agent failed.");
    }
    handleWorkspaceAgentResponse(payload);
  } catch (error) {
    appendWorkspaceMessage("assistant", "Workspace Error", error.message);
    appendWorkspaceLog(`Agent error: ${error.message}`);
  } finally {
    clearPendingImage("workspace");
    state.workspaceRunning = false;
    el.workspaceSend.disabled = false;
    el.workspaceStop.disabled = true;
  }
}

async function interruptWorkspaceGeneration() {
  if (!state.workspaceRunning) {
    appendWorkspaceLog("No active workspace generation is running.");
    return;
  }
  const sessionId = state.workspaceChatId || "default";
  try {
    const response = await fetch("/api/interrupt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.detail || payload.message || "Interrupt request failed.");
    }
    appendWorkspaceLog(`Stop signal sent for workspace session ${payload.session_id || sessionId}.`);
  } catch (error) {
    appendWorkspaceLog(`Stop signal failed: ${error.message}`);
  }
}

function workspaceAgentPayload(prompt, extra = {}) {
  const uiSource = el.inferenceSource.value;
  const source = backendInferenceSource(uiSource);
  const payload = {
    prompt,
    session_id: state.workspaceChatId || "default",
    source,
    character_id: el.workspaceAgentCharacter.value || null,
    current_directory: selectedWorkspaceDirectory(),
    control_level: el.workspaceControlLevel.value,
    local: {
      template: el.promptTemplate.value,
    },
    ...extra,
  };
  applyCloudSettingsForUiSource(payload, uiSource);
  return payload;
}

function handleWorkspaceAgentResponse(payload) {
  const pendingTasks = workspacePendingTasksFromPayload(payload);
  const assistantPresentation = workspaceAssistantPresentation(payload.assistant_text || "");
  const telemetryTools = dedupeWorkspaceTools([
    ...assistantPresentation.tools,
    ...pendingTasks,
  ]);

  if (telemetryTools.length) {
    appendWorkspaceToolTelemetry(telemetryTools, payload.status);
  }

  if (payload.status === "completed" && assistantPresentation.visibleText) {
    appendWorkspaceMessage("assistant", "Workspace Agent", assistantPresentation.visibleText);
    state.workspaceMessages.push(workspaceChatMessage("assistant", assistantPresentation.visibleText));
    saveWorkspaceChatSession();
  }
  if (payload.output) {
    appendWorkspaceLog(payload.output);
    loadWorkspaceTree();
    refreshWorkspaceServices();
  }
  if (payload.status === "needs_approval" && pendingTasks.length) {
    state.workspacePendingTask = pendingTasks[0];
    state.workspacePendingContext = Array.isArray(payload.context_messages)
      ? payload.context_messages
      : state.workspaceMessages.slice();
    appendWorkspaceApproval(payload.message || "Agent requested permission.", pendingTasks[0]);
    return;
  }
  if (payload.status === "interrupted") {
    appendWorkspaceLog(`INTERRUPTED: ${payload.message || "Workspace execution stopped."}`);
    if (assistantPresentation.visibleText) {
      appendWorkspaceMessage("assistant", "Workspace Agent", assistantPresentation.visibleText);
    }
    return;
  }
  if (payload.status === "denied" || payload.status === "error") {
    appendWorkspaceLog(`${payload.status.toUpperCase()}: ${payload.message}`);
  } else if (payload.message) {
    appendWorkspaceLog(payload.message);
  }
  appendWorkspaceMetrics(payload);
}

function appendWorkspaceMetrics(payload = {}) {
  if (!["completed", "error", "denied", "interrupted"].includes(payload.status)) {
    return;
  }
  const elapsed = Number(payload.elapsed_seconds || 0);
  const totalTokens = Number(payload.total_tokens || 0);
  if (!elapsed && !totalTokens) {
    return;
  }
  const duration =
    elapsed >= 60
      ? `${Math.floor(elapsed / 60)}m ${Math.round(elapsed % 60)}s`
      : `${elapsed.toFixed(elapsed < 10 ? 1 : 0)}s`;
  const promptTokens = Number(payload.prompt_tokens || 0);
  const completionTokens = Number(payload.completion_tokens || 0);
  const text = [
    `Status: ${payload.status}`,
    `Duration: ${duration}`,
    `Est. tokens: ${totalTokens.toLocaleString()} total (${promptTokens.toLocaleString()} prompt / ${completionTokens.toLocaleString()} output)`,
  ].join(" | ");
  const article = document.createElement("article");
  article.className = "workspace-message metrics";
  article.textContent = text;
  el.workspaceChatLog.appendChild(article);
  el.workspaceChatLog.scrollTop = el.workspaceChatLog.scrollHeight;
}

function dedupeWorkspaceTools(tools) {
  const seen = new Set();
  const unique = [];
  tools.forEach((tool) => {
    if (!tool) {
      return;
    }
    const key = JSON.stringify({
      action: tool.action || "",
      path: tool.path || "",
      command: tool.command || "",
      target_dir: tool.target_dir || "",
      service_name: tool.service_name || "",
      to: tool.to || "",
    });
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    unique.push(tool);
  });
  return unique;
}

function appendWorkspaceToolTelemetry(tools, status = "completed") {
  const prefix = status === "needs_approval" ? "Awaiting approval" : "Tool activity";
  const lines = tools.map((tool, index) => {
    const target = tool.path || tool.command || tool.target_dir || tool.to || tool.service_name || ".";
    return `${prefix} [${index + 1}/${tools.length}]: ${tool.action} -> ${target}`;
  });
  appendWorkspaceLog(lines.join("\n"));
}

async function refreshWorkspaceServices() {
  try {
    const response = await fetch("/api/workspace/services", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Could not read workspace services.");
    }
    renderWorkspaceServiceBadges(payload.services || []);
  } catch (error) {
    appendWorkspaceLog(`Workspace service status failed: ${error.message}`);
  }
}

function renderWorkspaceServiceBadges(services) {
  const panel = ensureWorkspaceServiceStatusPanel();
  panel.innerHTML = "";
  const running = services.filter((service) => service.running);
  if (!running.length) {
    panel.classList.add("hidden");
    return;
  }
  panel.classList.remove("hidden");
  running.forEach((service) => {
    const badge = document.createElement("span");
    badge.className = "workspace-service-badge";
    badge.textContent = `${service.service_name} active · PID ${service.pid}`;
    panel.appendChild(badge);
  });
}

function ensureWorkspaceServiceStatusPanel() {
  let panel = document.getElementById("workspaceServiceStatus");
  if (panel) {
    return panel;
  }
  panel = document.createElement("div");
  panel.id = "workspaceServiceStatus";
  panel.className = "workspace-service-status hidden";
  el.workspaceExecutionLog.parentElement.insertBefore(panel, el.workspaceExecutionLog);
  return panel;
}

function appendWorkspaceMessage(role, title, text, explicitTools = []) {
  const article = document.createElement("article");
  article.className = `workspace-message ${role}`;
  const strong = document.createElement("strong");
  strong.textContent = title;
  const paragraph = document.createElement("p");
  const presentation = role === "assistant" ? workspaceAssistantPresentation(text || "") : {
    visibleText: text || "",
    tools: [],
  };
  const tools = [...presentation.tools, ...explicitTools];
  paragraph.textContent = presentation.visibleText || "";
  article.append(strong);
  if (presentation.visibleText) {
    article.appendChild(paragraph);
  }
  if (tools.length) {
    article.appendChild(workspaceToolBadgeRow(tools));
  }
  if (!presentation.visibleText && !tools.length) {
    paragraph.textContent = "";
    article.appendChild(paragraph);
  }
  el.workspaceChatLog.appendChild(article);
  el.workspaceChatLog.scrollTop = el.workspaceChatLog.scrollHeight;
}

async function loadWorkspaceChatsForSelection() {
  const folderPath = selectedWorkspaceDirectory();
  try {
    const response = await fetch(
      `/api/workspace/chats?folder_path=${encodeURIComponent(folderPath)}`,
      { cache: "no-store" }
    );
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Could not load workspace chats.");
    }
    state.workspaceChats = payload || [];
    renderWorkspaceChatList();
    if (state.workspaceChats.length) {
      applyWorkspaceChatSession(state.workspaceChats[0]);
    } else {
      await createWorkspaceChatForSelection({ silent: true });
    }
  } catch (error) {
    appendWorkspaceLog(`Workspace chat load failed: ${error.message}`);
  }
}

function renderWorkspaceChatList() {
  el.workspaceChatList.innerHTML = "";
  if (!state.workspaceChats.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No workspace chats yet.";
    el.workspaceChatList.appendChild(empty);
    return;
  }
  state.workspaceChats.forEach((chat) => {
    const row = document.createElement("div");
    row.className = "workspace-chat-item";
    row.classList.toggle("active", chat.id === state.workspaceChatId);
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.workspaceChatId = chat.id;
    button.textContent = chat.title || "Workspace Chat";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "workspace-chat-delete";
    remove.dataset.deleteWorkspaceChat = chat.id;
    remove.title = "Delete workspace chat";
    remove.setAttribute("aria-label", "Delete workspace chat");
    remove.textContent = "x";
    row.append(button, remove);
    el.workspaceChatList.appendChild(row);
  });
}

async function handleWorkspaceChatListClick(event) {
  const deleteButton = event.target.closest("[data-delete-workspace-chat]");
  if (deleteButton) {
    const chatId = deleteButton.dataset.deleteWorkspaceChat;
    if (!window.confirm("Delete this workspace chat thread?")) {
      return;
    }
    try {
      const response = await fetch(`/api/workspace/chats/${encodeURIComponent(chatId)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.detail || "Could not delete workspace chat.");
      }
      await loadWorkspaceChatsForSelection();
    } catch (error) {
      appendWorkspaceLog(`Workspace chat delete failed: ${error.message}`);
    }
    return;
  }
  const button = event.target.closest("[data-workspace-chat-id]");
  if (!button) {
    return;
  }
  const chat = state.workspaceChats.find((item) => item.id === button.dataset.workspaceChatId);
  if (chat) {
    applyWorkspaceChatSession(chat);
    renderWorkspaceChatList();
  }
}

async function createWorkspaceChatForSelection(options = {}) {
  const folderPath = selectedWorkspaceDirectory();
  try {
    const response = await fetch("/api/workspace/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folder_path: folderPath,
        character_id: el.workspaceAgentCharacter.value || null,
        messages: [],
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Could not create workspace chat.");
    }
    state.workspaceChats = [payload, ...state.workspaceChats.filter((chat) => chat.id !== payload.id)];
    applyWorkspaceChatSession(payload);
    renderWorkspaceChatList();
    if (!options.silent) {
      appendWorkspaceLog(`New workspace chat created for ${folderPath || "root"}.`);
    }
    return payload;
  } catch (error) {
    appendWorkspaceLog(`Workspace chat create failed: ${error.message}`);
    return null;
  }
}

async function ensureWorkspaceChatSession() {
  if (state.workspaceChatId) {
    return;
  }
  await createWorkspaceChatForSelection({ silent: true });
}

function applyWorkspaceChatSession(session) {
  state.workspaceChatId = session.id;
  state.workspaceMessages = Array.isArray(session.messages) ? [...session.messages] : [];
  renderWorkspaceChatMessages();
}

function renderWorkspaceChatMessages() {
  el.workspaceChatLog.innerHTML = "";
  if (!state.workspaceMessages.length) {
    const article = document.createElement("article");
    article.className = "workspace-message assistant";
    const strong = document.createElement("strong");
    strong.textContent = "Workspace ready.";
    const paragraph = document.createElement("p");
    paragraph.textContent = "Ask the assigned agent to inspect files, draft changes, or plan tasks inside the sandbox.";
    article.append(strong, paragraph);
    el.workspaceChatLog.appendChild(article);
    return;
  }
  state.workspaceMessages.forEach((message) => {
    if (message.role === "user") {
      appendWorkspaceMessage("user", "You", message.content);
    } else if (message.role === "assistant") {
      appendWorkspaceMessage("assistant", "Workspace Agent", message.content);
    }
  });
}

async function clearWorkspaceChat() {
  if (!state.workspaceChatId) {
    return;
  }
  try {
    const response = await fetch("/api/workspace/chats/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: state.workspaceChatId }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Could not clear workspace chat.");
    }
    const index = state.workspaceChats.findIndex((chat) => chat.id === payload.id);
    if (index >= 0) {
      state.workspaceChats[index] = payload;
    }
    applyWorkspaceChatSession(payload);
    renderWorkspaceChatList();
    appendWorkspaceLog("Workspace chat thread cleared.");
  } catch (error) {
    appendWorkspaceLog(`Workspace chat clear failed: ${error.message}`);
  }
}

async function pruneWorkspaceChatContext() {
  if (!state.workspaceChatId) {
    return;
  }
  if (!window.confirm("Flush tool logs and keep only your prompts in this workspace thread?")) {
    return;
  }
  try {
    const response = await fetch("/api/workspace/chats/prune_tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: state.workspaceChatId }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Could not flush workspace context.");
    }
    const index = state.workspaceChats.findIndex((chat) => chat.id === payload.id);
    if (index >= 0) {
      state.workspaceChats[index] = payload;
    }
    applyWorkspaceChatSession(payload);
    renderWorkspaceChatList();
    appendWorkspaceLog("Context flushed. User prompts were preserved; tool chatter was pruned.");
  } catch (error) {
    appendWorkspaceLog(`Context flush failed: ${error.message}`);
  }
}

async function saveWorkspaceChatSession() {
  if (!state.workspaceChatId) {
    return;
  }
  try {
    const response = await fetch("/api/workspace/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: state.workspaceChatId,
        folder_path: selectedWorkspaceDirectory(),
        character_id: el.workspaceAgentCharacter.value || null,
        messages: state.workspaceMessages,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Could not save workspace chat.");
    }
    const index = state.workspaceChats.findIndex((chat) => chat.id === payload.id);
    if (index >= 0) {
      state.workspaceChats[index] = payload;
    } else {
      state.workspaceChats.unshift(payload);
    }
    renderWorkspaceChatList();
  } catch (error) {
    appendWorkspaceLog(`Workspace chat save failed: ${error.message}`);
  }
}

function workspaceChatMessage(role, content) {
  return {
    role,
    content,
    timestamp: new Date().toISOString(),
  };
}

function selectedWorkspaceDirectory() {
  const statusText = el.workspacePathStatus?.textContent || "";
  let selected = state.workspaceSelectedPath || statusText.replace(/^Selected:\s*/i, "").trim();
  if (!selected || selected === "No folder selected." || selected === "Root Workspace") {
    return "";
  }
  const node = findWorkspaceNode(selected, state.workspaceTree);
  if ((node?.kind || state.workspaceSelectedKind) === "file") {
    const parts = selected.split("/").filter(Boolean);
    parts.pop();
    return parts.join("/");
  }
  return selected;
}

function findWorkspaceNode(path, nodes = []) {
  for (const node of nodes) {
    if (node.path === path) {
      return node;
    }
    const child = findWorkspaceNode(path, node.children || []);
    if (child) {
      return child;
    }
  }
  return null;
}

function workspaceAssistantPresentation(text) {
  const blocks = extractJsonBlocks(text);
  const tools = [];
  let visibleText = text;
  blocks.forEach((block) => {
    const blockTools = workspaceToolsFromPayload(block.value);
    if (!blockTools.length) {
      return;
    }
    tools.push(...blockTools);
    visibleText = visibleText.replace(block.raw, "");
  });
  visibleText = visibleText
    .replace(/```json\s*```/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { visibleText, tools };
}

function extractJsonBlocks(text) {
  const blocks = [];
  for (let index = 0; index < text.length; index += 1) {
    const opener = text[index];
    if (opener !== "{" && opener !== "[") {
      continue;
    }
    const closer = opener === "{" ? "}" : "]";
    const stack = [closer];
    let inString = false;
    let escaped = false;
    for (let cursor = index + 1; cursor < text.length; cursor += 1) {
      const char = text[cursor];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }
      if (char === '"') {
        inString = true;
      } else if (char === "{" || char === "[") {
        stack.push(char === "{" ? "}" : "]");
      } else if (char === stack[stack.length - 1]) {
        stack.pop();
        if (!stack.length) {
          const raw = text.slice(index, cursor + 1);
          try {
            blocks.push({ raw, value: JSON.parse(raw) });
            index = cursor;
          } catch {
            // Not a valid JSON block; keep scanning from the next character.
          }
          break;
        }
      }
    }
  }
  return blocks;
}

function workspaceToolsFromPayload(payload) {
  if (Array.isArray(payload)) {
    return payload.flatMap((item) => workspaceToolsFromPayload(item));
  }
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const candidates = [];
  if (payload.tool === "run_terminal_command" && payload.command) {
    candidates.push({
      action: "run_terminal_command",
      command: payload.command,
      target_dir: payload.target_dir || payload.cwd || "",
    });
  }
  if (payload.tool === "start_background_service" && payload.command) {
    candidates.push({
      action: "start_background_service",
      command: payload.command,
      service_name: payload.service_name || "",
      target_dir: payload.target_dir || payload.cwd || "",
    });
  }
  if (payload.tool === "run_automation_script") {
    const legacyEngine = String(payload.engine || "").toLowerCase();
    candidates.push({
      action: "execute_automation_task",
      engine: payload.engine || "",
      mode: payload.mode || (legacyEngine === "pyautogui" ? "desktop" : "stealth"),
      script_content: payload.script_content || payload.script || "",
      target_dir: payload.target_dir || payload.cwd || "",
    });
  }
  if (payload.tool === "execute_automation_task") {
    candidates.push({
      action: "execute_automation_task",
      mode: payload.mode || "",
      script_content: payload.script_content || payload.script || "",
      target_dir: payload.target_dir || payload.cwd || "",
    });
  }
  if (payload.tool === "send_automation_email") {
    candidates.push({
      action: "send_automation_email",
      to: payload.to || "",
    });
  }
  if (Array.isArray(payload.tools)) {
    candidates.push(...payload.tools);
  }
  if (Array.isArray(payload.workspace_tools)) {
    candidates.push(...payload.workspace_tools);
  }
  ["tool", "workspace_tool", "tool_call"].forEach((key) => {
    if (payload[key]) {
      candidates.push(payload[key]);
    }
  });
  if (payload.action) {
    candidates.push(payload);
  }
  return candidates
    .flatMap((candidate) => Array.isArray(candidate) ? workspaceToolsFromPayload(candidate) : [candidate])
    .filter((candidate) => candidate && typeof candidate === "object" && candidate.action)
    .map((candidate) => {
      const engine = String(candidate.engine || "");
      const action = candidate.action === "run_automation_script"
        ? "execute_automation_task"
        : String(candidate.action || "");
      const mode = String(
        candidate.mode ||
          (action === "execute_automation_task" && engine.toLowerCase() === "pyautogui"
            ? "desktop"
            : action === "execute_automation_task"
              ? "stealth"
              : "")
      );
      return {
        action,
        path: String(candidate.path || ""),
        command: String(candidate.command || ""),
        target_dir: String(candidate.target_dir || candidate.cwd || ""),
        service_name: String(candidate.service_name || ""),
        engine,
        mode,
        script_content: String(candidate.script_content || candidate.script || ""),
        to: String(candidate.to || ""),
      };
    });
}

function workspaceToolBadgeRow(tools) {
  const row = document.createElement("div");
  row.className = "workspace-tool-badge-row";
  tools.forEach((tool) => {
    const badge = document.createElement("span");
    badge.className = "workspace-tool-badge dynamic-status";
    const target =
      tool.path ||
      tool.command ||
      tool.target_dir ||
      tool.to ||
      tool.service_name ||
      tool.mode ||
      tool.engine ||
      "";
    badge.textContent = target
      ? `Tool: ${tool.action} -> ${target}`
      : `Tool: ${tool.action}`;
    row.appendChild(badge);
  });
  return row;
}

function workspacePendingTasksFromPayload(payload) {
  if (Array.isArray(payload.pending_tasks) && payload.pending_tasks.length) {
    return payload.pending_tasks;
  }
  return payload.pending_task ? [payload.pending_task] : [];
}

function appendWorkspaceApproval(message, task) {
  const article = document.createElement("article");
  article.className = "workspace-approval-banner";
  const description = document.createElement("p");
  const target =
    task.path ||
    task.command ||
    task.target_dir ||
    task.to ||
    task.service_name ||
    task.mode ||
    task.engine ||
    ".";
  description.textContent = `${message} Action: ${task.action} -> ${target}`;
  const actions = document.createElement("div");
  actions.className = "button-row compact-actions";
  const approve = document.createElement("button");
  approve.className = "primary-button";
  approve.type = "button";
  approve.dataset.workspaceApproval = "approve";
  approve.textContent = "Approve Task";
  const deny = document.createElement("button");
  deny.className = "secondary-button danger-button";
  deny.type = "button";
  deny.dataset.workspaceApproval = "deny";
  deny.textContent = "Deny Task";
  actions.append(approve, deny);
  article.append(description, actions);
  el.workspaceChatLog.appendChild(article);
  el.workspaceChatLog.scrollTop = el.workspaceChatLog.scrollHeight;
}

async function handleWorkspaceApprovalClick(event) {
  const button = event.target.closest("[data-workspace-approval]");
  if (!button || !state.workspacePendingTask) {
    return;
  }
  const approved = button.dataset.workspaceApproval === "approve";
  appendWorkspaceLog(approved ? "Approval released. Executing task." : "Task denied by user.");
  if (!approved) {
    state.workspacePendingTask = null;
    state.workspacePendingContext = [];
    button.closest(".workspace-approval-banner")?.remove();
    return;
  }
  const pendingTask = state.workspacePendingTask;
  const pendingContext = state.workspacePendingContext.length
    ? state.workspacePendingContext
    : state.workspaceMessages.slice();
  try {
    const response = await fetch("/api/workspace/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        workspaceAgentPayload("Execute approved workspace task.", {
          approved: true,
          pending_task: pendingTask || null,
          pending_tasks: pendingTask ? [pendingTask] : [],
          messages: pendingContext,
        })
      ),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || payload.message || "Approved workspace task failed.");
    }
    state.workspacePendingTask = null;
    state.workspacePendingContext = [];
    button.closest(".workspace-approval-banner")?.remove();
    handleWorkspaceAgentResponse(payload);
  } catch (error) {
    appendWorkspaceLog(`Approved task failed: ${error.message}`);
  }
}

function appendWorkspaceLog(text) {
  if (!text || !String(text).trim()) {
    return;
  }
  const cleanText = String(text).trim();
  const current = el.workspaceExecutionLog.textContent.trim();
  const next = `${current ? `${current}\n\n` : ""}${cleanText}`;
  el.workspaceExecutionLog.textContent = next;
  el.workspaceExecutionLog.scrollTop = el.workspaceExecutionLog.scrollHeight;
  appendWorkspaceActivity(cleanText);
}

function appendWorkspaceActivity(text) {
  if (!el.workspaceChatLog) {
    return;
  }
  const article = document.createElement("article");
  article.className = "workspace-message activity";
  const strong = document.createElement("strong");
  strong.textContent = "Activity";
  const pre = document.createElement("pre");
  pre.textContent = text.length > 2400 ? `${text.slice(0, 2400)}\n...[truncated]` : text;
  article.append(strong, pre);
  el.workspaceChatLog.appendChild(article);
  el.workspaceChatLog.scrollTop = el.workspaceChatLog.scrollHeight;
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
  renderSetupCloudModelControl();
  renderSetupModelList(state.localModels);
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

function catalogForProvider(provider, catalog = CLOUD_MODEL_CATALOG) {
  if (provider === "ollama" && catalog === CLOUD_MODEL_CATALOG) {
    const installed = (state.ollama?.models || []).map((model) => model.name).filter(Boolean);
    return [...new Set([...installed, ...(catalog.ollama || [])])];
  }
  if (provider === "ollama" && catalog === VISION_MODEL_CATALOG) {
    const installedVision = (state.ollama?.models || [])
      .filter((model) => isLikelyVisionOllamaModel(model.name, model))
      .map((model) => model.name)
      .filter(Boolean);
    return [...new Set([...installedVision, ...(catalog.ollama || [])])];
  }
  return catalog[provider] || catalog.custom || [];
}

function isLikelyVisionOllamaModel(name, model = {}) {
  const normalized = `${name || ""} ${model.family || ""} ${(model.capabilities || []).join(" ")}`.toLowerCase();
  return ["llava", "bakllava", "moondream", "vision", "vl", "qwen2.5vl"].some((needle) =>
    normalized.includes(needle)
  );
}

function populateModelSelector(select, input, provider, currentValue = "", catalog = CLOUD_MODEL_CATALOG) {
  const models = catalogForProvider(provider, catalog);
  const normalizedCurrent = String(currentValue || "").trim();
  select.innerHTML = "";

  const customOption = document.createElement("option");
  customOption.value = CUSTOM_MODEL_VALUE;
  customOption.textContent = "Custom Input...";
  select.appendChild(customOption);

  models.forEach((model) => {
    const option = document.createElement("option");
    option.value = model;
    option.textContent = model;
    select.appendChild(option);
  });

  const shouldUseCustom =
    provider === "custom" ||
    (normalizedCurrent && !models.includes(normalizedCurrent));
  select.value = shouldUseCustom ? CUSTOM_MODEL_VALUE : normalizedCurrent || models[0] || CUSTOM_MODEL_VALUE;
  input.classList.toggle("hidden", select.value !== CUSTOM_MODEL_VALUE);
  if (select.value === CUSTOM_MODEL_VALUE) {
    input.value = normalizedCurrent && !models.includes(normalizedCurrent) ? normalizedCurrent : "";
  } else {
    input.value = select.value;
  }
}

function handleModelSelectChange(select, input) {
  const custom = select.value === CUSTOM_MODEL_VALUE;
  input.classList.toggle("hidden", !custom);
  if (!custom) {
    input.value = select.value;
  } else {
    input.focus();
  }
}

function selectedModelValue(select, input) {
  if (select.value === CUSTOM_MODEL_VALUE) {
    return input.value.trim();
  }
  return select.value || input.value.trim();
}

function renderSetupCloudModelControl() {
  const provider = el.setupProviderType.value;
  populateModelSelector(
    el.setupCloudModelSelect,
    el.setupCustomModel,
    provider,
    el.setupCustomModel.value.trim()
  );
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

function setupApiProviderPayload() {
  const providerType = el.setupProviderType.value;
  const baseUrl =
    providerType === "openai"
      ? "https://api.openai.com/v1"
      : providerType === "openrouter"
        ? "https://openrouter.ai/api/v1"
        : providerType === "ollama"
          ? state.ollama.openai_base_url || "http://127.0.0.1:11434/v1"
          : el.baseUrl.value.trim() || "http://127.0.0.1:11434/v1";
  return {
    name: providerType === "ollama" ? "Ollama Local" : "First Cloud Profile",
    base_url: baseUrl,
    api_key: providerType === "ollama" ? "" : el.setupApiKey.value.trim(),
    default_model: setupSelectedCloudModel(),
    is_default: true,
    is_fallback: false,
  };
}

async function setupTestApi() {
  const payload = setupApiProviderPayload();
  if (!payload.api_key && payload.base_url.includes("api.openai.com")) {
    setupModelStatus("OpenAI validation requires an API key.");
    return;
  }
  el.setupTestApi.disabled = true;
  setupModelStatus("Testing API connection...");
  try {
    const result = await validateApiProviderPayload(payload);
    setupModelStatus(result.message || "API connection validated.");
  } catch (error) {
    setupModelStatus(error.message || "API connection failed.");
  } finally {
    el.setupTestApi.disabled = false;
  }
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

  const setupPayload = setupApiProviderPayload();
  if (!setupPayload.api_key && !setupPayload.base_url.includes("127.0.0.1")) {
    showSetupStep(2);
    return;
  }

  try {
    const testResult = await validateApiProviderPayload(setupPayload);
    setupModelStatus(testResult.message || "API profile validated.");
    const response = await fetch("/api/api-providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(setupPayload),
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
  setupModelStatus("Opening local GGUF picker...");
  try {
    const response = await fetch("/api/models/import-local", { method: "POST" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Could not import local model");
    }
    state.localModels = payload.models || [];
    state.downloadedModelNames = modelNameSet(state.localModels);
    renderSetupModelList(state.localModels);
    setupModelStatus(payload.message || "Local models scanned.");
    await refreshModels();
    return;
  } catch (error) {
    setupModelStatus(`${error.message}. Showing scanned storage models instead.`);
  }
  await refreshModels();
  renderSetupModelList(state.localModels);
  const count = state.localModels.length;
  setupModelStatus(
    count ? `Found ${count} local GGUF model${count === 1 ? "" : "s"}.` : "No GGUF models found yet."
  );
}

function setupSelectedCloudModel() {
  return selectedModelValue(el.setupCloudModelSelect, el.setupCustomModel);
}

function renderSetupModelList(models) {
  el.setupModelList.innerHTML = "";
  if (!models?.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state compact-empty";
    empty.textContent = "No local GGUF files found in storage/models/.";
    el.setupModelList.appendChild(empty);
    state.setupSelectedModelPath = "";
    return;
  }

  models.forEach((model, index) => {
    const label = document.createElement("label");
    label.className = "setup-model-option";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = model.path || model;
    input.checked = index === 0 && !state.setupSelectedModelPath;
    if (input.checked) {
      state.setupSelectedModelPath = input.value;
    }
    input.addEventListener("change", () => {
      el.setupModelList.querySelectorAll("input").forEach((item) => {
        if (item !== input) {
          item.checked = false;
        }
      });
      state.setupSelectedModelPath = input.checked ? input.value : "";
    });
    const copy = document.createElement("span");
    copy.textContent = model.relative_path
      ? `${model.relative_path} (${formatBytes(model.size_bytes)})`
      : String(model);
    label.append(input, copy);
    el.setupModelList.appendChild(label);
  });
}

async function setupLoadSelectedModel() {
  const selected =
    state.setupSelectedModelPath ||
    el.setupModelList.querySelector("input:checked")?.value ||
    "";
  if (!selected) {
    setupModelStatus("Select a scanned GGUF model first.");
    return;
  }
  el.localModelPath.value = selected;
  setupModelStatus("Loading selected model...");
  await loadModel();
  setupModelStatus("Load request completed. Check the Local Manager status.");
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
  const source = el.inferenceSource.value;
  const ggufMode = source === "local";
  const ollamaMode = source === "ollama";
  const cloudMode = source === "cloud";
  el.sidebarLocalModelPanel.classList.toggle("hidden", !ggufMode);
  el.sidebarOllamaPanel.classList.toggle("hidden", !ollamaMode);
  el.cloudPanel.classList.toggle("hidden", !cloudMode);
  setCloudFieldsEnabled(cloudMode);
  el.sourceBadge.textContent = ollamaMode ? "Ollama" : ggufMode ? "GGUF" : "Cloud";
  el.sourceBadge.classList.toggle("badge-local", ggufMode || ollamaMode);
  el.chatSubtitle.textContent = ollamaMode
    ? "Ollama Local"
    : ggufMode
      ? "Local GGUF Engine"
      : "Cloud API Mode";
  if (cloudMode) {
    applyActiveApiProviderToFields();
  }
  if (ollamaMode && !state.ollama.models.length) {
    loadOllamaStatus({ quiet: true });
  }
  syncQuickModelControls();
}

function setCloudFieldsEnabled(enabled) {
  document.querySelectorAll("[data-cloud-field]").forEach((field) => {
    field.disabled = !enabled;
  });
}

function updateCloudDefaults() {
  if (el.cloudProvider.value === "openrouter") {
    el.baseUrl.value = "https://openrouter.ai/api/v1";
  } else if (el.cloudProvider.value === "openai") {
    el.baseUrl.value = "https://api.openai.com/v1";
  } else if (el.cloudProvider.value === "ollama") {
    el.baseUrl.value = state.ollama.openai_base_url || "http://127.0.0.1:11434/v1";
    if (!el.apiProviderName.value.trim() || el.apiProviderName.value === "New Provider") {
      el.apiProviderName.value = "Ollama Local";
    }
  } else if (!el.baseUrl.value.trim()) {
    el.baseUrl.value = "http://127.0.0.1:11434/v1";
  }
  renderCloudModelControl();
  state.validatedApiProviderKey = "";
}

function renderCloudModelControl(currentValue = "") {
  const provider = el.cloudProvider?.value || "openai";
  populateModelSelector(
    el.cloudModelSelect,
    el.cloudModel,
    provider,
    currentValue || selectedModelValue(el.cloudModelSelect, el.cloudModel)
  );
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
    loadExtensionConfig();
    syncQuickModelControls();
  } catch (error) {
    state.apiProviders = [];
    renderApiProviderSelect();
    renderApiProviderList();
    renderSetupProviderOptions();
    syncQuickModelControls();
    setApiProviderStatus(error.message || "Could not load API providers.");
  }
}

async function loadOllamaStatus(options = {}) {
  if (!el.ollamaStatusText) {
    return;
  }
  if (!options.quiet) {
    setOllamaStatus("Checking local Ollama runtime...", "Checking");
  }
  try {
    const response = await fetch("/api/ollama/status");
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Could not check Ollama.");
    }
    state.ollama = {
      running: Boolean(data.running),
      base_url: data.base_url || "http://127.0.0.1:11434",
      openai_base_url: data.openai_base_url || "http://127.0.0.1:11434/v1",
      models: data.models || [],
      message: data.message || "",
    };
    renderOllamaPanel();
    if (el.cloudProvider.value === "ollama") {
      renderCloudModelControl();
    }
    renderVisionModelControl();
  } catch (error) {
    state.ollama.running = false;
    state.ollama.models = [];
    state.ollama.message = error.message || "Ollama status check failed.";
    renderOllamaPanel();
  }
}

function renderOllamaPanel() {
  if (!el.ollamaStatusText || !el.ollamaModelSelect || !el.sidebarOllamaModelSelect) {
    return;
  }
  el.ollamaStatusBadge.textContent = state.ollama.running ? "Running" : "Offline";
  el.ollamaStatusBadge.classList.toggle("badge-local", state.ollama.running);
  el.sidebarOllamaDot.classList.toggle("loaded", state.ollama.running);
  el.ollamaStatusText.textContent =
    state.ollama.message ||
    (state.ollama.running ? "Ollama is available." : "Ollama is not running.");
  el.sidebarOllamaStatusText.textContent =
    state.ollama.message ||
    (state.ollama.running ? "Ollama is available." : "Ollama is not running.");
  if (!state.ollamaSelectedModel && state.ollama.models.length) {
    state.ollamaSelectedModel = state.ollama.models[0].name;
  }
  populateOllamaModelSelect(el.ollamaModelSelect);
  populateOllamaModelSelect(el.sidebarOllamaModelSelect);
  renderOllamaSelectedModel();
  el.useOllamaProvider.disabled = !state.ollama.running || !state.ollama.models.length;
  el.sidebarUseOllamaLocal.disabled = !state.ollama.running || !state.ollama.models.length;
  el.ollamaInlineStatus.textContent = state.ollama.running
    ? "Register Ollama as a saved provider profile, or pull another model."
    : "Start Ollama, then click Detect.";
  el.sidebarOllamaInlineStatus.textContent = state.ollama.running
    ? "Pick an installed model and chat locally through Ollama."
    : "Start Ollama, then click Detect.";
  if (state.ollama.models.length && selectedOllamaModel()) {
    loadOllamaModelDetail(selectedOllamaModel());
  }
}

function setOllamaStatus(message, badge = "") {
  if (el.ollamaStatusText) {
    el.ollamaStatusText.textContent = message;
  }
  if (el.ollamaInlineStatus) {
    el.ollamaInlineStatus.textContent = message;
  }
  if (el.sidebarOllamaInlineStatus) {
    el.sidebarOllamaInlineStatus.textContent = message;
  }
  if (badge && el.ollamaStatusBadge) {
    el.ollamaStatusBadge.textContent = badge;
  }
}

function populateOllamaModelSelect(select) {
  if (!select) {
    return;
  }
  const selected = selectedOllamaModel();
  select.innerHTML = "";
  if (!state.ollama.models.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = state.ollama.running ? "No models installed" : "Ollama offline";
    select.appendChild(option);
    return;
  }
  state.ollama.models.forEach((model) => {
    const option = document.createElement("option");
    option.value = model.name;
    const details = [model.parameter_size, model.quantization_level, formatBytes(model.size_bytes)]
      .filter(Boolean)
      .join(" - ");
    option.textContent = details ? `${model.name} (${details})` : model.name;
    select.appendChild(option);
  });
  select.value = state.ollama.models.some((model) => model.name === selected)
    ? selected
    : state.ollama.models[0].name;
}

function selectedOllamaModel() {
  return (
    state.ollamaSelectedModel ||
    el.sidebarOllamaModelSelect?.value ||
    el.ollamaModelSelect?.value ||
    state.ollama.models[0]?.name ||
    ""
  );
}

function setOllamaSelectedModel(modelName, options = {}) {
  state.ollamaSelectedModel = modelName || "";
  [el.ollamaModelSelect, el.sidebarOllamaModelSelect].forEach((select) => {
    if (select && Array.from(select.options).some((option) => option.value === state.ollamaSelectedModel)) {
      select.value = state.ollamaSelectedModel;
    }
  });
  renderOllamaSelectedModel();
  syncQuickModelControls();
  if (options.loadDetail && state.ollamaSelectedModel) {
    loadOllamaModelDetail(state.ollamaSelectedModel);
  }
}

function renderOllamaSelectedModel(detail = null) {
  if (!el.ollamaCapabilityBadges || !el.ollamaModelMeta) {
    return;
  }
  const selectedName = selectedOllamaModel();
  const model = state.ollama.models.find((item) => item.name === selectedName);
  [el.ollamaCapabilityBadges, el.sidebarOllamaCapabilityBadges].forEach((container) => {
    if (container) {
      container.innerHTML = "";
    }
  });
  if (!model) {
    const emptyText = state.ollama.running
      ? "Choose an installed model to inspect capabilities."
      : "Start Ollama, then click Detect.";
    el.ollamaModelMeta.textContent = emptyText;
    el.sidebarOllamaModelMeta.textContent = emptyText;
    return;
  }

  capabilityLabelsForOllama(model, detail).forEach((label) => {
    [el.ollamaCapabilityBadges, el.sidebarOllamaCapabilityBadges].forEach((container) => {
      if (!container) {
        return;
      }
      const chip = document.createElement("span");
      chip.className = "ollama-chip";
      chip.textContent = label;
      container.appendChild(chip);
    });
  });

  const meta = [
    model.loaded ? "Loaded in memory" : "Installed",
    model.parameter_size || "",
    model.quantization_level || "",
    model.family ? `${model.family} family` : "",
    model.context_length ? `${Number(model.context_length).toLocaleString()} ctx` : "",
    model.size_bytes ? `${formatBytes(model.size_bytes)} disk` : "",
    model.size_vram_bytes ? `${formatBytes(model.size_vram_bytes)} VRAM` : "",
    model.expires_at ? `expires ${formatDateTime(model.expires_at)}` : "",
  ].filter(Boolean);
  const detailBits = detail
    ? [
        detail.model_info && Object.keys(detail.model_info).length
          ? `${Object.keys(detail.model_info).length} metadata fields`
          : "",
        detail.template ? "template available" : "",
      ].filter(Boolean)
    : [];
  const text = [...meta, ...detailBits].join(" - ") || model.name;
  el.ollamaModelMeta.textContent = text;
  el.sidebarOllamaModelMeta.textContent = text;
}

function capabilityLabelsForOllama(model, detail = null) {
  const labels = new Set();
  if (model.loaded) {
    labels.add("Loaded");
  }
  (model.capabilities || []).forEach((capability) => labels.add(capability));
  (detail?.capabilities || []).forEach((capability) => labels.add(capability));
  if (isLikelyVisionOllamaModel(model.name, model)) {
    labels.add("vision");
  }
  if ((model.capabilities || []).includes("tools")) {
    labels.add("tools");
  }
  if (!labels.size) {
    labels.add("chat");
  }
  return [...labels].slice(0, 7);
}

async function loadOllamaModelDetail(modelName) {
  if (!modelName || !state.ollama.running) {
    return;
  }
  try {
    const response = await fetch(`/api/ollama/show/${encodeURIComponent(modelName)}`);
    const detail = await response.json();
    if (!response.ok) {
      throw new Error(detail.detail || detail.message || "Could not load model metadata.");
    }
    if (selectedOllamaModel() === modelName) {
      renderOllamaSelectedModel(detail);
    }
  } catch (error) {
    if (selectedOllamaModel() === modelName && el.ollamaModelMeta) {
      const current = el.ollamaModelMeta.textContent || modelName;
      el.ollamaModelMeta.textContent = `${current} - metadata unavailable`;
      el.sidebarOllamaModelMeta.textContent = `${current} - metadata unavailable`;
    }
  }
}

async function pullOllamaModel() {
  const model = el.ollamaPullModel.value.trim();
  if (!model) {
    setOllamaStatus("Enter an Ollama model name to pull.", "Required");
    return;
  }
  el.pullOllamaModel.disabled = true;
  setOllamaStatus(`Pulling ${model}. This can take a while...`, "Pulling");
  resetOllamaPullProgress();
  try {
    const response = await fetch("/api/ollama/pull", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model }),
    });
    const payload = await response.json();
    if (!response.ok || payload.status === "error") {
      throw new Error(payload.detail || payload.message || "Ollama pull failed.");
    }
    startOllamaPullProgress(payload.job_id, model);
  } catch (error) {
    setOllamaStatus(error.message || "Ollama pull failed.", "Error");
    el.pullOllamaModel.disabled = false;
    updateOllamaPullProgress({ status: "error", message: error.message || "Ollama pull failed." });
  }
}

function resetOllamaPullProgress() {
  if (state.ollamaPullSource) {
    state.ollamaPullSource.close();
    state.ollamaPullSource = null;
  }
  if (el.ollamaPullProgress) {
    el.ollamaPullProgress.classList.remove("hidden");
  }
  if (el.ollamaPullProgressBar) {
    el.ollamaPullProgressBar.style.width = "0%";
  }
  if (el.ollamaPullProgressText) {
    el.ollamaPullProgressText.textContent = "Starting Ollama pull...";
  }
}

function startOllamaPullProgress(jobId, model) {
  if (!jobId) {
    updateOllamaPullProgress({ status: "error", message: "Ollama pull job did not return an id." });
    el.pullOllamaModel.disabled = false;
    return;
  }
  const source = new EventSource(`/api/ollama/pull/progress?job_id=${encodeURIComponent(jobId)}`);
  state.ollamaPullSource = source;
  source.onmessage = async (event) => {
    const payload = JSON.parse(event.data || "{}");
    updateOllamaPullProgress(payload);
    if (payload.status === "completed" || payload.status === "error") {
      source.close();
      state.ollamaPullSource = null;
      el.pullOllamaModel.disabled = false;
      if (payload.status === "completed") {
        setOllamaStatus(payload.message || `Pulled ${model}.`, "Ready");
        await loadOllamaStatus({ quiet: true });
        el.ollamaModelSelect.value = model;
        renderOllamaSelectedModel();
      } else {
        setOllamaStatus(payload.message || "Ollama pull failed.", "Error");
      }
    }
  };
  source.onerror = () => {
    source.close();
    state.ollamaPullSource = null;
    el.pullOllamaModel.disabled = false;
    updateOllamaPullProgress({
      status: "error",
      message: "Lost connection to Ollama pull progress stream.",
    });
  };
}

function updateOllamaPullProgress(payload) {
  if (!el.ollamaPullProgress || !el.ollamaPullProgressBar || !el.ollamaPullProgressText) {
    return;
  }
  el.ollamaPullProgress.classList.remove("hidden");
  const percent = Number(payload.percent || 0);
  const clamped = Math.max(0, Math.min(100, percent));
  el.ollamaPullProgressBar.style.width = `${clamped}%`;
  const completed = Number(payload.completed_bytes || 0);
  const total = payload.total_bytes ? Number(payload.total_bytes) : null;
  const bytes = total
    ? `${formatBytes(completed)} / ${formatBytes(total)}`
    : completed
      ? formatBytes(completed)
      : "";
  const message = payload.message || "Pulling model...";
  const label = payload.status === "completed" ? "100%" : `${clamped.toFixed(1)}%`;
  el.ollamaPullProgressText.textContent = `${label}${bytes ? ` - ${bytes}` : ""} - ${message}`;
  if (payload.status === "error") {
    el.ollamaPullProgressText.textContent = payload.message || "Ollama pull failed.";
  }
}

async function useOllamaProvider() {
  const model = selectedOllamaModel();
  if (!model) {
    setOllamaStatus("Choose an installed Ollama model first.", "Required");
    return;
  }
  el.useOllamaProvider.disabled = true;
  setOllamaStatus(`Registering Ollama with ${model}...`, "Saving");
  try {
    const response = await fetch("/api/ollama/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, name: "Ollama Local", is_default: true }),
    });
    const saved = await response.json();
    if (!response.ok) {
      throw new Error(saved.detail || "Could not register Ollama provider.");
    }
    state.activeApiProviderId = saved.id;
    state.editingApiProviderId = saved.id;
    el.inferenceSource.value = "cloud";
    await loadApiProviders();
    updateInferenceVisibility();
    setOllamaStatus(`Ollama is active with ${model}.`, "Active");
    setApiProviderStatus(`Ollama Local saved with ${model}.`);
  } catch (error) {
    setOllamaStatus(error.message || "Could not register Ollama.", "Error");
  } finally {
    el.useOllamaProvider.disabled = !state.ollama.running || !state.ollama.models.length;
  }
}

function useOllamaLocalRuntime() {
  const model = selectedOllamaModel();
  if (!state.ollama.running) {
    setOllamaStatus("Start Ollama, then click Detect.", "Offline");
    return;
  }
  if (!model) {
    setOllamaStatus("Choose an installed Ollama model first.", "Required");
    return;
  }
  el.inferenceSource.value = "ollama";
  state.ollamaSelectedModel = model;
  updateInferenceVisibility();
  setOllamaStatus(`Ollama local chat is ready with ${model}.`, "Local");
  syncQuickModelControls();
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
  renderQuickApiProviderSelect();
  renderExtensionApiProviderSelects();
}

function renderQuickApiProviderSelect() {
  if (!el.quickApiProvider) {
    return;
  }
  el.quickApiProvider.innerHTML = "";
  if (!state.apiProviders.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No cloud profile";
    el.quickApiProvider.appendChild(option);
    return;
  }
  state.apiProviders.forEach((provider) => {
    const option = document.createElement("option");
    option.value = provider.id;
    option.textContent = provider.is_default ? `${provider.name} (Default)` : provider.name;
    el.quickApiProvider.appendChild(option);
  });
  el.quickApiProvider.value = state.activeApiProviderId || defaultApiProvider()?.id || "";
}

function renderExtensionApiProviderSelects() {
  [el.imageApiProvider, el.visionApiProvider].forEach((select) => {
    if (!select) {
      return;
    }
    const current = select.value;
    select.innerHTML = '<option value="">Use chat default</option>';
    state.apiProviders.forEach((provider) => {
      const option = document.createElement("option");
      option.value = provider.id;
      option.textContent = provider.name;
      select.appendChild(option);
    });
    if ([...select.options].some((option) => option.value === current)) {
      select.value = current;
    }
  });
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
    const badges = [
      provider.is_default ? "Default" : "",
      provider.is_fallback ? "Fallback" : "",
    ].filter(Boolean);
    meta.textContent = `${provider.default_model} - ${provider.base_url}${
      badges.length ? ` - ${badges.join(" / ")}` : ""
    }`;
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
  syncQuickModelControls();
}

function newApiProviderDraft() {
  state.editingApiProviderId = null;
  el.apiProviderSelect.value = "";
  el.apiProviderName.value = "New Provider";
  el.cloudProvider.value = "openrouter";
  el.baseUrl.value = "https://openrouter.ai/api/v1";
  renderCloudModelControl("deepseek/deepseek-chat");
  el.apiKey.value = "";
  el.apiKey.placeholder = "API key";
  el.apiProviderDefault.checked = !state.apiProviders.length;
  el.apiProviderFallback.checked = false;
  state.validatedApiProviderKey = "";
  setApiProviderStatus("New provider draft.");
}

function setApiProviderEditor(provider) {
  state.editingApiProviderId = provider.id;
  el.apiProviderName.value = provider.name;
  el.cloudProvider.value = inferCloudProvider(provider.base_url);
  el.baseUrl.value = provider.base_url;
  renderCloudModelControl(provider.default_model);
  el.apiKey.value = "";
  el.apiKey.placeholder = provider.api_key
    ? "Saved securely. Leave blank to keep it."
    : inferCloudProvider(provider.base_url) === "ollama"
      ? "No API key needed for local Ollama"
      : "API key";
  el.apiProviderDefault.checked = Boolean(provider.is_default);
  el.apiProviderFallback.checked = Boolean(provider.is_fallback);
  state.validatedApiProviderKey = "";
}

function apiProviderPayload() {
  const model = selectedModelValue(el.cloudModelSelect, el.cloudModel).trim();
  const editingProvider = state.apiProviders.find(
    (provider) => provider.id === state.editingApiProviderId
  );
  const requestedName = el.apiProviderName.value.trim() || "API Provider";
  const shouldCreateNewSlot =
    editingProvider &&
    editingProvider.name.trim().toLowerCase() !== requestedName.toLowerCase();
  return {
    id: shouldCreateNewSlot ? null : state.editingApiProviderId,
    name: requestedName,
    base_url: el.baseUrl.value.trim(),
    api_key: el.apiKey.value.trim(),
    default_model: model,
    is_default: el.apiProviderDefault.checked,
    is_fallback: el.apiProviderFallback.checked,
  };
}

async function saveApiProvider() {
  const payload = apiProviderPayload();
  if (!payload.default_model) {
    setApiProviderStatus("Select a model or use Custom Input before saving.");
    return;
  }
  el.saveApiProvider.disabled = true;
  setApiProviderStatus("Testing provider before save.");
  try {
    await validateApiProviderPayload(payload);
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
    syncQuickModelControls();
    setApiProviderStatus(`Saved ${saved.name}.`);
  } catch (error) {
    setApiProviderStatus(error.message || "Could not save provider.");
  } finally {
    el.saveApiProvider.disabled = false;
  }
}

async function testApiProvider() {
  const payload = apiProviderPayload();
  if (!payload.default_model) {
    setApiProviderStatus("Select a model or use Custom Input before testing.");
    return;
  }
  el.testApiProvider.disabled = true;
  setApiProviderStatus("Testing API connection.");
  try {
    const result = await validateApiProviderPayload(payload);
    setApiProviderStatus(result.message || "Connection validated.");
  } catch (error) {
    setApiProviderStatus(error.message || "Connection test failed.");
  } finally {
    el.testApiProvider.disabled = false;
  }
}

async function validateApiProviderPayload(payload) {
  const key = apiProviderValidationKey(payload);
  if (state.validatedApiProviderKey === key) {
    return { ok: true, message: "Connection already validated for these fields." };
  }
  const response = await fetch("/api/api-providers/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) {
    throw new Error(result.message || result.detail || "Connection validation failed.");
  }
  state.validatedApiProviderKey = key;
  return result;
}

function apiProviderValidationKey(payload) {
  return [
    payload.base_url,
    payload.default_model,
    payload.api_key ? "keyed" : "no-key",
  ].join("|");
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
    syncQuickModelControls();
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
    api_key: "",
    default_model: provider.default_model,
    is_default: true,
    is_fallback: Boolean(provider.is_fallback),
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
    syncQuickModelControls();
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

function syncQuickModelControls() {
  if (!el.quickInferenceSource || !el.quickModelLabel) {
    return;
  }
  const source = el.inferenceSource.value;
  el.quickInferenceSource.value = source;
  renderQuickApiProviderSelect();
  const ggufMode = source === "local";
  const ollamaMode = source === "ollama";
  el.quickApiProvider.classList.toggle("hidden", ggufMode || ollamaMode);
  el.quickApiProvider.disabled = ggufMode || ollamaMode || !state.apiProviders.length;
  if (ggufMode) {
    const status = el.sidebarModelStatus?.textContent?.trim() || "";
    const selected = el.sidebarLocalModelPath?.selectedOptions?.[0]?.textContent || "";
    el.quickModelLabel.textContent = status && status !== "No model loaded"
      ? status
      : selected || "No local model loaded";
  } else if (ollamaMode) {
    const model = selectedOllamaModel();
    el.quickModelLabel.textContent = model
      ? `${model} via Ollama`
      : state.ollama.running
        ? "No Ollama model installed"
        : "Ollama offline";
  } else {
    const provider = activeApiProvider();
    el.quickModelLabel.textContent = provider
      ? `${provider.default_model} via ${provider.name}`
      : `${selectedModelValue(el.cloudModelSelect, el.cloudModel) || "No model"} via manual cloud`;
  }
}

function applyApiProviderToFields(provider) {
  el.cloudProvider.value = inferCloudProvider(provider.base_url);
  el.baseUrl.value = provider.base_url;
  renderCloudModelControl(provider.default_model);
  el.apiKey.value = "";
  el.apiKey.placeholder = provider.api_key
    ? "Saved securely. Leave blank to keep it."
    : inferCloudProvider(provider.base_url) === "ollama"
      ? "No API key needed for local Ollama"
      : "API key";
  el.apiProviderDefault.checked = Boolean(provider.is_default);
  el.apiProviderFallback.checked = Boolean(provider.is_fallback);
}

function activeApiProvider() {
  return (
    state.apiProviders.find((provider) => provider.id === state.activeApiProviderId) ||
    defaultApiProvider()
  );
}

function extensionApiProvider(kind) {
  const id = kind === "image" ? el.imageApiProvider?.value : el.visionApiProvider?.value;
  return state.apiProviders.find((provider) => provider.id === id) || activeApiProvider();
}

function applyExtensionApiProfileDefaults(kind) {
  const provider = extensionApiProvider(kind);
  if (!provider) {
    return;
  }
  const inferred = inferCloudProvider(provider.base_url);
  const baseUrl = provider.base_url.replace(/\/$/, "");
  if (kind === "image") {
    if (["openai", "openrouter", "custom"].includes(inferred)) {
      el.imageProvider.value = inferred === "custom" ? "openai" : inferred;
    }
    if (!el.imageModel.value.trim()) {
      el.imageModel.value = provider.default_model || "";
    }
    el.imageEndpoint.value = `${baseUrl}/images/generations`;
    return;
  }
  if (inferred === "ollama") {
    el.visionProvider.value = "ollama";
    renderVisionModelControl(provider.default_model || "");
    el.visionEndpoint.value = `${ollamaNativeBaseUrl(provider.base_url)}/api/generate`;
    return;
  }
  if (["openai", "openrouter", "custom"].includes(inferred)) {
    el.visionProvider.value = inferred;
  }
  renderVisionModelControl(provider.default_model || "");
  el.visionEndpoint.value = `${baseUrl}/chat/completions`;
}

function extensionEndpoint(kind, provider = extensionApiProvider(kind)) {
  const field = kind === "image" ? el.imageEndpoint : el.visionEndpoint;
  const existing = field?.value?.trim() || "";
  if (existing) {
    return existing;
  }
  if (!provider?.base_url) {
    return "";
  }
  if (kind === "vision" && inferCloudProvider(provider.base_url) === "ollama") {
    const derived = `${ollamaNativeBaseUrl(provider.base_url)}/api/generate`;
    if (field) {
      field.value = derived;
    }
    return derived;
  }
  const suffix = kind === "image" ? "/images/generations" : "/chat/completions";
  const derived = `${provider.base_url.replace(/\/$/, "")}${suffix}`;
  if (field) {
    field.value = derived;
  }
  return derived;
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
  if (
    normalized.includes("ollama") ||
    normalized.startsWith("http://127.0.0.1:11434") ||
    normalized.startsWith("http://localhost:11434")
  ) {
    return "ollama";
  }
  return "custom";
}

function ollamaNativeBaseUrl(baseUrl) {
  const normalized = String(baseUrl || "http://127.0.0.1:11434").replace(/\/$/, "");
  return normalized.endsWith("/v1") ? normalized.slice(0, -3).replace(/\/$/, "") : normalized;
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
  const previousSidebarSelection = el.sidebarLocalModelPath.value;
  try {
    const response = await fetch("/api/models/local");
    const data = await response.json();
    const models = data.models || [];
    state.localModels = models;
    state.downloadedModelNames = modelNameSet(models);
    populateLocalModelSelect(el.localModelPath, models);
    populateLocalModelSelect(el.sidebarLocalModelPath, models);

    if (data.status?.loaded && data.status.model_path) {
      el.localModelPath.value = data.status.model_path;
      el.sidebarLocalModelPath.value = data.status.model_path;
    } else if (previousSelection) {
      el.localModelPath.value = previousSelection;
      el.sidebarLocalModelPath.value = previousSidebarSelection || previousSelection;
    }
    renderModelStatus(data.status);
    if (state.lastHfFiles.length) {
      renderHfResults(state.lastHfRepoId, state.lastHfFiles);
    }
  } catch (error) {
    setModelStatus(error.message || "Model scan failed", false);
    setSidebarModelError(error.message || "Model scan failed.");
  }
}

function populateLocalModelSelect(select, models) {
  select.innerHTML = "";
  if (!models.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No GGUF files found";
    select.appendChild(option);
    return;
  }
  models.forEach((model) => {
    const option = document.createElement("option");
    option.value = model.path || model;
    option.textContent = model.relative_path
      ? `${model.relative_path} (${formatBytes(model.size_bytes)})`
      : String(model);
    select.appendChild(option);
  });
}

async function loadChatSessions() {
  if (!state.activeCharacter?.id) {
    state.chatSessions = [];
    renderChatHistorySelect();
    renderChatHistoryShelf();
    return [];
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
    renderChatHistoryShelf();
    return state.chatSessions;
  } catch {
    state.chatSessions = [];
    renderChatHistorySelect();
    renderChatHistoryShelf();
    return [];
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
  if (!el.chatHistorySelect) {
    return;
  }
  const previous = state.activeChatId || "";
  el.chatHistorySelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = state.activeCharacter?.id ? "Past Chats" : "Select a character first";
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

function renderChatHistoryShelf() {
  el.chatHistoryShelf.innerHTML = "";
  if (!state.activeCharacter?.id) {
    const empty = document.createElement("div");
    empty.className = "empty-state compact-empty";
    empty.textContent = "Select a character to see timelines.";
    el.chatHistoryShelf.appendChild(empty);
    return;
  }
  if (!state.chatSessions.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state compact-empty";
    empty.textContent = "No saved timelines yet.";
    el.chatHistoryShelf.appendChild(empty);
    return;
  }
  state.chatSessions.forEach((session) => {
    const button = document.createElement("button");
    button.className = "history-row";
    button.type = "button";
    if (session.id === state.activeChatId) {
      button.classList.add("active");
    }
    const title = document.createElement("span");
    title.className = "history-title";
    title.textContent = session.title || "Untitled Chat";
    const meta = document.createElement("span");
    meta.className = "history-meta";
    meta.textContent = `${session.messages?.length || 0} messages - ${formatDateTime(session.updated_at)}`;
    button.append(title, meta);
    button.addEventListener("click", () => loadChatSession(session));
    el.chatHistoryShelf.appendChild(button);
  });
}

function toggleHistoryShelf() {
  const collapsed = el.chatHistoryShelf.classList.toggle("hidden");
  el.toggleHistoryShelf.textContent = collapsed ? "Show" : "Hide";
  el.toggleHistoryShelf.setAttribute("aria-expanded", String(!collapsed));
}

function startNewChat() {
  if (!state.activeCharacter?.id) {
    renderNoCharacterPlaceholder();
    return;
  }
  if (state.messages.length) {
    state.pendingNewChat = true;
    openModal(el.newChatModal, el.confirmNewChat);
    return;
  }
  beginFreshChatBranch();
}

async function confirmStartNewChat() {
  el.confirmNewChat.disabled = true;
  try {
    await persistActiveChat();
    beginFreshChatBranch();
    await loadChatSessions();
  } finally {
    el.confirmNewChat.disabled = false;
    state.pendingNewChat = false;
    closeModal(el.newChatModal);
  }
}

function cancelStartNewChat() {
  state.pendingNewChat = false;
  closeModal(el.newChatModal);
}

function beginFreshChatBranch() {
  state.activeChatId = null;
  resetChatSettingsToGlobal();
  if (el.chatHistorySelect) {
    el.chatHistorySelect.value = "";
  }
  state.selectedMessageIds.clear();
  state.editingMessageId = null;
  resetChatToFirstMessage();
  renderChatHistorySelect();
  renderChatHistoryShelf();
}

async function loadSelectedChat() {
  if (!el.chatHistorySelect) {
    return;
  }
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
    loadChatSession(session);
  } catch (error) {
    console.error(error);
  }
}

function loadChatSession(session) {
  state.activeChatId = session.id;
  applyChatSettingsFromSession(session);
  state.messages = normalizeSessionMessages(session.messages || []);
  state.selectedMessageIds.clear();
  state.editingMessageId = null;
  renderSessionMessages();
  renderChatHistorySelect();
  renderChatHistoryShelf();
}

function resetChatSettingsToGlobal() {
  state.chatSettings = {
    persona_id: null,
    lorebook_id: null,
    lorebook_enabled: null,
    chat_summary: "",
    auto_summary_enabled: false,
    summary_message_count: 10,
  };
}

function applyChatSettingsFromSession(session = {}) {
  state.chatSettings = {
    persona_id: session.persona_id || null,
    lorebook_id: session.lorebook_id || null,
    lorebook_enabled:
      session.lorebook_enabled === null || session.lorebook_enabled === undefined
        ? null
        : Boolean(session.lorebook_enabled),
    chat_summary: session.chat_summary || "",
    auto_summary_enabled: Boolean(session.auto_summary_enabled),
    summary_message_count: Number(session.summary_message_count || 10),
  };
}

function effectivePersonaId() {
  return state.chatSettings.persona_id || state.activePersona?.id || null;
}

function effectiveLorebookId() {
  return state.chatSettings.lorebook_id || state.activeLorebook?.id || null;
}

function effectiveLorebookEnabled() {
  if (state.chatSettings.lorebook_enabled !== null) {
    return Boolean(state.chatSettings.lorebook_enabled && effectiveLorebookId());
  }
  return Boolean(state.activeLorebook?.id && state.lorebookEnabled);
}

function effectiveChatSummary() {
  return state.chatSettings.chat_summary || "";
}

function openChatSettings() {
  renderChatSettingsControls();
  openModal(el.chatSettingsModal, el.chatPersonaSelect);
}

function renderChatSettingsControls() {
  el.chatPersonaSelect.innerHTML = "";
  const globalPersona = document.createElement("option");
  globalPersona.value = "";
  globalPersona.textContent = state.activePersona?.name
    ? `Use global default (${state.activePersona.name})`
    : "Use global default (No Persona)";
  el.chatPersonaSelect.appendChild(globalPersona);
  state.personas.forEach((persona) => {
    const option = document.createElement("option");
    option.value = persona.id;
    option.textContent = persona.is_default ? `${persona.name} (Default)` : persona.name;
    el.chatPersonaSelect.appendChild(option);
  });
  el.chatPersonaSelect.value = state.chatSettings.persona_id || "";

  el.chatLorebookSelect.innerHTML = "";
  const globalLorebook = document.createElement("option");
  globalLorebook.value = "";
  globalLorebook.textContent = state.activeLorebook?.name
    ? `Use global default (${state.activeLorebook.name})`
    : "Use global default (No Lorebook)";
  el.chatLorebookSelect.appendChild(globalLorebook);
  state.lorebooks.forEach((lorebook) => {
    const option = document.createElement("option");
    option.value = lorebook.id;
    option.textContent = lorebook.active ? lorebook.name : `${lorebook.name} (Disabled)`;
    el.chatLorebookSelect.appendChild(option);
  });
  el.chatLorebookSelect.value = state.chatSettings.lorebook_id || "";
  el.chatLorebookEnabled.checked =
    state.chatSettings.lorebook_enabled === null
      ? Boolean(state.activeLorebook?.id && state.lorebookEnabled)
      : Boolean(state.chatSettings.lorebook_enabled);
  el.chatSummaryText.value = state.chatSettings.chat_summary || "";
  el.chatAutoSummaryEnabled.checked = Boolean(state.chatSettings.auto_summary_enabled);
  el.chatSummaryCount.value = String(state.chatSettings.summary_message_count || 10);
  renderChatGallery();
  el.chatSettingsStatus.textContent = state.activeChatId
    ? "These overrides will be saved with this timeline."
    : "These overrides will be saved when this timeline is first written.";
}

async function saveChatSettings() {
  state.chatSettings = {
    persona_id: el.chatPersonaSelect.value || null,
    lorebook_id: el.chatLorebookSelect.value || null,
    lorebook_enabled: el.chatLorebookEnabled.checked,
    chat_summary: el.chatSummaryText.value.trim(),
    auto_summary_enabled: el.chatAutoSummaryEnabled.checked,
    summary_message_count: Number(el.chatSummaryCount.value) || 10,
  };
  const saved = await persistActiveChat();
  el.chatSettingsStatus.textContent = saved
    ? "Chat settings applied."
    : "Chat settings staged for the next saved message.";
  window.setTimeout(() => closeModal(el.chatSettingsModal), 500);
}

async function autoSummarizeChat(options = {}) {
  const silent = Boolean(options.silent);
  const count = Math.max(1, Math.min(Number(el.chatSummaryCount.value) || 10, 100));
  const sourceMessages = serializeMessagesForBackend(state.messages).slice(-count);
  if (!sourceMessages.length) {
    if (!silent) {
      el.chatSettingsStatus.textContent = "No messages available to summarize.";
    }
    return;
  }
  if (!silent) {
    el.autoSummarizeChat.disabled = true;
    el.chatSettingsStatus.textContent = `Summarizing the last ${sourceMessages.length} messages.`;
  }
  try {
    const uiSource = el.inferenceSource.value;
    const source = backendInferenceSource(uiSource);
    const body = {
      source,
      messages: sourceMessages,
      count,
      local: {
        template: el.promptTemplate.value,
      },
      max_tokens: 700,
    };
    applyCloudSettingsForUiSource(body, uiSource);
    const response = await fetch("/api/chat/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.detail || "Auto-summary failed.");
    }
    el.chatSummaryText.value = payload.summary || "";
    state.chatSettings.chat_summary = el.chatSummaryText.value.trim();
    state.chatSettings.summary_message_count = count;
    if (!silent) {
      el.chatSettingsStatus.textContent = `Summary updated from ${payload.message_count || sourceMessages.length} messages.`;
    }
  } catch (error) {
    if (!silent) {
      el.chatSettingsStatus.textContent = error.message || "Auto-summary failed.";
    } else {
      console.warn("Auto-summary failed:", error);
    }
  } finally {
    if (!silent) {
      el.autoSummarizeChat.disabled = false;
    }
  }
}

async function maybeAutoSummarizeChat() {
  if (!state.chatSettings.auto_summary_enabled) {
    return;
  }
  await autoSummarizeChat({ silent: true });
  await persistActiveChat();
}

async function clearChatSettings() {
  resetChatSettingsToGlobal();
  renderChatSettingsControls();
  const saved = await persistActiveChat();
  el.chatSettingsStatus.textContent = saved
    ? "This chat now follows the global persona and lorebook."
    : "This chat will use global defaults when it is saved.";
}

function renderChatGallery() {
  if (!el.chatGalleryGrid) {
    return;
  }
  const images = chatGalleryImages();
  el.chatGalleryGrid.innerHTML = "";
  el.chatGalleryCount.textContent = String(images.length);
  if (!images.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state compact-empty";
    empty.textContent = "Images sent in this timeline appear here.";
    el.chatGalleryGrid.appendChild(empty);
    return;
  }
  images.forEach((item) => {
    const link = document.createElement("a");
    link.className = "chat-gallery-item";
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noreferrer noopener";

    const img = document.createElement("img");
    img.src = item.url;
    img.alt = item.alt || "Chat image";
    img.loading = "lazy";

    const label = document.createElement("span");
    label.textContent = item.alt || "Image";
    link.append(img, label);
    el.chatGalleryGrid.appendChild(link);
  });
}

function chatGalleryImages() {
  const seen = new Set();
  const images = [];
  const pattern = /!\[([^\]]*)\]\((\/api\/assets\/[^)\s]+)\)/g;
  state.messages.forEach((message) => {
    let match;
    while ((match = pattern.exec(message.content || ""))) {
      const [, alt, url] = match;
      if (seen.has(url)) {
        continue;
      }
      seen.add(url);
      images.push({ alt, url });
    }
  });
  return images;
}

async function deleteActiveChat() {
  if (!window.confirm("Delete the entire saved chat history for this conversation?")) {
    return;
  }
  if (!state.activeChatId) {
    beginFreshChatBranch();
    return;
  }
  const chatId = state.activeChatId;
  try {
    await fetch(`/api/chats/${encodeURIComponent(chatId)}`, { method: "DELETE" });
  } catch (error) {
    console.error(error);
  } finally {
    beginFreshChatBranch();
    await loadChatSessions();
  }
}

function exportChatLogs() {
  const payload = {
    chat_id: state.activeChatId,
    character_id: state.activeCharacter?.id || null,
    character_name: characterName(),
    persona_id: effectivePersonaId(),
    persona_name: personaName(),
    lorebook_id: effectiveLorebookId(),
    lorebook_enabled: effectiveLorebookEnabled(),
    chat_summary: effectiveChatSummary(),
    auto_summary_enabled: Boolean(state.chatSettings.auto_summary_enabled),
    summary_message_count: state.chatSettings.summary_message_count || 10,
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
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    statusWriter("Only PNG, JPG, and WebP images are supported.");
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
  renderChatGallery();
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
    setSidebarModelError("Place a .gguf file in storage/models.");
    return;
  }
  setBusy(true);
  setModelStatus("Loading model into memory", false);
  setSidebarModelError("");
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
        setSidebarModelError(
          data.detail.diagnostic_message || data.detail.message || "Model load failed."
        );
        return;
      }
      throw new Error(data.detail || "Model load failed");
    }
    renderModelStatus(data);
    setSidebarModelError("");
  } catch (error) {
    setModelStatus(error.message, false);
    setSidebarModelError(error.message || "Model load failed.");
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

async function loadModelFromSidebar() {
  el.localModelPath.value = el.sidebarLocalModelPath.value;
  await loadModel();
}

async function unloadModel() {
  setBusy(true);
  setModelStatus("Unloading model from memory", true);
  setSidebarModelError("");
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
    renderSidebarCharacterList();
  } catch (error) {
    state.characters = [];
    renderCharacterEmpty(error.message || "Could not load characters.");
    renderSidebarCharacterList();
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
      renderSidebarCharacterList();
      closeModal(el.characterModal);
    });
    el.characterList.appendChild(button);
  });
}

function renderSidebarCharacterList() {
  el.sidebarCharacterList.innerHTML = "";
  if (!state.characters.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state compact-empty";
    empty.textContent = "No saved character cards yet.";
    el.sidebarCharacterList.appendChild(empty);
    return;
  }

  state.characters.forEach((character) => {
    const button = document.createElement("button");
    button.className = "sidebar-card-item";
    button.type = "button";
    if (state.activeCharacter?.id === character.id) {
      button.classList.add("active");
    }

    const avatar = document.createElement("span");
    avatar.className = "avatar avatar-small";
    renderAvatar(avatar, character.avatar_url || character.avatar_file, character.name);

    const copy = document.createElement("span");
    copy.className = "sidebar-card-copy";
    const name = document.createElement("strong");
    name.textContent = character.name;
    const meta = document.createElement("span");
    meta.textContent = character.personality || character.description || "No card notes yet.";
    copy.append(name, meta);

    button.append(avatar, copy);
    button.addEventListener("click", () => {
      setCharacterEditor(character);
      applyCharacter(character);
      renderCharacterList();
      renderSidebarCharacterList();
    });
    el.sidebarCharacterList.appendChild(button);
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
  el.saveCharacter.textContent = profile.id ? "Save Changes" : "Create Card";
  el.useCharacter.textContent = profile.id ? "Start Chat" : "Use Draft";
  el.characterEditorName.value = profile.name;
  el.characterEditorAvatarUrl.value = profile.avatar_url || profile.avatar_file || "";
  el.characterEditorBackgroundUrl.value =
    profile.chat_background_url || profile.chat_background_file || "";
  el.characterEditorDescription.value = profile.description || "";
  el.characterEditorPersonality.value = profile.personality || "";
  el.characterEditorScenario.value = profile.scenario || "";
  el.characterEditorExamples.value = profile.example_dialogue || "";
  el.characterEditorFirstMessage.value = profile.first_message || DEFAULT_CHARACTER.first_message;
  el.characterEditorBackdrop.checked = profile.chat_backdrop_enabled !== false;
  el.characterAvatarFile.value = "";
  el.characterBackgroundFile.value = "";
  updateCharacterEditorAvatar();
}

function editorCharacterPayload() {
  const avatarValue = el.characterEditorAvatarUrl.value.trim();
  const backgroundValue = el.characterEditorBackgroundUrl.value.trim();
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
    chat_background_url: backgroundValue.startsWith("/api/assets/") ? "" : backgroundValue,
    chat_background_file: backgroundValue.startsWith("/api/assets/") ? backgroundValue : "",
    chat_backdrop_enabled: el.characterEditorBackdrop.checked,
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

async function applyCharacter(character, options = {}) {
  const shouldReset = options.resetChat !== false;
  const shouldLoadLatest = options.loadLatest !== false;
  const profile = normalizeCharacter(character);
  state.activeCharacter = profile;
  el.characterName.value = profile.name;
  el.characterAvatar.value = profile.avatar_url || profile.avatar_file || "";
  updateCharacterPreview();
  updateChatBackground();
  renderSidebarCharacterList();
  const sessions = await loadChatSessions();
  if (!shouldReset) {
    return;
  }
  if (shouldLoadLatest && sessions.length) {
    loadChatSession(sessions[0]);
  } else {
    beginFreshChatBranch();
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
    chat_background_url: character?.chat_background_url || "",
    chat_background_file: character?.chat_background_file || "",
    chat_backdrop_enabled: character?.chat_backdrop_enabled !== false,
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

async function deleteCharacterCard() {
  const characterId = state.editingCharacterId || state.activeCharacter?.id;
  if (!characterId) {
    setCharacterSaveStatus("Select a saved character to delete.");
    return;
  }
  if (!window.confirm("Delete this character profile from local storage?")) {
    return;
  }
  try {
    const response = await fetch(`/api/characters/${encodeURIComponent(characterId)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.detail || "Could not delete character");
    }
    if (state.activeCharacter?.id === characterId) {
      state.activeCharacter = null;
      el.characterName.value = "";
      el.characterAvatar.value = "";
      renderNoCharacterPlaceholder();
      await loadChatSessions();
    }
    setCharacterEditor(DEFAULT_CHARACTER);
    await loadCharacters();
    setCharacterSaveStatus("Character deleted.");
  } catch (error) {
    setCharacterSaveStatus(error.message || "Could not delete character.");
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
      chat_background: profile.chat_background_file || profile.chat_background_url,
      chat_backdrop_enabled: profile.chat_backdrop_enabled !== false,
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

async function handleCharacterBackgroundFile() {
  try {
    const asset = await uploadSelectedAsset(el.characterBackgroundFile, setCharacterSaveStatus);
    if (!asset) {
      return;
    }
    el.characterEditorBackgroundUrl.value = asset.url;
    if (state.activeCharacter?.id && state.activeCharacter.id === state.editingCharacterId) {
      state.activeCharacter.chat_background_file = asset.url;
      state.activeCharacter.chat_background_url = "";
      updateChatBackground();
    }
    setCharacterSaveStatus(`Stored backdrop ${asset.filename}.`);
  } catch (error) {
    setCharacterSaveStatus(error.message || "Could not store backdrop image.");
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
  el.personaDefault.checked = Boolean(profile.is_default || (!profile.id && !state.personas.length));
  el.savePersona.textContent = profile.id ? "Save Changes" : "Create Persona";
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
    applyPersona(saved, { renderList: false });
    await loadPersonas();
    setPersonaEditor(DEFAULT_PERSONA);
    setPersonaSaveStatus(`Saved ${saved.name}.`);
  } catch (error) {
    setPersonaSaveStatus(error.message || "Could not save persona.");
  } finally {
    el.savePersona.disabled = false;
  }
}

async function deletePersonaCard() {
  const personaId = state.editingPersonaId || state.activePersona?.id;
  if (!personaId) {
    setPersonaSaveStatus("Select a saved persona to delete.");
    return;
  }
  if (!window.confirm("Delete this persona from local storage?")) {
    return;
  }
  try {
    const response = await fetch(`/api/personas/${encodeURIComponent(personaId)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.detail || "Could not delete persona");
    }
    if (state.activePersona?.id === personaId) {
      state.activePersona = null;
    }
    setPersonaEditor(DEFAULT_PERSONA);
    await loadPersonas();
    setPersonaSaveStatus("Persona deleted.");
  } catch (error) {
    setPersonaSaveStatus(error.message || "Could not delete persona.");
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
    const button = document.createElement("div");
    button.className = "profile-row profile-row-with-action";
    if (state.activeLorebook?.id === lorebook.id && state.lorebookEnabled) {
      button.classList.add("active");
    }
    button.tabIndex = 0;
    button.role = "button";

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

    const toggleLabel = document.createElement("label");
    toggleLabel.className = "mini-switch";
    toggleLabel.title = lorebook.active ? "Disable lorebook" : "Enable lorebook";
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = Boolean(lorebook.active);
    const track = document.createElement("span");
    toggleLabel.append(toggle, track);
    toggle.addEventListener("click", (event) => event.stopPropagation());
    toggle.addEventListener("change", async (event) => {
      event.stopPropagation();
      await toggleLorebookActive(lorebook, toggle.checked);
    });

    button.append(avatar, copy, toggleLabel);
    button.addEventListener("click", () => {
      setLorebookEditor(lorebook);
      useLorebook(lorebook);
      renderLorebookList();
    });
    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        button.click();
      }
    });
    el.lorebookList.appendChild(button);
  });
}

async function toggleLorebookActive(lorebook, active) {
  try {
    const response = await fetch("/api/lorebooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: lorebook.id,
        name: lorebook.name,
        active,
        entries: lorebook.entries || [],
      }),
    });
    const saved = await response.json();
    if (!response.ok) {
      throw new Error(saved.detail || "Could not update lorebook.");
    }
    if (state.activeLorebook?.id === saved.id) {
      state.activeLorebook = saved;
      state.lorebookEnabled = Boolean(saved.active);
      el.lorebookActive.checked = Boolean(saved.active);
      updateLorebookStatus();
    }
    await loadLorebooks();
  } catch (error) {
    el.lorebookSaveStatus.textContent = error.message || "Could not update lorebook.";
    await loadLorebooks();
  }
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
  el.saveLorebook.textContent = "Create Lorebook";
  el.lorebookSaveStatus.textContent = "New lorebook draft.";
}

function setLorebookEditor(lorebook) {
  state.editingLorebookId = lorebook.id;
  el.lorebookName.value = lorebook.name || "Default Lorebook";
  el.lorebookActive.checked = Boolean(lorebook.active);
  el.saveLorebook.textContent = lorebook.id ? "Save Changes" : "Create Lorebook";
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

async function deleteLorebookCard() {
  if (!state.editingLorebookId) {
    el.lorebookSaveStatus.textContent = "Select a saved lorebook to delete.";
    return;
  }
  if (!window.confirm("Delete this lorebook from local storage?")) {
    return;
  }
  const lorebookId = state.editingLorebookId;
  try {
    const response = await fetch(`/api/lorebooks/${encodeURIComponent(lorebookId)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.detail || "Could not delete lorebook");
    }
    if (state.activeLorebook?.id === lorebookId) {
      state.activeLorebook = null;
      state.lorebookEnabled = false;
      updateLorebookStatus();
    }
    newLorebookDraft();
    await loadLorebooks();
    el.lorebookSaveStatus.textContent = "Lorebook deleted.";
  } catch (error) {
    el.lorebookSaveStatus.textContent = error.message || "Could not delete lorebook.";
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

function quickGenerateImageFromComposer() {
  const prompt = el.messageInput.value.trim();
  if (prompt) {
    el.imagePrompt.value = prompt;
    generateImageFromExtension();
    return;
  }
  state.extensionsOpen = true;
  el.extensionsDrawer.classList.remove("hidden");
  el.toggleExtensions.setAttribute("aria-expanded", "true");
  el.toggleExtensions.classList.add("is-active");
  el.imagePrompt.focus();
  el.imageGenerationStatus.textContent = "Type an image prompt here, or write it in the chat box first.";
  window.setTimeout(scrollChatToBottom, 120);
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
    const provider = extensionApiProvider("image");
    const response = await fetch("/api/extensions/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: el.imageProvider.value,
        api_provider_id: el.imageApiProvider.value || provider?.id || null,
        endpoint: extensionEndpoint("image", provider),
        api_key: "",
        model: el.imageModel.value.trim() || provider?.default_model || "",
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

async function stageImageAttachment(file, target = "chat") {
  if (!file) {
    return;
  }
  if (!file.type.startsWith("image/")) {
    el.visionCaptionStatus.textContent = "Attach a PNG, JPG, WebP, or GIF image.";
    return;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    setPendingImage(target, {
      filename: file.name,
      mime_type: file.type,
      size: file.size,
      dataUrl,
      caption: "Ready to send with your message.",
      status: "staged",
    });
    renderPendingImagePreview(target);
    el.visionCaptionStatus.textContent =
      target === "workspace"
        ? "Workspace image staged. It will be captioned when the agent runs."
        : "Image staged in chat. It will be captioned when you press Send.";
  } catch (error) {
    el.extensionStatus.textContent = "Error";
    el.visionCaptionStatus.textContent = error.message || "Could not stage image.";
  }
}

function setPendingImage(target, attachment) {
  if (target === "workspace") {
    state.workspacePendingImage = attachment;
    return;
  }
  state.chatPendingImage = attachment;
  state.visionAttachment = attachment;
}

function pendingImage(target = "chat") {
  return target === "workspace" ? state.workspacePendingImage : state.chatPendingImage;
}

function pendingPreviewElement(target = "chat") {
  return target === "workspace" ? el.workspaceAttachmentPreview : el.chatAttachmentPreview;
}

function renderPendingImagePreview(target = "chat") {
  const preview = pendingPreviewElement(target);
  const attachment = pendingImage(target);
  if (!preview) {
    return;
  }
  preview.innerHTML = "";
  if (!attachment) {
    preview.classList.add("hidden");
    return;
  }

  const image = document.createElement("img");
  image.src = attachment.dataUrl || attachment.assetUrl || "";
  image.alt = attachment.filename;

  const copy = document.createElement("div");
  copy.className = "attachment-copy";
  const title = document.createElement("strong");
  title.textContent = attachment.filename;
  const caption = document.createElement("p");
  caption.textContent = attachment.caption || "Ready to send.";
  copy.append(title, caption);

  const clear = document.createElement("button");
  clear.className = "message-action";
  clear.type = "button";
  clear.textContent = "Remove";
  clear.addEventListener("click", () => clearPendingImage(target));

  preview.append(image, copy, clear);
  preview.classList.remove("hidden");
}

function clearPendingImage(target = "chat") {
  if (target === "workspace") {
    state.workspacePendingImage = null;
  } else {
    state.chatPendingImage = null;
    state.visionAttachment = null;
  }
  renderPendingImagePreview(target);
  el.visionCaptionStatus.textContent = "Visual attachment cleared.";
}

async function prepareImageForSend(target = "chat", userText = "") {
  const attachment = pendingImage(target);
  if (!attachment) {
    return { messageSuffix: "", visionContext: "" };
  }

  attachment.caption = "Uploading image to local assets...";
  renderPendingImagePreview(target);
  const asset = await saveDataUrlAsset(attachment.filename, attachment.dataUrl);
  attachment.assetUrl = asset.url;

  attachment.caption = "Captioning image with selected vision profile...";
  renderPendingImagePreview(target);
  const caption = await captionAttachmentImage(attachment, userText);
  attachment.caption = caption;
  attachment.status = "completed";
  renderPendingImagePreview(target);

  const visionContext = [
    `Attached image "${attachment.filename}": ${caption}`,
    userText ? `User message sent with the image: ${userText}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return {
    messageSuffix: `![${attachment.filename}](${asset.url})`,
    visionContext,
    assetUrl: asset.url,
    caption,
  };
}

async function saveDataUrlAsset(filename, dataUrl) {
  const response = await fetch("/api/assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, data_url: dataUrl }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || "Could not store image asset.");
  }
  return payload;
}

async function captionAttachmentImage(attachment, userText = "") {
  const provider = extensionApiProvider("vision");
  const prompt = [
    el.visionPrompt.value.trim(),
    userText ? `The user's accompanying message is: "${userText}"` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const response = await fetch("/api/extensions/vision/caption", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: el.visionProvider.value,
      api_provider_id: el.visionApiProvider.value || provider?.id || null,
      endpoint: extensionEndpoint("vision", provider),
      model: selectedModelValue(el.visionModelSelect, el.visionModel) || provider?.default_model || "",
      api_key: "",
      prompt,
      filename: attachment.filename,
      data_url: attachment.dataUrl,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || "Vision caption request failed.");
  }
  el.visionCaptionStatus.textContent =
    payload.message || "Image caption generated and injected into this turn.";
  return payload.caption || `The user attached ${attachment.filename}.`;
}

async function sendMessage(event) {
  event.preventDefault();
  const content = el.messageInput.value.trim();
  const hasImage = Boolean(state.chatPendingImage);
  if (state.streaming) {
    return;
  }
  if (!content && !hasImage) {
    const assistantId = latestAssistantMessageId();
    if (assistantId) {
      await continueAssistantMessage(assistantId);
    }
    return;
  }

  setBusy(true);
  state.streaming = true;
  let assistantBubble = null;
  let transientVisionContext = "";

  try {
    const imagePayload = await prepareImageForSend("chat", content);
    transientVisionContext = imagePayload.visionContext;
    const visibleContent = [content, imagePayload.messageSuffix].filter(Boolean).join("\n\n");

    el.messageInput.value = "";
    autosizeComposer();
    const userMessage = {
      id: createMessageId(),
      role: "user",
      content: visibleContent,
      timestamp: new Date().toISOString(),
      folded: false,
      hidden: false,
    };
    state.messages.push(userMessage);
    appendMessage(userMessage, state.messages.length - 1);

    assistantBubble = appendThinkingMessage(characterName());
    state.activeAssistantText = "";
    state.activeWriter = null;

    if (el.textStreaming.checked) {
      state.activeWriter = new Typewriter((text) => {
        state.activeAssistantText = text;
        assistantBubble.innerHTML = window.renderMarkdown(text);
        scrollChatToBottom();
      });
      await streamAssistantResponse(buildChatPayload({ visionContext: transientVisionContext }));
      state.activeWriter.flush();
    } else {
      const result = await completeAssistantResponse(buildChatPayload({ visionContext: transientVisionContext }));
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
      await maybeAutoSummarizeChat();
    } else if (state.thinkingActive) {
      removeThinkingIndicator();
    }
    window.setTimeout(loadChatSessions, 700);
  } catch (error) {
    cleanupThinkingIndicator();
    if (state.activeWriter) {
      state.activeWriter.flush();
    }
    if (assistantBubble) {
      assistantBubble.innerHTML = window.renderMarkdown(`**Error:** ${error.message}`);
    } else {
      appendMessage(
        {
          id: createMessageId(),
          role: "assistant",
          content: `**Error:** ${error.message}`,
          timestamp: new Date().toISOString(),
        },
        state.messages.length
      );
    }
  } finally {
    clearPendingImage("chat");
    state.visionContext = "";
    state.activeWriter = null;
    state.thinkingRow = null;
    state.thinkingBody = null;
    state.thinkingActive = false;
    state.streaming = false;
    setBusy(false);
    el.messageInput.focus();
  }
}

function latestAssistantMessageId() {
  for (let index = state.messages.length - 1; index >= 0; index -= 1) {
    if (state.messages[index]?.role === "assistant") {
      return state.messages[index].id;
    }
  }
  return null;
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

function buildChatPayload(options = {}) {
  const uiSource = options.source || el.inferenceSource.value;
  const source = backendInferenceSource(uiSource);
  const messages = options.messages || state.messages;
  const payload = {
    source,
    chat_id: options.chatId === undefined ? state.activeChatId : options.chatId,
    messages: serializeMessagesForBackend(messages),
    system_prompt: options.systemPrompt === undefined ? el.systemPrompt.value : options.systemPrompt,
    character_id: state.activeCharacter?.id || null,
    persona_id: effectivePersonaId(),
    lorebook_id: effectiveLorebookId(),
    lorebook_enabled: effectiveLorebookEnabled(),
    chat_summary: effectiveChatSummary(),
    auto_summary_enabled: Boolean(state.chatSettings.auto_summary_enabled),
    summary_message_count: state.chatSettings.summary_message_count || 10,
    vision_context: options.visionContext === undefined ? state.visionContext || "" : options.visionContext,
    local: {
      template: el.promptTemplate.value,
    },
    temperature: options.temperature === undefined ? Number(el.temperature.value) : options.temperature,
    top_p: options.topP === undefined ? Number(el.topP.value) : options.topP,
    max_tokens: options.maxTokens === undefined ? Number(el.maxTokens.value) : options.maxTokens,
  };

  applyCloudSettingsForUiSource(payload, uiSource);

  return payload;
}

function backendInferenceSource(uiSource) {
  return uiSource === "ollama" ? "cloud" : uiSource;
}

function ollamaCloudSettings() {
  return {
    provider: "ollama",
    base_url: state.ollama.openai_base_url || "http://127.0.0.1:11434/v1",
    model: selectedOllamaModel(),
    api_key: "",
  };
}

function applyCloudSettingsForUiSource(payload, uiSource) {
  if (backendInferenceSource(uiSource) !== "cloud") {
    return payload;
  }
  if (uiSource === "ollama") {
    payload.cloud = ollamaCloudSettings();
    payload.api_provider_id = null;
    return payload;
  }
  const provider = activeApiProvider();
  const manualModel = selectedModelValue(el.cloudModelSelect, el.cloudModel);
  payload.cloud = {
    provider: provider ? inferCloudProvider(provider.base_url) : el.cloudProvider.value,
    base_url: provider?.base_url || el.baseUrl.value,
    model: provider?.default_model || manualModel,
    api_key: provider ? "" : el.apiKey.value,
  };
  payload.api_provider_id = provider?.id || null;
  return payload;
}

function appendMessage(message, index) {
  const normalized = ensureClientMessage(message);
  const role = normalized.role;
  const name = role === "user" ? personaName() : characterName();
  const latestAssistantMessage = isMostRecentAssistantMessage(index);
  const row = document.createElement("article");
  row.className = `message-row ${role}`;
  row.classList.toggle("group", latestAssistantMessage);
  row.dataset.messageId = normalized.id;
  row.dataset.index = String(index);
  row.classList.toggle("message-collapsed", Boolean(normalized.folded));
  row.classList.toggle("message-hidden", Boolean(normalized.hidden));

  const selectorFrame = document.createElement("label");
  selectorFrame.className = "message-select-frame";
  selectorFrame.title = "Select message";

  const selector = document.createElement("input");
  selector.className = "message-select";
  selector.type = "checkbox";
  selector.checked = state.selectedMessageIds.has(normalized.id);
  selector.addEventListener("change", () => {
    toggleMessageSelection(normalized.id, selector.checked);
  });
  selectorFrame.appendChild(selector);

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
  } else if (normalized.action_status) {
    body.classList.add("thinking-content");
    body.textContent = normalized.action_status;
  } else {
    body.innerHTML = window.renderMarkdown(normalized.content);
  }

  bubble.append(label, body);
  if (latestAssistantMessage && state.editingMessageId !== normalized.id) {
    bubble.append(createMessageExecutionToolbar(normalized, index));
  }
  row.append(selectorFrame, avatar, bubble);
  el.chatMessages.appendChild(row);
  applyChatBubbleOpacityToDom();
  scrollChatToBottom();
  return body;
}

function isMostRecentAssistantMessage(index) {
  return (
    index === state.messages.length - 1 &&
    state.messages[index]?.role === "assistant"
  );
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

function createMessageExecutionToolbar(message, index) {
  const toolbar = document.createElement("div");
  toolbar.className = "message-exec-toolbar";
  const variants = ensureAssistantVariants(message);
  toolbar.append(
    executionIconButton("Retry response", "retry"),
    createVariantPager(message, variants),
    executionIconButton("Continue response", "continue"),
    executionIconButton("Suggest user reply", "suggest")
  );
  toolbar.dataset.messageIndex = String(index);
  toolbar.dataset.messageId = message.id;
  return toolbar;
}

function createVariantPager(message, variants) {
  const pager = document.createElement("div");
  pager.className = "variant-pager";
  const current = Number.isInteger(message.variant_index) ? message.variant_index : 0;
  const disabled = variants.length < 2;

  const previous = executionIconButton("Previous variant", "pager-prev");
  previous.disabled = disabled;

  const label = document.createElement("span");
  label.className = "variant-count";
  label.textContent = `${variants.length ? current + 1 : 1} / ${Math.max(variants.length, 1)}`;

  const next = executionIconButton("Next variant", "pager-next");
  next.disabled = disabled;

  pager.append(previous, label, next);
  return pager;
}

function executionIconButton(label, action) {
  const button = document.createElement("button");
  button.className = "message-exec-button toolbar-btn";
  button.type = "button";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.dataset.action = action;
  button.innerHTML = messageActionIcon(action);
  return button;
}

function messageActionIcon(icon) {
  const icons = {
    retry:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5"/><path d="M4 18v-5h5"/><path d="M19 11a7 7 0 0 0-12.1-4.8L4 9"/><path d="M5 13a7 7 0 0 0 12.1 4.8L20 15"/></svg>',
    "pager-prev":
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    "pager-next":
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    continue:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 5 8 7-8 7V5Z"/><path d="M16 5v14"/></svg>',
    suggest:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M8.6 15.4a6 6 0 1 1 6.8 0c-.6.4-.9 1-.9 1.6h-5c0-.6-.3-1.2-.9-1.6Z"/><path d="M12 3V2"/><path d="m4.9 5 .7.7"/><path d="m19.1 5-.7.7"/></svg>',
  };
  return icons[icon] || icons.suggest;
}

function handleMessageExecutionPointerDown(event) {
  const button = event.target.closest(".toolbar-btn");
  if (!button || !el.chatMessages.contains(button)) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  dispatchMessageExecutionAction(button);
}

function handleMessageExecutionClick(event) {
  const button = event.target.closest(".toolbar-btn");
  if (!button || !el.chatMessages.contains(button)) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  if (event.detail !== 0) {
    return;
  }
  dispatchMessageExecutionAction(button);
}

function dispatchMessageExecutionAction(button) {
  if (button.disabled || state.streaming) {
    return;
  }
  const row = button.closest(".message-row");
  if (!row) {
    return;
  }
  const messageId = row.dataset.messageId || "";
  const message = findMessage(messageId);
  if (!message || message.role !== "assistant") {
    return;
  }

  const action = button.dataset.action;
  if (action === "retry") {
    retryAssistantMessage(messageId);
  } else if (action === "pager-prev") {
    selectAssistantVariant(messageId, (message.variant_index || 0) - 1);
  } else if (action === "pager-next") {
    selectAssistantVariant(messageId, (message.variant_index || 0) + 1);
  } else if (action === "continue") {
    continueAssistantMessage(messageId);
  } else if (action === "suggest") {
    suggestUserReply(messageId);
  }
}

async function retryAssistantMessage(messageId) {
  if (state.streaming || !state.activeCharacter?.id) {
    return;
  }
  const index = findMessageIndex(messageId);
  const message = state.messages[index];
  if (!message || message.role !== "assistant") {
    return;
  }
  const variants = ensureAssistantVariants(message);
  const previousContent = message.content;
  message.content = "";
  message.action_status = "Reforging reply...";
  setBusy(true);
  state.streaming = true;
  renderSessionMessages();
  try {
    const context = generationContextBefore(index);
    const text = await requestAssistantText(context);
    if (!text) {
      throw new Error("The model returned an empty retry.");
    }
    delete message.action_status;
    variants.push({ content: text, timestamp: new Date().toISOString() });
    message.variant_index = variants.length - 1;
    message.content = text;
    message.timestamp = new Date().toISOString();
    renderSessionMessages();
    await persistActiveChat();
  } catch (error) {
    delete message.action_status;
    message.content = previousContent;
    renderSessionMessages();
    console.error(error);
  } finally {
    state.streaming = false;
    setBusy(false);
    renderSessionMessages();
  }
}

async function selectAssistantVariant(messageId, requestedIndex) {
  const message = findMessage(messageId);
  if (!message || message.role !== "assistant") {
    return;
  }
  const variants = ensureAssistantVariants(message);
  if (variants.length < 2) {
    return;
  }
  const nextIndex = (requestedIndex + variants.length) % variants.length;
  message.variant_index = nextIndex;
  message.content = variants[nextIndex].content;
  message.timestamp = variants[nextIndex].timestamp || new Date().toISOString();
  renderSessionMessages();
  await persistActiveChat();
}

async function continueAssistantMessage(messageId) {
  if (state.streaming || !state.activeCharacter?.id) {
    return;
  }
  const index = findMessageIndex(messageId);
  const message = state.messages[index];
  if (!message || message.role !== "assistant") {
    return;
  }
  ensureAssistantVariants(message);
  const activeVariantIndex = Math.max(0, message.variant_index || 0);
  const previousContent = message.content;
  message.action_status = "Continuing the thread...";
  setBusy(true);
  state.streaming = true;
  renderSessionMessages();
  try {
    const context = state.messages.slice(0, index + 1).map(cloneMessageForGeneration);
    context.push({
      id: createMessageId(),
      role: "user",
      content:
        "Continue the assistant's previous message from exactly where it stopped. Do not restart, summarize, or add user dialogue. Return only the continuation.",
      timestamp: new Date().toISOString(),
    });
    const text = await requestAssistantText(context, {
      maxTokens: Math.min(Number(el.maxTokens.value) || 512, 768),
    });
    if (!text) {
      throw new Error("The model returned an empty continuation.");
    }
    delete message.action_status;
    message.content = joinContinuation(previousContent, text);
    message.timestamp = new Date().toISOString();
    message.variants[activeVariantIndex] = {
      content: message.content,
      timestamp: message.timestamp,
    };
    message.variant_index = activeVariantIndex;
    renderSessionMessages();
    await persistActiveChat();
  } catch (error) {
    delete message.action_status;
    message.content = previousContent;
    renderSessionMessages();
    console.error(error);
  } finally {
    state.streaming = false;
    setBusy(false);
    renderSessionMessages();
  }
}

async function suggestUserReply(messageId) {
  if (state.streaming || !state.activeCharacter?.id) {
    return;
  }
  const index = findMessageIndex(messageId);
  if (index < 0) {
    return;
  }
  setBusy(true);
  state.streaming = true;
  const originalPlaceholder = el.messageInput.placeholder;
  el.messageInput.placeholder = "Divining a possible reply...";
  try {
    const context = state.messages.slice(0, index + 1).map(cloneMessageForGeneration);
    context.push({
      id: createMessageId(),
      role: "user",
      content:
        "Based on the roleplay conversation so far, suggest one natural next message for the user to send. Return only the user's suggested message, with no labels, notes, or quotation marks.",
      timestamp: new Date().toISOString(),
    });
    const text = await requestAssistantText(context, {
      maxTokens: 160,
      temperature: Math.max(Number(el.temperature.value) || 0.7, 0.75),
    });
    const suggestion = cleanSuggestedReply(text);
    if (suggestion) {
      el.messageInput.value = suggestion;
      autosizeComposer();
      el.messageInput.focus();
    }
    await persistActiveChat();
  } catch (error) {
    console.error(error);
  } finally {
    el.messageInput.placeholder = originalPlaceholder;
    state.streaming = false;
    setBusy(false);
  }
}

function generationContextBefore(index) {
  const context = state.messages.slice(0, index).map(cloneMessageForGeneration);
  if (context.length) {
    return context;
  }
  return [
    {
      id: createMessageId(),
      role: "user",
      content:
        "Begin the conversation with a fresh in-character opening response for the active character.",
      timestamp: new Date().toISOString(),
    },
  ];
}

function cloneMessageForGeneration(message) {
  return {
    id: message.id || createMessageId(),
    role: message.role,
    content: message.content,
    timestamp: message.timestamp || new Date().toISOString(),
  };
}

async function requestAssistantText(messages, options = {}) {
  const result = await completeAssistantResponse(
    buildChatPayload({
      messages,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      topP: options.topP,
    })
  );
  state.activeChatId = result.chat_id || state.activeChatId;
  return String(result.text || "").trim();
}

function joinContinuation(base, continuation) {
  const head = String(base || "").trimEnd();
  const tail = String(continuation || "").trimStart();
  if (!head) {
    return tail;
  }
  if (!tail) {
    return head;
  }
  return /[\s("'[{]$/.test(head) || /^[,.;:!?)\]}]/.test(tail)
    ? `${head}${tail}`
    : `${head} ${tail}`;
}

function cleanSuggestedReply(text) {
  return String(text || "")
    .trim()
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .replace(/^(user|you)\s*:\s*/i, "")
    .trim();
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
  if (message.role === "assistant") {
    updateActiveAssistantVariant(message);
  }
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
  el.chatMessages.classList.toggle("multi-select-active", count > 0);
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
  if (!state.activeCharacter?.id || !state.messages.length) {
    return null;
  }
  try {
    const response = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: state.activeChatId,
        character_id: state.activeCharacter?.id || null,
        persona_id: effectivePersonaId(),
        lorebook_id: effectiveLorebookId(),
        lorebook_enabled: effectiveLorebookEnabled(),
        chat_summary: effectiveChatSummary(),
        auto_summary_enabled: Boolean(state.chatSettings.auto_summary_enabled),
        summary_message_count: state.chatSettings.summary_message_count || 10,
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

function findMessageIndex(messageId) {
  return state.messages.findIndex((message) => message.id === messageId);
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
  if (message.role === "assistant") {
    ensureAssistantVariants(message);
  }
  return message;
}

function ensureAssistantVariants(message) {
  if (!message || message.role !== "assistant") {
    return [];
  }
  const variants = Array.isArray(message.variants)
    ? message.variants
        .map((variant) =>
          typeof variant === "string"
            ? { content: variant, timestamp: message.timestamp || new Date().toISOString() }
            : {
                content: String(variant?.content || ""),
                timestamp: variant?.timestamp || message.timestamp || new Date().toISOString(),
              }
        )
        .filter((variant) => variant.content.trim())
    : [];

  const currentContent = String(message.content || "").trim();
  let variantIndex = Number.isInteger(message.variant_index) ? message.variant_index : -1;
  if (currentContent) {
    const currentMatch = variants.findIndex((variant) => variant.content === message.content);
    if (currentMatch >= 0) {
      variantIndex = currentMatch;
    } else {
      variants.push({
        content: message.content,
        timestamp: message.timestamp || new Date().toISOString(),
      });
      variantIndex = variants.length - 1;
    }
  }

  if (!variants.length) {
    variantIndex = 0;
  } else if (variantIndex < 0 || variantIndex >= variants.length) {
    variantIndex = variants.length - 1;
  }

  message.variants = variants;
  message.variant_index = variantIndex;
  return variants;
}

function updateActiveAssistantVariant(message) {
  const variants = ensureAssistantVariants(message);
  if (!variants.length) {
    return;
  }
  const index = Math.max(0, Math.min(message.variant_index || 0, variants.length - 1));
  variants[index] = {
    content: message.content,
    timestamp: message.timestamp || new Date().toISOString(),
  };
  message.variant_index = index;
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
  applyChatBubbleOpacityToDom();
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
  if (el.chatHistorySelect) {
    el.chatHistorySelect.value = "";
  }
  state.selectedMessageIds.clear();
  state.editingMessageId = null;
  if (!state.activeCharacter?.id) {
    renderNoCharacterPlaceholder();
    return;
  }
  resetChatToFirstMessage();
}

function resetChatToFirstMessage() {
  state.messages = [];
  el.chatMessages.innerHTML = "";
  state.selectedMessageIds.clear();
  state.editingMessageId = null;
  updateBulkActionBar();
  if (!state.activeCharacter?.id) {
    renderNoCharacterPlaceholder();
    return;
  }
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

function renderNoCharacterPlaceholder(message) {
  state.messages = [];
  state.activeChatId = null;
  state.selectedMessageIds.clear();
  state.editingMessageId = null;
  updateBulkActionBar();
  renderChatHistorySelect();
  renderChatHistoryShelf();
  el.chatMessages.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "workspace-placeholder home-hub";
  const title = document.createElement("h3");
  title.textContent = "What are we building?";
  const copy = document.createElement("p");
  copy.textContent =
    message ||
    "Start a general chat, open the agent workspace, or attach a character/persona when you want roleplay context.";
  const grid = document.createElement("div");
  grid.className = "home-hub-grid";
  [
    ["Workspace", "Build, inspect, run, and fix files inside ./workspace.", openWorkspace],
    ["Characters", "Import or create roleplay cards and avatar-backed chats.", openCharacterLibrary],
    ["Personas", "Swap how the model understands you across sessions.", openPersonaRegistry],
    ["Models", "Load GGUF files or search the Hugging Face marketplace.", openModelMarket],
    ["Lorebooks", "Inject world info when keywords appear in the chat.", openLorebookEditor],
  ].forEach(([heading, detail, action]) => {
    const card = document.createElement("button");
    card.className = "home-hub-card";
    card.type = "button";
    const strong = document.createElement("strong");
    strong.textContent = heading;
    const span = document.createElement("span");
    span.textContent = detail;
    card.append(strong, span);
    card.addEventListener("click", action);
    grid.appendChild(card);
  });
  const actions = document.createElement("div");
  actions.className = "button-row compact-actions";
  const workspace = document.createElement("button");
  workspace.className = "primary-button";
  workspace.type = "button";
  workspace.textContent = "Launch Workspace";
  workspace.addEventListener("click", openWorkspace);
  const create = document.createElement("button");
  create.className = "secondary-button";
  create.type = "button";
  create.textContent = "Characters";
  create.addEventListener("click", openCharacterLibrary);
  actions.append(workspace, create);
  empty.append(title, copy, grid, actions);
  el.chatMessages.appendChild(empty);
  el.chatTitle.textContent = "SweetrollLM";
  el.chatSubtitle.textContent = "General chat ready. Workspace, characters, and personas are one click away.";
  updateChatBackground();
}

function updateCharacterPreview() {
  const hasCharacter = Boolean(state.activeCharacter?.id);
  el.chatTitle.textContent = hasCharacter ? characterName() : "SweetrollLM";
  renderAvatar(el.characterAvatarPreview, characterAvatar(), characterName());
  updateChatBackground();
}

function updateChatBackground() {
  if (!el.chatBackdrop || !el.chatMain) {
    return;
  }
  const source = resolveChatBackgroundSource();
  if (!source) {
    el.chatBackdrop.classList.remove("active");
    el.chatMain.classList.remove("wallpaper-active");
    el.chatBackdrop.style.backgroundImage = "";
    applyChatBubbleOpacityToDom();
    return;
  }
  el.chatBackdrop.style.backgroundImage = `url("${cssUrlEscape(source)}")`;
  el.chatBackdrop.classList.add("active");
  el.chatMain.classList.add("wallpaper-active");
  applyChatBubbleOpacityToDom();
}

function resolveChatBackgroundSource() {
  const cardBackgroundsEnabled = Boolean(el.characterBackgrounds?.checked);
  const characterBackgroundEnabled =
    cardBackgroundsEnabled &&
    state.activeCharacter?.id &&
    state.activeCharacter?.chat_backdrop_enabled !== false;
  const cardBackground = characterBackground();
  if (characterBackgroundEnabled && isValidBackdropImage(cardBackground)) {
    return cardBackground;
  }
  const avatarBackground = characterAvatar();
  if (characterBackgroundEnabled && isValidBackdropImage(avatarBackground)) {
    return avatarBackground;
  }
  const globalBackground = globalBackgroundUrl();
  if (globalBackground) {
    return globalBackground;
  }
  return "";
}

function characterBackground() {
  return (
    state.activeCharacter?.chat_background_file ||
    state.activeCharacter?.chat_background_url ||
    ""
  ).trim();
}

function globalBackgroundUrl() {
  const background = state.appSettings?.global_background_path || "";
  if (!background) {
    return "";
  }
  if (isValidBackdropImage(background)) {
    return background;
  }
  const version =
    state.backgroundRevision ||
    state.appSettings.updated_at ||
    background;
  return `/api/app-settings/background?v=${encodeURIComponent(String(version))}`;
}

function cssUrlEscape(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function isValidBackdropImage(value) {
  const image = String(value || "").trim();
  if (!image) {
    return false;
  }
  return (
    image.startsWith("data:image/") ||
    image.startsWith("/api/assets/") ||
    image.startsWith("/static/") ||
    /^https?:\/\//i.test(image) ||
    /\.(png|jpe?g|webp|gif)(?:[?#].*)?$/i.test(image)
  );
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
  return el.characterName.value.trim() || state.activeCharacter?.name || "Assistant";
}

function characterAvatar() {
  return el.characterAvatar.value.trim();
}

function effectivePersonaProfile() {
  const personaId = effectivePersonaId();
  return state.personas.find((persona) => persona.id === personaId) || state.activePersona || null;
}

function personaName() {
  return effectivePersonaProfile()?.name || "You";
}

function personaAvatar() {
  const persona = effectivePersonaProfile();
  return persona?.avatar_file || persona?.avatar_url || "";
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
  el.sidebarLoadModel.disabled = busy;
  el.sidebarUnloadModel.disabled = busy;
  el.sidebarRefreshModels.disabled = busy;
}

function setModelStatus(message, loaded) {
  el.modelStatus.textContent = message;
  el.activeModelDot.classList.toggle("loaded", Boolean(loaded));
  el.sidebarModelStatus.textContent = message;
  el.sidebarActiveModelDot.classList.toggle("loaded", Boolean(loaded));
  syncQuickModelControls();
}

function setSidebarModelError(message) {
  const text = String(message || "").trim();
  el.sidebarModelInlineError.textContent = text;
  el.sidebarModelInlineError.classList.toggle("hidden", !text);
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
  syncQuickModelControls();
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
