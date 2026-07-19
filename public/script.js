const form = document.querySelector("#entryForm");
const propertyForm = document.querySelector("#propertyForm");
const serverForm = document.querySelector("#serverForm");
const securitySettingsForm = document.querySelector("#securitySettingsForm");
const appHeader = document.querySelector("#appHeader");
const mobileMenuButton = document.querySelector("#mobileMenuButton");
const appNav = document.querySelector("#appNav");
const notificationButton = document.querySelector("#notificationButton");
const notificationCount = document.querySelector("#notificationCount");
const notificationPanel = document.querySelector("#notificationPanel");
const notificationList = document.querySelector("#notificationList");
const markAllNotificationsRead = document.querySelector("#markAllNotificationsRead");
const headerLoginButton = document.querySelector("#headerLoginButton");
const headerSignupButton = document.querySelector("#headerSignupButton");
const headerProfileButton = document.querySelector("#headerProfileButton");
const headerLogoutButton = document.querySelector("#headerLogoutButton");
const syncForm = document.querySelector("#syncForm");
const driveSettingsForm = document.querySelector("#driveSettingsForm");
const upstoxForm = document.querySelector("#upstoxForm");
const message = document.querySelector("#message");
const propertyMessage = document.querySelector("#propertyMessage");
const serverStatus = document.querySelector("#serverStatus");
const securitySettingsStatus = document.querySelector("#securitySettingsStatus");
const entriesBody = document.querySelector("#entriesBody");
const propertiesBody = document.querySelector("#propertiesBody");
const tradingBody = document.querySelector("#tradingBody");
const entryCount = document.querySelector("#entryCount");
const propertyCount = document.querySelector("#propertyCount");
const tradingCount = document.querySelector("#tradingCount");
const serverUrlInput = document.querySelector("#serverUrl");
const syncStatus = document.querySelector("#syncStatus");
const workbookPathInput = document.querySelector("#workbookPath");
const driveStatus = document.querySelector("#driveStatus");
const syncMonitoringStatus = document.querySelector("#syncMonitoringStatus");
const syncMonitoringGrid = document.querySelector("#syncMonitoringGrid");
const retrySyncButton = document.querySelector("#retrySyncButton");
const syncAllButton = document.querySelector("#syncAllButton");
const otpDeliveryStatus = document.querySelector("#otpDeliveryStatus");
const otpDeliveryGrid = document.querySelector("#otpDeliveryGrid");
const testEmailOtpButton = document.querySelector("#testEmailOtpButton");
const testSmsOtpButton = document.querySelector("#testSmsOtpButton");
const enableMpinAuthInput = document.querySelector("#enableMpinAuth");
const enableFingerprintAuthInput = document.querySelector("#enableFingerprintAuth");
const enableFaceAuthInput = document.querySelector("#enableFaceAuth");
const newMpinInput = document.querySelector("#newMpin");
const confirmMpinInput = document.querySelector("#confirmMpin");
const driveSetupHint = document.querySelector("#driveSetupHint");
const uploadDriveButton = document.querySelector("#uploadDriveButton");
const syncUpstoxButton = document.querySelector("#syncUpstoxButton");
const upstoxStatus = document.querySelector("#upstoxStatus");
const upstoxAccessTokenInput = document.querySelector("#upstoxAccessToken");
const tradingBrokerInput = document.querySelector("#tradingBroker");
const tradingLastSync = document.querySelector("#tradingLastSync");
const gmailAddressInput = document.querySelector("#gmailAddress");
const googleClientIdInput = document.querySelector("#googleClientId");
const googleClientSecretInput = document.querySelector("#googleClientSecret");
const googleRedirectUriInput = document.querySelector("#googleRedirectUri");
const copyGoogleRedirectUriButton = document.querySelector("#copyGoogleRedirectUri");
const toggleGoogleClientSecretButton = document.querySelector("#toggleGoogleClientSecret");
const searchInput = document.querySelector("#searchInput");
const typeFilter = document.querySelector("#typeFilter");
const typeInput = document.querySelector("#type");
const monthEntryTargetInput = document.querySelector("#monthEntryTarget");
const partyInput = document.querySelector("#party");
const partySuggestions = document.querySelector("#partySuggestions");
const saveEntryButton = document.querySelector("#saveEntryButton");
const cancelEditButton = document.querySelector("#cancelEditButton");
const sheetColumnFields = document.querySelector("#sheetColumnFields");
const tradingSheetFields = document.querySelector("#tradingSheetFields");
const homeScreen = document.querySelector("#homeScreen");
const appShell = document.querySelector(".app-shell");
const entryPanel = document.querySelector(".entry-panel");
const overviewPanel = document.querySelector(".overview-panel");
const entriesPanel = document.querySelector(".entries-panel");
const modulePanel = document.querySelector("#modulePanel");
const moduleIntro = document.querySelector("#moduleIntro");
const moduleSections = document.querySelector("#moduleSections");
const summaryGrid = document.querySelector(".summary-grid");
const chartPanel = document.querySelector(".chart-panel");
const reportsContent = document.querySelector("#reportsContent");
const propertyTablePanel = propertiesBody.closest(".table-wrap");
const tradingPanel = tradingBody.closest(".table-wrap");
const tradingActions = syncUpstoxButton.closest(".drive-actions");
const syncPanels = Array.from(document.querySelectorAll(".sync-panel, .drive-panel"));
const debtGrowthChart = document.querySelector("#debtGrowthChart");
const chittyGrowthChart = document.querySelector("#chittyGrowthChart");
const loanGrowthChart = document.querySelector("#loanGrowthChart");
const tradingGrowthChart = document.querySelector("#tradingGrowthChart");
const chartSummary = document.querySelector("#chartSummary");
const chartRegistry = new Map();
const chartTooltip = document.createElement("div");
chartTooltip.className = "chart-tooltip";
chartTooltip.hidden = true;
document.body.appendChild(chartTooltip);
const authGate = document.querySelector("#authGate");
const authForm = document.querySelector("#authForm");
const loginPanel = document.querySelector("#loginPanel");
const signupPanel = document.querySelector("#signupPanel");
const localAdminSetupPanel = document.querySelector("#localAdminSetupPanel");
const localAdminSetupPasswordInput = document.querySelector("#localAdminSetupPassword");
const localAdminSetupConfirmPasswordInput = document.querySelector("#localAdminSetupConfirmPassword");
const localAdminSetupSubmit = document.querySelector("#localAdminSetupSubmit");
const authServerUrlInput = document.querySelector("#authServerUrl");
const authConnectServerButton = document.querySelector("#authConnectServerButton");
const authServerStatus = document.querySelector("#authServerStatus");
const authUsernameInput = document.querySelector("#authUsername");
const authPasswordInput = document.querySelector("#authPassword");
const authRememberMeInput = document.querySelector("#authRememberMe");
const authMessage = document.querySelector("#authMessage");
const authSubmitButton = document.querySelector("#authSubmitButton");
const openSignupButton = document.querySelector("#openSignupButton");
const openLoginButton = document.querySelector("#openLoginButton");
const createAccountButton = document.querySelector("#createAccountButton");
const signupFullNameInput = document.querySelector("#signupFullName");
const signupEmailInput = document.querySelector("#signupEmail");
const signupMobileInput = document.querySelector("#signupMobile");
const signupPasswordInput = document.querySelector("#signupPassword");
const signupConfirmPasswordInput = document.querySelector("#signupConfirmPassword");
const signupTermsInput = document.querySelector("#signupTerms");
const loginOtpPanel = document.querySelector("#loginOtpPanel");
const loginOtpHint = document.querySelector("#loginOtpHint");
const loginOtpChoices = document.querySelector("#loginOtpChoices");
const loginOtpInput = document.querySelector("#loginOtp");
const loginConfirmMpinLabel = document.querySelector("#loginConfirmMpinLabel");
const loginConfirmMpinInput = document.querySelector("#loginConfirmMpin");
const verifyLoginOtpButton = document.querySelector("#verifyLoginOtpButton");
const resendLoginOtpButton = document.querySelector("#resendLoginOtpButton");
const changeLoginIdentifierButton = document.querySelector("#changeLoginIdentifierButton");
const forgotPasswordButton = document.querySelector("#forgotPasswordButton");
const forgotPasswordPanel = document.querySelector("#forgotPasswordPanel");
const forgotIdentifier = document.querySelector("#forgotIdentifier");
const loginChangePasswordButton = document.querySelector("#loginChangePasswordButton");
const loginChangePasswordPanel = document.querySelector("#loginChangePasswordPanel");
const loginChangePasswordIdentifier = document.querySelector("#loginChangePasswordIdentifier");
const loginCurrentPasswordInput = document.querySelector("#loginCurrentPassword");
const loginNewPasswordInput = document.querySelector("#loginNewPassword");
const loginConfirmPasswordInput = document.querySelector("#loginConfirmPassword");
const loginChangePasswordSubmit = document.querySelector("#loginChangePasswordSubmit");
const loginChangePasswordStatus = document.querySelector("#loginChangePasswordStatus");
const forgotOtp = document.querySelector("#forgotOtp");
const forgotNewPassword = document.querySelector("#forgotNewPassword");
const forgotConfirmPassword = document.querySelector("#forgotConfirmPassword");
const forgotPasswordStatus = document.querySelector("#forgotPasswordStatus");
const requestResetButton = document.querySelector("#requestResetButton");
const verifyResetButton = document.querySelector("#verifyResetButton");
const completeResetButton = document.querySelector("#completeResetButton");
const sessionWarning = document.querySelector("#sessionWarning");
const sessionCountdown = document.querySelector("#sessionCountdown");
const stayLoggedInButton = document.querySelector("#stayLoggedInButton");
const unsavedSessionWarning = document.querySelector("#unsavedSessionWarning");
let allEntries = [];
let allProperties = [];
let allLoans = [];
let allTrading = [];
let reportsAnalyticsData = null;
let backupInventory = [];
let backupViewState = {
  query: "",
  type: "all",
  status: "all",
  integrity: "all",
  availability: "all",
  dateFrom: "",
  dateTo: "",
  selectedBackupId: "",
  restorePlan: null,
  restoreMode: false,
  message: ""
};
let taxAdvisoryData = null;
let currentDriveStatus = {};
let suggestions = { debtCleared: [], chittyReceived: [] };
let editingEntryId = "";
let editingLoanId = "";
let refreshInProgress = false;
let tradingTileRefreshInProgress = false;
let backgroundRefreshTimer = null;
let userInputActiveUntil = 0;
let lastSuccessfulUpstoxSyncSeen = "";
let currentPage = "home";
const financeServerConfig = window.FINANCE_SERVER_CONFIG || {};
const configuredPublicServerUrl = financeServerConfig.publicUrl || "";
const configuredFallbackServerUrls = Array.isArray(financeServerConfig.fallbackUrls)
  ? financeServerConfig.fallbackUrls
  : [];
const mobileDefaultServerUrl = configuredPublicServerUrl || configuredFallbackServerUrls[0] || "";
const mobileProtocols = new Set(["capacitor:", "ionic:", "file:"]);
const serverUrlStorageKey = "financeRecordsServerUrl";
const authStorageKey = "financeRecordsAuth";
const authBroadcastStorageKey = "smartFinanceAuthBroadcast";
const authTimeoutMs = 2 * 60 * 1000;
const authWarningMs = 30 * 1000;
const notificationReadStorageKey = "smartFinanceNotificationRead";
const upstoxAccessTokenStorageKey = "financeRecordsUpstoxAccessToken";
let serverBaseUrl = normalizeServerUrl(
  configuredPublicServerUrl ||
  localStorage.getItem(serverUrlStorageKey) ||
  (mobileProtocols.has(window.location.protocol) ? mobileDefaultServerUrl : "")
);
let restoringUpstoxToken = false;
let authLogoutTimer = null;
let authWarningTimer = null;
let authCountdownTimer = null;
let lastAuthActivitySentAt = 0;
let hasUnsavedFormChanges = false;
let dashboardNotifications = [];
let activePasswordResetId = "";
let activeLoginChallengeId = "";
let activeLoginUsername = "";
let activeLoginOtpChannel = "";
let activeSecondFactorMethod = "";
let activeSecondFactorSetup = false;
let authPublicStatus = { otpEnabled: false, loginMode: "password-only" };
let serverRecoveryPromise = null;
const reportFavouritesStorageKey = "smartFinanceReportFavourites";
const backgroundRefreshMs = 15000;
const backgroundRefreshDebounceMs = 1200;
const reportsState = {
  tab: "all",
  module: "all",
  query: "",
  collapsed: new Set(),
  favourites: new Set(JSON.parse(localStorage.getItem(reportFavouritesStorageKey) || "[]"))
};

