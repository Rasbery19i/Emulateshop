const { getConfig, getBaseUrl, clearCookie, setNoStore } = require("../../lib/auth0");

module.exports = async function handler(req, res) {
  setNoStore(res);
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method not allowed");
  }

  const cfg = getConfig();
  const baseUrl = getBaseUrl(req);
  res.setHeader("Set-Cookie", clearCookie("emulate_auth0_session"));

  if (!cfg.configured) return res.redirect(302, baseUrl + "/");

  const url = new URL(`https://${cfg.domain}/v2/logout`);
  url.searchParams.set("client_id", cfg.clientId);
  url.searchParams.set("returnTo", `${baseUrl}/`);
  return res.redirect(302, url.toString());
};
