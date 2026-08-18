module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
  return res.status(200).json({
    configured: Boolean(googleClientId),
    googleClientId
  });
};