class AuthRequiredError extends Error {
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

function isAuthRequiredError(error) {
  return error && error.name === "AuthRequiredError";
}

function readStoredAuthCredentials() {
  try {
    const saved = JSON.parse(localStorage.getItem(authStorageKey) || "null");
    if (saved && saved.username && saved.token) return saved;
  } catch {}
  return null;
}

function authIsExpired(saved) {
  return !saved?.expiresAt || Date.now() >= Number(saved.expiresAt);
}

function scheduleAuthLogout() {
  if (authLogoutTimer) clearTimeout(authLogoutTimer);
  if (authWarningTimer) clearTimeout(authWarningTimer);
  if (authCountdownTimer) clearInterval(authCountdownTimer);
  authLogoutTimer = null;
  authWarningTimer = null;
  authCountdownTimer = null;
  const saved = readStoredAuthCredentials();
  if (!saved?.username || !saved?.token || !saved.expiresAt) {
    updateHeaderAuthState();
    return;
  }
  const remainingMs = Number(saved.expiresAt) - Date.now();
  if (remainingMs <= 0) {
    expireAuthSession(saved.username);
    return;
  }
  if (remainingMs > authWarningMs) {
    authWarningTimer = setTimeout(showSessionWarning, remainingMs - authWarningMs);
  } else {
    showSessionWarning();
  }
  authLogoutTimer = setTimeout(() => expireAuthSession(saved.username), remainingMs);
  updateHeaderAuthState(saved);
}

function readAuthCredentials() {
  const saved = readStoredAuthCredentials();
  if (!saved?.username || !saved?.token) return null;
  if (authIsExpired(saved)) {
    expireAuthSession(saved.username);
    return null;
  }
  return saved;
}

function saveAuthSession({ username, token, expiresAt, role }) {
  const expiresMs = expiresAt ? Date.parse(expiresAt) : Date.now() + authTimeoutMs;
  localStorage.setItem(authStorageKey, JSON.stringify({
    username,
    token,
    role,
    expiresAt: expiresMs
  }));
  localStorage.setItem(authBroadcastStorageKey, JSON.stringify({ type: "login", at: Date.now(), username }));
  lastAuthActivitySentAt = Date.now();
  hideSessionWarning();
  scheduleAuthLogout();
  updateHeaderAuthState();
}

function clearAuthCredentials(broadcast = true) {
  localStorage.removeItem(authStorageKey);
  if (authLogoutTimer) clearTimeout(authLogoutTimer);
  if (authWarningTimer) clearTimeout(authWarningTimer);
  if (authCountdownTimer) clearInterval(authCountdownTimer);
  authLogoutTimer = null;
  authWarningTimer = null;
  authCountdownTimer = null;
  hideSessionWarning();
  if (broadcast) localStorage.setItem(authBroadcastStorageKey, JSON.stringify({ type: "logout", at: Date.now() }));
  updateHeaderAuthState();
}

function clearSensitiveScreenData() {
  allEntries = [];
  allProperties = [];
  allLoans = [];
  allTrading = [];
  reportsAnalyticsData = null;
  backupInventory = [];
  backupViewState = {
    query: "",
    type: "all",
    status: "all",
    integrity: "all",
    availability: "all",
    dateFrom: "",
    dateTo: "",
    selectedBackupId: "",
    restorePlan: null,
    restoreMode: false,
    message: ""
  };
  taxAdvisoryData = null;
  suggestions = { debtCleared: [], chittyReceived: [] };
  if (entriesBody) entriesBody.innerHTML = "";
  if (propertiesBody) propertiesBody.innerHTML = "";
  if (tradingBody) tradingBody.innerHTML = "";
  if (summaryGrid) summaryGrid.innerHTML = "";
  if (reportsContent) reportsContent.innerHTML = "";
  if (moduleSections) moduleSections.innerHTML = "";
  if (notificationList) notificationList.innerHTML = "";
  if (notificationCount) notificationCount.textContent = "0";
  chartRegistry.forEach((chart) => chart.canvas?.getContext("2d")?.clearRect(0, 0, chart.canvas.width, chart.canvas.height));
  chartRegistry.clear();
}

async function invalidateServerSession() {
  const saved = readStoredAuthCredentials();
  if (!saved?.token) return;
  try {
    await fetch(apiUrl("/api/auth/logout"), {
      method: "POST",
      credentials: serverBaseUrl ? "include" : "same-origin",
      headers: { Authorization: `Bearer ${saved.token}` },
      cache: "no-store"
    });
  } catch {}
}

async function expireAuthSession(username = "", reason = "Session locked after 2 minutes of inactivity. Enter your password to continue.") {
  await invalidateServerSession();
  clearSensitiveScreenData();
  clearAuthCredentials(true);
  if (window.history?.replaceState) window.history.replaceState(null, "", "#login");
  showAuthGate(reason, username);
}

async function refreshAuthActivity({ force = false } = {}) {
  const saved = readStoredAuthCredentials();
  if (!saved?.username || !saved?.token) return;
  if (authIsExpired(saved)) {
    expireAuthSession(saved.username);
    return;
  }
  const now = Date.now();
  if (!force && now - lastAuthActivitySentAt < 10000) return;
  lastAuthActivitySentAt = now;
  try {
    const response = await fetch(apiUrl("/api/auth/activity"), {
      method: "POST",
      credentials: serverBaseUrl ? "include" : "same-origin",
      headers: { Authorization: `Bearer ${saved.token}` },
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Session expired.");
    localStorage.setItem(authStorageKey, JSON.stringify({
      ...saved,
      expiresAt: data.expiresAt ? Date.parse(data.expiresAt) : now + authTimeoutMs
    }));
    localStorage.setItem(authBroadcastStorageKey, JSON.stringify({ type: "activity", at: Date.now(), username: saved.username }));
    hideSessionWarning();
    scheduleAuthLogout();
  } catch {
    expireAuthSession(saved.username, "Session expired. Enter your password to continue.");
  }
}

function showSessionWarning() {
  const saved = readStoredAuthCredentials();
  if (!saved?.expiresAt || authIsExpired(saved)) return;
  if (sessionWarning) sessionWarning.hidden = false;
  if (unsavedSessionWarning) unsavedSessionWarning.hidden = !hasUnsavedFormChanges;
  const update = () => {
    const seconds = Math.max(0, Math.ceil((Number(saved.expiresAt) - Date.now()) / 1000));
    if (sessionCountdown) sessionCountdown.textContent = String(seconds);
  };
  update();
  if (authCountdownTimer) clearInterval(authCountdownTimer);
  authCountdownTimer = setInterval(update, 1000);
}

function hideSessionWarning() {
  if (sessionWarning) sessionWarning.hidden = true;
  if (authCountdownTimer) clearInterval(authCountdownTimer);
  authCountdownTimer = null;
}

function setAuthMode(mode = "login", statusText = "", statusColor = "#475467") {
  const signupMode = mode === "signup";
  if (loginPanel) loginPanel.hidden = signupMode;
  if (signupPanel) signupPanel.hidden = !signupMode;
  if (forgotPasswordPanel) forgotPasswordPanel.hidden = true;
  if (loginChangePasswordPanel) loginChangePasswordPanel.hidden = true;
  if (loginOtpPanel) loginOtpPanel.hidden = true;
  if (loginOtpChoices) loginOtpChoices.innerHTML = "";
  if (loginOtpInput) loginOtpInput.value = "";
  if (loginConfirmMpinInput) loginConfirmMpinInput.value = "";
  if (loginConfirmMpinLabel) loginConfirmMpinLabel.hidden = true;
  if (localAdminSetupPanel) localAdminSetupPanel.hidden = true;
  activeLoginChallengeId = "";
  activeLoginOtpChannel = "";
  activeSecondFactorMethod = "";
  activeSecondFactorSetup = false;
  if (authMessage) {
    authMessage.style.color = statusColor;
    authMessage.textContent = statusText || (signupMode ? "" : "Enter your email or mobile number and password.");
  }
  if (signupMode) {
    authUsernameInput?.removeAttribute("required");
    authPasswordInput?.removeAttribute("required");
    setTimeout(() => signupFullNameInput?.focus(), 50);
  } else {
    authUsernameInput?.setAttribute("required", "");
    authPasswordInput?.setAttribute("required", "");
    setTimeout(() => (authPasswordInput || authUsernameInput)?.focus(), 50);
  }
  applyAuthAvailability();
}

function showAuthGate(text = "Sign in to continue.", username = "", mode = "login") {
  loadAuthPublicStatus().catch(() => {});
  const saved = readStoredAuthCredentials();
  if (authUsernameInput) authUsernameInput.value = username || saved?.username || authUsernameInput.value || "admin";
  if (authPasswordInput) authPasswordInput.value = "";
  if (authGate) authGate.hidden = false;
  document.body.classList.add("auth-required");
  setAuthMode(mode, text, mode === "signup" ? "#475467" : "#b42318");
  updateHeaderAuthState();
}

function hideAuthGate() {
  if (authGate) authGate.hidden = true;
  if (loginOtpPanel) loginOtpPanel.hidden = true;
  activeLoginChallengeId = "";
  activeLoginUsername = "";
  document.body.classList.remove("auth-required");
  if (authMessage) authMessage.textContent = "";
  updateHeaderAuthState();
}

function updateHeaderAuthState(saved = readStoredAuthCredentials()) {
  const signedIn = Boolean(saved?.username && saved?.token && !authIsExpired(saved));
  if (headerLoginButton) headerLoginButton.hidden = signedIn;
  if (headerSignupButton) headerSignupButton.hidden = signedIn;
  if (headerProfileButton) {
    headerProfileButton.hidden = !signedIn;
    headerProfileButton.textContent = signedIn ? saved.username : "";
  }
  if (headerLogoutButton) headerLogoutButton.hidden = !signedIn;
}

function normalizeServerUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

function apiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${serverBaseUrl}${path}`;
}

function isEditableElement(element) {
  return Boolean(element?.matches?.("input:not([readonly]):not(:disabled), textarea:not([readonly]):not(:disabled), select:not(:disabled), [contenteditable='true']"));
}

function markUserInputActive() {
  userInputActiveUntil = Date.now() + 3000;
}

function userIsEditing() {
  return Date.now() < userInputActiveUntil || isEditableElement(document.activeElement);
}

function setInputValueWhenIdle(input, value) {
  if (!input) return;
  if (document.activeElement === input || isEditableElement(input) && userIsEditing()) return;
  input.value = value || "";
}

async function apiFetch(path, options = {}) {
  const {
    skipAuthPrompt = false,
    authOverride = null,
    headers,
    ...fetchOptions
  } = options;
  const requestHeaders = new Headers(headers || {});
  const auth = authOverride || readAuthCredentials();
  if (auth?.token) {
    requestHeaders.set("Authorization", `Bearer ${auth.token}`);
  }
  const response = await fetchWithServerRecovery(path, {
    credentials: serverBaseUrl ? "include" : "same-origin",
    ...fetchOptions,
    headers: requestHeaders
  });
  if (response.status === 401 && !skipAuthPrompt) {
    clearSensitiveScreenData();
    clearAuthCredentials(true);
    if (!authGate || authGate.hidden) showAuthGate("Sign in to continue.");
    throw new AuthRequiredError();
  }
  return response;
}

async function publicApiJson(path, payload) {
  const response = await fetchWithServerRecovery(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
    credentials: serverBaseUrl ? "include" : "same-origin",
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

async function loadAuthPublicStatus() {
  try {
    const response = await fetchWithServerRecovery("/api/auth/public-status", {
      credentials: serverBaseUrl ? "include" : "same-origin",
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) authPublicStatus = data;
  } catch {}
  applyAuthAvailability();
  if (!authPublicStatus.otpEnabled && loginOtpPanel) loginOtpPanel.hidden = true;
  if (authSubmitButton) authSubmitButton.textContent = authPublicStatus.otpEnabled ? "Continue" : "Sign In";
  return authPublicStatus;
}

function isLocalSetupOrigin() {
  const host = String(window.location.hostname || "").toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
}

function applyAuthAvailability() {
  if (authPublicStatus.loginConfigured !== false) return;
  const canBootstrap = Boolean(authPublicStatus.localBootstrapAvailable) && isLocalSetupOrigin();
  if (loginPanel) loginPanel.hidden = true;
  if (signupPanel) signupPanel.hidden = true;
  if (forgotPasswordPanel) forgotPasswordPanel.hidden = true;
  if (loginChangePasswordPanel) loginChangePasswordPanel.hidden = true;
  if (loginOtpPanel) loginOtpPanel.hidden = true;
  if (localAdminSetupPanel) localAdminSetupPanel.hidden = !canBootstrap;
  if (authMessage) {
    authMessage.style.color = "#b42318";
    authMessage.textContent = canBootstrap
      ? "Administrator access has not been configured. Set a password on this server computer."
      : "Administrator access has not been configured. Open Smart Fin 365 locally on the server computer to complete secure setup.";
  }
  if (canBootstrap) setTimeout(() => localAdminSetupPasswordInput?.focus(), 50);
}

async function recoverServerConnection() {
  if (serverRecoveryPromise) return serverRecoveryPromise;
  serverRecoveryPromise = (async () => {
    const currentOrigin = normalizeServerUrl(window.location.origin);
    for (const candidate of serverCandidateUrls()) {
      if (!await pingServerUrl(candidate)) continue;
      serverBaseUrl = candidate === currentOrigin ? "" : candidate;
      if (serverBaseUrl) localStorage.setItem(serverUrlStorageKey, serverBaseUrl);
      else localStorage.removeItem(serverUrlStorageKey);
      updateServerUi();
      return true;
    }
    return false;
  })();
  try {
    return await serverRecoveryPromise;
  } finally {
    serverRecoveryPromise = null;
  }
}

async function fetchWithServerRecovery(path, options) {
  const requestOptions = () => ({
    ...options,
    credentials: serverBaseUrl ? "include" : "same-origin"
  });
  try {
    return await fetch(apiUrl(path), requestOptions());
  } catch (initialError) {
    const recovered = await recoverServerConnection();
    if (recovered) {
      try {
        return await fetch(apiUrl(path), requestOptions());
      } catch {}
    }
    throw new Error("Cannot reach the Smart Fin 365 server. Open the current application URL and make sure its /healthz endpoint is available.");
  }
}

function uniqueServerUrls(values) {
  const seen = new Set();
  return values
    .map((value) => normalizeServerUrl(value))
    .filter((value) => {
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

function serverCandidateUrls() {
  const currentOrigin = /^https?:\/\//i.test(window.location.origin) ? window.location.origin : "";
  return uniqueServerUrls([
    configuredPublicServerUrl,
    localStorage.getItem(serverUrlStorageKey),
    serverUrlInput.value,
    serverBaseUrl,
    ...configuredFallbackServerUrls,
    mobileDefaultServerUrl,
    currentOrigin
  ]);
}

async function pingServerUrl(baseUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(`${baseUrl}/healthz`, {
      signal: controller.signal,
      credentials: "include",
      cache: "no-store"
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function autoSelectReachableServer() {
  if (financeServerConfig.autoProbe === false) return false;
  const candidates = serverCandidateUrls();
  if (!candidates.length) return false;
  serverStatus.textContent = "Searching for Smart Fin 365 server...";
  for (const candidate of candidates) {
    if (await pingServerUrl(candidate)) {
      serverBaseUrl = candidate === window.location.origin ? "" : candidate;
      if (serverBaseUrl) {
        localStorage.setItem(serverUrlStorageKey, serverBaseUrl);
      } else {
        localStorage.removeItem(serverUrlStorageKey);
      }
      updateServerUi();
      serverStatus.textContent = `Connected: ${serverBaseUrl || window.location.origin}`;
      return true;
    }
  }
  return false;
}

function updateServerUi() {
  const activeServerUrl = serverBaseUrl || window.location.origin;
  if (serverUrlInput) serverUrlInput.value = activeServerUrl;
  if (authServerUrlInput && document.activeElement !== authServerUrlInput) {
    authServerUrlInput.value = /^https?:\/\//i.test(activeServerUrl) ? activeServerUrl : (configuredPublicServerUrl || "");
  }
  document.querySelector(".download-link").href = apiUrl("/download");
}

async function checkServerConnection() {
  updateServerUi();
  try {
    const response = await apiFetch("/healthz");
    if (!response.ok) throw new Error("Server did not respond.");
    serverStatus.textContent = serverBaseUrl
      ? `Connected: ${serverBaseUrl}`
      : `Connected: ${window.location.origin}`;
    return true;
  } catch (error) {
    if (await autoSelectReachableServer()) return true;
    serverStatus.textContent = `Cannot reach server. Add the public URL or update the URL, for example http://<laptop-ip>:3333.`;
    throw error;
  }
}

const pageTitles = {
  home: "Home",
  debt: "Lent Manager",
  chitty: "Chitty Family Circle",
  loan: "Loans and Property Loans",
  property: "Assets & Wealth",
  entries: "Master Ledger",
  summary: "Family Dashboard",
  "net-worth": "Net Worth",
  trading: "Trading Market Desk",
  growth: "Reports & Analytics",
  "family-expenses": "Family Expenses",
  "family-income": "Family Income",
  "children-expenses": "Children Expenses",
  "personal-maintenance": "Personal Maintenance",
  "salary-income": "Family Income",
  "farm-manager": "Agriculture & Farm Manager",
  savings: "Family Income",
  "other-assets": "Assets & Wealth",
  "business-manager": "Business Manager",
  "goals-planning": "Goals & Planning",
  "tax-planner": "Tax Planner",
  "bank-cash-manager": "Family Income",
  "insurance-manager": "Insurance Manager",
  "document-vault": "Document Vault",
  "bill-utilities": "Bill & Utilities",
  "financial-calendar": "Calendar Reminder Archive",
  "budget-planner": "Budget Planner",
  "backup-restore": "Backup & Restore",
  "export-center": "Export Center",
  "settings-sync": "Settings",
  "notification-center": "Notification Center",
  language: "Language",
  "help-support": "Help & Support",
  features: "Features",
  pricing: "Pricing",
  about: "About",
  contact: "Contact",
  "privacy-policy": "Privacy Policy",
  terms: "Terms",
  "refund-policy": "Refund Policy",
  faq: "FAQ"
};

const masterModuleBlueprints = {
  "family-income": {
    title: "Family Income",
    summary: "Family income sources, received amounts and pending income.",
    tone: "income",
    tabs: [
      { id: "records", title: "Family Income Records", slug: "family-income" }
    ]
  },
  "family-expenses": {
    title: "Family Expenses",
    summary: "Household, children, insurance, bills, medical, education and other family expenses.",
    tone: "family",
    tabs: [
      { id: "household", title: "Household Expenses", slug: "family-expenses" },
      { id: "children", title: "Children Expenses", slug: "children-expenses" },
      { id: "insurance", title: "Insurance", slug: "insurance-manager" },
      { id: "bills", title: "Bills & Utilities", slug: "bill-utilities" },
      { id: "personal", title: "Medical, Education & Other", slug: "personal-maintenance" }
    ]
  },
  "salary-income": {
    title: "Family Income",
    summary: "Salary, deductions, rent, agriculture and other income.",
    tone: "income",
    tabs: [
      { id: "records", title: "Income Records", slug: "salary-income" }
    ]
  },
  "farm-manager": {
    title: "Agriculture & Farm Manager",
    summary: "Farms, crops, activities, income, expenses, receivables, pending income and profit/loss.",
    tone: "farm",
    tabs: [
      { id: "records", title: "Farm Records", slug: "farm-manager" },
      { id: "agriculture", title: "Agriculture/Farm Records", slug: "agriculture-farm-records" },
      { id: "inventory", title: "Farm Inventory", slug: "farm-inventory" }
    ]
  },
  savings: {
    title: "Savings",
    summary: "Savings balances, interest earned and growth records.",
    tone: "cash",
    tabs: [
      { id: "records", title: "Savings Records", slug: "savings" }
    ]
  },
  "other-assets": {
    title: "Other Assets",
    summary: "Other asset value, current value and income/profit records.",
    tone: "assets",
    tabs: [
      { id: "records", title: "Other Asset Records", slug: "other-assets" }
    ]
  },
  "children-expenses": {
    title: "Children Expenses",
    summary: "Children expenses, paid amounts and pending amounts.",
    tone: "family",
    tabs: [
      { id: "records", title: "Children Expense Records", slug: "children-expenses" }
    ]
  },
  "personal-maintenance": {
    title: "Personal Maintenance",
    summary: "Personal maintenance planned, paid and pending expenses.",
    tone: "family",
    tabs: [
      { id: "records", title: "Personal Maintenance Records", slug: "personal-maintenance" }
    ]
  },
  "business-manager": {
    title: "Business Manager",
    summary: "Business profiles, investments, sales, expenses, inventory and profit/loss.",
    tone: "business",
    tabs: [
      { id: "dashboard", title: "Dashboard", type: "business-dashboard" },
      { id: "profiles", title: "Business Profiles", slug: "business-profiles" },
      { id: "investments", title: "Investments", slug: "business-investments" },
      { id: "income", title: "Income/Sales", slug: "business-income" },
      { id: "expenses", title: "Expenses", slug: "business-expenses" },
      { id: "assets", title: "Assets", slug: "business-assets" },
      { id: "liabilities", title: "Liabilities", slug: "business-liabilities" },
      { id: "receivables", title: "Receivables", slug: "business-receivables" },
      { id: "payables", title: "Payables", slug: "business-payables" },
      { id: "inventory", title: "Inventory", slug: "business-inventory" },
      { id: "profit-loss", title: "Profit & Loss", type: "business-dashboard" },
      { id: "reports", title: "Reports", type: "business-dashboard" }
    ]
  },
  "goals-planning": {
    title: "Goals & Planning",
    summary: "Goals, budget planning, planned vs actual, contributions, target dates and recommendations.",
    tone: "goals",
    tabs: [
      { id: "dashboard", title: "Goal Dashboard", type: "goals-dashboard" },
      { id: "add", title: "Add/Edit Goal", slug: "goals" },
      { id: "records", title: "Goal Records", slug: "goals", display: "goal-cards" },
      { id: "budget", title: "Budget Planning", slug: "budget-planner" },
      { id: "contributions", title: "Contributions", slug: "goal-contributions" },
      { id: "recommendations", title: "Recommendations", type: "goal-recommendations" },
      { id: "categories", title: "Goal Categories Settings", slug: "goal-categories" }
    ]
  },
  "tax-planner": {
    title: "Tax Planner",
    summary: "Tax profile, deductions, estimate and yearly tax records.",
    tone: "tax",
    tabs: [
      { id: "planner", title: "Tax Planner", slug: "tax-planner" },
      { id: "recommendations", title: "Tax Recommendations", type: "tax-advisory" }
    ]
  },
  "bank-cash-manager": {
    title: "Family Income",
    summary: "Cash, bank balances, savings accounts, deposits, recurring deposits and interest growth.",
    tone: "cash",
    tabs: [
      { id: "records", title: "Bank & Cash Records", slug: "bank-cash-manager" },
      { id: "savings", title: "Savings and Deposits", slug: "savings" }
    ]
  },
  "insurance-manager": {
    title: "Insurance Manager",
    summary: "Insurance policies, premium dates, coverage and renewals.",
    tone: "insurance",
    tabs: [
      { id: "records", title: "Insurance Records", slug: "insurance-manager" }
    ]
  },
  "document-vault": {
    title: "Document Vault",
    summary: "Important document numbers, locations, expiry dates and renewal status.",
    tone: "document",
    tabs: [
      { id: "records", title: "Document Records", slug: "document-vault" }
    ]
  },
  "bill-utilities": {
    title: "Bill & Utilities",
    summary: "Utility bills, due dates, payments and balances.",
    tone: "bills",
    tabs: [
      { id: "records", title: "Bill Records", slug: "bill-utilities" }
    ]
  },
  "financial-calendar": {
    title: "Calendar Reminder Archive",
    summary: "Archived due dates, events and commitments mirrored into module reminders.",
    tone: "calendar",
    tabs: [
      { id: "records", title: "Archived Reminder Records", slug: "financial-calendar" }
    ]
  },
  "budget-planner": {
    title: "Budget Planner",
    summary: "Monthly planned versus actual budget tracking.",
    tone: "budget",
    tabs: [
      { id: "records", title: "Budget Records", slug: "budget-planner" }
    ]
  },
  "backup-restore": {
    title: "Backup & Restore",
    summary: "Backup inventory, file contents, restore previews and recovery history.",
    tone: "backup",
    tabs: [
      { id: "browser", title: "Backup Browser", type: "backup-browser" },
      { id: "records", title: "Backup Records", slug: "backup-restore" }
    ]
  },
  "export-center": {
    title: "Export Center",
    summary: "Export by module, year, month, category, user, specific records and format: Excel, CSV, PDF or JSON.",
    tone: "export",
    tabs: [
      { id: "records", title: "Export Records", slug: "export-center" }
    ]
  },
  "notification-center": {
    title: "Notification Center",
    summary: "Reminders, priority alerts and pending actions.",
    tone: "notify",
    tabs: [
      { id: "records", title: "Notification Records", slug: "notification-center" }
    ]
  }
};

const moduleState = {
  activeTabByPage: {},
  dataBySlug: {},
  editing: null,
  searchByTab: {},
  filterByTab: {},
  sortByTab: {},
  pageByTab: {},
  pageSize: 8,
  loading: false
};

const entryTypeOptionsByPage = {
  debt: ["debt_given", "debt_cleared"],
  chitty: ["chitty_paid", "chitty_received", "month_entry"],
  loan: ["loan", "month_entry"]
};

const entryTypeOptionLabels = {
  debt_given: "Amount Lent",
  debt_cleared: "Amount Recovered",
  chitty_paid: "Chitty Paid",
  chitty_received: "Chitty Received",
  loan: "General Loan",
  month_entry: "Month Entry"
};

const typeFilterOptions = {
  entries: [
    ["", "All Types"],
    ["debt_given", "Amount Lent"],
    ["debt_cleared", "Amount Recovered"],
    ["chitty_paid", "Chitty Paid"],
    ["chitty_received", "Chitty Received"],
    ["loan_pending", "Loan Pending"],
    ["loan_cleared", "Loan Cleared"],
    ["property", "Properties"],
    ["trading", "Trading"]
  ],
  debt: [
    ["", "All Lent Records"],
    ["debt_given", "Amount Lent"],
    ["debt_cleared", "Amount Recovered"]
  ],
  chitty: [
    ["", "All Chitty Records"],
    ["chitty_paid", "Chitty Paid"],
    ["chitty_received", "Chitty Received"]
  ],
  loan: [
    ["", "All Loan Records"],
    ["loan_pending", "Loan Pending"],
    ["loan_cleared", "Loan Cleared"]
  ]
};

const monthEntryTargetOptions = {
  chitty: "Chitty / Group",
  loan: "General Loan"
};

const modeOptions = ["", "Cash", "UPI", "Bank Transfer", "Cheque", "Other"];
const debtStatusOptions = [["Cleared", "Completed"], ["Pending", "Running"], ["Partial", "Partial"]];
const chittyStatusOptions = [["Completed", "Completed"], ["Running", "Running"], ["Partial", "Partial"]];
const loanStatusOptions = [["Cleared", "Completed"], ["On-Going", "Running"], ["Partial", "Partial"]];
const typeOfFundOptions = ["Hand Loan", "Bank Loan"];

const sheetHeadersByPage = {
  debt: [
    "Date",
    "Loan Type",
    "Person",
    "Amount Lent",
    "Date Given",
    "Date Cleared",
    "Mode",
    "Status",
    "Principal Received",
    "Interest Received",
    "Outstanding Principal",
    "Outstanding Interest",
    "Notes"
  ],
  chitty: [
    "Chitty / Group",
    "Balance Amount",
    "Total Chitty Value",
    "Quantity",
    "Tenure (Months)",
    "Starting Month",
    "Status",
    "Month Entry",
    "Notes"
  ],
  loan: [
    "Borrowed From",
    "Type of Fund",
    "Borrowed Date",
    "Cleared Date",
    "Principal",
    "Interest Percentage",
    "EMI",
    "Tenure (Months)",
    "Loan Amount",
    "Notes",
    "Status",
    "First EMI"
  ],
  trading: [
    "ID",
    "Asset Type",
    "Symbol / Name",
    "Invested Date",
    "Average Buy Price",
    "Current Market Price",
    "Quantity",
    "Invested Value",
    "Current Value",
    "Realised Profit/Loss",
    "Unrealised Profit/Loss",
    "Profit/Loss",
    "Profit %",
    "Last Updated Timestamp"
  ]
};

const visibleHeaderByPage = {
  debt: {
    "Loan Type": "Lent Type",
    "Amount Lent": "Amount Lent"
  }
};

function visibleSheetHeader(page, header) {
  return visibleHeaderByPage[page]?.[header] || header;
}

function normalizePage(value) {
  const page = String(value || "").replace(/^#/, "") || "home";
  return pageTitles[page] ? page : "home";
}

function setHidden(element, hidden) {
  if (element) element.classList.toggle("page-hidden", Boolean(hidden));
}

function setLabelCaption(labelId, text) {
  const label = document.querySelector(`#${labelId}`);
  if (!label) return;
  let textNode = Array.from(label.childNodes).find((node) => node.nodeType === 3 && node.textContent.trim());
  if (!textNode) {
    textNode = document.createTextNode("");
    label.insertBefore(textNode, label.firstChild);
  }
  textNode.textContent = `\n            ${text}\n            `;
}

function updatePageFieldLabels() {
  const type = typeInput.value;
  const monthTarget = monthEntryTargetInput.value;
  let dateLabel = "Date";
  let partyLabel = "Person";
  let amountLabel = "Amount";

  if (currentPage === "debt") {
    partyLabel = "Person";
    amountLabel = type === "debt_cleared" ? "Amount Recovered" : "Amount Lent";
  } else if (currentPage === "chitty") {
    partyLabel = "Chitty / Group Name";
    amountLabel = type === "month_entry" ? "Current Month Paid" : "Chitty Amount";
  } else if (currentPage === "loan") {
    partyLabel = "Borrowed From";
    amountLabel = type === "month_entry" ? "Loan Payment Amount" : "Principal";
    dateLabel = type === "month_entry" ? "Payment Date" : "Borrowed Date";
  }

  setLabelCaption("dateLabel", dateLabel);
  setLabelCaption("partyLabel", partyLabel);
  setLabelCaption("amountLabel", amountLabel);
}

function ensureToolbar(panel) {
  if (!panel) return null;
  let toolbar = panel.querySelector(":scope > .page-toolbar");
  if (!toolbar) {
    toolbar = document.createElement("div");
    toolbar.className = "page-toolbar";
    toolbar.innerHTML = `
      <div>
        <p class="eyebrow">Smart Fin 365</p>
        <h2 class="page-title"></h2>
      </div>
      <a class="home-button" href="#home" data-route="home">Home</a>
    `;
    panel.insertBefore(toolbar, panel.firstElementChild);
  }
  return toolbar;
}

function setPanelTitle(panel, title) {
  const toolbar = ensureToolbar(panel);
  const titleElement = toolbar && toolbar.querySelector(".page-title");
  if (titleElement) titleElement.textContent = title;
}

function renderMasterModule(page) {
  const blueprint = masterModuleBlueprints[page];
  if (!blueprint || !moduleIntro || !moduleSections) return;
  const activeTab = activeModuleTab(page);
  moduleIntro.innerHTML = `
    <p class="eyebrow">Excel-backed module</p>
    <h2>${escapeHtml(blueprint.title)}</h2>
    <p>${escapeHtml(blueprint.summary)}</p>
    <div class="module-sync-line" id="moduleSyncLine">Loading synced records...</div>
  `;
  moduleSections.innerHTML = `
    <div class="module-tabs" role="tablist">
      ${blueprint.tabs.map((tab) => `
        <button class="module-tab${tab.id === activeTab.id ? " active" : ""}" type="button" data-module-tab="${escapeHtml(tab.id)}">
          ${escapeHtml(tab.title)}
        </button>
      `).join("")}
    </div>
    <div class="module-content" id="moduleContent">
      <div class="module-loading">Loading ${escapeHtml(activeTab.title)}...</div>
    </div>
  `;
  loadModulePage(page).catch((error) => {
    const content = document.querySelector("#moduleContent");
    if (content) content.innerHTML = `<div class="module-error">${escapeHtml(error.message || "Could not load this module.")}</div>`;
  });
}

function activeModuleTab(page) {
  const blueprint = masterModuleBlueprints[page];
  const saved = moduleState.activeTabByPage[page];
  return blueprint.tabs.find((tab) => tab.id === saved) || blueprint.tabs[0];
}

function setActiveModuleTab(page, tabId) {
  moduleState.activeTabByPage[page] = tabId;
  moduleState.editing = null;
  renderMasterModule(page);
}

function moduleTabKey(page, tab) {
  return `${page}:${tab.id}`;
}

function moduleData(slug) {
  return moduleState.dataBySlug[slug] || null;
}

async function loadModuleSlug(slug) {
  if (!slug) return null;
  const response = await apiFetch(`/api/modules/${encodeURIComponent(slug)}?t=${Date.now()}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not load module records.");
  moduleState.dataBySlug[slug] = data;
  return data;
}

async function loadModulePage(page) {
  const blueprint = masterModuleBlueprints[page];
  if (!blueprint) return;
  const slugs = [...new Set(blueprint.tabs.map((tab) => tab.slug).filter(Boolean))];
  const activeTab = activeModuleTab(page);
  if (activeTab.type === "business-dashboard" && !slugs.includes("business-profiles")) slugs.push("business-profiles");
  if ((activeTab.type || "").startsWith("goal") && !slugs.includes("goals")) slugs.push("goals");
  if ((activeTab.type || "").startsWith("goal") && !slugs.includes("goal-categories")) slugs.push("goal-categories");
  if (activeTab.type === "backup-browser") {
    const response = await apiFetch("/api/backups");
    const data = await response.json();
    backupInventory = data.backups || [];
  }
  if (activeTab.type === "tax-advisory") {
    const response = await apiFetch("/api/tax-advisory");
    taxAdvisoryData = await response.json();
  }
  await Promise.all(slugs.map((slug) => loadModuleSlug(slug)));
  renderModuleContent(page);
}

function renderModuleContent(page) {
  const blueprint = masterModuleBlueprints[page];
  const tab = activeModuleTab(page);
  const content = document.querySelector("#moduleContent");
  const syncLine = document.querySelector("#moduleSyncLine");
  if (!content || !blueprint || !tab) return;
  const tabData = tab.slug ? moduleData(tab.slug) : null;
  const syncParts = [];
  if (tabData) {
    syncParts.push(`Sheet: ${tabData.sheet}`);
    syncParts.push(`${tabData.records.length} ${tabData.records.length === 1 ? "record" : "records"}`);
    if (tabData.sync?.pending) syncParts.push(`${tabData.sync.pending} Pending Sync`);
  } else {
    syncParts.push("Dashboard values are calculated from saved records");
  }
  if (syncLine) syncLine.textContent = syncParts.join(" | ");

  if (tab.type === "business-dashboard") {
    content.innerHTML = renderBusinessDashboard();
    return;
  }
  if (tab.type === "goals-dashboard") {
    content.innerHTML = renderGoalsDashboard();
    return;
  }
  if (tab.type === "goal-recommendations") {
    content.innerHTML = renderGoalRecommendations();
    return;
  }
  if (tab.type === "backup-browser") {
    content.innerHTML = renderBackupBrowser();
    applyBackupFilters();
    return;
  }
  if (tab.type === "tax-advisory") {
    content.innerHTML = renderTaxAdvisory();
    return;
  }
  if (!tabData) {
    content.innerHTML = `<div class="module-loading">Loading ${escapeHtml(tab.title)}...</div>`;
    return;
  }
  content.innerHTML = renderRecordModule(page, tab, tabData);
  recalculateModuleForm(content.querySelector(".module-record-form"));
}

function renderBusinessDashboard() {
  const data = moduleData("business-profiles") || moduleData("business-income") || {};
  const summary = data.businessSummary || {};
  const tone = Number(summary.profitLoss || 0) < 0 ? "negative" : Number(summary.profitLoss || 0) > 0 ? "positive" : "on-track";
  return `
    <div class="module-dashboard-grid">
      ${summaryCard("Business Profit/Loss", signedMoneyHtml(summary.profitLoss || 0), tone)}
      ${summaryCard("Pending Receivables", formatMoney.format(summary.pendingReceivables || 0), "on-track")}
      ${summaryCard("Business Net Worth", signedMoneyHtml(summary.netWorth || 0), toneForNumber(summary.netWorth || 0))}
      ${summaryCard("ROI %", signedPercentHtml(summary.roiPercent || 0), toneForNumber(summary.roiPercent || 0))}
      ${summaryCard("Profit Margin %", signedPercentHtml(summary.profitMarginPercent || 0), toneForNumber(summary.profitMarginPercent || 0))}
      ${summaryCard("Total Investment", formatMoney.format(summary.investmentTotal || 0), "neutral")}
    </div>
    <div class="module-note">Values are calculated from Business Investment, Income/Sales, Expenses, Assets, Liabilities and Receivables records.</div>
  `;
}

function renderGoalsDashboard() {
  const data = moduleData("goals") || {};
  const summary = data.goalsSummary || {};
  return `
    <div class="module-dashboard-grid">
      ${summaryCard("Goals", summary.goalCount || 0, "neutral")}
      ${summaryCard("Target Amount", formatMoney.format(summary.targetAmount || 0), "neutral")}
      ${summaryCard("Amount Saved", formatMoney.format(summary.amountSaved || 0), "positive")}
      ${summaryCard("Remaining Amount", formatMoney.format(summary.remainingAmount || 0), "on-track")}
      ${summaryCard("Progress", `${formatPercentInput(summary.progressPercentage || 0) || "0.00"}%`, "positive")}
      ${summaryCard("Completed", summary.completed || 0, "positive")}
    </div>
  `;
}

function renderGoalRecommendations() {
  const goals = (moduleData("goals")?.records || []).filter((goal) => String(goal.status || "").toLowerCase() !== "completed");
  const aiCategories = [
    "Emergency Fund", "Mutual Funds", "FD", "Bonds", "Gold", "PPF", "NPS", "EPF",
    "Stocks", "Debt Reduction", "Monthly Wealth Improvement", "Future Wealth Projection",
    "Risk Analysis", "Tax Insights"
  ];
  return `
    <div class="recommendation-list">
      ${aiCategories.map((category) => `
        <article class="recommendation-card">
          <h3>${escapeHtml(category)}</h3>
          <p>AI recommendation placeholder based on income, expenses, savings, goals, risk and tax profile.</p>
          <strong class="value-tone value-on-track">Review monthly</strong>
          <small>No Net Worth reports are included inside Goals.</small>
        </article>
      `).join("")}
      ${goals.map((goal) => {
        const required = Number(goal.requiredMonthlyContribution || 0);
        const target = Number(goal.monthlyContributionTarget || 0);
        const tone = required > target && target ? "negative" : "on-track";
        return `
          <article class="recommendation-card">
            <h3>${escapeHtml(goal.goalName)}</h3>
            <p>${escapeHtml(goal.goalCategory || "Goal")} for ${escapeHtml(goal.familyMember || "Family")}</p>
            <div class="progress-track"><span style="width:${Math.min(Number(goal.progressPercentage || 0), 100)}%"></span></div>
            <strong class="value-tone value-${tone}">${formatMoney.format(required)} required monthly</strong>
            <small>Remaining: ${formatMoney.format(goal.remainingAmount || 0)} | Target date: ${escapeHtml(goal.targetDate || "")}</small>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function backupTone(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("valid") || text.includes("available") || text.includes("eligible")) return "positive";
  if (text.includes("invalid") || text.includes("corrupt") || text.includes("failed") || text.includes("unavailable")) return "negative";
  return "on-track";
}

function formatBackupDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function backupMatchesView(backup) {
  const searchable = [
    backup.backupId,
    backup.backupName,
    backup.backupType,
    backup.backupPeriod,
    backup.createdBy,
    backup.source,
    backup.status,
    backup.checksumStatus
  ].join(" ").toLowerCase();
  if (backupViewState.query && !searchable.includes(backupViewState.query.toLowerCase())) return false;
  if (backupViewState.type !== "all" && String(backup.backupType || "").toLowerCase() !== backupViewState.type) return false;
  if (backupViewState.status !== "all" && String(backup.status || "").toLowerCase() !== backupViewState.status) return false;
  if (backupViewState.integrity !== "all" && String(backup.checksumStatus || "").toLowerCase() !== backupViewState.integrity) return false;
  if (backupViewState.availability === "available" && String(backup.status || "").toLowerCase() !== "available") return false;
  if (backupViewState.availability === "expired" && new Date(backup.retentionExpiry || 0).getTime() >= Date.now()) return false;
  const backupDate = new Date(backup.createdAt || backup.modifiedAt || 0);
  if (backupViewState.dateFrom && backupDate < new Date(`${backupViewState.dateFrom}T00:00:00`)) return false;
  if (backupViewState.dateTo && backupDate > new Date(`${backupViewState.dateTo}T23:59:59`)) return false;
  return true;
}

function visibleBackups() {
  return backupInventory.filter(backupMatchesView);
}

function applyBackupFilters() {
  const visibleIds = new Set(visibleBackups().map((backup) => backup.backupId));
  modulePanel?.querySelectorAll("[data-backup-row]").forEach((row) => {
    row.hidden = !visibleIds.has(row.dataset.backupId);
  });
  const count = modulePanel?.querySelector("[data-backup-count]");
  if (count) {
    const shown = visibleIds.size;
    const total = backupInventory.length;
    count.textContent = `${shown} of ${total} backup${total === 1 ? "" : "s"} shown${backupViewState.message ? ` | ${backupViewState.message}` : ""}`;
  }
}

function renderBackupRestorePlan() {
  const plan = backupViewState.restorePlan;
  if (!plan) return "";
  const selected = backupInventory.find((backup) => backup.backupId === plan.selectedBackupId);
  return `
    <section class="backup-restore-plan" aria-live="polite">
      <div class="backup-plan-heading">
        <div>
          <p class="module-eyebrow">Restore preview</p>
          <h3>${escapeHtml(selected?.backupName || plan.selectedBackupId)}</h3>
        </div>
        <span class="backup-badge value-${backupTone(plan.restoreEligibility)}">${escapeHtml(plan.restoreEligibility || "Review required")}</span>
      </div>
      <p class="backup-warning">${escapeHtml(plan.warning || "Review the complete backup chain before restoring.")}</p>
      <dl class="backup-plan-details">
        <div><dt>Estimated restore point</dt><dd>${escapeHtml(formatBackupDate(plan.estimatedRestorePoint))}</dd></div>
        <div><dt>Affected datasets</dt><dd>${escapeHtml((plan.affectedDatasets || []).join(", ") || "No datasets found")}</dd></div>
        <div><dt>Dependency check</dt><dd>${plan.chainValid ? "Complete and validated" : "Incomplete or invalid"}</dd></div>
      </dl>
      <ol class="backup-chain-list">
        ${(plan.chain || []).map((backup, index) => `
          <li>
            <strong>${index + 1}. ${escapeHtml(backup.backupName)}</strong>
            <span>${escapeHtml(`${backup.backupType} | ${backup.checksumStatus} checksum | ${formatBackupDate(backup.createdAt)}`)}</span>
          </li>
        `).join("")}
      </ol>
      ${plan.missingDependencies?.length ? `<p class="backup-error">Missing dependencies: ${escapeHtml(plan.missingDependencies.join(", "))}</p>` : ""}
      ${plan.invalidDependencies?.length ? `<p class="backup-error">Invalid dependencies: ${escapeHtml(plan.invalidDependencies.join(" "))}</p>` : ""}
      <div class="module-actions-row backup-plan-actions">
        <button type="button" class="module-page-button" data-backup-select-chain="${escapeHtml(plan.selectedBackupId)}">Select Complete Restore Chain</button>
        ${plan.restoreSupported && plan.chainValid ? `<button type="button" class="module-add-button" data-backup-restore="${escapeHtml(plan.selectedBackupId)}">Continue to Restore</button>` : ""}
      </div>
      ${backupViewState.restoreMode && plan.restoreSupported && plan.chainValid ? `
        <form class="backup-restore-form" data-backup-restore-form>
          <input type="hidden" name="backupId" value="${escapeHtml(plan.selectedBackupId)}">
          <label>Restore scope
            <select name="scope">
              <option value="complete_system">Complete system restore</option>
            </select>
          </label>
          <label>Type RESTORE to confirm
            <input name="confirmation" autocomplete="off" required pattern="RESTORE" placeholder="RESTORE">
          </label>
          <p class="backup-destructive-warning">This replaces the active workbook only after creating a new pre-restore full backup. The action is audited and rolls back to that safety backup if verification fails.</p>
          <button type="submit" class="backup-restore-button">Restore Validated Backup</button>
          <p class="module-sync-line" data-backup-restore-status></p>
        </form>
      ` : ""}
    </section>
  `;
}

function renderBackupBrowser() {
  const backups = visibleBackups();
  const total = backupInventory.length;
  const valid = backupInventory.filter((backup) => backup.checksumStatus === "Valid").length;
  const available = backupInventory.filter((backup) => String(backup.status || "").toLowerCase() === "available").length;
  const eligible = backupInventory.filter((backup) => backup.restoreEligible).length;
  return `
    <section class="backup-summary-grid">
      ${summaryCard("Catalogued backups", total, "neutral")}
      ${summaryCard("Validated", valid, valid ? "positive" : "on-track")}
      ${summaryCard("Available", available, available ? "positive" : "negative")}
      ${summaryCard("Restore eligible", eligible, eligible ? "positive" : "on-track")}
    </section>
    <section class="backup-controls">
      <input type="search" class="module-search" placeholder="Search backup ID, name, source or status" value="${escapeHtml(backupViewState.query)}" data-backup-search>
      <select class="module-filter" data-backup-filter="type" aria-label="Backup type">
        <option value="all"${backupViewState.type === "all" ? " selected" : ""}>All backup types</option>
        <option value="full"${backupViewState.type === "full" ? " selected" : ""}>Full backups</option>
        <option value="incremental"${backupViewState.type === "incremental" ? " selected" : ""}>Incremental backups</option>
      </select>
      <select class="module-filter" data-backup-filter="status" aria-label="Backup status">
        <option value="all"${backupViewState.status === "all" ? " selected" : ""}>All statuses</option>
        <option value="available"${backupViewState.status === "available" ? " selected" : ""}>Successful / available</option>
        <option value="corrupted"${backupViewState.status === "corrupted" ? " selected" : ""}>Failed / corrupted</option>
      </select>
      <select class="module-filter" data-backup-filter="integrity" aria-label="Integrity status">
        <option value="all"${backupViewState.integrity === "all" ? " selected" : ""}>All integrity states</option>
        <option value="valid"${backupViewState.integrity === "valid" ? " selected" : ""}>Checksum valid</option>
        <option value="unverified"${backupViewState.integrity === "unverified" ? " selected" : ""}>Not yet validated</option>
        <option value="invalid"${backupViewState.integrity === "invalid" ? " selected" : ""}>Checksum invalid</option>
      </select>
      <select class="module-filter" data-backup-filter="availability" aria-label="Retention availability">
        <option value="all"${backupViewState.availability === "all" ? " selected" : ""}>All retention states</option>
        <option value="available"${backupViewState.availability === "available" ? " selected" : ""}>Available backups</option>
        <option value="expired"${backupViewState.availability === "expired" ? " selected" : ""}>Expired backups</option>
      </select>
      <label class="backup-date-filter">From<input type="date" value="${escapeHtml(backupViewState.dateFrom)}" data-backup-filter="dateFrom"></label>
      <label class="backup-date-filter">To<input type="date" value="${escapeHtml(backupViewState.dateTo)}" data-backup-filter="dateTo"></label>
    </section>
    <p class="module-inline-status" data-backup-count>${backups.length} of ${total} backup${total === 1 ? "" : "s"} shown${backupViewState.message ? ` | ${escapeHtml(backupViewState.message)}` : ""}</p>
    ${renderBackupRestorePlan()}
    ${total ? `
      <div class="backup-table-shell">
        <table class="module-table backup-browser-table">
          <thead>
            <tr>
              <th>Backup</th>
              <th>Type / period</th>
              <th>Created</th>
              <th>Size</th>
              <th>Created by / source</th>
              <th>Dependencies</th>
              <th>Integrity / retention</th>
              <th>Restore eligibility</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${backupInventory.map((backup) => `
              <tr data-backup-row data-backup-id="${escapeHtml(backup.backupId)}">
                <td data-label="Backup"><strong>${escapeHtml(backup.backupName)}</strong><small>${escapeHtml(backup.backupId)}</small></td>
                <td data-label="Type / period"><span class="backup-badge value-${backupTone(backup.backupType)}">${escapeHtml(backup.backupType)}</span><small>${escapeHtml(backup.backupPeriod)}</small></td>
                <td data-label="Created">${escapeHtml(formatBackupDate(backup.createdAt))}</td>
                <td data-label="Size">${escapeHtml(formatFileSize(backup.size || 0))}</td>
                <td data-label="Created by / source">${escapeHtml(backup.createdBy || "System")}<small>${escapeHtml(backup.source || "")}</small></td>
                <td data-label="Dependencies"><small>Full: ${escapeHtml(backup.parentFullBackupId || "Self")}</small><small>Previous: ${escapeHtml(backup.previousIncrementalBackupId || "None")}</small></td>
                <td data-label="Integrity / retention"><span class="backup-badge value-${backupTone(backup.checksumStatus)}">${escapeHtml(backup.checksumStatus)}</span><small>${escapeHtml(`Status: ${backup.status || "Unknown"}`)}</small><small>${escapeHtml(`Expires: ${formatBackupDate(backup.retentionExpiry)}`)}</small></td>
                <td data-label="Restore eligibility"><span class="backup-badge value-${backup.restoreEligible ? "positive" : "on-track"}">${backup.restoreEligible ? "Eligible" : "Validate / review"}</span><small>${escapeHtml(backup.restoreSupport || "")}</small></td>
                <td data-label="Actions" class="backup-actions">
                  <button type="button" class="module-page-button" data-backup-view="${escapeHtml(backup.backupId)}">View</button>
                  <button type="button" class="module-page-button" data-backup-validate="${escapeHtml(backup.backupId)}">Validate</button>
                  <button type="button" class="module-page-button" data-backup-download="${escapeHtml(backup.backupId)}">Download</button>
                  <button type="button" class="backup-restore-button" data-backup-restore="${escapeHtml(backup.backupId)}"${backup.restoreEligible ? "" : " disabled"}>Restore</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : '<div class="module-empty">No backup files found.</div>'}
    <p class="module-sync-line">Backup files remain separate from the active workbook. A restore validates the selected snapshot, creates a pre-restore full backup, requires RESTORE confirmation, and records the result without exposing server paths, credentials, tokens, or encryption keys.</p>
  `;
}

async function refreshBackupInventory(message = "") {
  const response = await apiFetch("/api/backups");
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not load backup inventory.");
  backupInventory = data.backups || [];
  backupViewState.message = message;
  renderModuleContent("backup-restore");
}

async function openBackupRestorePlan(backupId, restoreMode = false) {
  const response = await apiFetch(`/api/backups/${encodeURIComponent(backupId)}/restore-chain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not validate the restore chain.");
  backupViewState.selectedBackupId = backupId;
  backupViewState.restorePlan = data.plan;
  backupViewState.restoreMode = restoreMode;
  backupViewState.message = restoreMode ? "Restore confirmation is ready after chain validation." : "Backup details and dependency chain loaded.";
  renderModuleContent("backup-restore");
}

function renderTaxAdvisory() {
  const data = taxAdvisoryData || {};
  const basis = data.recordBasis || {};
  const oldRegime = data.oldRegimeEstimate || {};
  const newRegime = data.newRegimeEstimate || {};
  const detections = data.detectedExemptions || [];
  const recommendation = data.recommendedRegime || "Review";
  return `
    <section class="module-dashboard-grid">
      ${summaryCard("Applicable Financial Year", escapeHtml(data.financialYear || "Not configured"), "neutral")}
      ${summaryCard("Tax Rule Last Updated", escapeHtml(data.ruleLastUpdated || "Not configured"), data.hasCurrentOfficialRules ? "positive" : "negative")}
      ${summaryCard("Official Source", escapeHtml(data.officialSource || "Unavailable"), data.hasCurrentOfficialRules ? "positive" : "negative")}
      ${summaryCard("Recorded Income Basis", signedMoneyHtml(basis.income || 0), "neutral")}
      ${summaryCard("Investment Basis", signedMoneyHtml(basis.investments || 0), "neutral")}
      ${summaryCard("Eligible Expense Basis", signedMoneyHtml(basis.eligibleExpenses || 0), "neutral")}
      ${summaryCard("Old Regime Tax", signedMoneyHtml(oldRegime.estimatedTax || 0), "neutral")}
      ${summaryCard("New Regime Tax", signedMoneyHtml(newRegime.estimatedTax || 0), "neutral")}
      ${summaryCard("Recommended Regime", escapeHtml(recommendation), recommendation === "Old Regime" || recommendation === "New Regime" ? "positive" : "neutral")}
      ${summaryCard("Estimated Tax Saved", signedMoneyHtml(data.estimatedTaxSaved || 0), "positive")}
    </section>
    <section class="module-card">
      <h2>Detected Exemptions and Deductions</h2>
      <div class="module-dashboard-grid">
        ${detections.map((item) => summaryCard(item.label, signedMoneyHtml(item.amount || 0), item.amount > 0 ? "positive" : "neutral")).join("")}
      </div>
    </section>
    <p class="module-sync-line">${escapeHtml(data.message || "Tax calculations are estimates and require professional verification.")}</p>
  `;
}

function formatFileSize(bytes) {
  const size = Number(bytes || 0);
  if (size > 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`;
  if (size > 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}

function summaryCard(label, value, tone = "neutral") {
  return `
    <article class="module-summary-card value-${escapeHtml(tone)}">
      <span>${escapeHtml(label)}</span>
      <strong>${value}</strong>
    </article>
  `;
}

function renderRecordModule(page, tab, data) {
  const key = moduleTabKey(page, tab);
  const query = moduleState.searchByTab[key] || "";
  const filter = moduleState.filterByTab[key] || "";
  const records = filteredModuleRecords(page, tab, data);
  const pageIndex = Math.max(1, moduleState.pageByTab[key] || 1);
  const pageCount = Math.max(Math.ceil(records.length / moduleState.pageSize), 1);
  if (pageIndex > pageCount) moduleState.pageByTab[key] = pageCount;
  const safePage = Math.min(pageIndex, pageCount);
  const pagedRecords = records.slice((safePage - 1) * moduleState.pageSize, safePage * moduleState.pageSize);
  return `
    <div class="module-record-shell" data-page="${escapeHtml(page)}" data-tab="${escapeHtml(tab.id)}" data-slug="${escapeHtml(tab.slug)}">
      <div class="module-actions">
        <button class="module-add-button" type="button">+ Add New</button>
        <button class="module-export-button" type="button">Export</button>
        <span class="module-inline-status">${escapeHtml(data.sheet)} | ${data.records.length} saved | ${data.sync?.pending || 0} Pending Sync</span>
      </div>
      ${renderModuleForm(page, tab, data)}
      <div class="module-table-tools">
        <input class="module-search" type="search" value="${escapeHtml(query)}" placeholder="Search records">
        ${renderModuleFilter(data, filter)}
      </div>
      ${renderModuleRecordsTable(page, tab, data, pagedRecords)}
      <div class="module-pagination">
        <button class="module-page-button" type="button" data-page-direction="-1"${safePage <= 1 ? " disabled" : ""}>Previous</button>
        <span>Page ${safePage} of ${pageCount}</span>
        <button class="module-page-button" type="button" data-page-direction="1"${safePage >= pageCount ? " disabled" : ""}>Next</button>
      </div>
    </div>
  `;
}

function filteredModuleRecords(page, tab, data) {
  const key = moduleTabKey(page, tab);
  const query = String(moduleState.searchByTab[key] || "").toLowerCase();
  const filter = String(moduleState.filterByTab[key] || "");
  const sort = moduleState.sortByTab[key] || {};
  const records = (data.records || []).filter((record) => {
    const text = Object.values(record).join(" ").toLowerCase();
    const matchesSearch = !query || text.includes(query);
    const matchesFilter = !filter || Object.values(record).some((value) => String(value) === filter);
    return matchesSearch && matchesFilter;
  });
  if (sort.key) {
    records.sort((left, right) => {
      const a = left[sort.key];
      const b = right[sort.key];
      const aNumber = Number(a);
      const bNumber = Number(b);
      const result = Number.isFinite(aNumber) && Number.isFinite(bNumber)
        ? aNumber - bNumber
        : String(a || "").localeCompare(String(b || ""));
      return sort.direction === "desc" ? -result : result;
    });
  }
  return records;
}

function renderModuleFilter(data, selected) {
  const values = new Set();
  (data.records || []).forEach((record) => {
    ["status", "paymentStatus", "goalCategory", "businessName", "priority", "category"].forEach((key) => {
      if (record[key]) values.add(record[key]);
    });
  });
  if (!values.size) return "";
  return `
    <select class="module-filter">
      <option value="">All filters</option>
      ${Array.from(values).sort().map((value) => `<option value="${escapeHtml(value)}"${String(value) === selected ? " selected" : ""}>${escapeHtml(value)}</option>`).join("")}
    </select>
  `;
}

function visibleModuleColumns(data) {
  const hidden = new Set(["createdAt", "lastUpdated", "syncStatus", "notes", "businessAddress", "website", "email"]);
  const columns = (data.columns || []).filter((column) => !hidden.has(column.key));
  return columns.slice(0, 8);
}

function renderModuleRecordsTable(page, tab, data, records) {
  const columns = visibleModuleColumns(data);
  if (!records.length) return `<div class="module-empty">No records yet. Use Add New and save your first ${escapeHtml(tab.title)} record.</div>`;
  if (tab.display === "goal-cards") return renderGoalCards(records);
  return `
    <div class="module-table-wrap">
      <table class="module-table">
        <thead>
          <tr>
            ${columns.map((column) => `<th><button class="module-sort" type="button" data-sort-key="${escapeHtml(column.key)}">${escapeHtml(column.header)}</button></th>`).join("")}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${records.map((record) => `
            <tr>
              ${columns.map((column) => `<td>${moduleCellHtml(record[column.key], column)}</td>`).join("")}
              <td class="actions">
                <button class="table-action module-view" type="button" data-id="${escapeHtml(record.id)}">View</button>
                <button class="table-action module-edit" type="button" data-id="${escapeHtml(record.id)}">Edit</button>
                <button class="table-action danger module-delete" type="button" data-id="${escapeHtml(record.id)}">Delete</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderGoalCards(records) {
  return `
    <div class="goal-card-grid">
      ${records.map((goal) => `
        <article class="goal-card">
          <div>
            <h3>${escapeHtml(goal.goalName)}</h3>
            <p>${escapeHtml(goal.goalCategory)} | ${escapeHtml(goal.familyMember)}</p>
          </div>
          ${statusPill(goal.status)}
          <div class="progress-track"><span style="width:${Math.min(Number(goal.progressPercentage || 0), 100)}%"></span></div>
          <div class="goal-card-values">
            <span>Target ${formatMoney.format(goal.targetAmount || 0)}</span>
            <span>Saved ${formatMoney.format(goal.amountSaved || 0)}</span>
            <span>Remaining ${formatMoney.format(goal.remainingAmount || 0)}</span>
          </div>
          <div class="actions">
            <button class="table-action module-view" type="button" data-id="${escapeHtml(goal.id)}">View</button>
            <button class="table-action module-edit" type="button" data-id="${escapeHtml(goal.id)}">Edit</button>
            <button class="table-action danger module-delete" type="button" data-id="${escapeHtml(goal.id)}">Delete</button>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function moduleCellHtml(value, column) {
  if (/(amount|price|value|salary|income|expense|tax|premium|coverage|balance|principal|paid|profit|loss|variance|gst)/i.test(column.header)) {
    return `<span class="amount">${formatMoney.format(Number(value || 0))}</span>`;
  }
  if (/status/i.test(column.header)) return statusPill(value);
  if (/progress|percent|%/i.test(column.header)) return `${formatPercentInput(value || 0) || "0.00"}%`;
  return escapeHtml(value);
}

function renderModuleForm(page, tab, data) {
  const editing = moduleState.editing?.slug === tab.slug ? moduleState.editing.record : null;
  const title = editing ? `Edit ${tab.title}` : `Add ${tab.title}`;
  return `
    <form class="module-record-form" data-slug="${escapeHtml(tab.slug)}">
      <div class="module-form-heading">
        <h3>${escapeHtml(title)}</h3>
        <span class="module-form-mode">${editing ? "Editing saved record" : "New record"}</span>
      </div>
      <div class="module-form-grid">
        ${(data.columns || []).map((column) => renderModuleField(page, tab, data, column, editing || {})).join("")}
      </div>
      <div class="module-form-actions">
        <button type="submit" name="moduleAction" value="save">Save</button>
        <button type="submit" name="moduleAction" value="save-add">Save & Add Another</button>
        <button class="secondary-button module-cancel" type="button">Cancel</button>
      </div>
      <p class="module-message message" role="status"></p>
    </form>
  `;
}

function renderModuleField(page, tab, data, column, record) {
  const value = record[column.key] ?? "";
  const readonly = isModuleFieldReadOnly(data.sheet, column);
  const required = isModuleFieldRequired(data.sheet, column) ? " required" : "";
  const disabled = readonly ? " readonly" : "";
  const base = `data-key="${escapeHtml(column.key)}" data-header="${escapeHtml(column.header)}"${required}${disabled}`;
  const labelClass = readonly ? "module-field module-field-readonly" : "module-field";
  const name = `name="${escapeHtml(column.key)}"`;
  if (column.key === "businessId" && data.sheet !== "Business Profile") {
    const profiles = moduleData("business-profiles")?.records || data.businessProfiles || [];
    return `
      <label class="${labelClass}">
        <span>${escapeHtml(column.header)}</span>
        <select ${base} ${name}>
          <option value="">Select business</option>
          ${profiles.map((profile) => `<option value="${escapeHtml(profile.businessId || profile.id)}" data-business-name="${escapeHtml(profile.businessName)}"${String(profile.businessId || profile.id) === String(value) ? " selected" : ""}>${escapeHtml(profile.businessName || profile.businessId || profile.id)}</option>`).join("")}
        </select>
      </label>
    `;
  }
  if (column.key === "businessName" && data.sheet !== "Business Profile") {
    return `<label class="module-field module-field-readonly"><span>${escapeHtml(column.header)}</span><input ${base} ${name} type="text" value="${escapeHtml(value)}" readonly></label>`;
  }
  if (column.key === "goalCategory") {
    const categories = activeGoalCategories();
    return `
      <label class="${labelClass}">
        <span>${escapeHtml(column.header)}</span>
        <select ${base} ${name}>
          <option value="">Select category</option>
          ${categories.map((category) => `<option value="${escapeHtml(category)}"${String(category) === String(value) ? " selected" : ""}>${escapeHtml(category)}</option>`).join("")}
        </select>
      </label>
    `;
  }
  if (column.key === "goalId" && data.sheet === "Goal Contributions") {
    const goals = moduleData("goals")?.records || data.goals || [];
    return `
      <label class="${labelClass}">
        <span>${escapeHtml(column.header)}</span>
        <select ${base} ${name}>
          <option value="">Select goal</option>
          ${goals.map((goal) => `<option value="${escapeHtml(goal.goalId || goal.id)}" data-goal-name="${escapeHtml(goal.goalName)}"${String(goal.goalId || goal.id) === String(value) ? " selected" : ""}>${escapeHtml(goal.goalName || goal.goalId || goal.id)}</option>`).join("")}
        </select>
      </label>
    `;
  }
  if (moduleSelectOptions(column, data.sheet).length) {
    const options = moduleSelectOptions(column, data.sheet);
    return `
      <label class="${labelClass}">
        <span>${escapeHtml(column.header)}</span>
        <select ${base} ${name}>
          <option value="">Select</option>
          ${options.map((option) => `<option value="${escapeHtml(option)}"${String(option) === String(value) ? " selected" : ""}>${escapeHtml(option)}</option>`).join("")}
        </select>
      </label>
    `;
  }
  if (/notes|address|description/i.test(column.header)) {
    return `<label class="${labelClass} wide"><span>${escapeHtml(column.header)}</span><textarea ${base} ${name} rows="3">${escapeHtml(value)}</textarea></label>`;
  }
  const type = moduleInputType(column);
  const step = type === "number" ? ` min="0" step="0.01"` : "";
  return `<label class="${labelClass}"><span>${escapeHtml(column.header)}</span><input ${base} ${name} type="${type}" value="${escapeHtml(value)}"${step}></label>`;
}

function moduleInputType(column) {
  if (/email/i.test(column.header)) return "email";
  if (/website|url/i.test(column.header)) return "url";
  if (/month/i.test(column.header) && !/amount|monthly contribution/i.test(column.header)) return "month";
  if (/date/i.test(column.header)) return "date";
  if (/(amount|price|value|salary|income|expense|tax|premium|coverage|balance|principal|paid|profit|loss|variance|quantity|unit price|gst|percent|%|months|level|area|emi|discount)/i.test(column.header)) return "number";
  return "text";
}

function moduleSelectOptions(column, sheetName) {
  const header = column.header.toLowerCase();
  if (column.key === "familyMember") return ["Family", "Father", "Mother", "Child 1", "Child 2", "Other"];
  if (column.key === "priority") return ["Low", "Medium", "High", "Critical"];
  if (sheetName === "Goals" && column.key === "status") return ["Not Started", "In Progress", "On Track", "At Risk", "Completed", "Paused", "Cancelled"];
  if (sheetName === "Goal Categories" && column.key === "status") return ["Active", "Inactive"];
  if (sheetName === "Goal Categories" && column.key === "defaultCategory") return ["No", "Yes"];
  if (header.includes("status")) return ["Pending", "Partial", "Received", "Paid", "On Track", "Completed", "Active", "Inactive", "Cleared", "Cancelled"];
  if (header.includes("payment mode")) return ["Cash", "UPI", "Bank Transfer", "Cheque", "Card", "Other"];
  if (header.includes("business type")) return ["Sole Proprietorship", "Partnership", "Private Limited", "LLP", "Family Business", "Other"];
  if (header.includes("business category")) return ["Retail", "Services", "Trading", "Manufacturing", "Agriculture", "Real Estate", "Other"];
  if (header.includes("investment type")) return ["Owner Capital", "Partner Capital", "Loan", "Additional Investment", "Other"];
  if (header.includes("income category")) return ["Sales", "Service Income", "Commission", "Rental", "Other"];
  if (header.includes("expense category")) return ["Purchase", "Salary", "Rent", "Transport", "Utilities", "Maintenance", "Tax", "Other"];
  if (header.includes("asset category")) return ["Cash", "Equipment", "Vehicle", "Furniture", "Stock", "Property", "Other"];
  if (header.includes("liability category")) return ["Supplier Credit", "Loan", "Tax Payable", "Salary Payable", "Other"];
  if (header.includes("policy type")) return ["Life", "Health", "Vehicle", "Property", "Crop", "Business", "Other"];
  if (header.includes("tax regime")) return ["Old Regime", "New Regime"];
  if (header.includes("record type")) return ["Farm Details", "Crop Details", "Farm Expense", "Farm Income", "Inventory"];
  if (header.includes("recurring")) return ["No", "Yes"];
  if (header.includes("bill type")) return ["Electricity", "Water", "Internet", "Mobile", "Gas", "Rent", "Other"];
  if (header.includes("format")) return ["Excel", "PDF", "CSV", "ZIP"];
  return [];
}

function isModuleFieldRequired(sheetName, column) {
  if (sheetName === "Business Profile") return ["businessName"].includes(column.key);
  if (sheetName === "Goals") return ["goalName", "goalCategory", "targetAmount", "targetDate"].includes(column.key);
  if (sheetName === "Goal Contributions") return ["goalId", "amount", "contributionDate"].includes(column.key);
  if (column.key === "id" || column.key === "businessId" || column.key === "goalId") return false;
  return false;
}

function isModuleFieldReadOnly(sheetName, column) {
  if (["createdAt", "lastUpdated", "syncStatus"].includes(column.key)) return true;
  if (sheetName !== "Business Profile" && column.key === "businessName") return true;
  const computed = new Set([
    "grossAmount", "netAmount", "pendingAmount", "paymentStatus", "totalAmount",
    "outstandingAmount", "balanceAmount", "stockValue", "remainingAmount",
    "remainingMonths", "requiredMonthlyContribution", "progressPercentage",
    "netSalary", "totalMonthlyIncome", "taxableIncome", "remainingTaxPayable",
    "variance", "profitLoss", "linkedBankCashId"
  ]);
  return computed.has(column.key);
}

function activeGoalCategories() {
  return (moduleData("goal-categories")?.records || [])
    .filter((category) => String(category.status || "Active").toLowerCase() === "active")
    .map((category) => category.categoryName)
    .filter(Boolean);
}

function moduleFormNumber(form, key) {
  return Number(form?.elements[key]?.value || 0);
}

function setModuleFormValue(form, key, value) {
  const field = form?.elements[key];
  if (field) field.value = value === undefined || value === null ? "" : value;
}

function recalculateModuleForm(form) {
  if (!form) return;
  const slug = form.dataset.slug;
  const businessSelect = form.elements.businessId;
  if (businessSelect && form.elements.businessName) {
    form.elements.businessName.value = businessSelect.selectedOptions?.[0]?.dataset.businessName || form.elements.businessName.value || "";
  }
  const goalSelect = form.elements.goalId;
  if (goalSelect && form.elements.goalName) {
    form.elements.goalName.value = goalSelect.selectedOptions?.[0]?.dataset.goalName || form.elements.goalName.value || "";
  }

  if (slug === "business-income") {
    const gross = moduleFormNumber(form, "quantity") * moduleFormNumber(form, "unitPrice");
    const net = Math.max(gross - moduleFormNumber(form, "discount") + moduleFormNumber(form, "gst"), 0);
    const pending = Math.max(net - moduleFormNumber(form, "paymentReceived"), 0);
    setModuleFormValue(form, "grossAmount", gross.toFixed(2));
    setModuleFormValue(form, "netAmount", net.toFixed(2));
    setModuleFormValue(form, "pendingAmount", pending.toFixed(2));
    setModuleFormValue(form, "paymentStatus", moduleFormNumber(form, "paymentReceived") <= 0 ? "Pending" : moduleFormNumber(form, "paymentReceived") < net ? "Partial" : "Received");
  }
  if (slug === "business-expenses") {
    const amount = moduleFormNumber(form, "amount") || moduleFormNumber(form, "quantity") * moduleFormNumber(form, "unitPrice");
    setModuleFormValue(form, "amount", amount ? amount.toFixed(2) : "");
    setModuleFormValue(form, "totalAmount", (amount + moduleFormNumber(form, "gst")).toFixed(2));
  }
  if (slug === "business-assets") {
    if (!form.elements.currentValue?.value) setModuleFormValue(form, "currentValue", moduleFormNumber(form, "purchaseValue").toFixed(2));
  }
  if (slug === "business-liabilities") {
    const outstanding = Math.max(moduleFormNumber(form, "principal") - moduleFormNumber(form, "amountPaid"), 0);
    setModuleFormValue(form, "outstandingAmount", outstanding.toFixed(2));
  }
  if (slug === "business-receivables" || slug === "business-payables" || slug === "bill-utilities") {
    const balance = Math.max(moduleFormNumber(form, "amount") - moduleFormNumber(form, "amountPaid") - moduleFormNumber(form, "paidAmount"), 0);
    setModuleFormValue(form, "balanceAmount", balance.toFixed(2));
  }
  if (slug === "business-inventory" || slug === "farm-inventory") {
    const stockValue = moduleFormNumber(form, "quantityInStock") * moduleFormNumber(form, "purchasePrice");
    setModuleFormValue(form, "stockValue", stockValue.toFixed(2));
  }
  if (slug === "goals") {
    const target = moduleFormNumber(form, "targetAmount");
    const saved = moduleFormNumber(form, "amountSaved");
    const remaining = Math.max(target - saved, 0);
    const progress = target ? Math.min((saved / target) * 100, 100) : 0;
    const remainingMonths = remainingMonthsUntil(form.elements.targetDate?.value);
    setModuleFormValue(form, "remainingAmount", remaining.toFixed(2));
    setModuleFormValue(form, "progressPercentage", progress.toFixed(2));
    setModuleFormValue(form, "remainingMonths", remainingMonths);
    setModuleFormValue(form, "requiredMonthlyContribution", (remainingMonths ? remaining / remainingMonths : remaining).toFixed(2));
  }
  if (slug === "salary-income") {
    const deductions = moduleFormNumber(form, "pfDeduction") + moduleFormNumber(form, "taxDeduction") + moduleFormNumber(form, "otherDeductions");
    const netSalary = Math.max(moduleFormNumber(form, "grossSalary") - deductions, 0);
    setModuleFormValue(form, "netSalary", netSalary.toFixed(2));
    setModuleFormValue(form, "totalMonthlyIncome", (netSalary + moduleFormNumber(form, "rentalIncome") + moduleFormNumber(form, "agriculturalIncome") + moduleFormNumber(form, "otherIncome")).toFixed(2));
  }
  if (slug === "budget-planner") {
    setModuleFormValue(form, "variance", (moduleFormNumber(form, "plannedAmount") - moduleFormNumber(form, "actualAmount")).toFixed(2));
  }
  if (slug === "farm-manager") {
    setModuleFormValue(form, "profitLoss", (moduleFormNumber(form, "netSaleAmount") - moduleFormNumber(form, "farmExpense")).toFixed(2));
  }
}

function remainingMonthsUntil(dateValue) {
  const target = new Date(dateValue || "");
  if (Number.isNaN(target.getTime())) return 0;
  const now = new Date();
  const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(months + (target.getDate() >= now.getDate() ? 1 : 0), 0);
}

function collectModulePayload(form) {
  recalculateModuleForm(form);
  return Object.fromEntries(new FormData(form).entries());
}

function activeModuleContext() {
  const blueprint = masterModuleBlueprints[currentPage];
  if (!blueprint) return {};
  const tab = activeModuleTab(currentPage);
  return { page: currentPage, blueprint, tab, data: tab.slug ? moduleData(tab.slug) : null };
}

function setModuleMessage(form, text, isError = false) {
  const messageElement = form?.querySelector(".module-message");
  if (!messageElement) return;
  messageElement.textContent = text;
  messageElement.style.color = isError ? "#b42318" : "#146c43";
}

async function saveModuleRecord(form, action = "save") {
  const { tab } = activeModuleContext();
  if (!tab?.slug) return;
  const payload = collectModulePayload(form);
  const editing = moduleState.editing?.slug === tab.slug ? moduleState.editing.record : null;
  const endpoint = editing
    ? `/api/modules/${encodeURIComponent(tab.slug)}/${encodeURIComponent(editing.id)}`
    : `/api/modules/${encodeURIComponent(tab.slug)}`;
  const response = await apiFetch(endpoint, {
    method: editing ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to save this record.");
  if (data.module) moduleState.dataBySlug[tab.slug] = data.module;
  if (action === "save-add") {
    moduleState.editing = null;
    form.reset();
    recalculateModuleForm(form);
    setModuleMessage(form, data.driveSynced ? "Saved and uploaded to Google Drive." : "Saved to Excel.");
  } else {
    moduleState.editing = null;
    await loadModulePage(currentPage);
  }
  await loadDriveStatus().catch(() => {});
}

function findCurrentModuleRecord(id) {
  const { tab, data } = activeModuleContext();
  if (!tab?.slug || !data) return null;
  return (data.records || []).find((record) => String(record.id) === String(id));
}

function viewModuleRecord(record) {
  const lines = Object.entries(record)
    .filter(([, value]) => value !== "" && value !== undefined && value !== null)
    .map(([key, value]) => `${key}: ${value}`);
  window.alert(lines.join("\n") || "No details available.");
}

async function deleteModuleRecord(id, button) {
  const { tab } = activeModuleContext();
  const record = findCurrentModuleRecord(id);
  if (!tab?.slug || !record) return;
  const label = record.goalName || record.businessName || record.itemName || record.title || record.id;
  if (!window.confirm(`Delete ${label}?`)) return;
  button.disabled = true;
  try {
    const response = await apiFetch(`/api/modules/${encodeURIComponent(tab.slug)}/${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to delete this record.");
    if (data.module) moduleState.dataBySlug[tab.slug] = data.module;
    if (moduleState.editing?.record?.id === id) moduleState.editing = null;
    await loadModulePage(currentPage);
    await loadDriveStatus().catch(() => {});
  } catch (error) {
    const form = modulePanel.querySelector(".module-record-form");
    setModuleMessage(form, error.message, true);
  } finally {
    button.disabled = false;
  }
}

function exportModuleRecords(data) {
  const rows = data.records || [];
  const headers = (data.columns || []).map((column) => column.header);
  const keys = (data.columns || []).map((column) => column.key);
  const csv = [
    headers.join(","),
    ...rows.map((record) => keys.map((key) => `"${String(record[key] ?? "").replaceAll('"', '""')}"`).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${data.sheet.replaceAll(" ", "_")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function setEntryTypeOptions(page) {
  const allowed = entryTypeOptionsByPage[page] || Object.keys(entryTypeOptionLabels);
  const previousValue = typeInput.value;
  typeInput.innerHTML = allowed
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(entryTypeOptionLabels[value])}</option>`)
    .join("");
  if (allowed.includes(previousValue)) {
    typeInput.value = previousValue;
  } else {
    typeInput.value = allowed[0];
  }
  if (page === "loan" && typeInput.value === "month_entry") {
    monthEntryTargetInput.value = "loan";
  }
  if (page === "chitty" && typeInput.value === "month_entry") {
    monthEntryTargetInput.value = "chitty";
  }
  setMonthEntryTargetOptions(page);
}

function setMonthEntryTargetOptions(page) {
  const allowed = page === "loan" ? ["loan"] : page === "chitty" ? ["chitty"] : Object.keys(monthEntryTargetOptions);
  const previousValue = monthEntryTargetInput.value;
  monthEntryTargetInput.innerHTML = allowed
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(monthEntryTargetOptions[value])}</option>`)
    .join("");
  if (page === "loan") monthEntryTargetInput.value = "loan";
  if (page === "chitty") monthEntryTargetInput.value = "chitty";
  if (page !== "loan" && page !== "chitty") {
    monthEntryTargetInput.value = allowed.includes(previousValue) ? previousValue : allowed[0];
  }
}

function setTypeFilterOptions(page) {
  const options = typeFilterOptions[page] || typeFilterOptions.entries;
  const previousValue = typeFilter.value;
  typeFilter.innerHTML = options
    .map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`)
    .join("");
  const allowedValues = new Set(options.map(([value]) => value));
  typeFilter.value = allowedValues.has(previousValue) ? previousValue : "";
}

function pageEntryMatches(entry) {
  if (currentPage === "debt") return entry.type === "debt_given" || entry.type === "debt_cleared";
  if (currentPage === "chitty") return String(entry.type || "").startsWith("chitty");
  if (currentPage === "loan") return entry.type === "loan";
  return true;
}

function routeForEntry(entry) {
  if (entry.type === "loan") return "loan";
  if (entry.type === "property") return "property";
  if (entry.type === "trading") return "trading";
  if (String(entry.type || "").startsWith("chitty")) return "chitty";
  return "debt";
}

function routeTo(page, { replace = false } = {}) {
  const nextPage = normalizePage(page);
  if (replace) {
    history.replaceState(null, "", `#${nextPage}`);
  } else if (normalizePage(window.location.hash) !== nextPage) {
    history.pushState(null, "", `#${nextPage}`);
  }
  applyRoute(nextPage);
}

const languageOptions = [
  ["en", "English"],
  ["te", "Telugu"],
  ["hi", "Hindi"],
  ["ta", "Tamil"],
  ["kn", "Kannada"],
  ["ml", "Malayalam"],
  ["mr", "Marathi"],
  ["gu", "Gujarati"],
  ["pa", "Punjabi"],
  ["bn", "Bengali"],
  ["ur", "Urdu"]
];

const websitePages = {
  features: {
    eyebrow: "Platform",
    title: "Features",
    copy: "Smart Fin 365 combines family finance records, Google Sheets sync, analytics, reminders, exports, mobile readiness and secure login in one responsive application.",
    items: ["Family Dashboard", "Lent, Chitty, Loan, Property and Trading modules", "Net Worth and Reports", "Google Sheets synchronization", "Export Center", "PWA and mobile app readiness"]
  },
  pricing: {
    eyebrow: "Subscription",
    title: "Pricing",
    copy: "Choose the plan that matches the finance tools you need.",
    items: ["Free Plan: basic modules", "Premium Monthly: Rs. 100/month", "Premium Yearly: Rs. 1000/year", "Premium unlocks Advanced Reports, Reports & Analytics, AI, Backup & Restore, Net Worth, Export Centre and Family Dashboard"]
  },
  about: {
    eyebrow: "Smart Fin 365",
    title: "About",
    copy: "Smart Fin 365 is built for personal and family finance tracking with careful sync between the web app, workbook records and cloud storage.",
    items: ["Designed for family finance visibility", "Built around existing historical records", "Prepared for multi-user Supabase architecture"]
  },
  contact: {
    eyebrow: "Contact",
    title: "Contact",
    copy: "For help, account questions, deployment support or data synchronization issues, contact Smart Fin 365 support.",
    items: ["Support email: support@smartfin365.com", "Use Help & Support to create a ticket", "Production domain: smartfin365.com"]
  },
  "privacy-policy": {
    eyebrow: "Legal",
    title: "Privacy Policy",
    copy: "Smart Fin 365 protects financial records behind authentication and stores provider credentials only on the server through environment variables.",
    items: ["Financial data is hidden until login succeeds", "Passwords are hashed", "Provider secrets are never stored in frontend code", "Each registered user is designed to own isolated records"]
  },
  terms: {
    eyebrow: "Legal",
    title: "Terms",
    copy: "Use Smart Fin 365 for personal and family finance tracking. Calculations and tax guidance are estimates and should be verified before financial decisions.",
    items: ["Keep credentials private", "Review synced data regularly", "Tax and investment values require professional verification where applicable"]
  },
  "refund-policy": {
    eyebrow: "Legal",
    title: "Refund Policy",
    copy: "Smart Fin 365 subscription fees are non-refundable once the subscription period starts.",
    items: ["Monthly plan: non-refundable", "Yearly plan: non-refundable", "Billing or access issues can be raised through Help & Support"]
  },
  faq: {
    eyebrow: "Help",
    title: "FAQ",
    copy: "Common answers for Smart Fin 365 setup and usage.",
    items: ["Forgot Password uses Supabase email recovery when configured", "Google Sheets sync requires OAuth credentials", "Trading tokens are saved privately on the server", "For always-on access, deploy the Node.js app to smartfin365.com"]
  }
};

function renderWebsitePage(page) {
  const content = websitePages[page];
  if (!content) return "";
  return `
    <section class="module-card website-page-card">
      <p class="eyebrow">${escapeHtml(content.eyebrow)}</p>
      <h2>${escapeHtml(content.title)}</h2>
      <p>${escapeHtml(content.copy)}</p>
      <div class="module-dashboard-grid">
        ${content.items.map((item) => summaryCard(item, "", "neutral")).join("")}
      </div>
    </section>
  `;
}

function renderUtilityPage(page) {
  if (!moduleIntro || !moduleSections) return;
  const isLanguage = page === "language";
  const isSupport = page === "help-support";
  const websiteHtml = renderWebsitePage(page);
  if (websiteHtml) {
    const content = websitePages[page];
    moduleIntro.innerHTML = `
      <p class="eyebrow">${escapeHtml(content.eyebrow)}</p>
      <h1>${escapeHtml(content.title)}</h1>
      <p>${escapeHtml(content.copy)}</p>
    `;
    moduleSections.innerHTML = websiteHtml;
    return;
  }
  moduleIntro.innerHTML = `
    <p class="eyebrow">${isLanguage ? "Preferences" : "Support"}</p>
    <h1>${escapeHtml(pageTitles[page] || "Smart Fin 365")}</h1>
    <p>${isLanguage
      ? "Choose display language preferences for the Smart Fin 365 web and mobile experience."
      : "Get help with login, synchronization, Google Drive, trading updates and deployment."}</p>
  `;
  moduleSections.innerHTML = isLanguage
    ? `
      <section class="module-card">
        <h2>Language Preferences</h2>
        <div class="module-form-grid">
          <label class="module-field"><span>Application Language</span><select id="languageSelect">
            ${languageOptions.map(([code, label]) => `<option value="${code}"${(localStorage.getItem("smartFin365Language") || "en") === code ? " selected" : ""}>${escapeHtml(label)}</option>`).join("")}
          </select></label>
          <label class="module-field"><span>Number Format</span><select disabled><option>Indian numbering format</option></select></label>
        </div>
        <p id="languageStatus" class="module-sync-line">Language preference is saved locally and prepared for full translation packs without changing workbook data or financial calculations.</p>
      </section>
    `
    : `
      <section class="module-card">
        <h2>Help & Support</h2>
        <form id="supportTicketForm" class="module-record-form">
          <div class="module-form-grid">
            <label class="module-field"><span>Name</span><input name="name" type="text" required></label>
            <label class="module-field"><span>Email</span><input name="email" type="email" required></label>
            <label class="module-field"><span>Mobile</span><input name="mobile" type="tel" required></label>
            <label class="module-field"><span>Issue Type</span><select name="issueType" required><option value="">Select</option><option>Login</option><option>Synchronization</option><option>Trading</option><option>Billing</option><option>Bug</option><option>Deployment</option><option>Other</option></select></label>
            <label class="module-field"><span>Priority</span><select name="priority" required><option>Normal</option><option>High</option><option>Urgent</option></select></label>
            <label class="module-field"><span>Attachment</span><input name="attachment" type="file"></label>
            <label class="module-field module-field-wide"><span>Description</span><textarea name="description" rows="5" required></textarea></label>
          </div>
          <button type="submit">Create Support Ticket</button>
          <p id="supportTicketStatus" class="module-sync-line">Support email: support@smartfin365.com</p>
        </form>
      </section>
    `;
}

function applyRoute(page = normalizePage(window.location.hash)) {
  currentPage = normalizePage(page);
  document.body.dataset.page = currentPage;
  const isHome = currentPage === "home";

  setHidden(homeScreen, !isHome);
  setHidden(appShell, false);
  setHidden(entryPanel, true);
  setHidden(overviewPanel, true);
  setHidden(entriesPanel, true);
  setHidden(modulePanel, true);
  setHidden(form, true);
  setHidden(propertyForm, true);
  setHidden(summaryGrid, true);
  setHidden(chartPanel, true);
  setHidden(propertyTablePanel, true);
  setHidden(tradingPanel, true);
  setHidden(tradingSheetFields, true);
  setHidden(upstoxForm, true);
  setHidden(tradingActions, true);
  syncPanels.forEach((panel) => setHidden(panel, true));

  if (isHome) {
    setHidden(appShell, true);
    return;
  }

  if (currentPage === "settings-sync") {
    setHidden(overviewPanel, false);
    setPanelTitle(overviewPanel, pageTitles["settings-sync"]);
    syncPanels.forEach((panel) => setHidden(panel, false));
    loadSyncMonitoring().catch(() => {});
    loadSecuritySettings().catch(() => {});
    return;
  }

  if (["language", "help-support", "features", "pricing", "about", "contact", "privacy-policy", "terms", "refund-policy", "faq"].includes(currentPage)) {
    setHidden(modulePanel, false);
    setPanelTitle(modulePanel, pageTitles[currentPage]);
    renderUtilityPage(currentPage);
    return;
  }

  if (["debt", "chitty", "loan"].includes(currentPage)) {
    setHidden(entryPanel, false);
    setHidden(entriesPanel, false);
    setHidden(form, false);
    setPanelTitle(entryPanel, pageTitles[currentPage]);
    setPanelTitle(entriesPanel, `${pageTitles[currentPage]} Records`);
    setEntryTypeOptions(currentPage);
    setTypeFilterOptions(currentPage);
    updatePartySuggestions();
    updateChittyFields();
    renderTable();
    return;
  }

  if (currentPage === "property") {
    setHidden(entryPanel, false);
    setHidden(overviewPanel, false);
    setHidden(propertyForm, false);
    setHidden(propertyTablePanel, false);
    setPanelTitle(entryPanel, pageTitles.property);
    setPanelTitle(overviewPanel, "Property Records");
    return;
  }

  if (currentPage === "entries") {
    setHidden(entriesPanel, false);
    setHidden(overviewPanel, false);
    setHidden(propertyTablePanel, false);
    setHidden(tradingPanel, false);
    setPanelTitle(entriesPanel, pageTitles.entries);
    setPanelTitle(overviewPanel, "Property and Trading Entries");
    setTypeFilterOptions(currentPage);
    renderTable();
    return;
  }

  if (currentPage === "summary") {
    setHidden(overviewPanel, false);
    setHidden(summaryGrid, false);
    setPanelTitle(overviewPanel, pageTitles.summary);
    return;
  }

  if (currentPage === "net-worth") {
    setHidden(overviewPanel, false);
    setHidden(summaryGrid, false);
    setPanelTitle(overviewPanel, pageTitles["net-worth"]);
    loadNetWorth().catch(() => {
      summaryGrid.innerHTML = '<div class="module-empty">Could not load Net Worth.</div>';
    });
    return;
  }

  if (currentPage === "trading") {
    setHidden(overviewPanel, false);
    setHidden(tradingPanel, false);
    setHidden(tradingSheetFields, false);
    setHidden(upstoxForm, false);
    setHidden(tradingActions, false);
    setPanelTitle(overviewPanel, pageTitles.trading);
    renderTradingSheetFields();
    return;
  }

  if (currentPage === "growth") {
    setHidden(overviewPanel, false);
    setHidden(chartPanel, false);
    setPanelTitle(overviewPanel, pageTitles.growth);
    loadGrowth().catch(() => {
      chartSummary.textContent = "Could not load yearly growth.";
    });
    return;
  }

  if (masterModuleBlueprints[currentPage]) {
    setHidden(modulePanel, false);
    setPanelTitle(modulePanel, pageTitles[currentPage]);
    renderMasterModule(currentPage);
  }
}

const formatMoney = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const formatCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const labels = {
  debt_given: "Amount Lent",
  debt_cleared: "Amount Recovered",
  chitty_summary: "Chitty / Group",
  chitty_paid: "Chitty Paid",
  chitty_received: "Chitty Received",
  loan: "Loan",
  loan_pending: "Loan Pending",
  loan_cleared: "Loan Cleared",
  month_entry: "Month Entry"
};

document.querySelector("#date").valueAsDate = new Date();

function total(entries, type) {
  return entries
    .filter((entry) => entry.type === type)
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
}

function setMetric(id, value) {
  document.querySelector(id).textContent = formatMoney.format(value);
}

function toneForNumber(value, neutralTone = "on-track") {
  const numeric = Number(value || 0);
  if (numeric < 0) return "negative";
  if (numeric > 0) return "positive";
  return neutralTone;
}

function signedMoneyHtml(value, { neutralTone = "on-track" } = {}) {
  const numeric = Number(value || 0);
  return `<span class="value-tone value-${toneForNumber(numeric, neutralTone)}">${formatMoney.format(numeric)}</span>`;
}

function signedPercentHtml(value, { neutralTone = "on-track" } = {}) {
  const numeric = Number(value || 0);
  const display = formatPercentInput(numeric);
  return `<span class="value-tone value-${toneForNumber(numeric, neutralTone)}">${display ? `${display}%` : "0.00%"}</span>`;
}

function setSignedMetric(id, value) {
  const element = document.querySelector(id);
  if (element) element.innerHTML = signedMoneyHtml(value);
}

function setSignedPercent(id, value) {
  const element = document.querySelector(id);
  if (element) element.innerHTML = signedPercentHtml(value);
}

function statusTone(value) {
  const status = String(value || "").toLowerCase();
  if (!status) return "neutral";
  if (status.includes("loss") || status.includes("negative") || status.includes("overdue")) return "negative";
  if (status.includes("profit") || status.includes("cleared") || status.includes("completed") || status.includes("received") || status.includes("paid")) return "positive";
  if (status.includes("on-going") || status.includes("ongoing") || status.includes("on track") || status.includes("running") || status.includes("pending") || status.includes("partial")) return "on-track";
  return "neutral";
}

function statusPill(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return `<span class="status-pill status-${statusTone(text)}">${escapeHtml(text)}</span>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatInterestDetail(rate, interest) {
  if (!rate && !interest) return "";
  return `${formatMoney.format(interest || 0)} interest @ ${rate || 0}%`;
}

function amountWithDetail(amount, detail) {
  return `${formatMoney.format(amount || 0)}${detail ? `<br><small>${escapeHtml(detail)}</small>` : ""}`;
}

function coreField(name) {
  return form.elements[name] || null;
}

function coreValue(name) {
  const field = coreField(name);
  return field ? field.value : "";
}

function setCoreValue(name, value) {
  const field = coreField(name);
  if (field) field.value = value ?? "";
}

function selectedSheetRecord() {
  if (editingLoanId) return allLoans.find((loan) => String(loan.id) === String(editingLoanId)) || {};
  if (editingEntryId) return combinedEntries().find((record) => String(record.id) === String(editingEntryId)) || {};
  return {};
}

function monthNumber(header) {
  const match = String(header || "").match(/^Month\s+(\d+)$/i);
  return match ? Number(match[1]) : 0;
}

function optionPairs(values) {
  return values.map((value) => Array.isArray(value) ? value : [value, value || "Select"]);
}

function statusValueForPage(page, value, fallbackType = "") {
  const status = String(value || "").trim().toLowerCase();
  if (page === "debt") {
    if (status.includes("clear") || status.includes("complete") || status.includes("received")) return "Cleared";
    if (status.includes("partial")) return "Partial";
    if (status.includes("running") || status.includes("pending") || status.includes("ongoing") || status.includes("on-going")) return "Pending";
    return fallbackType === "debt_cleared" ? "Cleared" : "Pending";
  }
  if (page === "chitty") {
    if (status.includes("complete") || status.includes("received") || status.includes("clear")) return "Completed";
    if (status.includes("partial")) return "Partial";
    return fallbackType === "chitty_received" ? "Completed" : "Running";
  }
  if (page === "loan") {
    if (status.includes("complete") || status.includes("clear")) return "Cleared";
    if (status.includes("partial")) return "Partial";
    return "On-Going";
  }
  return value || "";
}

function fieldKindForHeader(header, meta = {}) {
  if (meta.kind) return meta.kind;
  if (meta.readOnly) return "computed";
  if (/date|month|emi/i.test(header) && !/amount/i.test(header)) return "date";
  if (/percentage|profit %/i.test(header)) return "percent";
  if (/status/i.test(header)) return "status";
  if (/mode|type|fund/i.test(header)) return "option";
  if (/notes/i.test(header)) return "notes";
  if (/amount|debt|principal|interest|balance|price|value|emi|paid|loss/i.test(header)) return "amount";
  if (/quantity|tenure|size|entry/i.test(header)) return "number";
  return "identity";
}

function formatPercentInput(value) {
  const numeric = Number(value || 0);
  if (!numeric) return "";
  return Math.abs(numeric) <= 1 ? (numeric * 100).toFixed(2) : String(numeric);
}

function sheetFieldValue(page, header, record = selectedSheetRecord()) {
  const chitty = record.chitty || {};
  const loan = record.loan || record || {};
  if (page === "debt") {
    if (header === "Date") return coreValue("date") || record.date || "";
    if (header === "Loan Type") return coreValue("type");
    if (header === "Person") return coreValue("party") || record.party || "";
    if (header === "Amount Lent") return coreValue("amount") || record.amount || "";
    if (header === "Date Given") return record.date || coreValue("date") || "";
    if (header === "Date Cleared") return record.dateCleared || (coreValue("type") === "debt_cleared" ? coreValue("date") : "") || "";
    if (header === "Mode") return coreValue("mode") || record.mode || "";
    if (header === "Status") return statusValueForPage("debt", coreValue("status") || record.status, coreValue("type"));
    if (header === "Principal Received") return coreValue("amountReceived") || record.amountReceived || "";
    if (header === "Interest Received") return coreValue("interestReceived") || record.interestReceived || "";
    if (header === "Outstanding Principal") return record.outstandingPrincipal || "";
    if (header === "Outstanding Interest") return record.outstandingInterest || "";
    if (header === "Notes") return coreValue("notes") || record.notes || "";
  }

  if (page === "chitty") {
    if (header === "Chitty / Group") return coreValue("party") || record.party || "";
    if (header === "Total Chitty Value") return record.amount || chitty.totalValue || "";
    if (header === "Balance Amount") return chitty.balanceAmount || "";
    if (header === "Notes") return coreValue("notes") || record.notes || "";
    if (header === "Quantity") return chitty.quantity || "";
    if (header === "Tenure (Months)") return coreValue("tenureMonths") || chitty.tenureMonths || "";
    if (header === "Starting Month") return coreValue("startingMonth") || chitty.startingMonth || "";
    if (header === "Status") return statusValueForPage("chitty", coreValue("status") || record.status, coreValue("type"));
    if (header === "Month Entry") return coreValue("amount") || chitty.currentMonthPaid || "";
  }

  if (page === "loan") {
    if (header === "Notes") return coreValue("notes") || loan.notes || "";
    if (header === "Borrowed From") return coreValue("party") || loan.borrowedFrom || "";
    if (header === "Type of Fund") return coreValue("typeOfFund") || loan.typeOfFund || "Hand Loan";
    if (header === "Borrowed Date") return coreValue("date") || loan.borrowedDate || "";
    if (header === "Cleared Date") return loan.clearedDate || "";
    if (header === "Principal") return coreValue("amount") || loan.principal || "";
    if (header === "Interest Percentage") return coreValue("interestPercentage") || loan.interestPercentage || "";
    if (header === "EMI") return coreValue("emi") || loan.emi || "";
    if (header === "Tenure (Months)") return coreValue("tenureMonths") || loan.tenureMonths || "";
    if (header === "Loan Amount") return loan.loanAmount || "";
    if (header === "Status") return statusValueForPage("loan", loan.status || coreValue("status"));
    if (header === "First EMI") return loan.firstEmi || "";
  }

  if (page === "trading") {
    const row = allTrading[0] || {};
    if (header === "ID") return row.id || "";
    if (header === "Asset Type") return row.assetType || "";
    if (header === "Symbol / Name") return row.name || "";
    if (header === "Invested Date") return row.investedDate || "";
    if (header === "Average Buy Price") return row.averageBuyPrice || "";
    if (header === "Current Market Price") return row.currentMarketPrice || "";
    if (header === "Quantity") return row.quantity || "";
    if (header === "Invested Value") return row.investedValue || "";
    if (header === "Current Value") return row.currentValue || "";
    if (header === "Realised Profit/Loss") return row.realisedProfitLoss || "";
    if (header === "Unrealised Profit/Loss") return row.unrealisedProfitLoss || "";
    if (header === "Profit/Loss") return row.profitLoss || "";
    if (header === "Profit %") return formatPercentInput(row.profitPercent);
    if (header === "Last Updated Timestamp") return row.lastUpdated || "";
  }
  return "";
}

function sheetFieldMeta(page, header) {
  const readonly = { type: "text", readOnly: true };
  if (page === "debt") {
    if (header === "Date") return { type: "date", core: "date", required: true, kind: "date" };
    if (header === "Loan Type") return { type: "select", core: "type", options: [["debt_given", "Amount Lent"], ["debt_cleared", "Amount Recovered"]] };
    if (header === "Person") return { type: "text", core: "party", required: true };
    if (header === "Amount Lent") return { type: "number", core: "amount", required: true };
    if (header === "Date Given") return { type: "date", extraName: "dateGiven", kind: "date" };
    if (header === "Date Cleared") return { type: "date", extraName: "dateCleared", kind: "date" };
    if (header === "Mode") return { type: "select", core: "mode", options: optionPairs(modeOptions) };
    if (header === "Status") return { type: "select", core: "status", options: debtStatusOptions };
    if (header === "Principal Received") return { type: "number", core: "amountReceived" };
    if (header === "Interest Received") return { type: "number", core: "interestReceived" };
    if (header === "Outstanding Principal") return { type: "number", readOnly: true };
    if (header === "Outstanding Interest") return { type: "number", extraName: "outstandingInterest" };
    if (header === "Notes") return { type: "textarea", core: "notes" };
  }
  if (page === "chitty") {
    if (header === "Chitty / Group") return { type: "text", core: "party", required: true };
    if (header === "Balance Amount") return { type: "number", readOnly: true };
    if (header === "Total Chitty Value") return { type: "number", extraName: "totalChittyValue" };
    if (header === "Notes") return { type: "textarea", core: "notes" };
    if (header === "Quantity") return { type: "number", extraName: "quantity", step: "1" };
    if (header === "Tenure (Months)") return { type: "number", core: "tenureMonths", step: "1" };
    if (header === "Starting Month") return { type: "month", core: "startingMonth" };
    if (header === "Status") return { type: "select", core: "status", options: chittyStatusOptions };
    if (header === "Month Entry") return { type: "number", core: "amount", required: true };
  }
  if (page === "loan") {
    if (header === "Notes") return { type: "textarea", core: "notes" };
    if (header === "Borrowed From") return { type: "text", core: "party", required: true };
    if (header === "Type of Fund") return { type: "select", core: "typeOfFund", options: optionPairs(typeOfFundOptions) };
    if (header === "Borrowed Date") return { type: "date", core: "date" };
    if (header === "Cleared Date") return { type: "date", extraName: "clearedDate" };
    if (header === "Principal") return { type: "number", core: "amount", required: true };
    if (header === "Interest Percentage") return { type: "number", core: "interestPercentage" };
    if (header === "EMI") return { type: "number", core: "emi" };
    if (header === "Tenure (Months)") return { type: "number", core: "tenureMonths", step: "1" };
    if (header === "Loan Amount") return { type: "number", readOnly: true };
    if (header === "Status") return { type: "select", options: loanStatusOptions, readOnly: true };
    if (header === "First EMI") return { type: "date", extraName: "firstEmi" };
  }
  return readonly;
}

function syncSheetFieldChange(page, header, meta, value) {
  if (meta.core) setCoreValue(meta.core, value);
  if (page === "debt" && header === "Loan Type") {
    if (value === "debt_cleared") setCoreValue("status", "Cleared");
    if (value === "debt_given" && coreValue("status") === "Cleared") setCoreValue("status", "Pending");
    updatePartySuggestions();
    updateChittyFields();
    return;
  }
  if (page === "debt" && header === "Status") {
    if (value === "Cleared") setCoreValue("type", "debt_cleared");
    if (value === "Pending" || value === "Partial") setCoreValue("type", "debt_given");
    updatePartySuggestions();
    updateChittyFields();
    return;
  }
  if (page === "debt" && header === "Date Given" && coreValue("type") !== "debt_cleared") {
    setCoreValue("date", value);
  }
  if (page === "debt" && header === "Date Cleared" && coreValue("type") === "debt_cleared") {
    setCoreValue("date", value);
  }
  if (page === "chitty" && header === "Status" && coreValue("type") !== "month_entry") {
    setCoreValue("type", value === "Completed" ? "chitty_received" : "chitty_paid");
    if (value === "Completed") setCoreValue("amountReceived", coreValue("amount"));
    updatePartySuggestions();
    updateChittyFields();
    return;
  }
  if (page === "loan" && ["Type of Fund", "Principal", "Interest Percentage"].includes(header)) {
    updateLoanEmi();
    const emiField = sheetColumnFields?.querySelector('[data-sheet-header="EMI"]');
    if (emiField && header !== "EMI") emiField.value = coreValue("emi");
  }
  if (page === "chitty" && header === "Month Entry" && coreValue("type") === "chitty_received") {
    setCoreValue("amountReceived", value);
  }
}

function renderSheetColumnFields({ preserveValues = true } = {}) {
  const headers = sheetHeadersByPage[currentPage];
  const useSheetFields = Boolean(headers && sheetColumnFields);
  setHidden(sheetColumnFields, !useSheetFields);
  if (sheetColumnFields) sheetColumnFields.hidden = !useSheetFields;
  if (!useSheetFields) {
    sheetColumnFields.innerHTML = "";
    return;
  }

  const previousValues = new Map();
  if (preserveValues && sheetColumnFields.dataset.page === currentPage) {
    sheetColumnFields.querySelectorAll("[data-sheet-header]").forEach((input) => {
      if (input.disabled || input.readOnly) return;
      previousValues.set(input.dataset.sheetHeader, input.value);
    });
  }

  const record = selectedSheetRecord();
  sheetColumnFields.dataset.page = currentPage;
  sheetColumnFields.innerHTML = headers.map((header) => {
    const meta = sheetFieldMeta(currentPage, header);
    const value = previousValues.has(header) ? previousValues.get(header) : sheetFieldValue(currentPage, header, record);
    const readonly = Boolean(meta.readOnly);
    const kind = fieldKindForHeader(header, meta);
    const classes = ["sheet-field", `field-kind-${kind}`, readonly ? "sheet-field-readonly" : ""].filter(Boolean).join(" ");
    const required = meta.required ? " required" : "";
    const disabled = readonly ? " disabled" : "";
    const data = `data-sheet-header="${escapeHtml(header)}"`;
    const name = meta.extraName && !readonly ? ` name="${escapeHtml(meta.extraName)}"` : "";
    if (meta.type === "textarea") {
      return `<label class="${classes}" data-field-kind="${escapeHtml(kind)}"><span>${escapeHtml(visibleSheetHeader(currentPage, header))}</span><textarea ${data}${name}${required}${disabled} rows="3">${escapeHtml(value)}</textarea></label>`;
    }
    if (meta.type === "select") {
      const options = (meta.options || []).map(([optionValue, optionLabel]) =>
        `<option value="${escapeHtml(optionValue)}"${String(optionValue) === String(value) ? " selected" : ""}>${escapeHtml(optionLabel)}</option>`
      ).join("");
      return `<label class="${classes}" data-field-kind="${escapeHtml(kind)}"><span>${escapeHtml(visibleSheetHeader(currentPage, header))}</span><select ${data}${name}${required}${disabled}>${options}</select></label>`;
    }
    const type = meta.type || "text";
    const step = type === "number" ? ` step="${escapeHtml(meta.step || "0.01")}" min="0"` : "";
    return `<label class="${classes}" data-field-kind="${escapeHtml(kind)}"><span>${escapeHtml(visibleSheetHeader(currentPage, header))}</span><input ${data}${name} type="${escapeHtml(type)}" value="${escapeHtml(value)}"${step}${required}${readonly ? " readonly disabled" : ""}></label>`;
  }).join("");

  sheetColumnFields.querySelectorAll("[data-sheet-header]").forEach((input) => {
    const header = input.dataset.sheetHeader;
    const meta = sheetFieldMeta(currentPage, header);
    if (meta.readOnly) return;
    const handler = () => syncSheetFieldChange(currentPage, header, meta, input.value);
    input.addEventListener("input", handler);
    input.addEventListener("change", handler);
  });
}

function renderTradingSheetFields() {
  if (!tradingSheetFields) return;
  tradingSheetFields.innerHTML = sheetHeadersByPage.trading.map((header) => {
    const value = sheetFieldValue("trading", header);
    const kind = fieldKindForHeader(header, { readOnly: true });
    return `<label class="sheet-field field-kind-${escapeHtml(kind)} sheet-field-readonly" data-field-kind="${escapeHtml(kind)}"><span>${escapeHtml(header)}</span><input data-sheet-header="${escapeHtml(header)}" type="text" value="${escapeHtml(value)}" readonly disabled></label>`;
  }).join("");
}

function displayEntryType(entry) {
  const status = String(entry.status || "").toLowerCase();
  if (entry.type === "chitty_summary") {
    return status.includes("completed") || status.includes("received")
      ? "Chitty Received"
      : "Chitty Paid";
  }
  if (entry.type === "chitty_paid" && (status.includes("received") || status.includes("completed"))) {
    return "Chitty Received";
  }
  return entry.typeLabel || labels[entry.type] || entry.type || "";
}

function entryCategory(entry) {
  const type = String(entry.type || "").toLowerCase();
  if (type === "loan" || type.startsWith("loan_")) return "loan";
  if (type.startsWith("chitty")) return "chitty";
  if (type === "property") return "property";
  if (type === "trading") return "trading";
  return "debt";
}

function categoryBadge(category, label) {
  const safeCategory = ["debt", "chitty", "loan", "property", "trading"].includes(category) ? category : "debt";
  return `
    <span class="category-badge category-badge-${safeCategory}">
      <span class="category-icon category-icon-${safeCategory}" aria-hidden="true"></span>
      <span>${escapeHtml(label || "")}</span>
    </span>
  `;
}

function loanToEntry(loan) {
  const status = loan.status || ((Number(loan.tenureMonths || 0) > 0 && Number(loan.finishedMonths || 0) >= Number(loan.tenureMonths || 0)) ? "Cleared" : "On-Going");
  return {
    ...loan,
    id: loan.id,
    date: loan.borrowedDate,
    type: "loan",
    typeLabel: status === "Cleared" ? "Loan Cleared" : "Loan Pending",
    party: loan.borrowedFrom,
    amount: loan.principal,
    finalAmount: loan.loanAmount,
    finalPendingAmount: status === "Cleared" ? loan.loanAmount : loan.remainingLoanAmount,
    finalPendingInterest: status === "Cleared" ? loan.loanInterest : loan.remainingInterest,
    status,
    notes: loan.notes,
    loan
  };
}

function propertyToEntry(property) {
  return {
    ...property,
    id: property.id,
    date: property.registrationDate || property.createdAt || "",
    type: "property",
    typeLabel: "Property",
    party: property.propertyLocation || property.presentOwner || "Property",
    amount: property.purchaseTotalPrice || 0,
    finalPendingAmount: property.sellTotalPrice || "",
    status: property.presentOwner ? "Owned" : "",
    notes: property.notes,
    property
  };
}

function tradingToEntry(row) {
  return {
    ...row,
    id: row.id,
    date: row.investedDate || row.lastUpdated || "",
    type: "trading",
    typeLabel: row.assetType === "Sold Trade" ? "Trading Sold" : "Trading",
    party: row.name || row.assetType || "Trading",
    amount: row.investedValue || 0,
    finalPendingAmount: row.currentValue || 0,
    status: Number(row.profitLoss || 0) > 0 ? "Profit" : Number(row.profitLoss || 0) < 0 ? "Loss" : "On Track",
    notes: [row.assetType || "", row.investedDate ? `Invested: ${row.investedDate}` : ""].filter(Boolean).join(" | "),
    trading: row
  };
}

function combinedEntries() {
  return [
    ...allEntries,
    ...allLoans.map(loanToEntry),
    ...allProperties.map(propertyToEntry),
    ...allTrading.map(tradingToEntry)
  ].sort((a, b) => {
    const time = (value) => {
      const parsed = Date.parse(value || "");
      return Number.isNaN(parsed) ? 0 : parsed;
    };
    return time(b.date) - time(a.date);
  });
}

function filteredEntries() {
  const query = searchInput.value.trim().toLowerCase();
  const type = typeFilter.value;
  return combinedEntries().filter((entry) => {
    if (!pageEntryMatches(entry)) return false;
    if (entry.type === "interest_received") return false;
    const status = String(entry.status || "").toLowerCase();
    const isCompletedChitty = entry.type === "chitty_received" ||
      (entry.type === "chitty_paid" && (status.includes("received") || status.includes("completed"))) ||
      (entry.type === "chitty_summary" && status.includes("completed"));
    const matchesType = !type ||
      entry.type === type ||
      (type === "chitty_paid" && entry.type === "chitty_summary" && status.includes("running")) ||
      (type === "chitty_received" && isCompletedChitty) ||
      (type === "loan_pending" && entry.type === "loan") ||
      (type === "loan_cleared" && entry.type === "loan");
    const matchesStatus =
      !type ||
      (type === "debt_given" && (!status || status.includes("pending") || status.includes("partial"))) ||
      (type === "debt_cleared" && status.includes("cleared")) ||
      (type === "loan_pending" && status === "on-going") ||
      (type === "loan_cleared" && status === "cleared") ||
      (type === "chitty_paid" && entry.type === "chitty_summary" && status.includes("running")) ||
      (type === "chitty_paid" && (!status || status.includes("on going") || status.includes("ongoing"))) ||
      (type === "chitty_received" && isCompletedChitty) ||
      (type !== "debt_given" && type !== "loan_pending" && type !== "loan_cleared" && type !== "chitty_paid" && type !== "chitty_received");
    const searchText = [
      entry.date,
      displayEntryType(entry),
      entry.party,
      entry.amount,
      entry.finalAmount,
      entry.month,
      entry.status,
      entry.typeOfFund,
      entry.assetType,
      entry.notes
    ].join(" ").toLowerCase();
    return matchesType && matchesStatus && (!query || searchText.includes(query));
  });
}

function currencyHtml(value, tone = "neutral") {
  const numeric = Number(value || 0);
  return `<span class="value-tone value-${escapeHtml(tone)}">${escapeHtml(formatCurrency.format(numeric))}</span>`;
}

function metricValueHtml(value, mode = "money", tone = "neutral") {
  if (mode === "percent") return `<span class="value-tone value-${escapeHtml(tone)}">${escapeHtml(`${Number(value || 0).toFixed(1)}%`)}</span>`;
  if (mode === "count") return `<span class="value-tone value-${escapeHtml(tone)}">${escapeHtml(Number(value || 0).toFixed(0))}</span>`;
  return currencyHtml(value || 0, tone);
}

function dashboardStatus(label, tone) {
  const text = label || (tone === "positive" ? "Profit" : tone === "negative" ? "At Risk" : tone === "pending" ? "Pending" : "On Track");
  return `<span class="dashboard-status status-${escapeHtml(tone || "neutral")}">${escapeHtml(text)}</span>`;
}

function comparisonText(value, percent, period = "previous month") {
  const amount = Number(value || 0);
  const arrow = amount > 0 ? "↑ Increase" : amount < 0 ? "↓ Decrease" : "→ No Change";
  return `${arrow} | ${formatCurrency.format(Math.abs(amount))} | ${Number(percent || 0).toFixed(1)}% vs ${period}`;
}

function executiveMetric({ label, value, route, tone = "neutral", detail = "", mode = "money", theme = "neutral", icon = "•", status = "", comparison = "" }) {
  const fullValue = mode === "percent" ? `${Number(value || 0).toFixed(1)}%` : mode === "count" ? Number(value || 0).toFixed(0) : formatCurrency.format(value || 0);
  return `
    <a class="metric executive-metric card-theme-${escapeHtml(theme)} value-${escapeHtml(tone)}" href="#${escapeHtml(route)}" data-route="${escapeHtml(route)}" title="${escapeHtml(`${label}: ${fullValue}`)}" aria-label="${escapeHtml(`${label}: ${fullValue}. ${status || "Open drill down"}`)}">
      <span class="card-icon" aria-hidden="true">${escapeHtml(icon)}</span>
      <span class="card-title">${escapeHtml(label)}</span>
      <strong>${metricValueHtml(value, mode, tone)}</strong>
      <small>${dashboardStatus(status, tone)}${detail ? ` <span>${escapeHtml(detail)}</span>` : ""}</small>
      ${comparison ? `<em>${escapeHtml(comparison)}</em>` : ""}
    </a>
  `;
}

function executiveSection(title, icon, theme, metrics) {
  return `
    <section class="summary-row executive-section section-theme-${escapeHtml(theme)}">
      <h3><span aria-hidden="true">${escapeHtml(icon)}</span>${escapeHtml(title)}</h3>
      <div class="summary-metrics">${metrics.join("")}</div>
    </section>
  `;
}

function chartTools(target) {
  return `
    <div class="line-chart-tools" data-chart-tools="${escapeHtml(target)}">
      <label>Graph Type
        <select data-chart-target="${escapeHtml(target)}" data-chart-control="type">
          <option selected>Line Graph</option>
          <option disabled>Bar Chart - admin disabled</option>
          <option disabled>Area Chart - admin disabled</option>
          <option disabled>Donut Chart - incompatible</option>
        </select>
      </label>
      <label>Date Period
        <select data-chart-target="${escapeHtml(target)}" data-chart-control="period">
          <option>Day</option>
          <option>Week</option>
          <option selected>Month</option>
          <option>Quarter</option>
          <option>Year</option>
        </select>
      </label>
      <label>Compare
        <select data-chart-target="${escapeHtml(target)}" data-chart-control="compare">
          <option selected>Previous Period</option>
          <option>Previous Year</option>
          <option>No Comparison</option>
        </select>
      </label>
      <button type="button" data-chart-action="png" data-chart-target="${escapeHtml(target)}">PNG</button>
      <button type="button" data-chart-action="excel" data-chart-target="${escapeHtml(target)}">Excel</button>
      <button type="button" data-chart-action="print" data-chart-target="${escapeHtml(target)}">Print / PDF</button>
      <button type="button" data-chart-action="fullscreen" data-chart-target="${escapeHtml(target)}">Full Screen</button>
      <button type="button" data-chart-action="reset" data-chart-target="${escapeHtml(target)}">Reset</button>
    </div>
  `;
}

function executiveChartCard(title, canvasId) {
  return `
    <article class="growth-card executive-chart-card">
      <h3>${escapeHtml(title)}</h3>
      ${chartTools(canvasId)}
      <canvas id="${escapeHtml(canvasId)}" width="720" height="260" aria-label="${escapeHtml(title)}"></canvas>
    </article>
  `;
}

function enhanceChartToolbars(scope = document) {
  scope.querySelectorAll(".line-chart-tools[data-chart-tools]").forEach((toolbar) => {
    if (toolbar.querySelector("[data-chart-control='type']")) return;
    toolbar.outerHTML = chartTools(toolbar.dataset.chartTools);
  });
}

function recommendationCard(item) {
  const priority = String(item.priority || "On Track").toLowerCase().includes("urgent") ? "negative" : "on-track";
  return `
    <a class="recommendation-card value-${priority}" href="#${escapeHtml(item.route || "summary")}" data-route="${escapeHtml(item.route || "summary")}">
      <strong>${escapeHtml(item.title || "Recommendation")}</strong>
      <span>${escapeHtml(item.detail || "")}</span>
    </a>
  `;
}

function renderSummary(data) {
  const sections = data.sections || {};
  const income = sections.income || {};
  const expenses = sections.expenses || {};
  const liabilities = sections.liabilities || {};
  const businessFarm = sections.businessFarm || {};
  const investments = sections.investments || {};
  const receivables = sections.receivables || {};
  const payables = sections.payables || {};
  const business = sections.business || {};
  const goals = sections.goals || {};
  const savings = sections.savings || {};
  const tradingPortfolio = sections.tradingPortfolio || {};
  const recommendations = (data.recommendations || []).slice(0, 5);

  summaryGrid.innerHTML = [
    executiveSection("Lent Operations", "LT", "income", [
      executiveMetric({ label: "Amount Lent", value: receivables.amountLent ?? liabilities.amountLent, route: "debt", tone: "positive", theme: "outstanding-debt", icon: "L", status: "Receivable" }),
      executiveMetric({ label: "Amount Recovered", value: receivables.amountRecovered ?? liabilities.amountRecovered, route: "debt", tone: "positive", theme: "outstanding-interest", icon: "R", status: "Received" }),
      executiveMetric({ label: "Outstanding Lent with Interest", value: receivables.outstandingLentWithInterest ?? liabilities.outstandingDebt, route: "debt", tone: "positive", theme: "pending-loan", icon: "24", status: "Income", detail: "24% yearly live interest" })
    ]),
    executiveSection("Chitty Operations", "CH", "chitty", [
      executiveMetric({ label: "Total Chitty Value", value: investments.totalChittyValue, route: "chitty", tone: "positive", theme: "chitty-summary", icon: "T", status: "Total" }),
      executiveMetric({ label: "Chitty Received", value: investments.chittyReceived, route: "chitty", tone: "positive", theme: "monthly-income", icon: "R", status: "Received" }),
      executiveMetric({ label: "Pending Chitty", value: investments.pendingChitty, route: "chitty", tone: "pending", theme: "monthly-expenses", icon: "P", status: "Pending" })
    ]),
    executiveSection("Family Income", "+", "income", [
      executiveMetric({ label: "Total Family Income", value: income.totalMonthlyIncome, route: "salary-income", tone: "positive", theme: "monthly-income", icon: "+", status: "Income" }),
      executiveMetric({ label: "Bank Cash & Savings", value: savings.totalSavings ?? income.bankCashSavings ?? 0, route: "salary-income", tone: "positive", theme: "bank-cash", icon: "BC", status: "Available" }),
      executiveMetric({ label: "PF Balance", value: income.pfBalance ?? savings.pfBalance ?? 0, route: "salary-income", tone: "positive", theme: "monthly-savings", icon: "PF", status: "EPFO" }),
      executiveMetric({ label: "Pension", value: income.pension ?? savings.pension ?? 0, route: "salary-income", tone: "positive", theme: "monthly-income", icon: "PN", status: "EPFO" }),
      executiveMetric({ label: "Monthly Contribution", value: income.monthlyContribution ?? savings.monthlyContribution ?? 0, route: "salary-income", tone: "positive", theme: "outstanding-interest", icon: "MC", status: "EPFO" }),
      executiveMetric({ label: "EPFO Growth", value: income.growth ?? savings.growth ?? 0, route: "salary-income", tone: toneForNumber(income.growth ?? savings.growth), theme: "net-worth-change", icon: "G", status: "Growth" })
    ]),
    executiveSection("EPFO Integration", "EP", "income", [
      executiveMetric({ label: "UAN", value: 0, route: "salary-income", tone: "neutral", theme: "neutral", icon: "U", status: "Configured", mode: "count", detail: String(income.uan || savings.uan || "Add in Family Income") }),
      executiveMetric({ label: "Passbook", value: 0, route: "salary-income", tone: "neutral", theme: "neutral", icon: "PB", status: String(income.passbook || savings.passbook || "Pending"), mode: "count" }),
      executiveMetric({ label: "Employer", value: 0, route: "salary-income", tone: "neutral", theme: "neutral", icon: "ER", status: String(income.employer || savings.employer || "Not set"), mode: "count" })
    ]),
    executiveSection("Farm Operations", "F", "farm-business", [
      executiveMetric({ label: "Total Farm Income", value: businessFarm.totalFarmIncome ?? 0, route: "farm-manager", tone: "positive", theme: "farm-profit", icon: "F", status: "Income" }),
      executiveMetric({ label: "Income Received", value: businessFarm.farmIncomeReceived ?? 0, route: "farm-manager", tone: "positive", theme: "monthly-income", icon: "R", status: "Received" }),
      executiveMetric({ label: "Expected/Pending Income", value: businessFarm.farmPendingIncome ?? 0, route: "farm-manager", tone: "pending", theme: "pending-loan", icon: "P", status: "Pending" })
    ]),
    executiveSection("Loans and Property Loans", "LN", "liabilities", [
      executiveMetric({ label: "Total Loan Amount", value: payables.totalLoanAmount ?? liabilities.totalLoanAmount, route: "loan", tone: "negative", theme: "total-liabilities", icon: "T", status: "Payable" }),
      executiveMetric({ label: "Total Loan Paid", value: payables.totalLoanPaid ?? liabilities.totalLoanPaid, route: "loan", tone: "positive", theme: "monthly-income", icon: "P", status: "Paid" }),
      executiveMetric({ label: "Total Pending Loan", value: payables.totalPendingLoan ?? liabilities.pendingLoan, route: "loan", tone: "pending", theme: "pending-loan", icon: "D", status: "Pending" })
    ]),
    executiveSection("Trading Operations", "TR", "investments", [
      executiveMetric({ label: "Total Invested Amount", value: tradingPortfolio.totalInvestedAmount ?? investments.tradingPortfolioInvested, route: "trading", tone: "neutral", theme: "trading-summary", icon: "I", status: "Invested" }),
      executiveMetric({ label: "Current Portfolio Value", value: tradingPortfolio.currentPortfolioValue ?? investments.tradingPortfolioCurrentValue, route: "trading", tone: "neutral", theme: "portfolio-summary", icon: "V", status: "Current" }),
      executiveMetric({ label: "Overall Profit/Loss", value: tradingPortfolio.overallProfitLoss ?? investments.tradingPortfolioProfitLoss, route: "trading", tone: toneForNumber(tradingPortfolio.overallProfitLoss ?? investments.tradingPortfolioProfitLoss), theme: "stocks-summary", icon: "PL", status: (tradingPortfolio.overallProfitLoss ?? investments.tradingPortfolioProfitLoss ?? 0) >= 0 ? "Profit" : "Loss" })
    ]),
    executiveSection("Family Expenses", "-", "expenses", [
      executiveMetric({ label: "Total Expenses", value: expenses.totalMonthlyExpenses, route: "family-expenses", tone: "negative", theme: "monthly-expenses", icon: "T", status: "Expense" }),
      executiveMetric({ label: "Paid Amount", value: expenses.paidAmount ?? expenses.totalMonthlyExpenses, route: "family-expenses", tone: "positive", theme: "monthly-income", icon: "P", status: "Paid" }),
      executiveMetric({ label: "Pending/Planned Amount", value: expenses.pendingPlannedAmount ?? 0, route: "budget-planner", tone: "pending", theme: "pending-loan", icon: "D", status: "Planned" })
    ]),
    executiveSection("Business Summary", "B", "business", [
      executiveMetric({ label: "Total Income", value: business.totalIncome, route: "business-manager", tone: "positive", theme: "monthly-income", icon: "+", status: "Income" }),
      executiveMetric({ label: "Total Expenses", value: business.totalExpenses, route: "business-manager", tone: "negative", theme: "monthly-expenses", icon: "-", status: "Expense" }),
      executiveMetric({ label: "Net Profit/Loss", value: business.netProfitLoss ?? businessFarm.businessProfitLoss, route: "business-manager", tone: toneForNumber(business.netProfitLoss ?? businessFarm.businessProfitLoss), theme: "business-profit", icon: "PL", status: (business.netProfitLoss ?? businessFarm.businessProfitLoss ?? 0) >= 0 ? "Profit" : "Loss" })
    ]),
    executiveSection("Goals Operations", "%", "goals", [
      executiveMetric({ label: "Goal Amount", value: goals.goalAmount, route: "goals-planning", tone: "neutral", theme: "goal-completion", icon: "G", status: "Goal" }),
      executiveMetric({ label: "Saved Amount", value: goals.savedAmount, route: "goals-planning", tone: "positive", theme: "monthly-savings", icon: "S", status: "Saved" }),
      executiveMetric({ label: "Remaining Amount", value: goals.remainingAmount, route: "goals-planning", tone: "pending", theme: "pending-loan", icon: "R", status: "Remaining" })
    ]),
    `<section class="summary-row executive-section section-theme-actions">
      <h3><span aria-hidden="true">!</span>Recommended Actions</h3>
      <div class="recommendation-grid">${recommendations.map(recommendationCard).join("")}</div>
    </section>`
  ].join("");
}

function netWorthMetric(label, value, tone = toneForNumber(value)) {
  return `<div class="net-worth-item value-${escapeHtml(tone)}"><span>${escapeHtml(label)}</span><strong>${signedMoneyHtml(value || 0)}</strong></div>`;
}

function netWorthKpiCard(label, value, tooltip, mode = "money") {
  const numeric = Number(value || 0);
  const tone = toneForNumber(numeric);
  const display = mode === "percent"
    ? `${numeric.toFixed(2)}%`
    : mode === "score"
      ? numeric.toFixed(0)
      : signedMoneyHtml(numeric);
  return `
    <article class="net-worth-kpi value-${escapeHtml(tone)}" title="${escapeHtml(tooltip)}">
      <span>${escapeHtml(label)}</span>
      <strong>${mode === "money" ? display : escapeHtml(display)}</strong>
      <small>${numeric > 0 ? "Increase" : numeric < 0 ? "Decrease" : "On Track"} | ${mode === "percent" ? `${Math.abs(numeric).toFixed(2)}%` : `${Math.abs(numeric).toFixed(1)}%`}</small>
    </article>
  `;
}

function renderNetWorth(data, reportsData = {}, yearlyRows = []) {
  const report = reportsData.netWorthReport || {};
  const merged = { ...report, ...data };
  summaryGrid.innerHTML = `
    <section class="summary-row executive-section section-theme-assets">
      <h3><span aria-hidden="true">NW</span>Net Worth KPIs</h3>
      <div class="net-worth-kpi-strip">
        ${netWorthKpiCard("Opening Net Worth", merged.openingNetWorth ?? merged.actualNetWorth, "Opening net worth from the earliest available synced period.")}
        ${netWorthKpiCard("Current Net Worth", merged.currentNetWorth ?? merged.actualNetWorth, "Current total assets, investments, cash and receivables minus liabilities and commitments.")}
        ${netWorthKpiCard("Monthly Change", merged.monthlyChange, "Current month net worth minus previous month net worth.")}
        ${netWorthKpiCard("Yearly Change", merged.yearlyChange, "Current year net worth minus previous year net worth.")}
        ${netWorthKpiCard("Net Worth Growth %", merged.netWorthGrowthPercent, "Percentage growth from opening net worth to current net worth.", "percent")}
        ${netWorthKpiCard("Total Assets", merged.totalAssets, "All property, assets, investments, cash and owned wealth.")}
        ${netWorthKpiCard("Total Liabilities", merged.totalLiabilities, "All loans, payables and outstanding commitments.", "money")}
        ${netWorthKpiCard("Asset Growth", merged.assetGrowth, "Growth in total asset value over the selected period.")}
        ${netWorthKpiCard("Liability Reduction", merged.liabilityReduction, "Reduction in total liabilities over the selected period.")}
        ${netWorthKpiCard("Largest Loan", merged.largestLoan, "Largest outstanding loan or property loan.")}
        ${netWorthKpiCard("Largest Asset", merged.largestAsset ?? merged.totalAssets, "Largest owned asset from synced records.")}
        ${netWorthKpiCard("Largest Investment", merged.largestInvestment ?? merged.totalInvestments, "Largest investment or portfolio position.")}
        ${netWorthKpiCard("Largest Business Profit", merged.largestBusinessProfit, "Largest positive business profit value.")}
        ${netWorthKpiCard("Financial Health Score", merged.financialHealthScore, "Composite score from income, assets, liabilities, cash flow and goal health.", "score")}
      </div>
      <p class="module-sync-line">${escapeHtml(data.formula || "")}</p>
      <p class="module-sync-line">Calculated: ${escapeHtml(data.calculatedAt ? new Date(data.calculatedAt).toLocaleString() : "")}</p>
    </section>
    <section class="reports-section">
      <h3>Historical Net Worth Graph</h3>
      <canvas id="netWorthHistoryChart" width="920" height="280"></canvas>
    </section>
    <section class="reports-section net-worth-chart-grid">
      <article><h3>Asset Allocation</h3><canvas id="assetAllocationChart" width="460" height="260"></canvas></article>
      <article><h3>Liability Distribution</h3><canvas id="liabilityDistributionChart" width="460" height="260"></canvas></article>
      <article><h3>Monthly Trend</h3><canvas id="netWorthMonthlyTrendChart" width="460" height="260"></canvas></article>
      <article><h3>Yearly Trend</h3><canvas id="netWorthYearlyTrendChart" width="460" height="260"></canvas></article>
    </section>
  `;
  const trendRows = Array.isArray(reportsData.trends?.assetsLiabilitiesNetWorth)
    ? reportsData.trends.assetsLiabilitiesNetWorth.map((row) => ({
      ...row,
      totalAssets: row.assets,
      totalLiabilities: row.liabilities,
      monthlyChange: row.netWorth,
      yearlyChange: row.netWorth
    }))
    : [];
  const rows = trendRows.length ? trendRows : (Array.isArray(yearlyRows) ? yearlyRows : []);
  drawSeriesChart(document.querySelector("#netWorthHistoryChart"), rows, [
    { key: "totalAssets", color: "#2563eb", name: "Total Assets" },
    { key: "totalLiabilities", color: "#dc2626", name: "Total Liabilities" },
    { key: "netWorth", color: "#16a34a", name: "Net Worth" }
  ], "No historical net worth data available");
  drawSeriesChart(document.querySelector("#assetAllocationChart"), rows, [
    { key: "totalAssets", color: "#2563eb", name: "Assets" },
    { key: "tradingCurrentValue", color: "#16a34a", name: "Investments" }
  ], "No asset allocation data available", { height: 260 });
  drawSeriesChart(document.querySelector("#liabilityDistributionChart"), rows, [
    { key: "loanAmount", color: "#dc2626", name: "Loans" },
    { key: "loanPending", color: "#f59e0b", name: "Pending Loan" }
  ], "No liability distribution data available", { height: 260 });
  drawSeriesChart(document.querySelector("#netWorthMonthlyTrendChart"), rows, [
    { key: "monthlyChange", color: "#7c3aed", name: "Monthly Change" }
  ], "No monthly trend data available", { height: 260 });
  drawSeriesChart(document.querySelector("#netWorthYearlyTrendChart"), rows, [
    { key: "yearlyChange", color: "#0f766e", name: "Yearly Change" }
  ], "No yearly trend data available", { height: 260 });
}
function renderTable() {
  const entries = filteredEntries();
  const totalRecords = combinedEntries().filter((entry) => pageEntryMatches(entry) && entry.type !== "interest_received").length;

  entryCount.textContent = `${entries.length} of ${totalRecords} ${totalRecords === 1 ? "record" : "records"}`;

  if (!entries.length) {
    entriesBody.innerHTML = '<tr><td colspan="8" class="empty">No matching records.</td></tr>';
    return;
  }

  entriesBody.innerHTML = entries.map((entry) => {
    const category = entryCategory(entry);
    const visibleStatus = entry.status;
    const amountHtml = entry.type === "loan"
      ? formatMoney.format(entry.amount || 0)
      : formatMoney.format(entry.amount || 0);
    const finalOrPending = entry.finalPendingAmount !== undefined
      ? entry.finalPendingAmount
      : entry.type === "debt_given"
      ? entry.finalAmount
      : entry.type === "chitty_summary"
        ? entry.chitty?.finalAmount
        : entry.type === "loan"
          ? entry.loanAmount
          : "";
    const finalOrPendingHtml = entry.type === "loan"
      ? amountWithDetail(finalOrPending, formatInterestDetail(entry.interestRate, entry.finalPendingInterest))
      : (finalOrPending === "" || finalOrPending === undefined ? "" : formatMoney.format(finalOrPending || 0));
    const actionsHtml = entry.type === "property" || entry.type === "trading"
      ? `<button class="table-action open-entry" type="button" data-route="${escapeHtml(routeForEntry(entry))}">Open</button>`
      : `
        <button class="table-action edit-entry" type="button" data-id="${escapeHtml(entry.id)}">Edit</button>
        <button class="table-action danger delete-entry" type="button" data-id="${escapeHtml(entry.id)}">Delete</button>
      `;
    return `
    <tr class="record-row record-row-${category}" data-entry-id="${escapeHtml(entry.id)}">
      <td>${escapeHtml(entry.date)}</td>
      <td>${categoryBadge(category, displayEntryType(entry))}</td>
      <td>${escapeHtml(entry.party)}</td>
      <td class="amount">${amountHtml}</td>
      <td class="amount">${finalOrPendingHtml}</td>
      <td>${statusPill(visibleStatus)}</td>
      <td class="notes">${escapeHtml(entry.notes)}</td>
      <td class="actions">
        ${actionsHtml}
      </td>
    </tr>
  `;
  }).join("");
}

function renderProperties() {
  propertyCount.textContent = `${allProperties.length} ${allProperties.length === 1 ? "record" : "records"}`;

  if (!allProperties.length) {
    propertiesBody.innerHTML = '<tr><td colspan="16" class="empty">No property records yet.</td></tr>';
    return;
  }

  propertiesBody.innerHTML = allProperties.map((property) => `
    <tr class="record-row record-row-property">
      <td>${escapeHtml(property.id)}</td>
      <td>${categoryBadge("property", property.propertyLocation || "Property")}</td>
      <td>${property.googleMapLocation ? `<a href="${escapeHtml(property.googleMapLocation)}" target="_blank" rel="noreferrer">Map</a>` : ""}</td>
      <td>${escapeHtml(property.propertySize)}</td>
      <td>${escapeHtml(property.propertyDimensions)}</td>
      <td>${escapeHtml(property.previousLandOwner)}</td>
      <td class="amount">${formatMoney.format(property.purchasePricePerSqy || 0)}</td>
      <td class="amount">${formatMoney.format(property.purchaseTotalPrice || 0)}</td>
      <td>${escapeHtml(property.documentNumber)}</td>
      <td>${escapeHtml(property.registrationDate)}</td>
      <td class="amount">${formatMoney.format(property.sellPricePerSqy || 0)}</td>
      <td class="amount">${formatMoney.format(property.sellTotalPrice || 0)}</td>
      <td>${escapeHtml(property.presentOwner)}</td>
      <td>${escapeHtml(property.newOwner)}</td>
      <td class="notes">${escapeHtml(property.notes)}</td>
      <td>${escapeHtml(property.createdAt)}</td>
    </tr>
  `).join("");
}

function tradingDateEditor(row) {
  return `
    <div class="trading-date-editor">
      <input
        type="date"
        value="${escapeHtml(row.investedDate || "")}"
        aria-label="Invested date for ${escapeHtml(row.name || row.id || "trading record")}"
      >
      <button class="table-action save-trading-date" type="button" data-id="${escapeHtml(row.id)}">Save</button>
    </div>
  `;
}

function renderTrading() {
  tradingCount.textContent = `${allTrading.length} ${allTrading.length === 1 ? "record" : "records"}`;
  renderTradingSheetFields();

  if (!allTrading.length) {
    tradingBody.innerHTML = '<tr><td colspan="14" class="empty">No trading records yet.</td></tr>';
    return;
  }

  tradingBody.innerHTML = allTrading.map((row) => `
    <tr class="record-row record-row-trading">
      <td>${escapeHtml(row.id)}</td>
      <td>${categoryBadge("trading", row.assetType || "Trading")}</td>
      <td>${escapeHtml(row.name)}</td>
      <td>${tradingDateEditor(row)}</td>
      <td class="amount">${formatMoney.format(row.averageBuyPrice || 0)}</td>
      <td class="amount">${formatMoney.format(row.currentMarketPrice || 0)}</td>
      <td class="amount">${formatMoney.format(row.quantity || 0)}</td>
      <td class="amount">${formatMoney.format(row.investedValue || 0)}</td>
      <td class="amount">${formatMoney.format(row.currentValue || 0)}</td>
      <td class="amount">${signedMoneyHtml(row.realisedProfitLoss || 0)}</td>
      <td class="amount">${signedMoneyHtml(row.unrealisedProfitLoss || 0)}</td>
      <td class="amount">${signedMoneyHtml(row.profitLoss || 0)}</td>
      <td class="amount">${signedPercentHtml(row.profitPercent || 0)}</td>
      <td>${escapeHtml(row.lastUpdated)}</td>
    </tr>
  `).join("");
}

function updatePartySuggestions() {
  const type = typeInput.value;
  const monthTarget = monthEntryTargetInput.value;
  const chittyGroups = allEntries
    .filter((entry) => entry.type === "chitty_summary")
    .map((entry) => entry.party)
    .filter(Boolean);
  const loanNames = allLoans.map((loan) => loan.borrowedFrom).filter(Boolean);
  const list = type === "month_entry"
    ? (monthTarget === "loan" ? loanNames : chittyGroups)
    : type === "debt_cleared"
    ? suggestions.debtCleared
    : type === "chitty_received"
      ? suggestions.chittyReceived
      : [];
  partySuggestions.innerHTML = list.map((party) => `<option value="${escapeHtml(party)}"></option>`).join("");
  partyInput.placeholder = type === "month_entry"
    ? (monthTarget === "loan" ? "Choose loan borrower" : "Choose chitty group")
    : list.length ? "Choose existing name or type new" : "Name or chitty group";
}

function updateChittyFields({ preserveSheetValues = true } = {}) {
  const isChittyPaid = typeInput.value === "chitty_paid";
  const isChittyReceived = typeInput.value === "chitty_received";
  const isDebt = typeInput.value === "debt_given" || typeInput.value === "debt_cleared";
  const isLoan = typeInput.value === "loan";
  const isMonthEntry = typeInput.value === "month_entry";
  const isHandLoan = isLoan && form.typeOfFund.value === "Hand Loan";
  const isBankLoan = isLoan && form.typeOfFund.value !== "Hand Loan";
  const useSheetFields = ["debt", "chitty", "loan"].includes(currentPage);
  updatePageFieldLabels();
  const labelsById = [
    "dateLabel",
    "entryTypeLabel",
    "monthEntryTargetLabel",
    "partyLabel",
    "amountLabel",
    "modeLabel",
    "tenureMonthsLabel",
    "statusLabel",
    "notesLabel",
    "amountReceivedLabel",
    "interestReceivedLabel",
    "typeOfFundLabel",
    "interestPercentageLabel",
    "emiLabel",
    "finishedMonthsLabel",
    "loanPaidLabel"
  ];
  const visible = new Set(["dateLabel", "entryTypeLabel", "partyLabel", "amountLabel", "modeLabel", "notesLabel"]);
  if (isChittyPaid) visible.add("tenureMonthsLabel");
  if (isChittyReceived) visible.delete("tenureMonthsLabel");
  if (isLoan) {
    visible.delete("modeLabel");
    visible.add("typeOfFundLabel");
    visible.add("interestPercentageLabel");
    visible.add("loanPaidLabel");
    if (isBankLoan) {
      visible.add("emiLabel");
      visible.add("tenureMonthsLabel");
      visible.add("finishedMonthsLabel");
    }
  }
  if (isMonthEntry) {
    if (currentPage !== "chitty" && currentPage !== "loan") {
      visible.add("monthEntryTargetLabel");
    }
    visible.delete("modeLabel");
    visible.delete("tenureMonthsLabel");
  }
  if (typeInput.value === "debt_given" && form.status.value === "Partial") {
    visible.add("interestReceivedLabel");
  }
  labelsById.forEach((id) => {
    const label = document.querySelector(`#${id}`);
    if (label) label.hidden = useSheetFields || !visible.has(id);
  });
  if (isLoan) {
    form.amountReceived.value = "";
  }
  if (!isLoan) {
    form.typeOfFund.value = "";
    form.interestPercentage.value = "";
    form.emi.value = "";
    form.finishedMonths.value = "";
    form.loanPaid.value = "";
  }
  if (isChittyReceived) form.amountReceived.value = form.amount.value;
  if (isMonthEntry) {
    saveEntryButton.textContent = "Save Month Entry";
  } else if (isLoan && editingLoanId) {
    saveEntryButton.textContent = "Update Loan";
  } else if (isLoan) {
    saveEntryButton.textContent = "Save Loan";
  } else if (!editingEntryId) {
    saveEntryButton.textContent = "Save to Excel";
  }
  renderSheetColumnFields({ preserveValues: preserveSheetValues });
}

function resetEntryForm() {
  editingEntryId = "";
  editingLoanId = "";
  form.reset();
  document.querySelector("#date").valueAsDate = new Date();
  saveEntryButton.textContent = "Save to Excel";
  cancelEditButton.hidden = true;
  message.textContent = "";
  updatePartySuggestions();
  updateChittyFields({ preserveSheetValues: false });
}

function populateLoanEntryForm(loan) {
  editingEntryId = "";
  editingLoanId = loan.id;
  form.date.value = loan.borrowedDate || "";
  form.type.value = "loan";
  form.party.value = loan.borrowedFrom || "";
  form.amount.value = loan.principal || "";
  form.mode.value = "";
  form.month.value = "";
  form.startingMonth.value = "";
  form.tenureMonths.value = loan.tenureMonths || "";
  form.status.value = "";
  form.amountReceived.value = "";
  form.interestReceived.value = "";
  form.notes.value = loan.notes || "";
  form.typeOfFund.value = loan.typeOfFund || "";
  form.interestPercentage.value = loan.interestPercentage || "";
  form.emi.value = loan.emi || "";
  form.finishedMonths.value = loan.finishedMonths || "";
  form.loanPaid.value = loan.loanPaid || "";
  saveEntryButton.textContent = "Update Loan";
  cancelEditButton.hidden = false;
  message.style.color = "#146c43";
  message.textContent = "Editing existing loan.";
  updatePartySuggestions();
  updateChittyFields({ preserveSheetValues: false });
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function populateMonthEntryForm(entry) {
  editingEntryId = "";
  editingLoanId = "";
  form.date.value = new Date().toISOString().slice(0, 10);
  form.type.value = "month_entry";
  form.monthEntryTarget.value = entry.type === "loan" ? "loan" : "chitty";
  form.party.value = entry.party || "";
  form.amount.value = entry.type === "loan" ? entry.loan?.emi || "" : entry.chitty?.currentMonthPaid || "";
  form.mode.value = "";
  form.month.value = entry.chitty?.nextMonth || "";
  form.startingMonth.value = entry.chitty?.startingMonth || "";
  form.tenureMonths.value = entry.chitty?.tenureMonths || "";
  form.status.value = "";
  form.amountReceived.value = "";
  form.interestReceived.value = "";
  form.notes.value = "";
  updatePartySuggestions();
  updateChittyFields({ preserveSheetValues: false });
  message.style.color = "#146c43";
  message.textContent = `Adding monthly payment for ${entry.party}.`;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function populateEntryForm(entry) {
  if (entry.type === "loan") {
    populateLoanEntryForm(entry.loan || entry);
    return;
  }
  editingEntryId = entry.id;
  editingLoanId = "";
  const isChittySummary = entry.type === "chitty_summary";
  form.date.value = isChittySummary ? new Date().toISOString().slice(0, 10) : entry.date || "";
  form.type.value = isChittySummary ? "month_entry" : entry.type || "debt_given";
  form.monthEntryTarget.value = isChittySummary ? "chitty" : "chitty";
  form.party.value = entry.party || "";
  form.amount.value = isChittySummary ? entry.chitty?.currentMonthPaid || "" : entry.amount || "";
  form.mode.value = entry.mode || "";
  form.month.value = isChittySummary ? entry.chitty?.nextMonth || "" : entry.month || "";
  form.startingMonth.value = isChittySummary ? entry.chitty?.startingMonth || "" : entry.startingMonth || "";
  form.tenureMonths.value = isChittySummary ? entry.chitty?.tenureMonths || "" : entry.tenureMonths || "";
  form.status.value = entry.status || "";
  form.amountReceived.value = entry.amountReceived || "";
  form.interestReceived.value = entry.interestReceived || "";
  form.notes.value = entry.notes || "";
  saveEntryButton.textContent = isChittySummary ? "Add Chitty Month" : "Update Excel Entry";
  cancelEditButton.hidden = false;
  message.style.color = "#146c43";
  message.textContent = isChittySummary ? "Adding the next monthly payment for this Chitty / Group." : "Editing existing entry.";
  updatePartySuggestions();
  updateChittyFields({ preserveSheetValues: false });
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function drawSeriesChart(canvas, rows, series, emptyText, options = {}) {
  if (!canvas) return;
  const id = canvas.id || `chart-${Math.random()}`;
  if (!canvas.id) canvas.id = id;
  const previous = chartRegistry.get(id) || {};
  const state = {
    ...previous,
    canvas,
    rows: Array.isArray(rows) ? rows : [],
    series,
    emptyText,
    options,
    hiddenKeys: previous.hiddenKeys || new Set(),
    zoomStart: previous.zoomStart || 0,
    zoomEnd: previous.zoomEnd || 0,
    points: [],
    legendBoxes: [],
    dragging: false,
    dragStartX: 0
  };
  chartRegistry.set(id, state);
  attachLineChartEvents(canvas, id);
  renderLineChart(id);
}

function chartLabel(row) {
  return row.period || row.year || row.label || "";
}

function activeSeries(state) {
  return state.series.filter((item) => !state.hiddenKeys.has(item.key));
}

function formatChartValue(value, options = {}) {
  if (options.percent) return `${Number(value || 0).toFixed(2)}%`;
  if (options.valueSuffix === "%") return `${Number(value || 0).toFixed(2)}%`;
  return formatMoney.format(Number(value || 0));
}

function renderLineChart(id) {
  const state = chartRegistry.get(id);
  if (!state?.canvas) return;
  const { canvas, rows, options } = state;
  const ctx = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const cssWidth = Math.max(canvas.clientWidth || 720, 320);
  const cssHeight = Number(options.height || 280);
  canvas.width = Math.round(cssWidth * ratio);
  canvas.height = Math.round(cssHeight * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const width = cssWidth;
  const height = cssHeight;
  const padding = { top: 44, right: 26, bottom: 46, left: 70 };
  ctx.clearRect(0, 0, width, height);
  state.points = [];
  state.legendBoxes = [];

  if (!rows.length) {
    ctx.fillStyle = "#667085";
    ctx.font = "15px Arial";
    ctx.fillText(state.emptyText, 24, 44);
    return;
  }

  const windowSize = Math.max(2, Math.min(rows.length, state.zoomEnd ? state.zoomEnd - state.zoomStart : rows.length));
  state.zoomStart = Math.max(0, Math.min(state.zoomStart, Math.max(rows.length - windowSize, 0)));
  state.zoomEnd = Math.min(rows.length, state.zoomStart + windowSize);
  const visibleRows = rows.slice(state.zoomStart, state.zoomEnd || rows.length);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const series = activeSeries(state);
  const values = visibleRows.flatMap((row) => series.map((item) => Number(row[item.key] || 0))).filter(Number.isFinite);
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(options.valueSuffix === "%" ? 100 : 1, ...values);
  const range = Math.max(maxValue - minValue, 1);
  const xFor = (index) => padding.left + (visibleRows.length <= 1 ? chartWidth / 2 : (index / (visibleRows.length - 1)) * chartWidth);
  const yFor = (value) => padding.top + chartHeight - ((Number(value || 0) - minValue) / range) * chartHeight;

  ctx.strokeStyle = "#d8dee8";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + chartHeight);
  ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
  ctx.stroke();

  ctx.textAlign = "right";
  ctx.font = "12px Arial";
  for (let i = 0; i <= 4; i++) {
    const value = minValue + (range / 4) * i;
    const y = yFor(value);
    ctx.strokeStyle = "#edf1f6";
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartWidth, y);
    ctx.stroke();
    ctx.fillStyle = "#667085";
    ctx.fillText(options.valueSuffix === "%" ? `${Math.round(value)}%` : compactMoney(value), padding.left - 10, y + 4);
  }

  series.forEach((item) => {
    const points = visibleRows.map((row, index) => ({
      x: xFor(index),
      y: yFor(row[item.key] || 0),
      value: Number(row[item.key] || 0),
      row,
      item
    }));
    if (!points.length) return;
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        const prev = points[index - 1];
        const midX = (prev.x + point.x) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, midX, (prev.y + point.y) / 2);
        ctx.quadraticCurveTo(point.x, point.y, point.x, point.y);
      }
    });
    ctx.stroke();
    points.forEach((point) => {
      ctx.fillStyle = point.value < 0 ? (item.negativeColor || "#dc2626") : item.color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
      state.points.push(point);
    });
  });

  ctx.textAlign = "center";
  ctx.font = "11px Arial";
  ctx.fillStyle = "#18212f";
  visibleRows.forEach((row, index) => {
    ctx.fillText(chartLabel(row), xFor(index), height - 18);
  });

  let legendX = padding.left;
  let legendY = 16;
  state.series.forEach((item) => {
    const disabled = state.hiddenKeys.has(item.key);
    const label = item.name;
    const itemWidth = ctx.measureText(label).width + 46;
    if (legendX + itemWidth > padding.left + chartWidth) {
      legendX = padding.left;
      legendY += 18;
    }
    ctx.globalAlpha = disabled ? 0.35 : 1;
    ctx.fillStyle = item.color;
    ctx.fillRect(legendX, legendY, 12, 12);
    ctx.fillStyle = "#18212f";
    ctx.textAlign = "left";
    ctx.fillText(label, legendX + 18, legendY + 10);
    ctx.globalAlpha = 1;
    state.legendBoxes.push({ x: legendX, y: legendY, w: itemWidth, h: 16, key: item.key });
    legendX += itemWidth;
  });
}

function compactMoney(value) {
  const amount = Number(value || 0);
  if (Math.abs(amount) >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`;
  if (Math.abs(amount) >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (Math.abs(amount) >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return `${Math.round(amount)}`;
}

function attachLineChartEvents(canvas, id) {
  if (canvas.dataset.lineEventsAttached) return;
  canvas.dataset.lineEventsAttached = "true";
  canvas.addEventListener("mousemove", (event) => {
    const state = chartRegistry.get(id);
    if (!state) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (state.dragging) {
      const delta = x - state.dragStartX;
      if (Math.abs(delta) > 22) {
        const direction = delta > 0 ? -1 : 1;
        const windowSize = Math.max(2, (state.zoomEnd || state.rows.length) - state.zoomStart);
        state.zoomStart = Math.max(0, Math.min(state.zoomStart + direction, Math.max(state.rows.length - windowSize, 0)));
        state.zoomEnd = state.zoomStart + windowSize;
        state.dragStartX = x;
        renderLineChart(id);
      }
      return;
    }
    const nearest = state.points.reduce((best, point) => {
      const distance = Math.hypot(point.x - x, point.y - y);
      return !best || distance < best.distance ? { point, distance } : best;
    }, null);
    if (!nearest || nearest.distance > 28) {
      chartTooltip.hidden = true;
      return;
    }
    const { point } = nearest;
    chartTooltip.innerHTML = `<strong>${escapeHtml(point.item.name)}</strong><span>${escapeHtml(chartLabel(point.row))}: ${escapeHtml(formatChartValue(point.value, state.options))}</span>`;
    chartTooltip.style.left = `${event.pageX + 12}px`;
    chartTooltip.style.top = `${event.pageY + 12}px`;
    chartTooltip.hidden = false;
  });
  canvas.addEventListener("mouseleave", () => {
    chartTooltip.hidden = true;
    const state = chartRegistry.get(id);
    if (state) state.dragging = false;
  });
  canvas.addEventListener("mousedown", (event) => {
    const state = chartRegistry.get(id);
    if (!state) return;
    state.dragging = true;
    state.dragStartX = event.offsetX;
  });
  canvas.addEventListener("mouseup", () => {
    const state = chartRegistry.get(id);
    if (state) state.dragging = false;
  });
  canvas.addEventListener("wheel", (event) => {
    const state = chartRegistry.get(id);
    if (!state || state.rows.length <= 2) return;
    event.preventDefault();
    const currentSize = Math.max(2, (state.zoomEnd || state.rows.length) - state.zoomStart);
    const nextSize = Math.max(2, Math.min(state.rows.length, currentSize + (event.deltaY > 0 ? 1 : -1)));
    const center = state.zoomStart + currentSize / 2;
    state.zoomStart = Math.max(0, Math.min(Math.round(center - nextSize / 2), Math.max(state.rows.length - nextSize, 0)));
    state.zoomEnd = state.zoomStart + nextSize;
    renderLineChart(id);
  }, { passive: false });
  canvas.addEventListener("click", (event) => {
    const state = chartRegistry.get(id);
    if (!state) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hit = state.legendBoxes.find((box) => x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h);
    if (!hit) return;
    if (state.hiddenKeys.has(hit.key)) {
      state.hiddenKeys.delete(hit.key);
    } else {
      state.hiddenKeys.add(hit.key);
    }
    renderLineChart(id);
  });
}

function downloadTextFile(filename, text, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportChartData(target) {
  const state = chartRegistry.get(target);
  if (!state) return;
  const headers = ["Period", ...state.series.map((item) => item.name)];
  const rows = state.rows.map((row) => [
    chartLabel(row),
    ...state.series.map((item) => row[item.key] || 0)
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  downloadTextFile(`${target}.csv`, csv, "text/csv");
}

function resetChart(target) {
  const state = chartRegistry.get(target);
  if (!state) return;
  state.zoomStart = 0;
  state.zoomEnd = 0;
  renderLineChart(target);
}

function exportChartPng(target) {
  const canvas = document.getElementById(target);
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = `${target}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function printChart(target) {
  const canvas = document.getElementById(target);
  if (!canvas) return;
  const printWindow = window.open("", "_blank", "width=960,height=720");
  if (!printWindow) return;
  printWindow.document.write(`
    <html><head><title>${escapeHtml(target)}</title></head>
    <body style="margin:24px;font-family:Arial,sans-serif">
      <img src="${canvas.toDataURL("image/png")}" style="width:100%;max-width:1100px">
      <script>window.onload=()=>window.print();<\/script>
    </body></html>
  `);
  printWindow.document.close();
}

function fullscreenChart(target) {
  const canvas = document.getElementById(target);
  const card = canvas?.closest(".growth-card") || canvas;
  if (card?.requestFullscreen) card.requestFullscreen();
}

function handleChartAction(button) {
  const target = button.dataset.chartTarget;
  const action = button.dataset.chartAction;
  if (!target || !action) return;
  if (action === "png") exportChartPng(target);
  if (action === "excel") exportChartData(target);
  if (action === "print") printChart(target);
  if (action === "fullscreen") fullscreenChart(target);
  if (action === "reset") resetChart(target);
}

function drawGrowthChart(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  drawSeriesChart(debtGrowthChart, safeRows, [
    { key: "debtClearedPercent", label: "AR", color: "#146c43", name: "Amount Recovered" },
    { key: "debtPendingPercent", label: "OL", color: "#2356a3", name: "Outstanding Lent" }
  ], "No lent growth data available", { valueSuffix: "%" });
  drawSeriesChart(chittyGrowthChart, safeRows, [
    { key: "chittyReceivedPercent", label: "CR", color: "#f59e0b", name: "Chitty Received" },
    { key: "chittyPendingPercent", label: "CP", color: "#ec4899", name: "Chitty Pending" }
  ], "No chitty growth data available", { valueSuffix: "%" });
  drawSeriesChart(loanGrowthChart, safeRows, [
    { key: "loanAmountPercent", label: "LA", color: "#dc2626", name: "Total Loan Amount" },
    { key: "loanPaidPercent", label: "LP", color: "#9333ea", name: "Total Loan Paid" }
  ], "No loan growth data available", { valueSuffix: "%" });
  drawSeriesChart(tradingGrowthChart, safeRows, [
    { key: "tradingInvestedPercent", label: "TI", color: "#f59e0b", neutralColor: "#f59e0b", name: "Trading Invested" },
    { key: "tradingCurrentPercent", label: "TC", color: "#16a34a", negativeColor: "#dc2626", neutralColor: "#f59e0b", name: "Trading Current" },
    { key: "tradingProfitPercent", label: "TP", color: "#16a34a", negativeColor: "#dc2626", neutralColor: "#f59e0b", name: "Trading Profit / Loss" }
  ], "No trading growth data available", { valueSuffix: "%" });
  chartSummary.textContent = safeRows.length ? `${safeRows.length} years from Dashboard sync` : "No dated records";
}

const reportThemes = {
  income: ["Family Income", "Salary"],
  expenses: ["Family Expenses"],
  savings: ["Budget"],
  assets: ["Asset", "Property"],
  liabilities: ["Liability", "Lent", "Loan"],
  farm: ["Farm"],
  business: ["Business"],
  tax: ["Tax"],
  goals: ["Goals"],
  bankcash: ["Bank & Cash"],
  insurance: ["Insurance"],
  chitty: ["Chitty"],
  trading: ["Trading"],
  marketpulse: ["Market Pulse"],
  portfolio: ["Portfolio"],
  stocks: ["Stocks"],
  mutualfunds: ["Mutual Funds"],
  health: ["Financial Health"],
  ai: ["AI Recommendations", "Notifications", "Documents", "Bills"]
};

function reportThemeFor(name = "") {
  return Object.entries(reportThemes).find(([, labels]) => labels.some((label) => name.includes(label)))?.[0] || "neutral";
}

function reportIconFor(theme) {
  return {
    income: "+", expenses: "-", savings: "S", assets: "A", liabilities: "L",
    farm: "F", business: "B", tax: "T", goals: "%", bankcash: "C", insurance: "IN",
    chitty: "CH", trading: "TR", marketpulse: "MP", portfolio: "PF", stocks: "ST",
    mutualfunds: "MF", health: "HS", ai: "AI", neutral: "R"
  }[theme] || "R";
}

const mandatoryReportGraphs = [
  ["Family Income", "income", ["Income Trend", "Income Comparison", "Monthly Income", "Yearly Income"]],
  ["Family Expenses", "expenses", ["Expense Trend", "Category-wise Expenses", "Monthly Expenses", "Expense Comparison"]],
  ["Salary", "income", ["Salary Growth", "Monthly Salary", "Yearly Salary"]],
  ["Agriculture & Farm Manager", "farm", ["Farm Income", "Farm Expense", "Farm Profit/Loss", "Seasonal Profit", "Crop Comparison"]],
  ["Business", "business", ["Revenue", "Expenses", "Profit/Loss", "Cash Flow", "Investment Growth"]],
  ["Assets & Wealth", "assets", ["Asset Value Growth", "Asset Investment", "Income/Profit from Assets"]],
  ["Lent Receivable", "liabilities", ["Lent Growth", "Outstanding Lent with Interest", "Outstanding Lent Amount", "Interest Growth"]],
  ["Loans and Property Loans", "liabilities", ["Loan Growth", "Total Loan Paid", "Total Pending Loan", "EMI Progress"]],
  ["Goals & Planning", "goals", ["Goal Progress", "Budget vs Actual", "Monthly Budget", "Goal Completion"]],
  ["Tax", "tax", ["Tax Saving", "Tax Payable", "Tax History"]],
  ["Insurance", "insurance", ["Premium Trend", "Coverage Trend"]],
  ["Family Income", "income", ["Bank Balance Trend", "Savings Growth", "EPFO Growth", "PF Balance", "Cash Flow", "Credits", "Debits"]],
  ["Business Investment", "business", ["Investment Growth", "Profit/Loss", "ROI"]],
  ["Assets & Wealth", "assets", ["Other Asset Value", "Income/Profit"]],
  ["Family Income Records", "income", ["Family Income Trend", "Pending Income"]],
  ["Agriculture & Farm Manager", "farm", ["Agriculture Income", "Farm Profit/Loss"]],
  ["Financial Health", "health", ["Financial Health Score History"]],
  ["Chitty", "chitty", ["Chitty Growth"]],
  ["Trading", "trading", ["Trading Growth"]],
  ["Portfolio", "portfolio", ["Portfolio Growth"]],
  ["Stocks", "stocks", ["Stocks Performance"]],
  ["Mutual Funds", "mutualfunds", ["Mutual Fund Performance"]],
  ["Market Pulse", "marketpulse", ["Market Pulse Trend"]]
];

function reportGraphCard([moduleName, theme, graphs, report = {}]) {
  const filteredGraphs = graphs.filter((graph) => {
    const query = reportsState.query.toLowerCase();
    return !query || `${moduleName} ${graph}`.toLowerCase().includes(query);
  });
  if (!filteredGraphs.length) return "";
  return `
    <article class="report-graph-card report-theme-${escapeHtml(theme)}">
      <header>
        <span class="panel-icon" aria-hidden="true">${escapeHtml(reportIconFor(theme))}</span>
        <div>
          <h4>${escapeHtml(moduleName)}</h4>
          <small>${Number(report.records || 0) ? `${report.records} record${Number(report.records) === 1 ? "" : "s"}` : "No records available"}</small>
        </div>
      </header>
      <div class="report-graph-list">
        ${filteredGraphs.map((graph) => `
          <span>
            <b aria-hidden="true"></b>
            ${escapeHtml(graph)}
          </span>
        `).join("")}
      </div>
    </article>
  `;
}

function reportPanel(report, index) {
  const theme = reportThemeFor(report.name);
  const isFavourite = reportsState.favourites.has(report.name);
  const isCollapsed = reportsState.collapsed.has(report.name);
  const value = report.name === "AI Recommendations" ? Number(report.value || 0).toFixed(0) : formatCurrency.format(report.value || 0);
  const comparison = index % 3 === 0 ? "↑ Increase | Compared with previous period" : index % 3 === 1 ? "↓ Decrease | Compared with previous period" : "→ No Change | Compared with previous period";
  const hasRecords = Number(report.records || 0) > 0 || Number(report.value || 0) !== 0;
  return `
    <article class="analysis-panel report-theme-${escapeHtml(theme)} ${isCollapsed ? "is-collapsed" : ""}" data-report-name="${escapeHtml(report.name)}">
      <header>
        <span class="panel-icon" aria-hidden="true">${escapeHtml(reportIconFor(theme))}</span>
        <div>
          <h3>${escapeHtml(report.name)} Analysis</h3>
          <small>${escapeHtml(report.sheet || report.route || "Derived report")}</small>
        </div>
        <button type="button" class="report-favourite ${isFavourite ? "active" : ""}" data-report-action="favourite" aria-label="Favourite ${escapeHtml(report.name)}">${isFavourite ? "★" : "☆"}</button>
        <button type="button" class="report-toggle" data-report-action="toggle" aria-label="Expand or collapse ${escapeHtml(report.name)}">${isCollapsed ? "Expand" : "Collapse"}</button>
      </header>
      <div class="analysis-body">
        <div class="analysis-filter">
          <label>Graph Type
            <select>
              <option selected>Line Graph</option>
              <option disabled>Bar Chart - admin disabled</option>
              <option disabled>Area Chart - admin disabled</option>
            </select>
          </label>
          <label>Date Period
            <select>
              <option>Day</option>
              <option>Week</option>
              <option selected>Month</option>
              <option>Quarter</option>
              <option>Year</option>
            </select>
          </label>
          <label>Compare
            <select><option selected>Previous Period</option><option>Previous Year</option><option>No Comparison</option></select>
          </label>
        </div>
        <div class="analysis-kpis">
          <div><span>KPI Value</span><strong>${escapeHtml(value)}</strong></div>
          <div><span>Records</span><strong>${escapeHtml(report.records || 0)}</strong></div>
          <div><span>Status</span><strong>${dashboardStatus(report.value < 0 ? "At Risk" : "On Track", report.value < 0 ? "negative" : "on-track")}</strong></div>
        </div>
        ${hasRecords
          ? `<div class="analysis-graph" aria-label="${escapeHtml(report.name)} line graph area">
              <span></span><span></span><span></span><span></span>
              <strong>Line Graph</strong>
            </div>`
          : `<div class="module-empty">No records available</div>`}
        <div class="analysis-comparison">${escapeHtml(comparison)}</div>
        <div class="analysis-actions">
          <a href="#${escapeHtml(report.route || "growth")}" data-route="${escapeHtml(report.route || "growth")}">Open Drill Down</a>
          <button type="button" data-report-action="export">Export</button>
          <button type="button" data-report-action="fullscreen">Full Screen</button>
        </div>
      </div>
    </article>
  `;
}

function filteredReports(reports) {
  const query = reportsState.query.toLowerCase();
  return reports.filter((report) => {
    const theme = reportThemeFor(report.name);
    const matchesTab = reportsState.tab === "all" || (reportsState.tab === "favourites" ? reportsState.favourites.has(report.name) : theme === reportsState.tab);
    const matchesModule = reportsState.module === "all" || theme === reportsState.module;
    const matchesQuery = !query || `${report.name} ${report.sheet || ""}`.toLowerCase().includes(query);
    return matchesTab && matchesModule && matchesQuery;
  });
}

function renderReportsAnalytics(data) {
  if (!reportsContent) return;
  const reports = data.reports || [];
  const visibleReports = filteredReports(reports).filter((report) => !/net worth/i.test(report.name || ""));
  const analyticsGroups = [
    ["Income Analysis", "income", ["Income by Day", "Income by Week", "Income by Month", "Income by Quarter", "Income by Year"]],
    ["Expense Analysis", "expenses", ["Expense by Day", "Expense by Week", "Expense by Month", "Expense by Quarter", "Expense by Year"]],
    ["Savings Analysis", "savings", ["Savings Rate", "Bank Cash Trend", "EPFO Growth", "Monthly Contribution"]],
    ["Investment Analysis", "trading", ["Portfolio Value", "Investment Profit/Loss", "Stocks", "Mutual Funds"]],
    ["Debt Analysis", "liabilities", ["Amount Lent", "Amount Recovered", "Outstanding Lent with Interest"]],
    ["Chitty Analysis", "chitty", ["Chitty Paid", "Chitty Received", "Pending Chitty"]],
    ["Cash Flow", "bankcash", ["Credits", "Debits", "Net Cash Flow"]],
    ["Category Spending", "expenses", ["Family", "Children", "Insurance", "Bills", "Maintenance"]],
    ["Goal Progress", "goals", ["Goal Amount", "Saved Amount", "Remaining Amount"]],
    ["Forecast Analysis", "ai", ["Income Forecast", "Expense Forecast", "Savings Forecast", "Loan Forecast"]]
  ].filter((group) => reportsState.module === "all" || reportsState.module === group[1])
    .filter((group) => !reportsState.query || group.join(" ").toLowerCase().includes(reportsState.query.toLowerCase()));
  const recommendations = (data.recommendations || []).slice(0, 5);
  const reportTabs = ["all", "favourites", "income", "expenses", "savings", "liabilities", "goals", "bankcash", "chitty", "trading", "ai"];
  reportsContent.innerHTML = `
    <section class="reports-section reports-control-section">
      <div class="reports-control-header">
        <h3>Reports & Analytics Controls</h3>
        <span>${visibleReports.length} of ${reports.length} panels</span>
      </div>
      <div class="reports-tabs" role="tablist" aria-label="Report categories">
        ${reportTabs.map((tab) => `
          <button type="button" class="${reportsState.tab === tab ? "active" : ""}" data-report-tab="${escapeHtml(tab)}">${escapeHtml(tab === "bankcash" ? "Cash Flow" : tab === "liabilities" ? "Debt" : tab === "ai" ? "Forecast" : tab)}</button>
        `).join("")}
      </div>
      <div class="reports-filterbar">
        <label>Module
          <select id="reportsModuleFilter">
            ${["all", "income", "expenses", "savings", "liabilities", "goals", "bankcash", "chitty", "trading", "ai"].map((theme) => `
              <option value="${escapeHtml(theme)}" ${reportsState.module === theme ? "selected" : ""}>${escapeHtml(theme === "all" ? "All Modules" : theme)}</option>
            `).join("")}
          </select>
        </label>
        <label>Search
          <input id="reportsSearch" type="search" value="${escapeHtml(reportsState.query)}" placeholder="Search reports">
        </label>
        <button type="button" data-report-action="expand-all">Expand All</button>
        <button type="button" data-report-action="collapse-all">Collapse All</button>
      </div>
    </section>
    <section class="reports-section">
      <h3>Analytical Graphs</h3>
      <div class="report-graph-grid">${analyticsGroups.map(reportGraphCard).join("") || '<div class="module-empty">No matching analytical graphs.</div>'}</div>
    </section>
    <section class="reports-section">
      <h3>Analytical Panels</h3>
      <div class="analysis-grid">${visibleReports.map(reportPanel).join("") || '<div class="module-empty">No matching reports.</div>'}</div>
    </section>
    <section class="reports-section">
      <h3>AI Recommendation Analysis</h3>
      <div class="recommendation-grid">${recommendations.map(recommendationCard).join("")}</div>
    </section>
  `;
}

async function loadGrowth() {
  const [growthResponse, reportsResponse] = await Promise.all([
    apiFetch("/api/yearly-growth"),
    apiFetch("/api/reports-analytics")
  ]);
  const rows = await growthResponse.json();
  const reports = await reportsResponse.json();
  reportsAnalyticsData = reports;
  renderReportsAnalytics(reports);
  enhanceChartToolbars(chartPanel);
  drawGrowthChart(rows);
}

async function loadSummary() {
  const response = await apiFetch("/api/family-dashboard");
  const data = await response.json();
  renderSummary(data);
  updateDashboardNotifications(data);
}

async function loadNetWorth() {
  const [netWorthResponse, reportsResponse, yearlyResponse] = await Promise.all([
    apiFetch("/api/net-worth"),
    apiFetch("/api/reports-analytics"),
    apiFetch("/api/yearly-growth")
  ]);
  const data = await netWorthResponse.json();
  const reports = await reportsResponse.json();
  const yearlyRows = await yearlyResponse.json();
  renderNetWorth(data, reports, yearlyRows);
}

function readNotificationState() {
  try {
    return new Set(JSON.parse(localStorage.getItem(notificationReadStorageKey) || "[]"));
  } catch {
    return new Set();
  }
}

function saveNotificationState(readIds) {
  localStorage.setItem(notificationReadStorageKey, JSON.stringify([...readIds]));
}

function notificationItem(id, title, message, route = "summary", priority = "On Track") {
  return { id, title, message, route, priority, createdAt: new Date().toLocaleString() };
}

function updateDashboardNotifications(data = {}) {
  const sections = data.sections || {};
  const recommendations = data.recommendations || [];
  const items = [];
  const pendingLoan = Number(sections.payables?.totalPendingLoan ?? sections.liabilities?.pendingLoan ?? 0);
  const pendingChitty = Number(sections.investments?.pendingChitty ?? 0);
  const pendingGoals = Number(sections.goals?.remainingAmount ?? 0);
  if (pendingLoan > 0) items.push(notificationItem("loan-pending", "Loans and Property Loans", `${formatMoney.format(pendingLoan)} pending loan balance.`, "loan", "Pending"));
  if (pendingChitty > 0) items.push(notificationItem("chitty-pending", "Chitty Reminder", `${formatMoney.format(pendingChitty)} pending chitty value.`, "chitty", "Pending"));
  if (pendingGoals > 0) items.push(notificationItem("goal-remaining", "Goal Deadline Review", `${formatMoney.format(pendingGoals)} remaining across goals.`, "goals-planning", "On Track"));
  recommendations.forEach((item, index) => items.push(notificationItem(`recommendation-${index}-${item.title}`, item.title || "Financial Alert", item.detail || "Review this financial alert.", item.route || "summary", item.priority || "On Track")));
  dashboardNotifications = items;
  renderNotifications();
}

function renderNotifications() {
  if (!notificationList || !notificationCount) return;
  const readIds = readNotificationState();
  const unread = dashboardNotifications.filter((item) => !readIds.has(item.id));
  notificationCount.textContent = String(unread.length);
  notificationCount.hidden = !unread.length;
  notificationList.innerHTML = dashboardNotifications.length
    ? dashboardNotifications.map((item) => {
      const isRead = readIds.has(item.id);
      return `
        <article class="notification-item ${isRead ? "is-read" : "is-unread"}">
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.message)}</p>
            <small>${escapeHtml(item.createdAt)} | ${escapeHtml(item.priority)}</small>
          </div>
          <div class="notification-actions">
            <button type="button" data-notification-action="read" data-id="${escapeHtml(item.id)}">Mark as Read</button>
            <a href="#${escapeHtml(item.route)}" data-route="${escapeHtml(item.route)}">View Details</a>
            <button type="button" data-notification-action="clear" data-id="${escapeHtml(item.id)}">Clear</button>
          </div>
        </article>
      `;
    }).join("")
    : '<div class="module-empty">No notifications.</div>';
}

async function loadSuggestions() {
  const response = await apiFetch("/api/party-suggestions");
  suggestions = await response.json();
  updatePartySuggestions();
}

async function loadProperties() {
  const response = await apiFetch("/api/properties");
  allProperties = await response.json();
  renderProperties();
  renderTable();
}

async function loadLoans() {
  const response = await apiFetch("/api/loans");
  allLoans = await response.json();
  renderTable();
}

async function loadTrading() {
  const response = await apiFetch("/api/trading");
  allTrading = await response.json();
  renderTrading();
  renderTable();
}

async function refreshTradingDependentTiles() {
  if (tradingTileRefreshInProgress) return;
  tradingTileRefreshInProgress = true;
  try {
    await Promise.all([
      loadTrading(),
      loadSummary(),
      loadGrowth()
    ]);
    renderTable();
    if (currentPage === "trading") renderTradingSheetFields();
  } finally {
    tradingTileRefreshInProgress = false;
  }
}

function renderUpstoxStatus(data) {
  const localToken = localStorage.getItem(upstoxAccessTokenStorageKey);
  const broker = tradingBrokerInput?.value || data.broker || "Upstox";
  upstoxAccessTokenInput.placeholder = data.hasToken
    ? "Token saved"
    : localToken
      ? "Saved in this browser"
      : `Paste ${broker} access token`;
  const parts = [
    data.hasToken
      ? "Token saved"
      : localToken
        ? "Token saved in this browser only"
        : "Token not saved"
  ];
  parts.unshift(`Broker: ${broker}`);
  if (broker !== "Upstox") parts.push(`${broker} adapter is prepared; live sync currently uses the Upstox API until provider credentials are configured.`);
  if (data.source) parts.push(`Source: ${data.source}`);
  if (data.lastUpstoxSync) parts.push(`Last sync: ${new Date(data.lastUpstoxSync).toLocaleString()}`);
  if (data.portfolioRecords !== undefined) parts.push(`${data.portfolioRecords} portfolio rows`);
  if (data.tradeRecords !== undefined) parts.push(`${data.tradeRecords} trade rows`);
  if (data.lastUpstoxSyncError) parts.push(`Error: ${data.lastUpstoxSyncError}`);
  upstoxStatus.textContent = parts.join(" | ");
  if (tradingLastSync) {
    tradingLastSync.textContent = data.lastSuccessfulUpstoxSync
      ? `Last successful sync: ${new Date(data.lastSuccessfulUpstoxSync).toLocaleString()}`
      : `Auto-sync every ${data.nextAutoSyncSeconds || 60}s`;
  }
}

async function saveUpstoxTokenToServer(token, { rememberLocal = true } = {}) {
  const trimmedToken = String(token || "").trim();
  const broker = tradingBrokerInput?.value || "Upstox";
  if (!trimmedToken) throw new Error(`Enter a ${broker} trading access token.`);
  if (broker !== "Upstox") throw new Error(`${broker} token storage is ready in the UI, but live broker sync is not enabled on this server yet.`);
  const response = await apiFetch("/api/upstox/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ upstoxAccessToken: trimmedToken, broker })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to save Upstox token.");
  if (rememberLocal) localStorage.setItem(upstoxAccessTokenStorageKey, trimmedToken);
  return data;
}

async function ensureUpstoxTokenOnServer(statusData = null) {
  const data = statusData || await (await apiFetch("/api/upstox/status")).json();
  if (data.hasToken) return data;
  const localToken = localStorage.getItem(upstoxAccessTokenStorageKey);
  if (!localToken || restoringUpstoxToken) return data;
  restoringUpstoxToken = true;
  try {
    upstoxStatus.textContent = "Restoring trading token from this browser...";
    await saveUpstoxTokenToServer(localToken, { rememberLocal: false });
    return { ...data, hasToken: true, source: "browser restored" };
  } finally {
    restoringUpstoxToken = false;
  }
}

async function loadUpstoxStatus({ refreshOnTradingChange = true } = {}) {
  const response = await apiFetch("/api/upstox/status");
  const data = await response.json();
  const finalData = await ensureUpstoxTokenOnServer(data);
  renderUpstoxStatus(finalData);
  const currentSuccessfulSync = finalData.lastSuccessfulUpstoxSync || "";
  if (currentSuccessfulSync) {
    const previousSuccessfulSync = lastSuccessfulUpstoxSyncSeen;
    lastSuccessfulUpstoxSyncSeen = currentSuccessfulSync;
    if (
      refreshOnTradingChange &&
      previousSuccessfulSync &&
      currentSuccessfulSync !== previousSuccessfulSync
    ) {
      await refreshTradingDependentTiles();
    }
  }
}

async function syncUpstoxPortfolio() {
  const broker = tradingBrokerInput?.value || "Upstox";
  if (broker !== "Upstox") throw new Error(`${broker} live sync is prepared but not enabled on this server yet.`);
  upstoxStatus.textContent = "Syncing trading portfolio...";
  syncUpstoxButton.disabled = true;

  try {
    await ensureUpstoxTokenOnServer();
    const response = await apiFetch("/api/upstox/sync", { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to sync Upstox.");
    await refreshTradingDependentTiles();
    await loadUpstoxStatus({ refreshOnTradingChange: false });
    await loadDriveStatus();
    return data;
  } finally {
    syncUpstoxButton.disabled = false;
  }
}

async function saveTradingInvestedDate(button) {
  const editor = button.closest(".trading-date-editor");
  const input = editor?.querySelector("input[type='date']");
  const id = button.dataset.id;
  if (!id || !input) return;

  button.disabled = true;
  upstoxStatus.textContent = "Saving invested date...";
  try {
    const response = await apiFetch(`/api/trading/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ investedDate: input.value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to save invested date.");
    await refreshTradingDependentTiles();
    await loadDriveStatus();
    upstoxStatus.textContent = data.queued
      ? "Invested date saved. Excel update is queued."
      : "Invested date saved and synced.";
  } catch (error) {
    upstoxStatus.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

async function loadEntries({ includeDerived = true } = {}) {
  const response = await apiFetch(`/api/entries?t=${Date.now()}`);
  allEntries = await response.json();
  if (includeDerived) {
    await loadSummary();
    await loadSuggestions();
  }
  renderTable();
  if (includeDerived) await loadGrowth();
}

async function refreshAllData({ quiet = false } = {}) {
  if (refreshInProgress) return;
  refreshInProgress = true;
  try {
    await loadWorkbookStatus();
    await loadEntries();
    await loadProperties();
    await loadLoans();
    await loadTrading();
    await loadUpstoxStatus();
    renderSheetColumnFields();
    if (currentPage === "trading") renderTradingSheetFields();
    if (currentPage === "growth") await loadGrowth();
    if (currentPage === "settings-sync") await loadSecuritySettings();
    if (masterModuleBlueprints[currentPage] && !moduleState.editing) await loadModulePage(currentPage);
    if (!quiet) message.textContent = "Synced from Excel.";
  } catch (error) {
    if (!quiet) {
      message.textContent = error.message || "Could not sync from Excel.";
      message.style.color = "#b42318";
    }
  } finally {
    refreshInProgress = false;
  }
}

async function refreshVisibleData({ quiet = true } = {}) {
  if (refreshInProgress || userIsEditing()) return;
  refreshInProgress = true;
  try {
    if (currentPage === "home") return;
    if (currentPage === "summary") {
      await loadSummary();
      return;
    }
    if (currentPage === "net-worth") {
      await loadNetWorth();
      return;
    }
    if (currentPage === "growth") {
      await loadGrowth();
      return;
    }
    if (currentPage === "settings-sync") {
      await Promise.all([
        loadWorkbookStatus(),
        loadDriveStatus(),
        loadSyncMonitoring(),
        loadSecuritySettings()
      ]);
      return;
    }
    if (["debt", "chitty"].includes(currentPage)) {
      await loadEntries({ includeDerived: false });
      renderSheetColumnFields(true);
      return;
    }
    if (currentPage === "loan") {
      await Promise.all([loadEntries({ includeDerived: false }), loadLoans()]);
      renderSheetColumnFields(true);
      return;
    }
    if (currentPage === "property") {
      await loadProperties();
      return;
    }
    if (currentPage === "trading") {
      await Promise.all([loadTrading(), loadUpstoxStatus({ refreshOnTradingChange: false })]);
      renderTradingSheetFields();
      return;
    }
    if (currentPage === "entries") {
      await Promise.all([loadEntries({ includeDerived: false }), loadProperties(), loadLoans(), loadTrading()]);
      return;
    }
    if (masterModuleBlueprints[currentPage] && !moduleState.editing) {
      await loadModulePage(currentPage);
    }
  } catch (error) {
    if (!quiet) {
      message.textContent = error.message || "Could not refresh current view.";
      message.style.color = "#b42318";
    }
  } finally {
    refreshInProgress = false;
  }
}

function scheduleBackgroundRefresh(reason = "background refresh", delay = backgroundRefreshDebounceMs) {
  if (backgroundRefreshTimer) clearTimeout(backgroundRefreshTimer);
  backgroundRefreshTimer = setTimeout(async () => {
    backgroundRefreshTimer = null;
    if (!readAuthCredentials()) return;
    if (userIsEditing()) {
      scheduleBackgroundRefresh(reason, 3000);
      return;
    }
    await refreshVisibleData({ quiet: true });
  }, delay);
}

async function loadWorkbookStatus() {
  const response = await apiFetch("/api/workbook");
  const data = await response.json();
  setInputValueWhenIdle(workbookPathInput, data.workbookPath || "");
  if (syncStatus) syncStatus.textContent = `${data.syncMode}: ${data.workbookPath}`;
}

function renderSyncMonitoring(data) {
  if (!syncMonitoringGrid || !syncMonitoringStatus) return;
  syncMonitoringStatus.textContent = `Last successful sync: ${data.lastSuccessfulSync ? new Date(data.lastSuccessfulSync).toLocaleString() : "Not synced"}${data.errorDetails ? ` | Error: ${data.errorDetails}` : ""}`;
  const rows = [
    ["Webpage status", data.webpageStatus],
    ["Local Excel status", data.localExcelStatus],
    ["Google Drive status", data.googleDriveStatus],
    ["Pending changes", data.pendingChanges],
    ["Failed changes", data.failedChanges],
    ["Conflict count", data.conflictCount],
    ["Workbook modified", data.workbookModified ? new Date(data.workbookModified).toLocaleString() : ""],
    ["Error details", data.errorDetails || "None"]
  ];
  syncMonitoringGrid.innerHTML = rows.map(([label, value]) => `
    <div class="sync-monitoring-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value ?? "")}</strong>
    </div>
  `).join("");
}

async function loadSyncMonitoring() {
  const response = await apiFetch("/api/sync-monitoring");
  const data = await response.json();
  renderSyncMonitoring(data);
}

function renderOtpDeliveryStatus(data) {
  if (!otpDeliveryGrid || !otpDeliveryStatus) return;
  otpDeliveryStatus.textContent = `${authPublicStatus.otpEnabled ? "OTP enabled" : "OTP disabled"} | Email: ${data.email?.status || "Unknown"} | SMS: ${data.sms?.status || "Unknown"}${data.lastDeliveryFailure ? ` | Last failure: ${new Date(data.lastDeliveryFailure).toLocaleString()}` : ""}`;
  if (testEmailOtpButton) testEmailOtpButton.disabled = !authPublicStatus.otpEnabled;
  if (testSmsOtpButton) testSmsOtpButton.disabled = !authPublicStatus.otpEnabled;
  const rows = [
    ["Administrator email", data.administrator?.email || ""],
    ["Administrator mobile", data.administrator?.mobile || ""],
    ["Role", data.administrator?.role || "Administrator"],
    ["Email provider status", data.email?.status || "Unknown"],
    ["Email channel enabled", data.email?.enabled ? "Enabled" : "Disabled"],
    ["SMS provider status", data.sms?.status || "Unknown"],
    ["SMS channel enabled", data.sms?.enabled ? "Enabled" : "Disabled"],
    ["Sender email/name", [data.email?.senderEmail, data.email?.senderName].filter(Boolean).join(" / ") || "Not configured"],
    ["Last successful delivery", data.lastSuccessfulDelivery ? `${new Date(data.lastSuccessfulDelivery).toLocaleString()} (${data.lastSuccessfulChannel || ""})` : "None"],
    ["Last delivery failure", data.lastDeliveryFailure ? `${new Date(data.lastDeliveryFailure).toLocaleString()} (${data.lastFailureChannel || ""})` : "None"],
    ["Masked error details", data.maskedErrorDetails || "None"]
  ];
  otpDeliveryGrid.innerHTML = rows.map(([label, value]) => `
    <div class="sync-monitoring-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value ?? "")}</strong>
    </div>
  `).join("");
}

async function loadOtpDeliveryStatus() {
  const response = await apiFetch("/api/otp-delivery/status");
  const data = await response.json();
  renderOtpDeliveryStatus(data);
}

function renderSecuritySettings(data = {}) {
  const requested = new Set((data.requestedMethods || []).map((method) => method.type));
  const usable = new Set((data.usableMethods || []).map((method) => method.type));
  if (enableMpinAuthInput) enableMpinAuthInput.checked = requested.has("mpin") || usable.has("mpin");
  if (enableFingerprintAuthInput) enableFingerprintAuthInput.checked = requested.has("fingerprint") || usable.has("fingerprint");
  if (enableFaceAuthInput) enableFaceAuthInput.checked = requested.has("face") || usable.has("face");
  if (securitySettingsStatus) {
    const usableText = (data.usableMethods || []).map((method) => method.label).join(", ") || "Password only";
    const mpinText = data.mpinConfigured ? "MPIN configured" : "MPIN not configured";
    securitySettingsStatus.style.color = "#475467";
    securitySettingsStatus.textContent = `Login prompt will show: ${usableText}. ${mpinText}.`;
  }
}

async function loadSecuritySettings() {
  if (!securitySettingsForm) return;
  const response = await apiFetch("/api/security-settings");
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not load security settings.");
  renderSecuritySettings(data);
}

async function sendLoginOtp(channel, button = null, resend = false) {
  if (!activeLoginChallengeId) return;
  if (button) button.disabled = true;
  authMessage.style.color = "#475467";
  authMessage.textContent = resend ? "Resending OTP..." : "Sending OTP...";
  try {
    const response = await publicApiJson(resend ? "/api/auth/login/resend" : "/api/auth/login/send-otp", {
      challengeId: activeLoginChallengeId,
      channel
    });
    activeLoginOtpChannel = channel;
    if (loginOtpHint) {
      loginOtpHint.textContent = `${response.deliveryMessage || "OTP sent."} Destination: ${response.maskedDestination}. It expires at ${new Date(response.otpExpiresAt).toLocaleTimeString()}.`;
    }
    authMessage.style.color = "#146c43";
    authMessage.textContent = "Enter the OTP to complete sign in.";
    loginOtpInput.disabled = false;
    verifyLoginOtpButton.disabled = false;
    resendLoginOtpButton.disabled = false;
    loginOtpInput?.focus();
  } catch (error) {
    authMessage.style.color = "#b42318";
    authMessage.textContent = error.message || "OTP service is temporarily unavailable. Please try again later or contact the administrator.";
  } finally {
    if (button) button.disabled = false;
  }
}

async function testOtpDelivery(channel, button) {
  if (button) button.disabled = true;
  if (otpDeliveryStatus) otpDeliveryStatus.textContent = `Sending test ${channel.toUpperCase()} OTP...`;
  try {
    const response = await apiFetch("/api/otp-delivery/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to send test OTP.");
    renderOtpDeliveryStatus(data.status);
    otpDeliveryStatus.textContent = `Test OTP sent to ${data.maskedDestination}.`;
  } catch (error) {
    otpDeliveryStatus.textContent = error.message || "Unable to send test OTP.";
    await loadOtpDeliveryStatus().catch(() => {});
  } finally {
    if (button) button.disabled = false;
  }
}

function renderDriveStatus(data) {
  currentDriveStatus = data || {};
  const parts = [
    `Folder: ${data.folderId}`,
    data.gmailAddress ? `Gmail: ${data.gmailAddress}` : "Gmail not saved",
    data.hasCredentials && data.hasValidClientId ? "Google sign-in configured" : "Google sign-in needs server setup",
    data.isAuthenticated ? "Gmail connected" : "Gmail not connected"
  ];
  if (data.lastDriveSync) parts.push(`Last upload: ${new Date(data.lastDriveSync).toLocaleString()}`);
  if (data.lastLocalSync) parts.push(`Last local sync: ${new Date(data.lastLocalSync).toLocaleString()}`);
  if (data.lastSyncSource) parts.push(`Source: ${data.lastSyncSource}`);
  if (data.lastDriveSyncError) parts.push(`Error: ${data.lastDriveSyncError}`);
  if (data.lastSyncError) parts.push(`Sync error: ${data.lastSyncError}`);
  driveStatus.textContent = parts.join(" | ");
  if (driveSetupHint) {
    if (!data.hasCredentials || !data.hasValidClientId) {
      driveSetupHint.innerHTML = `
        Google Drive sync needs a private Google OAuth Client ID and Client Secret saved here.
        Use Authorized Redirect URI <code>${escapeHtml(data.redirectUri || "")}</code> in Google Cloud, then click Save Drive Setup and Connect Gmail.
        The app will not ask for your Gmail password.
      `;
    } else if (!data.isAuthenticated) {
      driveSetupHint.innerHTML = `
        Google credentials are saved. Click <strong>Connect Gmail</strong> and approve Drive access for the configured Gmail account.
        Redirect URL: <code>${escapeHtml(data.redirectUri || "")}</code>.
      `;
    } else {
      driveSetupHint.textContent = "Google Drive is connected. The local workbook, Google Drive Excel file, and webpage can sync automatically.";
    }
  }
  if (googleRedirectUriInput) googleRedirectUriInput.value = data.redirectUri || "";
  gmailAddressInput.value = data.gmailAddress || "";
  googleClientIdInput.placeholder = data.hasCredentials ? "Saved on server" : "...apps.googleusercontent.com";
  googleClientSecretInput.placeholder = data.hasCredentials ? "OAuth Client Secret configured" : "OAuth client secret";
}

async function loadDriveStatus() {
  const response = await apiFetch("/api/google-drive");
  const data = await response.json();
  renderDriveStatus(data);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  const button = form.querySelector("button");
  button.disabled = true;

  const payload = Object.fromEntries(new FormData(form).entries());

  try {
    const isLoan = payload.type === "loan";
    const isMonthEntry = payload.type === "month_entry";
    const monthTarget = payload.monthEntryTarget || "chitty";
    const normalizedParty = String(payload.party || "").trim().toLowerCase();
    const chittyTarget = allEntries.find((entry) => entry.type === "chitty_summary" && String(entry.party || "").trim().toLowerCase() === normalizedParty);
    const loanTarget = allLoans.find((loan) => String(loan.borrowedFrom || "").trim().toLowerCase() === normalizedParty);
    const loanPayload = {
      notes: payload.notes,
      borrowedFrom: payload.party,
      typeOfFund: payload.typeOfFund,
      borrowedDate: payload.date,
      clearedDate: payload.clearedDate,
      principal: payload.amount,
      interestPercentage: payload.interestPercentage,
      emi: payload.emi,
      tenureMonths: payload.tenureMonths,
      finishedMonths: payload.finishedMonths,
      loanPaid: payload.loanPaid,
      firstEmi: payload.firstEmi
    };
    if (isMonthEntry && monthTarget === "chitty" && !chittyTarget && !editingEntryId) {
      throw new Error("Choose an existing Chitty / Group for Month Entry.");
    }
    if (isMonthEntry && monthTarget === "loan" && !loanTarget) {
      throw new Error("Choose an existing Loan for Month Entry.");
    }
    const endpoint = isMonthEntry
      ? (monthTarget === "loan"
        ? `/api/loans/${encodeURIComponent(loanTarget.id)}/month-entry`
        : `/api/entries/${encodeURIComponent(editingEntryId || chittyTarget.id)}`)
      : isLoan
      ? (editingLoanId ? `/api/loans/${encodeURIComponent(editingLoanId)}` : "/api/loans")
      : (editingEntryId ? `/api/entries/${encodeURIComponent(editingEntryId)}` : "/api/entries");
    const response = await apiFetch(endpoint, {
      method: isMonthEntry ? (monthTarget === "loan" ? "POST" : "PUT") : isLoan ? (editingLoanId ? "PUT" : "POST") : (editingEntryId ? "PUT" : "POST"),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isLoan ? loanPayload : payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to save this entry.");

    resetEntryForm();
    message.textContent = data.driveSynced ? "Saved to Excel and uploaded to Google Drive." : "Saved to Excel.";
    if (isLoan || (isMonthEntry && monthTarget === "loan")) await loadLoans();
    await loadEntries();
    await loadDriveStatus();
  } catch (error) {
    message.textContent = error.message;
    message.style.color = "#b42318";
  } finally {
    button.disabled = false;
  }
});

cancelEditButton.addEventListener("click", resetEntryForm);

entriesBody.addEventListener("click", async (event) => {
  const openButton = event.target.closest(".open-entry");
  if (openButton) {
    routeTo(openButton.dataset.route || "entries");
    return;
  }

  const editButton = event.target.closest(".edit-entry");
  const deleteButton = event.target.closest(".delete-entry");
  const id = editButton?.dataset.id || deleteButton?.dataset.id;
  if (!id) return;

  const entry = combinedEntries().find((record) => String(record.id) === String(id));
  if (!entry) return;

  if (editButton) {
    routeTo(routeForEntry(entry));
    populateEntryForm(entry);
    return;
  }

  if (!window.confirm(`Delete ${labels[entry.type] || entry.type} for ${entry.party}?`)) return;
  message.textContent = "Deleting entry from Excel...";
  deleteButton.disabled = true;

  try {
    const response = await apiFetch(entry.type === "loan" ? `/api/loans/${encodeURIComponent(id)}` : `/api/entries/${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to delete this entry.");

    if (editingEntryId === id) resetEntryForm();
    if (editingLoanId === id) resetEntryForm();
    message.style.color = "#146c43";
    message.textContent = data.driveSynced ? "Deleted from Excel and uploaded to Google Drive." : "Deleted from Excel.";
    if (entry.type === "loan") await loadLoans();
    await loadEntries();
    await loadDriveStatus();
  } catch (error) {
    message.textContent = error.message;
    message.style.color = "#b42318";
  } finally {
    deleteButton.disabled = false;
  }
});

propertyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  propertyMessage.textContent = "";
  const button = propertyForm.querySelector("button");
  button.disabled = true;

  try {
    const payload = Object.fromEntries(new FormData(propertyForm).entries());
    const response = await apiFetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to save this property.");

    propertyForm.reset();
    propertyMessage.style.color = "#146c43";
    propertyMessage.textContent = data.driveSynced ? "Property saved and uploaded to Google Drive." : "Property saved to Excel.";
    await loadProperties();
    await loadDriveStatus();
  } catch (error) {
    propertyMessage.textContent = error.message;
    propertyMessage.style.color = "#b42318";
  } finally {
    button.disabled = false;
  }
});

serverForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = serverForm.querySelector("button");
  button.disabled = true;
  serverStatus.textContent = "Checking Smart Fin 365 server...";

  const nextUrl = normalizeServerUrl(serverUrlInput.value);
  serverBaseUrl = nextUrl === window.location.origin ? "" : nextUrl;
  if (serverBaseUrl) {
    localStorage.setItem(serverUrlStorageKey, serverBaseUrl);
  } else {
    localStorage.removeItem(serverUrlStorageKey);
  }

  try {
    await checkServerConnection();
    message.style.color = "#146c43";
    message.textContent = "Server URL saved.";
    await refreshAllData({ quiet: true });
  } catch (error) {
    message.style.color = "#b42318";
    message.textContent = "Server URL saved, but the app cannot reach it yet.";
  } finally {
    button.disabled = false;
  }
});

securitySettingsForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = securitySettingsForm.querySelector("button");
  const methods = [
    enableMpinAuthInput?.checked ? { type: "mpin", enabled: true } : null,
    enableFingerprintAuthInput?.checked ? { type: "fingerprint", enabled: true } : null,
    enableFaceAuthInput?.checked ? { type: "face", enabled: true } : null
  ].filter(Boolean);
  button.disabled = true;
  securitySettingsStatus.style.color = "#475467";
  securitySettingsStatus.textContent = "Saving authentication methods...";
  try {
    const response = await apiFetch("/api/security-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        methods,
        newMpin: newMpinInput?.value || "",
        confirmMpin: confirmMpinInput?.value || ""
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to save authentication methods.");
    if (newMpinInput) newMpinInput.value = "";
    if (confirmMpinInput) confirmMpinInput.value = "";
    renderSecuritySettings(data);
    securitySettingsStatus.style.color = "#146c43";
  } catch (error) {
    securitySettingsStatus.style.color = "#b42318";
    securitySettingsStatus.textContent = error.message || "Unable to save authentication methods.";
  } finally {
    button.disabled = false;
  }
});

syncForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (syncStatus) syncStatus.textContent = "Updating workbook location...";
  const button = syncForm.querySelector("button");
  button.disabled = true;

  try {
    const response = await apiFetch("/api/workbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workbookPath: workbookPathInput.value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to update workbook location.");

    if (syncStatus) syncStatus.textContent = `${data.syncMode}: ${data.workbookPath}`;
    message.style.color = "#146c43";
    message.textContent = "Workbook location updated.";
    await refreshAllData({ quiet: true });
  } catch (error) {
    if (syncStatus) syncStatus.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

async function runManualSyncAll(button) {
  if (button) button.disabled = true;
  if (syncMonitoringStatus) syncMonitoringStatus.textContent = "Running full sync...";
  try {
    const response = await apiFetch("/api/sync-all", { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Sync failed.");
    await refreshAllData({ quiet: true });
    await loadSyncMonitoring();
  } catch (error) {
    if (syncMonitoringStatus) syncMonitoringStatus.textContent = error.message || "Sync failed.";
  } finally {
    if (button) button.disabled = false;
  }
}

retrySyncButton?.addEventListener("click", () => runManualSyncAll(retrySyncButton));
syncAllButton?.addEventListener("click", () => runManualSyncAll(syncAllButton));
testEmailOtpButton?.addEventListener("click", () => testOtpDelivery("email", testEmailOtpButton));
testSmsOtpButton?.addEventListener("click", () => testOtpDelivery("sms", testSmsOtpButton));

searchInput.addEventListener("input", renderTable);
typeFilter.addEventListener("change", renderTable);
typeInput.addEventListener("change", () => {
  updatePartySuggestions();
  updateChittyFields();
});
monthEntryTargetInput.addEventListener("change", () => {
  form.party.value = "";
  updatePartySuggestions();
  updateChittyFields();
});
form.typeOfFund.addEventListener("input", updateChittyFields);
form.typeOfFund.addEventListener("change", updateChittyFields);
form.status.addEventListener("change", updateChittyFields);
form.amount.addEventListener("input", () => {
  if (typeInput.value === "chitty_received") form.amountReceived.value = form.amount.value;
  if (typeInput.value === "loan") updateLoanEmi();
});

function updateLoanEmi() {
  if (form.typeOfFund.value === "Hand Loan") return;
  const principal = Number(form.amount.value || 0);
  const rate = Number(form.interestPercentage.value || 0);
  if (principal && rate) form.emi.value = ((principal * (rate / 100)) / 12).toFixed(2);
}

form.interestPercentage.addEventListener("input", updateLoanEmi);

authForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = authUsernameInput.value.trim() || "admin";
  const password = authPasswordInput.value;
  authSubmitButton.disabled = true;
  authMessage.style.color = "#475467";
  authMessage.textContent = "Checking password...";

  try {
    const data = await publicApiJson("/api/auth/login", { username, password });
    if (data.requiresSecondFactorSetup) {
      activeLoginChallengeId = data.challengeId;
      activeLoginUsername = username;
      activeLoginOtpChannel = "";
      activeSecondFactorMethod = "mpin";
      activeSecondFactorSetup = true;
      if (loginOtpPanel) loginOtpPanel.hidden = false;
      if (loginOtpHint) loginOtpHint.textContent = data.deliveryMessage || "Set a 4-digit MPIN to complete secure sign in.";
      if (loginOtpChoices) loginOtpChoices.innerHTML = "";
      if (loginOtpInput) {
        loginOtpInput.value = "";
        loginOtpInput.disabled = false;
        loginOtpInput.placeholder = "Create 4-digit MPIN";
        loginOtpInput.type = "password";
      }
      if (loginConfirmMpinLabel) loginConfirmMpinLabel.hidden = false;
      if (loginConfirmMpinInput) loginConfirmMpinInput.value = "";
      verifyLoginOtpButton.textContent = "Set MPIN and Sign In";
      verifyLoginOtpButton.disabled = false;
      if (resendLoginOtpButton) resendLoginOtpButton.hidden = true;
      authUsernameInput.disabled = true;
      authPasswordInput.disabled = true;
      authSubmitButton.hidden = true;
      authMessage.style.color = "#146c43";
      authMessage.textContent = "Additional authentication setup required.";
      loginOtpInput?.focus();
      return;
    }
    if (data.requiresSecondFactor) {
      activeLoginChallengeId = data.challengeId;
      activeLoginUsername = username;
      activeLoginOtpChannel = "";
      activeSecondFactorMethod = data.secondFactorMethods?.length === 1 ? data.secondFactorMethods[0].type : "";
      activeSecondFactorSetup = false;
      if (loginOtpPanel) loginOtpPanel.hidden = false;
      if (loginOtpHint) loginOtpHint.textContent = data.deliveryMessage || "Choose one enabled authentication method to continue.";
      if (loginOtpChoices) {
        loginOtpChoices.innerHTML = (data.secondFactorMethods || []).map((option) => `
          <button type="button" data-second-factor-method="${escapeHtml(option.type)}">
            ${escapeHtml(option.label)}
          </button>
        `).join("");
      }
      if (loginOtpInput) {
        loginOtpInput.value = "";
        loginOtpInput.disabled = activeSecondFactorMethod !== "mpin";
        loginOtpInput.type = "text";
        loginOtpInput.placeholder = activeSecondFactorMethod === "mpin" ? "Enter 4-digit MPIN" : "Select a method";
      }
      if (loginConfirmMpinLabel) loginConfirmMpinLabel.hidden = true;
      verifyLoginOtpButton.textContent = "Verify and Sign In";
      verifyLoginOtpButton.disabled = activeSecondFactorMethod !== "mpin";
      if (resendLoginOtpButton) resendLoginOtpButton.hidden = true;
      authUsernameInput.disabled = true;
      authPasswordInput.disabled = true;
      authSubmitButton.hidden = true;
      authMessage.style.color = "#146c43";
      authMessage.textContent = data.deliveryMessage || "Additional authentication required.";
      if (activeSecondFactorMethod === "mpin") loginOtpInput?.focus();
      return;
    }
    if (!data.requiresOtp) {
      saveAuthSession(data);
      authUsernameInput.disabled = false;
      authPasswordInput.disabled = false;
      authSubmitButton.hidden = false;
      hideAuthGate();
      message.style.color = "#146c43";
      message.textContent = "Signed in. Syncing records...";
      await refreshAllData({ quiet: true });
      message.textContent = "Signed in and synced.";
      return;
    }
    activeLoginChallengeId = data.challengeId;
    activeLoginUsername = username;
    activeLoginOtpChannel = "";
    if (loginOtpPanel) loginOtpPanel.hidden = false;
    if (loginOtpHint) loginOtpHint.textContent = data.deliveryMessage || "Password verified. Select where to receive the OTP.";
    if (loginOtpChoices) {
      loginOtpChoices.innerHTML = (data.deliveryOptions || []).map((option) => `
        <button type="button" data-login-otp-channel="${escapeHtml(option.channel)}">
          ${escapeHtml(option.label)} (${escapeHtml(option.maskedDestination)})
        </button>
      `).join("");
    }
    loginOtpInput.value = "";
    loginOtpInput.disabled = true;
    verifyLoginOtpButton.disabled = true;
    resendLoginOtpButton.disabled = true;
    authUsernameInput.disabled = true;
    authPasswordInput.disabled = true;
    authSubmitButton.hidden = true;
    authMessage.style.color = "#146c43";
    authMessage.textContent = "Password verified. Choose SMS or email OTP.";
  } catch (error) {
    clearSensitiveScreenData();
    clearAuthCredentials(true);
    authMessage.style.color = "#b42318";
    authMessage.textContent = error.message || "Invalid username or password.";
    authPasswordInput.focus();
  } finally {
    authSubmitButton.disabled = false;
  }
});

localAdminSetupSubmit?.addEventListener("click", async () => {
  localAdminSetupSubmit.disabled = true;
  if (authMessage) {
    authMessage.style.color = "#475467";
    authMessage.textContent = "Configuring administrator access...";
  }
  try {
    const data = await publicApiJson("/api/auth/local-bootstrap", {
      newPassword: localAdminSetupPasswordInput?.value || "",
      confirmPassword: localAdminSetupConfirmPasswordInput?.value || ""
    });
    if (localAdminSetupPasswordInput) localAdminSetupPasswordInput.value = "";
    if (localAdminSetupConfirmPasswordInput) localAdminSetupConfirmPasswordInput.value = "";
    authPublicStatus = { ...authPublicStatus, loginConfigured: true, localBootstrapAvailable: false };
    setAuthMode("login", data.message || "Administrator password configured. Sign in to continue.", "#146c43");
  } catch (error) {
    if (authMessage) {
      authMessage.style.color = "#b42318";
      authMessage.textContent = error.message || "Unable to configure administrator access.";
    }
  } finally {
    localAdminSetupSubmit.disabled = false;
  }
});

authConnectServerButton?.addEventListener("click", async () => {
  const candidate = normalizeServerUrl(authServerUrlInput?.value);
  if (!candidate) {
    if (authServerStatus) {
      authServerStatus.style.color = "#b42318";
      authServerStatus.textContent = "Enter the current Smart Fin 365 server URL.";
    }
    return;
  }
  authConnectServerButton.disabled = true;
  if (authServerStatus) {
    authServerStatus.style.color = "#475467";
    authServerStatus.textContent = "Checking server connection...";
  }
  try {
    if (!await pingServerUrl(candidate)) throw new Error("The server health check did not respond.");
    const currentOrigin = normalizeServerUrl(window.location.origin);
    serverBaseUrl = candidate === currentOrigin ? "" : candidate;
    if (serverBaseUrl) localStorage.setItem(serverUrlStorageKey, serverBaseUrl);
    else localStorage.removeItem(serverUrlStorageKey);
    updateServerUi();
    await loadAuthPublicStatus();
    if (authServerStatus) {
      authServerStatus.style.color = "#146c43";
      authServerStatus.textContent = `Connected to ${candidate}.`;
    }
  } catch (error) {
    if (authServerStatus) {
      authServerStatus.style.color = "#b42318";
      authServerStatus.textContent = error.message || "Could not connect to that server.";
    }
  } finally {
    authConnectServerButton.disabled = false;
  }
});

verifyLoginOtpButton?.addEventListener("click", async () => {
  verifyLoginOtpButton.disabled = true;
  authMessage.style.color = "#475467";
  authMessage.textContent = activeSecondFactorSetup ? "Setting MPIN..." : activeSecondFactorMethod ? "Verifying authentication..." : "Verifying OTP...";
  try {
    const data = activeSecondFactorSetup
      ? await publicApiJson("/api/auth/login/setup-mpin", {
          challengeId: activeLoginChallengeId,
          newMpin: loginOtpInput.value,
          confirmMpin: loginConfirmMpinInput?.value
        })
      : activeSecondFactorMethod
      ? await publicApiJson("/api/auth/login/verify-second-factor", {
          challengeId: activeLoginChallengeId,
          method: activeSecondFactorMethod,
          code: loginOtpInput.value
        })
      : await publicApiJson("/api/auth/login/verify", {
          challengeId: activeLoginChallengeId,
          otp: loginOtpInput.value
        });
    saveAuthSession(data);
    authUsernameInput.disabled = false;
    authPasswordInput.disabled = false;
    authSubmitButton.hidden = false;
    activeSecondFactorSetup = false;
    verifyLoginOtpButton.textContent = "Verify and Sign In";
    hideAuthGate();
    message.style.color = "#146c43";
    message.textContent = "Signed in. Syncing records...";
    await refreshAllData({ quiet: true });
    message.textContent = "Signed in and synced.";
  } catch (error) {
    authMessage.style.color = "#b42318";
    authMessage.textContent = error.message || "Authentication failed.";
    loginOtpInput?.focus();
  } finally {
    verifyLoginOtpButton.disabled = false;
  }
});

resendLoginOtpButton?.addEventListener("click", async () => {
  const channel = activeLoginOtpChannel || "email";
  await sendLoginOtp(channel, resendLoginOtpButton, true);
  setTimeout(() => {
    resendLoginOtpButton.disabled = false;
  }, 30000);
});

loginOtpChoices?.addEventListener("click", async (event) => {
  const secondFactorButton = event.target.closest("[data-second-factor-method]");
  if (secondFactorButton) {
    activeSecondFactorMethod = secondFactorButton.dataset.secondFactorMethod;
    if (loginOtpHint) loginOtpHint.textContent = activeSecondFactorMethod === "mpin"
      ? "Enter your 4-digit MPIN to continue."
      : "Biometric verification requires WebAuthn setup before it can be used.";
    if (loginOtpInput) {
      loginOtpInput.value = "";
      loginOtpInput.disabled = activeSecondFactorMethod !== "mpin";
      loginOtpInput.placeholder = activeSecondFactorMethod === "mpin" ? "Enter 4-digit MPIN" : "Biometric setup required";
    }
    verifyLoginOtpButton.disabled = activeSecondFactorMethod !== "mpin";
    if (activeSecondFactorMethod === "mpin") loginOtpInput?.focus();
    return;
  }
  const button = event.target.closest("[data-login-otp-channel]");
  if (!button) return;
  await sendLoginOtp(button.dataset.loginOtpChannel, button, false);
});

changeLoginIdentifierButton?.addEventListener("click", () => {
  activeLoginChallengeId = "";
  activeLoginUsername = "";
  activeLoginOtpChannel = "";
  activeSecondFactorMethod = "";
  activeSecondFactorSetup = false;
  if (loginOtpPanel) loginOtpPanel.hidden = true;
  if (loginOtpChoices) loginOtpChoices.innerHTML = "";
  if (loginOtpInput) loginOtpInput.value = "";
  if (loginConfirmMpinInput) loginConfirmMpinInput.value = "";
  if (loginConfirmMpinLabel) loginConfirmMpinLabel.hidden = true;
  verifyLoginOtpButton.textContent = "Verify and Sign In";
  authUsernameInput.disabled = false;
  authPasswordInput.disabled = false;
  authSubmitButton.hidden = false;
  authSubmitButton.disabled = false;
  authPasswordInput.value = "";
  authMessage.textContent = "Enter your email or mobile number and password.";
  authUsernameInput.focus();
});

mobileMenuButton?.addEventListener("click", () => {
  const open = !appHeader?.classList.contains("nav-open");
  appHeader?.classList.toggle("nav-open", open);
  mobileMenuButton.setAttribute("aria-expanded", String(open));
});

appNav?.addEventListener("click", () => {
  appHeader?.classList.remove("nav-open");
  mobileMenuButton?.setAttribute("aria-expanded", "false");
});

openSignupButton?.addEventListener("click", () => setAuthMode("signup"));
openLoginButton?.addEventListener("click", () => setAuthMode("login", "Enter your email or mobile number and password.", "#475467"));
headerLoginButton?.addEventListener("click", () => showAuthGate("Sign in to continue.", "", "login"));
headerSignupButton?.addEventListener("click", () => showAuthGate("", "", "signup"));
headerProfileButton?.addEventListener("click", () => {
  window.location.hash = "#home";
});
headerLogoutButton?.addEventListener("click", () => expireAuthSession(readStoredAuthCredentials()?.username || "", "Logged out. Enter your password to continue."));

createAccountButton?.addEventListener("click", async () => {
  createAccountButton.disabled = true;
  if (authMessage) {
    authMessage.style.color = "#475467";
    authMessage.textContent = "Creating account...";
  }
  try {
    const data = await publicApiJson("/api/auth/register", {
      fullName: signupFullNameInput?.value,
      email: signupEmailInput?.value,
      mobile: signupMobileInput?.value,
      password: signupPasswordInput?.value,
      confirmPassword: signupConfirmPasswordInput?.value,
      termsAccepted: Boolean(signupTermsInput?.checked)
    });
    clearAuthCredentials();
    if (authUsernameInput) authUsernameInput.value = data.username || signupEmailInput?.value || signupMobileInput?.value || "";
    if (authPasswordInput) authPasswordInput.value = "";
    if (signupPasswordInput) signupPasswordInput.value = "";
    if (signupConfirmPasswordInput) signupConfirmPasswordInput.value = "";
    if (signupTermsInput) signupTermsInput.checked = false;
    setAuthMode("login", "Account created successfully. Please sign in.", "#146c43");
  } catch (error) {
    if (authMessage) {
      authMessage.style.color = "#b42318";
      authMessage.textContent = error.message || "Could not create account.";
    }
  } finally {
    createAccountButton.disabled = false;
  }
});

forgotPasswordButton?.addEventListener("click", () => {
  if (forgotPasswordPanel) forgotPasswordPanel.hidden = !forgotPasswordPanel.hidden;
  if (loginChangePasswordPanel) loginChangePasswordPanel.hidden = true;
  if (authMessage) authMessage.textContent = "";
  if (forgotPasswordStatus) {
    forgotPasswordStatus.style.color = "#475467";
    forgotPasswordStatus.textContent = "Enter your registered email address to receive a password reset link.";
  }
});

loginChangePasswordButton?.addEventListener("click", () => {
  if (loginChangePasswordPanel) loginChangePasswordPanel.hidden = !loginChangePasswordPanel.hidden;
  if (forgotPasswordPanel) forgotPasswordPanel.hidden = true;
  if (loginChangePasswordIdentifier) {
    loginChangePasswordIdentifier.value = authUsernameInput?.value || loginChangePasswordIdentifier.value || "";
  }
  if (authMessage) authMessage.textContent = "";
  if (loginChangePasswordStatus) {
    loginChangePasswordStatus.style.color = "#475467";
    loginChangePasswordStatus.textContent = "Enter your current password and a new password.";
  }
  setTimeout(() => loginCurrentPasswordInput?.focus(), 50);
});

loginChangePasswordSubmit?.addEventListener("click", async () => {
  loginChangePasswordSubmit.disabled = true;
  if (loginChangePasswordStatus) {
    loginChangePasswordStatus.style.color = "#475467";
    loginChangePasswordStatus.textContent = "Updating password...";
  }
  try {
    const data = await publicApiJson("/api/auth/change-password-public", {
      identifier: loginChangePasswordIdentifier?.value || authUsernameInput?.value,
      currentPassword: loginCurrentPasswordInput?.value,
      newPassword: loginNewPasswordInput?.value,
      confirmPassword: loginConfirmPasswordInput?.value
    });
    clearAuthCredentials(true);
    if (authUsernameInput) authUsernameInput.value = data.username || loginChangePasswordIdentifier?.value || authUsernameInput.value;
    if (authPasswordInput) authPasswordInput.value = "";
    if (loginCurrentPasswordInput) loginCurrentPasswordInput.value = "";
    if (loginNewPasswordInput) loginNewPasswordInput.value = "";
    if (loginConfirmPasswordInput) loginConfirmPasswordInput.value = "";
    if (loginChangePasswordPanel) loginChangePasswordPanel.hidden = true;
    setAuthMode("login", data.message || "Password updated. Please sign in.", "#146c43");
  } catch (error) {
    if (loginChangePasswordStatus) {
      loginChangePasswordStatus.style.color = "#b42318";
      loginChangePasswordStatus.textContent = error.message || "Unable to update password.";
    }
  } finally {
    loginChangePasswordSubmit.disabled = false;
  }
});

requestResetButton?.addEventListener("click", async () => {
  requestResetButton.disabled = true;
  forgotPasswordStatus.style.color = "#475467";
  forgotPasswordStatus.textContent = "Sending reset email...";
  try {
    const data = await publicApiJson("/api/auth/forgot-password/request", { identifier: forgotIdentifier.value });
    activePasswordResetId = "";
    forgotPasswordStatus.style.color = "#146c43";
    forgotPasswordStatus.textContent = data.deliveryMessage || "If this email is registered, a password reset link will be sent.";
  } catch (error) {
    forgotPasswordStatus.style.color = "#b42318";
    forgotPasswordStatus.textContent = error.message;
  } finally {
    requestResetButton.disabled = false;
  }
});

verifyResetButton?.addEventListener("click", async () => {
  verifyResetButton.disabled = true;
  forgotPasswordStatus.style.color = "#475467";
  forgotPasswordStatus.textContent = "Verifying reset code...";
  try {
    const data = await publicApiJson("/api/auth/forgot-password/verify", { resetId: activePasswordResetId, otp: forgotOtp.value });
    activePasswordResetId = data.resetId;
    forgotPasswordStatus.style.color = "#146c43";
    forgotPasswordStatus.textContent = "Code verified. Enter your new password.";
  } catch (error) {
    forgotPasswordStatus.style.color = "#b42318";
    forgotPasswordStatus.textContent = error.message;
  } finally {
    verifyResetButton.disabled = false;
  }
});

completeResetButton?.addEventListener("click", async () => {
  completeResetButton.disabled = true;
  forgotPasswordStatus.style.color = "#475467";
  forgotPasswordStatus.textContent = "Updating password...";
  try {
    const data = await publicApiJson("/api/auth/forgot-password/complete", {
      resetId: activePasswordResetId,
      newPassword: forgotNewPassword.value,
      confirmPassword: forgotConfirmPassword.value
    });
    clearAuthCredentials();
    if (authUsernameInput) authUsernameInput.value = data.username || authUsernameInput.value;
    if (authPasswordInput) authPasswordInput.value = "";
    activePasswordResetId = "";
    forgotPasswordStatus.style.color = "#146c43";
    forgotPasswordStatus.textContent = "Password reset successfully. Sign in with the new password.";
  } catch (error) {
    forgotPasswordStatus.style.color = "#b42318";
    forgotPasswordStatus.textContent = error.message;
  } finally {
    completeResetButton.disabled = false;
  }
});

notificationButton?.addEventListener("click", () => {
  if (!notificationPanel) return;
  notificationPanel.hidden = !notificationPanel.hidden;
});

markAllNotificationsRead?.addEventListener("click", () => {
  saveNotificationState(new Set(dashboardNotifications.map((item) => item.id)));
  renderNotifications();
});

notificationList?.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-notification-action]");
  if (!actionButton) return;
  const id = actionButton.dataset.id;
  if (actionButton.dataset.notificationAction === "read") {
    const readIds = readNotificationState();
    readIds.add(id);
    saveNotificationState(readIds);
  }
  if (actionButton.dataset.notificationAction === "clear") {
    dashboardNotifications = dashboardNotifications.filter((item) => item.id !== id);
  }
  renderNotifications();
});

["click", "keydown", "input", "change", "touchstart", "pointerdown", "scroll"].forEach((eventName) => {
  document.addEventListener(eventName, refreshAuthActivity, { passive: true, capture: true });
});

driveSettingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  driveStatus.textContent = "Saving Google Drive setup...";
  const button = driveSettingsForm.querySelector("button");
  button.disabled = true;

  try {
    const payload = Object.fromEntries(new FormData(driveSettingsForm).entries());
    payload.gmailAddress = String(payload.gmailAddress || "").trim();
    payload.googleClientId = String(payload.googleClientId || "").trim();
    payload.googleClientSecret = String(payload.googleClientSecret || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.gmailAddress)) {
      throw new Error("Enter a valid Gmail address, for example yourname@gmail.com.");
    }
    const hasOAuth = payload.googleClientId && payload.googleClientSecret;
    if (!currentDriveStatus.hasCredentials && !hasOAuth) {
      throw new Error("Enter OAuth Client ID and OAuth Client Secret before saving Google Drive setup.");
    }
    if ((payload.googleClientId && !payload.googleClientSecret) || (!payload.googleClientId && payload.googleClientSecret)) {
      throw new Error("Enter both OAuth Client ID and OAuth Client Secret, or leave both blank when only saving Gmail.");
    }
    if (payload.googleClientId && !/\.apps\.googleusercontent\.com$/i.test(payload.googleClientId)) {
      throw new Error("OAuth Client ID must end with .apps.googleusercontent.com.");
    }
    if (hasOAuth) {
      const settingsResponse = await apiFetch("/api/google-drive/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const settingsData = await settingsResponse.json();
      if (!settingsResponse.ok) throw new Error(settingsData.error || "Unable to save Google Drive setup.");
    }

    const response = await apiFetch("/api/google-drive/gmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to save Gmail address.");
    renderDriveStatus(data);
    googleClientSecretInput.value = "";
    message.style.color = "#146c43";
    message.textContent = data.hasCredentials ? "Drive setup saved. Click Connect Gmail next." : "Gmail saved. Add OAuth Client ID and Secret to upload directly to Drive.";
  } catch (error) {
    driveStatus.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

copyGoogleRedirectUriButton?.addEventListener("click", async () => {
  const uri = googleRedirectUriInput?.value || "";
  if (!uri) {
    driveStatus.textContent = "Authorized Redirect URI is not available yet.";
    return;
  }
  try {
    await navigator.clipboard.writeText(uri);
    driveStatus.textContent = "Authorized Redirect URI copied.";
  } catch {
    googleRedirectUriInput?.select();
    driveStatus.textContent = "Copy the selected Authorized Redirect URI.";
  }
});

toggleGoogleClientSecretButton?.addEventListener("click", () => {
  if (!googleClientSecretInput) return;
  const showing = googleClientSecretInput.type === "text";
  googleClientSecretInput.type = showing ? "password" : "text";
  toggleGoogleClientSecretButton.textContent = showing ? "Show" : "Hide";
});

uploadDriveButton.addEventListener("click", async () => {
  driveStatus.textContent = "Uploading Excel to Google Drive...";
  uploadDriveButton.disabled = true;

  try {
    const response = await apiFetch("/api/google-drive/upload", { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to upload to Google Drive.");
    renderDriveStatus(data.status);
    message.style.color = "#146c43";
    message.textContent = "Excel uploaded to Google Drive.";
  } catch (error) {
    driveStatus.textContent = error.message;
  } finally {
    uploadDriveButton.disabled = false;
  }
});

upstoxForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  upstoxStatus.textContent = "Saving trading token...";
  const button = upstoxForm.querySelector("button");
  button.disabled = true;

  try {
    const payload = Object.fromEntries(new FormData(upstoxForm).entries());
    const token = payload.upstoxAccessToken || localStorage.getItem(upstoxAccessTokenStorageKey);
    await saveUpstoxTokenToServer(token);
    upstoxAccessTokenInput.value = "";
    const syncData = await syncUpstoxPortfolio();
    message.style.color = "#146c43";
    message.textContent = syncData.queued
      ? "Trading token saved. Trading data pulled; Excel update is queued."
      : "Trading token saved and portfolio synced.";
  } catch (error) {
    upstoxStatus.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

syncUpstoxButton.addEventListener("click", async () => {
  try {
    const data = await syncUpstoxPortfolio();
    message.style.color = "#146c43";
    message.textContent = data.queued
      ? "Trading data pulled. Excel update is queued."
      : data.upstox?.skipped
        ? "Trading sheet refreshed. Add trading token to pull live account data."
        : "Trading portfolio synced.";
  } catch (error) {
    upstoxStatus.textContent = error.message;
  }
});

modulePanel?.addEventListener("change", (event) => {
  if (event.target?.id === "languageSelect") {
    localStorage.setItem("smartFin365Language", event.target.value);
    document.documentElement.lang = event.target.value;
    const status = document.querySelector("#languageStatus");
    if (status) status.textContent = `Language preference saved: ${event.target.options[event.target.selectedIndex]?.text || event.target.value}. Full translation packs can use this setting across web and mobile.`;
  }
});

modulePanel?.addEventListener("submit", async (event) => {
  if (event.target?.id !== "supportTicketForm") return;
  event.preventDefault();
  const formData = new FormData(event.target);
  const attachment = event.target.querySelector('input[name="attachment"]')?.files?.[0] || null;
  const payload = Object.fromEntries(formData.entries());
  payload.attachmentName = attachment?.name || "";
  payload.attachmentSize = attachment?.size || 0;
  delete payload.attachment;
  const status = document.querySelector("#supportTicketStatus");
  const button = event.target.querySelector("button[type='submit']");
  if (status) status.textContent = "Creating support ticket...";
  if (button) button.disabled = true;
  try {
    const response = await apiFetch("/api/support-tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to create support ticket.");
    event.target.reset();
    if (status) status.textContent = `Ticket ${data.ticket.id} created. Support email: ${data.supportEmail}`;
  } catch (error) {
    if (status) status.textContent = error.message;
  } finally {
    if (button) button.disabled = false;
  }
});

modulePanel?.addEventListener("click", (event) => {
  const tabButton = event.target.closest(".module-tab");
  if (tabButton) {
    event.preventDefault();
    setActiveModuleTab(currentPage, tabButton.dataset.moduleTab);
    return;
  }

  const backupViewButton = event.target.closest("[data-backup-view]");
  if (backupViewButton) {
    openBackupRestorePlan(backupViewButton.dataset.backupView).catch((error) => {
      backupViewState.message = error.message || "Could not load backup details.";
      renderModuleContent("backup-restore");
    });
    return;
  }

  const backupValidateButton = event.target.closest("[data-backup-validate]");
  if (backupValidateButton) {
    backupValidateButton.disabled = true;
    apiFetch(`/api/backups/${encodeURIComponent(backupValidateButton.dataset.backupValidate)}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Backup validation failed.");
        return refreshBackupInventory(`${data.backup.backupId} checksum validated.`);
      })
      .catch((error) => {
        backupViewState.message = error.message || "Backup validation failed.";
        renderModuleContent("backup-restore");
      });
    return;
  }

  const backupDownloadButton = event.target.closest("[data-backup-download]");
  if (backupDownloadButton) {
    window.location.assign(`/api/backups/${encodeURIComponent(backupDownloadButton.dataset.backupDownload)}/download`);
    return;
  }

  const backupRestoreButton = event.target.closest("[data-backup-restore]");
  if (backupRestoreButton && !backupRestoreButton.disabled) {
    openBackupRestorePlan(backupRestoreButton.dataset.backupRestore, true).catch((error) => {
      backupViewState.message = error.message || "Could not prepare the restore.";
      renderModuleContent("backup-restore");
    });
    return;
  }

  const backupChainButton = event.target.closest("[data-backup-select-chain]");
  if (backupChainButton) {
    openBackupRestorePlan(backupChainButton.dataset.backupSelectChain, true).catch((error) => {
      backupViewState.message = error.message || "Could not select the complete restore chain.";
      renderModuleContent("backup-restore");
    });
    return;
  }

  const shell = event.target.closest(".module-record-shell");
  if (!shell) return;
  const { page, tab, data } = activeModuleContext();
  const key = moduleTabKey(page, tab);

  if (event.target.closest(".module-add-button")) {
    moduleState.editing = null;
    renderModuleContent(page);
    shell.querySelector(".module-record-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (event.target.closest(".module-export-button")) {
    exportModuleRecords(data);
    return;
  }

  const sortButton = event.target.closest(".module-sort");
  if (sortButton) {
    const sortKey = sortButton.dataset.sortKey;
    const previous = moduleState.sortByTab[key] || {};
    moduleState.sortByTab[key] = {
      key: sortKey,
      direction: previous.key === sortKey && previous.direction !== "desc" ? "desc" : "asc"
    };
    renderModuleContent(page);
    return;
  }

  const pageButton = event.target.closest(".module-page-button");
  if (pageButton) {
    moduleState.pageByTab[key] = Math.max(1, (moduleState.pageByTab[key] || 1) + Number(pageButton.dataset.pageDirection || 0));
    renderModuleContent(page);
    return;
  }

  const viewButton = event.target.closest(".module-view");
  if (viewButton) {
    const record = findCurrentModuleRecord(viewButton.dataset.id);
    if (record) viewModuleRecord(record);
    return;
  }

  const editButton = event.target.closest(".module-edit");
  if (editButton) {
    const record = findCurrentModuleRecord(editButton.dataset.id);
    if (!record) return;
    moduleState.editing = { slug: tab.slug, record };
    renderModuleContent(page);
    modulePanel.querySelector(".module-record-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const deleteButton = event.target.closest(".module-delete");
  if (deleteButton) {
    deleteModuleRecord(deleteButton.dataset.id, deleteButton);
    return;
  }

  if (event.target.closest(".module-cancel")) {
    moduleState.editing = null;
    renderModuleContent(page);
  }
});

modulePanel?.addEventListener("input", (event) => {
  const backupSearch = event.target.closest("[data-backup-search]");
  if (backupSearch) {
    backupViewState.query = backupSearch.value;
    applyBackupFilters();
    return;
  }
  const formElement = event.target.closest(".module-record-form");
  if (formElement) recalculateModuleForm(formElement);
  const search = event.target.closest(".module-search");
  if (search) {
    const { page, tab } = activeModuleContext();
    const key = moduleTabKey(page, tab);
    moduleState.searchByTab[key] = search.value;
    moduleState.pageByTab[key] = 1;
    renderModuleContent(page);
  }
});

modulePanel?.addEventListener("change", (event) => {
  const backupFilter = event.target.closest("[data-backup-filter]");
  if (backupFilter) {
    backupViewState[backupFilter.dataset.backupFilter] = backupFilter.value;
    applyBackupFilters();
    return;
  }
  const formElement = event.target.closest(".module-record-form");
  if (formElement) recalculateModuleForm(formElement);
  const filter = event.target.closest(".module-filter");
  if (filter) {
    const { page, tab } = activeModuleContext();
    const key = moduleTabKey(page, tab);
    moduleState.filterByTab[key] = filter.value;
    moduleState.pageByTab[key] = 1;
    renderModuleContent(page);
  }
});

modulePanel?.addEventListener("submit", async (event) => {
  const backupRestoreForm = event.target.closest("[data-backup-restore-form]");
  if (backupRestoreForm) {
    event.preventDefault();
    const status = backupRestoreForm.querySelector("[data-backup-restore-status]");
    const button = backupRestoreForm.querySelector("button[type=submit]");
    if (button) button.disabled = true;
    if (status) status.textContent = "Creating the pre-restore backup and validating the selected snapshot...";
    try {
      const response = await apiFetch(`/api/backups/${encodeURIComponent(backupRestoreForm.elements.backupId.value)}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: backupRestoreForm.elements.confirmation.value,
          scope: backupRestoreForm.elements.scope.value
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Restore failed.");
      backupViewState.restorePlan = null;
      backupViewState.restoreMode = false;
      await refreshBackupInventory(`Restore job ${data.job.id} completed. Pre-restore backup: ${data.job.preRestoreBackupId}.`);
    } catch (error) {
      if (status) status.textContent = error.message || "Restore failed.";
      if (button) button.disabled = false;
    }
    return;
  }
  const formElement = event.target.closest(".module-record-form");
  if (!formElement) return;
  event.preventDefault();
  const submitter = event.submitter;
  const action = submitter?.value || "save";
  submitter.disabled = true;
  setModuleMessage(formElement, "Saving to Excel...");
  try {
    await saveModuleRecord(formElement, action);
  } catch (error) {
    setModuleMessage(formElement, error.message || "Unable to save this record.", true);
  } finally {
    submitter.disabled = false;
  }
});

document.addEventListener("click", (event) => {
  const chartButton = event.target.closest("[data-chart-action]");
  if (chartButton) {
    event.preventDefault();
    handleChartAction(chartButton);
    return;
  }

  const reportTab = event.target.closest("[data-report-tab]");
  if (reportTab) {
    event.preventDefault();
    reportsState.tab = reportTab.dataset.reportTab || "all";
    if (reportsAnalyticsData) renderReportsAnalytics(reportsAnalyticsData);
    return;
  }

  const reportButton = event.target.closest("[data-report-action]");
  if (reportButton) {
    const panel = reportButton.closest(".analysis-panel");
    const reportName = panel?.dataset.reportName || "";
    const action = reportButton.dataset.reportAction;
    if (action === "favourite" && reportName) {
      reportsState.favourites.has(reportName) ? reportsState.favourites.delete(reportName) : reportsState.favourites.add(reportName);
      localStorage.setItem(reportFavouritesStorageKey, JSON.stringify([...reportsState.favourites]));
    }
    if (action === "toggle" && reportName) {
      reportsState.collapsed.has(reportName) ? reportsState.collapsed.delete(reportName) : reportsState.collapsed.add(reportName);
    }
    if (action === "expand-all") reportsState.collapsed.clear();
    if (action === "collapse-all" && reportsAnalyticsData) reportsAnalyticsData.reports.forEach((report) => reportsState.collapsed.add(report.name));
    if (action === "export" && panel) downloadTextFile(`${reportName || "report"}.csv`, `"Report","${reportName}"\n`, "text/csv");
    if (action === "fullscreen" && panel?.requestFullscreen) panel.requestFullscreen();
    if (reportsAnalyticsData) renderReportsAnalytics(reportsAnalyticsData);
    return;
  }

  const tradingDateButton = event.target.closest(".save-trading-date");
  if (tradingDateButton) {
    event.preventDefault();
    saveTradingInvestedDate(tradingDateButton);
    return;
  }

  const routeLink = event.target.closest("[data-route]");
  if (!routeLink) return;
  event.preventDefault();
  routeTo(routeLink.dataset.route || routeLink.getAttribute("href"));
});

reportsContent?.addEventListener("input", (event) => {
  if (event.target?.id === "reportsSearch") {
    reportsState.query = event.target.value;
    if (reportsAnalyticsData) renderReportsAnalytics(reportsAnalyticsData);
  }
});

reportsContent?.addEventListener("change", (event) => {
  if (event.target?.id === "reportsModuleFilter") {
    reportsState.module = event.target.value || "all";
    if (reportsAnalyticsData) renderReportsAnalytics(reportsAnalyticsData);
  }
});

function hasActiveSession() {
  return Boolean(readAuthCredentials());
}

function registerUserActivity(event) {
  if (!hasActiveSession()) return;
  if (event?.isTrusted === false) return;
  refreshAuthActivity().catch(() => {});
}

["click", "touchstart", "keydown", "input", "change", "scroll", "wheel", "pointerdown"].forEach((eventName) => {
  window.addEventListener(eventName, registerUserActivity, { passive: true, capture: true });
});

["input", "keydown", "change", "focusin"].forEach((eventName) => {
  document.addEventListener(eventName, (event) => {
    if (isEditableElement(event.target)) markUserInputActive();
  }, { passive: true, capture: true });
});

stayLoggedInButton?.addEventListener("click", () => {
  refreshAuthActivity({ force: true }).catch(() => {});
});

form?.addEventListener("input", () => {
  hasUnsavedFormChanges = true;
});

propertyForm?.addEventListener("input", () => {
  hasUnsavedFormChanges = true;
});

window.addEventListener("storage", (event) => {
  if (event.key !== authBroadcastStorageKey || !event.newValue) return;
  try {
    const message = JSON.parse(event.newValue);
    if (message.type === "logout") {
      clearSensitiveScreenData();
      clearAuthCredentials(false);
      showAuthGate("Logged out in another tab. Enter your password to continue.");
    }
    if (message.type === "activity") scheduleAuthLogout();
  } catch {}
});

window.addEventListener("hashchange", () => {
  registerUserActivity({ isTrusted: true });
  applyRoute(normalizePage(window.location.hash));
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  });
}

updateServerUi();
checkServerConnection().catch(() => {});
loadAuthPublicStatus().catch(() => {});
applyRoute(normalizePage(window.location.hash));

scheduleAuthLogout();
if (!readAuthCredentials()) {
  clearSensitiveScreenData();
  showAuthGate("Sign in with your password to continue.");
}

loadWorkbookStatus().catch((error) => {
  if (isAuthRequiredError(error)) return;
  if (syncStatus) syncStatus.textContent = "Could not read workbook location.";
});

loadDriveStatus().catch((error) => {
  if (isAuthRequiredError(error)) return;
  driveStatus.textContent = "Could not read Google Drive status.";
});

loadSecuritySettings().catch((error) => {
  if (isAuthRequiredError(error)) return;
  if (securitySettingsStatus) {
    securitySettingsStatus.style.color = "#b42318";
    securitySettingsStatus.textContent = "Could not load authentication methods.";
  }
});

loadProperties().catch((error) => {
  if (isAuthRequiredError(error)) return;
  propertyMessage.textContent = "Could not load property records.";
  propertyMessage.style.color = "#b42318";
});

loadLoans().catch((error) => {
  if (isAuthRequiredError(error)) return;
  message.textContent = "Could not load loan records.";
  message.style.color = "#b42318";
});

loadTrading().catch((error) => {
  if (isAuthRequiredError(error)) return;
  tradingBody.innerHTML = '<tr><td colspan="14" class="empty">Could not load trading records.</td></tr>';
});

loadUpstoxStatus().catch((error) => {
  if (isAuthRequiredError(error)) return;
  upstoxStatus.textContent = "Could not read Upstox status.";
});

loadEntries().catch((error) => {
  if (isAuthRequiredError(error)) return;
  message.textContent = "Could not load existing Excel records.";
  message.style.color = "#b42318";
});

updateChittyFields();
setInterval(() => scheduleBackgroundRefresh("scheduled visible refresh", 0), backgroundRefreshMs);

