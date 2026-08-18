const crypto = require("crypto");

let jwksCache = {
  expiresAt: 0,
  keys: []
};

function base64UrlToBuffer(value) {
  const normalized = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + "=".repeat(padLength), "base64");
}

function decodeJsonPart(value) {
  return JSON.parse(base64UrlToBuffer(value).toString("utf8"));
}

async function getGoogleJwks() {
  const now = Date.now();
  if (jwksCache.keys.length && jwksCache.expiresAt > now + 30_000) {
    return jwksCache.keys;
  }

  const response = await fetch("https://www.googleapis.com/oauth2/v3/certs", {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`Unable to load Google signing keys (${response.status})`);
  }

  const body = await response.json();
  const cacheControl = response.headers.get("cache-control") || "";
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSeconds = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;

  jwksCache = {
    keys: Array.isArray(body.keys) ? body.keys : [],
    expiresAt: now + Math.max(60, maxAgeSeconds) * 1000
  };

  return jwksCache.keys;
}

async function verifyGoogleIdToken(idToken, clientId) {
  if (!idToken || !clientId) {
    throw new Error("Missing Google token or client ID");
  }

  const parts = String(idToken).split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed Google ID token");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJsonPart(encodedHeader);
  const payload = decodeJsonPart(encodedPayload);

  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Unsupported Google token signature");
  }

  const keys = await getGoogleJwks();
  const jwk = keys.find((key) => key.kid === header.kid && key.kty === "RSA");
  if (!jwk) {
    jwksCache.expiresAt = 0;
    const refreshedKeys = await getGoogleJwks();
    const refreshedJwk = refreshedKeys.find((key) => key.kid === header.kid && key.kty === "RSA");
    if (!refreshedJwk) throw new Error("Google signing key not found");
    return verifyWithJwk(refreshedJwk, encodedHeader, encodedPayload, encodedSignature, payload, clientId);
  }

  return verifyWithJwk(jwk, encodedHeader, encodedPayload, encodedSignature, payload, clientId);
}

function verifyWithJwk(jwk, encodedHeader, encodedPayload, encodedSignature, payload, clientId) {
  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const signingInput = Buffer.from(`${encodedHeader}.${encodedPayload}`, "utf8");
  const signature = base64UrlToBuffer(encodedSignature);

  const signatureValid = crypto.verify("RSA-SHA256", signingInput, publicKey, signature);
  if (!signatureValid) throw new Error("Invalid Google token signature");

  const now = Math.floor(Date.now() / 1000);
  const issuerValid = payload.iss === "accounts.google.com" || payload.iss === "https://accounts.google.com";

  if (payload.aud !== clientId) throw new Error("Invalid Google token audience");
  if (!issuerValid) throw new Error("Invalid Google token issuer");
  if (!Number.isFinite(Number(payload.exp)) || Number(payload.exp) <= now) throw new Error("Expired Google token");
  if (payload.iat && Number(payload.iat) > now + 300) throw new Error("Invalid Google token issue time");
  if (!payload.sub) throw new Error("Google subject is missing");

  return {
    sub: String(payload.sub),
    email: payload.email ? String(payload.email) : "",
    emailVerified: Boolean(payload.email_verified),
    name: payload.name ? String(payload.name) : "",
    givenName: payload.given_name ? String(payload.given_name) : "",
    familyName: payload.family_name ? String(payload.family_name) : "",
    picture: payload.picture ? String(payload.picture) : "",
    exp: Number(payload.exp)
  };
}

function getCookie(req, name) {
  const header = req.headers.cookie || "";
  const parts = header.split(";").map((part) => part.trim());
  for (const part of parts) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index);
    if (key !== name) continue;
    try {
      return decodeURIComponent(part.slice(index + 1));
    } catch {
      return part.slice(index + 1);
    }
  }
  return "";
}

function setSessionCookie(res, idToken, exp) {
  const now = Math.floor(Date.now() / 1000);
  const maxAge = Math.max(60, Math.min(3600, Number(exp || now + 3600) - now));
  res.setHeader(
    "Set-Cookie",
    `emulate_google_session=${encodeURIComponent(idToken)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    "emulate_google_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
  );
}

function isSameOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  if (!origin || !host) return false;

  try {
    const url = new URL(origin);
    return url.host === host;
  } catch {
    return false;
  }
}

function publicUser(user) {
  return {
    id: user.sub,
    email: user.email,
    emailVerified: user.emailVerified,
    name: user.name,
    givenName: user.givenName,
    familyName: user.familyName,
    picture: user.picture
  };
}

function noStore(res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
}

module.exports = {
  verifyGoogleIdToken,
  getCookie,
  setSessionCookie,
  clearSessionCookie,
  isSameOrigin,
  publicUser,
  noStore
};
