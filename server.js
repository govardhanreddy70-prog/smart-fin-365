const path = require("path");
const fsSync = require("fs");
const fs = require("fs/promises");
const crypto = require("crypto");
const express = require("express");
const ExcelJS = require("exceljs");
const { google } = require("googleapis");
const os = require("os");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

const app = express();
app.disable("x-powered-by");
const nodeEnvironment = String(process.env.NODE_ENV || "development").trim().toLowerCase();
const isProductionEnvironment = nodeEnvironment === "production";
const configuredPort = String(process.env.PORT || "").trim();
if (isProductionEnvironment && !configuredPort) {
  throw new Error("Production requires the hosting provider to supply PORT.");
}
const port = Number(configuredPort || 3333);
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error("PORT must be a valid TCP port number.");
}
const host = process.env.HOST || "0.0.0.0";
const dataDir = process.env.DATA_DIR || (isProductionEnvironment ? "" : __dirname);
if (!dataDir) {
  throw new Error("Production requires DATA_DIR to point to protected persistent storage.");
}
const workDirPath = path.join(dataDir, "work");
const backupStorageDir = process.env.BACKUP_STORAGE_DIR || (isProductionEnvironment ? "" : workDirPath);
if (!backupStorageDir) {
  throw new Error("Production requires BACKUP_STORAGE_DIR to point to protected persistent storage.");
}
const defaultWorkbookFileName = "Finance_Records_Converted.xlsx";
const legacyWorkbookFileName = "Finance_Records.xlsx";
const defaultWorkbookPath = path.join(dataDir, defaultWorkbookFileName);
const configPath = path.join(dataDir, "workbook.config.json");
const developmentDriveFolderId = "11J5-NCSvx4dgCaZ1JwY5HIlcmlB2-a6v";
const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || (isProductionEnvironment ? "" : developmentDriveFolderId);
const driveFolderUrl = driveFolderId ? `https://drive.google.com/drive/folders/${driveFolderId}` : "";
const driveScopes = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/spreadsheets",
  "openid",
  "email",
  "profile",
  ...(String(process.env.GOOGLE_ENABLE_GMAIL_SEND || "false").toLowerCase() === "true"
    ? ["https://www.googleapis.com/auth/gmail.send"]
    : [])
];
const annualDebtInterestRate = 0.24;
const syncLogPath = path.join(dataDir, "sync-errors.log");
const publicLoginPath = path.join(workDirPath, "public-url-login.txt");
const securityLogPath = path.join(workDirPath, "security.log");
const googleOAuthKeyPath = path.join(workDirPath, "google-oauth-secret.key");
const upstoxPortfolioPath = path.join(workDirPath, "upstox-portfolio.json");
const upstoxTradesPath = path.join(workDirPath, "upstox-trades.json");
const upstoxAutoSyncIntervalMs = Math.max(Number(process.env.UPSTOX_AUTO_SYNC_MS || 60000), 30000);
const liveDebtInterestSyncIntervalMs = Math.max(Number(process.env.LIVE_DEBT_INTEREST_SYNC_MS || 60000), 30000);
const defaultUpstoxHistoryStartDate = process.env.UPSTOX_HISTORY_START_DATE || "2020-04-01";
const appUrl = (process.env.PUBLIC_APP_URL || process.env.APP_URL || process.env.PUBLIC_BASE_URL || (isProductionEnvironment ? "" : `http://localhost:${port}`)).replace(/\/+$/, "");
const isHostedProduction = isProductionEnvironment || /^https:\/\//i.test(appUrl);
const corsAllowedOrigins = new Set(
  [
    ...String(process.env.CORS_ALLOWED_ORIGINS || appUrl || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean),
    ...(isProductionEnvironment ? [] : ["capacitor://localhost", "ionic://localhost"])
  ]
);
const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
// Supabase calls accept the current publishable-key name and the legacy anon-key name.
// The service role key remains server-only and is never exposed through the API.
const supabaseAnonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const sessionIdleTimeoutMs = 2 * 60 * 1000;
const authOtpEnabled = String(process.env.AUTH_OTP_ENABLED || "false").toLowerCase() === "true";
const allowRuntimeCredentialStorage = String(
  process.env.ALLOW_RUNTIME_CREDENTIAL_STORAGE || (isProductionEnvironment ? "false" : "true")
).toLowerCase() === "true";
const financeSessions = new Map();
const loginChallenges = new Map();
const authAttemptBuckets = new Map();
let backupRestoreInProgress = false;
const serverStartedAt = Date.now();
let runtimeReady = false;
let runtimeStartupError = "";

if (isHostedProduction && /^(1|true|yes)$/i.test(String(process.env.TRUST_PROXY || ""))) {
  app.set("trust proxy", 1);
}

function parseCookieHeader(header) {
  return String(header || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const separator = part.indexOf("=");
      if (separator < 0) return acc;
      acc[decodeURIComponent(part.slice(0, separator))] = decodeURIComponent(part.slice(separator + 1));
      return acc;
    }, {});
}

function sessionCookieValue(token, maxAgeMs = sessionIdleTimeoutMs) {
  const parts = [
    `sf360_session=${encodeURIComponent(token || "")}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${Math.max(0, Math.floor(maxAgeMs / 1000))}`
  ];
  if (isHostedProduction) parts.push("Secure");
  return parts.join("; ");
}

function clearSessionCookieValue() {
  const parts = ["sf360_session=", "HttpOnly", "SameSite=Lax", "Path=/", "Max-Age=0"];
  if (isHostedProduction) parts.push("Secure");
  return parts.join("; ");
}

function getLocalNetworkUrls() {
  if (isHostedProduction) return [];
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((details) => details && details.family === "IPv4" && !details.internal)
    .map((details) => `http://${details.address}:${port}`);
}

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createPasswordHash(password) {
  return `bcrypt:${bcrypt.hashSync(String(password || ""), 12)}`;
}

function verifyPasswordHash(password, storedHash) {
  if (String(storedHash || "").startsWith("bcrypt:")) {
    return bcrypt.compareSync(String(password || ""), String(storedHash).slice("bcrypt:".length));
  }
  const [scheme, salt, expectedHash] = String(storedHash || "").split(":");
  if (scheme !== "scrypt" || !salt || !expectedHash) return false;
  const actualHash = crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
  return safeCompare(actualHash, expectedHash);
}

async function getFinanceAuthSettings() {
  const config = await readConfig();
  const username = config.financeWebUser || process.env.FINANCE_WEB_USER || "admin";
  const adminEmail = config.financeAdminEmail || process.env.FINANCE_ADMIN_EMAIL || "govardhan.reddy70@gmail.com";
  const adminMobile = config.financeAdminMobile || process.env.FINANCE_ADMIN_MOBILE || "9739564234";
  const role = config.financeAdminRole || "Administrator";
  const passwordHash = safeText(config.financeWebPasswordHash);
  const environmentPassword = process.env.FINANCE_WEB_PASSWORD || "";
  return {
    enabled: Boolean(passwordHash || environmentPassword),
    username,
    adminEmail,
    adminMobile,
    role,
    passwordHash,
    environmentPassword,
    source: passwordHash ? "saved" : environmentPassword ? "environment" : ""
  };
}

function normalizeAuthIdentifier(value) {
  return safeText(value).toLowerCase();
}

function normalizeIndianMobile(value) {
  const digits = safeText(value).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits;
}

function validateRegistrationPayload({ fullName, email, mobile, password, confirmPassword, termsAccepted }) {
  const errors = [];
  const cleanName = safeText(fullName);
  const cleanEmail = safeText(email).toLowerCase();
  const cleanMobile = normalizeIndianMobile(mobile);
  if (cleanName.length < 2) errors.push("Enter the full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) errors.push("Enter a valid email address.");
  if (!/^[6-9]\d{9}$/.test(cleanMobile)) errors.push("Enter a valid Indian mobile number.");
  const strengthErrors = passwordStrengthErrors(password);
  if (strengthErrors.length) errors.push(...strengthErrors);
  if (String(password || "") !== String(confirmPassword || "")) errors.push("New password and confirm password do not match.");
  if (!termsAccepted) errors.push("Accept Terms and Privacy to create the account.");
  return { errors, fullName: cleanName, email: cleanEmail, mobile: cleanMobile };
}

async function getRegisteredUsers(config = null) {
  const source = config || await readConfig();
  return Array.isArray(source.financeUsers) ? source.financeUsers : [];
}

function findRegisteredUser(identifier, users = []) {
  const normalized = normalizeAuthIdentifier(identifier);
  const mobile = normalizeIndianMobile(identifier);
  return users.find((user) => {
    const userEmail = normalizeAuthIdentifier(user.email);
    const userMobile = normalizeIndianMobile(user.mobile);
    const userName = normalizeAuthIdentifier(user.username);
    return [userEmail, userMobile, userName].filter(Boolean).includes(normalized) || (mobile && userMobile === mobile);
  }) || null;
}

function registeredUserConflicts({ email, mobile }, users = [], settings = {}) {
  const normalizedEmail = normalizeAuthIdentifier(email);
  const normalizedMobile = normalizeIndianMobile(mobile);
  const adminMatches = [settings.username, settings.adminEmail].some((value) => normalizeAuthIdentifier(value) === normalizedEmail)
    || normalizeIndianMobile(settings.adminMobile) === normalizedMobile;
  if (adminMatches) return true;
  return users.some((user) => normalizeAuthIdentifier(user.email) === normalizedEmail || normalizeIndianMobile(user.mobile) === normalizedMobile);
}

function normalizeSecondFactorMethods(methods = []) {
  const allowed = new Map([
    ["mpin", { type: "mpin", label: "4-digit MPIN" }],
    ["fingerprint", { type: "fingerprint", label: "Fingerprint" }],
    ["face", { type: "face", label: "Face Authentication" }]
  ]);
  return (Array.isArray(methods) ? methods : [])
    .map((method) => {
      const type = safeText(typeof method === "string" ? method : method.type).toLowerCase();
      if (!allowed.has(type)) return null;
      const base = allowed.get(type);
      return {
        ...base,
        enabled: typeof method === "string" ? true : method.enabled !== false
      };
    })
    .filter((method) => method?.enabled);
}

function enabledSecondFactorMethodsForLogin({ user = null, settings = {}, config = {} } = {}) {
  const userMethods = normalizeSecondFactorMethods(user?.secondFactorMethods || user?.authMethods)
    .filter((method) => {
      if (method.type === "mpin") return Boolean(user?.mpinHash);
      if (method.type === "fingerprint") return Boolean(user?.webAuthnCredentials?.fingerprint?.length);
      if (method.type === "face") return Boolean(user?.webAuthnCredentials?.face?.length);
      return false;
    });
  if (userMethods.length) return userMethods;
  const adminMethods = normalizeSecondFactorMethods(config.adminSecondFactorMethods || config.secondFactorMethods)
    .filter((method) => {
      if (method.type === "mpin") return Boolean(config.adminMpinHash || config.mpinHash);
      if (method.type === "fingerprint") return Boolean(config.adminWebAuthnCredentials?.fingerprint?.length);
      if (method.type === "face") return Boolean(config.adminWebAuthnCredentials?.face?.length);
      return false;
    });
  if (!user && adminMethods.length) return adminMethods;
  return [];
}

function supabaseAuthConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function supabaseAdminConfigured() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

function supabaseRuntimeStatus(config = {}) {
  return {
    configured: supabaseAuthConfigured(),
    adminConfigured: supabaseAdminConfigured(),
    url: supabaseUrl ? supabaseUrl.replace(/^https:\/\/([^.]+).*/, "https://$1...") : "",
    rlsMigration: "supabase/migrations/001_smart_fin_365_rls.sql",
    worksheetModel: "Google Sheets template mapped through worksheet_definitions and finance_records.row_data",
    logicalModules: [
      "Profile", "Income", "Expense", "Debt", "Chitty", "Investments", "Assets",
      "Liabilities", "Goals", "Insurance", "Bank Accounts", "Taxes", "Settings",
      "Backup", "Subscriptions", "Support Tickets", "Audit Log"
    ],
    userSheetProvisioning: config.userSheetProvisioning || "pending-google-oauth",
    lastSchemaSync: config.lastSupabaseSchemaSync || "",
    lastSyncError: config.lastSupabaseSyncError || ""
  };
}

async function callSupabaseAuth(pathname, { method = "POST", body = null, accessToken = "", serviceRole = false } = {}) {
  if (!supabaseAuthConfigured()) {
    const error = new Error("Supabase Auth is not configured.");
    error.status = 503;
    throw error;
  }
  const key = serviceRole && supabaseServiceRoleKey ? supabaseServiceRoleKey : supabaseAnonKey;
  const headers = {
    apikey: key,
    Authorization: `Bearer ${accessToken || key}`,
    "Content-Type": "application/json"
  };
  const response = await fetch(`${supabaseUrl}/auth/v1${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.msg || data.message || data.error_description || data.error || "Supabase Auth request failed.");
    error.status = response.status;
    error.details = data;
    throw error;
  }
  return data;
}

async function sendSupabasePasswordRecovery(email) {
  const cleanEmail = safeText(email).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    const error = new Error("Enter your registered email address to receive a password reset link.");
    error.status = 400;
    throw error;
  }
  const redirectTo = `${appUrl}/reset-password`;
  await callSupabaseAuth("/recover", {
    body: {
      email: cleanEmail,
      redirect_to: redirectTo
    }
  });
  return { email: cleanEmail, redirectTo };
}

function parseBasicAuth(header) {
  const [scheme, encoded] = String(header || "").split(" ");
  if (scheme !== "Basic" || !encoded) return null;

  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const separatorIndex = decoded.indexOf(":");
  return {
    username: separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : decoded,
    password: separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : ""
  };
}

function verifyFinancePassword(password, settings) {
  if (settings.passwordHash) return verifyPasswordHash(password, settings.passwordHash);
  return safeCompare(password, settings.environmentPassword);
}

function financeIdentifierMatches(identifier, settings) {
  const normalized = safeText(identifier).toLowerCase();
  return [settings.username, settings.adminEmail, settings.adminMobile]
    .filter(Boolean)
    .map((value) => safeText(value).toLowerCase())
    .includes(normalized);
}

function isLoopbackRequest(req) {
  const address = safeText(req.socket?.remoteAddress || req.ip).replace(/^::ffff:/i, "");
  return address === "127.0.0.1" || address === "::1";
}

function createFinanceSession(settings) {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = Date.now();
  const session = {
    tokenHash: resetHash(token),
    username: settings.username,
    role: settings.role,
    createdAt: now,
    lastActivityAt: now,
    expiresAt: now + sessionIdleTimeoutMs
  };
  financeSessions.set(session.tokenHash, session);
  return { token, session };
}

function getFinanceSessionFromRequest(req) {
  const authorization = String(req.headers.authorization || "");
  const [scheme, value] = authorization.split(" ");
  const bearerToken = /^Bearer$/i.test(scheme || "") ? value : "";
  const cookieToken = parseCookieHeader(req.headers.cookie).sf360_session || "";
  const token = bearerToken || cookieToken;
  if (!token) return null;
  const tokenHash = resetHash(token);
  const session = financeSessions.get(tokenHash);
  if (!session) return null;
  if (Date.now() >= Number(session.expiresAt || 0)) {
    financeSessions.delete(tokenHash);
    return null;
  }
  return { token, tokenHash, session };
}

function renewFinanceSession(tokenHash) {
  const session = financeSessions.get(tokenHash);
  if (!session) return null;
  const now = Date.now();
  session.lastActivityAt = now;
  session.expiresAt = now + sessionIdleTimeoutMs;
  financeSessions.set(tokenHash, session);
  return session;
}

function maskedContact(identifier = "") {
  const value = safeText(identifier);
  if (value.includes("@")) {
    const [name, domain] = value.split("@");
    return `${name.slice(0, 2)}${"*".repeat(Math.max(2, name.length - 2))}@${domain}`;
  }
  return value.replace(/\d(?=\d{2})/g, "*");
}

function bucketAllowed(key, limit, windowMs) {
  const now = Date.now();
  const bucket = (authAttemptBuckets.get(key) || []).filter((at) => now - at < windowMs);
  if (bucket.length >= limit) {
    authAttemptBuckets.set(key, bucket);
    return false;
  }
  bucket.push(now);
  authAttemptBuckets.set(key, bucket);
  return true;
}

function cleanupLoginChallenges() {
  const now = Date.now();
  for (const [id, challenge] of loginChallenges.entries()) {
    if (now > Number(challenge.expiresAt || 0) || challenge.used) loginChallenges.delete(id);
  }
}

function loginDeliveryOptions(settings) {
  return [
    {
      channel: "sms",
      label: `Send OTP to registered mobile ending in ${safeText(settings.adminMobile).slice(-4)}`,
      maskedDestination: maskedContact(settings.adminMobile),
      enabled: Boolean(settings.adminMobile)
    },
    {
      channel: "email",
      label: "Send OTP to registered email",
      maskedDestination: maskedContact(settings.adminEmail),
      enabled: Boolean(settings.adminEmail)
    }
  ].filter((option) => option.enabled);
}

function contactForOtpChannel(settings, channel) {
  if (channel === "sms") return settings.adminMobile;
  if (channel === "email") return settings.adminEmail;
  return "";
}

async function generateAndDeliverLoginOtp(challengeId, channel, settings, config) {
  const challenge = loginChallenges.get(challengeId);
  if (!challenge || challenge.used || Date.now() > Number(challenge.expiresAt || 0)) {
    return { status: 400, error: "OTP expired. Start login again." };
  }
  if (Date.now() < Number(challenge.resendAt || 0) && challenge.otpHash) {
    return { status: 429, error: "Please wait before resending OTP." };
  }
  if (Number(challenge.resendAttempts || 0) >= 5) {
    loginChallenges.delete(challengeId);
    return { status: 429, error: "Too many OTP resend attempts. Start login again." };
  }
  const contact = contactForOtpChannel(settings, channel);
  if (!contact) return { status: 400, error: "Selected OTP channel is unavailable." };
  const otp = String(crypto.randomInt(100000, 999999));
  challenge.otpHash = resetHash(otp);
  challenge.channel = channel;
  challenge.contact = contact;
  challenge.attempts = 0;
  challenge.resendAttempts = Number(challenge.resendAttempts || 0) + 1;
  challenge.resendAt = Date.now() + 30 * 1000;
  challenge.expiresAt = Date.now() + 5 * 60 * 1000;
  loginChallenges.set(challengeId, challenge);
  const delivery = await sendOtpToRegisteredContact({ config, identifier: contact, otp, purpose: "login" });
  await appendSecurityLog("login_otp_delivery_attempted", {
    challengeId,
    channel,
    contactHash: resetHash(contact),
    deliverySent: delivery.sent
  });
  if (!delivery.sent) {
    return {
      status: 503,
      error: delivery.publicReason || "OTP service is temporarily unavailable. Please try again later or contact the administrator.",
      maskedDestination: maskedContact(contact),
      deliveryConfigured: false
    };
  }
  return {
    ok: true,
    maskedDestination: maskedContact(contact),
    otpExpiresAt: new Date(challenge.expiresAt).toISOString(),
    resendAfterSeconds: 30,
    deliveryConfigured: true,
    deliveryMessage: "OTP sent."
  };
}

async function sendOtpToRegisteredContact({ config, identifier, otp, purpose }) {
  const destination = safeText(identifier);
  const isEmail = destination.includes("@");
  const channel = isEmail ? "email" : "sms";
  const unavailable = "OTP service is temporarily unavailable. Please try again later or contact the administrator.";
  try {
    if (isEmail) {
      if (process.env.OTP_EMAIL_ENABLED === "false") {
        return { sent: false, channel, publicReason: unavailable, internalReason: "Email OTP channel is disabled." };
      }
      if (!process.env.OTP_SMTP_HOST || !process.env.OTP_SMTP_USER || !process.env.OTP_SMTP_PASS || !process.env.OTP_EMAIL_FROM) {
        return { sent: false, channel, publicReason: unavailable, internalReason: "SMTP OTP environment variables are incomplete." };
      }
      const transporter = nodemailer.createTransport({
        host: process.env.OTP_SMTP_HOST,
        port: Number(process.env.OTP_SMTP_PORT || 587),
        secure: String(process.env.OTP_SMTP_SECURE || "").toLowerCase() === "true",
        auth: { user: process.env.OTP_SMTP_USER, pass: process.env.OTP_SMTP_PASS }
      });
      await transporter.sendMail({
        from: process.env.OTP_EMAIL_FROM_NAME
          ? `"${process.env.OTP_EMAIL_FROM_NAME}" <${process.env.OTP_EMAIL_FROM}>`
          : process.env.OTP_EMAIL_FROM,
        to: destination,
        subject: purpose === "password-reset" ? "Smart Fin 365 password reset OTP" : "Smart Fin 365 login OTP",
        text: `Your Smart Fin 365 ${purpose === "password-reset" ? "password reset" : "login"} OTP is ${otp}. It expires in 5 minutes.`,
        html: `<p>Your Smart Fin 365 ${purpose === "password-reset" ? "password reset" : "login"} OTP is <strong>${otp}</strong>.</p><p>It expires in 5 minutes.</p>`
      });
      await updateConfig({ otpLastSuccess: nowIso(), otpLastSuccessChannel: channel, otpLastFailure: "", otpLastFailureChannel: "", otpLastFailureMasked: "" });
      return { sent: true, channel };
    }

    const smsUrl = process.env.OTP_SMS_URL || "";
    if (process.env.OTP_SMS_ENABLED === "false") {
      return { sent: false, channel, publicReason: unavailable, internalReason: "SMS OTP channel is disabled." };
    }
    if (!smsUrl) {
      return { sent: false, channel, publicReason: unavailable, internalReason: "SMS OTP URL is not configured." };
    }
    const mobile = destination.replace(/\D/g, "");
    const normalizedMobile = mobile.length === 10 ? `91${mobile}` : mobile;
    const template = process.env.OTP_SMS_BODY_TEMPLATE || JSON.stringify({ to: "{{to}}", message: "{{message}}" });
    const message = `Your Smart Fin 365 ${purpose === "password-reset" ? "password reset" : "login"} OTP is ${otp}. It expires in 5 minutes.`;
    const body = template
      .replaceAll("{{to}}", normalizedMobile)
      .replaceAll("{{message}}", message)
      .replaceAll("{{otp}}", otp);
    const headers = { "Content-Type": process.env.OTP_SMS_CONTENT_TYPE || "application/json" };
    if (process.env.OTP_SMS_AUTH_HEADER && process.env.OTP_SMS_AUTH_VALUE) headers[process.env.OTP_SMS_AUTH_HEADER] = process.env.OTP_SMS_AUTH_VALUE;
    if (process.env.OTP_SMS_BEARER_TOKEN) headers.Authorization = `Bearer ${process.env.OTP_SMS_BEARER_TOKEN}`;
    const response = await fetch(smsUrl, {
      method: process.env.OTP_SMS_METHOD || "POST",
      headers,
      body
    });
    if (!response.ok) throw new Error(`SMS provider returned HTTP ${response.status}`);
    await updateConfig({ otpLastSuccess: nowIso(), otpLastSuccessChannel: channel, otpLastFailure: "", otpLastFailureChannel: "", otpLastFailureMasked: "" });
    return { sent: true, channel };
  } catch (error) {
    const internalReason = error.message || "OTP delivery failed.";
    await updateConfig({ otpLastFailure: nowIso(), otpLastFailureChannel: channel, otpLastFailureMasked: internalReason.slice(0, 160) });
    await appendSecurityLog("otp_delivery_failed", { channel, purpose, destinationHash: resetHash(destination), error: internalReason });
    return { sent: false, channel, publicReason: unavailable, internalReason };
  }
}

function passwordStrengthErrors(password) {
  const value = String(password || "");
  const errors = [];
  if (value.length < 10) errors.push("Use at least 10 characters.");
  if (!/[A-Z]/.test(value)) errors.push("Add an uppercase letter.");
  if (!/[a-z]/.test(value)) errors.push("Add a lowercase letter.");
  if (!/[0-9]/.test(value)) errors.push("Add a number.");
  if (!/[^A-Za-z0-9]/.test(value)) errors.push("Add a symbol.");
  return errors;
}

async function appendSecurityLog(event, details = {}) {
  await fs.mkdir(workDirPath, { recursive: true });
  const safeDetails = { ...details };
  delete safeDetails.password;
  delete safeDetails.oldPassword;
  await fs.appendFile(securityLogPath, `${nowIso()} ${event} ${JSON.stringify(safeDetails)}\n`, "utf8");
}

function isAdminRole(role) {
  return new Set(["administrator", "admin", "super admin", "super_admin"]).has(safeText(role).toLowerCase());
}

function resetHash(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

async function requireFinanceAuth(req, res, next) {
  try {
    const settings = await getFinanceAuthSettings();
    if (!settings.enabled) {
      return res.status(503).json({
        error: "Finance web password is required. Set FINANCE_WEB_PASSWORD or reset the administrator password before accessing financial data."
      });
    }

    const activeSession = getFinanceSessionFromRequest(req);
    if (activeSession) {
      req.financeAuth = {
        username: activeSession.session.username,
        role: activeSession.session.role,
        sessionTokenHash: activeSession.tokenHash
      };
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      const userAllowedPaths = new Set(["/auth/check", "/security-settings", "/supabase/status"]);
      if (!isAdminRole(activeSession.session.role) && !userAllowedPaths.has(req.path)) {
        return res.status(403).json({ error: "This account does not have access to administrator financial records." });
      }
      return next();
    }

    return res.status(401).json({ error: "Authentication required." });
  } catch (error) {
    return next(error);
  }
}

const columns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Date", key: "date", width: 14 },
  { header: "Entry Type", key: "type", width: 22 },
  { header: "Person / Chitty", key: "party", width: 24 },
  { header: "Amount", key: "amount", width: 14 },
  { header: "Mode", key: "mode", width: 16 },
  { header: "Month", key: "month", width: 14 },
  { header: "Status", key: "status", width: 16 },
  { header: "Notes", key: "notes", width: 36 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Tenure (Months)", key: "tenureMonths", width: 16 },
  { header: "Starting Month", key: "startingMonth", width: 16 },
  { header: "Amount Received", key: "amountReceived", width: 18 },
  { header: "Interest Received", key: "interestReceived", width: 18 },
  { header: "Last Updated", key: "lastUpdated", width: 22 }
];

const debtColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Loan Type", key: "typeLabel", width: 16 },
  { header: "Person", key: "party", width: 24 },
  { header: "Amount Lent", key: "debtGiven", width: 14, aliases: ["Debt Given", "Amount"] },
  { header: "Date Given", key: "dateGiven", width: 14 },
  { header: "Date Cleared", key: "dateCleared", width: 14 },
  { header: "Mode", key: "mode", width: 16 },
  { header: "Status", key: "status", width: 16 },
  { header: "Final Amount", key: "finalAmount", width: 16 },
  { header: "Principal Received", key: "principalReceived", width: 18 },
  { header: "Interest Received", key: "interestReceived", width: 18 },
  { header: "Outstanding Principal", key: "outstandingPrincipal", width: 20 },
  { header: "Outstanding Interest", key: "outstandingInterest", width: 20 },
  { header: "Balance With Interest", key: "balanceWithInterest", width: 20 },
  { header: "Notes", key: "notes", width: 40 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 }
];

const tradingColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Asset Type", key: "assetType", width: 18 },
  { header: "Symbol / Name", key: "name", width: 28 },
  { header: "Invested Date", key: "investedDate", width: 16 },
  { header: "Average Buy Price", key: "averageBuyPrice", width: 18 },
  { header: "Current Market Price", key: "currentMarketPrice", width: 20 },
  { header: "Quantity", key: "quantity", width: 14 },
  { header: "Invested Value", key: "investedValue", width: 18 },
  { header: "Current Value", key: "currentValue", width: 18 },
  { header: "Realised Profit/Loss", key: "realisedProfitLoss", width: 18 },
  { header: "Unrealised Profit/Loss", key: "unrealisedProfitLoss", width: 20 },
  { header: "Profit/Loss", key: "profitLoss", width: 16 },
  { header: "Profit %", key: "profitPercent", width: 14 },
  { header: "Last Updated Timestamp", key: "lastUpdated", width: 24 }
];

const propertyColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Property Location", key: "propertyLocation", width: 28 },
  { header: "Google Map Location", key: "googleMapLocation", width: 36 },
  { header: "Property Size", key: "propertySize", width: 18 },
  { header: "Property Dimensions", key: "propertyDimensions", width: 24 },
  { header: "Previous Land Owner", key: "previousLandOwner", width: 24 },
  { header: "Purchase Price / SqY", key: "purchasePricePerSqy", width: 18 },
  { header: "Purchase Total Price", key: "purchaseTotalPrice", width: 18 },
  { header: "Document Number", key: "documentNumber", width: 20 },
  { header: "Registration Date", key: "registrationDate", width: 18 },
  { header: "Sell Price / SqY", key: "sellPricePerSqy", width: 18 },
  { header: "Sell Total Price", key: "sellTotalPrice", width: 18 },
  { header: "Present Owner", key: "presentOwner", width: 22 },
  { header: "New Owner", key: "newOwner", width: 22 },
  { header: "Notes", key: "notes", width: 36 },
  { header: "Created At", key: "createdAt", width: 22 }
];

const loanBaseColumns = [
  { header: "Notes", key: "notes", width: 34 },
  { header: "Borrowed From", key: "borrowedFrom", width: 24 },
  { header: "Type of Fund", key: "typeOfFund", width: 18 },
  { header: "Borrowed Date", key: "borrowedDate", width: 16 },
  { header: "Cleared Date", key: "clearedDate", width: 16 },
  { header: "Principal", key: "principal", width: 14 },
  { header: "Interest Percentage", key: "interestPercentage", width: 20 },
  { header: "EMI", key: "emi", width: 14 },
  { header: "Tenure (Months)", key: "tenureMonths", width: 18 },
  { header: "Finished Months", key: "finishedMonths", width: 18 },
  { header: "Remaining Months", key: "remainingMonths", width: 18 },
  { header: "Loan Amount", key: "loanAmount", width: 16 },
  { header: "Loan Paid", key: "loanPaid", width: 16 },
  { header: "Remaining Loan Amount", key: "remainingLoanAmount", width: 22 },
  { header: "Status", key: "status", width: 14 },
  { header: "First EMI", key: "firstEmi", width: 14 },
  { header: "ID", key: "id", width: 18 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 }
];

const loanColumns = [
  ...loanBaseColumns,
  ...Array.from({ length: 60 }, (_, index) => ({ header: `Month ${index + 1}`, key: `m_${index + 1}`, width: 14 }))
];

const familyExpenseColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Expense Date", key: "expenseDate", width: 14 },
  { header: "Family Member / Expense Group", key: "familyMember", width: 28 },
  { header: "Expense Category", key: "expenseCategory", width: 24 },
  { header: "Description", key: "description", width: 34 },
  { header: "Amount", key: "amount", width: 14 },
  { header: "Payment Mode", key: "paymentMode", width: 18 },
  { header: "Paid From Account", key: "paidFromAccount", width: 22 },
  { header: "Month", key: "month", width: 14 },
  { header: "Financial Year", key: "financialYear", width: 16 },
  { header: "Recurring Expense", key: "recurringExpense", width: 18 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const salaryIncomeColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Income Date", key: "incomeDate", width: 14 },
  { header: "Employer / Source", key: "employerSource", width: 26 },
  { header: "Salary Month", key: "salaryMonth", width: 16 },
  { header: "Gross Salary", key: "grossSalary", width: 16 },
  { header: "Basic Salary", key: "basicSalary", width: 16 },
  { header: "Allowances", key: "allowances", width: 16 },
  { header: "Bonus / Incentives", key: "bonusIncentives", width: 18 },
  { header: "PF Deduction", key: "pfDeduction", width: 16 },
  { header: "Tax Deduction", key: "taxDeduction", width: 16 },
  { header: "Other Deductions", key: "otherDeductions", width: 18 },
  { header: "Net Salary", key: "netSalary", width: 16 },
  { header: "Rental Income", key: "rentalIncome", width: 16 },
  { header: "Agricultural Income", key: "agriculturalIncome", width: 20 },
  { header: "Other Income", key: "otherIncome", width: 16 },
  { header: "Total Monthly Income", key: "totalMonthlyIncome", width: 20 },
  { header: "UAN", key: "uan", width: 18 },
  { header: "Passbook", key: "passbook", width: 18 },
  { header: "Employer", key: "employer", width: 24 },
  { header: "PF Balance", key: "pfBalance", width: 18 },
  { header: "Pension", key: "pension", width: 18 },
  { header: "Monthly Contribution", key: "monthlyContribution", width: 20 },
  { header: "Growth", key: "growth", width: 18 },
  { header: "Financial Year", key: "financialYear", width: 16 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const farmManagerColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Record Type", key: "recordType", width: 18 },
  { header: "Farm ID", key: "farmId", width: 18 },
  { header: "Farm Name", key: "farmName", width: 24 },
  { header: "Village", key: "village", width: 18 },
  { header: "Mandal", key: "mandal", width: 18 },
  { header: "District", key: "district", width: 18 },
  { header: "Survey Number", key: "surveyNumber", width: 18 },
  { header: "Ownership Type", key: "ownershipType", width: 18 },
  { header: "Total Area", key: "totalArea", width: 14 },
  { header: "Cultivated Area", key: "cultivatedArea", width: 16 },
  { header: "Unit", key: "unit", width: 12 },
  { header: "Crop Name", key: "cropName", width: 20 },
  { header: "Season", key: "season", width: 16 },
  { header: "Financial Year", key: "financialYear", width: 16 },
  { header: "Expense Category", key: "expenseCategory", width: 22 },
  { header: "Farm Expense", key: "farmExpense", width: 16 },
  { header: "Gross Sale Amount", key: "grossSaleAmount", width: 18 },
  { header: "Net Sale Amount", key: "netSaleAmount", width: 18 },
  { header: "Profit / Loss", key: "profitLoss", width: 16 },
  { header: "Payment Status", key: "paymentStatus", width: 18 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const farmInventoryColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Farm ID", key: "farmId", width: 18 },
  { header: "Farm Name", key: "farmName", width: 24 },
  { header: "Item Name", key: "itemName", width: 24 },
  { header: "Item Category", key: "itemCategory", width: 22 },
  { header: "Quantity In Stock", key: "quantityInStock", width: 18 },
  { header: "Unit", key: "unit", width: 12 },
  { header: "Purchase Price", key: "purchasePrice", width: 16 },
  { header: "Stock Value", key: "stockValue", width: 18 },
  { header: "Reorder Level", key: "reorderLevel", width: 16 },
  { header: "Status", key: "status", width: 16 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const goalsPlanningColumns = [
  { header: "Goal ID", key: "goalId", width: 18 },
  { header: "Goal Name", key: "goalName", width: 26 },
  { header: "Goal Category", key: "goalCategory", width: 22 },
  { header: "Target Amount", key: "targetAmount", width: 16 },
  { header: "Amount Saved", key: "amountSaved", width: 16 },
  { header: "Remaining Amount", key: "remainingAmount", width: 18 },
  { header: "Start Date", key: "startDate", width: 14 },
  { header: "Target Date", key: "targetDate", width: 14 },
  { header: "Priority", key: "priority", width: 14 },
  { header: "Status", key: "status", width: 16 },
  { header: "Progress Percentage", key: "progressPercentage", width: 20 },
  { header: "Notes", key: "notes", width: 34 }
];

const taxPlannerColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Financial Year", key: "financialYear", width: 16 },
  { header: "Tax Regime", key: "taxRegime", width: 16 },
  { header: "Annual Salary", key: "annualSalary", width: 18 },
  { header: "Agricultural Income", key: "agriculturalIncome", width: 20 },
  { header: "Other Income", key: "otherIncome", width: 16 },
  { header: "Deductions 80C", key: "deductions80c", width: 18 },
  { header: "Health Insurance", key: "healthInsurance", width: 18 },
  { header: "Home Loan Interest", key: "homeLoanInterest", width: 20 },
  { header: "Education Loan Interest", key: "educationLoanInterest", width: 22 },
  { header: "Taxable Income", key: "taxableIncome", width: 18 },
  { header: "Estimated Income Tax", key: "estimatedIncomeTax", width: 20 },
  { header: "Advance Tax", key: "advanceTax", width: 16 },
  { header: "Tax Already Deducted", key: "taxAlreadyDeducted", width: 22 },
  { header: "Remaining Tax Payable", key: "remainingTaxPayable", width: 22 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const taxSummaryColumns = [
  { header: "Financial Year", key: "financialYear", width: 16 },
  { header: "Annual Salary", key: "annualSalary", width: 18 },
  { header: "Taxable Income", key: "taxableIncome", width: 18 },
  { header: "Estimated Tax", key: "estimatedTax", width: 18 },
  { header: "Tax Paid", key: "taxPaid", width: 16 },
  { header: "Pending Tax", key: "pendingTax", width: 16 },
  { header: "Old Regime Tax", key: "oldRegimeTax", width: 18 },
  { header: "New Regime Tax", key: "newRegimeTax", width: 18 },
  { header: "Tax Saved", key: "taxSaved", width: 16 },
  { header: "Last Updated", key: "lastUpdated", width: 22 }
];

const portfolioColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Asset Type", key: "assetType", width: 18 },
  { header: "Symbol / Name", key: "symbolName", width: 24 },
  { header: "Invested Date", key: "investedDate", width: 16 },
  { header: "Average Buy Price", key: "averageBuyPrice", width: 18 },
  { header: "Current Market Price", key: "currentMarketPrice", width: 20 },
  { header: "Quantity", key: "quantity", width: 14 },
  { header: "Invested Value", key: "investedValue", width: 18 },
  { header: "Current Value", key: "currentValue", width: 18 },
  { header: "Profit/Loss", key: "profitLoss", width: 16 },
  { header: "Profit %", key: "profitPercent", width: 14 },
  { header: "Notes", key: "notes", width: 34 }
];

const marketPulseColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Source", key: "source", width: 18 },
  { header: "Symbol / Name", key: "symbolName", width: 24 },
  { header: "Market Price", key: "marketPrice", width: 16 },
  { header: "Day Change", key: "dayChange", width: 16 },
  { header: "Day Change %", key: "dayChangePercent", width: 16 },
  { header: "Last Updated Timestamp", key: "lastUpdatedTimestamp", width: 24 },
  { header: "Notes", key: "notes", width: 34 }
];

const stockColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Symbol / Name", key: "symbolName", width: 24 },
  { header: "Exchange", key: "exchange", width: 16 },
  { header: "Quantity", key: "quantity", width: 14 },
  { header: "Average Buy Price", key: "averageBuyPrice", width: 18 },
  { header: "Invested Value", key: "investedValue", width: 18 },
  { header: "Current Value", key: "currentValue", width: 18 },
  { header: "Profit/Loss", key: "profitLoss", width: 16 },
  { header: "Invested Date", key: "investedDate", width: 16 },
  { header: "Notes", key: "notes", width: 34 }
];

const mutualFundColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Fund Name", key: "fundName", width: 28 },
  { header: "Folio Number", key: "folioNumber", width: 20 },
  { header: "Invested Date", key: "investedDate", width: 16 },
  { header: "Units", key: "units", width: 14 },
  { header: "Average NAV", key: "averageNav", width: 16 },
  { header: "Current NAV", key: "currentNav", width: 16 },
  { header: "Invested Value", key: "investedValue", width: 18 },
  { header: "Current Value", key: "currentValue", width: 18 },
  { header: "Profit/Loss", key: "profitLoss", width: 16 },
  { header: "Notes", key: "notes", width: 34 }
];

const businessProfileColumns = [
  { header: "Business ID", key: "businessId", width: 18 },
  { header: "Business Name", key: "businessName", width: 28 },
  { header: "Business Type", key: "businessType", width: 18 },
  { header: "Business Category", key: "businessCategory", width: 22 },
  { header: "Owner", key: "owner", width: 20 },
  { header: "Partner Names", key: "partnerNames", width: 28 },
  { header: "Registration Number", key: "registrationNumber", width: 24 },
  { header: "GST Number", key: "gstNumber", width: 20 },
  { header: "PAN", key: "pan", width: 16 },
  { header: "Business Start Date", key: "businessStartDate", width: 18 },
  { header: "Business Address", key: "businessAddress", width: 36 },
  { header: "Contact Number", key: "contactNumber", width: 18 },
  { header: "Email", key: "email", width: 26 },
  { header: "Website", key: "website", width: 28 },
  { header: "Status", key: "status", width: 16 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const businessInvestmentColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Business ID", key: "businessId", width: 18 },
  { header: "Business Name", key: "businessName", width: 28 },
  { header: "Investment Date", key: "investmentDate", width: 16 },
  { header: "Investor", key: "investor", width: 22 },
  { header: "Investment Type", key: "investmentType", width: 20 },
  { header: "Amount", key: "amount", width: 16 },
  { header: "Payment Mode", key: "paymentMode", width: 18 },
  { header: "Reference Number", key: "referenceNumber", width: 22 },
  { header: "Ownership %", key: "ownershipPercent", width: 14 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const businessIncomeColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Business ID", key: "businessId", width: 18 },
  { header: "Business Name", key: "businessName", width: 28 },
  { header: "Income Date", key: "incomeDate", width: 16 },
  { header: "Invoice Number", key: "invoiceNumber", width: 20 },
  { header: "Customer Name", key: "customerName", width: 24 },
  { header: "Income Category", key: "incomeCategory", width: 22 },
  { header: "Product / Service", key: "productService", width: 26 },
  { header: "Quantity", key: "quantity", width: 14 },
  { header: "Unit Price", key: "unitPrice", width: 16 },
  { header: "Gross Amount", key: "grossAmount", width: 18 },
  { header: "Discount", key: "discount", width: 16 },
  { header: "GST", key: "gst", width: 16 },
  { header: "Net Amount", key: "netAmount", width: 18 },
  { header: "Payment Received", key: "paymentReceived", width: 20 },
  { header: "Pending Amount", key: "pendingAmount", width: 18 },
  { header: "Payment Status", key: "paymentStatus", width: 18 },
  { header: "Payment Mode", key: "paymentMode", width: 18 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const businessExpenseColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Business ID", key: "businessId", width: 18 },
  { header: "Business Name", key: "businessName", width: 28 },
  { header: "Expense Date", key: "expenseDate", width: 16 },
  { header: "Expense Category", key: "expenseCategory", width: 24 },
  { header: "Vendor / Paid To", key: "vendorPaidTo", width: 26 },
  { header: "Description", key: "description", width: 34 },
  { header: "Quantity", key: "quantity", width: 14 },
  { header: "Unit Price", key: "unitPrice", width: 16 },
  { header: "Amount", key: "amount", width: 16 },
  { header: "GST", key: "gst", width: 16 },
  { header: "Total Amount", key: "totalAmount", width: 18 },
  { header: "Payment Status", key: "paymentStatus", width: 18 },
  { header: "Payment Mode", key: "paymentMode", width: 18 },
  { header: "Paid From Account", key: "paidFromAccount", width: 22 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const businessAssetColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Business ID", key: "businessId", width: 18 },
  { header: "Business Name", key: "businessName", width: 28 },
  { header: "Asset Name", key: "assetName", width: 24 },
  { header: "Asset Category", key: "assetCategory", width: 22 },
  { header: "Purchase Date", key: "purchaseDate", width: 16 },
  { header: "Purchase Value", key: "purchaseValue", width: 18 },
  { header: "Current Value", key: "currentValue", width: 18 },
  { header: "Location", key: "location", width: 22 },
  { header: "Status", key: "status", width: 16 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const businessLiabilityColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Business ID", key: "businessId", width: 18 },
  { header: "Business Name", key: "businessName", width: 28 },
  { header: "Liability Name", key: "liabilityName", width: 24 },
  { header: "Liability Category", key: "liabilityCategory", width: 22 },
  { header: "Borrowed From", key: "borrowedFrom", width: 24 },
  { header: "Start Date", key: "startDate", width: 16 },
  { header: "Principal", key: "principal", width: 16 },
  { header: "Interest Percentage", key: "interestPercentage", width: 20 },
  { header: "Amount Paid", key: "amountPaid", width: 16 },
  { header: "Outstanding Amount", key: "outstandingAmount", width: 20 },
  { header: "Status", key: "status", width: 16 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const businessPartyColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Business ID", key: "businessId", width: 18 },
  { header: "Business Name", key: "businessName", width: 28 },
  { header: "Party Name", key: "partyName", width: 24 },
  { header: "Due Date", key: "dueDate", width: 16 },
  { header: "Amount", key: "amount", width: 16 },
  { header: "Amount Paid", key: "amountPaid", width: 16 },
  { header: "Balance Amount", key: "balanceAmount", width: 18 },
  { header: "Status", key: "status", width: 16 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const businessInventoryColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Business ID", key: "businessId", width: 18 },
  { header: "Business Name", key: "businessName", width: 28 },
  { header: "Item Name", key: "itemName", width: 24 },
  { header: "Item Category", key: "itemCategory", width: 22 },
  { header: "SKU", key: "sku", width: 16 },
  { header: "Quantity In Stock", key: "quantityInStock", width: 18 },
  { header: "Unit", key: "unit", width: 12 },
  { header: "Purchase Price", key: "purchasePrice", width: 16 },
  { header: "Sale Price", key: "salePrice", width: 16 },
  { header: "Stock Value", key: "stockValue", width: 18 },
  { header: "Reorder Level", key: "reorderLevel", width: 16 },
  { header: "Status", key: "status", width: 16 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const goalColumns = [
  { header: "Goal ID", key: "goalId", width: 18 },
  { header: "Goal Name", key: "goalName", width: 26 },
  { header: "Goal Category", key: "goalCategory", width: 24 },
  { header: "Family Member", key: "familyMember", width: 22 },
  { header: "Target Amount", key: "targetAmount", width: 16 },
  { header: "Amount Saved", key: "amountSaved", width: 16 },
  { header: "Remaining Amount", key: "remainingAmount", width: 18 },
  { header: "Start Date", key: "startDate", width: 14 },
  { header: "Target Date", key: "targetDate", width: 14 },
  { header: "Monthly Contribution Target", key: "monthlyContributionTarget", width: 24 },
  { header: "Remaining Months", key: "remainingMonths", width: 18 },
  { header: "Required Monthly Contribution", key: "requiredMonthlyContribution", width: 28 },
  { header: "Priority", key: "priority", width: 14 },
  { header: "Status", key: "status", width: 16 },
  { header: "Progress Percentage", key: "progressPercentage", width: 20 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const goalContributionColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Contribution Date", key: "contributionDate", width: 18 },
  { header: "Goal ID", key: "goalId", width: 18 },
  { header: "Goal Name", key: "goalName", width: 26 },
  { header: "Amount", key: "amount", width: 16 },
  { header: "Paid From Account", key: "paidFromAccount", width: 22 },
  { header: "Payment Mode", key: "paymentMode", width: 18 },
  { header: "Reference Number", key: "referenceNumber", width: 22 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Linked Bank Cash ID", key: "linkedBankCashId", width: 22 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const goalCategoryColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Category Name", key: "categoryName", width: 28 },
  { header: "Status", key: "status", width: 16 },
  { header: "Default Category", key: "defaultCategory", width: 18 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const bankCashColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Date", key: "date", width: 14 },
  { header: "Account Name", key: "accountName", width: 24 },
  { header: "Account Type", key: "accountType", width: 18 },
  { header: "Transaction Type", key: "transactionType", width: 20 },
  { header: "Category", key: "category", width: 20 },
  { header: "Amount", key: "amount", width: 16 },
  { header: "Payment Mode", key: "paymentMode", width: 18 },
  { header: "Reference Number", key: "referenceNumber", width: 22 },
  { header: "Linked Module", key: "linkedModule", width: 20 },
  { header: "Linked Record ID", key: "linkedRecordId", width: 22 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const insuranceColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Policy Name", key: "policyName", width: 26 },
  { header: "Policy Type", key: "policyType", width: 18 },
  { header: "Insurer", key: "insurer", width: 24 },
  { header: "Policy Number", key: "policyNumber", width: 22 },
  { header: "Family Member", key: "familyMember", width: 22 },
  { header: "Start Date", key: "startDate", width: 14 },
  { header: "End Date", key: "endDate", width: 14 },
  { header: "Premium Amount", key: "premiumAmount", width: 18 },
  { header: "Coverage Amount", key: "coverageAmount", width: 18 },
  { header: "Payment Frequency", key: "paymentFrequency", width: 20 },
  { header: "Status", key: "status", width: 16 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const documentVaultColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Document Name", key: "documentName", width: 28 },
  { header: "Document Category", key: "documentCategory", width: 24 },
  { header: "Owner", key: "owner", width: 20 },
  { header: "Document Number", key: "documentNumber", width: 22 },
  { header: "Issue Date", key: "issueDate", width: 14 },
  { header: "Expiry Date", key: "expiryDate", width: 14 },
  { header: "Storage Location", key: "storageLocation", width: 28 },
  { header: "Renewal Required", key: "renewalRequired", width: 18 },
  { header: "Status", key: "status", width: 16 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const billUtilitiesColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Bill Date", key: "billDate", width: 14 },
  { header: "Due Date", key: "dueDate", width: 14 },
  { header: "Bill Type", key: "billType", width: 18 },
  { header: "Provider", key: "provider", width: 24 },
  { header: "Account Number", key: "accountNumber", width: 22 },
  { header: "Amount", key: "amount", width: 16 },
  { header: "Paid Amount", key: "paidAmount", width: 16 },
  { header: "Balance Amount", key: "balanceAmount", width: 18 },
  { header: "Payment Mode", key: "paymentMode", width: 18 },
  { header: "Status", key: "status", width: 16 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const financialCalendarColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Event Date", key: "eventDate", width: 14 },
  { header: "Event Type", key: "eventType", width: 20 },
  { header: "Title", key: "title", width: 28 },
  { header: "Related Module", key: "relatedModule", width: 20 },
  { header: "Amount", key: "amount", width: 16 },
  { header: "Reminder Date", key: "reminderDate", width: 16 },
  { header: "Status", key: "status", width: 16 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const budgetPlannerColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Budget Month", key: "budgetMonth", width: 16 },
  { header: "Category", key: "category", width: 22 },
  { header: "Planned Amount", key: "plannedAmount", width: 18 },
  { header: "Actual Amount", key: "actualAmount", width: 18 },
  { header: "Variance", key: "variance", width: 16 },
  { header: "Family Member", key: "familyMember", width: 22 },
  { header: "Status", key: "status", width: 16 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const backupRestoreColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Backup Date", key: "backupDate", width: 16 },
  { header: "Backup Type", key: "backupType", width: 18 },
  { header: "File Name", key: "fileName", width: 32 },
  { header: "Location", key: "location", width: 36 },
  { header: "Status", key: "status", width: 16 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const exportCenterColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Export Date", key: "exportDate", width: 16 },
  { header: "Export Type", key: "exportType", width: 18 },
  { header: "Module", key: "module", width: 20 },
  { header: "File Name", key: "fileName", width: 32 },
  { header: "Format", key: "format", width: 14 },
  { header: "Status", key: "status", width: 16 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const notificationCenterColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Notification Date", key: "notificationDate", width: 18 },
  { header: "Module", key: "module", width: 20 },
  { header: "Title", key: "title", width: 28 },
  { header: "Priority", key: "priority", width: 14 },
  { header: "Status", key: "status", width: 16 },
  { header: "Due Date", key: "dueDate", width: 14 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const familyIncomeColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Income Date", key: "incomeDate", width: 16 },
  { header: "Income Source", key: "incomeSource", width: 24 },
  { header: "Expected Amount", key: "expectedAmount", width: 18 },
  { header: "Income Received", key: "incomeReceived", width: 18 },
  { header: "Pending Income", key: "pendingIncome", width: 18 },
  { header: "Status", key: "status", width: 16 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const childrenExpensesColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Expense Date", key: "expenseDate", width: 16 },
  { header: "Child Name", key: "childName", width: 22 },
  { header: "Category", key: "category", width: 22 },
  { header: "Planned Amount", key: "plannedAmount", width: 18 },
  { header: "Paid Amount", key: "paidAmount", width: 18 },
  { header: "Pending Amount", key: "pendingAmount", width: 18 },
  { header: "Payment Mode", key: "paymentMode", width: 16 },
  { header: "Status", key: "status", width: 16 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const personalMaintenanceColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Expense Date", key: "expenseDate", width: 16 },
  { header: "Category", key: "category", width: 22 },
  { header: "Planned Amount", key: "plannedAmount", width: 18 },
  { header: "Paid Amount", key: "paidAmount", width: 18 },
  { header: "Pending Amount", key: "pendingAmount", width: 18 },
  { header: "Payment Mode", key: "paymentMode", width: 16 },
  { header: "Status", key: "status", width: 16 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const savingsColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Savings Date", key: "savingsDate", width: 16 },
  { header: "Account Name", key: "accountName", width: 24 },
  { header: "Savings Type", key: "savingsType", width: 20 },
  { header: "Total Savings", key: "totalSavings", width: 18 },
  { header: "Interest Earned", key: "interestEarned", width: 18 },
  { header: "Growth", key: "growth", width: 18 },
  { header: "Status", key: "status", width: 16 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const agricultureFarmRecordsColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Record Date", key: "recordDate", width: 16 },
  { header: "Farm Name", key: "farmName", width: 24 },
  { header: "Crop / Activity", key: "cropActivity", width: 24 },
  { header: "Total Farm Income", key: "totalFarmIncome", width: 18 },
  { header: "Income Received", key: "incomeReceived", width: 18 },
  { header: "Pending Income", key: "pendingIncome", width: 18 },
  { header: "Expense Amount", key: "expenseAmount", width: 18 },
  { header: "Profit/Loss", key: "profitLoss", width: 18 },
  { header: "Status", key: "status", width: 16 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const otherAssetsColumns = [
  { header: "ID", key: "id", width: 18 },
  { header: "Asset Date", key: "assetDate", width: 16 },
  { header: "Asset Name", key: "assetName", width: 24 },
  { header: "Asset Type", key: "assetType", width: 20 },
  { header: "Total Asset Value", key: "totalAssetValue", width: 18 },
  { header: "Current Value", key: "currentValue", width: 18 },
  { header: "Income/Profit", key: "incomeProfit", width: 18 },
  { header: "Status", key: "status", width: 16 },
  { header: "Notes", key: "notes", width: 34 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Last Updated", key: "lastUpdated", width: 22 },
  { header: "Sync Status", key: "syncStatus", width: 16 }
];

const masterSpecSheetDefinitions = [
  { name: "Family Expenses", columns: familyExpenseColumns, moneyKeys: ["amount"] },
  { name: "Family Income", columns: familyIncomeColumns, moneyKeys: ["expectedAmount", "incomeReceived", "pendingIncome"] },
  { name: "Children Expenses", columns: childrenExpensesColumns, moneyKeys: ["plannedAmount", "paidAmount", "pendingAmount"] },
  { name: "Personal Maintenance", columns: personalMaintenanceColumns, moneyKeys: ["plannedAmount", "paidAmount", "pendingAmount"] },
  { name: "Salary & Income", columns: salaryIncomeColumns, moneyKeys: ["grossSalary", "basicSalary", "allowances", "bonusIncentives", "pfDeduction", "taxDeduction", "otherDeductions", "netSalary", "rentalIncome", "agriculturalIncome", "otherIncome", "totalMonthlyIncome", "pfBalance", "pension", "monthlyContribution", "growth"] },
  { name: "Farm Manager", columns: farmManagerColumns, moneyKeys: ["farmExpense", "grossSaleAmount", "netSaleAmount", "profitLoss"] },
  { name: "Farm Inventory", columns: farmInventoryColumns, moneyKeys: ["quantityInStock", "purchasePrice", "stockValue", "reorderLevel"] },
  { name: "Agriculture Farm Records", columns: agricultureFarmRecordsColumns, moneyKeys: ["totalFarmIncome", "incomeReceived", "pendingIncome", "expenseAmount", "profitLoss"] },
  { name: "Goals & Planning", columns: goalsPlanningColumns, moneyKeys: ["targetAmount", "amountSaved", "remainingAmount"] },
  { name: "Goals and Planning", columns: goalsPlanningColumns, moneyKeys: ["targetAmount", "amountSaved", "remainingAmount"] },
  { name: "Savings", columns: savingsColumns, moneyKeys: ["totalSavings", "interestEarned", "growth"] },
  { name: "Other Assets", columns: otherAssetsColumns, moneyKeys: ["totalAssetValue", "currentValue", "incomeProfit"] },
  { name: "Business Profile", columns: businessProfileColumns, moneyKeys: [] },
  { name: "Business Investment", columns: businessInvestmentColumns, moneyKeys: ["amount", "ownershipPercent"] },
  { name: "Business Income", columns: businessIncomeColumns, moneyKeys: ["quantity", "unitPrice", "grossAmount", "discount", "gst", "netAmount", "paymentReceived", "pendingAmount"] },
  { name: "Business Expenses", columns: businessExpenseColumns, moneyKeys: ["quantity", "unitPrice", "amount", "gst", "totalAmount"] },
  { name: "Business Assets", columns: businessAssetColumns, moneyKeys: ["purchaseValue", "currentValue"] },
  { name: "Business Liabilities", columns: businessLiabilityColumns, moneyKeys: ["principal", "interestPercentage", "amountPaid", "outstandingAmount"] },
  { name: "Business Receivables", columns: businessPartyColumns, moneyKeys: ["amount", "amountPaid", "balanceAmount"] },
  { name: "Business Payables", columns: businessPartyColumns, moneyKeys: ["amount", "amountPaid", "balanceAmount"] },
  { name: "Business Inventory", columns: businessInventoryColumns, moneyKeys: ["quantityInStock", "purchasePrice", "salePrice", "stockValue", "reorderLevel"] },
  { name: "Goals", columns: goalColumns, moneyKeys: ["targetAmount", "amountSaved", "remainingAmount", "monthlyContributionTarget", "requiredMonthlyContribution", "progressPercentage"] },
  { name: "Goal Contributions", columns: goalContributionColumns, moneyKeys: ["amount"] },
  { name: "Goal Categories", columns: goalCategoryColumns, moneyKeys: [] },
  { name: "Bank & Cash Manager", columns: bankCashColumns, moneyKeys: ["amount"] },
  { name: "Insurance Manager", columns: insuranceColumns, moneyKeys: ["premiumAmount", "coverageAmount"] },
  { name: "Document Vault", columns: documentVaultColumns, moneyKeys: [] },
  { name: "Bill & Utilities", columns: billUtilitiesColumns, moneyKeys: ["amount", "paidAmount", "balanceAmount"] },
  { name: "Financial Calendar", columns: financialCalendarColumns, moneyKeys: ["amount"] },
  { name: "Budget Planner", columns: budgetPlannerColumns, moneyKeys: ["plannedAmount", "actualAmount", "variance"] },
  { name: "Backup & Restore", columns: backupRestoreColumns, moneyKeys: [] },
  { name: "Export Center", columns: exportCenterColumns, moneyKeys: [] },
  { name: "Notification Center", columns: notificationCenterColumns, moneyKeys: [] },
  { name: "Tax Planner", columns: taxPlannerColumns, moneyKeys: ["annualSalary", "agriculturalIncome", "otherIncome", "deductions80c", "healthInsurance", "homeLoanInterest", "educationLoanInterest", "taxableIncome", "estimatedIncomeTax", "advanceTax", "taxAlreadyDeducted", "remainingTaxPayable"] },
  { name: "Tax Summary", columns: taxSummaryColumns, moneyKeys: ["annualSalary", "taxableIncome", "estimatedTax", "taxPaid", "pendingTax", "oldRegimeTax", "newRegimeTax", "taxSaved"] },
  { name: "Market Pulse", columns: marketPulseColumns, moneyKeys: ["marketPrice", "dayChange", "dayChangePercent"] },
  { name: "Portfolio", columns: portfolioColumns, moneyKeys: ["averageBuyPrice", "currentMarketPrice", "quantity", "investedValue", "currentValue", "profitLoss", "profitPercent"] },
  { name: "Stocks", columns: stockColumns, moneyKeys: ["quantity", "averageBuyPrice", "investedValue", "currentValue", "profitLoss"] },
  { name: "Mutual Funds", columns: mutualFundColumns, moneyKeys: ["units", "averageNav", "currentNav", "investedValue", "currentValue", "profitLoss"] }
];

const entryTypes = {
  debt_given: "Amount Lent",
  debt_cleared: "Amount Recovered",
  interest_received: "Interest Received",
  chitty_paid: "Chitty Paid",
  chitty_received: "Chitty Received",
  month_entry: "Month Entry"
};

const legacyRecordPrefix = "LEGACY";

function money(value) {
  const parsed = Number(typeof value === "string" ? value.replace(/,/g, "") : value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeText(value) {
  return String(value || "").trim();
}

function normalizeFundType(value) {
  const text = safeText(value).toLowerCase();
  if (text.includes("bank")) return "Bank Loan";
  if (text.includes("hand")) return "Hand Loan";
  return text ? "Bank Loan" : "";
}

function daysBetween(startDate, endDate = new Date()) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 0);
}

function handLoanAmount(principal, borrowedDate, asOfDate = new Date()) {
  const interest = money(principal) * 0.24 * (daysBetween(borrowedDate, asOfDate) / 365);
  return money(principal) + interest;
}

function formatIndianMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(money(value));
}

function formatRateValue(value) {
  if (typeof value === "string" && value.trim()) return value.trim();
  const numericRate = money(value);
  const rate = numericRate > 0 && numericRate <= 1 ? numericRate * 100 : numericRate;
  return Number.isInteger(rate) ? String(rate) : rate.toFixed(2);
}

function formatInterestDisplay(rate, total, interest) {
  const rateLabel = typeof rate === "string" && rate.trim() && Number.isNaN(Number(rate))
    ? `${rate.trim()} yearly`
    : `${formatRateValue(rate)}% yearly`;
  return `${rateLabel}: ${formatIndianMoney(total)} (${formatIndianMoney(interest)} interest)`;
}

function loanInterestDetails({ typeOfFund, principal, interestPercentage, borrowedDate, emi, tenureMonths, finishedMonths, remainingLoanAmount }) {
  const rate = money(interestPercentage) || (typeOfFund === "Hand Loan" ? 24 : 0);
  if (typeOfFund === "Hand Loan") {
    const accruedInterest = Math.max(handLoanAmount(principal, borrowedDate || nowIso().slice(0, 10)) - money(principal), 0);
    const remainingInterest = Math.min(accruedInterest, Math.max(money(remainingLoanAmount), 0));
    return { rate, loanInterest: accruedInterest, remainingInterest };
  }
  const totalInterest = money(emi) * money(tenureMonths);
  const paidInterest = money(emi) * money(finishedMonths);
  return {
    rate,
    loanInterest: totalInterest,
    remainingInterest: Math.max(totalInterest - paidInterest, 0)
  };
}

function loanStatus(tenureMonths, finishedMonths) {
  return money(tenureMonths) > 0 && money(finishedMonths) >= money(tenureMonths) ? "Cleared" : "On-Going";
}

function cellValue(cell) {
  const value = cell && cell.value;
  if (value && typeof value === "object") {
    if (value.result !== undefined) return value.result;
    if (value.text !== undefined) return value.text;
    if (value.richText) return value.richText.map((part) => part.text).join("");
  }
  return value;
}

function formatDateValue(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value).trim();
  if (!text || ["-", "--", "na", "n/a", "nan", "null", "undefined"].includes(text.toLowerCase())) return "";
  const dayMonthYear = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dayMonthYear) {
    const [, day, month, year] = dayMonthYear;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(parsed.toISOString())) {
    return parsed.toISOString().slice(0, 10);
  }
  return text;
}

function formatMonthValue(value) {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 7);
}

function numberOrBlank(value) {
  if (value === "" || value === null || value === undefined) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : "";
}

function nowIso() {
  return new Date().toISOString();
}

function parseDateLike(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const text = safeText(value);
  if (!text) return null;
  const ddMmmYyyy = text.match(/^(\d{1,2})[-\s]([A-Za-z]{3,})[-\s](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (ddMmmYyyy) {
    const [, day, monthText, year, hour = "0", minute = "0", second = "0"] = ddMmmYyyy;
    const monthIndex = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(monthText.slice(0, 3).toLowerCase());
    if (monthIndex >= 0) {
      const parsed = new Date(Date.UTC(Number(year), monthIndex, Number(day), Number(hour), Number(minute), Number(second)));
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }
  const formattedDate = formatDateValue(text);
  const parsed = new Date(formattedDate || text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateOnly(value) {
  const parsed = parseDateLike(value);
  return parsed ? parsed.toISOString().slice(0, 10) : "";
}

function financialYearForDate(value) {
  const parsed = parseDateLike(value);
  if (!parsed) return "";
  const month = parsed.getUTCMonth() + 1;
  const year = parsed.getUTCFullYear();
  const startYear = month >= 4 ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

function sameInstrumentKey(value) {
  return safeText(value).toUpperCase().replace(/\s+/g, "");
}

function extractDataArray(body) {
  if (Array.isArray(body)) return body;
  const data = body && body.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.trades)) return data.trades;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.results)) return data.results;
  if (data && data.data && Array.isArray(data.data)) return data.data;
  return [];
}

function elapsedYearsSince(dateValue, endDate = new Date()) {
  const dateText = formatDateValue(dateValue);
  const startDate = new Date(dateText || "");
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
  const elapsedMs = Math.max(endDate.getTime() - startDate.getTime(), 0);
  return elapsedMs / (365 * 24 * 60 * 60 * 1000);
}

function debtAccruedInterest(debtGiven, dateGiven, endDate = new Date()) {
  const principal = money(debtGiven);
  if (principal <= 0) return 0;
  const calculationEnd = endDate instanceof Date
    ? endDate
    : new Date(formatDateValue(endDate) || nowIso());
  if (Number.isNaN(calculationEnd.getTime())) return 0;
  return principal * annualDebtInterestRate * elapsedYearsSince(dateGiven, calculationEnd);
}

function debtOutstandingInterest(debtGiven, dateGiven) {
  const outstanding = debtAccruedInterest(debtGiven, dateGiven, new Date());
  return Number.isFinite(outstanding) ? Math.max(outstanding, 0) : 0;
}

function debtOutstandingInterestForStatus(status, debtGiven, dateGiven, manualOutstandingInterest = 0) {
  return normalizeStatus(status) === "Pending"
    ? debtOutstandingInterest(debtGiven, dateGiven)
    : money(manualOutstandingInterest);
}

function debtColumnNumber(header) {
  return debtColumns.findIndex((column) => column.header === header) + 1;
}

function pendingDebtInterestFormula(rowNumber) {
  const debtGivenCell = `D${rowNumber}`;
  const dateGivenCell = `E${rowNumber}`;
  return `IFERROR(MAX(0,${debtGivenCell}*24%*(NOW()-IF(ISNUMBER(${dateGivenCell}),${dateGivenCell},DATE(VALUE(LEFT(${dateGivenCell},4)),VALUE(MID(${dateGivenCell},6,2)),VALUE(RIGHT(${dateGivenCell},2)))))/365),0)`;
}

function balanceWithInterestFormula(rowNumber) {
  return `L${rowNumber}+M${rowNumber}`;
}

function applyDebtSheetCalculationCells(row, status, outstandingInterest, balanceWithInterest, context = null) {
  const outstandingInterestColumn = context ? context.column("Outstanding Interest") : debtColumnNumber("Outstanding Interest");
  const balanceWithInterestColumn = context ? context.column("Balance With Interest") : debtColumnNumber("Balance With Interest");
  if (outstandingInterestColumn) {
    row.getCell(outstandingInterestColumn).value = normalizeStatus(status) === "Pending"
      ? { formula: pendingDebtInterestFormula(row.number), result: outstandingInterest }
      : outstandingInterest;
  }
  if (balanceWithInterestColumn) {
    row.getCell(balanceWithInterestColumn).value = {
      formula: balanceWithInterestFormula(row.number),
      result: balanceWithInterest
    };
  }
}

function debtInterestBetween(principal, dateGiven, endDate) {
  const formattedEndDate = formatDateValue(endDate);
  if (!formattedEndDate) return 0;
  return debtAccruedInterest(principal, dateGiven, formattedEndDate);
}

function clearedDateFromNotes(notes) {
  const match = safeText(notes).match(/Received date:\s*([0-9-]+)/i);
  return match ? formatDateValue(match[1]) : "";
}

function normalizeStatus(value) {
  const status = safeText(value).toLowerCase();
  if (status.includes("clear") || status.includes("received")) return "Cleared";
  if (status.includes("partial")) return "Partial";
  if (status.includes("pending")) return "Pending";
  return safeText(value);
}

function statusRank(status) {
  const normalized = normalizeStatus(status);
  if (normalized === "Cleared") return 3;
  if (normalized === "Partial") return 2;
  if (normalized === "Pending") return 1;
  return 0;
}

function latestTimestamp(records) {
  return records
    .map((record) => new Date(record.lastUpdated || record.createdAt || record.date || record.month || 0).getTime())
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a)[0] || 0;
}

async function appendSyncLog(message, error) {
  const text = [
    `[${nowIso()}] ${message}`,
    error ? (error.stack || error.message || String(error)) : ""
  ].filter(Boolean).join("\n");
  await fs.appendFile(syncLogPath, `${text}\n\n`).catch(() => {});
}

async function waitForWorkbookWriteToFinish() {
  for (let attempt = 0; workbookWriteInProgress && attempt < 20; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

async function waitForWorkbookSyncToFinish() {
  for (let attempt = 0; syncInProgress && attempt < 120; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (syncInProgress) {
    throw new Error("Workbook synchronization is still busy. Please try again in a few seconds.");
  }
}

async function validateWorkbookFileAfterSwap(workbookPath, attempt = 1) {
  try {
    const finalValidationWorkbook = new ExcelJS.Workbook();
    await finalValidationWorkbook.xlsx.readFile(workbookPath);
    return true;
  } catch (error) {
    const transient = error.code === "ENOENT" || /file not found|end of central directory/i.test(error.message || "");
    if (transient && attempt < 6) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 250));
      return validateWorkbookFileAfterSwap(workbookPath, attempt + 1);
    }
    throw error;
  }
}

async function writeWorkbookWithRetry(workbook, workbookPath, attempt = 1) {
  const tempPath = path.join(path.dirname(workbookPath), `.${path.basename(workbookPath)}.write-${process.pid}-${Date.now()}.tmp.xlsx`);
  const backupPath = path.join(path.dirname(workbookPath), `.${path.basename(workbookPath)}.previous-${process.pid}-${Date.now()}.bak.xlsx`);
  let movedExistingWorkbook = false;
  try {
    await workbook.xlsx.writeFile(tempPath);
    const validationWorkbook = new ExcelJS.Workbook();
    await validationWorkbook.xlsx.readFile(tempPath);
    if (!workbookHasFinanceData(validationWorkbook)) {
      const healthy = await findHealthyWorkbookBackup(workbookPath);
      if (healthy) {
        await archiveRejectedWorkbook(tempPath, "header-only-write-rejected");
        throw new Error(`Rejected header-only workbook write because healthy finance data exists in backup: ${financeStatsText(healthy.stats)}`);
      }
    }
    const hadWorkbook = await exists(workbookPath);
    workbookWriteInProgress = true;
    try {
      if (hadWorkbook) {
        await fs.rename(workbookPath, backupPath);
        movedExistingWorkbook = true;
      }
      try {
        await fs.rename(tempPath, workbookPath);
        await validateWorkbookFileAfterSwap(workbookPath);
        await fs.unlink(backupPath).catch(() => {});
      } catch (swapError) {
        await fs.unlink(workbookPath).catch(() => {});
        if (hadWorkbook) await fs.rename(backupPath, workbookPath).catch(() => {});
        throw swapError;
      }
    } finally {
      workbookWriteInProgress = false;
    }
    const stat = await fs.stat(workbookPath).catch(() => null);
    if (stat) lastWorkbookMtime = stat.mtimeMs;
    await ensureWeeklyLocalBackup(workbookPath);
    return true;
  } catch (error) {
    workbookWriteInProgress = false;
    await fs.unlink(tempPath).catch(() => {});
    if (movedExistingWorkbook && !(await exists(workbookPath))) {
      await fs.rename(backupPath, workbookPath).catch(() => {});
    } else if (!movedExistingWorkbook) {
      await fs.unlink(backupPath).catch(() => {});
    }
    if ((error.code === "EBUSY" || error.code === "EPERM") && attempt < 4) {
      await appendSyncLog(`Workbook is locked; retrying write attempt ${attempt + 1}.`, error);
      await new Promise((resolve) => setTimeout(resolve, attempt * 2500));
      return writeWorkbookWithRetry(workbook, workbookPath, attempt + 1);
    }
    if (error.code === "EBUSY" || error.code === "EPERM") {
      await updateConfig({ lastSyncError: "Excel workbook is open or locked. Close it to allow the pending sync to finish." });
      setTimeout(() => syncWorkbookFromDisk("locked workbook retry").catch(() => {}), 10000);
    }
    throw error;
  }
}

async function readWorkbookWithRetry(workbook, workbookPath, attempt = 1) {
  try {
    await waitForWorkbookWriteToFinish();
    await workbook.xlsx.readFile(workbookPath);
    return true;
  } catch (error) {
    const transientRead = error.code === "ENOENT" || /end of central directory|file not found/i.test(error.message || "");
    const maxAttempts = transientRead ? 8 : 4;
    if (attempt < maxAttempts) {
      await appendSyncLog(`Workbook read failed; retrying read attempt ${attempt + 1}.`, error);
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      return readWorkbookWithRetry(workbook, workbookPath, attempt + 1);
    }
    throw error;
  }
}

function parseChittyPlan(records) {
  const notes = records.map((record) => safeText(record.notes)).filter(Boolean).join(" | ");
  const firstPaid = records.find((record) => record.type === "chitty_paid");
  const monthlyMatch = notes.match(/monthly\s*([0-9,]+(?:\.\d+)?)/i);
  const tenureMatch = notes.match(/(\d+)\s*months?/i);
  const finalMatch = notes.match(/\(\s*\d+\s*months?\s*,\s*([0-9,]+(?:\.\d+)?)\s*\)/i);
  const planMatches = [...notes.matchAll(/monthly\s*([0-9,]+(?:\.\d+)?).*?\(\s*(\d+)\s*months?\s*,\s*([0-9,]+(?:\.\d+)?)\s*\)/gi)]
    .map((match) => ({
      monthlyAmount: money(match[1].replace(/,/g, "")),
      tenureMonths: Number(match[2]),
      finalAmount: money(match[3].replace(/,/g, ""))
    }))
    .filter((plan) => plan.finalAmount > 0)
    .sort((a, b) => b.finalAmount - a.finalAmount);
  const selectedPlan = planMatches[0] || {};
  const quantityMatch = notes.match(/(\d+)\s*(?:schemes?|chitt(?:y|ie)s?)/i);

  return {
    monthlyAmount: selectedPlan.monthlyAmount || (monthlyMatch ? money(monthlyMatch[1].replace(/,/g, "")) : money(firstPaid && firstPaid.amount)),
    tenureMonths: selectedPlan.tenureMonths || (tenureMatch ? Number(tenureMatch[1]) : 0),
    finalAmount: selectedPlan.finalAmount || (finalMatch ? money(finalMatch[1].replace(/,/g, "")) : 0),
    quantity: quantityMatch ? Number(quantityMatch[1]) : 1
  };
}

function isEmptyRow(row, maxColumns) {
  for (let index = 1; index <= maxColumns; index++) {
    const value = cellValue(row.getCell(index));
    if (value !== null && value !== undefined && String(value).trim() !== "") return false;
  }
  return true;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readConfig() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    const raw = await fs.readFile(configPath, "utf8");
    return JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch {
    return {};
  }
}

async function writeConfig(config) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

async function updateConfig(patch) {
  const config = await readConfig();
  const nextConfig = { ...config, ...patch };
  await writeConfig(nextConfig);
  return nextConfig;
}

async function writePublicLoginFile(username) {
  await fs.mkdir(workDirPath, { recursive: true });
  await fs.writeFile(
    publicLoginPath,
    [
      "Smart Fin 365 public URL login",
      `Username: ${username}`,
      "Password: not stored or displayed. Use the configured administrator password.",
      ""
    ].join("\n"),
    "utf8"
  );
}

const financeDataSheetNames = [
  "Entries",
  "Debt",
  "Chitty",
  "Properties",
  "Loan",
  "Trading",
  "Market Pulse",
  "Portfolio",
  "Stocks",
  "Mutual Funds",
  "Family Income",
  "Family Expenses",
  "Children Expenses",
  "Personal Maintenance",
  "Salary & Income",
  "Farm Manager",
  "Farm Inventory",
  "Agriculture Farm Records",
  "Goals & Planning",
  "Goals and Planning",
  "Savings",
  "Other Assets",
  "Business Profile",
  "Business Investment",
  "Business Income",
  "Business Expenses",
  "Business Assets",
  "Business Liabilities",
  "Business Receivables",
  "Business Payables",
  "Business Inventory",
  "Goals",
  "Goal Contributions",
  "Goal Categories",
  "Bank & Cash Manager",
  "Insurance Manager",
  "Document Vault",
  "Bill & Utilities",
  "Financial Calendar",
  "Budget Planner",
  "Backup & Restore",
  "Export Center",
  "Notification Center",
  "Tax Planner",
  "Tax Summary"
];

function workbookFinanceStats(workbook) {
  const sheets = {};
  let dataRows = 0;

  financeDataSheetNames.forEach((name) => {
    const sheet = workbook.getWorksheet(name);
    let rowCount = 0;
    if (sheet) {
      const maxColumns = Math.max(sheet.columnCount, 1);
      for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
        if (!isEmptyRow(sheet.getRow(rowNumber), maxColumns)) rowCount++;
      }
    }
    sheets[name] = rowCount;
    dataRows += rowCount;
  });

  return { dataRows, sheets };
}

function workbookHasFinanceData(workbook) {
  return workbookFinanceStats(workbook).dataRows > 0;
}

function financeStatsText(stats) {
  return financeDataSheetNames.map((name) => `${name}:${stats.sheets[name] || 0}`).join(", ");
}

async function inspectWorkbookFile(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const stats = workbookFinanceStats(workbook);
  return { workbook, stats, hasData: stats.dataRows > 0 };
}

function uniquePaths(paths) {
  const seen = new Set();
  return paths.filter((filePath) => {
    if (!filePath) return false;
    const resolved = path.resolve(filePath);
    if (seen.has(resolved)) return false;
    seen.add(resolved);
    return true;
  });
}

async function listBackupCandidates(workbookPath) {
  const config = await readConfig();
  const weeklyDir = path.join(backupStorageDir, "weekly-backups");
  const candidates = [config.weeklyBackupPath];
  const { fileName: currentWeeklyName } = weeklyBackupName(path.basename(workbookPath));
  candidates.push(path.join(weeklyDir, currentWeeklyName));

  const addMatchingFiles = async (dir, matcher) => {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const files = [];
      for (const entry of entries) {
        if (!entry.isFile() || !matcher(entry.name)) continue;
        const filePath = path.join(dir, entry.name);
        const stat = await fs.stat(filePath).catch(() => null);
        files.push({ filePath, mtimeMs: stat ? stat.mtimeMs : 0 });
      }
      files.sort((a, b) => b.mtimeMs - a.mtimeMs);
      candidates.push(...files.map((file) => file.filePath));
    } catch {
      // Missing backup folders are expected on fresh installs.
    }
  };

  await addMatchingFiles(weeklyDir, (name) => /^Finance_Records_Converted_Weekly_Backup_.*\.xlsx$/i.test(name));
  await addMatchingFiles(backupStorageDir, (name) => /^(drive-(monthly-backup|original)-|Finance_Records_Converted\.before).*\.xlsx$/i.test(name));
  if (path.resolve(backupStorageDir) !== path.resolve(workDirPath)) {
    await addMatchingFiles(workDirPath, (name) => /^(drive-(monthly-backup|original)-|Finance_Records_Converted\.before).*\.xlsx$/i.test(name));
  }
  await addMatchingFiles(dataDir, (name) => /^\.?Finance_Records_Converted\.xlsx\.(previous|write)-.*\.xlsx$/i.test(name));

  const workbookResolved = path.resolve(workbookPath);
  return uniquePaths(candidates).filter((candidate) => path.resolve(candidate) !== workbookResolved);
}

async function findHealthyWorkbookBackup(workbookPath) {
  const candidates = await listBackupCandidates(workbookPath);
  for (const candidate of candidates) {
    try {
      if (!(await exists(candidate))) continue;
      const inspected = await inspectWorkbookFile(candidate);
      if (inspected.hasData) return { path: candidate, stats: inspected.stats };
    } catch (error) {
      await appendSyncLog(`Skipping unreadable workbook backup: ${candidate}`, error);
    }
  }
  return null;
}

async function archiveRejectedWorkbook(filePath, label) {
  if (!(await exists(filePath))) return "";
  const parsed = path.parse(filePath);
  const archiveDir = path.join(backupStorageDir, "rejected-workbooks");
  const safeLabel = safeText(label || "rejected").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "rejected";
  const archivePath = path.join(archiveDir, `${parsed.name}.${safeLabel}.${Date.now()}${parsed.ext || ".xlsx"}`);
  await fs.mkdir(archiveDir, { recursive: true });
  await fs.copyFile(filePath, archivePath);
  return archivePath;
}

async function restoreWorkbookFromHealthyBackup(workbookPath, reason) {
  const healthy = await findHealthyWorkbookBackup(workbookPath);
  if (!healthy) return null;

  const archivePath = await archiveRejectedWorkbook(workbookPath, "blank-rejected");
  await fs.copyFile(healthy.path, workbookPath);
  const restored = await inspectWorkbookFile(workbookPath);
  const stat = await fs.stat(workbookPath).catch(() => null);
  if (stat) lastWorkbookMtime = stat.mtimeMs;

  await updateConfig({
    lastLocalSync: nowIso(),
    lastSyncSource: `Restored from backup after ${reason}`,
    lastSyncError: ""
  });
  await appendSyncLog(
    `Restored workbook from healthy backup after ${reason}. Source: ${healthy.path}. Restored rows: ${financeStatsText(restored.stats)}.${archivePath ? ` Rejected file archived: ${archivePath}.` : ""}`
  );

  return { ...healthy, restoredStats: restored.stats, archivePath };
}

async function rejectHeaderOnlyWorkbookIfProtected(filePath, reason) {
  const inspected = await inspectWorkbookFile(filePath);
  if (inspected.hasData) return { rejected: false, stats: inspected.stats };

  const healthy = await findHealthyWorkbookBackup(filePath);
  if (!healthy) return { rejected: false, stats: inspected.stats };

  const archivePath = await archiveRejectedWorkbook(filePath, "header-only-rejected");
  await appendSyncLog(
    `Rejected header-only workbook during ${reason}. Rows: ${financeStatsText(inspected.stats)}. Healthy backup retained: ${healthy.path}.${archivePath ? ` Rejected copy: ${archivePath}.` : ""}`
  );
  return { rejected: true, stats: inspected.stats, healthy, archivePath };
}

async function discoverGoogleDriveWorkbookPath() {
  const home = process.env.USERPROFILE || "";
  const candidates = [
    process.env.FINANCE_WORKBOOK_PATH,
    process.env.GOOGLE_DRIVE_WORKBOOK_PATH,
    process.env.GOOGLE_DRIVE_DIR ? path.join(process.env.GOOGLE_DRIVE_DIR, defaultWorkbookFileName) : "",
    process.env.GOOGLE_DRIVE_DIR ? path.join(process.env.GOOGLE_DRIVE_DIR, legacyWorkbookFileName) : "",
    `G:\\My Drive\\${defaultWorkbookFileName}`,
    `G:\\My Drive\\${legacyWorkbookFileName}`,
    `G:\\.shortcut-targets-by-id\\${defaultWorkbookFileName}`,
    `G:\\.shortcut-targets-by-id\\${legacyWorkbookFileName}`,
    path.join(home, "Google Drive", defaultWorkbookFileName),
    path.join(home, "Google Drive", legacyWorkbookFileName),
    path.join(home, "My Drive", defaultWorkbookFileName),
    path.join(home, "My Drive", legacyWorkbookFileName)
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (await exists(path.dirname(candidate))) return candidate;
  }

  return defaultWorkbookPath;
}

async function getWorkbookPath() {
  const environmentWorkbookPath = safeText(process.env.FINANCE_WORKBOOK_PATH);
  if (environmentWorkbookPath) return path.resolve(environmentWorkbookPath);
  const config = await readConfig();
  return config.workbookPath || await discoverGoogleDriveWorkbookPath();
}

function isGoogleDrivePath(filePath) {
  return /google drive|my drive|drivefs/i.test(filePath);
}

function validateWorkbookPath(filePath) {
  if (!filePath || typeof filePath !== "string") {
    throw new Error("Enter a Google Drive Excel file path.");
  }

  const resolved = path.resolve(filePath.trim());
  if (path.extname(resolved).toLowerCase() !== ".xlsx") {
    throw new Error("The workbook path must end with .xlsx.");
  }

  return resolved;
}

function getRedirectUri() {
  const explicitRedirectUri = safeText(process.env.GOOGLE_REDIRECT_URI);
  if (explicitRedirectUri) return explicitRedirectUri;
  const publicBaseUrl = safeText(process.env.PUBLIC_APP_URL || process.env.PUBLIC_BASE_URL || process.env.APP_URL).replace(/\/+$/, "");
  if (publicBaseUrl) return `${publicBaseUrl}/oauth2callback`;
  return `http://localhost:${port}/oauth2callback`;
}

async function googleSecretEncryptionKey() {
  const configured = safeText(process.env.GOOGLE_CONFIG_ENCRYPTION_KEY || process.env.CONFIG_ENCRYPTION_KEY);
  if (configured) {
    const hex = /^[a-f0-9]{64}$/i.test(configured) ? Buffer.from(configured, "hex") : null;
    const base64 = !hex ? Buffer.from(configured, "base64") : null;
    const key = hex || base64;
    if (key.length >= 32) return key.subarray(0, 32);
  }
  await fs.mkdir(workDirPath, { recursive: true });
  try {
    const key = await fs.readFile(googleOAuthKeyPath);
    if (key.length >= 32) return key.subarray(0, 32);
  } catch {}
  const key = crypto.randomBytes(32);
  await fs.writeFile(googleOAuthKeyPath, key, { mode: 0o600 });
  return key;
}

async function encryptConfigSecret(value) {
  const text = safeText(value);
  if (!text) return "";
  const key = await googleSecretEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

async function decryptConfigSecret(value) {
  const text = safeText(value);
  if (!text) return "";
  if (!text.startsWith("v1:")) return text;
  const [, ivText, tagText, encryptedText] = text.split(":");
  const key = await googleSecretEncryptionKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivText, "base64"));
  decipher.setAuthTag(Buffer.from(tagText, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64")),
    decipher.final()
  ]).toString("utf8");
}

async function getSavedGoogleClientSecret(config) {
  if (process.env.GOOGLE_CLIENT_SECRET) return process.env.GOOGLE_CLIENT_SECRET;
  if (!allowRuntimeCredentialStorage) return "";
  if (config.googleClientSecretEncrypted) return decryptConfigSecret(config.googleClientSecretEncrypted);
  return config.googleClientSecret || "";
}

function friendlyGoogleOAuthError(error) {
  const raw = [
    error?.message,
    error?.response?.data?.error,
    error?.response?.data?.error_description,
    error?.details?.error
  ].filter(Boolean).join(" ");
  if (/redirect_uri_mismatch/i.test(raw)) {
    return "The redirect URI does not match Google Cloud configuration. Copy the exact Authorized Redirect URI shown above and add it to your Google OAuth client.";
  }
  if (/access_denied/i.test(raw)) {
    return "Access was denied. If the application is in Testing, confirm that this Gmail address is included under Test users.";
  }
  if (/invalid_client/i.test(raw)) {
    return "The OAuth Client ID or Client Secret is incorrect. Check the credentials in Google Cloud Console.";
  }
  if (/refresh token|refresh_token/i.test(raw)) {
    return "Reconnect Google using consent mode to generate a refresh token.";
  }
  if (/api.*not.*enabled|has not been used|disabled/i.test(raw)) {
    return "Enable the required Google Drive and Google Sheets APIs in Google Cloud Console.";
  }
  return error?.message || "Google Drive connection failed.";
}

function looksLikeGoogleClientId(clientId) {
  return /^\d+-[a-z0-9_-]+\.apps\.googleusercontent\.com$/i.test(String(clientId || "").trim());
}

async function getOAuthClient() {
  const config = await readConfig();
  const clientId = process.env.GOOGLE_CLIENT_ID || (allowRuntimeCredentialStorage ? config.googleClientId : "");
  const clientSecret = await getSavedGoogleClientSecret(config);

  if (!clientId || !clientSecret) {
    throw new Error("Google sign-in is not configured on the server yet.");
  }

  if (!looksLikeGoogleClientId(clientId)) {
    throw new Error("The saved Google OAuth Client ID is invalid. It must end with .apps.googleusercontent.com.");
  }

  const client = new google.auth.OAuth2(clientId, clientSecret, getRedirectUri());
  if (config.googleTokens) client.setCredentials(config.googleTokens);
  return client;
}

async function getDriveSyncStatus() {
  const config = await readConfig();
  const hasCredentials = Boolean(
    (process.env.GOOGLE_CLIENT_ID || (allowRuntimeCredentialStorage ? config.googleClientId : "")) &&
    (process.env.GOOGLE_CLIENT_SECRET || (allowRuntimeCredentialStorage ? (config.googleClientSecretEncrypted || config.googleClientSecret) : ""))
  );
  const clientId = process.env.GOOGLE_CLIENT_ID || (allowRuntimeCredentialStorage ? config.googleClientId : "") || "";
  const isAuthenticated = Boolean(config.googleTokens && config.googleTokens.refresh_token);

  return {
    folderId: driveFolderId,
    folderUrl: driveFolderUrl,
    redirectUri: getRedirectUri(),
    scopes: driveScopes,
    hasCredentials,
    hasValidClientId: looksLikeGoogleClientId(clientId),
    credentialState: hasCredentials ? "OAuth Client Secret configured" : "",
    isAuthenticated,
    gmailAddress: config.gmailAddress || "",
    driveFileId: config.driveFileId || "",
    monthlyBackupKey: config.monthlyBackupKey || "",
    monthlyBackupFileId: config.monthlyBackupFileId || "",
    monthlyBackupFileName: config.monthlyBackupFileName || "",
    lastMonthlyBackupSync: config.lastMonthlyBackupSync || "",
    weeklyBackupKey: config.weeklyBackupKey || "",
    weeklyBackupPath: config.weeklyBackupPath || "",
    weeklyBackupFileName: config.weeklyBackupFileName || "",
    lastWeeklyBackupSync: config.lastWeeklyBackupSync || "",
    lastWeeklyBackupError: config.lastWeeklyBackupError || "",
    lastDriveSync: config.lastDriveSync || "",
    lastDriveModifiedTime: config.lastDriveModifiedTime || "",
    lastDriveSyncError: config.lastDriveSyncError || "",
    lastLocalSync: config.lastLocalSync || "",
    lastSyncError: config.lastSyncError || "",
    lastSyncSource: config.lastSyncSource || ""
  };
}

function isGoogleInvalidGrant(error) {
  return /invalid_grant/i.test(error?.message || "")
    || /invalid_grant/i.test(error?.response?.data?.error || "");
}

async function markGoogleDriveDisconnected(error) {
  if (!isGoogleInvalidGrant(error)) return false;
  await updateConfig({
    googleTokens: null,
    lastDriveSyncError: "Google sign-in expired. Connect Gmail again from the Google Drive tile."
  });
  return true;
}

function monthlyBackupName(fileName, date = new Date()) {
  const parsed = path.parse(fileName || "Finance_Records.xlsx");
  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  return {
    monthKey,
    fileName: `${parsed.name}_Monthly_Backup_${monthKey}${parsed.ext || ".xlsx"}`
  };
}

function weeklyBackupName(fileName, date = new Date()) {
  const parsed = path.parse(fileName || "Finance_Records.xlsx");
  const safeName = (parsed.name || "Finance_Records").replace(/[<>:"/\\|?*]/g, "_");
  const weekDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = weekDate.getUTCDay() || 7;
  weekDate.setUTCDate(weekDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(weekDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((weekDate - yearStart) / 86400000) + 1) / 7);
  const weekKey = `${weekDate.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  return {
    weekKey,
    fileName: `${safeName}_Weekly_Backup_${weekKey}${parsed.ext || ".xlsx"}`
  };
}

async function ensureWeeklyLocalBackup(workbookPath) {
  const config = await readConfig();
  const { weekKey, fileName } = weeklyBackupName(workbookPath);
  const backupDir = path.join(backupStorageDir, "weekly-backups");
  const backupPath = path.join(backupDir, fileName);

  if (config.weeklyBackupKey === weekKey && safeText(config.weeklyBackupPath) && await exists(config.weeklyBackupPath)) {
    return {
      weekKey,
      path: config.weeklyBackupPath,
      created: false
    };
  }

  try {
    const validationWorkbook = new ExcelJS.Workbook();
    await validationWorkbook.xlsx.readFile(workbookPath);
    await fs.mkdir(backupDir, { recursive: true });
    await fs.copyFile(workbookPath, backupPath);
    const backupWorkbook = new ExcelJS.Workbook();
    await backupWorkbook.xlsx.readFile(backupPath);
    const catalogued = await inspectBackupWorkbook(backupPath, {});
    await saveBackupCatalogEntry(catalogued.backupId, {
      backupName: fileName,
      backupType: "full",
      backupPeriod: "Weekly",
      createdBy: "System",
      source: "Automatic weekly full backup",
      checksumAlgorithm: "sha256",
      checksumValue: await sha256File(backupPath),
      schemaVersion: catalogued.workbookVersion,
      schemaFingerprint: catalogued.schemaFingerprint,
      status: "Available",
      integrityStatus: "Valid",
      retentionExpiry: dateAfterDays(new Date(), 365),
      validatedAt: nowIso()
    });
    await updateConfig({
      weeklyBackupKey: weekKey,
      weeklyBackupPath: backupPath,
      weeklyBackupFileName: fileName,
      lastWeeklyBackupSync: nowIso(),
      lastWeeklyBackupError: ""
    });
    return {
      weekKey,
      path: backupPath,
      created: true
    };
  } catch (error) {
    await updateConfig({ lastWeeklyBackupError: error.message || "Weekly local backup failed." });
    await appendSyncLog("Weekly local backup failed.", error);
    return {
      weekKey,
      path: backupPath,
      created: false,
      error
    };
  }
}

async function uploadMonthlyBackupToDrive(drive, workbookPath, fileName, config) {
  const { monthKey, fileName: backupFileName } = monthlyBackupName(fileName);
  if (config.monthlyBackupKey === monthKey && safeText(config.monthlyBackupFileId)) {
    return {
      id: config.monthlyBackupFileId,
      name: config.monthlyBackupFileName || backupFileName,
      skipped: true
    };
  }
  const media = {
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    body: fsSync.createReadStream(workbookPath)
  };

  const response = await drive.files.create({
    requestBody: {
      name: backupFileName,
      parents: [driveFolderId],
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    },
    media,
    fields: "id,name,webViewLink,modifiedTime"
  });

  await updateConfig({
    monthlyBackupKey: monthKey,
    monthlyBackupFileId: response.data.id,
    monthlyBackupFileName: response.data.name || backupFileName,
    lastMonthlyBackupSync: new Date().toISOString()
  });

  return response.data;
}

async function uploadWorkbookToDrive() {
  const workbookPath = await getWorkbookPath();
  const inspected = await inspectWorkbookFile(workbookPath);
  if (!inspected.hasData) {
    const restored = await restoreWorkbookFromHealthyBackup(workbookPath, "header-only Google Drive upload attempt");
    if (!restored) {
      throw new Error("Refusing to upload a header-only finance workbook because no healthy backup is available.");
    }
  }
  const auth = await getOAuthClient();
  const drive = google.drive({ version: "v3", auth });
  const config = await readConfig();
  const fileName = path.basename(workbookPath) || "Finance_Records.xlsx";
  const media = {
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    body: fsSync.createReadStream(workbookPath)
  };

  let response;
  if (config.driveFileId) {
    response = await drive.files.update({
      fileId: config.driveFileId,
      media,
      fields: "id,name,webViewLink,modifiedTime"
    });
  } else {
    response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [driveFolderId],
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      },
      media,
      fields: "id,name,webViewLink,modifiedTime"
    });
  }

  let monthlyBackup = null;
  let monthlyBackupError = "";
  try {
    monthlyBackup = await uploadMonthlyBackupToDrive(drive, workbookPath, fileName, config);
  } catch (error) {
    monthlyBackupError = `Monthly backup failed: ${error.message || error}`;
    await appendSyncLog("Monthly Google Drive backup failed.", error);
  }

  await updateConfig({
    driveFileId: response.data.id,
    lastDriveSync: new Date().toISOString(),
    lastDriveModifiedTime: response.data.modifiedTime || "",
    lastDriveSyncError: monthlyBackupError
  });

  return { ...response.data, monthlyBackup };
}

async function downloadWorkbookFromDriveIfNewer() {
  if (syncInProgress) return false;
  const status = await getDriveSyncStatus();
  if (!status.hasCredentials || !status.isAuthenticated || !status.driveFileId) return false;

  const config = await readConfig();
  const auth = await getOAuthClient();
  const drive = google.drive({ version: "v3", auth });
  const meta = await drive.files.get({
    fileId: status.driveFileId,
    fields: "id,name,modifiedTime"
  });
  const remoteTime = new Date(meta.data.modifiedTime || 0).getTime();
  const knownTime = new Date(config.lastDriveModifiedTime || config.lastDriveSync || 0).getTime();
  if (!remoteTime || remoteTime <= knownTime + 1000) return false;

  syncInProgress = true;
  try {
    const workbookPath = await getWorkbookPath();
    const tempPath = path.join(path.dirname(workbookPath), `.${path.basename(workbookPath)}.drive-download-${Date.now()}.tmp`);
    const response = await drive.files.get(
      { fileId: status.driveFileId, alt: "media" },
      { responseType: "stream" }
    );
    await new Promise((resolve, reject) => {
      const dest = fsSync.createWriteStream(tempPath);
      response.data
        .on("end", resolve)
        .on("error", reject)
        .pipe(dest)
        .on("error", reject);
    });
    const guard = await rejectHeaderOnlyWorkbookIfProtected(tempPath, "Google Drive download");
    if (guard.rejected) {
      await fs.unlink(tempPath).catch(() => {});
      const localInspection = await inspectWorkbookFile(workbookPath).catch(() => null);
      if (!localInspection || !localInspection.hasData) {
        await restoreWorkbookFromHealthyBackup(workbookPath, "header-only Google Drive download");
      }
      await updateConfig({
        lastDriveModifiedTime: meta.data.modifiedTime || "",
        lastSyncError: "Rejected a header-only Google Drive workbook and kept the latest healthy local data."
      });
      await uploadWorkbookToDrive().catch((error) => appendSyncLog("Re-upload after rejecting header-only Google Drive workbook failed.", error));
      return false;
    }
    await fs.copyFile(tempPath, workbookPath);
    await fs.unlink(tempPath).catch(() => {});
    const stat = await fs.stat(workbookPath);
    lastWorkbookMtime = stat.mtimeMs;
    await ensureWeeklyLocalBackup(workbookPath);
    await updateConfig({
      lastDriveModifiedTime: meta.data.modifiedTime || "",
      lastLocalSync: nowIso(),
      lastSyncSource: "Google Drive change",
      lastSyncError: ""
    });
    return true;
  } catch (error) {
    const disconnected = await markGoogleDriveDisconnected(error);
    if (!disconnected) await updateConfig({ lastSyncError: error.message || "Google Drive download failed." });
    await appendSyncLog("Google Drive download failed.", error);
    return false;
  } finally {
    syncInProgress = false;
  }
}

async function uploadWorkbookToDriveIfConnected() {
  const status = await getDriveSyncStatus();
  if (!status.hasCredentials || !status.isAuthenticated) return null;

  try {
    return await uploadWorkbookToDrive();
  } catch (error) {
    const disconnected = await markGoogleDriveDisconnected(error);
    if (!disconnected) await updateConfig({ lastDriveSyncError: error.message || "Google Drive sync failed." });
    await appendSyncLog("Google Drive sync failed.", error);
    return null;
  }
}

function styleSheet(sheet) {
  if (sheet.columnCount === 0 || sheet.rowCount === 0) {
    sheet.columns = columns;
  } else {
    columns.forEach((column, index) => {
      const excelColumn = sheet.getColumn(index + 1);
      excelColumn.key = column.key;
      excelColumn.width = column.width;
      sheet.getRow(1).getCell(index + 1).value = column.header;
    });
  }
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
  header.alignment = { vertical: "middle" };
  header.height = 22;

  sheet.columns.forEach((column) => {
    column.alignment = { vertical: "top", wrapText: true };
  });

  const amountColumn = sheet.getColumn("amount");
  amountColumn.numFmt = "#,##0.00";
}

function styleColumnsSheet(sheet, sheetColumns, moneyKeys = ["amount"]) {
  sheet.columns = sheetColumns;
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
  header.alignment = { vertical: "middle" };
  header.height = 22;

  sheet.columns.forEach((column) => {
    column.alignment = { vertical: "top", wrapText: true };
  });

  moneyKeys.forEach((key) => {
    const column = sheet.getColumn(key);
    if (column) column.numFmt = "#,##0.00";
  });
}

function ensureWorkbookSheetDefinition(workbook, definition) {
  const sheet = workbook.getWorksheet(definition.name) || workbook.addWorksheet(definition.name);
  const header = sheet.getRow(1);
  const isBlankHeader = sheet.columnCount === 0 ||
    !definition.columns.some((column, index) => safeText(cellValue(header.getCell(index + 1))));

  if (isBlankHeader) {
    styleColumnsSheet(sheet, definition.columns, definition.moneyKeys || []);
    return sheet;
  }

  const headers = headerIndexMap(sheet);
  definition.columns.forEach((column) => {
    let columnNumber = headers.get(column.header.toLowerCase());
    if (!columnNumber && Array.isArray(column.aliases)) {
      const alias = column.aliases.find((name) => headers.get(String(name).toLowerCase()));
      if (alias) {
        columnNumber = headers.get(String(alias).toLowerCase());
        header.getCell(columnNumber).value = column.header;
        headers.set(column.header.toLowerCase(), columnNumber);
      }
    }
    if (!columnNumber) {
      columnNumber = Math.max(sheet.columnCount, header.cellCount, 0) + 1;
      header.getCell(columnNumber).value = column.header;
      headers.set(column.header.toLowerCase(), columnNumber);
    }
    const excelColumn = sheet.getColumn(columnNumber);
    excelColumn.key = column.key;
    if (!excelColumn.width || excelColumn.width < column.width) excelColumn.width = column.width;
  });

  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
  header.alignment = { vertical: "middle", wrapText: true };

  (definition.moneyKeys || []).forEach((key) => {
    const column = sheet.getColumn(key);
    if (column) column.numFmt = "#,##0.00";
  });

  return sheet;
}

function ensureMasterSpecSheets(workbook) {
  masterSpecSheetDefinitions.forEach((definition) => ensureWorkbookSheetDefinition(workbook, definition));
  ensureDefaultGoalCategories(workbook);
}

const defaultGoalCategories = [
  "Child 1 Education",
  "Child 2 Education",
  "House Construction",
  "Farm Expansion",
  "Tractor Purchase",
  "Farm Equipment",
  "Emergency Fund",
  "Retirement",
  "Shop Expansion",
  "New Machinery",
  "Additional Business Investment",
  "New Branch",
  "New Vehicle",
  "Business Automation",
  "Staff Expansion",
  "Other"
];

function ensureDefaultGoalCategories(workbook) {
  const sheet = workbook.getWorksheet("Goal Categories");
  if (!sheet) return;
  const headerMap = headerIndexMap(sheet);
  const categoryColumn = headerMap.get("category name");
  if (!categoryColumn) return;
  const existing = new Set();
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const name = safeText(cellValue(row.getCell(categoryColumn))).toLowerCase();
    if (name) existing.add(name);
  });
  defaultGoalCategories.forEach((category) => {
    if (existing.has(category.toLowerCase())) return;
    sheet.addRow({
      id: `GOAL-CAT-${slugify(category)}`,
      categoryName: category,
      status: "Active",
      defaultCategory: "Yes",
      notes: "",
      createdAt: nowIso(),
      lastUpdated: nowIso(),
      syncStatus: "Synced"
    });
  });
}

function resetWorksheet(workbook, sheetName) {
  const existing = workbook.getWorksheet(sheetName);
  if (existing) workbook.removeWorksheet(existing.id);
  return workbook.addWorksheet(sheetName);
}

function getPropertyRecords(workbook) {
  const sheet = workbook.getWorksheet("Properties");
  const records = [];
  if (!sheet) return records;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || isEmptyRow(row, propertyColumns.length)) return;
    records.push({
      id: cellValue(row.getCell(1)),
      propertyLocation: cellValue(row.getCell(2)),
      googleMapLocation: cellValue(row.getCell(3)),
      propertySize: cellValue(row.getCell(4)),
      propertyDimensions: cellValue(row.getCell(5)),
      previousLandOwner: cellValue(row.getCell(6)),
      purchasePricePerSqy: money(cellValue(row.getCell(7))),
      purchaseTotalPrice: money(cellValue(row.getCell(8))),
      documentNumber: cellValue(row.getCell(9)),
      registrationDate: formatDateValue(cellValue(row.getCell(10))),
      sellPricePerSqy: money(cellValue(row.getCell(11))),
      sellTotalPrice: money(cellValue(row.getCell(12))),
      presentOwner: cellValue(row.getCell(13)),
      newOwner: cellValue(row.getCell(14)),
      notes: cellValue(row.getCell(15)),
      createdAt: cellValue(row.getCell(16))
    });
  });

  return records;
}

function getLoanRecords(workbook) {
  const sheet = workbook.getWorksheet("Loan");
  const records = [];
  if (!sheet) return records;

  const headers = headerIndexMap(sheet);
  const column = (...names) => names.map((name) => headers.get(name.toLowerCase())).find(Boolean);
  const value = (row, ...names) => {
    const index = column(...names);
    return index ? cellValue(row.getCell(index)) : "";
  };
  const borrowedFromColumn = column("Borrowed From");
  const principalColumn = column("Principal");
  if (!borrowedFromColumn && !principalColumn) return records;

  const monthColumns = [];
  sheet.getRow(1).eachCell((cell, columnNumber) => {
    const match = safeText(cellValue(cell)).match(/^month\s+(\d+)$/i);
    if (match) monthColumns.push({ column: columnNumber, index: Number(match[1]) });
  });

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || isEmptyRow(row, Math.min(sheet.columnCount, loanColumns.length))) return;
    const borrowedFrom = safeText(value(row, "Borrowed From"));
    const principal = money(value(row, "Principal"));
    if (!borrowedFrom && !principal) return;

    const typeOfFund = normalizeFundType(value(row, "Type of Fund"));
    const interestPercentage = money(value(row, "Interest Percentage")) || (typeOfFund === "Hand Loan" ? 24 : 0);
    const tenureMonths = numberOrBlank(value(row, "Tenure (Months)", "Tennure (Months)")) || 0;
    const emi = money(value(row, "EMI")) || (principal * (interestPercentage / 100)) / 12;
    const monthPayments = {};
    monthColumns.forEach(({ column, index }) => {
      const paid = money(cellValue(row.getCell(column)));
      if (paid) monthPayments[index] = paid;
    });
    const monthPaymentCount = Object.keys(monthPayments).length;
    const manualLoanPaid = money(value(row, "Loan Paid"));
    const finishedMonths = Math.max(monthPaymentCount, numberOrBlank(value(row, "Finished Months")) || 0);
    const remainingMonths = Math.max((tenureMonths || 0) - finishedMonths, 0);
    const monthPaymentTotal = Object.values(monthPayments).reduce((sum, amount) => sum + money(amount), 0);
    const borrowedDate = formatDateValue(value(row, "Borrowed Date")) || nowIso().slice(0, 10);
    const loanAmount = typeOfFund === "Hand Loan" ? handLoanAmount(principal, borrowedDate) : principal + (emi * (tenureMonths || 0));
    const loanPaid = typeOfFund === "Hand Loan" ? (manualLoanPaid || monthPaymentTotal) : emi * finishedMonths;
    const remainingLoanAmount = Math.max(loanAmount - loanPaid, 0);
    const status = loanStatus(tenureMonths, finishedMonths);
    const interestDetails = loanInterestDetails({
      typeOfFund,
      principal,
      interestPercentage,
      borrowedDate,
      emi,
      tenureMonths,
      finishedMonths,
      remainingLoanAmount
    });

    records.push({
      id: safeText(value(row, "ID")) || `LOAN-${rowNumber}-${slugify(borrowedFrom)}`,
      notes: safeText(value(row, "Notes")),
      borrowedFrom,
      typeOfFund,
      borrowedDate,
      clearedDate: formatDateValue(value(row, "Cleared Date")),
      principal,
      interestPercentage,
      emi,
      tenureMonths,
      finishedMonths,
      remainingMonths,
      loanAmount,
      loanPaid,
      remainingLoanAmount,
      status,
      loanInterest: interestDetails.loanInterest,
      remainingInterest: interestDetails.remainingInterest,
      interestRate: interestDetails.rate,
      firstEmi: formatDateValue(value(row, "First EMI")) || safeText(value(row, "First EMI")),
      monthPayments,
      createdAt: safeText(value(row, "Created At")) || nowIso(),
      lastUpdated: safeText(value(row, "Last Updated")) || nowIso()
    });
  });

  return records;
}

function getLoanTotals(records) {
  return records.reduce((totals, record) => {
    totals.loanAmount += money(record.loanAmount);
    totals.loanPaid += money(record.loanPaid);
    totals.remainingLoanAmount += money(record.remainingLoanAmount);
    totals.loanInterest += money(record.loanInterest);
    totals.remainingLoanInterest += money(record.remainingInterest);
    return totals;
  }, { loanAmount: 0, loanPaid: 0, remainingLoanAmount: 0, loanInterest: 0, remainingLoanInterest: 0 });
}

function rebuildLoanSheet(sheet, records) {
  styleColumnsSheet(sheet, loanColumns, [
    "principal",
    "interestPercentage",
    "emi",
    "tenureMonths",
    "finishedMonths",
    "remainingMonths",
    "loanAmount",
    "loanPaid",
    "remainingLoanAmount",
    ...Array.from({ length: 60 }, (_, index) => `m_${index + 1}`)
  ]);
  records.forEach((record) => {
    const typeOfFund = normalizeFundType(record.typeOfFund);
    const monthPaymentTotal = Object.values(record.monthPayments || {}).reduce((sum, amount) => sum + money(amount), 0);
    const monthPaymentCount = Object.keys(record.monthPayments || {}).length;
    const finishedMonths = Math.max(monthPaymentCount, money(record.finishedMonths));
    const row = {
      ...record,
      typeOfFund,
      interestPercentage: money(record.interestPercentage) || (typeOfFund === "Hand Loan" ? 24 : 0),
      emi: money(record.emi) || (money(record.principal) * ((money(record.interestPercentage) || (typeOfFund === "Hand Loan" ? 24 : 0)) / 100)) / 12,
      tenureMonths: money(record.tenureMonths),
      finishedMonths,
      remainingMonths: Math.max(money(record.tenureMonths) - finishedMonths, 0)
    };
    row.loanAmount = typeOfFund === "Hand Loan" ? handLoanAmount(record.principal, record.borrowedDate || nowIso().slice(0, 10)) : money(record.principal) + (row.emi * row.tenureMonths);
    row.loanPaid = typeOfFund === "Hand Loan" ? (money(record.loanPaid) || monthPaymentTotal) : row.emi * row.finishedMonths;
    row.remainingLoanAmount = Math.max(row.loanAmount - row.loanPaid, 0);
    row.status = loanStatus(row.tenureMonths, row.finishedMonths);
    for (let index = 1; index <= 60; index++) {
      row[`m_${index}`] = record.monthPayments?.[index] || (typeOfFund === "Bank Loan" && index <= finishedMonths ? row.emi : "");
    }
    sheet.addRow(row);
  });

  sheet.getColumn("status").eachCell({ includeEmpty: true }, (cell, rowNumber) => {
    if (rowNumber === 1 || rowNumber > Math.max(sheet.rowCount, 2)) return;
    cell.dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"On-Going,Cleared"']
    };
  });
}

function getManualDebtRows(workbook) {
  const sheet = workbook.getWorksheet("Debt");
  const records = [];
  if (!sheet) return records;

  const headers = headerIndexMap(sheet);
  const column = (...names) => names.map((name) => headers.get(name.toLowerCase())).find(Boolean);
  const value = (row, ...names) => {
    const index = column(...names);
    return index ? cellValue(row.getCell(index)) : "";
  };
  if (!column("Amount Lent", "Debt Given", "Amount") || !column("Person")) return records;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || isEmptyRow(row, Math.min(sheet.columnCount, debtColumns.length))) return;
    const party = safeText(value(row, "Person"));
    const debtGiven = money(value(row, "Amount Lent", "Debt Given", "Amount"));
    if (!party && !debtGiven) return;

    const sheetStatus = safeText(value(row, "Status"));
    const normalizedSheetStatus = normalizeStatus(sheetStatus);
    const dateCleared = formatDateValue(value(row, "Date Cleared"));
    const notes = safeText(value(row, "Notes"));
    const noteClearedDate = clearedDateFromNotes(notes);
    const dateGiven = formatDateValue(value(row, "Date Given")) || nowIso().slice(0, 10);
    const initialPrincipalReceived = money(value(row, "Principal Received"));
    const status = normalizedSheetStatus || (Math.max(debtGiven - initialPrincipalReceived, 0) <= 0
      ? "Cleared"
      : initialPrincipalReceived > 0
        ? "Partial"
        : "Pending");
    const effectiveDateCleared = status === "Cleared" ? (dateCleared || noteClearedDate) : dateCleared;
    const principalReceived = status === "Cleared" && !initialPrincipalReceived ? debtGiven : initialPrincipalReceived;
    const interestReceived = status === "Cleared"
      ? debtInterestBetween(debtGiven, dateGiven, effectiveDateCleared)
      : money(value(row, "Interest Received"));
    const finalAmount = principalReceived + interestReceived;
    const outstandingPrincipal = Math.max(debtGiven - principalReceived, 0);
    const outstandingInterest = debtOutstandingInterestForStatus(status, debtGiven, dateGiven, value(row, "Outstanding Interest"));
    const balanceWithInterest = outstandingPrincipal + outstandingInterest;

    records.push({
      id: safeText(value(row, "ID")) || `DEBT-${rowNumber}-${slugify(party)}`,
      date: dateGiven,
      dateCleared: effectiveDateCleared,
      type: "debt_given",
      party,
      amount: debtGiven,
      mode: safeText(value(row, "Mode")),
      month: "",
      status,
      notes,
      createdAt: safeText(value(row, "Created At")) || nowIso(),
      tenureMonths: "",
      startingMonth: "",
      amountReceived: principalReceived,
      interestReceived,
      finalAmount,
      balanceWithInterest,
      outstandingPrincipal,
      outstandingInterest,
      lastUpdated: safeText(value(row, "Last Updated")) || nowIso()
    });
  });

  return records;
}

function debtSheetContext(workbook) {
  const sheet = workbook.getWorksheet("Debt");
  if (!sheet) return null;
  const headers = headerIndexMap(sheet);
  const column = (...names) => names.map((name) => headers.get(name.toLowerCase())).find(Boolean);
  return { sheet, column };
}

function findDebtSheetRowById(workbook, id) {
  const context = debtSheetContext(workbook);
  if (!context) return null;
  const idColumn = context.column("ID");
  if (!idColumn) return null;
  let foundRow = null;
  context.sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    if (safeText(cellValue(row.getCell(idColumn))) === safeText(id)) foundRow = row;
  });
  return foundRow ? { ...context, row: foundRow } : null;
}

function setDebtSheetValue(context, row, header, value) {
  const column = header === "Amount Lent"
    ? context.column("Amount Lent", "Debt Given", "Amount")
    : context.column(header);
  if (!column) return;
  row.getCell(column).value = value === "" || value === undefined ? null : value;
}

function updateDebtSheetRowFromPayload(workbook, id, payload) {
  const found = findDebtSheetRowById(workbook, id);
  if (!found) return false;
  const { row } = found;
  const existingDebtGiven = money(cellValue(row.getCell(found.column("Amount Lent", "Debt Given", "Amount"))));
  const existingPrincipalReceived = money(cellValue(row.getCell(found.column("Principal Received"))));
  const existingInterestReceived = money(cellValue(row.getCell(found.column("Interest Received"))));
  const existingFinalAmount = money(cellValue(row.getCell(found.column("Final Amount"))));
  const hasValue = (value) => value !== undefined && value !== null && value !== "";
  const debtGiven = hasValue(payload.amount) ? money(payload.amount) : existingDebtGiven;
  const principalReceived = hasValue(payload.amountReceived) ? money(payload.amountReceived) : existingPrincipalReceived;
  const status = safeText(payload.status) || safeText(cellValue(row.getCell(found.column("Status")))) || defaultStatus("debt_given", payload.status);
  const normalizedStatus = normalizeStatus(status);
  const existingDateGiven = formatDateValue(cellValue(row.getCell(found.column("Date Given"))));
  const existingDateCleared = formatDateValue(cellValue(row.getCell(found.column("Date Cleared"))));
  const submittedDateGiven = safeText(payload.dateGiven);
  const submittedDateCleared = safeText(payload.dateCleared);
  const dateGiven = normalizedStatus === "Cleared"
    ? submittedDateGiven || existingDateGiven || safeText(payload.date) || nowIso().slice(0, 10)
    : submittedDateGiven || safeText(payload.date) || existingDateGiven || nowIso().slice(0, 10);
  const dateCleared = normalizedStatus === "Cleared"
    ? submittedDateCleared || safeText(payload.date) || existingDateCleared || nowIso().slice(0, 10)
    : existingDateCleared;
  const calculatedInterestReceived = normalizedStatus === "Cleared"
    ? debtInterestBetween(debtGiven, dateGiven, dateCleared)
    : (hasValue(payload.interestReceived) ? money(payload.interestReceived) : existingInterestReceived);
  const finalAmount = principalReceived + calculatedInterestReceived;
  const outstandingPrincipal = Math.max(debtGiven - principalReceived, 0);
  const outstandingInterest = debtOutstandingInterestForStatus(
    normalizedStatus,
    debtGiven,
    dateGiven,
    hasValue(payload.outstandingInterest)
      ? money(payload.outstandingInterest)
      : cellValue(row.getCell(found.column("Outstanding Interest")))
  );
  const balanceWithInterest = outstandingPrincipal + outstandingInterest;

  setDebtSheetValue(found, row, "Loan Type", safeText(cellValue(row.getCell(found.column("Loan Type")))) || entryTypes.debt_given);
  setDebtSheetValue(found, row, "Person", safeText(payload.party) || safeText(cellValue(row.getCell(found.column("Person")))));
  setDebtSheetValue(found, row, "Amount Lent", debtGiven);
  setDebtSheetValue(found, row, "Date Given", dateGiven);
  setDebtSheetValue(found, row, "Date Cleared", dateCleared);
  setDebtSheetValue(found, row, "Mode", safeText(payload.mode) || safeText(cellValue(row.getCell(found.column("Mode")))));
  setDebtSheetValue(found, row, "Status", status);
  setDebtSheetValue(found, row, "Final Amount", finalAmount);
  setDebtSheetValue(found, row, "Principal Received", principalReceived);
  setDebtSheetValue(found, row, "Interest Received", calculatedInterestReceived);
  setDebtSheetValue(found, row, "Outstanding Principal", outstandingPrincipal);
  setDebtSheetValue(found, row, "Outstanding Interest", outstandingInterest);
  setDebtSheetValue(found, row, "Balance With Interest", balanceWithInterest);
  applyDebtSheetCalculationCells(row, normalizedStatus, outstandingInterest, balanceWithInterest, found);
  setDebtSheetValue(found, row, "Notes", payload.notes !== undefined ? safeText(payload.notes) : safeText(cellValue(row.getCell(found.column("Notes")))));
  setDebtSheetValue(found, row, "Last Updated", nowIso());
  return true;
}

function syncManualDebtSheetToEntries(workbook) {
  const manualDebtRows = getManualDebtRows(workbook);
  if (!manualDebtRows.length) return false;
  const entries = workbook.getWorksheet("Entries") || workbook.addWorksheet("Entries");
  if (entries.columnCount === 0) entries.columns = columns;

  for (let rowNumber = entries.rowCount; rowNumber >= 2; rowNumber--) {
    const record = rowToEntry(entries.getRow(rowNumber));
    if (record.type === "debt_given" || record.type === "debt_cleared" || record.type === "interest_received") {
      entries.spliceRows(rowNumber, 1);
    }
  }

  manualDebtRows.forEach((record) => entries.addRow(rowFromEntryPayload(record, record)));
  styleSheet(entries);
  return true;
}

function getTotals(records, chittyOverrides = new Map(), debtRecords = records) {
  const debtSummary = getDebtSummary(debtRecords);
  const totals = {
    debt_given: 0,
    debt_cleared: 0,
    interest_received: 0,
    amount_received: 0,
    chitty_paid: 0,
    chitty_received: 0,
    total_debt: 0,
    total_chitty: 0,
    pending_chitty: 0,
    pending_debt_given: 0,
    ongoing_chitty_paid: 0,
    completed_chitty_received: 0,
    pending_debts: 0,
    partial_debts: 0,
    cleared_debts: 0
  };

  records.forEach((record) => {
    const type = record.type;
    const amount = money(record.amount);
    if (totals[type] !== undefined) totals[type] += amount;
    const status = safeText(record.status).toLowerCase();
    if (type === "debt_given" && (!status || status.includes("pending"))) totals.pending_debt_given += amount;
    if (type === "chitty_paid" && (!status || status.includes("on going") || status.includes("ongoing"))) totals.ongoing_chitty_paid += amount;
    if (type === "chitty_received" && (status.includes("completed") || status.includes("received") || status.includes("cleared"))) totals.completed_chitty_received += amount;
  });

  const chittySummaries = applyChittyOverrides(getChittySummaries(records), chittyOverrides);
  totals.total_debt = debtSummary.totalPrincipal;
  totals.debt_given = debtSummary.totalPrincipal;
  totals.debt_cleared = debtSummary.totalReceived;
  totals.interest_received = debtSummary.interestReceived;
  totals.amount_received = debtSummary.totalReceived;
  totals.pending_debt_given = debtSummary.pendingPrincipal;
  totals.pending_debts = debtSummary.pendingDebts;
  totals.partial_debts = debtSummary.partialDebts;
  totals.cleared_debts = debtSummary.clearedDebts;
  totals.total_chitty = chittySummaries.reduce((sum, summary) => sum + money(summary.totalValue || summary.finalAmount), 0);
  totals.completed_chitty_received = chittySummaries
    .filter((summary) => summary.isCompleted)
    .reduce((sum, summary) => sum + money(summary.finalAmount || summary.receivedAmount || summary.totalValue), 0);
  totals.chitty_received = totals.completed_chitty_received;
  totals.pending_chitty = chittySummaries
    .filter((summary) => !summary.isCompleted)
    .reduce((sum, summary) => sum + money(summary.pendingAmount), 0);

  return {
    ...totals,
    balanceDebt: debtSummary.balanceWithInterest,
    outstandingPrincipal: debtSummary.outstandingPrincipal,
    chittyNet: totals.chitty_received - totals.chitty_paid
  };
}

function getDebtInterestSummary(records) {
  const debtSummary = getDebtSummary(records);

  return {
    principal: debtSummary.outstandingPrincipal,
    interest: debtSummary.outstandingInterest,
    withInterest: debtSummary.balanceWithInterest,
    annualRate: annualDebtInterestRate
  };
}

function getDebtSummary(records) {
  const principalRecords = records.filter((record) => record.type === "debt_given");
  const payments = records.filter((record) => record.type === "debt_cleared" || record.type === "interest_received");
  const paymentsByParty = new Map();

  payments.forEach((record) => {
    const key = safeText(record.party).toLowerCase();
    const row = paymentsByParty.get(key) || { principalReceived: 0, interestReceived: 0, cashReceived: 0 };
    if (record.type === "interest_received") row.interestReceived += money(record.amount || record.interestReceived);
    if (record.type === "debt_cleared") {
      const cashReceived = Math.max(money(record.amount), money(record.amountReceived));
      row.cashReceived += cashReceived;
      row.principalReceived += cashReceived;
      row.interestReceived += money(record.interestReceived);
    }
    paymentsByParty.set(key, row);
  });

  const paymentUsage = new Map();
  const summaries = principalRecords.map((record, index) => {
    const partyKey = safeText(record.party).toLowerCase();
    const payment = paymentsByParty.get(partyKey) || { principalReceived: 0, interestReceived: 0, cashReceived: 0 };
    const used = paymentUsage.get(partyKey) || { principalReceived: 0, interestReceived: 0 };
    const availablePrincipalPayment = Math.max(payment.principalReceived - used.principalReceived, 0);
    const availableInterestPayment = Math.max(payment.interestReceived - used.interestReceived, 0);
    const totalPrincipal = money(record.amount);
    const statusText = normalizeStatus(record.status);
    const inlinePrincipal = money(record.amountReceived) || (statusText === "Cleared" ? totalPrincipal : 0);
    const principalFromPayment = Math.min(Math.max(totalPrincipal - inlinePrincipal, 0), availablePrincipalPayment);
    const principalReceived = Math.min(totalPrincipal, inlinePrincipal + principalFromPayment);
    const inlineInterest = money(record.interestReceived);
    const interestFromPayment = inlineInterest ? 0 : availableInterestPayment;
    const interestReceived = inlineInterest + interestFromPayment;
    paymentUsage.set(partyKey, {
      principalReceived: used.principalReceived + principalFromPayment,
      interestReceived: used.interestReceived + interestFromPayment
    });
    const finalAmount = principalReceived + interestReceived;
    const status = statusText || (Math.max(totalPrincipal - principalReceived, 0) <= 0
      ? "Cleared"
      : finalAmount > 0
        ? "Partial"
        : "Pending");
    const outstandingPrincipal = Math.max(totalPrincipal - principalReceived, 0);
    const outstandingInterest = debtOutstandingInterestForStatus(status, totalPrincipal, record.date, record.outstandingInterest);
    const balanceWithInterest = outstandingPrincipal + outstandingInterest;

    return {
      key: safeText(record.id) || `${partyKey}-${index}`,
      party: safeText(record.party),
      records: [record],
      totalPrincipal,
      principalReceived,
      interestReceived,
      finalAmount,
      amountReceived: finalAmount,
      debtCleared: finalAmount,
      outstandingPrincipal,
      outstandingInterest,
      balanceWithInterest,
      status,
      lastUpdated: new Date(latestTimestamp([record]) || Date.now()).toISOString()
    };
  });

  const totals = summaries.reduce((acc, summary) => {
    acc.totalPrincipal += summary.totalPrincipal;
    acc.principalReceived += summary.principalReceived;
    acc.interestReceived += summary.interestReceived;
    if (summary.status === "Cleared") acc.amountReceived += summary.finalAmount;
    if (summary.status === "Pending" || summary.status === "Partial") {
      acc.outstandingPrincipal += summary.outstandingPrincipal;
      acc.outstandingInterest += summary.outstandingInterest;
      acc.balanceWithInterest += summary.balanceWithInterest;
    }
    if (summary.status === "Pending") acc.pendingDebts += 1;
    if (summary.status === "Partial") acc.partialDebts += 1;
    if (summary.status === "Cleared") acc.clearedDebts += 1;
    return acc;
  }, {
    summaries,
    totalPrincipal: 0,
    principalReceived: 0,
    interestReceived: 0,
    amountReceived: 0,
    outstandingPrincipal: 0,
    outstandingInterest: 0,
    balanceWithInterest: 0,
    pendingDebts: 0,
    partialDebts: 0,
    clearedDebts: 0
  });

  totals.totalReceived = totals.amountReceived;
  totals.pendingPrincipal = totals.outstandingPrincipal;
  return totals;
}

function getPartySuggestions(records) {
  const debtParties = new Set();
  const chittyParties = new Set();

  records.forEach((record) => {
    const party = safeText(record.party);
    if (!party) return;
    if (record.type === "debt_given") debtParties.add(party);
    if (record.type === "chitty_paid") chittyParties.add(party);
  });

  return {
    debtCleared: [...debtParties].sort((a, b) => a.localeCompare(b)),
    chittyReceived: [...chittyParties].sort((a, b) => a.localeCompare(b))
  };
}

function monthKey(record) {
  if (record.month) return safeText(record.month);
  const date = formatDateValue(record.date);
  return /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : "";
}

function inferClearedDate(record, records) {
  if (record.type === "debt_cleared") return formatDateValue(record.date);
  const notedDate = safeText(record.notes).match(/Received date:\s*([0-9-]+)/i);
  if (notedDate) return formatDateValue(notedDate[1]);
  const party = safeText(record.party).toLowerCase();
  const cleared = records
    .filter((candidate) => candidate.type === "debt_cleared" && safeText(candidate.party).toLowerCase() === party)
    .sort((a, b) => recordTime(a) - recordTime(b));
  return cleared.length ? formatDateValue(cleared[0].date) : "";
}

function chittyStatusText(records) {
  const hasReceived = records.some((record) => record.type === "chitty_received");
  if (hasReceived) return "Completed";
  const status = records.map((record) => safeText(record.status)).find(Boolean);
  return status || "On going";
}

function getChittySummaries(records) {
  const byGroup = new Map();
  records
    .filter((record) => record.type === "chitty_paid" || record.type === "chitty_received")
    .forEach((record) => {
      const key = safeText(record.party) || "Unnamed Chitty";
      const group = byGroup.get(key) || [];
      group.push(record);
      byGroup.set(key, group);
    });

  return [...byGroup.entries()].map(([party, groupRecords]) => {
    const paidRecords = groupRecords.filter((record) => record.type === "chitty_paid");
    const receivedRecords = groupRecords.filter((record) => record.type === "chitty_received");
    const paidMonths = new Set(paidRecords.map(monthKey).filter(Boolean)).size;
    const paidAmount = paidRecords.reduce((sum, record) => sum + money(record.amount), 0);
    const plan = parseChittyPlan(groupRecords);
    const receivedAmount = receivedRecords.reduce((sum, record) => sum + money(record.amount), 0) ||
      groupRecords.reduce((sum, record) => sum + money(record.amountReceived), 0);
    const tenureMonths = Number(groupRecords.map((record) => record.tenureMonths).find((value) => money(value) > 0)) || plan.tenureMonths || paidMonths;
    const startingMonth = groupRecords.map((record) => safeText(record.startingMonth)).find(Boolean) ||
      paidRecords.map(monthKey).filter(Boolean).sort()[0] ||
      "";
    const monthlyAmount = plan.monthlyAmount || (paidMonths ? paidAmount / paidMonths : 0);
    const finalAmount = plan.finalAmount || (tenureMonths && monthlyAmount ? monthlyAmount * tenureMonths : paidAmount);
    const isCompleted = Boolean(tenureMonths && paidMonths >= tenureMonths) || receivedRecords.length > 0;
    const pendingAmount = isCompleted ? 0 : Math.max((tenureMonths - paidMonths) * monthlyAmount, 0);

    return {
      party,
      groupRecords,
      paidRecords,
      receivedRecords,
      quantity: plan.quantity || 1,
      paidMonths,
      paidAmount,
      monthlyAmount,
      totalValue: finalAmount,
      finalAmount,
      receivedAmount,
      tenureMonths,
      startingMonth,
      pendingAmount,
      isCompleted
    };
  });
}

function isGeneratedChittySheet(sheet) {
  if (!sheet) return false;
  const header = sheet.getRow(1);
  return safeText(cellValue(header.getCell(1))).toLowerCase().includes("chitty / group id") ||
    safeText(cellValue(header.getCell(2))).toLowerCase() === "chitty / group";
}

function headerIndexMap(sheet) {
  const map = new Map();
  sheet.getRow(1).eachCell((cell, columnNumber) => {
    map.set(safeText(cellValue(cell)).toLowerCase(), columnNumber);
  });
  return map;
}

function getManualChittyOverrides(workbook) {
  const sheet = workbook.getWorksheet("Chitty");
  const overrides = new Map();
  if (!isGeneratedChittySheet(sheet)) return overrides;

  const headers = headerIndexMap(sheet);
  const column = (...names) => names.map((name) => headers.get(name.toLowerCase())).find(Boolean);
  const value = (row, ...names) => {
    const index = column(...names);
    return index ? cellValue(row.getCell(index)) : "";
  };
  const partyColumn = column("Chitty / Group");
  if (!partyColumn) return overrides;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || isEmptyRow(row, Math.min(sheet.columnCount, 18))) return;
    const party = safeText(cellValue(row.getCell(partyColumn)));
    if (!party) return;

    const totalValue = money(value(row, "Total Chitty Value"));
    const finalAmount = money(value(row, "Final Amount"));
    const currentMonthPaid = money(value(row, "Current Month Paid"));
    const completedMonths = numberOrBlank(value(row, "Completed Months"));
    let monthlyAmount = currentMonthPaid;
    for (let column = 1; column <= sheet.columnCount && !monthlyAmount; column++) {
      if (/^month\s+\d+$/i.test(safeText(cellValue(sheet.getRow(1).getCell(column))))) {
        monthlyAmount = money(cellValue(row.getCell(column)));
      }
    }
    const paidAmount = money(value(row, "Amount Paid Till Date")) || (completedMonths && monthlyAmount ? completedMonths * monthlyAmount : 0);
    const explicitStatus = safeText(value(row, "Status"));
    const isCompleted = explicitStatus.toLowerCase().includes("completed") ||
      Boolean(completedMonths && numberOrBlank(value(row, "Tenure (Months)")) && completedMonths >= numberOrBlank(value(row, "Tenure (Months)")));
    const derivedPendingAmount = Math.max(totalValue - (completedMonths || 0) * (monthlyAmount || currentMonthPaid || 0), 0);
    const pendingAmount = isCompleted ? 0 : derivedPendingAmount;
    const status = isCompleted ? "Completed" : "Running";

    overrides.set(party.toLowerCase(), {
      chittyId: safeText(value(row, "Chitty / Group ID")),
      party,
      totalValue,
      finalAmount,
      paidAmount,
      currentMonthPaid,
      monthlyAmount,
      pendingAmount,
      lastUpdated: safeText(value(row, "Last Updated Date", "Last Updated")) || nowIso(),
      notes: safeText(value(row, "Notes")),
      quantity: numberOrBlank(value(row, "Quantity")),
      tenureMonths: numberOrBlank(value(row, "Tenure (Months)")),
      startingMonth: safeText(value(row, "Starting Month")),
      paidMonths: completedMonths,
      status,
      receivedAmount: money(value(row, "Amount Received"))
    });
  });

  return overrides;
}

function applyChittyOverrides(summaries, overrides) {
  if (!overrides || !overrides.size) return summaries;
  const merged = summaries.map((summary) => {
    const override = overrides.get(safeText(summary.party).toLowerCase());
    if (!override) return summary;
    const pendingAmount = override.pendingAmount !== "" ? override.pendingAmount : summary.pendingAmount;
    const totalValue = override.totalValue || summary.totalValue || summary.finalAmount;
    const finalAmount = override.finalAmount || (override.status === "Completed" ? totalValue : summary.finalAmount);
    const paidAmount = override.paidAmount || summary.paidAmount;
    const isCompleted = pendingAmount <= 0 || safeText(override.status).toLowerCase().includes("completed");

    return {
      ...summary,
      chittyId: override.chittyId || summary.chittyId,
      totalValue,
      paidAmount,
      currentMonthPaid: override.currentMonthPaid,
      monthlyAmount: override.monthlyAmount || summary.monthlyAmount,
      finalAmount,
      receivedAmount: override.receivedAmount || summary.receivedAmount,
      tenureMonths: override.tenureMonths || summary.tenureMonths,
      startingMonth: override.startingMonth || summary.startingMonth,
      paidMonths: override.paidMonths || summary.paidMonths,
      pendingAmount,
      statusOverride: isCompleted ? "Completed" : "Running",
      lastUpdated: override.lastUpdated,
      manualNotes: override.notes,
      isCompleted
    };
  });
  const seen = new Set(merged.map((summary) => safeText(summary.party).toLowerCase()));
  overrides.forEach((override, key) => {
    if (seen.has(key)) return;
    const totalValue = override.totalValue || override.finalAmount || 0;
    const isCompleted = safeText(override.status).toLowerCase().includes("completed") || override.pendingAmount <= 0;
    merged.push({
      party: override.party,
      chittyId: override.chittyId || `CHITTY-${slugify(override.party)}`,
      groupRecords: [],
      paidRecords: [],
      receivedRecords: [],
      quantity: override.quantity || 1,
      paidMonths: override.paidMonths || 0,
      paidAmount: override.paidAmount || 0,
      monthlyAmount: override.monthlyAmount || override.currentMonthPaid || 0,
      currentMonthPaid: override.currentMonthPaid || override.monthlyAmount || 0,
      totalValue,
      finalAmount: override.finalAmount || (isCompleted ? totalValue : 0),
      receivedAmount: override.receivedAmount || 0,
      tenureMonths: override.tenureMonths || override.paidMonths || 0,
      startingMonth: override.startingMonth || "",
      pendingAmount: override.pendingAmount || 0,
      statusOverride: isCompleted ? "Completed" : "Running",
      lastUpdated: override.lastUpdated,
      manualNotes: override.notes,
      isCompleted
    });
  });
  return merged;
}

function slugify(value) {
  return safeText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "group";
}

function chittySummaryId(party) {
  return `CHITTY-SUMMARY-${slugify(party)}`;
}

function addMonths(month, count) {
  const match = safeText(month).match(/^(\d{4})-(\d{2})$/);
  if (!match) return formatMonthValue(new Date());
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1 + count;
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return date.toISOString().slice(0, 7);
}

function getChittySummaryForId(workbook, id) {
  const records = getAllRecords(workbook);
  const summaries = applyChittyOverrides(getChittySummaries(records), getManualChittyOverrides(workbook));
  return summaries.find((summary) => chittySummaryId(summary.party) === safeText(id));
}

function updateChittySheetRow(workbook, summary, updates) {
  const sheet = workbook.getWorksheet("Chitty");
  if (!isGeneratedChittySheet(sheet)) return;
  const headers = headerIndexMap(sheet);
  const getColumn = (...names) => names.map((name) => headers.get(name.toLowerCase())).find(Boolean);
  const setValue = (row, header, value) => {
    const column = getColumn(header);
    if (column) row.getCell(column).value = value;
  };
  const partyColumn = getColumn("Chitty / Group");
  let targetRow = null;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && safeText(cellValue(row.getCell(partyColumn))).toLowerCase() === safeText(summary.party).toLowerCase()) {
      targetRow = row;
    }
  });

  if (!targetRow) {
    targetRow = sheet.addRow([]);
    setValue(targetRow, "Chitty / Group ID", `CHITTY-${slugify(summary.party)}`);
    setValue(targetRow, "Chitty / Group", summary.party);
  }

  setValue(targetRow, "Total Chitty Value", updates.finalAmount);
  setValue(targetRow, "Amount Paid Till Date", updates.paidAmount);
  setValue(targetRow, "Current Month Paid", updates.currentMonthPaid);
  setValue(targetRow, "Balance Amount", updates.pendingAmount);
  setValue(targetRow, "Last Updated Date", updates.lastUpdated);
  setValue(targetRow, "Notes", updates.notes || summary.manualNotes || safeText(summary.groupRecords?.[0]?.notes));
  setValue(targetRow, "Quantity", updates.quantity || summary.quantity || 1);
  setValue(targetRow, "Tenure (Months)", updates.tenureMonths);
  setValue(targetRow, "Starting Month", updates.startingMonth);
  setValue(targetRow, "Completed Months", updates.paidMonths);
  setValue(targetRow, "Status", updates.status);
  setValue(targetRow, "Pending Chitty", updates.pendingAmount);
  setValue(targetRow, "Final Amount", updates.isCompleted ? updates.finalAmount : updates.pendingAmount);
  setValue(targetRow, "Amount Received", updates.isCompleted ? updates.finalAmount : summary.receivedAmount || 0);
}

function upsertChittyMonthlyPayment(workbook, id, payload) {
  const entries = workbook.getWorksheet("Entries");
  if (!entries) throw new Error("Entries sheet was not found.");
  const summary = getChittySummaryForId(workbook, id);
  if (!summary) throw new Error("This Chitty / Group was not found.");

  const amount = money(payload.amount || summary.currentMonthPaid || summary.monthlyAmount);
  if (!amount) throw new Error("Enter the current month Chitty payment amount.");

  const tenureMonths = Number(payload.tenureMonths || summary.tenureMonths || summary.paidMonths || 0);
  const startingMonth = safeText(payload.startingMonth) || summary.startingMonth || monthKey(summary.paidRecords[0]) || formatMonthValue(new Date());
  const nextMonth = safeText(payload.month) || addMonths(startingMonth, summary.paidMonths || 0);
  const nextDate = `${nextMonth}-01`;
  const existingRow = findEntryRowByPartyMonth(entries, summary.party, nextMonth, "chitty_paid");
  const previousAmount = existingRow ? money(cellValue(existingRow.getCell(5))) : 0;
  const record = rowFromEntryPayload({
    id: existingRow ? cellValue(existingRow.getCell(1)) : `FIN-CHITTY-${Date.now()}`,
    date: nextDate,
    type: "chitty_paid",
    party: summary.party,
    amount,
    mode: safeText(payload.mode),
    month: nextMonth,
    status: "Paid",
    notes: safeText(payload.notes) || summary.manualNotes || safeText(summary.groupRecords?.[0]?.notes),
    tenureMonths,
    startingMonth
  }, existingRow ? rowToEntry(existingRow) : {});

  if (existingRow) {
    writeEntryRow(existingRow, record);
  } else {
    entries.addRow(record);
  }

  const paidMonths = existingRow ? summary.paidMonths : (summary.paidMonths || 0) + 1;
  const paidAmount = Math.max((summary.paidAmount || 0) - previousAmount + amount, 0);
  const finalAmount = money(payload.totalChittyValue || summary.finalAmount || ((tenureMonths || paidMonths) * amount) || paidAmount);
  const isCompleted = Boolean(tenureMonths && paidMonths >= tenureMonths);
  const pendingAmount = isCompleted ? 0 : Math.max(finalAmount - paidAmount, 0);
  const status = isCompleted ? "Completed" : "Running";

  updateChittySheetRow(workbook, summary, {
    finalAmount,
    paidAmount,
    currentMonthPaid: amount,
    quantity: numberOrBlank(payload.quantity) || summary.quantity || 1,
    pendingAmount: isCompleted ? 0 : pendingAmount,
    paidMonths,
    tenureMonths,
    startingMonth,
    status,
    isCompleted,
    lastUpdated: nowIso(),
    notes: safeText(payload.notes) || summary.manualNotes
  });

  return { party: summary.party, month: nextMonth, paidAmount, pendingAmount: isCompleted ? 0 : pendingAmount, status };
}

function upsertLoanMonthlyPayment(workbook, id, payload) {
  const loans = getLoanRecords(workbook);
  const index = loans.findIndex((loan) => safeText(loan.id) === safeText(id));
  if (index === -1) throw new Error("This loan was not found in the Loan sheet.");

  const loan = loans[index];
  const amount = money(payload.amount || payload.loanPaid || loan.emi);
  if (!amount) throw new Error("Enter the current month Loan payment amount.");

  const monthPayments = { ...(loan.monthPayments || {}) };
  const nextMonthIndex = Math.max(0, ...Object.keys(monthPayments).map((key) => Number(key) || 0)) + 1;
  if (nextMonthIndex > 60) throw new Error("This Loan sheet supports up to 60 month entries.");

  monthPayments[nextMonthIndex] = amount;
  const typeOfFund = normalizeFundType(loan.typeOfFund);
  const finishedMonths = Object.keys(monthPayments).length;
  const loanPaid = typeOfFund === "Hand Loan"
    ? money(loan.loanPaid) + amount
    : (money(loan.emi) || amount) * finishedMonths;

  loans[index] = {
    ...loan,
    typeOfFund,
    monthPayments,
    finishedMonths,
    remainingMonths: Math.max(money(loan.tenureMonths) - finishedMonths, 0),
    loanPaid,
    lastUpdated: nowIso(),
    notes: safeText(payload.notes) || loan.notes
  };

  const loanSheet = resetWorksheet(workbook, "Loan");
  rebuildLoanSheet(loanSheet, loans);
  rebuildDerivedSheets(workbook);
  rebuildSummary(workbook);

  return {
    id,
    borrowedFrom: loan.borrowedFrom,
    monthIndex: nextMonthIndex,
    amount,
    finishedMonths
  };
}

function findEntryRowByPartyMonth(entries, party, month, type) {
  let foundRow = null;
  entries.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || foundRow) return;
    const record = rowToEntry(row);
    if (record.type === type && safeText(record.party).toLowerCase() === safeText(party).toLowerCase() && monthKey(record) === month) {
      foundRow = row;
    }
  });
  return foundRow;
}

function deleteChittyGroup(workbook, id) {
  const summary = getChittySummaryForId(workbook, id);
  if (!summary) throw new Error("This Chitty / Group was not found.");
  const entries = workbook.getWorksheet("Entries");
  if (entries) {
    for (let rowNumber = entries.rowCount; rowNumber >= 2; rowNumber--) {
      const record = rowToEntry(entries.getRow(rowNumber));
      if ((record.type === "chitty_paid" || record.type === "chitty_received") &&
        safeText(record.party).toLowerCase() === safeText(summary.party).toLowerCase()) {
        entries.spliceRows(rowNumber, 1);
      }
    }
  }

  const sheet = workbook.getWorksheet("Chitty");
  if (isGeneratedChittySheet(sheet)) {
    const headers = headerIndexMap(sheet);
    const partyColumn = headers.get("chitty / group");
    for (let rowNumber = sheet.rowCount; rowNumber >= 2; rowNumber--) {
      if (safeText(cellValue(sheet.getRow(rowNumber).getCell(partyColumn))).toLowerCase() === safeText(summary.party).toLowerCase()) {
        sheet.spliceRows(rowNumber, 1);
      }
    }
  }

  return summary.party;
}

function recordMetaSummary(records) {
  const ids = records.map((record) => safeText(record.id)).filter(Boolean);
  const createdAt = records.map((record) => safeText(record.createdAt)).filter(Boolean).pop() || "";
  const idText = ids.length > 1 ? `${ids[0]} to ${ids[ids.length - 1]} (${ids.length} records)` : ids[0] || "";
  return [idText, createdAt].filter(Boolean).join(" / ");
}

function defaultStatus(type, status) {
  if (safeText(status)) return safeText(status);
  if (type === "debt_given") return "Pending";
  if (type === "debt_cleared") return "Cleared";
  if (type === "chitty_paid") return "On going";
  if (type === "chitty_received") return "Completed";
  return "";
}

function rebuildChittySheet(sheet, records, chittyOverrides = new Map()) {
  const chittyRecords = records.filter((record) => record.type === "chitty_paid" || record.type === "chitty_received");
  const summaries = applyChittyOverrides(getChittySummaries(records), chittyOverrides);
  const maxMonths = Math.max(60, ...summaries.map((summary) => summary.tenureMonths || 0));
  const matrixColumns = [
    { header: "Chitty / Group ID", key: "chittyId", width: 18 },
    { header: "Chitty / Group", key: "party", width: 24 },
    { header: "Total Chitty Value", key: "totalValue", width: 18 },
    { header: "Amount Paid Till Date", key: "paidTillDate", width: 20 },
    { header: "Current Month Paid", key: "currentMonthPaid", width: 20 },
    { header: "Balance Amount", key: "balanceAmount", width: 18 },
    { header: "Last Updated Date", key: "lastUpdated", width: 22 },
    { header: "Notes", key: "notes", width: 42 },
    { header: "Quantity", key: "quantity", width: 12 },
    { header: "Tenure (Months)", key: "tenureMonths", width: 16 },
    { header: "Starting Month", key: "startingMonth", width: 16 },
    { header: "Completed Months", key: "completedMonths", width: 18 },
    { header: "Status", key: "status", width: 16 },
    { header: "Pending Chitty", key: "pendingChitty", width: 18 },
    { header: "Final Amount", key: "finalAmount", width: 18 },
    { header: "Amount Received", key: "amountReceived", width: 18 },
    { header: "ID / Created At", key: "recordMeta", width: 36 },
    ...Array.from({ length: maxMonths }, (_, index) => ({ header: `Month ${index + 1}`, key: `m_${index + 1}`, width: 14 }))
  ];

  styleColumnsSheet(sheet, matrixColumns, []);
  summaries
    .sort((a, b) => a.party.localeCompare(b.party))
    .forEach((summary) => {
      const { party, groupRecords, paidRecords, receivedRecords } = summary;
      const notes = summary.manualNotes || [...new Set(groupRecords.map((record) => safeText(record.notes)).filter(Boolean))].join(" | ");
      const statusText = summary.statusOverride || (summary.isCompleted ? "Completed" : "Running");
      const sortedPaid = paidRecords.slice().sort((a, b) => recordTime(b) - recordTime(a));
      const receivedText = receivedRecords.map((record) => {
        const month = monthKey(record);
        return `${month ? `${month}: ` : ""}${money(record.amount)} Chitty received`;
      }).join(" | ");
      const row = {
        chittyId: summary.chittyId || `CHITTY-${party.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "group"}`,
        party,
        totalValue: summary.totalValue || summary.finalAmount,
        paidTillDate: summary.paidAmount,
        currentMonthPaid: summary.currentMonthPaid || (sortedPaid.length ? money(sortedPaid[0].amount) : 0),
        balanceAmount: summary.pendingAmount,
        lastUpdated: summary.lastUpdated || new Date(latestTimestamp(groupRecords) || Date.now()).toISOString(),
        notes,
        quantity: summary.quantity,
        tenureMonths: summary.tenureMonths,
        startingMonth: summary.startingMonth,
        completedMonths: summary.paidMonths,
        status: statusText,
        pendingChitty: summary.pendingAmount,
        finalAmount: summary.isCompleted ? (summary.finalAmount || summary.totalValue) : money(summary.finalAmount),
        amountReceived: summary.isCompleted ? (summary.finalAmount || summary.totalValue) : summary.receivedAmount,
        recordMeta: recordMetaSummary(groupRecords)
      };

      for (let index = 1; index <= summary.tenureMonths; index++) {
        row[`m_${index}`] = index <= summary.paidMonths ? summary.monthlyAmount : "";
      }

      sheet.addRow(row);
    });
}

function applyAutomaticChittyCompletion(workbook) {
  const entries = workbook.getWorksheet("Entries");
  if (!entries) return;

  const records = getWebsiteEntries(workbook);
  const summaries = getChittySummaries(records);
  const summariesByParty = new Map(summaries.map((summary) => [summary.party.toLowerCase(), summary]));
  const completedParties = new Set(summaries.filter((summary) => summary.isCompleted).map((summary) => summary.party.toLowerCase()));

  if (!summariesByParty.size) return;

  entries.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || isEmptyRow(row, columns.length)) return;
    const record = rowToEntry(row);
    if (record.type !== "chitty_paid") return;
    const summary = summariesByParty.get(safeText(record.party).toLowerCase());
    if (!summary) return;
    if (!safeText(record.startingMonth)) row.getCell(12).value = summary.startingMonth;
    if (!money(record.tenureMonths)) row.getCell(11).value = summary.tenureMonths;
    if (!money(record.amountReceived) && summary.isCompleted) row.getCell(13).value = summary.receivedAmount || summary.finalAmount;
    if (completedParties.has(safeText(record.party).toLowerCase())) row.getCell(8).value = "Received";
  });
}

function rebuildDerivedSheets(workbook) {
  const records = sortRecords(getAllRecords(workbook)).reverse();
  const properties = getPropertyRecords(workbook);
  const loans = getLoanRecords(workbook);
  const cachedTradingRecords = readCachedUpstoxRows();
  const tradingRecords = cachedTradingRecords.length ? cachedTradingRecords : getTradingRecords(workbook);
  const chittyOverrides = getManualChittyOverrides(workbook);
  const existingDebtRows = getManualDebtRows(workbook).reduce((acc, record) => {
    const note = safeText(record.notes);
    const id = safeText(record.id);
    const party = safeText(record.party).toLowerCase();
    if (id) acc.byId.set(id, record);
    if (party) acc.byParty.set(party, record);
    return acc;
  }, { byId: new Map(), byParty: new Map() });
  const legacyDebts = workbook.getWorksheet("Debts");
  if (legacyDebts) workbook.removeWorksheet(legacyDebts.id);
  const debts = resetWorksheet(workbook, "Debt");
  const chitty = resetWorksheet(workbook, "Chitty");
  const propertySheet = resetWorksheet(workbook, "Properties");
  const loanSheet = resetWorksheet(workbook, "Loan");
  const trading = resetWorksheet(workbook, "Trading");

  styleColumnsSheet(debts, debtColumns, [
    "debtGiven",
    "finalAmount",
    "principalReceived",
    "interestReceived",
    "outstandingPrincipal",
    "outstandingInterest",
    "balanceWithInterest"
  ]);
  styleColumnsSheet(propertySheet, propertyColumns, [
    "purchasePricePerSqy",
    "purchaseTotalPrice",
    "sellPricePerSqy",
    "sellTotalPrice"
  ]);

  const debtSummary = getDebtSummary(records);
  const debtSummaryById = new Map(debtSummary.summaries.map((candidate) => [safeText(candidate.records?.[0]?.id), candidate]));
  const debtSummaryByParty = new Map(debtSummary.summaries.map((candidate) => [safeText(candidate.party).toLowerCase(), candidate]));
  records
    .filter((record) => record.type === "debt_given")
    .forEach((record) => {
      const partyKey = safeText(record.party).toLowerCase();
      const summary = debtSummaryById.get(safeText(record.id)) || debtSummaryByParty.get(partyKey) || {};
      const existingDebt = existingDebtRows.byId.get(safeText(record.id)) || existingDebtRows.byParty.get(partyKey) || {};
      const debtGiven = money(record.amount);
      const dateGiven = formatDateValue(record.date);
      const status = safeText(existingDebt.status) || summary.status || normalizeStatus(record.status) || "Pending";
      const dateCleared = existingDebt.dateCleared !== undefined
        ? existingDebt.dateCleared
        : summary.outstandingPrincipal <= 0 && summary.balanceWithInterest <= 0
          ? inferClearedDate(record, records)
          : "";
      const principalReceived = summary.principalReceived || 0;
      const interestReceived = normalizeStatus(status) === "Cleared"
        ? debtInterestBetween(debtGiven, dateGiven, dateCleared)
        : summary.interestReceived || 0;
      const finalAmount = principalReceived + interestReceived;
      const outstandingPrincipal = Math.max(debtGiven - principalReceived, 0);
      const outstandingInterest = debtOutstandingInterestForStatus(status, debtGiven, dateGiven, existingDebt.outstandingInterest);
      const balanceWithInterest = outstandingPrincipal + outstandingInterest;
      const debtRow = debts.addRow({
      ...record,
      typeLabel: entryTypes[record.type] || record.type,
      debtGiven,
      dateGiven: record.type === "debt_given" ? dateGiven : "",
      dateCleared,
      status,
      finalAmount,
      principalReceived,
      interestReceived,
      outstandingPrincipal,
      outstandingInterest,
      balanceWithInterest,
      notes: existingDebt.notes !== undefined
        ? safeText(existingDebt.notes)
          : safeText(record.notes),
      lastUpdated: summary.lastUpdated || record.lastUpdated || record.createdAt
    });
      applyDebtSheetCalculationCells(debtRow, status, outstandingInterest, balanceWithInterest);
  });

  rebuildChittySheet(chitty, records, chittyOverrides);
  rebuildLoanSheet(loanSheet, loans);
  rebuildTradingSheet(trading, tradingRecords);

  properties.forEach((record) => propertySheet.addRow(record));
  mirrorFinancialCalendarToNotifications(workbook);
}

function mirrorFinancialCalendarToNotifications(workbook) {
  const calendarRows = recordsForReport(workbook, "Financial Calendar");
  if (!calendarRows.length) return;
  const definition = moduleDefinitionBySheet("Notification Center");
  const sheet = ensureWorkbookSheetDefinition(workbook, definition);
  const existing = getModuleRecords(workbook, "Notification Center");
  calendarRows.forEach((row) => {
    const sourceId = safeText(row.id || `${row.eventDate}-${row.title || row.eventType}`);
    if (!sourceId) return;
    const notificationId = `CAL-${sourceId}`;
    const current = existing.find((item) => safeText(item.id) === notificationId) || {};
    const notification = normalizeModuleRecord("Notification Center", {
      ...current,
      id: notificationId,
      notificationDate: row.eventDate || row.dueDate || row.createdAt || nowIso().slice(0, 10),
      module: calendarDestinationModule(row),
      title: row.title || row.eventType || "Financial reminder",
      priority: row.priority || "On Track",
      status: row.status || "Pending",
      dueDate: row.eventDate || row.dueDate || "",
      notes: `Migrated from Financial Calendar | ${safeText(row.notes)}`,
      syncStatus: "Synced"
    }, current);
    const targetRow = current.id ? findModuleRow(sheet, definition, notificationId) : null;
    if (targetRow) {
      writeModuleRow(targetRow, definition, notification);
    } else {
      writeModuleRow(sheet.addRow([]), definition, notification);
    }
  });
}

function calendarDestinationModule(row) {
  const text = `${row.eventType || ""} ${row.title || ""} ${row.notes || ""}`.toLowerCase();
  if (text.includes("loan")) return "Loans and Property Loans";
  if (text.includes("chitty")) return "Chitty Family Circle";
  if (text.includes("bill") || text.includes("insurance") || text.includes("renewal")) return "Family Expenses";
  if (text.includes("goal") || text.includes("budget")) return "Goals & Planning";
  if (text.includes("tax")) return "Tax Planner";
  if (text.includes("backup")) return "Backup & Restore";
  return "Notification Center";
}

function syncDebtStatusRows(workbook) {
  const entries = workbook.getWorksheet("Entries");
  if (!entries) return;
  const records = getWebsiteEntries(workbook);
  const summary = getDebtSummary(records);
  const byId = new Map(summary.summaries.map((row) => [safeText(row.records?.[0]?.id), row]));
  const byParty = new Map(summary.summaries.map((row) => [safeText(row.party).toLowerCase(), row]));

  entries.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || isEmptyRow(row, columns.length)) return;
    const record = rowToEntry(row);
    if (record.type !== "debt_given") return;
    const debt = byId.get(safeText(record.id)) || byParty.get(safeText(record.party).toLowerCase());
    if (!debt) return;
    row.getCell(8).value = debt.status;
    row.getCell(15).value = debt.lastUpdated;
  });
}

function rebuildTradingSheet(sheet, existingRows = []) {
  styleColumnsSheet(sheet, tradingColumns, [
    "averageBuyPrice",
    "currentMarketPrice",
    "quantity",
    "investedValue",
    "currentValue",
    "realisedProfitLoss",
    "unrealisedProfitLoss",
    "profitLoss",
    "profitPercent"
  ]);
  const percentColumn = sheet.getColumn("profitPercent");
  if (percentColumn) percentColumn.numFmt = "0.00%";

  let rows = existingRows.length ? existingRows : [];
  try {
    if (!rows.length && fsSync.existsSync(upstoxPortfolioPath)) {
      rows = JSON.parse(fsSync.readFileSync(upstoxPortfolioPath, "utf8"));
    }
  } catch (error) {
    appendSyncLog("Unable to read Upstox portfolio JSON.", error);
  }

  rows.forEach((item, index) => {
    sheet.addRow(normalizeTradingRecord(item, index));
  });
}

function firstNonBlank(...values) {
  return values.find((value) => safeText(value));
}

function firstNumber(...values) {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const parsed = money(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function hasNumberInput(...values) {
  return values.some((value) => value !== undefined && value !== null && value !== "" && Number.isFinite(money(value)));
}

function headerIndexMap(sheet) {
  const map = new Map();
  const header = sheet.getRow(1);
  header.eachCell((cell, columnNumber) => {
    const text = safeText(cellValue(cell));
    if (text) map.set(text.toLowerCase(), columnNumber);
  });
  return map;
}

function tradingCell(row, headerMap, ...headers) {
  for (const header of headers) {
    const columnNumber = headerMap.get(safeText(header).toLowerCase());
    if (columnNumber) return cellValue(row.getCell(columnNumber));
  }
  return "";
}

function tradingInstrumentName(item) {
  return safeText(
    item.name ||
    item.symbol ||
    item.trading_symbol ||
    item.tradingsymbol ||
    item.scrip_name ||
    item.company_name ||
    item.fund ||
    item.instrument_name ||
    item.instrument_key ||
    item.isin
  );
}

function tradingInstrumentKey(item) {
  return sameInstrumentKey(
    item.instrumentKey ||
    item.instrument_key ||
    item.instrument_token ||
    item.isin ||
    item.symbol ||
    item.trading_symbol ||
    item.tradingsymbol ||
    item.name
  );
}

function tradingLookupKeys(item) {
  const keys = new Set();
  [
    item.instrumentKey,
    item.instrument_key,
    item.instrument_token,
    item.isin,
    item.symbol,
    item.trading_symbol,
    item.tradingsymbol,
    item.name,
    item.company_name,
    item.scrip_name,
    item.instrument_name
  ].forEach((value) => {
    const key = sameInstrumentKey(value);
    if (!key) return;
    keys.add(key);
    const parts = key.split("|").filter(Boolean);
    if (parts.length > 1) keys.add(parts[parts.length - 1]);
  });
  return keys;
}

function hasTradingKeyMatch(leftKeys, rightKeys) {
  for (const key of leftKeys) {
    if (rightKeys.has(key)) return true;
  }
  return false;
}

function looksLikeSyncInvestedDate(item, investedDate) {
  const typeText = safeText(item.assetType || item.asset_type || item.type).toLowerCase();
  const sourceText = safeText(item.source).toLowerCase();
  if (typeText === "trade" || typeText.includes("sold trade") || sourceText.includes("trade")) return false;
  const lastUpdatedDate = dateOnly(item.lastUpdated || item.last_updated || item.lastUpdatedTimestamp);
  return Boolean(investedDate && lastUpdatedDate && investedDate === lastUpdatedDate);
}

function tradingDateFromItem(item, options = {}) {
  const explicitInvestedDate = dateOnly(item.investedDate || item.invested_date);
  const sourceText = safeText(item.investedDateSource || item.invested_date_source).toLowerCase();
  const isManualDate = sourceText === "manual";
  if (explicitInvestedDate && (isManualDate || options.trustInvestedDate || !looksLikeSyncInvestedDate(item, explicitInvestedDate))) {
    return explicitInvestedDate;
  }
  return dateOnly(
    item.purchase_date ||
    item.purchaseDate ||
    item.buy_date ||
    item.buyDate ||
    item.acquired_date ||
    item.acquiredDate ||
    item.transaction_date ||
    item.transactionDate ||
    item.trade_date ||
    item.tradeDate ||
    item.exchange_timestamp ||
    item.exchangeTimestamp ||
    item.order_timestamp ||
    item.orderTimestamp ||
    item.date
  );
}

function normalizeTradingRecord(item, index = 0, options = {}) {
  const quantity = firstNumber(item.quantity, item.net_quantity);
  const averageBuyPrice = firstNumber(item.averageBuyPrice, item.average_buy_price, item.average_price, item.buy_price);
  const currentMarketPrice = firstNumber(item.currentMarketPrice, item.current_market_price, item.last_price, item.close_price);
  const investedValue = firstNumber(item.investedValue, item.invested_value, item.buy_value) || averageBuyPrice * quantity;
  const currentValue = firstNumber(item.currentValue, item.current_value) || currentMarketPrice * quantity;
  const realisedInputs = [item.realisedProfitLoss, item.realised_profit_loss, item.realizedProfitLoss, item.realised, item.realized, item.realised_pnl, item.realized_pnl];
  const unrealisedInputs = [item.unrealisedProfitLoss, item.unrealised_profit_loss, item.unrealizedProfitLoss, item.unrealised, item.unrealized];
  const profitInputs = [item.profitLoss, item.profit_loss, item.pnl];
  const realisedProfitLoss = firstNumber(...realisedInputs);
  const unrealisedProfitLoss = hasNumberInput(...unrealisedInputs)
    ? firstNumber(...unrealisedInputs)
    : currentValue - investedValue;
  const profitLoss = hasNumberInput(...profitInputs)
    ? firstNumber(...profitInputs)
    : realisedProfitLoss + unrealisedProfitLoss;
  return {
    id: safeText(item.id || item.instrument_token || item.instrument_key || item.isin || `TRD-${index + 1}`),
    assetType: safeText(item.assetType || item.asset_type || item.type || "Holding"),
    instrumentKey: tradingInstrumentKey(item),
    name: tradingInstrumentName(item),
    investedDate: tradingDateFromItem(item, options),
    investedDateSource: safeText(item.investedDateSource || item.invested_date_source),
    averageBuyPrice,
    currentMarketPrice,
    quantity,
    investedValue,
    currentValue,
    realisedProfitLoss,
    unrealisedProfitLoss,
    profitLoss,
    profitPercent: investedValue ? profitLoss / investedValue : 0,
    lastUpdated: safeText(item.lastUpdated || item.last_updated || item.lastUpdatedTimestamp) || nowIso()
  };
}

function readJsonArraySync(filePath) {
  try {
    if (!fsSync.existsSync(filePath)) return [];
    const rows = JSON.parse(fsSync.readFileSync(filePath, "utf8"));
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    appendSyncLog(`Unable to read JSON cache: ${filePath}`, error);
    return [];
  }
}

async function writeJsonArray(filePath, rows) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(Array.isArray(rows) ? rows : [], null, 2));
}

function readCachedUpstoxRows() {
  return readJsonArraySync(upstoxPortfolioPath)
    .map((item, index) => normalizeTradingRecord(item, index))
    .filter((row) => row.id || row.name);
}

function findTradingRowIndex(rows, targetId) {
  const target = sameInstrumentKey(targetId);
  return rows.findIndex((item, index) => {
    const record = normalizeTradingRecord(item, index, {
      trustInvestedDate: safeText(item.investedDateSource || item.invested_date_source).toLowerCase() === "manual"
    });
    const keys = new Set([
      sameInstrumentKey(record.id),
      sameInstrumentKey(record.instrumentKey),
      sameInstrumentKey(record.name)
    ]);
    tradingLookupKeys(record).forEach((key) => keys.add(key));
    return keys.has(target);
  });
}

async function updateCachedTradingInvestedDate(targetId, investedDate) {
  const rows = readJsonArraySync(upstoxPortfolioPath);
  const rowIndex = findTradingRowIndex(rows, targetId);
  if (rowIndex < 0) return null;
  rows[rowIndex] = {
    ...rows[rowIndex],
    investedDate,
    investedDateSource: investedDate ? "manual" : "",
    lastUpdated: nowIso()
  };
  await writeJsonArray(upstoxPortfolioPath, rows);
  return normalizeTradingRecord(rows[rowIndex], rowIndex, { trustInvestedDate: Boolean(investedDate) });
}

function readCachedUpstoxTrades() {
  return readJsonArraySync(upstoxTradesPath)
    .map((item, index) => normalizeUpstoxTrade(item, item.source || "cache", index))
    .filter((row) => row.id && row.name);
}

function getTradingRecords(workbook) {
  const sheet = workbook.getWorksheet("Trading");
  const records = [];
  if (!sheet) return readCachedUpstoxRows();
  const headerMap = headerIndexMap(sheet);

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || isEmptyRow(row, tradingColumns.length)) return;
    const rowRecord = {
      id: tradingCell(row, headerMap, "ID"),
      assetType: tradingCell(row, headerMap, "Asset Type"),
      name: tradingCell(row, headerMap, "Symbol / Name"),
      investedDate: formatDateValue(tradingCell(row, headerMap, "Invested Date")),
      averageBuyPrice: money(tradingCell(row, headerMap, "Average Buy Price")),
      currentMarketPrice: money(tradingCell(row, headerMap, "Current Market Price")),
      quantity: money(tradingCell(row, headerMap, "Quantity")),
      investedValue: money(tradingCell(row, headerMap, "Invested Value")),
      currentValue: money(tradingCell(row, headerMap, "Current Value")),
      realisedProfitLoss: money(tradingCell(row, headerMap, "Realised Profit/Loss", "Realized Profit/Loss")),
      unrealisedProfitLoss: money(tradingCell(row, headerMap, "Unrealised Profit/Loss", "Unrealized Profit/Loss")),
      profitLoss: money(tradingCell(row, headerMap, "Profit/Loss")),
      profitPercent: money(tradingCell(row, headerMap, "Profit %")),
      lastUpdated: tradingCell(row, headerMap, "Last Updated Timestamp")
    };
    records.push(normalizeTradingRecord(rowRecord, rowNumber - 2));
  });

  const cachedRows = readCachedUpstoxRows();
  if (cachedRows.length && (!records.length || cachedRows.length >= records.length)) return cachedRows;
  return records;
}

function getTradingTotals(tradingRecords = [], tradingTrades = readCachedUpstoxTrades()) {
  const rows = Array.isArray(tradingRecords) ? tradingRecords : [];
  const activeRows = rows.filter((row) => !safeText(row.assetType).toLowerCase().includes("sold"));
  const tradeSummaries = buildTradingLotSummaries(tradingTrades);
  const tradePurchaseValue = [...tradeSummaries.values()].reduce((sum, row) => sum + money(row.purchaseValue), 0);
  const realisedFromTrades = [...tradeSummaries.values()].reduce((sum, row) => sum + money(row.realisedProfitLoss), 0);
  const investedValue = tradePurchaseValue || activeRows.reduce((sum, row) => sum + money(row.investedValue), 0);
  const currentValue = activeRows.reduce((sum, row) => sum + money(row.currentValue), 0);
  const realisedProfitLoss = tradingTrades.length
    ? realisedFromTrades
    : activeRows.reduce((sum, row) => sum + money(row.realisedProfitLoss), 0);
  const unrealisedProfitLoss = activeRows.reduce((sum, row) => {
    const explicit = money(row.unrealisedProfitLoss);
    return sum + (explicit || money(row.profitLoss));
  }, 0);
  const profitLoss = realisedProfitLoss + unrealisedProfitLoss;
  const shares = activeRows.reduce((sum, row) => sum + Math.max(money(row.quantity), 0), 0);
  return {
    tradingRecords: rows.length,
    tradingHoldings: activeRows.length,
    tradingShares: shares,
    tradingTradeRecords: Array.isArray(tradingTrades) ? tradingTrades.length : 0,
    tradingInvestedValue: investedValue,
    tradingCurrentValue: currentValue,
    tradingRealisedProfitLoss: realisedProfitLoss,
    tradingUnrealisedProfitLoss: unrealisedProfitLoss,
    tradingProfitLoss: profitLoss,
    tradingProfitPercent: investedValue ? profitLoss / investedValue : 0,
    tradingPositiveRecords: rows.filter((row) => money(row.profitLoss) > 0).length,
    tradingNegativeRecords: rows.filter((row) => money(row.profitLoss) < 0).length,
    tradingOnTrackRecords: rows.filter((row) => money(row.profitLoss) === 0).length
  };
}

function lookupTradeSummary(item, summaries) {
  const itemKeys = tradingLookupKeys(item);
  for (const summary of summaries.values()) {
    const summaryKeys = new Set(summary.aliasKeys || []);
    tradingLookupKeys(summary).forEach((key) => summaryKeys.add(key));
    if (hasTradingKeyMatch(itemKeys, summaryKeys)) return summary;
  }
  return null;
}

function lookupTradingInvestedDateHint(item, investedDateHints = new Map()) {
  for (const key of tradingLookupKeys(item)) {
    const hintedDate = investedDateHints.get(key);
    if (hintedDate) return hintedDate;
  }
  return "";
}

function buildTradingInvestedDateHints(rows = []) {
  const hints = new Map();
  rows.forEach((row) => {
    const investedDate = tradingDateFromItem(row);
    if (!investedDate) return;
    tradingLookupKeys(row).forEach((key) => {
      const existingDate = hints.get(key);
      if (!existingDate || investedDate < existingDate) hints.set(key, investedDate);
    });
  });
  return hints;
}

function normalizeTradingItem(item, assetType, index, tradeSummaries = new Map(), investedDateHints = new Map()) {
  const summary = lookupTradeSummary(item, tradeSummaries);
  const hintedInvestedDate = lookupTradingInvestedDateHint(item, investedDateHints);
  const investedDate = summary?.earliestBuyDate || hintedInvestedDate || tradingDateFromItem(item);
  const quantity = firstNumber(item.quantity, item.net_quantity);
  const averageBuyPrice = firstNumber(item.average_price, item.averageBuyPrice, item.buy_price);
  const currentMarketPrice = firstNumber(item.last_price, item.currentMarketPrice, item.current_market_price, item.close_price);
  const investedValue = firstNumber(item.invested_value, item.buy_value) || averageBuyPrice * quantity;
  const currentValue = firstNumber(item.current_value) || currentMarketPrice * quantity;
  const realisedInputs = [item.realised, item.realized, item.realised_pnl, item.realized_pnl, item.realisedProfitLoss];
  const unrealisedInputs = [item.unrealised, item.unrealized, item.unrealised_pnl, item.unrealized_pnl];
  const profitInputs = [item.pnl, item.profitLoss];
  const realisedProfitLoss = hasNumberInput(...realisedInputs) ? firstNumber(...realisedInputs) : money(summary?.realisedProfitLoss);
  const unrealisedProfitLoss = hasNumberInput(...unrealisedInputs) ? firstNumber(...unrealisedInputs) : currentValue - investedValue;
  const profitLoss = hasNumberInput(...profitInputs) ? firstNumber(...profitInputs) : realisedProfitLoss + unrealisedProfitLoss;
  const instrumentKey = tradingInstrumentKey(item);
  return normalizeTradingRecord({
    id: item.instrument_token || item.instrument_key || item.isin || `${assetType}-${index + 1}`,
    assetType,
    instrumentKey,
    name: tradingInstrumentName(item),
    investedDate,
    investedDateSource: summary?.earliestBuyDate ? "trade-history" : hintedInvestedDate ? "manual" : "",
    averageBuyPrice,
    currentMarketPrice,
    quantity,
    investedValue,
    currentValue,
    realisedProfitLoss,
    unrealisedProfitLoss,
    profitLoss,
    lastUpdated: nowIso()
  }, index, { trustInvestedDate: Boolean(summary?.earliestBuyDate || hintedInvestedDate) });
}

function tradeUniqueId(item, source, index) {
  const direct = firstNonBlank(item.id, item.trade_id, item.tradeId, item.order_id, item.orderId, item.exchange_order_id, item.exchangeOrderId, item.transaction_id, item.transactionId);
  if (direct) return `${source}-${direct}`;
  const fallback = [
    source,
    tradingInstrumentKey(item),
    item.transaction_type || item.transactionType || item.side,
    item.quantity,
    item.average_price || item.price || item.trade_price,
    item.exchange_timestamp || item.order_timestamp || item.transaction_date || item.trade_date,
    index
  ].map((value) => safeText(value)).join("|");
  return `${source}-${crypto.createHash("sha1").update(fallback).digest("hex").slice(0, 16)}`;
}

function normalizeUpstoxTrade(item, source = "upstox", index = 0) {
  const transactionType = safeText(item.transaction_type || item.transactionType || item.side || item.type).toUpperCase();
  const quantity = firstNumber(item.quantity, item.traded_quantity, item.filled_quantity);
  const price = firstNumber(item.average_price, item.trade_price, item.price, item.averagePrice);
  const tradeValue = firstNumber(item.tradeValue, item.trade_value, item.value, item.amount, item.traded_value) || price * quantity;
  const investedDate = dateOnly(
    item.investedDate ||
    item.tradeDate ||
    item.exchange_timestamp ||
    item.order_timestamp ||
    item.transaction_date ||
    item.trade_date ||
    item.date
  );
  return {
    id: safeText(item.id) || tradeUniqueId(item, source, index),
    source,
    assetType: "Trade",
    instrumentKey: tradingInstrumentKey(item),
    name: tradingInstrumentName(item),
    transactionType,
    quantity,
    price,
    tradeValue,
    orderId: safeText(item.order_id || item.orderId),
    tradeId: safeText(item.trade_id || item.tradeId),
    exchangeOrderId: safeText(item.exchange_order_id || item.exchangeOrderId),
    investedDate,
    tradeDate: investedDate,
    financialYear: financialYearForDate(investedDate),
    lastUpdated: safeText(item.lastUpdated) || nowIso()
  };
}

function mergeUpstoxTrades(existingTrades, newTrades) {
  const byId = new Map();
  [...existingTrades, ...newTrades].forEach((item, index) => {
    const trade = normalizeUpstoxTrade(item, item.source || "upstox", index);
    if (!trade.id || !trade.name) return;
    byId.set(trade.id, { ...(byId.get(trade.id) || {}), ...trade });
  });
  return [...byId.values()].sort((a, b) => {
    const left = parseDateLike(a.tradeDate || a.investedDate)?.getTime() || 0;
    const right = parseDateLike(b.tradeDate || b.investedDate)?.getTime() || 0;
    return left - right;
  });
}

function buildTradingLotSummaries(trades = []) {
  const summaries = new Map();
  const sorted = [...(Array.isArray(trades) ? trades : [])]
    .map((item, index) => normalizeUpstoxTrade(item, item.source || "upstox", index))
    .filter((trade) => trade.name && trade.quantity > 0)
    .sort((a, b) => {
      const left = parseDateLike(a.tradeDate || a.investedDate)?.getTime() || 0;
      const right = parseDateLike(b.tradeDate || b.investedDate)?.getTime() || 0;
      return left - right;
    });

  sorted.forEach((trade) => {
    const tradeKeys = tradingLookupKeys(trade);
    const key = [...tradeKeys][0] || sameInstrumentKey(trade.name);
    if (!key) return;
    let summary = null;
    for (const candidate of summaries.values()) {
      if (hasTradingKeyMatch(tradeKeys, new Set(candidate.aliasKeys || []))) {
        summary = candidate;
        break;
      }
    }
    if (!summary) {
      summary = {
        instrumentKey: key,
        name: trade.name,
        aliasKeys: [],
        earliestBuyDate: "",
        lastTradeDate: "",
        buyQuantity: 0,
        soldQuantity: 0,
        netQuantity: 0,
        purchaseValue: 0,
        saleValue: 0,
        realisedProfitLoss: 0,
        lots: []
      };
      summaries.set(key, summary);
    }
    tradeKeys.forEach((alias) => {
      if (!summary.aliasKeys.includes(alias)) summary.aliasKeys.push(alias);
    });
    const side = safeText(trade.transactionType).toUpperCase();
    const quantity = Math.max(money(trade.quantity), 0);
    const price = money(trade.price);
    const value = money(trade.tradeValue) || price * quantity;
    const dateText = trade.tradeDate || trade.investedDate;
    summary.lastTradeDate = dateText || summary.lastTradeDate;

    if (side.includes("BUY") || (!side.includes("SELL") && value >= 0)) {
      summary.buyQuantity += quantity;
      summary.netQuantity += quantity;
      summary.purchaseValue += value;
      if (!summary.earliestBuyDate || (dateText && dateText < summary.earliestBuyDate)) summary.earliestBuyDate = dateText;
      summary.lots.push({ remaining: quantity, price: quantity ? value / quantity : price });
    } else if (side.includes("SELL")) {
      summary.soldQuantity += quantity;
      summary.netQuantity -= quantity;
      summary.saleValue += value;
      let remaining = quantity;
      let costBasis = 0;
      while (remaining > 0 && summary.lots.length) {
        const lot = summary.lots[0];
        const consumed = Math.min(remaining, lot.remaining);
        costBasis += consumed * money(lot.price);
        lot.remaining -= consumed;
        remaining -= consumed;
        if (lot.remaining <= 0.000001) summary.lots.shift();
      }
      if (remaining > 0) costBasis += remaining * (quantity ? value / quantity : price);
      summary.realisedProfitLoss += value - costBasis;
    }
  });

  return summaries;
}

function soldRowsFromTradeSummaries(tradeSummaries, activeRows) {
  const activeKeys = new Set();
  activeRows.forEach((row) => tradingLookupKeys(row).forEach((key) => activeKeys.add(key)));
  const rows = [];
  tradeSummaries.forEach((summary, key) => {
    const summaryKeys = new Set(summary.aliasKeys || [key]);
    tradingLookupKeys(summary).forEach((alias) => summaryKeys.add(alias));
    if (hasTradingKeyMatch(summaryKeys, activeKeys) || summary.saleValue <= 0) return;
    rows.push(normalizeTradingRecord({
      id: `TRD-SOLD-${crypto.createHash("sha1").update(key).digest("hex").slice(0, 10)}`,
      assetType: "Sold Trade",
      instrumentKey: key,
      name: summary.name,
      investedDate: summary.earliestBuyDate || summary.lastTradeDate,
      averageBuyPrice: summary.buyQuantity ? summary.purchaseValue / summary.buyQuantity : 0,
      currentMarketPrice: 0,
      quantity: 0,
      investedValue: summary.purchaseValue,
      currentValue: summary.saleValue,
      realisedProfitLoss: summary.realisedProfitLoss,
      unrealisedProfitLoss: 0,
      profitLoss: summary.realisedProfitLoss,
      lastUpdated: summary.lastTradeDate || nowIso()
    }, rows.length, { trustInvestedDate: true }));
  });
  return rows;
}

async function fetchUpstoxBody(endpoint, token) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  if (timeout.unref) timeout.unref();
  try {
    const response = await fetch(`https://api.upstox.com/v2${endpoint}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = response.status === 401 || response.status === 403
        ? "Upstox access token expired or is not authorised. Save a fresh token."
        : response.status === 429
          ? "Upstox rate limit reached. Existing records were preserved."
          : body?.errors?.[0]?.message || body?.message || `Upstox request failed: ${endpoint}`;
      const error = new Error(message);
      error.statusCode = response.status;
      throw error;
    }
    return body;
  } catch (error) {
    if (error.name === "AbortError") throw new Error(`Upstox request timed out: ${endpoint}`);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchUpstoxJson(endpoint, token) {
  return extractDataArray(await fetchUpstoxBody(endpoint, token));
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function dateParam(date) {
  return date.toISOString().slice(0, 10);
}

function historyWindows(startValue, endValue = new Date()) {
  const requestedStart = parseDateLike(startValue) || parseDateLike(defaultUpstoxHistoryStartDate);
  const end = parseDateLike(endValue) || new Date();
  const currentFyStartYear = (end.getUTCMonth() + 1) >= 4 ? end.getUTCFullYear() : end.getUTCFullYear() - 1;
  const apiLimitStart = new Date(Date.UTC(currentFyStartYear - 2, 3, 1));
  const start = requestedStart < apiLimitStart ? apiLimitStart : requestedStart;
  const windows = [];
  let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const finalDate = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  while (cursor <= finalDate) {
    const fiscalStartYear = (cursor.getUTCMonth() + 1) >= 4 ? cursor.getUTCFullYear() : cursor.getUTCFullYear() - 1;
    const fiscalEnd = new Date(Date.UTC(fiscalStartYear + 1, 2, 31));
    const actualEnd = fiscalEnd > finalDate ? finalDate : fiscalEnd;
    windows.push({ start: dateParam(cursor), end: dateParam(actualEnd) });
    cursor = addDays(actualEnd, 1);
  }
  return windows;
}

async function fetchUpstoxDayTrades(token) {
  const rows = await fetchUpstoxJson("/order/trades/get-trades-for-day", token);
  return rows.map((item, index) => normalizeUpstoxTrade(item, "day-trade", index));
}

async function fetchUpstoxHistoricalTrades(token, startDate) {
  const trades = [];
  const windows = historyWindows(startDate);
  for (const window of windows) {
    for (let page = 1; page <= 20; page++) {
      const endpoint = `/charges/historical-trades?segment=EQ&start_date=${window.start}&end_date=${window.end}&page_number=${page}&page_size=100`;
      const rows = await fetchUpstoxJson(endpoint, token);
      rows.forEach((item, index) => trades.push(normalizeUpstoxTrade(item, "historical-trade", trades.length + index)));
      if (rows.length < 100) break;
    }
  }
  return trades;
}

async function syncUpstoxPortfolioData({ forceHistory = false } = {}) {
  const config = await readConfig();
  const token = process.env.UPSTOX_ACCESS_TOKEN || config.upstoxAccessToken;
  if (!token) {
    return {
      ok: false,
      skipped: true,
      message: "Upstox access token is not configured.",
      rows: readCachedUpstoxRows(),
      trades: readCachedUpstoxTrades()
    };
  }

  const cachedRows = readCachedUpstoxRows();
  const cachedTrades = readCachedUpstoxTrades();
  const newTrades = [];
  const tradeErrors = [];
  const historyStartDate = config.upstoxHistoryStartDate || defaultUpstoxHistoryStartDate;
  const lastHistorySync = parseDateLike(config.lastUpstoxHistorySync);
  const historyDue = forceHistory || !cachedTrades.length || !lastHistorySync || (Date.now() - lastHistorySync.getTime()) > 6 * 60 * 60 * 1000;
  let historyFetched = false;

  try {
    newTrades.push(...await fetchUpstoxDayTrades(token));
  } catch (error) {
    tradeErrors.push(`Day trades: ${error.message}`);
  }

  if (historyDue) {
    try {
      newTrades.push(...await fetchUpstoxHistoricalTrades(token, historyStartDate));
      historyFetched = true;
    } catch (error) {
      tradeErrors.push(`Historical trades: ${error.message}`);
    }
  }

  const mergedTrades = mergeUpstoxTrades(cachedTrades, newTrades);
  if (newTrades.length || !cachedTrades.length) await writeJsonArray(upstoxTradesPath, mergedTrades);
  const tradeSummaries = buildTradingLotSummaries(mergedTrades);
  const investedDateHints = buildTradingInvestedDateHints(cachedRows);
  const sources = [
    { assetType: "Equity Holding", endpoint: "/portfolio/long-term-holdings" },
    { assetType: "Trading Position", endpoint: "/portfolio/short-term-positions" },
    { assetType: "Mutual Fund", endpoint: "/mf/holdings" }
  ];
  const settled = await Promise.allSettled(sources.map((source) => fetchUpstoxJson(source.endpoint, token)));
  const rows = [];
  const errors = [];

  settled.forEach((result, sourceIndex) => {
    if (result.status === "rejected") {
      errors.push(`${sources[sourceIndex].assetType}: ${result.reason.message}`);
      return;
    }
    result.value.forEach((item, rowIndex) => rows.push(normalizeTradingItem(item, sources[sourceIndex].assetType, rowIndex, tradeSummaries, investedDateHints)));
  });

  const finalRows = rows.length || !errors.length
    ? [...rows, ...soldRowsFromTradeSummaries(tradeSummaries, rows)]
    : cachedRows;
  if (rows.length || !errors.length) await writeJsonArray(upstoxPortfolioPath, finalRows);
  const allErrors = [...errors, ...tradeErrors].filter(Boolean);
  const success = rows.length > 0 || newTrades.length > 0 || (!errors.length && !tradeErrors.length);
  await updateConfig({
    ...(success ? { lastUpstoxSync: nowIso() } : {}),
    ...(historyFetched ? { lastUpstoxHistorySync: nowIso() } : {}),
    lastUpstoxSyncError: allErrors.join(" | "),
    upstoxHistoryStartDate: historyStartDate
  });
  if (allErrors.length) await appendSyncLog("Upstox sync had partial errors.", new Error(allErrors.join(" | ")));
  return { ok: !allErrors.length, rows: finalRows, trades: mergedTrades, errors: allErrors };
}

async function loadWorkbook() {
  const workbookPath = await getWorkbookPath();
  let workbook = new ExcelJS.Workbook();
  await waitForWorkbookWriteToFinish();
  if (await exists(workbookPath)) {
    try {
      await readWorkbookWithRetry(workbook, workbookPath);
    } catch (error) {
      const restored = await restoreWorkbookFromHealthyBackup(workbookPath, "corrupt local workbook");
      if (!restored) throw error;
      workbook = new ExcelJS.Workbook();
      await readWorkbookWithRetry(workbook, workbookPath);
    }
    if (!workbookHasFinanceData(workbook)) {
      const restored = await restoreWorkbookFromHealthyBackup(workbookPath, "header-only local workbook");
      if (restored) {
        workbook = new ExcelJS.Workbook();
        await readWorkbookWithRetry(workbook, workbookPath);
      }
    }
  } else {
    await waitForWorkbookWriteToFinish();
    if (await exists(workbookPath)) {
      await readWorkbookWithRetry(workbook, workbookPath);
      return workbook;
    }
    const restored = await restoreWorkbookFromHealthyBackup(workbookPath, "missing local workbook");
    if (restored) {
      await readWorkbookWithRetry(workbook, workbookPath);
    } else {
      const entries = workbook.addWorksheet("Entries");
      entries.columns = columns;
      styleSheet(entries);

      const summary = workbook.addWorksheet("Summary");
      summary.columns = [
        { header: "Metric", key: "metric", width: 28 },
        { header: "Value", key: "value", width: 18 }
      ];
      summary.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      summary.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
      summary.getColumn(2).numFmt = "#,##0.00";
      ensureMasterSpecSheets(workbook);
      await fs.mkdir(path.dirname(workbookPath), { recursive: true });
      await writeWorkbookWithRetry(workbook, workbookPath);
    }
  }

  const entries = workbook.getWorksheet("Entries") || workbook.addWorksheet("Entries");
  if (entries.columnCount === 0) entries.columns = columns;
  styleSheet(entries);
  ensureMasterSpecSheets(workbook);
  syncManualDebtSheetToEntries(workbook);
  syncDebtStatusRows(workbook);
  rebuildDerivedSheets(workbook);
  return workbook;
}

function getWebsiteEntries(workbook) {
  const entries = workbook.getWorksheet("Entries");
  const records = [];
  if (!entries) return records;

  entries.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && !isEmptyRow(row, 10)) records.push(rowToEntry(row));
  });

  return records;
}

function getLoanEntries(workbook) {
  const sheet = workbook.getWorksheet("Loan");
  const records = [];
  if (!sheet) return records;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || isEmptyRow(row, 6)) return;

    const party = cellValue(row.getCell(1));
    const amount = money(cellValue(row.getCell(2)));
    const givenDate = cellValue(row.getCell(3));
    const receivedDate = cellValue(row.getCell(4));
    const finalValue = money(cellValue(row.getCell(5)));
    const clearFlag = cellValue(row.getCell(6));
    if (!party && !amount) return;

    const isCleared = Boolean(receivedDate || finalValue || String(clearFlag || "").toLowerCase().includes("clear"));
    const notes = [
      receivedDate ? `Received date: ${formatDateValue(receivedDate)}` : "",
      finalValue ? `Final value: ${finalValue}` : "",
      clearFlag ? `Note: ${clearFlag}` : ""
    ].filter(Boolean).join(" | ");

    records.push({
      id: `${legacyRecordPrefix}-LOAN-${rowNumber}`,
      date: formatDateValue(givenDate),
      type: "debt_given",
      typeLabel: entryTypes.debt_given,
      party: String(party || ""),
      amount,
      mode: "",
      month: "",
      status: isCleared ? "Cleared" : "Pending",
      notes,
      createdAt: ""
    });

    if (isCleared && finalValue) {
      records.push({
        id: `${legacyRecordPrefix}-LOAN-CLEARED-${rowNumber}`,
        date: formatDateValue(receivedDate || givenDate),
        type: "debt_cleared",
        typeLabel: entryTypes.debt_cleared,
        party: String(party || ""),
        amount: finalValue,
        mode: "",
        month: "",
        status: "Cleared",
        notes: `Original amount: ${amount}`,
        createdAt: ""
      });
    }
  });

  return records;
}

function getChittyEntries(workbook) {
  const sheet = workbook.getWorksheet("Chitti") || workbook.getWorksheet("Chitty");
  const records = [];
  if (!sheet) return records;

  const monthColumns = [];
  const header = sheet.getRow(1);
  const firstHeader = safeText(cellValue(header.getCell(1))).toLowerCase();
  const secondHeader = safeText(cellValue(header.getCell(2))).toLowerCase();
  if (firstHeader.includes("chitty / group id") || secondHeader === "chitty / group") return records;
  for (let column = 4; column <= sheet.columnCount; column++) {
    const monthValue = cellValue(header.getCell(column));
    const month = formatMonthValue(monthValue);
    if (month) monthColumns.push({ column, month, date: `${month}-01` });
  }

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || isEmptyRow(row, Math.min(sheet.columnCount, 8))) return;

    const party = cellValue(row.getCell(1));
    const description = cellValue(row.getCell(2));
    const remarks = cellValue(row.getCell(3));
    if (!party) return;

    monthColumns.forEach(({ column, month, date }) => {
      const amount = money(cellValue(row.getCell(column)));
      if (!amount) return;

      records.push({
        id: `${legacyRecordPrefix}-CHITTY-${rowNumber}-${column}`,
        date,
        type: "chitty_paid",
        typeLabel: entryTypes.chitty_paid,
        party: String(party),
        amount,
        mode: "",
        month,
        status: String(remarks || ""),
        notes: String(description || ""),
        createdAt: ""
      });
    });
  });

  return records;
}

function getAllRecords(workbook) {
  return [
    ...getWebsiteEntries(workbook),
    ...getChittyEntries(workbook)
  ];
}

function getDisplayRecords(workbook) {
  const records = sortRecords(getAllRecords(workbook));
  const chittyOverrides = getManualChittyOverrides(workbook);
  const manualDebtRows = getManualDebtRows(workbook);
  const debtDisplayRecords = manualDebtRows
    .map((record) => {
      const status = normalizeStatus(record.status);
      if (status === "Cleared") {
        return {
          ...record,
          type: "debt_cleared",
          typeLabel: entryTypes.debt_cleared,
          amount: money(record.amount),
          finalPendingAmount: money(record.finalAmount),
          finalAmount: money(record.finalAmount),
          status: "Cleared"
        };
      }
      if (status === "Pending" || status === "Partial") {
        return {
          ...record,
          type: "debt_given",
          typeLabel: entryTypes.debt_given,
          amount: money(record.amount),
          finalPendingAmount: money(record.balanceWithInterest),
          finalAmount: money(record.balanceWithInterest),
          status
        };
      }
      return null;
    })
    .filter(Boolean);
  const debtSummaries = getDebtSummary(records).summaries;
  const debtSummaryById = new Map(debtSummaries.map((summary) => [safeText(summary.records?.[0]?.id), summary]));
  const debtSummaryByParty = new Map(debtSummaries.map((summary) => [safeText(summary.party).toLowerCase(), summary]));
  const nonChitty = (manualDebtRows.length ? records.filter((record) => record.type !== "debt_given" && record.type !== "debt_cleared" && record.type !== "interest_received") : records)
    .filter((record) => record.type !== "chitty_paid" && record.type !== "chitty_received" && record.type !== "interest_received")
    .map((record) => {
      if (record.type !== "debt_given") return record;
      const debt = debtSummaryById.get(safeText(record.id)) || debtSummaryByParty.get(safeText(record.party).toLowerCase());
      if (!debt) return record;
      const baseRecord = {
        ...record,
        amount: debt.totalPrincipal,
        finalAmount: debt.finalAmount,
        finalPendingAmount: debt.status === "Cleared" ? debt.finalAmount : debt.balanceWithInterest,
        debt: {
          debtGiven: debt.totalPrincipal,
          finalAmount: debt.finalAmount,
          balanceWithInterest: debt.balanceWithInterest
        }
      };
      if (debt.status !== "Partial" || !debt.interestReceived) return baseRecord;
      return {
        ...baseRecord,
        status: "Partial",
        interestReceived: debt.interestReceived
      };
    });
  const chittySummaries = applyChittyOverrides(getChittySummaries(records), chittyOverrides).map((summary) => {
    const groupRecords = summary.groupRecords || [];
    const sortedPaid = summary.paidRecords.slice().sort((a, b) => recordTime(b) - recordTime(a));
    const lastUpdated = summary.lastUpdated || new Date(latestTimestamp(groupRecords) || Date.now()).toISOString();
    const currentMonthPaid = summary.currentMonthPaid || (sortedPaid.length ? money(sortedPaid[0].amount) : 0);
    const nextMonth = addMonths(summary.startingMonth || (sortedPaid[0] ? monthKey(sortedPaid[0]) : formatMonthValue(new Date())), summary.paidMonths || 0);
    const totalValue = summary.totalValue || summary.finalAmount || 0;
    const displayFinalAmount = money(summary.finalAmount || summary.receivedAmount || totalValue);
    return {
      id: chittySummaryId(summary.party),
      date: lastUpdated.slice(0, 10),
      type: "chitty_summary",
      typeLabel: "Chitty / Group",
      party: summary.party,
      amount: totalValue,
      mode: "",
      month: sortedPaid[0] ? monthKey(sortedPaid[0]) : "",
      status: summary.statusOverride || (summary.isCompleted ? "Completed" : "Running"),
      finalPendingAmount: displayFinalAmount,
      finalAmount: displayFinalAmount,
      notes: [
        `Total Chitty Value: ${totalValue}`,
        `Final Amount: ${displayFinalAmount}`,
        `Amount Paid Till Date: ${summary.paidAmount}`,
        `Current Month Paid: ${currentMonthPaid}`,
        `Balance Amount: ${summary.pendingAmount}`,
        `Last Updated: ${lastUpdated}`
      ].join(" | "),
      createdAt: recordMetaSummary(groupRecords),
      lastUpdated,
      chitty: {
        totalValue,
        finalAmount: displayFinalAmount,
        paidTillDate: summary.paidAmount,
        currentMonthPaid,
        balanceAmount: summary.pendingAmount,
        lastUpdated,
        tenureMonths: summary.tenureMonths,
        startingMonth: summary.startingMonth,
        completedMonths: summary.paidMonths,
        nextMonth
      }
    };
  });

  return sortRecords([...debtDisplayRecords, ...nonChitty, ...chittySummaries]);
}

function recordTime(record) {
  const parsed = new Date(record.date || record.month || record.createdAt || "");
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function sortRecords(records) {
  return [...records].sort((a, b) => recordTime(b) - recordTime(a));
}

function getYearlyGrowth(records, chittyOverrides = new Map(), loanRecords = [], debtRecords = records, tradingRecords = [], tradingTrades = readCachedUpstoxTrades()) {
  const byYear = new Map();
  const emptyYearRow = (year) => ({
    year,
    debtGiven: 0,
    debtCleared: 0,
    balanceDebt: 0,
    chittyPaid: 0,
    chittyReceived: 0,
    chittyNet: 0,
    loanAmount: 0,
    loanPaid: 0,
    tradingInvestedValue: 0,
    tradingSaleValue: 0,
    tradingCurrentValue: 0,
    tradingRealisedProfitLoss: 0,
    tradingUnrealisedProfitLoss: 0,
    tradingProfitLoss: 0,
    tradingShares: [],
    totalActivity: 0
  });

  getDebtSummary(debtRecords).summaries.forEach((summary) => {
    const record = summary.records?.[0] || {};
    const date = new Date(record.date || record.month || "");
    if (Number.isNaN(date.getTime())) return;
    const year = String(date.getFullYear());
    const row = byYear.get(year) || emptyYearRow(year);

    row.debtGiven += summary.totalPrincipal;
    row.debtCleared += summary.finalAmount;
    row.balanceDebt += summary.balanceWithInterest;
    row.totalActivity += summary.totalPrincipal + summary.finalAmount + summary.balanceWithInterest;
    byYear.set(year, row);
  });

  applyChittyOverrides(getChittySummaries(records), chittyOverrides).forEach((summary) => {
    const year = String(new Date(`${summary.startingMonth || "1970-01"}-01`).getFullYear());
    if (year === "1970") return;
    const row = byYear.get(year) || emptyYearRow(year);
    row.chittyFinalAmount = (row.chittyFinalAmount || 0) + money(summary.finalAmount);
    row.completedChittyReceived = (row.completedChittyReceived || 0) + (summary.isCompleted ? money(summary.finalAmount || summary.receivedAmount) : 0);
    row.pendingChitty = (row.pendingChitty || 0) + money(summary.pendingAmount);
    row.totalActivity += money(summary.finalAmount) + money(summary.pendingAmount);
    byYear.set(year, row);
  });

  loanRecords.forEach((loan) => {
    const date = new Date(loan.borrowedDate || loan.createdAt || "");
    if (Number.isNaN(date.getTime())) return;
    const year = String(date.getFullYear());
    const row = byYear.get(year) || emptyYearRow(year);
    row.loanAmount += money(loan.loanAmount);
    row.loanPaid += money(loan.loanPaid);
    row.totalActivity += money(loan.loanAmount) + money(loan.loanPaid);
    byYear.set(year, row);
  });

  const activeTradingByKey = new Map();
  tradingRecords
    .filter((record) => !safeText(record.assetType).toLowerCase().includes("sold"))
    .forEach((record) => {
      tradingLookupKeys(record).forEach((key) => activeTradingByKey.set(key, record));
    });

  const tradeSummaries = buildTradingLotSummaries(tradingTrades);
  if (tradeSummaries.size) {
    tradeSummaries.forEach((summary, key) => {
      let active = activeTradingByKey.get(key) || {};
      for (const alias of summary.aliasKeys || []) {
        if (activeTradingByKey.has(alias)) {
          active = activeTradingByKey.get(alias);
          break;
        }
      }
      const investedDate = summary.earliestBuyDate || active.investedDate || summary.lastTradeDate;
      const year = financialYearForDate(investedDate);
      if (!year) return;
      const currentValue = money(active.currentValue);
      const unrealisedProfitLoss = money(active.unrealisedProfitLoss) || (currentValue ? currentValue - money(active.investedValue) : 0);
      const profitLoss = money(summary.realisedProfitLoss) + unrealisedProfitLoss;
      const purchaseValue = money(summary.purchaseValue) || money(active.investedValue);
      const row = byYear.get(year) || emptyYearRow(year);
      row.tradingInvestedValue += purchaseValue;
      row.tradingSaleValue += money(summary.saleValue);
      row.tradingCurrentValue += currentValue;
      row.tradingRealisedProfitLoss += money(summary.realisedProfitLoss);
      row.tradingUnrealisedProfitLoss += unrealisedProfitLoss;
      row.tradingProfitLoss += profitLoss;
      row.totalActivity += purchaseValue + money(summary.saleValue) + currentValue + Math.abs(profitLoss);
      row.tradingShares.push({
        name: summary.name,
        investedDate,
        purchaseValue,
        saleValue: money(summary.saleValue),
        currentValue,
        realisedProfitLoss: money(summary.realisedProfitLoss),
        unrealisedProfitLoss,
        profitLoss,
        profitPercent: purchaseValue ? profitLoss / purchaseValue : 0
      });
      byYear.set(year, row);
    });
  } else {
    tradingRecords.forEach((record) => {
      const year = financialYearForDate(record.investedDate || record.createdAt);
      if (!year) return;
      const row = byYear.get(year) || emptyYearRow(year);
      row.tradingInvestedValue += money(record.investedValue);
      row.tradingCurrentValue += money(record.currentValue);
      row.tradingRealisedProfitLoss += money(record.realisedProfitLoss);
      row.tradingUnrealisedProfitLoss += money(record.unrealisedProfitLoss) || money(record.profitLoss);
      row.tradingProfitLoss += money(record.profitLoss);
      row.totalActivity += money(record.investedValue) + money(record.currentValue) + Math.abs(money(record.profitLoss));
      row.tradingShares.push({
        name: record.name,
        investedDate: record.investedDate || "",
        purchaseValue: money(record.investedValue),
        saleValue: safeText(record.assetType).toLowerCase().includes("sold") ? money(record.currentValue) : 0,
        currentValue: safeText(record.assetType).toLowerCase().includes("sold") ? 0 : money(record.currentValue),
        realisedProfitLoss: money(record.realisedProfitLoss),
        unrealisedProfitLoss: money(record.unrealisedProfitLoss) || money(record.profitLoss),
        profitLoss: money(record.profitLoss),
        profitPercent: money(record.investedValue) ? money(record.profitLoss) / money(record.investedValue) : 0
      });
      byYear.set(year, row);
    });
  }

  byYear.forEach((row) => {
    const debtBase = row.debtCleared + row.balanceDebt;
    row.debtClearedPercent = debtBase ? Math.min((row.debtCleared / debtBase) * 100, 100) : 0;
    row.debtPendingPercent = debtBase ? Math.min((row.balanceDebt / debtBase) * 100, 100) : 0;
    const chittyBase = row.chittyFinalAmount + row.pendingChitty;
    row.chittyReceivedPercent = chittyBase ? Math.min((row.completedChittyReceived / chittyBase) * 100, 100) : 0;
    row.chittyPendingPercent = chittyBase ? Math.min((row.pendingChitty / chittyBase) * 100, 100) : 0;
    row.loanAmountPercent = row.loanAmount ? 100 : 0;
    row.loanPaidPercent = row.loanAmount ? Math.min((row.loanPaid / row.loanAmount) * 100, 100) : 0;
    row.tradingInvestedPercent = row.tradingInvestedValue ? 100 : 0;
    row.tradingCurrentPercent = row.tradingInvestedValue ? (row.tradingCurrentValue / row.tradingInvestedValue) * 100 : 0;
    row.tradingRealisedPercent = row.tradingInvestedValue ? (row.tradingRealisedProfitLoss / row.tradingInvestedValue) * 100 : 0;
    row.tradingUnrealisedPercent = row.tradingInvestedValue ? (row.tradingUnrealisedProfitLoss / row.tradingInvestedValue) * 100 : 0;
    row.tradingProfitPercent = row.tradingInvestedValue ? (row.tradingProfitLoss / row.tradingInvestedValue) * 100 : 0;
  });

  return [...byYear.values()].sort((a, b) => a.year.localeCompare(b.year));
}

function addEntriesRows(workbook, records) {
  const entries = workbook.addWorksheet("Entries");
  entries.columns = columns;
  records.forEach((record) => {
    entries.addRow({
      id: record.id,
      date: record.date,
      type: record.type,
      party: record.party,
      amount: money(record.amount),
      mode: record.mode || "",
      month: record.month || "",
      status: record.status || "",
      notes: record.notes || "",
      createdAt: record.createdAt || new Date().toISOString(),
      tenureMonths: numberOrBlank(record.tenureMonths),
      startingMonth: record.startingMonth || "",
      amountReceived: numberOrBlank(record.amountReceived),
      interestReceived: numberOrBlank(record.interestReceived),
      lastUpdated: record.lastUpdated || record.createdAt || nowIso()
    });
  });
  styleSheet(entries);
  return entries;
}

async function saveConvertedWorkbook(records, outputPath) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Smart Fin 365";
  workbook.created = new Date();
  addEntriesRows(workbook, sortRecords(records).reverse());
  ensureMasterSpecSheets(workbook);
  rebuildDerivedSheets(workbook);
  rebuildSummary(workbook);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await writeWorkbookWithRetry(workbook, outputPath);
}

function rebuildSummary(workbook) {
  rebuildLentSheet(workbook);
  const existingSummary = workbook.getWorksheet("Summary");
  if (existingSummary) workbook.removeWorksheet(existingSummary.id);
  const summary = workbook.addWorksheet("Summary");
  summary.columns = [
    { header: "Metric", key: "metric", width: 30 },
    { header: "Value", key: "value", width: 18 }
  ];

  const records = getAllRecords(workbook);
  const debtRecords = getManualDebtRows(workbook);
  const debtSource = debtRecords.length ? debtRecords : records;
  const totals = getTotals(records, getManualChittyOverrides(workbook), debtSource);
  const interest = getDebtInterestSummary(debtSource);
  const loanTotals = getLoanTotals(getLoanRecords(workbook));
  const tradingTotals = getTradingTotals(getTradingRecords(workbook), readCachedUpstoxTrades());

  const rows = [
    ["Amount Lent", totals.debt_given],
    ["Amount Recovered", totals.debt_cleared],
    ["Outstanding Lent with Interest", totals.balanceDebt],
    ["Outstanding Lent Amount", interest.principal],
    ["Interest Receivable @ 24% / Year", interest.interest],
    ["Outstanding Lent with Interest", interest.withInterest],
    ["Total Chitty", totals.total_chitty],
    ["Completed Chitty Received", totals.completed_chitty_received],
    ["Pending Chitty", totals.pending_chitty],
    ["Total Loan Amount", loanTotals.loanAmount],
    ["Total Loan Paid", loanTotals.loanPaid],
    ["Total Pending Loan", loanTotals.remainingLoanAmount],
    ["Trading Invested Value", tradingTotals.tradingInvestedValue],
    ["Trading Current Value", tradingTotals.tradingCurrentValue],
    ["Trading Realised Profit / Loss", tradingTotals.tradingRealisedProfitLoss],
    ["Trading Unrealised Profit / Loss", tradingTotals.tradingUnrealisedProfitLoss],
    ["Trading Profit / Loss", tradingTotals.tradingProfitLoss],
    ["Trading Profit %", tradingTotals.tradingProfitPercent],
    ["Trading Holdings", tradingTotals.tradingHoldings],
    ["Trading Shares", tradingTotals.tradingShares],
    ["Trading Trade Records", tradingTotals.tradingTradeRecords],
    ["Last Updated", new Date().toLocaleString()]
  ];

  rows.forEach((row) => summary.addRow(row));
  summary.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  summary.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
  summary.getColumn(2).numFmt = "#,##0.00";
  summary.getCell(`B${rows.findIndex((row) => row[0] === "Trading Profit %") + 2}`).numFmt = "0.00%";
  summary.getCell(`B${rows.length + 1}`).numFmt = "yyyy-mm-dd hh:mm";
  rebuildDashboard(workbook);
  rebuildNetWorthSheet(workbook);
}

function rebuildLentSheet(workbook) {
  const existingLent = workbook.getWorksheet("Lent");
  if (existingLent) workbook.removeWorksheet(existingLent.id);
  const sheet = workbook.addWorksheet("Lent");
  const lentColumns = [
    { header: "ID", key: "id", width: 18 },
    { header: "Lent Type", key: "lentType", width: 18 },
    { header: "Person", key: "person", width: 18 },
    { header: "Amount Lent", key: "amountLent", width: 16 },
    { header: "Date Lent", key: "dateLent", width: 14 },
    { header: "Date Recovered", key: "dateRecovered", width: 16 },
    { header: "Mode", key: "mode", width: 14 },
    { header: "Lent Status", key: "lentStatus", width: 14 },
    { header: "Final Amount", key: "finalAmount", width: 16 },
    { header: "Principal Received", key: "principalReceived", width: 18 },
    { header: "Interest Received", key: "interestReceived", width: 18 },
    { header: "Outstanding Lent Amount", key: "outstandingLentAmount", width: 22 },
    { header: "Outstanding Interest", key: "outstandingInterest", width: 20 },
    { header: "Outstanding Lent with Interest", key: "outstandingLentWithInterest", width: 26 },
    { header: "Notes", key: "notes", width: 36 },
    { header: "Created At", key: "createdAt", width: 24 },
    { header: "Last Updated", key: "lastUpdated", width: 24 }
  ];
  sheet.columns = lentColumns;
  getManualDebtRows(workbook).forEach((record) => {
    sheet.addRow({
      id: record.id,
      lentType: entryTypes[record.type] || record.type || "Amount Lent",
      person: record.party || record.person,
      amountLent: money(record.amount),
      dateLent: record.date,
      dateRecovered: record.dateCleared,
      mode: record.mode,
      lentStatus: record.status,
      finalAmount: money(record.finalAmount),
      principalReceived: money(record.principalReceived),
      interestReceived: money(record.interestReceived),
      outstandingLentAmount: money(record.outstandingPrincipal),
      outstandingInterest: money(record.outstandingInterest),
      outstandingLentWithInterest: money(record.balanceWithInterest),
      notes: record.notes,
      createdAt: record.createdAt,
      lastUpdated: record.lastUpdated
    });
  });
  styleColumnsSheet(sheet, lentColumns, ["amountLent", "finalAmount", "principalReceived", "interestReceived", "outstandingLentAmount", "outstandingInterest", "outstandingLentWithInterest"]);
}

function rebuildNetWorthSheet(workbook) {
  const existingNetWorth = workbook.getWorksheet("Net Worth");
  if (existingNetWorth) workbook.removeWorksheet(existingNetWorth.id);
  const sheet = workbook.addWorksheet("Net Worth");
  const netWorthColumns = [
    { header: "Metric", key: "metric", width: 34 },
    { header: "Value", key: "value", width: 20 },
    { header: "Notes", key: "notes", width: 60 }
  ];
  sheet.columns = netWorthColumns;
  const report = buildNetWorthReport(workbook);
  const rows = [
    ["Total Assets", report.totalAssets, "Property, farm, business and owned asset current values"],
    ["Total Investments", report.totalInvestments, "Current investment value, without double-counting available cash"],
    ["Bank, Cash and Savings", report.bankCashSavings, "Available cash, bank and savings balance"],
    ["Total Receivables", report.totalReceivables, "Outstanding Lent receivable including live interest"],
    ["Total Liabilities", report.totalLiabilities, "Total pending general loan and property-loan obligations"],
    ["Ongoing Commitments", report.ongoingCommitments, "Pending payable commitments"],
    ["Actual Net Worth", report.actualNetWorth, report.formula],
    ["Investment Profit / Loss", report.investmentProfitLoss, "Shown separately from invested principal"],
    ["Last Updated", new Date(), report.calculatedAt]
  ];
  rows.forEach((row) => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
  sheet.getColumn(2).numFmt = "#,##0.00";
  sheet.getCell(`B${rows.length + 1}`).numFmt = "yyyy-mm-dd hh:mm";
  styleColumnsSheet(sheet, netWorthColumns, ["value"]);
}

function rebuildDashboard(workbook) {
  const existingDashboard = workbook.getWorksheet("Dashboard");
  if (existingDashboard) workbook.removeWorksheet(existingDashboard.id);
  const dashboard = workbook.addWorksheet("Dashboard");

  const records = getAllRecords(workbook);
  const chittyOverrides = getManualChittyOverrides(workbook);
  const debtRecords = getManualDebtRows(workbook);
  const debtSource = debtRecords.length ? debtRecords : records;
  const totals = getTotals(records, chittyOverrides, debtSource);
  const debtInterest = getDebtInterestSummary(debtSource);
  const loanTotals = getLoanTotals(getLoanRecords(workbook));
  const tradingRecords = getTradingRecords(workbook);
  const tradingTrades = readCachedUpstoxTrades();
  const tradingTotals = getTradingTotals(tradingRecords, tradingTrades);
  const yearlyGrowth = getYearlyGrowth(records, chittyOverrides, getLoanRecords(workbook), debtSource, tradingRecords, tradingTrades);

  const dashboardColumnCount = Math.max(72, 1 + Math.max(yearlyGrowth.length, 1) * 10);
  dashboard.columns = Array.from({ length: dashboardColumnCount }, (_, index) => ({
    header: "",
    key: `c${index + 1}`,
    width: index < 12 ? (index % 4 === 0 ? 18 : 14) : 4
  }));

  dashboard.views = [{ state: "frozen", ySplit: 2 }];
  dashboard.mergeCells("A1:L1");
  dashboard.getCell("A1").value = "Smart Fin 365 Dashboard";
  dashboard.getCell("A1").font = { bold: true, size: 18, color: { argb: "FFFFFFFF" } };
  dashboard.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
  dashboard.getCell("A1").alignment = { vertical: "middle", horizontal: "center" };
  dashboard.getRow(1).height = 30;

  dashboard.mergeCells("A2:L2");
  dashboard.getCell("A2").value = `Last updated: ${new Date().toLocaleString()}`;
  dashboard.getCell("A2").font = { bold: true, color: { argb: "FF475467" } };
  dashboard.getCell("A2").alignment = { horizontal: "right" };

  const moneyFormat = "#,##0.00";
  const cardBorder = {
    top: { style: "thin", color: { argb: "FFD0D5DD" } },
    left: { style: "thin", color: { argb: "FFD0D5DD" } },
    bottom: { style: "thin", color: { argb: "FFD0D5DD" } },
    right: { style: "thin", color: { argb: "FFD0D5DD" } }
  };
  const cardColors = ["FFEFF6FF", "FFECFDF3", "FFFFF7E6", "FFF8F9FC"];
  const metricCards = [
    ["Amount Lent", totals.debt_given || totals.total_debt || 0],
    ["Amount Recovered", totals.debt_cleared || 0],
    ["Outstanding Lent with Interest", formatInterestDisplay(debtInterest.annualRate, debtInterest.withInterest, debtInterest.interest)],
    ["Total Chitty", totals.total_chitty || totals.chitty_paid || 0],
    ["Completed Chitty Received", totals.completed_chitty_received || totals.chitty_received || 0],
    ["Pending Chitty", totals.pending_chitty || 0],
    ["Total Loan Amount", formatInterestDisplay("mixed", loanTotals.loanAmount || 0, loanTotals.loanInterest || 0)],
    ["Total Loan Paid", loanTotals.loanPaid || 0],
    ["Total Pending Loan", formatInterestDisplay("mixed", loanTotals.remainingLoanAmount || 0, loanTotals.remainingLoanInterest || 0)],
    ["Trading Invested Value", tradingTotals.tradingInvestedValue || 0],
    ["Trading Current Value", tradingTotals.tradingCurrentValue || 0],
    ["Trading Realised Profit / Loss", tradingTotals.tradingRealisedProfitLoss || 0],
    ["Trading Unrealised Profit / Loss", tradingTotals.tradingUnrealisedProfitLoss || 0],
    ["Trading Profit / Loss", tradingTotals.tradingProfitLoss || 0],
    ["Trading Holdings", tradingTotals.tradingHoldings || 0],
    ["Trading Shares", tradingTotals.tradingShares || 0]
  ];

  const cardStarts = ["A", "D", "G"];
  metricCards.forEach(([label, value], index) => {
    const rowBase = 4 + Math.floor(index / 3) * 4;
    const startCol = cardStarts[index % 3];
    const start = dashboard.getCell(`${startCol}${rowBase}`).col;
    const end = start + 2;
    dashboard.mergeCells(rowBase, start, rowBase, end);
    dashboard.mergeCells(rowBase + 1, start, rowBase + 2, end);
    const title = dashboard.getCell(rowBase, start);
    const amount = dashboard.getCell(rowBase + 1, start);
    title.value = label;
    title.font = { bold: true, color: { argb: "FF475467" } };
    title.alignment = { horizontal: "center", vertical: "middle" };
    amount.value = value;
    if (typeof value === "number") amount.numFmt = moneyFormat;
    amount.font = { bold: true, size: typeof value === "number" ? 16 : 10, color: { argb: "FF1849A9" } };
    amount.alignment = { horizontal: "center", vertical: "middle" };
    for (let row = rowBase; row <= rowBase + 2; row++) {
      for (let col = start; col <= end; col++) {
        const cell = dashboard.getCell(row, col);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: cardColors[index % cardColors.length] } };
        cell.border = cardBorder;
      }
    }
    dashboard.getRow(rowBase + 1).height = 30;
    dashboard.getRow(rowBase + 2).height = 24;
  });

  const growthTitleRow = 4 + Math.ceil(metricCards.length / 3) * 4 + 1;
  const chartEndCol = Math.max(18, 1 + Math.max(yearlyGrowth.length, 1) * 10);
  dashboard.mergeCells(growthTitleRow, 1, growthTitleRow, chartEndCol);
  dashboard.getCell(`A${growthTitleRow}`).value = "Yearly Growth";
  dashboard.getCell(`A${growthTitleRow}`).font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  dashboard.getCell(`A${growthTitleRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
  dashboard.getCell(`A${growthTitleRow}`).alignment = { horizontal: "center" };

  const chartSeries = [
    { key: "debtClearedPercent", label: "AR", name: "Amount Recovered", color: "FF146C43" },
    { key: "debtPendingPercent", label: "OL", name: "Outstanding Lent", color: "FFF59E0B" },
    { key: "chittyReceivedPercent", label: "CR", name: "Chitty Received", color: "FF2356A3" },
    { key: "chittyPendingPercent", label: "CP", name: "Chitty Pending", color: "FFEC4899" },
    { key: "loanAmountPercent", label: "LA", name: "Total Loan Amount", color: "FFDC2626" },
    { key: "loanPaidPercent", label: "LP", name: "Total Loan Paid", color: "FF9333EA" },
    { key: "tradingInvestedPercent", label: "TI", name: "Trading Invested", color: "FFF59E0B" },
    { key: "tradingCurrentPercent", label: "TC", name: "Trading Current", color: "FF16A34A" },
    { key: "tradingRealisedPercent", label: "TR", name: "Trading Realised P/L", color: "FF10B981" },
    { key: "tradingUnrealisedPercent", label: "TU", name: "Trading Unrealised P/L", color: "FF38BDF8" },
    { key: "tradingProfitPercent", label: "TP", name: "Trading Profit / Loss", color: "FF0EA5E9" }
  ];

  const legendRow = growthTitleRow + 2;
  chartSeries.forEach((series, index) => {
    const colorCell = dashboard.getCell(legendRow, 1 + index * 2);
    const labelCell = dashboard.getCell(legendRow, 2 + index * 2);
    colorCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: series.color } };
    colorCell.border = cardBorder;
    labelCell.value = series.name;
    labelCell.font = { bold: true, color: { argb: "FF18212F" } };
    labelCell.alignment = { vertical: "middle", wrapText: true };
    labelCell.border = cardBorder;
  });
  dashboard.getRow(legendRow).height = 24;

  const chartTopRow = growthTitleRow + 5;
  const chartHeightRows = 10;
  const chartBottomRow = chartTopRow + chartHeightRows - 1;
  const firstBarCol = 2;
  const groupGapCols = 1;
  const groupWidthCols = chartSeries.length + groupGapCols;
  const percentLevels = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10];

  percentLevels.forEach((percent, rowIndex) => {
    const excelRow = dashboard.getRow(chartTopRow + rowIndex);
    excelRow.height = 13;
    const axisCell = excelRow.getCell(1);
    axisCell.value = percent % 20 === 0 ? `${percent}%` : "";
    axisCell.font = { color: { argb: "FF667085" }, size: 9 };
    axisCell.alignment = { horizontal: "right", vertical: "middle" };
  });

  yearlyGrowth.forEach((row, index) => {
    const groupStartCol = firstBarCol + index * groupWidthCols;
    chartSeries.forEach((series, seriesIndex) => {
      const value = Math.max(0, Math.min(100, row[series.key] || 0));
      const filledRows = Math.round(value / 10);
      const col = groupStartCol + seriesIndex;
      dashboard.getColumn(col).width = 4;
      for (let chartRow = 0; chartRow < chartHeightRows; chartRow++) {
        const cell = dashboard.getCell(chartTopRow + chartRow, col);
        const fill = chartRow >= chartHeightRows - filledRows ? series.color : "FFFFFFFF";
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
        cell.border = {
          top: { style: "hair", color: { argb: "FFE5E7EB" } },
          left: { style: "hair", color: { argb: "FFE5E7EB" } },
          bottom: { style: "hair", color: { argb: "FFE5E7EB" } },
          right: { style: "hair", color: { argb: "FFE5E7EB" } }
        };
      }
      const labelCell = dashboard.getCell(chartBottomRow + 1, col);
      labelCell.value = series.label;
      labelCell.font = { bold: true, size: 8, color: { argb: "FF18212F" } };
      labelCell.alignment = { horizontal: "center", vertical: "middle" };
      const percentCell = dashboard.getCell(chartBottomRow + 2, col);
      percentCell.value = value / 100;
      percentCell.numFmt = "0%";
      percentCell.font = { size: 8, color: { argb: "FF667085" } };
      percentCell.alignment = { horizontal: "center", vertical: "middle" };
    });
    dashboard.mergeCells(chartBottomRow + 3, groupStartCol, chartBottomRow + 3, groupStartCol + chartSeries.length - 1);
    const yearCell = dashboard.getCell(chartBottomRow + 3, groupStartCol);
    yearCell.value = row.year;
    yearCell.font = { bold: true, color: { argb: "FF18212F" } };
    yearCell.alignment = { horizontal: "center", vertical: "middle" };
  });

  const noteRow = chartBottomRow + 5;
  dashboard.mergeCells(noteRow, 1, noteRow, chartEndCol);
  dashboard.getCell(noteRow, 1).value = "AR amount recovered | OL outstanding lent | CR chitty received | CP chitty pending | LA total loan amount | LP total loan paid | TI trading invested | TC trading current | TR trading realised | TU trading unrealised | TP trading profit/loss";
  dashboard.getCell(noteRow, 1).font = { color: { argb: "FF667085" }, size: 10 };
  dashboard.getCell(noteRow, 1).alignment = { horizontal: "center" };

  const dataHeaderRow = noteRow + 2;
  const headers = ["Year", "Amount Recovered %", "Outstanding Lent %", "Chitty Received %", "Pending Chitty %", "Total Loan Amount %", "Total Loan Paid %", "Trading Invested %", "Trading Current %", "Trading Realised %", "Trading Unrealised %", "Trading Profit / Loss %"];
  headers.forEach((header, index) => {
    const cell = dashboard.getCell(dataHeaderRow, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF475467" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });
  yearlyGrowth.forEach((row, index) => {
    const excelRow = dashboard.getRow(dataHeaderRow + 1 + index);
    const values = [
      row.year,
      (row.debtClearedPercent || 0) / 100,
      (row.debtPendingPercent || 0) / 100,
      (row.chittyReceivedPercent || 0) / 100,
      (row.chittyPendingPercent || 0) / 100,
      (row.loanAmountPercent || 0) / 100,
      (row.loanPaidPercent || 0) / 100,
      (row.tradingInvestedPercent || 0) / 100,
      (row.tradingCurrentPercent || 0) / 100,
      (row.tradingRealisedPercent || 0) / 100,
      (row.tradingUnrealisedPercent || 0) / 100,
      (row.tradingProfitPercent || 0) / 100
    ];
    values.forEach((value, colIndex) => {
      const cell = excelRow.getCell(colIndex + 1);
      cell.value = value;
      cell.border = cardBorder;
      cell.alignment = { horizontal: colIndex ? "center" : "left", vertical: "middle", wrapText: true };
      if (colIndex) cell.numFmt = "0.00%";
    });
  });

  dashboard.eachRow((row) => {
    row.alignment = { ...row.alignment, vertical: "middle", wrapText: true };
  });
}

function getDashboardYearlyGrowth(workbook) {
  const dashboard = workbook.getWorksheet("Dashboard");
  if (!dashboard) return [];
  let headerRowNumber = 0;
  dashboard.eachRow((row, rowNumber) => {
    if (headerRowNumber) return;
    if (safeText(cellValue(row.getCell(1))).toLowerCase() === "year" &&
      safeText(cellValue(row.getCell(2))).toLowerCase().includes("debt cleared")) {
      headerRowNumber = rowNumber;
    }
  });
  if (!headerRowNumber) return [];
  const rows = [];
  for (let rowNumber = headerRowNumber + 1; rowNumber <= dashboard.rowCount; rowNumber++) {
    const row = dashboard.getRow(rowNumber);
    const year = safeText(cellValue(row.getCell(1)));
    if (!year) continue;
    rows.push({
      year,
      debtClearedPercent: money(cellValue(row.getCell(2))) * 100,
      debtPendingPercent: money(cellValue(row.getCell(3))) * 100,
      chittyReceivedPercent: money(cellValue(row.getCell(4))) * 100,
      chittyPendingPercent: money(cellValue(row.getCell(5))) * 100,
      loanAmountPercent: money(cellValue(row.getCell(6))) * 100,
      loanPaidPercent: money(cellValue(row.getCell(7))) * 100
    });
  }
  return rows;
}

function rowToEntry(row) {
  return {
    id: cellValue(row.getCell(1)),
    date: formatDateValue(cellValue(row.getCell(2))),
    type: cellValue(row.getCell(3)),
    typeLabel: entryTypes[cellValue(row.getCell(3))] || cellValue(row.getCell(3)),
    party: cellValue(row.getCell(4)),
    amount: money(cellValue(row.getCell(5))),
    mode: cellValue(row.getCell(6)),
    month: cellValue(row.getCell(7)),
    status: cellValue(row.getCell(8)),
    notes: cellValue(row.getCell(9)),
    createdAt: cellValue(row.getCell(10)),
    tenureMonths: numberOrBlank(cellValue(row.getCell(11))),
    startingMonth: formatMonthValue(cellValue(row.getCell(12))) || safeText(cellValue(row.getCell(12))),
    amountReceived: numberOrBlank(cellValue(row.getCell(13))),
    interestReceived: numberOrBlank(cellValue(row.getCell(14))),
    lastUpdated: cellValue(row.getCell(15))
  };
}

function rowFromEntryPayload(payload, existing = {}) {
  const type = safeText(payload.type);
  const status = defaultStatus(type, payload.status);
  const amount = money(payload.amount);
  const isDebtGiven = type === "debt_given";
  const isDebtCleared = type === "debt_cleared";
  const isInterest = type === "interest_received";
  const principalReceived = isDebtGiven && normalizeStatus(status) === "Cleared"
    ? amount
    : isDebtGiven || isDebtCleared
      ? money(payload.amountReceived || (isDebtCleared ? amount : 0))
      : numberOrBlank(payload.amountReceived);
  const interestReceived = isInterest ? amount : money(payload.interestReceived);
  return {
    id: existing.id || payload.id,
    date: safeText(payload.date),
    type,
    party: safeText(payload.party),
    amount,
    mode: safeText(payload.mode),
    month: type === "chitty_paid" ? safeText(payload.month) || formatMonthValue(payload.date || new Date()) : safeText(payload.month),
    status,
    notes: safeText(payload.notes),
    createdAt: existing.createdAt || nowIso(),
    tenureMonths: type === "chitty_paid" ? numberOrBlank(payload.tenureMonths) : "",
    startingMonth: type === "chitty_paid" ? safeText(payload.startingMonth) || safeText(payload.month) || formatMonthValue(payload.date || new Date()) : "",
    amountReceived: type === "chitty_received" ? money(payload.amountReceived || payload.amount) : principalReceived,
    interestReceived,
    lastUpdated: nowIso()
  };
}

function validateEntryPayload(payload) {
  if (!payload.date || !payload.type || !payload.party || !payload.amount) {
    throw new Error("Date, type, person/chitty, and amount are required.");
  }
}

function findEntryRow(entries, id) {
  let foundRow = null;
  entries.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && safeText(cellValue(row.getCell(1))) === safeText(id)) foundRow = row;
  });
  return foundRow;
}

function writeEntryRow(row, record) {
  row.getCell(1).value = record.id;
  row.getCell(2).value = record.date;
  row.getCell(3).value = record.type;
  row.getCell(4).value = record.party;
  row.getCell(5).value = record.amount;
  row.getCell(6).value = record.mode;
  row.getCell(7).value = record.month;
  row.getCell(8).value = record.status;
  row.getCell(9).value = record.notes;
  row.getCell(10).value = record.createdAt;
  row.getCell(11).value = record.tenureMonths;
  row.getCell(12).value = record.startingMonth;
  row.getCell(13).value = record.amountReceived;
  row.getCell(14).value = record.interestReceived;
  row.getCell(15).value = record.lastUpdated;
}

async function persistWorkbook(workbook) {
  await waitForWorkbookSyncToFinish();
  syncInProgress = true;
  try {
    applyAutomaticChittyCompletion(workbook);
    syncDebtStatusRows(workbook);
    rebuildDerivedSheets(workbook);
    rebuildSummary(workbook);
    const workbookPath = await getWorkbookPath();
    await writeWorkbookWithRetry(workbook, workbookPath);
    const stat = await fs.stat(workbookPath).catch(() => null);
    if (stat) lastWorkbookMtime = stat.mtimeMs;
    return uploadWorkbookToDriveWithRetry();
  } finally {
    syncInProgress = false;
  }
}

const moduleSheetBySlug = {
  "family-income": "Family Income",
  "family-expenses": "Family Expenses",
  "children-expenses": "Children Expenses",
  "personal-maintenance": "Personal Maintenance",
  "salary-income": "Salary & Income",
  "farm-manager": "Farm Manager",
  "farm-inventory": "Farm Inventory",
  "agriculture-farm-records": "Agriculture Farm Records",
  savings: "Savings",
  "other-assets": "Other Assets",
  "tax-planner": "Tax Planner",
  "business-profiles": "Business Profile",
  "business-investments": "Business Investment",
  "business-income": "Business Income",
  "business-expenses": "Business Expenses",
  "business-assets": "Business Assets",
  "business-liabilities": "Business Liabilities",
  "business-receivables": "Business Receivables",
  "business-payables": "Business Payables",
  "business-inventory": "Business Inventory",
  goals: "Goals",
  "goal-contributions": "Goal Contributions",
  "goal-categories": "Goal Categories",
  "bank-cash-manager": "Bank & Cash Manager",
  "insurance-manager": "Insurance Manager",
  "document-vault": "Document Vault",
  "bill-utilities": "Bill & Utilities",
  "financial-calendar": "Financial Calendar",
  "budget-planner": "Budget Planner",
  "backup-restore": "Backup & Restore",
  "export-center": "Export Center",
  "notification-center": "Notification Center"
};

function moduleSlugForSheet(sheetName) {
  return Object.entries(moduleSheetBySlug).find(([, name]) => name === sheetName)?.[0] || slugify(sheetName);
}

function moduleDefinitionBySheet(sheetName) {
  return masterSpecSheetDefinitions.find((definition) => definition.name === sheetName);
}

function moduleDefinitionBySlug(slug) {
  const sheetName = moduleSheetBySlug[safeText(slug)];
  return sheetName ? moduleDefinitionBySheet(sheetName) : null;
}

function idColumnForDefinition(definition) {
  return definition.columns.find((column) => /^(id|business id|goal id)$/i.test(column.header)) || definition.columns[0];
}

function moduleRowToRecord(row, definition) {
  const headerMap = headerIndexMap(row.worksheet);
  const record = {};
  definition.columns.forEach((column) => {
    const columnNumber = headerMap.get(column.header.toLowerCase());
    const value = columnNumber ? cellValue(row.getCell(columnNumber)) : "";
    record[column.key] = definition.moneyKeys?.includes(column.key) ? money(value) : formatDateValue(value) || safeText(value);
  });
  const idColumn = idColumnForDefinition(definition);
  record.id = safeText(record[idColumn.key]);
  return record;
}

function getModuleRecords(workbook, sheetName) {
  const definition = moduleDefinitionBySheet(sheetName);
  const sheet = definition ? ensureWorkbookSheetDefinition(workbook, definition) : workbook.getWorksheet(sheetName);
  const records = [];
  if (!definition || !sheet) return records;
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || isEmptyRow(row, Math.max(sheet.columnCount, definition.columns.length))) return;
    const record = moduleRowToRecord(row, definition);
    if (record.id || Object.values(record).some((value) => safeText(value))) records.push(record);
  });
  return records;
}

function findModuleRow(sheet, definition, id) {
  const idColumn = idColumnForDefinition(definition);
  const headerMap = headerIndexMap(sheet);
  const columnNumber = headerMap.get(idColumn.header.toLowerCase());
  if (!columnNumber) return null;
  let found = null;
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || found) return;
    if (safeText(cellValue(row.getCell(columnNumber))) === safeText(id)) found = row;
  });
  return found;
}

function moduleRecordPrefix(sheetName) {
  return slugify(sheetName).toUpperCase().slice(0, 18) || "MOD";
}

function monthsBetweenNow(targetDate) {
  const target = new Date(targetDate || "");
  if (Number.isNaN(target.getTime())) return 0;
  const now = new Date();
  const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(months + (target.getDate() >= now.getDate() ? 1 : 0), 0);
}

function paymentStatus(received, total) {
  const paid = money(received);
  const due = money(total);
  if (paid <= 0) return "Pending";
  if (paid < due) return "Partial";
  return "Received";
}

function dueStatus(balance, currentStatus = "") {
  const explicit = safeText(currentStatus);
  if (explicit && !["pending", "partial", "received", "paid"].includes(explicit.toLowerCase())) return explicit;
  const amount = money(balance);
  if (amount <= 0) return explicit.toLowerCase() === "received" ? "Received" : "Paid";
  return explicit.toLowerCase() === "partial" ? "Partial" : "Pending";
}

function normalizeModuleRecord(sheetName, payload = {}, existing = {}) {
  const definition = moduleDefinitionBySheet(sheetName);
  if (!definition) throw new Error("This module is not configured.");
  const idColumn = idColumnForDefinition(definition);
  const record = {};
  definition.columns.forEach((column) => {
    const incoming = payload[column.key] ?? payload[column.header] ?? "";
    if (definition.moneyKeys?.includes(column.key)) {
      record[column.key] = incoming === "" || incoming === null || incoming === undefined ? 0 : money(incoming);
    } else {
      record[column.key] = safeText(incoming);
    }
  });

  record[idColumn.key] = safeText(payload[idColumn.key] || payload.id || existing[idColumn.key] || existing.id || `${moduleRecordPrefix(sheetName)}-${Date.now()}`);
  record.createdAt = existing.createdAt || record.createdAt || nowIso();
  record.lastUpdated = nowIso();
  record.syncStatus = record.syncStatus || "Synced";

  if (sheetName === "Business Income") {
    record.quantity = money(record.quantity);
    record.unitPrice = money(record.unitPrice);
    record.grossAmount = record.quantity * record.unitPrice;
    record.discount = money(record.discount);
    record.gst = money(record.gst);
    record.netAmount = Math.max(record.grossAmount - record.discount + record.gst, 0);
    record.paymentReceived = money(record.paymentReceived);
    record.pendingAmount = Math.max(record.netAmount - record.paymentReceived, 0);
    record.paymentStatus = paymentStatus(record.paymentReceived, record.netAmount);
  }

  if (sheetName === "Business Expenses") {
    record.quantity = money(record.quantity);
    record.unitPrice = money(record.unitPrice);
    record.amount = money(record.amount) || (record.quantity * record.unitPrice);
    record.gst = money(record.gst);
    record.totalAmount = Math.max(record.amount + record.gst, 0);
  }

  if (sheetName === "Business Assets") {
    record.purchaseValue = money(record.purchaseValue);
    record.currentValue = money(record.currentValue) || record.purchaseValue;
  }

  if (sheetName === "Business Liabilities") {
    record.principal = money(record.principal);
    record.amountPaid = money(record.amountPaid);
    record.outstandingAmount = Math.max(record.principal - record.amountPaid, 0);
    record.status = dueStatus(record.outstandingAmount, record.status);
  }

  if (sheetName === "Business Receivables" || sheetName === "Business Payables") {
    record.amount = money(record.amount);
    record.amountPaid = money(record.amountPaid);
    record.balanceAmount = Math.max(record.amount - record.amountPaid, 0);
    record.status = dueStatus(record.balanceAmount, record.status);
  }

  if (sheetName === "Business Inventory") {
    record.quantityInStock = money(record.quantityInStock);
    record.purchasePrice = money(record.purchasePrice);
    record.stockValue = record.quantityInStock * record.purchasePrice;
    record.status = record.status || (record.quantityInStock <= money(record.reorderLevel) ? "Reorder" : "In Stock");
  }

  if (sheetName === "Farm Inventory") {
    record.quantityInStock = money(record.quantityInStock);
    record.purchasePrice = money(record.purchasePrice);
    record.stockValue = record.quantityInStock * record.purchasePrice;
    record.status = record.status || (record.quantityInStock <= money(record.reorderLevel) ? "Reorder" : "In Stock");
  }

  if (sheetName === "Goals") {
    record.targetAmount = money(record.targetAmount);
    record.amountSaved = money(record.amountSaved);
    record.remainingAmount = Math.max(record.targetAmount - record.amountSaved, 0);
    record.progressPercentage = record.targetAmount ? Math.min((record.amountSaved / record.targetAmount) * 100, 100) : 0;
    record.remainingMonths = monthsBetweenNow(record.targetDate);
    record.requiredMonthlyContribution = record.remainingMonths ? record.remainingAmount / record.remainingMonths : record.remainingAmount;
    if (!record.status) {
      record.status = record.remainingAmount <= 0 ? "Completed" : record.progressPercentage > 0 ? "In Progress" : "Not Started";
    }
  }

  if (sheetName === "Goal Contributions") {
    record.amount = money(record.amount);
    record.contributionDate = record.contributionDate || nowIso().slice(0, 10);
    record.linkedBankCashId = record.linkedBankCashId || `BANK-GOAL-${record.id}`;
  }

  if (sheetName === "Goal Categories") {
    record.status = record.status || "Active";
    record.defaultCategory = record.defaultCategory || "No";
  }

  if (sheetName === "Salary & Income") {
    const deductions = money(record.pfDeduction) + money(record.taxDeduction) + money(record.otherDeductions);
    record.netSalary = money(record.netSalary) || Math.max(money(record.grossSalary) - deductions, 0);
    record.totalMonthlyIncome = record.netSalary + money(record.rentalIncome) + money(record.agriculturalIncome) + money(record.otherIncome);
  }

  if (sheetName === "Tax Planner") {
    const grossIncome = money(record.annualSalary) + money(record.agriculturalIncome) + money(record.otherIncome);
    const deductions = money(record.deductions80c) + money(record.healthInsurance) + money(record.homeLoanInterest) + money(record.educationLoanInterest);
    record.taxableIncome = Math.max(grossIncome - deductions, 0);
    record.remainingTaxPayable = Math.max(money(record.estimatedIncomeTax) + money(record.advanceTax) - money(record.taxAlreadyDeducted), 0);
  }

  if (sheetName === "Bill & Utilities") {
    record.balanceAmount = Math.max(money(record.amount) - money(record.paidAmount), 0);
    record.status = dueStatus(record.balanceAmount, record.status);
  }

  if (sheetName === "Budget Planner") {
    record.variance = money(record.plannedAmount) - money(record.actualAmount);
    record.status = record.status || (record.variance >= 0 ? "On Track" : "Over Budget");
  }

  if (sheetName === "Farm Manager") {
    record.profitLoss = money(record.netSaleAmount) - money(record.farmExpense);
  }

  record.id = safeText(record[idColumn.key]);
  return record;
}

function writeModuleRow(row, definition, record) {
  const headerMap = headerIndexMap(row.worksheet);
  definition.columns.forEach((column) => {
    const columnNumber = headerMap.get(column.header.toLowerCase());
    if (!columnNumber) return;
    row.getCell(columnNumber).value = record[column.key] ?? "";
  });
}

function getBusinessSummary(workbook) {
  const income = getModuleRecords(workbook, "Business Income");
  const expenses = getModuleRecords(workbook, "Business Expenses");
  const investments = getModuleRecords(workbook, "Business Investment");
  const assets = getModuleRecords(workbook, "Business Assets");
  const liabilities = getModuleRecords(workbook, "Business Liabilities");
  const receivables = getModuleRecords(workbook, "Business Receivables");
  const revenue = income.reduce((sum, row) => sum + money(row.netAmount), 0);
  const expenseTotal = expenses.reduce((sum, row) => sum + money(row.totalAmount || row.amount), 0);
  const investmentTotal = investments.reduce((sum, row) => sum + money(row.amount), 0);
  const assetTotal = assets.reduce((sum, row) => sum + money(row.currentValue || row.purchaseValue), 0);
  const liabilityTotal = liabilities.reduce((sum, row) => sum + money(row.outstandingAmount || row.principal), 0);
  const pendingReceivables = receivables.reduce((sum, row) => sum + money(row.balanceAmount), 0);
  const profitLoss = revenue - expenseTotal;
  return {
    revenue,
    expenses: expenseTotal,
    profitLoss,
    roiPercent: investmentTotal ? (profitLoss / investmentTotal) * 100 : 0,
    profitMarginPercent: revenue ? (profitLoss / revenue) * 100 : 0,
    investmentTotal,
    assetTotal,
    liabilityTotal,
    netWorth: assetTotal - liabilityTotal,
    pendingReceivables
  };
}

function getGoalsSummary(workbook) {
  const goals = getModuleRecords(workbook, "Goals");
  const targetAmount = goals.reduce((sum, goal) => sum + money(goal.targetAmount), 0);
  const amountSaved = goals.reduce((sum, goal) => sum + money(goal.amountSaved), 0);
  const completed = goals.filter((goal) => safeText(goal.status).toLowerCase() === "completed").length;
  return {
    goalCount: goals.length,
    targetAmount,
    amountSaved,
    remainingAmount: Math.max(targetAmount - amountSaved, 0),
    progressPercentage: targetAmount ? Math.min((amountSaved / targetAmount) * 100, 100) : 0,
    completed
  };
}

function sumRows(rows, keys) {
  return rows.reduce((sum, row) => sum + keys.reduce((inner, key) => inner + money(row[key]), 0), 0);
}

function rowDateValue(row, keys = []) {
  const value = keys.map((key) => row[key]).find((item) => safeText(item));
  const parsed = new Date(value || "");
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function monthKeyForDate(date) {
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function aggregateMonthlySeries(rows, dateKeys, valueResolver) {
  const byMonth = new Map();
  rows.forEach((row) => {
    const date = rowDateValue(row, dateKeys);
    const month = monthKeyForDate(date);
    if (!month) return;
    byMonth.set(month, (byMonth.get(month) || 0) + money(valueResolver(row)));
  });
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([period, value]) => ({ period, value }));
}

function recordsForReport(workbook, sheetName) {
  const definition = moduleDefinitionBySheet(sheetName);
  if (definition) return getModuleRecords(workbook, sheetName);
  return [];
}

function calculateSlabTax(taxableIncome, slabs) {
  const income = Math.max(money(taxableIncome), 0);
  let tax = 0;
  let previousLimit = 0;
  slabs.forEach((slab) => {
    const upper = Number.isFinite(slab.upTo) ? slab.upTo : Infinity;
    const taxableAtSlab = Math.max(Math.min(income, upper) - previousLimit, 0);
    tax += taxableAtSlab * slab.rate;
    previousLimit = upper;
  });
  return Math.max(tax * 1.04, 0);
}

function sumTaxField(rows, keys) {
  return rows.reduce((sum, row) => sum + keys.reduce((fieldSum, key) => fieldSum + money(row[key]), 0), 0);
}

function latestTaxProfile(rows, financialYear) {
  const matching = rows.filter((row) => !financialYear || safeText(row.financialYear) === safeText(financialYear));
  const candidates = matching.length ? matching : rows;
  return candidates
    .slice()
    .sort((a, b) => new Date(b.lastUpdated || b.createdAt || 0) - new Date(a.lastUpdated || a.createdAt || 0))[0] || {};
}

function buildTaxPlannerEstimate(workbook, dashboard, config = {}) {
  const taxRows = recordsForReport(workbook, "Tax Planner");
  const profile = latestTaxProfile(taxRows, config.taxFinancialYear);
  const annualIncomeFromSheet = money(profile.annualSalary) + money(profile.agriculturalIncome) + money(profile.otherIncome);
  const annualIncome = annualIncomeFromSheet || money(dashboard.sections.income?.totalMonthlyIncome) * 12;
  const deductions80c = Math.min(sumTaxField([profile], ["deductions80c", "section80c", "taxDeduction"]), 150000);
  const deductions80ccd = Math.min(sumTaxField([profile], ["deductions80ccd", "npsContribution", "section80ccd"]), 50000);
  const deductions80d = Math.min(sumTaxField([profile], ["healthInsurance", "section80d", "medicalInsurance"]), 25000);
  const homeLoan = Math.min(sumTaxField([profile], ["homeLoanInterest", "housingLoanInterest"]), 200000);
  const educationLoan = sumTaxField([profile], ["educationLoanInterest", "section80e"]);
  const hra = sumTaxField([profile], ["hra", "houseRentAllowance"]);
  const lta = sumTaxField([profile], ["lta", "leaveTravelAllowance"]);
  const capitalGains = Math.max(
    sumTaxField(taxRows, ["capitalGains", "shortTermCapitalGains", "longTermCapitalGains"]),
    sumRows(recordsForReport(workbook, "Trading"), ["realisedProfitLoss"])
  );
  const standardDeductionOld = Math.min(annualIncome, 50000);
  const standardDeductionNew = Math.min(annualIncome, 75000);
  const oldDeductions = deductions80c + deductions80ccd + deductions80d + homeLoan + educationLoan + hra + lta + standardDeductionOld;
  const oldTaxableIncome = Math.max(annualIncome + Math.max(capitalGains, 0) - oldDeductions, 0);
  const newTaxableIncome = Math.max(annualIncome + Math.max(capitalGains, 0) - standardDeductionNew, 0);
  const oldRegimeTaxBeforeRebate = calculateSlabTax(oldTaxableIncome, [
    { upTo: 250000, rate: 0 },
    { upTo: 500000, rate: 0.05 },
    { upTo: 1000000, rate: 0.2 },
    { upTo: Infinity, rate: 0.3 }
  ]);
  const newRegimeTaxBeforeRebate = calculateSlabTax(newTaxableIncome, [
    { upTo: 400000, rate: 0 },
    { upTo: 800000, rate: 0.05 },
    { upTo: 1200000, rate: 0.1 },
    { upTo: 1600000, rate: 0.15 },
    { upTo: 2000000, rate: 0.2 },
    { upTo: 2400000, rate: 0.25 },
    { upTo: Infinity, rate: 0.3 }
  ]);
  const oldRegimeTax = oldTaxableIncome <= 500000 ? 0 : oldRegimeTaxBeforeRebate;
  const newRegimeTax = newTaxableIncome <= 1200000 ? 0 : newRegimeTaxBeforeRebate;
  const recommendedRegime = oldRegimeTax < newRegimeTax ? "Old Regime" : newRegimeTax < oldRegimeTax ? "New Regime" : "Review";
  const detectedExemptions = [
    { label: "80C", amount: deductions80c },
    { label: "80CCD", amount: deductions80ccd },
    { label: "80D", amount: deductions80d },
    { label: "Home Loan", amount: homeLoan },
    { label: "Education Loan", amount: educationLoan },
    { label: "HRA", amount: hra },
    { label: "LTA", amount: lta },
    { label: "Capital Gains", amount: capitalGains },
    { label: "Eligible Exemptions", amount: oldDeductions - standardDeductionOld }
  ];
  return {
    annualIncome,
    oldRegimeEstimate: { taxableIncome: oldTaxableIncome, estimatedTax: oldRegimeTax, deductions: oldDeductions },
    newRegimeEstimate: { taxableIncome: newTaxableIncome, estimatedTax: newRegimeTax, deductions: standardDeductionNew },
    recommendedRegime,
    estimatedTaxSaved: Math.abs(oldRegimeTax - newRegimeTax),
    detectedExemptions
  };
}

function getProtectedInvestmentSummary(workbook) {
  const portfolio = recordsForReport(workbook, "Portfolio");
  const stocks = recordsForReport(workbook, "Stocks");
  const mutualFunds = recordsForReport(workbook, "Mutual Funds");
  return {
    portfolioValue: sumRows(portfolio, ["currentValue"]),
    stocksValue: sumRows(stocks, ["currentValue"]),
    mutualFundsValue: sumRows(mutualFunds, ["currentValue"]),
    portfolioInvested: sumRows(portfolio, ["investedValue"]),
    stocksInvested: sumRows(stocks, ["investedValue"]),
    mutualFundsInvested: sumRows(mutualFunds, ["investedValue"]),
    portfolioRecords: portfolio.length,
    stocksRecords: stocks.length,
    mutualFundRecords: mutualFunds.length
  };
}

function buildFamilyDashboard(workbook) {
  const records = getAllRecords(workbook);
  const debtRows = getManualDebtRows(workbook);
  const debtSource = debtRows.length ? debtRows : records;
  const totals = getTotals(records, getManualChittyOverrides(workbook), debtSource);
  const debtInterest = getDebtInterestSummary(debtSource);
  const loanTotals = getLoanTotals(getLoanRecords(workbook));
  const tradingTotals = getTradingTotals(getTradingRecords(workbook), readCachedUpstoxTrades());
  const salaryRows = recordsForReport(workbook, "Salary & Income");
  const familyIncomeRows = recordsForReport(workbook, "Family Income");
  const expenseRows = recordsForReport(workbook, "Family Expenses");
  const childrenExpenseRows = recordsForReport(workbook, "Children Expenses");
  const personalMaintenanceRows = recordsForReport(workbook, "Personal Maintenance");
  const farmRows = recordsForReport(workbook, "Farm Manager");
  const agricultureRows = recordsForReport(workbook, "Agriculture Farm Records");
  const savingsRows = recordsForReport(workbook, "Savings");
  const otherAssetRows = recordsForReport(workbook, "Other Assets");
  const business = getBusinessSummary(workbook);
  const goals = getGoalsSummary(workbook);
  const taxRows = recordsForReport(workbook, "Tax Planner");
  const properties = getPropertyRecords(workbook);
  const investments = getProtectedInvestmentSummary(workbook);
  const businessAssets = recordsForReport(workbook, "Business Assets");
  const businessLiabilities = recordsForReport(workbook, "Business Liabilities");
  const businessReceivables = recordsForReport(workbook, "Business Receivables");
  const bills = recordsForReport(workbook, "Bill & Utilities");
  const calendar = recordsForReport(workbook, "Financial Calendar");
  const notifications = recordsForReport(workbook, "Notification Center");
  const bankCashRows = recordsForReport(workbook, "Bank & Cash Manager");

  const totalMonthlyIncome = salaryRows.reduce((sum, row) =>
    sum + (money(row.totalMonthlyIncome) || sumRows([row], ["netSalary", "rentalIncome", "agriculturalIncome", "otherIncome"])), 0);
  const totalFamilyIncome = totalMonthlyIncome + sumRows(familyIncomeRows, ["expectedAmount", "incomeReceived"]);
  const familyIncomeReceived = totalMonthlyIncome + sumRows(familyIncomeRows, ["incomeReceived"]);
  const familyPendingIncome = sumRows(familyIncomeRows, ["pendingIncome"]);
  const totalYearlyIncome = totalMonthlyIncome * 12;
  const averageMonthlyIncome = salaryRows.length ? totalMonthlyIncome / salaryRows.length : totalMonthlyIncome;
  const totalMonthlyExpenses = sumRows(expenseRows, ["amount"]) + sumRows(childrenExpenseRows, ["paidAmount"]) + sumRows(personalMaintenanceRows, ["paidAmount"]);
  const plannedExpenses = sumRows(childrenExpenseRows, ["plannedAmount"]) + sumRows(personalMaintenanceRows, ["plannedAmount"]);
  const pendingPlannedAmount = sumRows(childrenExpenseRows, ["pendingAmount"]) + sumRows(personalMaintenanceRows, ["pendingAmount"]) + Math.max(plannedExpenses - totalMonthlyExpenses, 0);
  const totalYearlyExpenses = totalMonthlyExpenses * 12;
  const monthlySavings = totalMonthlyIncome - totalMonthlyExpenses;
  const taxPayableRefund = taxRows.reduce((sum, row) => sum + money(row.remainingTaxPayable), 0);
  const availableBankCashBalance = bankCashRows.reduce((sum, row) => {
    const type = safeText(row.transactionType).toLowerCase();
    const amount = money(row.amount);
    return sum + (type.includes("expense") || type.includes("payment") || type.includes("debit") ? -amount : amount);
  }, 0);
  const pendingBills = sumRows(bills, ["balanceAmount"]);
  const totalPropertyValue = properties.reduce((sum, row) => sum + money(row.sellTotalPrice || row.purchaseTotalPrice), 0);
  const propertyInvestment = properties.reduce((sum, row) => sum + money(row.purchaseTotalPrice), 0);
  const propertyProfitLoss = totalPropertyValue - propertyInvestment;
  const totalFarmValue = sumRows(farmRows, ["netSaleAmount"]);
  const totalAgricultureIncome = sumRows(agricultureRows, ["totalFarmIncome", "incomeReceived"]);
  const farmIncomeReceived = totalFarmValue + sumRows(agricultureRows, ["incomeReceived"]);
  const farmPendingIncome = sumRows(agricultureRows, ["pendingIncome"]);
  const totalBusinessValue = Math.max(business.netWorth || 0, 0);
  const debtReceivable = debtInterest.withInterest || totals.balanceDebt || 0;
  const outstandingDebt = debtReceivable;
  const outstandingInterest = debtInterest.interest || 0;
  const tradingPortfolioInvested = investments.portfolioInvested + investments.stocksInvested + investments.mutualFundsInvested + tradingTotals.tradingInvestedValue;
  const tradingPortfolioCurrentValue = investments.portfolioValue + investments.stocksValue + investments.mutualFundsValue + tradingTotals.tradingCurrentValue;
  const tradingPortfolioProfitLoss = tradingPortfolioCurrentValue - tradingPortfolioInvested;
  const totalInvestments = tradingPortfolioCurrentValue + totals.total_chitty;
  const businessInvestments = recordsForReport(workbook, "Business Investment");
  const businessInvestedAmount = sumRows(businessInvestments, ["amount"]);
  const businessCurrentValue = totalBusinessValue + sumRows(businessAssets, ["currentValue"]);
  const businessProfitLoss = business.profitLoss;
  const savingsTotal = sumRows(savingsRows, ["totalSavings"]);
  const savingsInterestEarned = sumRows(savingsRows, ["interestEarned"]);
  const savingsGrowth = sumRows(savingsRows, ["growth"]);
  const otherAssetTotalValue = sumRows(otherAssetRows, ["totalAssetValue"]);
  const otherAssetCurrentValue = sumRows(otherAssetRows, ["currentValue"]);
  const otherAssetIncomeProfit = sumRows(otherAssetRows, ["incomeProfit"]);
  const totalAssets = totalPropertyValue + totalFarmValue + totalBusinessValue + totalInvestments + sumRows(businessAssets, ["currentValue"]) + Math.max(availableBankCashBalance, 0) + debtReceivable + sumRows(businessReceivables, ["balanceAmount"]);
  const pendingLoan = loanTotals.remainingLoanAmount || 0;
  const otherPayables = sumRows(businessLiabilities, ["outstandingAmount"]) + Math.max(taxPayableRefund, 0) + pendingBills;
  const totalLiabilities = pendingLoan + otherPayables;
  const currentNetWorth = totalAssets - totalLiabilities;

  const yearlyGrowth = getYearlyGrowth(records, getManualChittyOverrides(workbook), getLoanRecords(workbook), debtSource, getTradingRecords(workbook), readCachedUpstoxTrades());
  const latestGrowth = yearlyGrowth[yearlyGrowth.length - 1] || {};
  const previousGrowth = yearlyGrowth[yearlyGrowth.length - 2] || {};
  const previousFinancialYearNetWorth = money(previousGrowth.netWorth || 0);
  const previousMonthNetWorth = currentNetWorth - monthlySavings;
  const monthlyChange = currentNetWorth - previousMonthNetWorth;
  const yearlyChange = previousFinancialYearNetWorth ? currentNetWorth - previousFinancialYearNetWorth : 0;
  const netWorthGrowthPercent = previousFinancialYearNetWorth ? (yearlyChange / Math.abs(previousFinancialYearNetWorth)) * 100 : 0;
  const farmProfitLoss = sumRows(farmRows, ["profitLoss"]);
  const emergencyFundCoverage = totalMonthlyExpenses ? (goals.amountSaved / Math.max(totalMonthlyExpenses * 6, 1)) * 100 : 0;
  const financialHealthScore = Math.max(0, Math.min(100,
    45 + (monthlySavings > 0 ? 15 : -15) + (currentNetWorth > 0 ? 15 : -10) +
    Math.min(goals.progressPercentage || 0, 20) / 2 + (pendingLoan > 0 ? -8 : 8) + (debtReceivable > 0 ? 6 : 0) + (business.profitLoss > 0 ? 7 : 0)
  ));

  const recommendations = [];
  const pushRecommendation = (title, detail, route, priority = "On Track") => {
    if (recommendations.length < 5) recommendations.push({ title, detail, route, priority });
  };
  bills.filter((row) => money(row.balanceAmount) > 0).slice(0, 2).forEach((row) =>
    pushRecommendation("Bill Due", `${row.billType || "Utility"} pending ${money(row.balanceAmount).toLocaleString("en-IN")}`, "bill-utilities", "Urgent"));
  calendar.filter((row) => safeText(row.status).toLowerCase() !== "completed").slice(0, 1).forEach((row) =>
    pushRecommendation("Notification Center", row.title || row.eventType || "Upcoming financial event", "notification-center", "On Track"));
  if (goals.progressPercentage < 50 && goals.goalCount) pushRecommendation("Goal Behind Schedule", `${Math.round(goals.progressPercentage)}% of target saved`, "goals-planning", "Urgent");
  if (businessReceivables.some((row) => money(row.balanceAmount) > 0)) pushRecommendation("Business Receivable Pending", "Follow up pending business collections", "business-manager", "Urgent");
  if (emergencyFundCoverage < 100 && totalMonthlyExpenses) pushRecommendation("Emergency Fund Below Target", `${Math.round(emergencyFundCoverage)}% of 6-month expense cover`, "goals-planning", "Urgent");
  notifications.filter((row) => safeText(row.status).toLowerCase() !== "completed").slice(0, 1).forEach((row) =>
    pushRecommendation(row.title || "Notification Pending", row.notes || row.module || "Review pending alert", "notification-center", row.priority || "On Track"));
  if (!recommendations.length) pushRecommendation("Daily Review On Track", "No urgent financial actions detected.", "summary", "On Track");

  const incomeSeries = aggregateMonthlySeries(salaryRows, ["incomeDate", "salaryMonth", "createdAt"], (row) => money(row.totalMonthlyIncome));
  const expenseSeries = aggregateMonthlySeries(expenseRows, ["expenseDate", "month", "createdAt"], (row) => money(row.amount));
  const periods = [...new Set([...incomeSeries.map((row) => row.period), ...expenseSeries.map((row) => row.period)])].sort().slice(-12);
  const seriesValue = (series, period) => money(series.find((row) => row.period === period)?.value);
  const incomeExpenseSavings = periods.map((period) => ({
    period,
    income: seriesValue(incomeSeries, period),
    expenses: seriesValue(expenseSeries, period),
    savings: seriesValue(incomeSeries, period) - seriesValue(expenseSeries, period)
  }));
  const assetsLiabilitiesNetWorth = yearlyGrowth.map((row) => ({
    period: row.year,
    assets: money(row.assets || totalAssets),
    liabilities: money(row.liabilities || totalLiabilities),
    netWorth: money(row.netWorth || currentNetWorth)
  }));
  const fallbackPeriod = new Date().getFullYear().toString();
  const netWorthGrowth = (assetsLiabilitiesNetWorth.length ? assetsLiabilitiesNetWorth : [{ period: fallbackPeriod, assets: totalAssets, liabilities: totalLiabilities, netWorth: currentNetWorth }])
    .map((row) => ({ period: row.period, netWorth: row.netWorth }));
  const businessProfitTrend = aggregateMonthlySeries(recordsForReport(workbook, "Business Income"), ["incomeDate", "createdAt"], (row) => money(row.netAmount))
    .map((row) => ({ period: row.period, profit: row.value }));
  const farmProfitTrend = aggregateMonthlySeries(farmRows, ["createdAt", "lastUpdated"], (row) => money(row.profitLoss));

  return {
    sections: {
      income: { totalMonthlyIncome: totalFamilyIncome, totalYearlyIncome, averageMonthlyIncome, incomeReceived: familyIncomeReceived, pendingIncome: familyPendingIncome },
      expenses: { totalMonthlyExpenses, totalYearlyExpenses, monthlySavings, paidAmount: totalMonthlyExpenses, pendingPlannedAmount },
      assets: { totalAssets, totalInvestments, totalPropertyValue, totalFarmValue: totalFarmValue + totalAgricultureIncome, totalBusinessValue, debtReceivable, outstandingInterest, availableBankCashBalance, propertyInvestment, propertyProfitLoss, otherAssetValue: otherAssetTotalValue, otherCurrentValue: otherAssetCurrentValue, otherIncomeProfit: otherAssetIncomeProfit },
      liabilities: { outstandingDebt, outstandingInterest, pendingLoan, totalLiabilities, amountPayable: pendingLoan, pendingBills, amountLent: totals.debt_given, amountRecovered: totals.debt_cleared, totalLoanAmount: loanTotals.loanAmount, totalLoanPaid: loanTotals.loanPaid, otherPayables },
      receivables: { amountLent: totals.debt_given, amountRecovered: totals.debt_cleared, outstandingLentWithInterest: debtReceivable, outstandingInterest },
      payables: { totalLoanAmount: loanTotals.loanAmount, totalLoanPaid: loanTotals.loanPaid, totalPendingLoan: pendingLoan, totalPayableAmount: otherPayables, amountPaid: sumRows(bills, ["paidAmount"]), pendingPayableAmount: pendingBills },
      netWorth: { currentNetWorth, previousMonthNetWorth, previousFinancialYearNetWorth, monthlyChange, yearlyChange, netWorthGrowthPercent },
      businessFarm: { businessProfitLoss, farmProfitLoss, totalFarmIncome: totalFarmValue + totalAgricultureIncome, farmIncomeReceived, farmPendingIncome },
      propertyAssets: { totalValue: totalPropertyValue, investment: propertyInvestment, profitLoss: propertyProfitLoss },
      tradingPortfolio: { totalInvestedAmount: tradingPortfolioInvested, currentPortfolioValue: tradingPortfolioCurrentValue, overallProfitLoss: tradingPortfolioProfitLoss },
      business: { investedAmount: businessInvestedAmount, currentValue: businessCurrentValue, profitLoss: businessProfitLoss, totalIncome: business.revenue, totalExpenses: business.expenses, netProfitLoss: business.profitLoss },
      savings: { totalSavings: savingsTotal || Math.max(availableBankCashBalance, 0), interestEarned: savingsInterestEarned, growth: savingsGrowth || monthlySavings },
      otherAssets: { totalAssetValue: otherAssetTotalValue, currentValue: otherAssetCurrentValue, incomeProfit: otherAssetIncomeProfit },
      goals: { goalAmount: goals.targetAmount, savedAmount: goals.amountSaved, remainingAmount: goals.remainingAmount },
      investments: {
        tradingInvestment: tradingTotals.tradingInvestedValue,
        tradingCurrentValue: tradingTotals.tradingCurrentValue,
        tradingProfitLoss: tradingTotals.tradingProfitLoss,
        tradingPortfolioInvested,
        tradingPortfolioCurrentValue,
        tradingPortfolioProfitLoss,
        totalChittyValue: totals.total_chitty,
        chittyReceived: totals.completed_chitty_received,
        pendingChitty: totals.pending_chitty,
        ...investments
      },
      goalsTax: { goalProgressPercent: goals.progressPercentage, taxPayableRefund, emergencyFundCoverage, financialHealthScore },
      cashHealth: { availableBankCashBalance, financialHealthScore }
    },
    trends: { incomeExpenseSavings, assetsLiabilitiesNetWorth, netWorthGrowth, businessProfitTrend, farmProfitTrend },
    recommendations
  };
}

function buildReportsAnalytics(workbook) {
  const records = getAllRecords(workbook);
  const debtRows = getManualDebtRows(workbook);
  const debtSource = debtRows.length ? debtRows : records;
  const totals = getTotals(records, getManualChittyOverrides(workbook), debtSource);
  const loanTotals = getLoanTotals(getLoanRecords(workbook));
  const tradingTotals = getTradingTotals(getTradingRecords(workbook), readCachedUpstoxTrades());
  const dashboard = buildFamilyDashboard(workbook);
  const reportList = [
    ["Family Income", "salary-income", "Salary & Income", ["totalMonthlyIncome", "netSalary", "rentalIncome", "agriculturalIncome", "otherIncome"]],
    ["Family Income Records", "family-income", "Family Income", ["expectedAmount", "incomeReceived", "pendingIncome"]],
    ["Family Expenses", "family-expenses", "Family Expenses", ["amount"]],
    ["Family Expenses - Children", "family-expenses", "Children Expenses", ["plannedAmount", "paidAmount", "pendingAmount"]],
    ["Personal Maintenance", "personal-maintenance", "Personal Maintenance", ["plannedAmount", "paidAmount", "pendingAmount"]],
    ["Salary", "salary-income", "Salary & Income", ["grossSalary", "netSalary", "totalMonthlyIncome"]],
    ["Agriculture & Farm Manager", "farm-manager", "Farm Manager", ["farmExpense", "netSaleAmount", "profitLoss"]],
    ["Agriculture & Farm Records", "farm-manager", "Agriculture Farm Records", ["totalFarmIncome", "incomeReceived", "pendingIncome", "profitLoss"]],
    ["Business", "business-manager", "Business Income", ["netAmount", "paymentReceived", "pendingAmount"]],
    ["Business Investment", "business-manager", "Business Investment", ["amount"]],
    ["Lent Receivable", "debt", null, []],
    ["Loans and Property Loans", "loan", null, []],
    ["Assets & Wealth", "property", null, []],
    ["Bank, Cash & Savings", "bank-cash-manager", "Savings", ["totalSavings", "interestEarned", "growth"]],
    ["Assets & Wealth - Other Assets", "property", "Other Assets", ["totalAssetValue", "currentValue", "incomeProfit"]],
    ["Bank, Cash & Savings - Bank Cash", "bank-cash-manager", "Bank & Cash Manager", ["amount"]],
    ["Family Expenses - Insurance", "family-expenses", "Insurance Manager", ["premiumAmount", "coverageAmount"]],
    ["Goals & Planning - Budget", "goals-planning", "Budget Planner", ["plannedAmount", "actualAmount", "variance"]],
    ["Goals & Planning", "goals-planning", "Goals", ["targetAmount", "amountSaved", "remainingAmount"]],
    ["Tax", "tax-planner", "Tax Planner", ["remainingTaxPayable", "estimatedIncomeTax"]],
    ["Chitty", "chitty", null, []],
    ["Trading", "trading", "Trading", ["investedValue", "currentValue", "profitLoss"]],
    ["Market Pulse", "trading", "Market Pulse", ["marketPrice", "dayChange"]],
    ["Portfolio", "trading", "Portfolio", ["investedValue", "currentValue", "profitLoss"]],
    ["Stocks", "trading", "Stocks", ["investedValue", "currentValue", "profitLoss"]],
    ["Mutual Funds", "trading", "Mutual Funds", ["investedValue", "currentValue", "profitLoss"]],
    ["Net Worth", "summary", null, []],
    ["Documents", "document-vault", "Document Vault", []],
    ["Family Expenses - Bills & Utilities", "family-expenses", "Bill & Utilities", ["amount", "paidAmount", "balanceAmount"]],
    ["Notification Center - Calendar Reminders", "notification-center", "Financial Calendar", ["amount"]],
    ["Notifications", "notification-center", "Notification Center", []],
    ["AI Recommendations", "summary", null, []]
  ];

  return {
    reports: reportList.map(([name, route, sheet, keys]) => {
      const rows = sheet ? recordsForReport(workbook, sheet) : [];
      const value = name === "Lent Receivable" ? totals.balanceDebt
        : name === "Loans and Property Loans" ? loanTotals.remainingLoanAmount
        : name === "Chitty" ? totals.pending_chitty
        : name === "Net Worth" ? dashboard.sections.netWorth.currentNetWorth
        : name === "AI Recommendations" ? dashboard.recommendations.length
        : sumRows(rows, keys);
      return { name, route, sheet, records: rows.length || (name === "Lent Receivable" ? debtSource.length : 0), value };
    }),
    netWorthReport: {
      openingNetWorth: dashboard.sections.netWorth.previousFinancialYearNetWorth,
      currentNetWorth: dashboard.sections.netWorth.currentNetWorth,
      monthlyChange: dashboard.sections.netWorth.monthlyChange,
      yearlyChange: dashboard.sections.netWorth.yearlyChange,
      netWorthGrowthPercent: dashboard.sections.netWorth.netWorthGrowthPercent,
      totalAssets: dashboard.sections.assets.totalAssets,
      totalLiabilities: dashboard.sections.liabilities.totalLiabilities,
      assetGrowth: dashboard.sections.assets.totalAssets - dashboard.sections.netWorth.previousFinancialYearNetWorth,
      liabilityReduction: dashboard.sections.liabilities.totalLiabilities,
      largestIncomeSource: "Salary & Income",
      largestExpense: "Family Expenses",
      largestInvestment: "Trading / Portfolio",
      largestLoan: loanTotals.remainingLoanAmount,
      largestFarmProfit: dashboard.sections.businessFarm.farmProfitLoss,
      largestBusinessProfit: dashboard.sections.businessFarm.businessProfitLoss,
      financialHealthScore: dashboard.sections.goalsTax.financialHealthScore
    },
    trends: dashboard.trends,
    recommendations: dashboard.recommendations,
    totals: { ...totals, ...loanTotals, ...tradingTotals }
  };
}

function buildNetWorthReport(workbook) {
  const dashboard = buildFamilyDashboard(workbook);
  const sections = dashboard.sections || {};
  const assets = sections.assets || {};
  const investments = sections.investments || {};
  const tradingPortfolio = sections.tradingPortfolio || {};
  const receivables = sections.receivables || {};
  const liabilities = sections.liabilities || {};
  const payables = sections.payables || {};
  const cashHealth = sections.cashHealth || {};
  const savings = sections.savings || {};
  const totalAssets = money(assets.totalPropertyValue) + money(assets.totalFarmValue) + money(assets.totalBusinessValue) + money(assets.otherCurrentValue);
  const currentInvestmentValue = money(tradingPortfolio.currentPortfolioValue) + money(investments.totalChittyValue);
  const bankCashSavings = Math.max(money(cashHealth.availableBankCashBalance), 0) + money(savings.totalSavings);
  const totalReceivables = money(receivables.outstandingLentWithInterest);
  const totalLiabilities = money(payables.totalPendingLoan) + money(payables.pendingPayableAmount);
  const ongoingCommitments = money(payables.totalPayableAmount) - money(payables.amountPaid);
  const investmentProfitLoss = money(tradingPortfolio.overallProfitLoss);
  const actualNetWorth = totalAssets + currentInvestmentValue + bankCashSavings + totalReceivables - totalLiabilities - Math.max(ongoingCommitments, 0);
  return {
    totalAssets,
    totalInvestments: currentInvestmentValue,
    bankCashSavings,
    totalReceivables,
    totalLiabilities,
    ongoingCommitments: Math.max(ongoingCommitments, 0),
    actualNetWorth,
    investmentProfitLoss,
    calculatedAt: nowIso(),
    formula: "Total Assets + Current Investment Value + Bank, Cash and Savings + Outstanding Lent Receivable - Total Liabilities - Ongoing Payable Commitments"
  };
}

function backupIdForPath(filePath) {
  return `BAK-${crypto.createHash("sha256").update(path.resolve(filePath).toLowerCase()).digest("hex").slice(0, 16).toUpperCase()}`;
}

function backupTypeFor(fileName, metadata = {}) {
  const configured = safeText(metadata.backupType).toLowerCase();
  if (configured === "incremental") return "Incremental";
  if (configured === "full") return "Full";
  return /incremental|delta/i.test(fileName) ? "Incremental" : "Full";
}

function backupPeriodFor(filePath, metadata = {}) {
  if (safeText(metadata.backupPeriod)) return safeText(metadata.backupPeriod);
  if (/pre[_ -]?restore/i.test(filePath)) return "Pre-restore";
  if (/weekly/i.test(filePath)) return "Weekly";
  if (/monthly/i.test(filePath)) return "Monthly";
  if (/structural/i.test(filePath)) return "Structural safety";
  if (/previous|before/i.test(filePath)) return "Automatic safety";
  return "Manual";
}

function backupSourceFor(filePath, metadata = {}) {
  if (safeText(metadata.source)) return safeText(metadata.source);
  if (filePath.includes("weekly-backups")) return "Weekly full backup";
  if (filePath.includes("structural-backups")) return "Pre-restore safety backup";
  return "Workbook safety backup";
}

function dateAfterDays(date, days) {
  const value = new Date(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString();
}

async function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fsSync.createReadStream(filePath);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function publicBackupRecord(backup) {
  const { internalPath, ...publicRecord } = backup;
  return publicRecord;
}

function workbookSchemaFingerprint(workbook) {
  const schema = workbook.worksheets
    .map((sheet) => {
      const headers = [];
      const maxColumns = Math.max(sheet.columnCount, 1);
      for (let columnNumber = 1; columnNumber <= maxColumns; columnNumber++) {
        headers.push(safeText(sheet.getRow(1).getCell(columnNumber).text).trim());
      }
      return { name: sheet.name, headers };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
  return crypto.createHash("sha256").update(JSON.stringify(schema)).digest("hex");
}

function backupTimestamp(backup) {
  const timestamp = new Date(backup.modifiedAt || backup.createdAt || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

async function inspectBackupWorkbook(filePath, catalog = {}) {
  const stat = await fs.stat(filePath);
  const backupId = backupIdForPath(filePath);
  const metadata = catalog[backupId] || {};
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheets = workbook.worksheets.map((sheet) => {
    let records = 0;
    const maxColumns = Math.max(sheet.columnCount, 1);
    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
      if (!isEmptyRow(sheet.getRow(rowNumber), maxColumns)) records++;
    }
    return { name: sheet.name, records };
  });
  const recordCount = worksheets.reduce((sum, sheet) => sum + sheet.records, 0);
  const checksum = await sha256File(filePath);
  const schemaFingerprint = workbookSchemaFingerprint(workbook);
  const hasData = recordCount > 0;
  const checksumStatus = !hasData
    ? "Invalid"
    : metadata.checksumValue
      ? safeCompare(metadata.checksumValue, checksum) ? "Valid" : "Invalid"
      : "Unverified";
  const backupType = backupTypeFor(path.basename(filePath), metadata);
  const status = checksumStatus === "Invalid" ? "Corrupted" : safeText(metadata.status || "Available");
  const restoreSupported = backupType === "Full";
  const restoreEligible = status === "Available" && checksumStatus === "Valid" && restoreSupported;
  return {
    backupId,
    backupName: safeText(metadata.backupName) || path.basename(filePath),
    backupType,
    createdAt: stat.birthtime.toISOString(),
    modifiedAt: stat.mtime.toISOString(),
    backupPeriod: backupPeriodFor(filePath, metadata),
    size: stat.size,
    createdBy: safeText(metadata.createdBy) || "System",
    source: backupSourceFor(filePath, metadata),
    status,
    parentFullBackupId: safeText(metadata.parentFullBackupId),
    previousIncrementalBackupId: safeText(metadata.previousIncrementalBackupId),
    checksumStatus,
    retentionExpiry: safeText(metadata.retentionExpiry) || dateAfterDays(stat.mtime, 90),
    restoreEligible,
    restoreSupport: restoreSupported ? "Full snapshot restore" : "Incremental restore format is not configured",
    workbookVersion: safeText(metadata.schemaVersion) || (worksheets.some((sheet) => sheet.name === "Dashboard") ? "Smart Fin 365 Dashboard" : "Workbook"),
    schemaFingerprint,
    includedWorksheets: worksheets.map((sheet) => sheet.name),
    affectedDatasets: worksheets.filter((sheet) => sheet.records > 0).map((sheet) => sheet.name),
    recordCount,
    validatedAt: safeText(metadata.validatedAt),
    internalPath: filePath
  };
}

async function listWorkbookBackups({ includeInternalPath = false } = {}) {
  const config = await readConfig();
  const catalog = config.backupCatalog && typeof config.backupCatalog === "object" ? config.backupCatalog : {};
  const roots = uniquePaths([
    backupStorageDir,
    dataDir,
    workDirPath
  ]);
  const files = [];
  async function walk(folder) {
    const entries = await fs.readdir(folder, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const fullPath = path.join(folder, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (/backup|previous|before|weekly|monthly/i.test(entry.name) && /\.xlsx$/i.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  for (const root of roots) await walk(root);
  const unique = [...new Set(files)];
  const inspected = [];
  for (const filePath of unique) {
    try {
      inspected.push(await inspectBackupWorkbook(filePath, catalog));
    } catch (error) {
      const backupId = backupIdForPath(filePath);
      const metadata = catalog[backupId] || {};
      inspected.push({
        backupId,
        backupName: safeText(metadata.backupName) || path.basename(filePath),
        backupType: backupTypeFor(path.basename(filePath), metadata),
        createdAt: "",
        modifiedAt: "",
        backupPeriod: backupPeriodFor(filePath, metadata),
        createdBy: safeText(metadata.createdBy) || "System",
        source: backupSourceFor(filePath, metadata),
        parentFullBackupId: safeText(metadata.parentFullBackupId),
        previousIncrementalBackupId: safeText(metadata.previousIncrementalBackupId),
        checksumStatus: "Invalid",
        retentionExpiry: safeText(metadata.retentionExpiry),
        restoreEligible: false,
        restoreSupport: "Unavailable",
        workbookVersion: safeText(metadata.schemaVersion) || "Unknown",
        schemaFingerprint: safeText(metadata.schemaFingerprint),
        size: 0,
        includedWorksheets: [],
        affectedDatasets: [],
        recordCount: 0,
        status: "Corrupted",
        internalPath: filePath
      });
    }
  }
  const sorted = inspected.sort((a, b) => new Date(b.modifiedAt || b.createdAt || 0) - new Date(a.modifiedAt || a.createdAt || 0));
  return includeInternalPath ? sorted : sorted.map(publicBackupRecord);
}

async function findWorkbookBackupById(backupId) {
  const cleanId = safeText(backupId);
  const backups = await listWorkbookBackups({ includeInternalPath: true });
  const backup = backups.find((item) => item.backupId === cleanId);
  if (!backup) {
    const error = new Error("Backup not found or no longer available.");
    error.status = 404;
    throw error;
  }
  return backup;
}

async function saveBackupCatalogEntry(backupId, patch) {
  const config = await readConfig();
  const catalog = config.backupCatalog && typeof config.backupCatalog === "object" ? config.backupCatalog : {};
  const nextCatalog = {
    ...catalog,
    [backupId]: {
      ...(catalog[backupId] || {}),
      ...patch,
      lastUpdated: nowIso()
    }
  };
  await updateConfig({ backupCatalog: nextCatalog });
  return nextCatalog[backupId];
}

async function validateWorkbookBackup(backupId, actor = "System") {
  const backup = await findWorkbookBackupById(backupId);
  const inspected = await inspectBackupWorkbook(backup.internalPath, {});
  const valid = inspected.recordCount > 0;
  await saveBackupCatalogEntry(backup.backupId, {
    backupName: backup.backupName,
    backupType: backup.backupType.toLowerCase(),
    backupPeriod: backup.backupPeriod,
    createdBy: backup.createdBy || actor,
    source: backup.source,
    checksumAlgorithm: "sha256",
    checksumValue: await sha256File(backup.internalPath),
    schemaVersion: inspected.workbookVersion,
    schemaFingerprint: inspected.schemaFingerprint,
    status: valid ? "Available" : "Corrupted",
    integrityStatus: valid ? "Valid" : "Invalid",
    validatedAt: nowIso(),
    validationError: valid ? "" : "Workbook contains no financial records."
  });
  const validated = await findWorkbookBackupById(backup.backupId);
  const dependencyPlan = await buildBackupRestoreChain(backup.backupId);
  await saveBackupCatalogEntry(backup.backupId, {
    dependencyStatus: dependencyPlan.chainValid ? "Valid" : "Invalid",
    dependencyValidationError: [...dependencyPlan.missingDependencies, ...dependencyPlan.invalidDependencies].join(" ")
  });
  return {
    ...(await findWorkbookBackupById(backup.backupId)),
    dependencyValidation: {
      chainValid: dependencyPlan.chainValid,
      missingDependencies: dependencyPlan.missingDependencies,
      invalidDependencies: dependencyPlan.invalidDependencies
    }
  };
}

async function buildBackupRestoreChain(backupId) {
  const selected = await findWorkbookBackupById(backupId);
  const inventory = await listWorkbookBackups({ includeInternalPath: true });
  const byId = new Map(inventory.map((backup) => [backup.backupId, backup]));
  const missingDependencies = [];
  const invalidDependencies = [];
  const chain = [];

  if (selected.backupType === "Full") {
    chain.push(selected);
  } else {
    const parent = byId.get(selected.parentFullBackupId);
    if (!parent || parent.backupType !== "Full") {
      missingDependencies.push(selected.parentFullBackupId || "Parent full backup");
    } else {
      chain.push(parent);
      if (backupTimestamp(parent) > backupTimestamp(selected)) {
        invalidDependencies.push("The parent full backup is newer than the selected incremental backup.");
      }
      if (!parent.schemaFingerprint || !selected.schemaFingerprint || parent.schemaFingerprint !== selected.schemaFingerprint) {
        invalidDependencies.push("The parent full backup and selected incremental backup use incompatible workbook schemas.");
      }
    }
    const visited = new Set();
    const increments = [];
    let current = selected;
    while (current) {
      if (visited.has(current.backupId)) {
        invalidDependencies.push("Incremental dependency cycle detected.");
        break;
      }
      visited.add(current.backupId);
      increments.unshift(current);
      const previousId = safeText(current.previousIncrementalBackupId);
      if (!previousId) break;
      const previous = byId.get(previousId);
      if (!previous) {
        missingDependencies.push(previousId);
        break;
      }
      if (previous.backupType !== "Incremental" || previous.parentFullBackupId !== selected.parentFullBackupId) {
        invalidDependencies.push(previous.backupId);
        break;
      }
      if (backupTimestamp(previous) >= backupTimestamp(current)) {
        invalidDependencies.push(`${previous.backupId} is not earlier than ${current.backupId}.`);
        break;
      }
      if (!previous.schemaFingerprint || !selected.schemaFingerprint || previous.schemaFingerprint !== selected.schemaFingerprint) {
        invalidDependencies.push(`${previous.backupId} uses an incompatible workbook schema.`);
        break;
      }
      current = previous;
    }
    chain.push(...increments);
  }

  for (const backup of chain) {
    if (backup.status !== "Available") invalidDependencies.push(`${backup.backupId} is ${backup.status}.`);
    if (backup.checksumStatus !== "Valid") invalidDependencies.push(`${backup.backupId} checksum is ${backup.checksumStatus}.`);
  }

  const schemaVersions = new Set(chain.map((backup) => backup.schemaFingerprint).filter(Boolean));
  if (schemaVersions.size > 1) invalidDependencies.push("The selected restore chain contains incompatible workbook schemas.");

  const incrementalEngineAvailable = false;
  const chainValid = !missingDependencies.length && !invalidDependencies.length && chain.length > 0;
  const restoreSupported = selected.backupType === "Full" || incrementalEngineAvailable;
  return {
    selectedBackupId: selected.backupId,
    selectedBackupType: selected.backupType,
    warning: selected.backupType === "Incremental"
      ? "An incremental backup cannot be restored independently. Select the corresponding full backup and every required incremental backup in chronological order."
      : "A full backup is selected. Validation and an administrator confirmation are required before replacement.",
    chain: chain.map(publicBackupRecord),
    missingDependencies,
    invalidDependencies,
    affectedDatasets: [...new Set(chain.flatMap((backup) => backup.affectedDatasets || []))],
    estimatedRestorePoint: selected.modifiedAt || selected.createdAt,
    chainValid,
    restoreSupported,
    restoreEligibility: chainValid && restoreSupported
      ? "Eligible after administrator confirmation"
      : restoreSupported
        ? "Not eligible until dependencies and validation are corrected"
        : "Incremental restore is unavailable until a validated delta backup engine is configured"
  };
}

async function createPreRestoreFullBackup(workbookPath, actor) {
  const inspected = await inspectWorkbookFile(workbookPath);
  if (!inspected.hasData) {
    const error = new Error("The current workbook has no financial records, so a pre-restore backup cannot be created.");
    error.status = 409;
    throw error;
  }
  const backupDirectory = path.join(backupStorageDir, "structural-backups");
  const stamp = nowIso().replace(/[:.]/g, "-");
  const targetPath = path.join(backupDirectory, `${path.parse(workbookPath).name}_Pre_Restore_${stamp}.xlsx`);
  await fs.mkdir(backupDirectory, { recursive: true });
  await fs.copyFile(workbookPath, targetPath);
  const backup = await inspectBackupWorkbook(targetPath, {});
  await saveBackupCatalogEntry(backup.backupId, {
    backupName: path.basename(targetPath),
    backupType: "full",
    backupPeriod: "Pre-restore",
    createdBy: actor,
    source: "Automatic pre-restore safety backup",
    checksumAlgorithm: "sha256",
      checksumValue: await sha256File(targetPath),
      schemaVersion: backup.workbookVersion,
      schemaFingerprint: backup.schemaFingerprint,
    status: "Available",
    integrityStatus: "Valid",
    retentionExpiry: dateAfterDays(new Date(), 365),
    validatedAt: nowIso()
  });
  return findWorkbookBackupById(backup.backupId);
}

async function recordRestoreJob(job) {
  const config = await readConfig();
  const history = Array.isArray(config.restoreJobs) ? config.restoreJobs : [];
  const index = history.findIndex((item) => item.id === job.id);
  const nextHistory = index >= 0
    ? history.map((item) => item.id === job.id ? { ...item, ...job } : item)
    : [...history, job].slice(-100);
  await updateConfig({ restoreJobs: nextHistory });
}

async function restoreFullWorkbookBackup({ backupId, actor, confirmation, scope = "complete_system" }) {
  if (backupRestoreInProgress) {
    const error = new Error("A restore is already running. Wait for it to complete before starting another restore.");
    error.status = 409;
    throw error;
  }
  if (safeText(confirmation) !== "RESTORE") {
    const error = new Error("Enter RESTORE to confirm this destructive operation.");
    error.status = 400;
    throw error;
  }
  if (safeText(scope || "complete_system") !== "complete_system") {
    const error = new Error("Selected-module, date-range, and user-only restore are not available for a workbook snapshot. Use a complete system restore.");
    error.status = 422;
    throw error;
  }
  const plan = await buildBackupRestoreChain(backupId);
  if (!plan.chainValid || !plan.restoreSupported || plan.selectedBackupType !== "Full") {
    const error = new Error(plan.restoreEligibility);
    error.status = 422;
    throw error;
  }
  const source = await findWorkbookBackupById(backupId);
  const workbookPath = await getWorkbookPath();
  const job = {
    id: `RESTORE-${crypto.randomUUID()}`,
    backupId: source.backupId,
    requestedBy: actor,
    scope: "complete_system",
    status: "validating",
    startedAt: nowIso(),
    affectedDatasets: plan.affectedDatasets,
    restorePoint: plan.estimatedRestorePoint,
    chain: plan.chain.map((backup) => backup.backupId)
  };
  backupRestoreInProgress = true;
  let temporaryPath = "";
  let preRestoreBackup = null;
  try {
    await recordRestoreJob(job);
    preRestoreBackup = await createPreRestoreFullBackup(workbookPath, actor);
    job.preRestoreBackupId = preRestoreBackup.backupId;
    job.status = "running";
    await recordRestoreJob(job);

    temporaryPath = path.join(path.dirname(workbookPath), `.${path.basename(workbookPath)}.restore-${Date.now()}.tmp.xlsx`);
    await fs.copyFile(source.internalPath, temporaryPath);
    const staged = await inspectWorkbookFile(temporaryPath);
    if (!staged.hasData) throw new Error("The selected backup is readable but does not contain financial records.");
    await fs.copyFile(temporaryPath, workbookPath);
    const restored = await inspectWorkbookFile(workbookPath);
    if (!restored.hasData) throw new Error("Restore verification failed because the resulting workbook has no financial records.");
    const stat = await fs.stat(workbookPath).catch(() => null);
    if (stat) lastWorkbookMtime = stat.mtimeMs;
    job.status = "completed";
    job.completedAt = nowIso();
    job.report = {
      restoredRows: restored.stats.dataRows,
      restoredSheets: restored.stats.sheets,
      preRestoreBackupId: preRestoreBackup.backupId
    };
    await recordRestoreJob(job);
    await updateConfig({
      lastLocalSync: nowIso(),
      lastSyncSource: `Restored from ${source.backupId}`,
      lastSyncError: ""
    });
    await appendSecurityLog("backup_restore_completed", {
      actor,
      restoreJobId: job.id,
      backupId: source.backupId,
      preRestoreBackupId: preRestoreBackup.backupId
    });
    return { job, plan };
  } catch (error) {
    if (preRestoreBackup?.internalPath) {
      await fs.copyFile(preRestoreBackup.internalPath, workbookPath).catch(() => {});
      job.rollbackPerformed = true;
    }
    job.status = "failed";
    job.completedAt = nowIso();
    job.failureReason = error.message || "Restore failed.";
    await recordRestoreJob(job);
    await appendSecurityLog("backup_restore_failed", { actor, restoreJobId: job.id, backupId, error: job.failureReason });
    throw error;
  } finally {
    if (temporaryPath) await fs.unlink(temporaryPath).catch(() => {});
    backupRestoreInProgress = false;
  }
}

function updateGoalByDelta(workbook, goalId, amountDelta) {
  if (!safeText(goalId) || !amountDelta) return null;
  const definition = moduleDefinitionBySheet("Goals");
  const sheet = ensureWorkbookSheetDefinition(workbook, definition);
  const row = findModuleRow(sheet, definition, goalId);
  if (!row) return null;
  const existing = moduleRowToRecord(row, definition);
  const updated = normalizeModuleRecord("Goals", {
    ...existing,
    amountSaved: Math.max(money(existing.amountSaved) + money(amountDelta), 0)
  }, existing);
  writeModuleRow(row, definition, updated);
  return updated;
}

function upsertGoalContributionBankCash(workbook, contribution) {
  const definition = moduleDefinitionBySheet("Bank & Cash Manager");
  const sheet = ensureWorkbookSheetDefinition(workbook, definition);
  const existingRows = getModuleRecords(workbook, "Bank & Cash Manager");
  const existing = existingRows.find((row) => row.linkedModule === "Goal Contributions" && row.linkedRecordId === contribution.id) || {};
  const normalized = normalizeModuleRecord("Bank & Cash Manager", {
    ...existing,
    id: existing.id || contribution.linkedBankCashId || `BANK-GOAL-${contribution.id}`,
    date: contribution.contributionDate,
    accountName: contribution.paidFromAccount,
    accountType: "Cash / Bank",
    transactionType: "Goal Contribution",
    category: "Goals & Planning",
    amount: contribution.amount,
    paymentMode: contribution.paymentMode,
    referenceNumber: contribution.referenceNumber,
    linkedModule: "Goal Contributions",
    linkedRecordId: contribution.id,
    notes: contribution.notes
  }, existing);
  const row = existing.id ? findModuleRow(sheet, definition, existing.id) : null;
  if (row) {
    writeModuleRow(row, definition, normalized);
  } else {
    const newRow = sheet.addRow([]);
    writeModuleRow(newRow, definition, normalized);
  }
}

function deleteLinkedBankCashRecord(workbook, linkedRecordId) {
  const definition = moduleDefinitionBySheet("Bank & Cash Manager");
  const sheet = workbook.getWorksheet("Bank & Cash Manager");
  if (!sheet) return;
  const headerMap = headerIndexMap(sheet);
  const linkedColumn = headerMap.get("linked record id");
  const moduleColumn = headerMap.get("linked module");
  if (!linkedColumn) return;
  for (let rowNumber = sheet.rowCount; rowNumber >= 2; rowNumber--) {
    const row = sheet.getRow(rowNumber);
    if (
      safeText(cellValue(row.getCell(linkedColumn))) === safeText(linkedRecordId) &&
      (!moduleColumn || safeText(cellValue(row.getCell(moduleColumn))) === "Goal Contributions")
    ) {
      sheet.spliceRows(rowNumber, 1);
    }
  }
  ensureWorkbookSheetDefinition(workbook, definition);
}

function categoryIsUsed(workbook, categoryName) {
  return getModuleRecords(workbook, "Goals")
    .some((goal) => safeText(goal.goalCategory).toLowerCase() === safeText(categoryName).toLowerCase());
}

function getModulePayload(workbook, slug) {
  const definition = moduleDefinitionBySlug(slug);
  if (!definition) return null;
  const records = getModuleRecords(workbook, definition.name);
  const payload = {
    slug,
    sheet: definition.name,
    columns: definition.columns,
    moneyKeys: definition.moneyKeys || [],
    records,
    sync: { pending: records.filter((record) => record.syncStatus === "Pending Sync").length }
  };
  if (definition.name.startsWith("Business")) payload.businessSummary = getBusinessSummary(workbook);
  if (definition.name === "Goals" || definition.name.startsWith("Goal ")) {
    payload.goalsSummary = getGoalsSummary(workbook);
    payload.goalCategories = getModuleRecords(workbook, "Goal Categories");
    payload.goals = getModuleRecords(workbook, "Goals");
  }
  if (definition.name !== "Business Profile") payload.businessProfiles = getModuleRecords(workbook, "Business Profile");
  return payload;
}

async function uploadWorkbookToDriveWithRetry(attempt = 1) {
  const driveFile = await uploadWorkbookToDriveIfConnected();
  if (driveFile || attempt >= 3) return driveFile;
  setTimeout(() => {
    uploadWorkbookToDriveWithRetry(attempt + 1).catch((error) => appendSyncLog("Drive retry failed.", error));
  }, attempt * 5000);
  return null;
}

let syncInProgress = false;
let upstoxSyncInProgress = false;
let workbookWriteInProgress = false;
let lastWorkbookMtime = 0;
let queuedSyncReason = "";

async function syncWorkbookFromDisk(reason = "external change") {
  if (workbookWriteInProgress) {
    queuedSyncReason = reason;
    return;
  }
  if (syncInProgress) {
    queuedSyncReason = reason;
    return;
  }
  syncInProgress = true;
  try {
    const workbook = await loadWorkbook();
    syncDebtStatusRows(workbook);
    applyAutomaticChittyCompletion(workbook);
    rebuildDerivedSheets(workbook);
    rebuildSummary(workbook);
    const workbookPath = await getWorkbookPath();
    await writeWorkbookWithRetry(workbook, workbookPath);
    await uploadWorkbookToDriveWithRetry();
    const stat = await fs.stat(workbookPath);
    lastWorkbookMtime = stat.mtimeMs;
    await updateConfig({ lastSyncSource: reason, lastLocalSync: nowIso(), lastSyncError: "" });
  } catch (error) {
    await updateConfig({ lastSyncError: error.message || "Workbook synchronization failed." });
    await appendSyncLog(`Workbook synchronization failed after ${reason}.`, error);
    setTimeout(() => syncWorkbookFromDisk("retry").catch(() => {}), 5000);
  } finally {
    syncInProgress = false;
    if (queuedSyncReason) {
      const nextReason = queuedSyncReason;
      queuedSyncReason = "";
      setTimeout(() => syncWorkbookFromDisk(nextReason).catch(() => {}), 250);
    }
  }
}

async function syncUpstoxAndWorkbook(reason = "Upstox sync") {
  if (upstoxSyncInProgress) {
    return { ok: true, queued: true, message: "Upstox sync is already running." };
  }
  upstoxSyncInProgress = true;
  try {
    const upstox = await syncUpstoxPortfolioData({ forceHistory: /manual|token/i.test(reason) });
    if (upstox.skipped) return { ok: true, skipped: true, upstox };
    if (syncInProgress) {
      queuedSyncReason = reason;
      return {
        ok: true,
        queued: true,
        upstox,
        message: "Upstox data was pulled. Excel update is queued behind the current workbook sync."
      };
    }

    syncInProgress = true;
    try {
      const workbook = await loadWorkbook();
      rebuildDerivedSheets(workbook);
      rebuildSummary(workbook);
      const workbookPath = await getWorkbookPath();
      await writeWorkbookWithRetry(workbook, workbookPath);
      await updateConfig({ lastLocalSync: nowIso(), lastSyncError: "", lastSyncSource: reason });
      const driveFile = await uploadWorkbookToDriveWithRetry();
      return { ok: true, upstox, driveSynced: Boolean(driveFile) };
    } finally {
      syncInProgress = false;
      if (queuedSyncReason) {
        const nextReason = queuedSyncReason;
        queuedSyncReason = "";
        setTimeout(() => syncWorkbookFromDisk(nextReason).catch(() => {}), 250);
      }
    }
  } finally {
    upstoxSyncInProgress = false;
  }
}

async function syncLiveDebtInterestAndWorkbook(reason = "live debt interest refresh") {
  if (workbookWriteInProgress) {
    queuedSyncReason = reason;
    return { ok: true, queued: true };
  }
  if (syncInProgress) {
    queuedSyncReason = reason;
    return { ok: true, queued: true };
  }
  syncInProgress = true;
  try {
    const workbook = await loadWorkbook();
    const debtRows = getManualDebtRows(workbook);
    const hasPendingDebt = debtRows.some((row) => normalizeStatus(row.status) === "Pending");
    if (!hasPendingDebt) return { ok: true, skipped: true };
    syncDebtStatusRows(workbook);
    applyAutomaticChittyCompletion(workbook);
    rebuildDerivedSheets(workbook);
    rebuildSummary(workbook);
    const workbookPath = await getWorkbookPath();
    await writeWorkbookWithRetry(workbook, workbookPath);
    const stat = await fs.stat(workbookPath).catch(() => null);
    if (stat) lastWorkbookMtime = stat.mtimeMs;
    await updateConfig({ lastLocalSync: nowIso(), lastSyncError: "", lastSyncSource: reason });
    const driveFile = await uploadWorkbookToDriveWithRetry();
    return { ok: true, driveSynced: Boolean(driveFile) };
  } catch (error) {
    await updateConfig({ lastSyncError: error.message || "Live debt interest refresh failed." });
    await appendSyncLog(`Live debt interest refresh failed after ${reason}.`, error);
    return { ok: false, error: error.message || "Live debt interest refresh failed." };
  } finally {
    syncInProgress = false;
    if (queuedSyncReason) {
      const nextReason = queuedSyncReason;
      queuedSyncReason = "";
      setTimeout(() => syncWorkbookFromDisk(nextReason).catch(() => {}), 250);
    }
  }
}

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  if (isHostedProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  const origin = req.headers.origin;
  const normalizedOrigin = safeText(origin).replace(/\/+$/, "");
  if (normalizedOrigin && corsAllowedOrigins.has(normalizedOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  } else if (normalizedOrigin && req.method === "OPTIONS") {
    return res.sendStatus(403);
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  return next();
});

app.get("/healthz", async (_req, res) => {
  const [dataStorageAvailable, backupStorageAvailable] = await Promise.all([
    fs.access(dataDir).then(() => true).catch(() => false),
    fs.access(backupStorageDir).then(() => true).catch(() => false)
  ]);
  const healthy = runtimeReady && dataStorageAvailable && backupStorageAvailable;
  res
    .status(healthy ? 200 : 503)
    .setHeader("Cache-Control", "no-store")
    .json({
      ok: healthy,
      status: healthy ? "ready" : "starting_or_degraded",
      service: "smart-fin-365",
      environment: nodeEnvironment,
      uptimeSeconds: Math.floor((Date.now() - serverStartedAt) / 1000),
      dataStorageAvailable,
      backupStorageAvailable,
      timestamp: nowIso()
    });
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public"), {
  setHeaders(res, filePath) {
    if (/\.html?$/i.test(filePath)) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    }
  }
}));

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const settings = await getFinanceAuthSettings();
    const config = await readConfig();
    const validation = validateRegistrationPayload({
      fullName: req.body.fullName,
      email: req.body.email,
      mobile: req.body.mobile,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      termsAccepted: req.body.termsAccepted
    });
    if (validation.errors.length) return res.status(400).json({ error: validation.errors.join(" ") });

    const users = await getRegisteredUsers(config);
    if (registeredUserConflicts(validation, users, settings)) {
      await appendSecurityLog("registration_duplicate_rejected", {
        emailHash: resetHash(validation.email),
        mobileHash: resetHash(validation.mobile)
      });
      return res.status(409).json({ error: "An account already exists for this email or mobile number." });
    }

    const now = nowIso();
    const user = {
      id: crypto.randomUUID(),
      fullName: validation.fullName,
      email: validation.email,
      mobile: validation.mobile,
      username: validation.email,
      role: "User",
      passwordHash: createPasswordHash(req.body.password),
      googleSheet: {
        status: "Pending Google OAuth setup",
        template: "Smart Fin 365",
        sheetId: "",
        createdAt: ""
      },
      createdAt: now,
      lastUpdated: now
    };
    await updateConfig({ financeUsers: [...users, user] });
    await appendSecurityLog("registration_success", {
      usernameHash: resetHash(user.username),
      role: user.role
    });
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    return res.status(201).json({
      ok: true,
      username: user.email,
      role: user.role,
      message: "Account created successfully. Please sign in."
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const identifier = safeText(req.body.username || req.body.identifier);
    const password = String(req.body.password || "");
    const ipKey = resetHash(`${req.ip || req.socket?.remoteAddress || ""}:${identifier.toLowerCase()}`);
    const settings = await getFinanceAuthSettings();
    const config = await readConfig();
    if (!bucketAllowed(`login:${ipKey}`, 6, 15 * 60 * 1000)) {
      await appendSecurityLog("login_rate_limited", { identifierHash: resetHash(identifier) });
      return res.status(429).json({ error: "Too many login attempts. Try again later." });
    }
    if (!settings.enabled) {
      return res.status(503).json({
        error: "Administrator access has not been configured. Open Smart Fin 365 locally on the server computer to complete secure setup."
      });
    }
    const configUsers = await getRegisteredUsers(config);
    const registeredUser = findRegisteredUser(identifier, configUsers);
    const adminLogin = financeIdentifierMatches(identifier, settings);
    const userLogin = registeredUser && verifyPasswordHash(password, registeredUser.passwordHash);
    if ((!adminLogin || !verifyFinancePassword(password, settings)) && !userLogin) {
      await appendSecurityLog("login_failed", { identifierHash: resetHash(identifier) });
      return res.status(401).json({ error: "Invalid username or password." });
    }
    const loginSettings = userLogin
      ? {
          enabled: true,
          username: registeredUser.email || registeredUser.mobile || registeredUser.fullName,
          role: registeredUser.role || "User",
          adminEmail: registeredUser.email,
          adminMobile: registeredUser.mobile
        }
      : settings;
    if (!authOtpEnabled) {
      const secondFactorMethods = enabledSecondFactorMethodsForLogin({
        user: userLogin ? registeredUser : null,
        settings,
        config
      });
      if (secondFactorMethods.length) {
        const challengeId = crypto.randomUUID();
        const expiresAt = Date.now() + 5 * 60 * 1000;
        loginChallenges.set(challengeId, {
          username: loginSettings.username,
          role: loginSettings.role,
          identifierHash: resetHash(identifier),
          secondFactorMethods: secondFactorMethods.map((method) => method.type),
          userId: registeredUser?.id || "",
          attempts: 0,
          createdAt: Date.now(),
          expiresAt,
          used: false
        });
        await appendSecurityLog("login_password_verified_second_factor_required", {
          username: loginSettings.username,
          role: loginSettings.role,
          methods: secondFactorMethods.map((method) => method.type)
        });
        return res.json({
          ok: true,
          requiresSecondFactor: true,
          challengeId,
          username: loginSettings.username,
          role: loginSettings.role,
          secondFactorMethods,
          deliveryMessage: secondFactorMethods.length === 1
            ? `Verify with ${secondFactorMethods[0].label}.`
            : "Choose one enabled authentication method to continue."
        });
      }
      const challengeId = crypto.randomUUID();
      const expiresAt = Date.now() + 5 * 60 * 1000;
      loginChallenges.set(challengeId, {
        username: loginSettings.username,
        role: loginSettings.role,
        identifierHash: resetHash(identifier),
        secondFactorSetupRequired: true,
        secondFactorMethods: ["mpin"],
        userId: registeredUser?.id || "",
        attempts: 0,
        createdAt: Date.now(),
        expiresAt,
        used: false
      });
      await appendSecurityLog("login_password_verified_second_factor_setup_required", {
        username: loginSettings.username,
        role: loginSettings.role
      });
      return res.json({
        ok: true,
        requiresSecondFactorSetup: true,
        challengeId,
        username: loginSettings.username,
        role: loginSettings.role,
        setupMethods: [{ type: "mpin", label: "4-digit MPIN" }],
        deliveryMessage: "Set a 4-digit MPIN to complete secure sign in."
      });
    }
    if (userLogin) return res.status(403).json({ error: "OTP login for standard users is not enabled yet." });
    cleanupLoginChallenges();
    const challengeId = crypto.randomUUID();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    loginChallenges.set(challengeId, {
      username: settings.username,
      role: settings.role,
      identifierHash: resetHash(identifier),
      otpHash: "",
      contact: "",
      channel: "",
      attempts: 0,
      resendAttempts: 0,
      createdAt: Date.now(),
      resendAt: 0,
      expiresAt,
      used: false
    });
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    await appendSecurityLog("login_password_verified_otp_required", {
      username: settings.username,
      identifierHash: resetHash(identifier)
    });
    res.json({
      ok: true,
      requiresOtp: true,
      challengeId,
      username: settings.username,
      role: settings.role,
      deliveryOptions: loginDeliveryOptions(settings),
      deliveryMessage: "Password verified. Select where to receive the OTP."
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/public-status", async (_req, res, next) => {
  try {
    const settings = await getFinanceAuthSettings();
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.json({
      ok: true,
      otpEnabled: authOtpEnabled,
      loginMode: authOtpEnabled ? "password-otp" : "password-second-factor",
      loginConfigured: settings.enabled,
      localBootstrapAvailable: !isHostedProduction && !settings.enabled,
      supabaseAuthConfigured: supabaseAuthConfigured(),
      supabaseUrl: supabaseAuthConfigured() ? supabaseUrl : "",
      supabaseAnonKey: supabaseAuthConfigured() ? supabaseAnonKey : "",
      resetPasswordUrl: `${appUrl}/reset-password`,
      administrator: {
        email: maskedContact(settings.adminEmail),
        mobile: maskedContact(settings.adminMobile),
        role: settings.role
      }
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/local-bootstrap", async (req, res, next) => {
  try {
    if (isHostedProduction || !isLoopbackRequest(req)) return res.sendStatus(404);
    const settings = await getFinanceAuthSettings();
    if (settings.enabled) return res.status(409).json({ error: "Administrator access is already configured." });

    const newPassword = String(req.body.newPassword || "");
    const confirmPassword = String(req.body.confirmPassword || "");
    const strengthErrors = passwordStrengthErrors(newPassword);
    if (strengthErrors.length) return res.status(400).json({ error: strengthErrors.join(" ") });
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "New password and confirm password do not match." });
    }

    await updateConfig({
      financeWebUser: settings.username,
      financeAdminEmail: settings.adminEmail,
      financeAdminMobile: settings.adminMobile,
      financeWebPasswordHash: createPasswordHash(newPassword),
      financeWebPasswordChangedAt: nowIso()
    });
    await writePublicLoginFile(settings.username);
    await appendSecurityLog("local_admin_password_initialized", { username: settings.username, role: settings.role });
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    return res.json({ ok: true, username: settings.username, message: "Administrator password configured. Sign in to continue." });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login/send-otp", async (req, res, next) => {
  try {
    if (!authOtpEnabled) return res.status(404).json({ error: "OTP authentication is disabled." });
    const challengeId = safeText(req.body.challengeId);
    const channel = safeText(req.body.channel);
    const settings = await getFinanceAuthSettings();
    const config = await readConfig();
    const result = await generateAndDeliverLoginOtp(challengeId, channel, settings, config);
    if (result.status) return res.status(result.status).json({ error: result.error, deliveryConfigured: false, maskedDestination: result.maskedDestination });
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login/verify", async (req, res, next) => {
  try {
    if (!authOtpEnabled) return res.status(404).json({ error: "OTP authentication is disabled." });
    cleanupLoginChallenges();
    const challengeId = safeText(req.body.challengeId);
    const otp = safeText(req.body.otp);
    const challenge = loginChallenges.get(challengeId);
    if (!challenge || challenge.used || Date.now() > Number(challenge.expiresAt || 0) || !challenge.otpHash) {
      await appendSecurityLog("login_otp_expired_or_missing", { challengeId });
      return res.status(400).json({ error: "OTP expired. Start login again." });
    }
    if (Number(challenge.attempts || 0) >= 5) {
      loginChallenges.delete(challengeId);
      await appendSecurityLog("login_otp_rate_limited", { challengeId });
      return res.status(429).json({ error: "Too many incorrect OTP attempts. Start login again." });
    }
    if (!safeCompare(resetHash(otp), challenge.otpHash)) {
      challenge.attempts = Number(challenge.attempts || 0) + 1;
      loginChallenges.set(challengeId, challenge);
      await appendSecurityLog("login_otp_rejected", { challengeId, attempts: challenge.attempts });
      return res.status(400).json({ error: "Invalid OTP." });
    }
    challenge.used = true;
    loginChallenges.delete(challengeId);
    const settings = await getFinanceAuthSettings();
    const { token, session } = createFinanceSession(settings);
    res.setHeader("Set-Cookie", sessionCookieValue(token));
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    await appendSecurityLog("login_2fa_success", { username: settings.username, role: settings.role });
    res.json({
      ok: true,
      token,
      username: settings.username,
      role: settings.role,
      idleTimeoutMs: sessionIdleTimeoutMs,
      expiresAt: new Date(session.expiresAt).toISOString()
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login/verify-second-factor", async (req, res, next) => {
  try {
    cleanupLoginChallenges();
    const challengeId = safeText(req.body.challengeId);
    const method = safeText(req.body.method).toLowerCase();
    const code = safeText(req.body.code || req.body.mpin);
    const challenge = loginChallenges.get(challengeId);
    if (!challenge || challenge.used || Date.now() > Number(challenge.expiresAt || 0)) {
      await appendSecurityLog("second_factor_expired_or_missing", { challengeId });
      return res.status(400).json({ error: "Authentication challenge expired. Start login again." });
    }
    if (!Array.isArray(challenge.secondFactorMethods) || !challenge.secondFactorMethods.includes(method)) {
      await appendSecurityLog("second_factor_method_rejected", { challengeId, method });
      return res.status(400).json({ error: "Selected authentication method is not enabled for this user." });
    }
    if (Number(challenge.attempts || 0) >= 5) {
      loginChallenges.delete(challengeId);
      await appendSecurityLog("second_factor_rate_limited", { challengeId, method });
      return res.status(429).json({ error: "Too many incorrect attempts. Start login again." });
    }

    const config = await readConfig();
    const users = await getRegisteredUsers(config);
    const user = challenge.userId ? users.find((item) => item.id === challenge.userId) : null;
    if (method === "mpin") {
      const mpinHash = user?.mpinHash || config.adminMpinHash || config.mpinHash || "";
      if (!mpinHash) return res.status(503).json({ error: "MPIN is enabled but not configured. Set up MPIN in Security Settings." });
      if (!/^\d{4}$/.test(code) || !verifyPasswordHash(code, mpinHash)) {
        challenge.attempts = Number(challenge.attempts || 0) + 1;
        loginChallenges.set(challengeId, challenge);
        await appendSecurityLog("second_factor_mpin_rejected", { challengeId, attempts: challenge.attempts });
        return res.status(400).json({ error: "Invalid MPIN." });
      }
    } else {
      return res.status(501).json({ error: "Biometric verification requires WebAuthn setup before it can be used." });
    }

    challenge.used = true;
    loginChallenges.delete(challengeId);
    const loginSettings = {
      username: challenge.username,
      role: challenge.role || "User",
      adminEmail: user?.email || "",
      adminMobile: user?.mobile || ""
    };
    const { token, session } = createFinanceSession(loginSettings);
    res.setHeader("Set-Cookie", sessionCookieValue(token));
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    await appendSecurityLog("second_factor_success", { username: loginSettings.username, role: loginSettings.role, method });
    res.json({
      ok: true,
      token,
      username: loginSettings.username,
      role: loginSettings.role,
      idleTimeoutMs: sessionIdleTimeoutMs,
      expiresAt: new Date(session.expiresAt).toISOString()
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login/setup-mpin", async (req, res, next) => {
  try {
    cleanupLoginChallenges();
    const challengeId = safeText(req.body.challengeId);
    const newMpin = safeText(req.body.newMpin || req.body.mpin);
    const confirmMpin = safeText(req.body.confirmMpin || req.body.confirm);
    const challenge = loginChallenges.get(challengeId);
    if (!challenge || challenge.used || Date.now() > Number(challenge.expiresAt || 0) || !challenge.secondFactorSetupRequired) {
      await appendSecurityLog("second_factor_setup_expired_or_missing", { challengeId });
      return res.status(400).json({ error: "Authentication setup expired. Start login again." });
    }
    if (Number(challenge.attempts || 0) >= 5) {
      loginChallenges.delete(challengeId);
      await appendSecurityLog("second_factor_setup_rate_limited", { challengeId });
      return res.status(429).json({ error: "Too many setup attempts. Start login again." });
    }
    if (!/^\d{4}$/.test(newMpin)) {
      challenge.attempts = Number(challenge.attempts || 0) + 1;
      loginChallenges.set(challengeId, challenge);
      return res.status(400).json({ error: "MPIN must be exactly 4 digits." });
    }
    if (newMpin !== confirmMpin) {
      challenge.attempts = Number(challenge.attempts || 0) + 1;
      loginChallenges.set(challengeId, challenge);
      return res.status(400).json({ error: "MPIN and confirm MPIN do not match." });
    }

    const config = await readConfig();
    const users = await getRegisteredUsers(config);
    const user = challenge.userId ? users.find((item) => item.id === challenge.userId) : null;
    if (user) {
      const nextUsers = users.map((item) => item.id === user.id
        ? {
          ...item,
          mpinHash: createPasswordHash(newMpin),
          secondFactorMethods: [{ type: "mpin", enabled: true }],
          mpinChangedAt: nowIso(),
          lastUpdated: nowIso()
        }
        : item);
      await updateConfig({ financeUsers: nextUsers });
    } else {
      await updateConfig({
        adminMpinHash: createPasswordHash(newMpin),
        adminMpinChangedAt: nowIso(),
        adminSecondFactorMethods: [{ type: "mpin", enabled: true }]
      });
    }

    challenge.used = true;
    loginChallenges.delete(challengeId);
    const loginSettings = {
      username: challenge.username,
      role: challenge.role || (user?.role || "User"),
      adminEmail: user?.email || "",
      adminMobile: user?.mobile || ""
    };
    const { token, session } = createFinanceSession(loginSettings);
    res.setHeader("Set-Cookie", sessionCookieValue(token));
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    await appendSecurityLog("second_factor_mpin_setup_success", { username: loginSettings.username, role: loginSettings.role });
    res.json({
      ok: true,
      token,
      username: loginSettings.username,
      role: loginSettings.role,
      idleTimeoutMs: sessionIdleTimeoutMs,
      expiresAt: new Date(session.expiresAt).toISOString()
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login/resend", async (req, res, next) => {
  try {
    if (!authOtpEnabled) return res.status(404).json({ error: "OTP authentication is disabled." });
    cleanupLoginChallenges();
    const challengeId = safeText(req.body.challengeId);
    const config = await readConfig();
    const settings = await getFinanceAuthSettings();
    const challenge = loginChallenges.get(challengeId);
    const channel = safeText(req.body.channel || challenge?.channel);
    const result = await generateAndDeliverLoginOtp(challengeId, channel, settings, config);
    if (result.status) return res.status(result.status).json({ error: result.error, deliveryConfigured: false, maskedDestination: result.maskedDestination });
    res.json({ ...result, deliveryMessage: "OTP resent." });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/activity", async (req, res, next) => {
  try {
    const activeSession = getFinanceSessionFromRequest(req);
    if (!activeSession) {
      res.setHeader("Set-Cookie", clearSessionCookieValue());
      return res.status(401).json({ error: "Session expired." });
    }
    const session = renewFinanceSession(activeSession.tokenHash);
    res.setHeader("Set-Cookie", sessionCookieValue(activeSession.token));
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.json({ ok: true, idleTimeoutMs: sessionIdleTimeoutMs, expiresAt: new Date(session.expiresAt).toISOString() });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", async (req, res, next) => {
  try {
    const activeSession = getFinanceSessionFromRequest(req);
    if (activeSession) {
      financeSessions.delete(activeSession.tokenHash);
      await appendSecurityLog("logout", { username: activeSession.session.username });
    }
    res.setHeader("Set-Cookie", clearSessionCookieValue());
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/forgot-password/request", async (req, res, next) => {
  try {
    const identifier = safeText(req.body.identifier || req.body.email);
    if (!supabaseAuthConfigured()) {
      await appendSecurityLog("password_reset_supabase_not_configured", { identifierHash: resetHash(identifier) });
      return res.status(503).json({
        error: "Password recovery email could not be sent because email delivery has not been configured. Please configure an email provider in Settings."
      });
    }
    const config = await readConfig();
    const now = Date.now();
    const attempts = (config.passwordResetAttempts || []).filter((attempt) => now - Number(attempt.at || 0) < 15 * 60 * 1000);
    if (attempts.length >= 5) {
      await appendSecurityLog("password_reset_rate_limited", { identifierHash: resetHash(identifier) });
      return res.status(429).json({ error: "Too many reset attempts. Try again after 15 minutes." });
    }
    try {
      const result = await sendSupabasePasswordRecovery(identifier);
      await updateConfig({ passwordResetAttempts: [...attempts, { at: now, identifier: resetHash(identifier) }] });
      await appendSecurityLog("password_reset_email_requested", { emailHash: resetHash(result.email), redirectTo: result.redirectTo });
      return res.json({
        ok: true,
        deliveryConfigured: true,
        deliveryMessage: "If this email is registered, a password reset link will be sent.",
        resetMode: "supabase-email"
      });
    } catch (error) {
      await updateConfig({ passwordResetAttempts: [...attempts, { at: now, identifier: resetHash(identifier) }] });
      await appendSecurityLog("password_reset_email_failed", {
        identifierHash: resetHash(identifier),
        status: error.status || 500,
        reason: safeText(error.message).slice(0, 120)
      });
      return res.status(error.status || 503).json({
        error: error.status === 400
          ? error.message
          : "Password recovery email could not be sent. Please try again later or contact support."
      });
    }
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/forgot-password/verify", async (req, res, next) => {
  try {
    if (!authOtpEnabled) return res.status(503).json({ error: "Automatic password recovery is temporarily unavailable. Please contact the administrator." });
    const resetId = safeText(req.body.resetId);
    const otp = safeText(req.body.otp);
    const config = await readConfig();
    const requests = config.passwordResetRequests || {};
    const request = requests[resetId];
    if (!request || Date.now() > Number(request.expiresAt || 0)) {
      await appendSecurityLog("password_reset_verify_expired", { resetId });
      return res.status(400).json({ error: "Reset code expired. Request a new code." });
    }
    if (Number(request.attempts || 0) >= 5) {
      await appendSecurityLog("password_reset_verify_rate_limited", { resetId });
      return res.status(429).json({ error: "Too many incorrect codes. Request a new reset code." });
    }
    if (!safeCompare(resetHash(otp), request.otpHash)) {
      request.attempts = Number(request.attempts || 0) + 1;
      requests[resetId] = request;
      await updateConfig({ passwordResetRequests: requests });
      await appendSecurityLog("password_reset_otp_rejected", { resetId, attempts: request.attempts });
      return res.status(400).json({ error: "Incorrect reset code." });
    }
    request.verified = true;
    request.verifiedAt = nowIso();
    requests[resetId] = request;
    await updateConfig({ passwordResetRequests: requests });
    await appendSecurityLog("password_reset_verified", { resetId });
    res.json({ ok: true, resetId });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/forgot-password/complete", async (req, res, next) => {
  try {
    if (!authOtpEnabled) return res.status(503).json({ error: "Automatic password recovery is temporarily unavailable. Please contact the administrator." });
    const resetId = safeText(req.body.resetId);
    const newPassword = String(req.body.newPassword || "");
    const confirmPassword = String(req.body.confirmPassword || "");
    const config = await readConfig();
    const requests = config.passwordResetRequests || {};
    const request = requests[resetId];
    if (!request || !request.verified || Date.now() > Number(request.expiresAt || 0)) {
      await appendSecurityLog("password_reset_complete_rejected", { resetId });
      return res.status(400).json({ error: "Reset verification expired. Request a new code." });
    }
    const strengthErrors = passwordStrengthErrors(newPassword);
    if (strengthErrors.length) return res.status(400).json({ error: strengthErrors.join(" ") });
    if (newPassword !== confirmPassword) return res.status(400).json({ error: "New password and confirm password do not match." });

    const settings = await getFinanceAuthSettings();
    if (verifyFinancePassword(newPassword, settings)) {
      return res.status(400).json({ error: "New password must be different from the current password." });
    }
    delete requests[resetId];
    financeSessions.clear();
    await updateConfig({
      financeWebUser: settings.username,
      financeWebPasswordHash: createPasswordHash(newPassword),
      financeWebPasswordChangedAt: nowIso(),
      passwordResetRequests: requests
    });
    await appendSecurityLog("password_reset_completed", { resetId, username: settings.username });
    res.json({ ok: true, username: settings.username, changedAt: nowIso() });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/change-password-public", async (req, res, next) => {
  try {
    const identifier = safeText(req.body.identifier || req.body.username);
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");
    const confirmPassword = String(req.body.confirmPassword || "");
    const ipKey = resetHash(`${req.ip || req.socket?.remoteAddress || ""}:${identifier.toLowerCase()}`);

    if (!bucketAllowed(`change-password:${ipKey}`, 5, 15 * 60 * 1000)) {
      await appendSecurityLog("password_change_rate_limited", { identifierHash: resetHash(identifier) });
      return res.status(429).json({ error: "Too many password change attempts. Try again later." });
    }
    if (!identifier) return res.status(400).json({ error: "Enter the registered email or mobile number." });
    if (!currentPassword) return res.status(400).json({ error: "Enter the current password." });
    const strengthErrors = passwordStrengthErrors(newPassword);
    if (strengthErrors.length) return res.status(400).json({ error: strengthErrors.join(" ") });
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "New password and confirm password do not match." });
    }

    const settings = await getFinanceAuthSettings();
    const config = await readConfig();
    const users = await getRegisteredUsers(config);
    const registeredUser = findRegisteredUser(identifier, users);
    const isAdmin = financeIdentifierMatches(identifier, settings);

    if (isAdmin) {
      if (!verifyFinancePassword(currentPassword, settings)) {
        await appendSecurityLog("password_change_rejected", { identifierHash: resetHash(identifier), role: settings.role });
        return res.status(400).json({ error: "Current password is incorrect." });
      }
      if (verifyFinancePassword(newPassword, settings)) {
        return res.status(400).json({ error: "New password must be different from the current password." });
      }
      await updateConfig({
        financeWebUser: settings.username,
        financeWebPasswordHash: createPasswordHash(newPassword),
        financeWebPasswordChangedAt: nowIso()
      });
      await appendSecurityLog("password_changed_from_login", { username: settings.username, role: settings.role });
      await writePublicLoginFile(settings.username);
      financeSessions.clear();
      res.setHeader("Set-Cookie", clearSessionCookieValue());
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      return res.json({ ok: true, username: settings.username, changedAt: nowIso(), message: "Password updated. Please sign in." });
    }

    if (!registeredUser || !verifyPasswordHash(currentPassword, registeredUser.passwordHash)) {
      await appendSecurityLog("password_change_rejected", { identifierHash: resetHash(identifier), role: "User" });
      return res.status(400).json({ error: "Current password is incorrect." });
    }
    if (verifyPasswordHash(newPassword, registeredUser.passwordHash)) {
      return res.status(400).json({ error: "New password must be different from the current password." });
    }
    const nextUsers = users.map((user) => user.id === registeredUser.id
      ? { ...user, passwordHash: createPasswordHash(newPassword), passwordChangedAt: nowIso(), lastUpdated: nowIso() }
      : user);
    await updateConfig({ financeUsers: nextUsers });
    await appendSecurityLog("password_changed_from_login", { username: registeredUser.email || registeredUser.mobile, role: registeredUser.role || "User" });
    financeSessions.clear();
    res.setHeader("Set-Cookie", clearSessionCookieValue());
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    return res.json({ ok: true, username: registeredUser.email || registeredUser.mobile, changedAt: nowIso(), message: "Password updated. Please sign in." });
  } catch (error) {
    next(error);
  }
});

app.use("/api", requireFinanceAuth);
app.use("/download", requireFinanceAuth);

app.get("/api/auth/check", async (_req, res, next) => {
  try {
    const settings = await getFinanceAuthSettings();
    res.json({
      ok: true,
      username: _req.financeAuth?.username || settings.username,
      role: _req.financeAuth?.role || settings.role,
      source: settings.source
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/supabase/status", async (_req, res, next) => {
  try {
    const config = await readConfig();
    res.json({
      ok: true,
      ...supabaseRuntimeStatus(config),
      rlsEnabledRequired: true,
      twoWaySyncMode: "delta-sync",
      activeUserIsolation: "RLS owner policies in Supabase; local admin workbook remains admin-only"
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/supabase/schema-blueprint", async (_req, res, next) => {
  try {
    res.json({
      ok: true,
      templateSource: "Existing Google Sheets / Excel workbook template",
      worksheets: masterSpecSheetDefinitions.map((definition) => ({
        worksheetName: definition.name,
        tableStrategy: "finance_records row_data + worksheet_definitions columns",
        columns: definition.columns.map((column) => ({
          header: column.header,
          key: column.key,
          money: definition.moneyKeys.includes(column.key)
        }))
      }))
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/users", async (_req, res, next) => {
  try {
    if (_req.financeAuth?.role !== "Administrator") return res.status(403).json({ error: "Administrator access required." });
    const config = await readConfig();
    const users = await getRegisteredUsers(config);
    res.json({
      ok: true,
      users: users.map((user) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        mobile: maskedContact(user.mobile),
        role: user.role || "User",
        status: user.status || "Active",
        subscription: user.subscription || "Standard",
        googleSheet: user.googleSheet || {},
        createdAt: user.createdAt,
        lastUpdated: user.lastUpdated
      }))
    });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/users/:id", async (req, res, next) => {
  try {
    if (req.financeAuth?.role !== "Administrator") return res.status(403).json({ error: "Administrator access required." });
    const allowedRoles = new Set(["User", "Administrator"]);
    const allowedStatuses = new Set(["Active", "Disabled"]);
    const config = await readConfig();
    const users = await getRegisteredUsers(config);
    const target = users.find((user) => user.id === req.params.id);
    if (!target) return res.status(404).json({ error: "User not found." });
    const nextUsers = users.map((user) => {
      if (user.id !== target.id) return user;
      const nextUser = { ...user, lastUpdated: nowIso() };
      if (req.body.role && allowedRoles.has(req.body.role)) nextUser.role = req.body.role;
      if (req.body.status && allowedStatuses.has(req.body.status)) nextUser.status = req.body.status;
      if (req.body.subscription) nextUser.subscription = safeText(req.body.subscription);
      if (req.body.permissions && typeof req.body.permissions === "object") nextUser.permissions = req.body.permissions;
      return nextUser;
    });
    await updateConfig({ financeUsers: nextUsers });
    await appendSecurityLog("admin_user_updated", { admin: req.financeAuth.username, userId: target.id });
    res.json({ ok: true, user: nextUsers.find((user) => user.id === target.id) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/users/:id", async (req, res, next) => {
  try {
    if (req.financeAuth?.role !== "Administrator") return res.status(403).json({ error: "Administrator access required." });
    const config = await readConfig();
    const users = await getRegisteredUsers(config);
    const target = users.find((user) => user.id === req.params.id);
    if (!target) return res.status(404).json({ error: "User not found." });
    await updateConfig({ financeUsers: users.filter((user) => user.id !== target.id) });
    await appendSecurityLog("admin_user_deleted", { admin: req.financeAuth.username, userId: target.id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

function buildOtpDeliveryStatus(config = {}) {
  const emailReady = Boolean(process.env.OTP_SMTP_HOST && process.env.OTP_SMTP_USER && process.env.OTP_SMTP_PASS && process.env.OTP_EMAIL_FROM);
  const smsReady = Boolean(process.env.OTP_SMS_URL);
  const emailEnabled = process.env.OTP_EMAIL_ENABLED !== "false";
  const smsEnabled = process.env.OTP_SMS_ENABLED !== "false";
  return {
    otpEnabled: authOtpEnabled,
    administrator: {
      email: maskedContact(config.financeAdminEmail || process.env.FINANCE_ADMIN_EMAIL || "govardhan.reddy70@gmail.com"),
      mobile: maskedContact(config.financeAdminMobile || process.env.FINANCE_ADMIN_MOBILE || "9739564234"),
      role: config.financeAdminRole || "Administrator"
    },
    email: {
      enabled: emailEnabled,
      status: !emailEnabled ? "Disabled" : emailReady ? "Configured" : "Not configured",
      senderEmail: process.env.OTP_EMAIL_FROM ? maskedContact(process.env.OTP_EMAIL_FROM) : "",
      senderName: process.env.OTP_EMAIL_FROM_NAME || ""
    },
    sms: {
      enabled: smsEnabled,
      status: !smsEnabled ? "Disabled" : smsReady ? "Configured" : "Not configured",
      provider: process.env.OTP_SMS_PROVIDER_NAME || (smsReady ? "HTTP SMS provider" : "")
    },
    lastSuccessfulDelivery: config.otpLastSuccess || "",
    lastSuccessfulChannel: config.otpLastSuccessChannel || "",
    lastDeliveryFailure: config.otpLastFailure || "",
    lastFailureChannel: config.otpLastFailureChannel || "",
    maskedErrorDetails: config.otpLastFailureMasked ? `${config.otpLastFailureMasked.slice(0, 80)}${config.otpLastFailureMasked.length > 80 ? "..." : ""}` : ""
  };
}

app.get("/api/otp-delivery/status", async (_req, res, next) => {
  try {
    res.json(buildOtpDeliveryStatus(await readConfig()));
  } catch (error) {
    next(error);
  }
});

app.get("/api/security-settings", async (_req, res, next) => {
  try {
    const config = await readConfig();
    const isAdmin = _req.financeAuth?.role === "Administrator";
    const users = await getRegisteredUsers(config);
    const user = isAdmin ? null : findRegisteredUser(_req.financeAuth?.username, users);
    const requestedMethods = isAdmin
      ? normalizeSecondFactorMethods(config.adminSecondFactorMethods || config.secondFactorMethods)
      : normalizeSecondFactorMethods(user?.secondFactorMethods || user?.authMethods);
    const usableMethods = isAdmin
      ? enabledSecondFactorMethodsForLogin({ config })
      : enabledSecondFactorMethodsForLogin({ user, config });
    res.json({
      ok: true,
      requestedMethods,
      usableMethods,
      mpinConfigured: isAdmin ? Boolean(config.adminMpinHash || config.mpinHash) : Boolean(user?.mpinHash),
      biometricConfigured: {
        fingerprint: isAdmin ? Boolean(config.adminWebAuthnCredentials?.fingerprint?.length) : Boolean(user?.webAuthnCredentials?.fingerprint?.length),
        face: isAdmin ? Boolean(config.adminWebAuthnCredentials?.face?.length) : Boolean(user?.webAuthnCredentials?.face?.length)
      }
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/security-settings", async (req, res, next) => {
  try {
    const methods = normalizeSecondFactorMethods(req.body.methods);
    const methodTypes = new Set(methods.map((method) => method.type));
    const newMpin = safeText(req.body.newMpin);
    const confirmMpin = safeText(req.body.confirmMpin);
    const config = await readConfig();
    const isAdmin = req.financeAuth?.role === "Administrator";
    const users = await getRegisteredUsers(config);
    const user = isAdmin ? null : findRegisteredUser(req.financeAuth?.username, users);

    if (methodTypes.has("mpin")) {
      if (newMpin || confirmMpin) {
        if (!/^\d{4}$/.test(newMpin)) return res.status(400).json({ error: "MPIN must be exactly 4 digits." });
        if (newMpin !== confirmMpin) return res.status(400).json({ error: "New MPIN and confirm MPIN do not match." });
      } else if (isAdmin ? (!config.adminMpinHash && !config.mpinHash) : !user?.mpinHash) {
        return res.status(400).json({ error: "Set a 4-digit MPIN before enabling MPIN authentication." });
      }
    }

    if (methodTypes.has("fingerprint") && !(isAdmin ? config.adminWebAuthnCredentials?.fingerprint?.length : user?.webAuthnCredentials?.fingerprint?.length)) {
      return res.status(400).json({ error: "Fingerprint requires WebAuthn setup before it can be enabled." });
    }
    if (methodTypes.has("face") && !(isAdmin ? config.adminWebAuthnCredentials?.face?.length : user?.webAuthnCredentials?.face?.length)) {
      return res.status(400).json({ error: "Face Authentication requires WebAuthn setup before it can be enabled." });
    }

    if (isAdmin) {
      const patch = { adminSecondFactorMethods: methods };
      if (methodTypes.has("mpin") && newMpin) {
        patch.adminMpinHash = createPasswordHash(newMpin);
        patch.adminMpinChangedAt = nowIso();
      }
      await updateConfig(patch);
    } else {
      if (!user) return res.status(404).json({ error: "User not found." });
      const nextUsers = users.map((item) => {
        if (item.id !== user.id) return item;
        return {
          ...item,
          secondFactorMethods: methods,
          mpinHash: methodTypes.has("mpin") && newMpin ? createPasswordHash(newMpin) : item.mpinHash,
          mpinChangedAt: methodTypes.has("mpin") && newMpin ? nowIso() : item.mpinChangedAt,
          lastUpdated: nowIso()
        };
      });
      await updateConfig({ financeUsers: nextUsers });
    }
    await appendSecurityLog("second_factor_settings_updated", {
      username: req.financeAuth?.username || "admin",
      methods: methods.map((method) => method.type),
      mpinChanged: Boolean(newMpin)
    });
    const nextConfig = await readConfig();
    const nextUsers = await getRegisteredUsers(nextConfig);
    const nextUser = isAdmin ? null : findRegisteredUser(req.financeAuth?.username, nextUsers);
    res.json({
      ok: true,
      requestedMethods: isAdmin
        ? normalizeSecondFactorMethods(nextConfig.adminSecondFactorMethods || nextConfig.secondFactorMethods)
        : normalizeSecondFactorMethods(nextUser?.secondFactorMethods || nextUser?.authMethods),
      usableMethods: isAdmin
        ? enabledSecondFactorMethodsForLogin({ config: nextConfig })
        : enabledSecondFactorMethodsForLogin({ user: nextUser, config: nextConfig }),
      mpinConfigured: isAdmin ? Boolean(nextConfig.adminMpinHash || nextConfig.mpinHash) : Boolean(nextUser?.mpinHash)
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/otp-delivery/test", async (req, res, next) => {
  try {
    const channel = safeText(req.body.channel);
    const settings = await getFinanceAuthSettings();
    const config = await readConfig();
    const destination = contactForOtpChannel(settings, channel);
    if (!destination) return res.status(400).json({ error: "Selected OTP channel is unavailable." });
    const otp = String(crypto.randomInt(100000, 999999));
    const delivery = await sendOtpToRegisteredContact({ config, identifier: destination, otp, purpose: "login" });
    await appendSecurityLog("otp_test_delivery_attempted", {
      channel,
      destinationHash: resetHash(destination),
      deliverySent: delivery.sent
    });
    if (!delivery.sent) {
      return res.status(503).json({
        error: "OTP service is temporarily unavailable. Please try again later or contact the administrator.",
        status: buildOtpDeliveryStatus(await readConfig())
      });
    }
    res.json({ ok: true, channel, maskedDestination: maskedContact(destination), status: buildOtpDeliveryStatus(await readConfig()) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/change-password", async (req, res, next) => {
  try {
    const settings = await getFinanceAuthSettings();
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (!currentPassword) return res.status(400).json({ error: "Enter the current password." });
    if (!verifyFinancePassword(currentPassword, settings)) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }
    const strengthErrors = passwordStrengthErrors(newPassword);
    if (strengthErrors.length) return res.status(400).json({ error: strengthErrors.join(" ") });
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "New password and confirm password do not match." });
    }
    if (verifyFinancePassword(newPassword, settings)) {
      return res.status(400).json({ error: "New password must be different from the current password." });
    }

    await updateConfig({
      financeWebUser: settings.username,
      financeWebPasswordHash: createPasswordHash(newPassword),
      financeWebPasswordChangedAt: nowIso()
    });
    financeSessions.clear();
    await appendSecurityLog("password_changed_from_settings", { username: settings.username });
    await writePublicLoginFile(settings.username);

    res.json({
      ok: true,
      username: settings.username,
      changedAt: nowIso()
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/entries", async (_req, res, next) => {
  try {
    const workbook = await loadWorkbook();
    const records = getDisplayRecords(workbook);
    res.json(records);
  } catch (error) {
    next(error);
  }
});

app.get("/api/summary", async (_req, res, next) => {
  try {
    const workbook = await loadWorkbook();
    const records = getAllRecords(workbook);
    const debtRecords = getManualDebtRows(workbook);
    const debtSource = debtRecords.length ? debtRecords : records;
    const totals = getTotals(records, getManualChittyOverrides(workbook), debtSource);
    Object.assign(totals, getLoanTotals(getLoanRecords(workbook)));
    Object.assign(totals, getTradingTotals(getTradingRecords(workbook), readCachedUpstoxTrades()));
    res.json({
      totals,
      debtInterest: getDebtInterestSummary(debtSource),
      sync: await getDriveSyncStatus()
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/family-dashboard", async (_req, res, next) => {
  try {
    const workbook = await loadWorkbook();
    res.json(buildFamilyDashboard(workbook));
  } catch (error) {
    next(error);
  }
});

app.get("/api/reports-analytics", async (_req, res, next) => {
  try {
    const workbook = await loadWorkbook();
    res.json(buildReportsAnalytics(workbook));
  } catch (error) {
    next(error);
  }
});

app.get("/api/net-worth", async (_req, res, next) => {
  try {
    const workbook = await loadWorkbook();
    res.json(buildNetWorthReport(workbook));
  } catch (error) {
    next(error);
  }
});

app.get("/api/backups", async (_req, res, next) => {
  try {
    if (!isAdminRole(_req.financeAuth?.role)) return res.status(403).json({ error: "Admin or Super Admin access is required." });
    res.json({ backups: await listWorkbookBackups() });
  } catch (error) {
    next(error);
  }
});

app.get("/api/backups/:id", async (req, res, next) => {
  try {
    if (!isAdminRole(req.financeAuth?.role)) return res.status(403).json({ error: "Admin or Super Admin access is required." });
    const backup = await findWorkbookBackupById(req.params.id);
    res.json({ backup: publicBackupRecord(backup) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/backups/:id/validate", async (req, res, next) => {
  try {
    if (!isAdminRole(req.financeAuth?.role)) return res.status(403).json({ error: "Admin or Super Admin access is required." });
    const backup = await validateWorkbookBackup(req.params.id, req.financeAuth.username);
    await appendSecurityLog("backup_validated", { actor: req.financeAuth.username, backupId: backup.backupId, checksumStatus: backup.checksumStatus });
    res.json({ ok: true, backup: publicBackupRecord(backup) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/backups/:id/download", async (req, res, next) => {
  try {
    if (!isAdminRole(req.financeAuth?.role)) return res.status(403).json({ error: "Admin or Super Admin access is required." });
    const backup = await findWorkbookBackupById(req.params.id);
    res.setHeader("Cache-Control", "no-store, private");
    res.download(backup.internalPath, backup.backupName);
  } catch (error) {
    next(error);
  }
});

app.post("/api/backups/:id/restore-chain", async (req, res, next) => {
  try {
    if (!isAdminRole(req.financeAuth?.role)) return res.status(403).json({ error: "Admin or Super Admin access is required." });
    res.json({ ok: true, plan: await buildBackupRestoreChain(req.params.id) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/backups/:id/restore", async (req, res, next) => {
  try {
    if (!isAdminRole(req.financeAuth?.role)) return res.status(403).json({ error: "Admin or Super Admin access is required." });
    const result = await restoreFullWorkbookBackup({
      backupId: req.params.id,
      actor: req.financeAuth.username,
      confirmation: req.body?.confirmation,
      scope: req.body?.scope
    });
    res.json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
});

app.get("/api/tax-advisory", async (_req, res, next) => {
  try {
    const config = await readConfig();
    const workbook = await loadWorkbook();
    const dashboard = buildFamilyDashboard(workbook);
    const official = config.taxOfficialRules || null;
    const estimate = buildTaxPlannerEstimate(workbook, dashboard, config);
    res.json({
      financialYear: config.taxFinancialYear || "",
      ruleLastUpdated: official?.lastUpdated || "",
      officialSource: official?.source || "",
      hasCurrentOfficialRules: Boolean(official?.lastUpdated && official?.source),
      oldRegimeEstimate: estimate.oldRegimeEstimate,
      newRegimeEstimate: estimate.newRegimeEstimate,
      recommendedRegime: estimate.recommendedRegime,
      estimatedTaxSaved: estimate.estimatedTaxSaved,
      detectedExemptions: estimate.detectedExemptions,
      recommendations: [
        `Estimated ${estimate.recommendedRegime} is currently favourable based on available Smart Fin 365 records.`
      ],
      recordBasis: {
        income: estimate.annualIncome,
        investments: dashboard.sections.tradingPortfolio?.totalInvestedAmount || 0,
        eligibleExpenses: dashboard.sections.expenses?.totalMonthlyExpenses || 0,
        insurance: sumRows(recordsForReport(workbook, "Insurance Manager"), ["premiumAmount"])
      },
      message: official?.lastUpdated && official?.source
        ? "Tax calculations are estimates and require professional verification."
        : "Tax calculations use built-in estimate slabs because official tax-rule metadata is not configured. Verify before filing."
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/support-tickets", async (req, res, next) => {
  try {
    const ticket = {
      id: `SFIN-${Date.now()}`,
      name: safeText(req.body.name),
      email: safeText(req.body.email).toLowerCase(),
      mobile: safeText(req.body.mobile),
      issueType: safeText(req.body.issueType),
      priority: safeText(req.body.priority) || "Normal",
      description: safeText(req.body.description),
      attachmentName: safeText(req.body.attachmentName),
      attachmentSize: money(req.body.attachmentSize),
      status: "Open",
      supportEmail: "support@smartfin365.com",
      createdAt: nowIso(),
      createdBy: req.financeAuth?.username || "authenticated-user"
    };
    if (!ticket.name || !ticket.email || !ticket.mobile || !ticket.issueType || !ticket.description) {
      return res.status(400).json({ error: "Complete Name, Email, Mobile, Issue Type and Description before creating a support ticket." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ticket.email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    const config = await readConfig();
    const supportTickets = Array.isArray(config.supportTickets) ? config.supportTickets : [];
    await updateConfig({ supportTickets: [ticket, ...supportTickets].slice(0, 500) });
    await appendSecurityLog("support_ticket_created", { ticketId: ticket.id, issueType: ticket.issueType, priority: ticket.priority });
    res.json({ ok: true, ticket, supportEmail: "support@smartfin365.com" });
  } catch (error) {
    next(error);
  }
});

app.get("/api/subscription/plans", (_req, res) => {
  res.json({
    plans: [
      {
        id: "free",
        name: "Free Plan",
        priceMonthly: 0,
        priceYearly: 0,
        modules: ["Basic records", "Local workbook sync", "Google Sheets sync when configured"]
      },
      {
        id: "premium",
        name: "Premium",
        priceMonthly: 100,
        priceYearly: 1000,
        currency: "INR",
        modules: [
          "Advanced Reports",
          "Reports & Analytics",
          "AI",
          "Backup & Restore",
          "Net Worth",
          "Export Centre",
          "Family Dashboard"
        ]
      }
    ],
    note: "Subscription enforcement is server-side and must be connected to the production payment provider before public billing."
  });
});

app.get("/api/party-suggestions", async (_req, res, next) => {
  try {
    const workbook = await loadWorkbook();
    res.json(getPartySuggestions(getAllRecords(workbook)));
  } catch (error) {
    next(error);
  }
});

app.get("/api/yearly-growth", async (_req, res, next) => {
  try {
    const workbook = await loadWorkbook();
    const records = getAllRecords(workbook);
    const debtRecords = getManualDebtRows(workbook);
    res.json(getYearlyGrowth(records, getManualChittyOverrides(workbook), getLoanRecords(workbook), debtRecords.length ? debtRecords : records, getTradingRecords(workbook), readCachedUpstoxTrades()));
  } catch (error) {
    next(error);
  }
});

app.get("/api/modules", async (_req, res, next) => {
  try {
    res.json({
      modules: Object.entries(moduleSheetBySlug).map(([slug, sheet]) => {
        const definition = moduleDefinitionBySheet(sheet);
        return {
          slug,
          sheet,
          columns: definition?.columns || [],
          moneyKeys: definition?.moneyKeys || []
        };
      })
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/modules/:slug", async (req, res, next) => {
  try {
    const workbook = await loadWorkbook();
    const payload = getModulePayload(workbook, req.params.slug);
    if (!payload) return res.status(404).json({ error: "This module was not found." });
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

app.post("/api/modules/:slug", async (req, res, next) => {
  try {
    const definition = moduleDefinitionBySlug(req.params.slug);
    if (!definition) return res.status(404).json({ error: "This module was not found." });
    const workbook = await loadWorkbook();
    const sheet = ensureWorkbookSheetDefinition(workbook, definition);

    if (definition.name === "Goal Contributions") {
      const goals = getModuleRecords(workbook, "Goals");
      const goal = goals.find((item) =>
        safeText(item.goalId) === safeText(req.body.goalId) ||
        safeText(item.id) === safeText(req.body.goalId) ||
        safeText(item.goalName).toLowerCase() === safeText(req.body.goalName).toLowerCase()
      );
      if (!goal) return res.status(400).json({ error: "Choose an existing goal before adding a contribution." });
      req.body.goalId = goal.goalId || goal.id;
      req.body.goalName = goal.goalName;
    }

    const record = normalizeModuleRecord(definition.name, req.body);
    if (definition.name === "Goal Categories" && !record.categoryName) {
      return res.status(400).json({ error: "Category Name is required." });
    }
    if (definition.name === "Business Profile" && !record.businessName) {
      return res.status(400).json({ error: "Business Name is required." });
    }
    if (definition.name === "Goals" && !record.goalName) {
      return res.status(400).json({ error: "Goal Name is required." });
    }

    const newRow = sheet.addRow([]);
    writeModuleRow(newRow, definition, record);

    if (definition.name === "Goal Contributions") {
      updateGoalByDelta(workbook, record.goalId, record.amount);
      upsertGoalContributionBankCash(workbook, record);
    }

    const driveFile = await persistWorkbook(workbook);
    await updateConfig({ lastLocalSync: nowIso(), lastSyncError: "", lastSyncSource: `${definition.name} create` });
    res.status(201).json({ ok: true, record, module: getModulePayload(workbook, req.params.slug), driveSynced: Boolean(driveFile) });
  } catch (error) {
    next(error);
  }
});

app.put("/api/modules/:slug/:id", async (req, res, next) => {
  try {
    const definition = moduleDefinitionBySlug(req.params.slug);
    if (!definition) return res.status(404).json({ error: "This module was not found." });
    const workbook = await loadWorkbook();
    const sheet = ensureWorkbookSheetDefinition(workbook, definition);
    const row = findModuleRow(sheet, definition, req.params.id);
    if (!row) return res.status(404).json({ error: "This record was not found." });
    const existing = moduleRowToRecord(row, definition);

    if (definition.name === "Goal Categories") {
      const nextCategoryName = safeText(req.body.categoryName || existing.categoryName);
      if (nextCategoryName.toLowerCase() !== safeText(existing.categoryName).toLowerCase() && categoryIsUsed(workbook, existing.categoryName)) {
        return res.status(400).json({ error: "This category is already used by a goal. Add a new category instead of renaming it." });
      }
    }

    if (definition.name === "Goal Contributions") {
      const goals = getModuleRecords(workbook, "Goals");
      const goal = goals.find((item) =>
        safeText(item.goalId) === safeText(req.body.goalId || existing.goalId) ||
        safeText(item.id) === safeText(req.body.goalId || existing.goalId) ||
        safeText(item.goalName).toLowerCase() === safeText(req.body.goalName || existing.goalName).toLowerCase()
      );
      if (!goal) return res.status(400).json({ error: "Choose an existing goal before updating a contribution." });
      req.body.goalId = goal.goalId || goal.id;
      req.body.goalName = goal.goalName;
    }

    const record = normalizeModuleRecord(definition.name, { ...existing, ...req.body, id: existing.id }, existing);
    writeModuleRow(row, definition, record);

    if (definition.name === "Goal Contributions") {
      updateGoalByDelta(workbook, record.goalId, money(record.amount) - money(existing.amount));
      upsertGoalContributionBankCash(workbook, record);
    }

    const driveFile = await persistWorkbook(workbook);
    await updateConfig({ lastLocalSync: nowIso(), lastSyncError: "", lastSyncSource: `${definition.name} update` });
    res.json({ ok: true, record, module: getModulePayload(workbook, req.params.slug), driveSynced: Boolean(driveFile) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/modules/:slug/:id", async (req, res, next) => {
  try {
    const definition = moduleDefinitionBySlug(req.params.slug);
    if (!definition) return res.status(404).json({ error: "This module was not found." });
    const workbook = await loadWorkbook();
    const sheet = ensureWorkbookSheetDefinition(workbook, definition);
    const row = findModuleRow(sheet, definition, req.params.id);
    if (!row) return res.status(404).json({ error: "This record was not found." });
    const existing = moduleRowToRecord(row, definition);

    if (definition.name === "Goal Categories") {
      if (safeText(existing.defaultCategory).toLowerCase() === "yes") {
        return res.status(400).json({ error: "Default goal categories cannot be deleted. Deactivate them instead." });
      }
      if (categoryIsUsed(workbook, existing.categoryName)) {
        return res.status(400).json({ error: "This category is already used by a goal and cannot be deleted." });
      }
    }

    if (definition.name === "Goal Contributions") {
      updateGoalByDelta(workbook, existing.goalId, -money(existing.amount));
      deleteLinkedBankCashRecord(workbook, existing.id);
    }

    sheet.spliceRows(row.number, 1);
    ensureWorkbookSheetDefinition(workbook, definition);
    const driveFile = await persistWorkbook(workbook);
    await updateConfig({ lastLocalSync: nowIso(), lastSyncError: "", lastSyncSource: `${definition.name} delete` });
    res.json({ ok: true, id: req.params.id, module: getModulePayload(workbook, req.params.slug), driveSynced: Boolean(driveFile) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/entries", async (req, res, next) => {
  try {
    validateEntryPayload(req.body);

    const workbook = await loadWorkbook();
    const entries = workbook.getWorksheet("Entries");
    const id = `FIN-${Date.now()}`;
    entries.addRow(rowFromEntryPayload({ ...req.body, id }));
    styleSheet(entries);
    const driveFile = await persistWorkbook(workbook);
    res.status(201).json({ ok: true, id, driveSynced: Boolean(driveFile) });
  } catch (error) {
    next(error);
  }
});

app.put("/api/entries/:id", async (req, res, next) => {
  try {
    if (safeText(req.params.id).startsWith("CHITTY-SUMMARY-")) {
      const workbook = await loadWorkbook();
      const update = upsertChittyMonthlyPayment(workbook, req.params.id, req.body);
      const entries = workbook.getWorksheet("Entries");
      if (entries) styleSheet(entries);
      const driveFile = await persistWorkbook(workbook);
      return res.json({ ok: true, id: req.params.id, chitty: update, driveSynced: Boolean(driveFile) });
    }

    validateEntryPayload(req.body);
    const workbook = await loadWorkbook();
    if (updateDebtSheetRowFromPayload(workbook, req.params.id, req.body)) {
      const driveFile = await persistWorkbook(workbook);
      return res.json({ ok: true, id: req.params.id, driveSynced: Boolean(driveFile), sheet: "Debt" });
    }
    const entries = workbook.getWorksheet("Entries");
    const row = findEntryRow(entries, req.params.id);
    if (!row) return res.status(404).json({ error: "This entry was not found in the Entries sheet." });

    const existing = rowToEntry(row);
    writeEntryRow(row, rowFromEntryPayload({ ...req.body, id: existing.id }, existing));
    styleSheet(entries);
    const driveFile = await persistWorkbook(workbook);
    res.json({ ok: true, id: existing.id, driveSynced: Boolean(driveFile) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/entries/:id", async (req, res, next) => {
  try {
    const workbook = await loadWorkbook();
    if (safeText(req.params.id).startsWith("CHITTY-SUMMARY-")) {
      const party = deleteChittyGroup(workbook, req.params.id);
      const entries = workbook.getWorksheet("Entries");
      if (entries) styleSheet(entries);
      const driveFile = await persistWorkbook(workbook);
      return res.json({ ok: true, id: req.params.id, party, driveSynced: Boolean(driveFile) });
    }

    const entries = workbook.getWorksheet("Entries");
    const row = findEntryRow(entries, req.params.id);
    if (!row) {
      const debtRow = findDebtSheetRowById(workbook, req.params.id);
      if (!debtRow) return res.status(404).json({ error: "This entry was not found in the Entries or Lent sheet." });
      debtRow.sheet.spliceRows(debtRow.row.number, 1);
      const driveFile = await persistWorkbook(workbook);
      return res.json({ ok: true, id: req.params.id, driveSynced: Boolean(driveFile), sheet: "Debt" });
    }

    entries.spliceRows(row.number, 1);
    styleSheet(entries);
    const driveFile = await persistWorkbook(workbook);
    res.json({ ok: true, id: req.params.id, driveSynced: Boolean(driveFile) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/properties", async (_req, res, next) => {
  try {
    const workbook = await loadWorkbook();
    res.json(getPropertyRecords(workbook));
  } catch (error) {
    next(error);
  }
});

app.post("/api/properties", async (req, res, next) => {
  try {
    const propertyLocation = safeText(req.body.propertyLocation);
    if (!propertyLocation) {
      return res.status(400).json({ error: "Property location is required." });
    }

    const workbook = await loadWorkbook();
    const properties = workbook.getWorksheet("Properties") || workbook.addWorksheet("Properties");
    if (properties.columnCount === 0) {
      styleColumnsSheet(properties, propertyColumns, [
        "purchasePricePerSqy",
        "purchaseTotalPrice",
        "sellPricePerSqy",
        "sellTotalPrice"
      ]);
    }

    const id = `PROP-${Date.now()}`;
    properties.addRow({
      id,
      propertyLocation,
      googleMapLocation: safeText(req.body.googleMapLocation),
      propertySize: safeText(req.body.propertySize),
      propertyDimensions: safeText(req.body.propertyDimensions),
      previousLandOwner: safeText(req.body.previousLandOwner),
      purchasePricePerSqy: money(req.body.purchasePricePerSqy),
      purchaseTotalPrice: money(req.body.purchaseTotalPrice),
      documentNumber: safeText(req.body.documentNumber),
      registrationDate: safeText(req.body.registrationDate),
      sellPricePerSqy: money(req.body.sellPricePerSqy),
      sellTotalPrice: money(req.body.sellTotalPrice),
      presentOwner: safeText(req.body.presentOwner),
      newOwner: safeText(req.body.newOwner),
      notes: safeText(req.body.notes),
      createdAt: new Date().toISOString()
    });

    rebuildDerivedSheets(workbook);
    rebuildSummary(workbook);
    const workbookPath = await getWorkbookPath();
    await writeWorkbookWithRetry(workbook, workbookPath);
    const driveFile = await uploadWorkbookToDriveIfConnected();
    res.status(201).json({ ok: true, id, driveSynced: Boolean(driveFile) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/loans", async (_req, res, next) => {
  try {
    const workbook = await loadWorkbook();
    res.json(getLoanRecords(workbook));
  } catch (error) {
    next(error);
  }
});

app.post("/api/loans", async (req, res, next) => {
  try {
    const borrowedFrom = safeText(req.body.borrowedFrom);
    if (!borrowedFrom) return res.status(400).json({ error: "Borrowed From is required." });

    const workbook = await loadWorkbook();
    const loans = getLoanRecords(workbook);
    const typeOfFund = normalizeFundType(req.body.typeOfFund);
    const principal = money(req.body.principal);
    const emi = money(req.body.emi) || (principal * (money(req.body.interestPercentage) / 100)) / 12;
    const inferredFinishedMonths = money(req.body.finishedMonths);
    const monthPayments = {};
    if (typeOfFund === "Bank Loan") {
      for (let index = 1; index <= Math.min(inferredFinishedMonths, 60); index++) monthPayments[index] = emi;
    }
    loans.push({
      id: `LOAN-${Date.now()}`,
      notes: safeText(req.body.notes),
      borrowedFrom,
      typeOfFund,
      borrowedDate: safeText(req.body.borrowedDate) || nowIso().slice(0, 10),
      clearedDate: safeText(req.body.clearedDate),
      principal,
      interestPercentage: money(req.body.interestPercentage),
      emi,
      tenureMonths: money(req.body.tenureMonths),
      finishedMonths: inferredFinishedMonths,
      remainingMonths: Math.max(money(req.body.tenureMonths) - inferredFinishedMonths, 0),
      loanAmount: 0,
      loanPaid: money(req.body.loanPaid),
      remainingLoanAmount: 0,
      firstEmi: safeText(req.body.firstEmi),
      monthPayments,
      createdAt: nowIso(),
      lastUpdated: nowIso()
    });

    const loanSheet = resetWorksheet(workbook, "Loan");
    rebuildLoanSheet(loanSheet, loans);
    rebuildDerivedSheets(workbook);
    rebuildSummary(workbook);
    const workbookPath = await getWorkbookPath();
    await writeWorkbookWithRetry(workbook, workbookPath);
    await updateConfig({ lastLocalSync: nowIso(), lastSyncError: "", lastSyncSource: "webpage loan entry" });
    const driveFile = await uploadWorkbookToDriveIfConnected();
    res.status(201).json({ ok: true, driveSynced: Boolean(driveFile) });
  } catch (error) {
    next(error);
  }
});

app.put("/api/loans/:id", async (req, res, next) => {
  try {
    const borrowedFrom = safeText(req.body.borrowedFrom);
    if (!borrowedFrom) return res.status(400).json({ error: "Borrowed From is required." });

    const workbook = await loadWorkbook();
    const loans = getLoanRecords(workbook);
    const index = loans.findIndex((loan) => safeText(loan.id) === safeText(req.params.id));
    if (index === -1) return res.status(404).json({ error: "This loan was not found in the Loan sheet." });
    const existing = loans[index];
    const typeOfFund = normalizeFundType(req.body.typeOfFund);
    const principal = money(req.body.principal);
    const emi = money(req.body.emi) || (principal * (money(req.body.interestPercentage) / 100)) / 12;
    const requestedFinishedMonths = money(req.body.finishedMonths);
    const inferredFinishedMonths = requestedFinishedMonths;
    const monthPayments = { ...(existing.monthPayments || {}) };
    if (typeOfFund === "Bank Loan") {
      for (let index = 1; index <= Math.min(inferredFinishedMonths, 60); index++) {
        if (!monthPayments[index]) monthPayments[index] = emi;
      }
    }
    loans[index] = {
      ...existing,
      notes: safeText(req.body.notes),
      borrowedFrom,
      typeOfFund,
      borrowedDate: safeText(req.body.borrowedDate) || existing.borrowedDate || nowIso().slice(0, 10),
      clearedDate: safeText(req.body.clearedDate) || existing.clearedDate || "",
      principal,
      interestPercentage: money(req.body.interestPercentage),
      emi,
      tenureMonths: money(req.body.tenureMonths),
      finishedMonths: inferredFinishedMonths,
      remainingMonths: Math.max(money(req.body.tenureMonths) - inferredFinishedMonths, 0),
      loanPaid: money(req.body.loanPaid),
      firstEmi: safeText(req.body.firstEmi) || existing.firstEmi || "",
      monthPayments,
      lastUpdated: nowIso()
    };

    const loanSheet = resetWorksheet(workbook, "Loan");
    rebuildLoanSheet(loanSheet, loans);
    rebuildDerivedSheets(workbook);
    rebuildSummary(workbook);
    const workbookPath = await getWorkbookPath();
    await writeWorkbookWithRetry(workbook, workbookPath);
    await updateConfig({ lastLocalSync: nowIso(), lastSyncError: "", lastSyncSource: "webpage loan edit" });
    const driveFile = await uploadWorkbookToDriveIfConnected();
    res.json({ ok: true, id: req.params.id, driveSynced: Boolean(driveFile) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/loans/:id/month-entry", async (req, res, next) => {
  try {
    const workbook = await loadWorkbook();
    const update = upsertLoanMonthlyPayment(workbook, req.params.id, req.body);
    const workbookPath = await getWorkbookPath();
    await writeWorkbookWithRetry(workbook, workbookPath);
    await updateConfig({ lastLocalSync: nowIso(), lastSyncError: "", lastSyncSource: "webpage loan month entry" });
    const driveFile = await uploadWorkbookToDriveIfConnected();
    res.json({ ok: true, id: req.params.id, loan: update, driveSynced: Boolean(driveFile) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/loans/:id", async (req, res, next) => {
  try {
    const workbook = await loadWorkbook();
    const loans = getLoanRecords(workbook);
    const nextLoans = loans.filter((loan) => safeText(loan.id) !== safeText(req.params.id));
    if (nextLoans.length === loans.length) return res.status(404).json({ error: "This loan was not found in the Loan sheet." });

    const loanSheet = resetWorksheet(workbook, "Loan");
    rebuildLoanSheet(loanSheet, nextLoans);
    rebuildDerivedSheets(workbook);
    rebuildSummary(workbook);
    const workbookPath = await getWorkbookPath();
    await writeWorkbookWithRetry(workbook, workbookPath);
    await updateConfig({ lastLocalSync: nowIso(), lastSyncError: "", lastSyncSource: "webpage loan delete" });
    const driveFile = await uploadWorkbookToDriveIfConnected();
    res.json({ ok: true, id: req.params.id, driveSynced: Boolean(driveFile) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/google-drive", async (_req, res, next) => {
  try {
    res.json(await getDriveSyncStatus());
  } catch (error) {
    next(error);
  }
});

app.get("/api/sync-monitoring", async (_req, res, next) => {
  try {
    const drive = await getDriveSyncStatus();
    const workbookPath = await getWorkbookPath();
    const workbookPresent = await exists(workbookPath);
    const stat = workbookPresent ? await fs.stat(workbookPath).catch(() => null) : null;
    const config = await readConfig();
    const failedChanges = safeText(drive.lastSyncError || drive.lastDriveSyncError) ? 1 : 0;
    res.json({
      webpageStatus: "Online",
      localExcelStatus: workbookPresent ? "Available" : "Missing",
      googleDriveStatus: drive.isAuthenticated ? "Connected" : "Not connected",
      pendingChanges: config.queuedSyncReason || queuedSyncReason ? 1 : 0,
      failedChanges,
      conflictCount: (config.syncConflicts || []).length,
      lastSuccessfulSync: drive.lastLocalSync || drive.lastDriveSync || "",
      errorDetails: drive.lastSyncError || drive.lastDriveSyncError || "",
      workbookPath,
      workbookModified: stat ? stat.mtime.toISOString() : "",
      drive
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/sync-all", async (_req, res, next) => {
  try {
    const result = await syncWorkbookFromDisk("manual sync all");
    res.json({ ok: true, result, status: await getDriveSyncStatus() });
  } catch (error) {
    next(error);
  }
});

app.post("/api/google-drive/settings", async (req, res) => {
  try {
    if (!allowRuntimeCredentialStorage) {
      return res.status(403).json({ error: "Configure Google OAuth credentials through protected server environment variables in production." });
    }
    const googleClientId = String(req.body.googleClientId || "").trim();
    const googleClientSecret = String(req.body.googleClientSecret || "").trim();
    if (!googleClientId || !googleClientSecret) {
      return res.status(400).json({ error: "Enter both Google OAuth Client ID and Client Secret." });
    }
    if (!looksLikeGoogleClientId(googleClientId)) {
      return res.status(400).json({ error: "The OAuth Client ID must end with .apps.googleusercontent.com." });
    }

    await updateConfig({
      googleClientId,
      googleClientSecret: undefined,
      googleClientSecretEncrypted: await encryptConfigSecret(googleClientSecret),
      googleTokens: undefined,
      driveFileId: "",
      lastDriveSync: "",
      lastDriveSyncError: ""
    });
    res.json(await getDriveSyncStatus());
  } catch (error) {
    res.status(400).json({ error: error.message || "Unable to save Google Drive settings." });
  }
});

app.post("/api/google-drive/gmail", async (req, res) => {
  try {
    const gmailAddress = String(req.body.gmailAddress || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gmailAddress)) {
      return res.status(400).json({ error: "Enter a valid Gmail address." });
    }

    await updateConfig({ gmailAddress });
    res.json(await getDriveSyncStatus());
  } catch (error) {
    res.status(400).json({ error: error.message || "Unable to save Gmail address." });
  }
});

app.get("/auth/google", async (_req, res) => {
  try {
    const config = await readConfig();
    const client = await getOAuthClient();
    const state = crypto.randomBytes(24).toString("hex");
    const states = config.googleOAuthStates || {};
    states[state] = { createdAt: Date.now(), username: _req.financeAuth?.username || "authenticated-user" };
    await updateConfig({ googleOAuthStates: states });
    const url = client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: true,
      scope: driveScopes,
      login_hint: config.gmailAddress || undefined,
      state
    });
    res.redirect(url);
  } catch (error) {
    res.status(400).send(`<p>${friendlyGoogleOAuthError(error)}</p><p>Google Drive API access needs valid app credentials configured privately on the server. The website will not ask for your Gmail password.</p>`);
  }
});

app.get("/oauth2callback", async (req, res) => {
  try {
    const code = req.query.code;
    const returnedState = safeText(req.query.state);
    const config = await readConfig();
    const states = config.googleOAuthStates || {};
    const stateRecord = states[returnedState];
    if (!returnedState || !stateRecord || Date.now() - Number(stateRecord.createdAt || 0) > 10 * 60 * 1000) {
      throw new Error("Google authorization state expired or did not match. Start Connect Gmail again.");
    }
    delete states[returnedState];
    await updateConfig({ googleOAuthStates: states });
    if (req.query.error) {
      const denied = new Error(String(req.query.error));
      denied.details = { error: String(req.query.error) };
      throw denied;
    }
    if (!code) throw new Error("Google did not return an authorization code.");

    const client = await getOAuthClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token) throw new Error("Missing refresh token.");
    await updateConfig({
      googleTokens: tokens,
      lastDriveSyncError: ""
    });

    await uploadWorkbookToDriveIfConnected();
    res.redirect("/?google=connected");
  } catch (error) {
    await updateConfig({ lastDriveSyncError: friendlyGoogleOAuthError(error) }).catch(() => {});
    res.status(400).send(`<p>Google Drive connection failed: ${friendlyGoogleOAuthError(error)}</p><p>You can close this tab and try again from the app.</p>`);
  }
});

app.post("/api/google-drive/upload", async (_req, res) => {
  try {
    const file = await uploadWorkbookToDrive();
    res.json({ ok: true, file, status: await getDriveSyncStatus() });
  } catch (error) {
    const disconnected = await markGoogleDriveDisconnected(error);
    const friendly = friendlyGoogleOAuthError(error);
    if (!disconnected) await updateConfig({ lastDriveSyncError: friendly });
    res.status(400).json({ error: friendly || "Google Drive upload failed." });
  }
});

app.get("/api/trading", async (_req, res, next) => {
  try {
    const cachedRows = readCachedUpstoxRows();
    try {
      const workbook = await loadWorkbook();
      const records = getTradingRecords(workbook);
      return res.json(records.length ? records : cachedRows);
    } catch (error) {
      if (cachedRows.length) {
        await appendSyncLog("Trading workbook read failed; returning cached Upstox rows.", error);
        return res.json(cachedRows);
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

app.put("/api/trading/:id", async (req, res, next) => {
  try {
    const rawInvestedDate = safeText(req.body.investedDate);
    const investedDate = rawInvestedDate ? dateOnly(rawInvestedDate) : "";
    if (rawInvestedDate && !investedDate) {
      return res.status(400).json({ error: "Enter a valid invested date." });
    }

    const updatedTradingRow = await updateCachedTradingInvestedDate(req.params.id, investedDate);
    if (!updatedTradingRow) {
      return res.status(404).json({ error: "This trading record was not found." });
    }

    if (syncInProgress) {
      queuedSyncReason = "trading invested date update";
      return res.status(202).json({ ok: true, queued: true, row: updatedTradingRow });
    }

    syncInProgress = true;
    try {
      const workbook = await loadWorkbook();
      rebuildDerivedSheets(workbook);
      rebuildSummary(workbook);
      const workbookPath = await getWorkbookPath();
      await writeWorkbookWithRetry(workbook, workbookPath);
      const stat = await fs.stat(workbookPath).catch(() => null);
      if (stat) lastWorkbookMtime = stat.mtimeMs;
      await updateConfig({ lastLocalSync: nowIso(), lastSyncError: "", lastSyncSource: "trading invested date update" });
      const driveFile = await uploadWorkbookToDriveWithRetry();
      return res.json({ ok: true, row: updatedTradingRow, driveSynced: Boolean(driveFile) });
    } finally {
      syncInProgress = false;
      if (queuedSyncReason) {
        const nextReason = queuedSyncReason;
        queuedSyncReason = "";
        setTimeout(() => syncWorkbookFromDisk(nextReason).catch(() => {}), 250);
      }
    }
  } catch (error) {
    next(error);
  }
});

app.get("/api/upstox/status", async (_req, res, next) => {
  try {
    const config = await readConfig();
    const hasEnvToken = Boolean(process.env.UPSTOX_ACCESS_TOKEN);
    const hasSavedToken = Boolean(config.upstoxAccessToken);
    const cachedRows = readCachedUpstoxRows();
    const cachedTrades = readCachedUpstoxTrades();
    res.json({
      hasToken: hasEnvToken || hasSavedToken,
      hasEnvToken,
      hasSavedToken,
      source: hasEnvToken ? "environment" : hasSavedToken ? "server" : "",
      lastUpstoxSync: config.lastUpstoxSync || "",
      lastSuccessfulUpstoxSync: config.lastUpstoxSync || "",
      lastUpstoxSyncError: config.lastUpstoxSyncError || "",
      portfolioRecords: cachedRows.length,
      tradeRecords: cachedTrades.length,
      nextAutoSyncSeconds: Math.round(upstoxAutoSyncIntervalMs / 1000)
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/upstox/settings", async (req, res) => {
  try {
    if (!allowRuntimeCredentialStorage) {
      return res.status(403).json({ error: "Configure the Upstox access token through protected server environment variables in production." });
    }
    const upstoxAccessToken = safeText(req.body.upstoxAccessToken);
    if (!upstoxAccessToken) return res.status(400).json({ error: "Enter an Upstox access token." });
    await updateConfig({ upstoxAccessToken, lastUpstoxSyncError: "" });
    res.json({ ok: true, hasToken: true });
  } catch (error) {
    res.status(400).json({ error: error.message || "Unable to save Upstox settings." });
  }
});

app.post("/api/upstox/sync", async (_req, res, next) => {
  try {
    const result = await syncUpstoxAndWorkbook("manual Upstox sync");
    res.status(result.queued ? 202 : 200).json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/convert-workbook", async (_req, res, next) => {
  try {
    const workbook = await loadWorkbook();
    const records = getAllRecords(workbook);
    const outputPath = await getWorkbookPath();
    await saveConvertedWorkbook(records, outputPath);
    await updateConfig({ workbookPath: outputPath });
    const convertedWorkbook = await loadWorkbook();
    const convertedRecords = getAllRecords(convertedWorkbook);
    const convertedDebtRows = getManualDebtRows(convertedWorkbook);
    res.json({
      ok: true,
      workbookPath: outputPath,
      records: convertedRecords.length,
      yearlyGrowth: getYearlyGrowth(
        convertedRecords,
        getManualChittyOverrides(convertedWorkbook),
        getLoanRecords(convertedWorkbook),
        convertedDebtRows.length ? convertedDebtRows : convertedRecords,
        getTradingRecords(convertedWorkbook),
        readCachedUpstoxTrades()
      )
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/workbook", async (_req, res, next) => {
  try {
    const workbookPath = await getWorkbookPath();
    const present = await exists(workbookPath);
    res.json({
      workbookPath,
      present,
      syncMode: isGoogleDrivePath(workbookPath) ? "Google Drive folder" : "Local folder"
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/workbook", async (req, res, next) => {
  try {
    const nextWorkbookPath = validateWorkbookPath(req.body.workbookPath);
    const currentWorkbookPath = await getWorkbookPath();
    await fs.mkdir(path.dirname(nextWorkbookPath), { recursive: true });

    if (!(await exists(nextWorkbookPath)) && (await exists(currentWorkbookPath))) {
      await fs.copyFile(currentWorkbookPath, nextWorkbookPath);
    }

    await updateConfig({ workbookPath: nextWorkbookPath });
    await loadWorkbook();
    await syncWorkbookFromDisk("workbook path update");
    res.json({
      ok: true,
      workbookPath: nextWorkbookPath,
      syncMode: isGoogleDrivePath(nextWorkbookPath) ? "Google Drive folder" : "Local folder"
    });
  } catch (error) {
    res.status(400).json({ error: error.message || "Unable to update workbook path." });
  }
});

app.get("/download", async (_req, res, next) => {
  try {
    const workbookPath = await getWorkbookPath();
    await loadWorkbook();
    res.download(workbookPath, "Finance_Records.xlsx");
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  appendSyncLog("Request failed.", error);
  if (error.code === "EBUSY" || error.code === "EPERM") {
    return res.status(423).json({ error: "Excel workbook is open or locked. Close it and the server will retry the sync automatically." });
  }
  res.status(500).json({ error: "Something went wrong while updating the Excel file." });
});

async function validateProductionStartup() {
  if (!isProductionEnvironment) return;
  const issues = [];
  if (!configuredPort) issues.push("PORT is required.");
  if (!process.env.DATA_DIR) issues.push("DATA_DIR is required and must be a persistent volume.");
  if (!process.env.BACKUP_STORAGE_DIR) issues.push("BACKUP_STORAGE_DIR is required and must be a separate persistent volume.");
  if (!appUrl || !/^https:\/\//i.test(appUrl) || /localhost|127\.0\.0\.1/i.test(appUrl)) {
    issues.push("PUBLIC_APP_URL must be the public HTTPS origin, not localhost.");
  }
  const redirectUri = safeText(process.env.GOOGLE_REDIRECT_URI);
  if (redirectUri && redirectUri !== `${appUrl}/oauth2callback`) {
    issues.push("GOOGLE_REDIRECT_URI must equal PUBLIC_APP_URL followed by /oauth2callback.");
  }
  if (!process.env.FINANCE_WEB_PASSWORD) issues.push("FINANCE_WEB_PASSWORD must be supplied through protected environment variables.");
  if (String(process.env.SUPABASE_REQUIRED || "true").toLowerCase() !== "false") {
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      issues.push("SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SERVICE_ROLE_KEY are required when SUPABASE_REQUIRED is enabled.");
    }
  }
  if (issues.length) throw new Error(`Production configuration is incomplete: ${issues.join(" ")}`);

  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(backupStorageDir, { recursive: true });
  const workbookPath = await getWorkbookPath();
  const requireExistingWorkbook = String(process.env.REQUIRE_EXISTING_WORKBOOK || "true").toLowerCase() !== "false";
  if (requireExistingWorkbook) {
    if (!(await exists(workbookPath))) {
      throw new Error("The protected production workbook is missing. Restore it into FINANCE_WORKBOOK_PATH before starting the application.");
    }
    const inspected = await inspectWorkbookFile(workbookPath);
    if (!inspected.hasData) {
      throw new Error("The protected production workbook contains no financial records. Restore a validated backup before starting the application.");
    }
  }
}

async function startServer() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(workDirPath, { recursive: true });
  await fs.mkdir(backupStorageDir, { recursive: true });
  await validateProductionStartup();
  const authSettings = await getFinanceAuthSettings();
  if (!authSettings.enabled && isHostedProduction) {
    throw new Error("Hosted deployment requires FINANCE_WEB_PASSWORD or a saved financeWebPasswordHash.");
  }

  const server = app.listen(port, host, () => {
  runtimeReady = true;
  runtimeStartupError = "";
  console.log(isHostedProduction
    ? `Smart Fin 365 listening on the hosting provider port ${port}.`
    : `Smart Fin 365 running at http://localhost:${port}`);
  getLocalNetworkUrls().forEach((url) => console.log(`Smart Fin 365 mobile URL: ${url}`));
  getWorkbookPath()
    .then(async (workbookPath) => {
      const stat = await fs.stat(workbookPath).catch(() => null);
      lastWorkbookMtime = stat ? stat.mtimeMs : 0;
      ensureWeeklyLocalBackup(workbookPath).catch((error) => appendSyncLog("Startup weekly local backup failed.", error));
      setTimeout(() => syncWorkbookFromDisk("server startup sync").catch((error) => appendSyncLog("Startup sync failed.", error)), 500);
      fsSync.watch(path.dirname(workbookPath), { persistent: false }, (_event, fileName) => {
        if (safeText(fileName).toLowerCase() !== path.basename(workbookPath).toLowerCase()) return;
        setTimeout(() => syncWorkbookFromDisk("local Excel change").catch(() => {}), 500);
      });
      setInterval(async () => {
        const latestPath = await getWorkbookPath();
        const latestStat = await fs.stat(latestPath).catch(() => null);
        if (!latestStat || Math.abs(latestStat.mtimeMs - lastWorkbookMtime) < 500) return;
        lastWorkbookMtime = latestStat.mtimeMs;
        await syncWorkbookFromDisk("local Excel poll");
      }, 1000);
      setInterval(() => {
        downloadWorkbookFromDriveIfNewer().catch((error) => appendSyncLog("Google Drive poll failed.", error));
      }, 3000);
      setInterval(() => {
        syncUpstoxAndWorkbook("scheduled Upstox market sync").catch((error) => appendSyncLog("Scheduled Upstox sync failed.", error));
      }, upstoxAutoSyncIntervalMs);
      setInterval(() => {
        syncLiveDebtInterestAndWorkbook("scheduled live debt interest refresh").catch((error) => appendSyncLog("Scheduled live debt interest sync failed.", error));
      }, liveDebtInterestSyncIntervalMs);
    })
    .catch((error) => appendSyncLog("Unable to start workbook watcher.", error));
  });
  server.on("error", (error) => {
    runtimeReady = false;
    runtimeStartupError = error.message || "Unable to bind the HTTP server.";
    console.error(error);
    process.exitCode = 1;
  });
}

startServer().catch((error) => {
  runtimeReady = false;
  runtimeStartupError = error.message || "Startup failed.";
  console.error(error);
  process.exit(1);
});
