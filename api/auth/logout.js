const { clearSessionCookie, isSameOrigin, noStore } = require("../../lib/google-auth");

module.exports = async function handler(req, res) {
  noStore(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isSameOrigin(req)) {
    return res.status(403).json({ error: "Origin rejected" });
  }

  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
};
