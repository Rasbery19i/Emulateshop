const crypto = require("crypto");

function findEnv(name) {
  if (process.env[name]) return process.env[name];
  const match = Object.keys(process.env).find((key) => key.endsWith(name) && key.includes("AUTH0"));
  return match ? process.env[match] : "";
}

function normalizeDomain(value) {
  return String(value || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

function getConfig() {
  const domain = normalizeDomain(findEnv("AUTH0_DOMAIN"));
  const clientId = findEnv("AUTH0_CLIENT_ID");
  const clientSecret = findEnv("AUTH0_CLIENT_SECRET");
  const sessionSecret = findEnv("AUTH0_SECRET") || findEnv("AUTH0_SESSION_SECRET") || clientSecret;

  return {
    domain,
    clientId,
    clientSecret,
    sessionSecret,
    configured: Boolean(domain && clientId && clientSecret && sessionSecret)
  };
}

function getBaseUrl(req) {
  const explicit = process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL || "";
  if (explicit) return explicit.replace(/\/+$/, "");

  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "www.emulateshop.com").split(",")[0].trim();
  return `${proto}://${host}`;
}

function b64url(value) {
  return Buffer.from(value).toString("base64url");
}

function fromB64url(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ""));
  const bb = Buffer.from(String(b || ""));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function makeSession(user, secret, maxAgeSeconds = 60 * 60 * 24 * 7) {
  const payload = {
    sub: user.sub || "",
    name: user.name || user.nickname || "",
    nickname: user.nickname || "",
    email: user.email || "",
    email_verified: Boolean(user.email_verified),
    picture: user.picture || "",
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds
  };
  const encoded = b64url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded, secret)}`;
}

function verifySession(token, secret) {
  if (!token || !secret) return null;
  const [encoded, signature] = String(token).split(".");
  if (!encoded || !signature || !safeEqual(signature, sign(encoded, secret))) return null;

  try {
    const payload = JSON.parse(fromB64url(encoded));
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const out = {};
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    try { out[key] = decodeURIComponent(value); }
    catch { out[key] = value; }
  }
  return out;
}

function cookie(name, value, options = {}) {
  const bits = [`${name}=${encodeURIComponent(value)}`, `Path=${options.path || "/"}`];
  if (options.maxAge !== undefined) bits.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly !== false) bits.push("HttpOnly");
  if (options.secure !== false) bits.push("Secure");
  bits.push(`SameSite=${options.sameSite || "Lax"}`);
  return bits.join("; ");
}

function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function setNoStore(res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
}

function buildAuthorizeUrl(req, mode) {
  const cfg = getConfig();
  if (!cfg.configured) throw new Error("Auth0 is not configured");

  const baseUrl = getBaseUrl(req);
  const callbackUrl = `${baseUrl}/auth/callback`;
  const state = crypto.randomBytes(32).toString("base64url");
  const url = new URL(`https://${cfg.domain}/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", cfg.clientId);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", state);
  if (mode === "signup") url.searchParams.set("screen_hint", "signup");

  return { url: url.toString(), state, callbackUrl };
}

async function exchangeCode(code, redirectUri) {
  const cfg = getConfig();
  const response = await fetch(`https://${cfg.domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      code,
      redirect_uri: redirectUri
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || `Auth0 token exchange failed (${response.status})`);
  }
  return data;
}

async function fetchUserInfo(accessToken) {
  const cfg = getConfig();
  const response = await fetch(`https://${cfg.domain}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const user = await response.json().catch(() => ({}));
  if (!response.ok || !user.sub) throw new Error("Unable to load Auth0 user profile");
  return user;
}

module.exports = {
  getConfig,
  getBaseUrl,
  buildAuthorizeUrl,
  exchangeCode,
  fetchUserInfo,
  parseCookies,
  cookie,
  clearCookie,
  makeSession,
  verifySession,
  safeEqual,
  setNoStore
};
