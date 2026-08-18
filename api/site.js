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

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).send("Method not allowed");
  }

  try {
    let html = readIndex();
    if (!html.includes("/auth0-ui.css")) {
      html = html.replace(
        "</head>",
        '<link rel="stylesheet" href="/auth0-ui.css">\n</head>'
      );
    }
    if (!html.includes("/auth0-ui.js")) {
      html = html.replace(
        "</body>",
        '<script defer src="/auth0-ui.js"></script>\n</body>'
      );
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
    if (req.method === "HEAD") return res.status(200).end();
    return res.status(200).send(html);
  } catch (error) {
    console.error("Emulate Shop HTML injection failed:", error?.message || error);
    return res.status(500).send("Unable to load Emulate Shop");
  }
};
