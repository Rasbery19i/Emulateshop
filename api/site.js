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

function replaceClientButton(html) {
  const discordButton = `<a id="clientBtn" class="client-btn discord-join-btn" href="https://discord.gg/thnzjVYt2" target="_blank" rel="noopener noreferrer" aria-label="Rejoindre le Discord Emulate Shop">
<svg class="discord-join-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 5.3A17 17 0 0 0 15.3 4l-.5 1.1a15.3 15.3 0 0 0-5.6 0L8.7 4a17 17 0 0 0-4.2 1.3C1.9 9.1 1.2 12.8 1.5 16.4a17.2 17.2 0 0 0 5.2 2.7l1.2-1.7a10.8 10.8 0 0 1-1.8-.9l.5-.4a12 12 0 0 0 10.8 0l.5.4c-.6.4-1.2.7-1.8.9l1.2 1.7a17.2 17.2 0 0 0 5.2-2.7c.4-4.2-.7-7.8-3-11.1ZM8.8 14.5c-1 0-1.9-.9-1.9-2s.8-2 1.9-2 1.9.9 1.9 2-.8 2-1.9 2Zm6.4 0c-1 0-1.9-.9-1.9-2s.8-2 1.9-2 1.9.9 1.9 2-.8 2-1.9 2Z"/></svg>
<span>Rejoignez-nous</span>
</a>`;

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
    let html = replaceClientButton(readIndex());

    if (!html.includes("/auth0-ui.css")) {
      html = html.replace(
        "</head>",
        '<link rel="stylesheet" href="/auth0-ui.css?v=discord-join-2">\n</head>'
      );
    }
    if (!html.includes("/auth0-ui.js")) {
      html = html.replace(
        "</body>",
        '<script defer src="/auth0-ui.js?v=discord-join-2"></script>\n</body>'
      );
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("CDN-Cache-Control", "no-store");
    res.setHeader("Vercel-CDN-Cache-Control", "no-store");
    if (req.method === "HEAD") return res.status(200).end();
    return res.status(200).send(html);
  } catch (error) {
    console.error("Emulate Shop HTML injection failed:", error?.message || error);
    return res.status(500).send("Unable to load Emulate Shop");
  }
};
