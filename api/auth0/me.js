const { getConfig, parseCookies, verifySession, clearCookie, setNoStore } = require("../../lib/auth0");

module.exports = async function handler(req, res) {
  setNoStore(res);
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cfg = getConfig();
  if (!cfg.configured) {
    return res.status(503).json({ authenticated: false, configured: false });
  }

  const token = parseCookies(req).emulate_auth0_session || "";
  const user = verifySession(token, cfg.sessionSecret);
  if (!user) {
    if (token) res.setHeader("Set-Cookie", clearCookie("emulate_auth0_session"));
    return res.status(401).json({ authenticated: false, configured: true });
  }

  return res.status(200).json({
    authenticated: true,
    configured: true,
    user: {
      id: user.sub,
      name: user.name,
      nickname: user.nickname,
      email: user.email,
      emailVerified: Boolean(user.email_verified),
      picture: user.picture
    }
  });
};
