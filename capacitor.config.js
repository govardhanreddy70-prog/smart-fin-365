const configuredPublicUrl = (process.env.FINANCE_PUBLIC_URL || process.env.PUBLIC_APP_URL || process.env.PUBLIC_BASE_URL || "").trim().replace(/\/+$/, "");
const useRemoteServer = /^(1|true|yes)$/i.test(process.env.FINANCE_CAPACITOR_REMOTE || "");
const isConfiguredHttpsUrl = /^https:\/\//i.test(configuredPublicUrl);
const configuredPublicHost = (() => {
  try {
    return configuredPublicUrl ? new URL(configuredPublicUrl).hostname : "";
  } catch {
    return "";
  }
})();
const allowNavigation = (process.env.FINANCE_CAPACITOR_ADDITIONAL_HOSTS || "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);
if (configuredPublicHost && !allowNavigation.includes(configuredPublicHost)) {
  allowNavigation.unshift(configuredPublicHost);
}
if (!configuredPublicHost) allowNavigation.push("localhost", "127.0.0.1");

module.exports = {
  appId: "com.govardhan.financerecords",
  appName: "Smart Fin 365",
  webDir: "public",
  bundledWebRuntime: false,
  server: {
    ...(useRemoteServer && configuredPublicUrl ? { url: configuredPublicUrl } : {}),
    cleartext: !isConfiguredHttpsUrl,
    allowNavigation
  },
  android: {
    allowMixedContent: !isConfiguredHttpsUrl
  }
};
