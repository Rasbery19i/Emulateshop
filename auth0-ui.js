(() => {
  const PREVIEW_PARAM = "emuPreview";
  const PREVIEW_STORAGE = "emulateDevicePreview";
  const DISCORD_URL = "https://discord.gg/thnzjVYt2";
  const joinLabels = {
    fr: "Rejoignez-nous",
    en: "Join us",
    es: "Únete",
    de: "Beitreten",
    ar: "انضم إلينا"
  };

  function currentLanguage() {
    const value = document.getElementById("langSelect")?.value || document.documentElement.lang || "fr";
    return joinLabels[value] ? value : "fr";
  }

  function isPreviewChild() {
    try {
      return new URL(window.location.href).searchParams.get(PREVIEW_PARAM) === "1";
    } catch (_) {
      return false;
    }
  }

  function makePreviewUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set(PREVIEW_PARAM, "1");
    return url.toString();
  }

  function initViewSwitch() {
    if (isPreviewChild()) {
      document.documentElement.classList.add("emu-preview-child");
      return;
    }
    if (document.getElementById("emuDeviceSwitch")) return;

    const stage = document.createElement("div");
    stage.className = "emu-mobile-preview-stage";
    stage.id = "emuMobilePreviewStage";
    stage.setAttribute("aria-hidden", "true");
    stage.innerHTML = `
      <div class="emu-mobile-device" role="region" aria-label="Aperçu téléphone">
        <div class="emu-mobile-notch" aria-hidden="true"></div>
        <iframe id="emuMobilePreviewFrame" title="Aperçu mobile Emulate Shop" loading="eager"></iframe>
        <div class="emu-mobile-caption">390 × 844 · aperçu mobile</div>
      </div>
    `;

    const switcher = document.createElement("div");
    switcher.className = "emu-device-switch";
    switcher.id = "emuDeviceSwitch";
    switcher.setAttribute("role", "group");
    switcher.setAttribute("aria-label", "Changer l’aperçu du site");
    switcher.innerHTML = `
      <button type="button" class="emu-device-btn" data-device="pc" aria-pressed="true" title="Version PC">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5.5h17v11h-17zM8 20h8M12 16.5V20"/></svg>
        <span>PC</span>
      </button>
      <button type="button" class="emu-device-btn" data-device="mobile" aria-pressed="false" title="Version téléphone">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7.5" y="2.5" width="9" height="19" rx="2"/><path d="M10.5 5h3M11.5 18.5h1"/></svg>
        <span>Tél.</span>
      </button>
    `;

    document.body.appendChild(stage);
    document.body.appendChild(switcher);

    const frame = document.getElementById("emuMobilePreviewFrame");
    const buttons = Array.from(switcher.querySelectorAll("[data-device]"));

    function applyMode(requestedMode, remember = true) {
      const canPreview = window.matchMedia("(min-width: 801px)").matches;
      const mode = requestedMode === "mobile" && canPreview ? "mobile" : "pc";

      buttons.forEach((button) => {
        const active = button.dataset.device === mode;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });

      const mobile = mode === "mobile";
      stage.classList.toggle("is-open", mobile);
      stage.setAttribute("aria-hidden", mobile ? "false" : "true");
      document.body.classList.toggle("emu-preview-active", mobile);

      if (mobile && frame && !frame.src) frame.src = makePreviewUrl();
      if (remember) {
        try { localStorage.setItem(PREVIEW_STORAGE, requestedMode); } catch (_) {}
      }
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => applyMode(button.dataset.device || "pc"));
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth <= 800 && stage.classList.contains("is-open")) applyMode("pc", false);
    }, { passive: true });

    let saved = "pc";
    try { saved = localStorage.getItem(PREVIEW_STORAGE) || "pc"; } catch (_) {}
    applyMode(saved, false);
  }

  function initDiscordJoin() {
    const oldButton = document.getElementById("clientBtn");
    if (!oldButton || oldButton.classList.contains("discord-join-btn")) return;

    const link = document.createElement("a");
    link.id = "clientBtn";
    link.className = `${oldButton.className || "client-btn"} discord-join-btn`.trim();
    link.href = DISCORD_URL;
    link.target = isPreviewChild() ? "_top" : "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", "Rejoindre le Discord Emulate Shop");
    link.innerHTML = `
      <svg class="discord-join-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19.5 5.3A17 17 0 0 0 15.3 4l-.5 1.1a15.3 15.3 0 0 0-5.6 0L8.7 4a17 17 0 0 0-4.2 1.3C1.9 9.1 1.2 12.8 1.5 16.4a17.2 17.2 0 0 0 5.2 2.7l1.2-1.7a10.8 10.8 0 0 1-1.8-.9l.5-.4a12 12 0 0 0 10.8 0l.5.4c-.6.4-1.2.7-1.8.9l1.2 1.7a17.2 17.2 0 0 0 5.2-2.7c.4-4.2-.7-7.8-3-11.1ZM8.8 14.5c-1 0-1.9-.9-1.9-2s.8-2 1.9-2 1.9.9 1.9 2-.8 2-1.9 2Zm6.4 0c-1 0-1.9-.9-1.9-2s.8-2 1.9-2 1.9.9 1.9 2-.8 2-1.9 2Z"/>
      </svg>
      <span class="discord-join-label"></span>
    `;

    oldButton.replaceWith(link);

    const drawer = document.getElementById("clientDrawer");
    if (drawer) {
      drawer.classList.remove("open", "active", "show");
      drawer.setAttribute("aria-hidden", "true");
    }

    function updateLabel() {
      const label = link.querySelector(".discord-join-label");
      if (label) label.textContent = joinLabels[currentLanguage()];
    }

    updateLabel();
    document.getElementById("langSelect")?.addEventListener("change", updateLabel);
  }

  function start() {
    initViewSwitch();
    initDiscordJoin();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
