const {
  verifyGoogleIdToken,
  getCookie,
  clearSessionCookie,
  publicUser,
  noStore
} = require("../../lib/google-auth");

module.exports = async function handler(req, res) {
  noStore(res);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  if (!clientId) {
    return res.status(503).json({ authenticated: false });
  }

  const token = getCookie(req, "emulate_google_session");
  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const user = await verifyGoogleIdToken(token, clientId);
    return res.status(200).json({
      authenticated: true,
      user: publicUser(user)
    });
  } catch (error) {
    clearSessionCookie(res);
    return res.status(401).json({ authenticated: false });
  }
};
