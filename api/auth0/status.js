const { getConfig, getBaseUrl, setNoStore } = require("../../lib/auth0");

module.exports = async function handler(req, res) {
  setNoStore(res);
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cfg = getConfig();
  return res.status(200).json({
    configured: cfg.configured,
    hasDomain: Boolean(cfg.domain),
    hasClientId: Boolean(cfg.clientId),
    hasClientSecret: Boolean(cfg.clientSecret),
    hasSessionSecret: Boolean(cfg.sessionSecret),
    callbackUrl: `${getBaseUrl(req)}/auth/callback`
  });
};
