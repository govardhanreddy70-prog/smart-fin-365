// The web app uses its current HTTPS origin in production. Development or mobile
// builds can generate a local override with scripts/configure-public-url.ps1.
window.FINANCE_SERVER_CONFIG = {
  publicUrl: "",
  fallbackUrls: [],
  autoProbe: false
};
