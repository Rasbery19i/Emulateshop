const { buildAuthorizeUrl, cookie, setNoStore } = require("../../lib/auth0");

module.exports = async function handler(req, res) {
  setNoStore(res);
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method not allowed");
  }

  try {
    const { url, state } = buildAuthorizeUrl(req, "login");
    res.setHeader("Set-Cookie", cookie("emulate_auth0_state", state, { maxAge: 600 }));
    return res.redirect(302, url);
  } catch (error) {
    console.error("Auth0 login:", error?.message || error);
    return res.status(503).send("Auth0 is not configured yet.");
  }
};
