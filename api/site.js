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

function publishHeaderActions(html) {
  const headerActions = `<span style="display:inline-flex;align-items:center;gap:10px;white-space:nowrap"><a id="clientBtn" class="client-btn" href="https://discord.gg/thnzjVYt2" target="_blank" rel="noopener noreferrer" aria-label="Discord">Discord</a><a id="authLoginBtn" class="client-btn" href="/auth/login" aria-label="Connexion Auth0">Connexion</a></span>`;

  return html.replace(
    /<button\b[^>]*\bid=["']clientBtn["'][^>]*>[\s\S]*?<\/button>/i,
    headerActions
  );
}

function publishFirmwareOneToOneDescriptions(html) {
  const descriptions = [
    "L’essentiel pour débuter à petit prix.",
    "Un firmware fait pour la compétition.",
    "La formule premium pour ceux qui veulent une expérience plus complète.",
    "Pour les utilisateurs exigeants.",
    "5 slot disponible.",

    "The essentials to start at a low price.",
    "A firmware made for competition.",
    "The premium formula for those who want a more complete experience.",
    "For demanding users.",
    "5 slots available.",

    "Lo esencial para empezar a bajo precio.",
    "Un firmware hecho para la competición.",
    "La fórmula premium para quienes quieren una experiencia más completa.",
    "Para usuarios exigentes.",
    "5 slots disponibles.",

    "Das Wesentliche für einen günstigen Start.",
    "Eine Firmware für den Wettbewerb.",
    "Die Premium-Formel für alle, die ein vollständigeres Erlebnis wollen.",
    "Für anspruchsvolle Nutzer.",
    "5 Slots verfügbar.",

    "الأساسيات للبدء بسعر منخفض.",
    "فيرموير مصمم للمنافسة.",
    "الخيار المميز لمن يريد تجربة أكثر اكتمالاً.",
    "للمستخدمين المتطلبين.",
    "5 فتحات متوفرة."
  ];

  for (const description of descriptions) {
    html = html.split(description).join(`Firmware 1:1 — ${description}`);
  }
  return html;
}

function publishWhoofingOffer(html) {
  const oldDescription = '<div class="desc" data-i18n="whoofing_once_desc">Accès unique.</div>';
  const features = `${oldDescription}\n<ul class="features">\n<li><span class="check">✓</span><span>TPM</span></li>\n<li><span class="check">✓</span><span>Work with all motherboards</span></li>\n</ul>`;

  // Keep the live card aligned with the uploaded V6.95 version.
  html = html.split('<li><span class="check">✓</span><span>SMBIOS Fixer</span></li>\n').join("");

  if (!html.includes("Work with all motherboards")) {
    html = html.replace(oldDescription, features);
  }

  html = html.replace(
    '<div class="price" data-base-price="45">45,00 €</div>\n<button class="choose primary" data-i18n="choose_offer" data-price="45" data-product="whoofing_once">Choisir cette offre</button>',
    '<div class="price" data-base-price="25">25,00 €</div>\n<button class="choose primary" data-i18n="choose_offer" data-price="25" data-product="whoofing_once">Choisir cette offre</button>'
  );

  return html;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).send("Method not allowed");
  }

  try {
    let html = readIndex();
    html = publishHeaderActions(html);
    html = publishFirmwareOneToOneDescriptions(html);
    html = publishWhoofingOffer(html);

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
