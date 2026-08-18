const {
  getConfig,
  getBaseUrl,
  exchangeCode,
  fetchUserInfo,
  parseCookies,
  cookie,
  clearCookie,
  makeSession,
  safeEqual,
  setNoStore
} = require("../../lib/auth0");

module.exports = async function handler(req, res) {
  setNoStore(res);
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method not allowed");
  }

  const baseUrl = getBaseUrl(req);
  const cfg = getConfig();
  const cookies = parseCookies(req);
  const expectedState = cookies.emulate_auth0_state || "";
  const returnedState = String(req.query?.state || "");
  const code = String(req.query?.code || "");
  const authError = String(req.query?.error || "");

  if (authError) {
    const description = String(req.query?.error_description || authError);
    console.error("Auth0 callback error:", description);
    res.setHeader("Set-Cookie", clearCookie("emulate_auth0_state"));
    return res.redirect(302, `${baseUrl}/?auth=error`);
  }

  if (!cfg.configured || !code || !expectedState || !safeEqual(expectedState, returnedState)) {
    res.setHeader("Set-Cookie", clearCookie("emulate_auth0_state"));
    return res.redirect(302, `${baseUrl}/?auth=invalid`);
  }

  try {
    const redirectUri = `${baseUrl}/auth/callback`;
    const tokens = await exchangeCode(code, redirectUri);
    const user = await fetchUserInfo(tokens.access_token);
    const session = makeSession(user, cfg.sessionSecret);

    res.setHeader("Set-Cookie", [
      clearCookie("emulate_auth0_state"),
      cookie("emulate_auth0_session", session, { maxAge: 60 * 60 * 24 * 7 })
    ]);
    return res.redirect(302, `${baseUrl}/?auth=success`);
  } catch (error) {
    console.error("Auth0 callback:", error?.message || error);
    res.setHeader("Set-Cookie", clearCookie("emulate_auth0_state"));
    return res.redirect(302, `${baseUrl}/?auth=error`);
  }
};
