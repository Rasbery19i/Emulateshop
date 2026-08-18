const {
  verifyGoogleIdToken,
  setSessionCookie,
  isSameOrigin,
  publicUser,
  noStore
} = require("../../lib/google-auth");

module.exports = async function handler(req, res) {
  noStore(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isSameOrigin(req)) {
    return res.status(403).json({ error: "Origin rejected" });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  if (!clientId) {
    return res.status(503).json({ error: "Google authentication is not configured" });
  }

  try {
    const credential = req.body && typeof req.body === "object"
      ? req.body.credential
      : "";

    const user = await verifyGoogleIdToken(credential, clientId);
    setSessionCookie(res, credential, user.exp);

    return res.status(200).json({
      ok: true,
      user: publicUser(user)
    });
  } catch (error) {
    console.error("Google auth verification failed:", error?.message || error);
    return res.status(401).json({ error: "Invalid Google credential" });
  }
};
