const fs = require("fs");
const path = require("path");

function readIndex() {
  const candidates = [
    path.join(process.cwd(), "index.html"),
    path.join(__dirname, "..", "index.html")
  ];
  for (const file of candidates) {
    try {
      if (fs.existsSync(file)) return fs.readFileSync(file, "utf8");
    } catch (_) {}
  }
  throw new Error("index.html not found in function bundle");
}

function publishDiscordHeader(html) {
  const discordButton = `<a id="clientBtn" class="client-btn" href="https://discord.gg/thnzjVYt2" target="_blank" rel="noopener noreferrer" aria-label="Discord">Discord</a>`;

  return html.replace(
    /<button\b[^>]*\bid=["']clientBtn["'][^>]*>[\s\S]*?<\/button>/i,
    discordButton
  );
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).send("Method not allowed");
  }

  try {
    const html = publishDiscordHeader(readIndex());

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("CDN-Cache-Control", "no-store");
    res.setHeader("Vercel-CDN-Cache-Control", "no-store");
    if (req.method === "HEAD") return res.status(200).end();
    return res.status(200).send(html);
  } catch (error) {
    console.error("Emulate Shop HTML loading failed:", error?.message || error);
    return res.status(500).send("Unable to load Emulate Shop");
  }
};
