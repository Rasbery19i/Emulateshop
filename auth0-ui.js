(() => {
  const text = {
    fr: {
      title: "Compte Emulate Shop",
      desc: "Inscris-toi ou connecte-toi avec Auth0 pour accéder à ton espace client.",
      login: "Se connecter",
      signup: "Créer un compte",
      secured: "Connexion sécurisée par Auth0",
      active: "Compte connecté",
      verified: "Email vérifié",
      logout: "Se déconnecter",
      support: "Accéder au support Discord",
      unavailable: "Auth0 n’est pas encore entièrement configuré sur Vercel.",
      success: "Connexion réussie",
      error: "La connexion a échoué. Réessaie."
    },
    en: {
      title: "Emulate Shop account",
      desc: "Create an account or sign in with Auth0 to access your client area.",
      login: "Sign in",
      signup: "Create account",
      secured: "Secured by Auth0",
      active: "Signed in",
      verified: "Email verified",
      logout: "Sign out",
      support: "Open Discord support",
      unavailable: "Auth0 is not fully configured on Vercel yet.",
      success: "Signed in successfully",
      error: "Sign-in failed. Please try again."
    },
    es: {
      title: "Cuenta Emulate Shop",
      desc: "Regístrate o inicia sesión con Auth0 para acceder a tu espacio cliente.",
      login: "Iniciar sesión",
      signup: "Crear una cuenta",
      secured: "Conexión segura con Auth0",
      active: "Cuenta conectada",
      verified: "Correo verificado",
      logout: "Cerrar sesión",
      support: "Abrir soporte de Discord",
      unavailable: "Auth0 aún no está completamente configurado en Vercel.",
      success: "Sesión iniciada",
      error: "Error al iniciar sesión. Inténtalo de nuevo."
    },
    de: {
      title: "Emulate Shop Konto",
      desc: "Registriere dich oder melde dich mit Auth0 an, um auf deinen Kundenbereich zuzugreifen.",
      login: "Anmelden",
      signup: "Konto erstellen",
      secured: "Sichere Anmeldung mit Auth0",
      active: "Angemeldet",
      verified: "E-Mail bestätigt",
      logout: "Abmelden",
      support: "Discord-Support öffnen",
      unavailable: "Auth0 ist auf Vercel noch nicht vollständig konfiguriert.",
      success: "Anmeldung erfolgreich",
      error: "Anmeldung fehlgeschlagen. Bitte erneut versuchen."
    },
    ar: {
      title: "حساب Emulate Shop",
      desc: "أنشئ حسابًا أو سجّل الدخول عبر Auth0 للوصول إلى مساحة العميل.",
      login: "تسجيل الدخول",
      signup: "إنشاء حساب",
      secured: "اتصال آمن عبر Auth0",
      active: "تم تسجيل الدخول",
      verified: "البريد الإلكتروني موثق",
      logout: "تسجيل الخروج",
      support: "فتح دعم Discord",
      unavailable: "لم يتم إعداد Auth0 بالكامل على Vercel بعد.",
      success: "تم تسجيل الدخول بنجاح",
      error: "فشل تسجيل الدخول. حاول مرة أخرى."
    }
  };

  const PREVIEW_PARAM = "emuPreview";
  const PREVIEW_STORAGE = "emulateDevicePreview";
  let configured = false;
  let user = null;

  function language() {
    const value = document.getElementById("langSelect")?.value || document.documentElement.lang || "fr";
    return text[value] ? value : "fr";
  }

  function t(key) {
    return text[language()][key] || text.fr[key] || key;
  }

  function toast(message) {
    const notice = document.getElementById("notice");
    if (!notice) return;
    notice.textContent = message;
    notice.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => notice.classList.remove("show"), 2300);
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

  function build() {
    const box = document.querySelector("#clientDrawer .oauth-box");
    if (!box) return false;

    box.innerHTML = `
      <div class="auth0-shell">
        <div class="auth0-icon">👤</div>
        <div id="auth0Guest">
          <h4 id="auth0Title"></h4>
          <p id="auth0Desc"></p>
          <div class="auth0-actions">
            <a class="auth0-btn auth0-btn-primary" href="/auth/login" id="auth0LoginBtn"></a>
            <a class="auth0-btn auth0-btn-secondary" href="/auth/signup" id="auth0SignupBtn"></a>
          </div>
          <div class="auth0-secure"><span></span><b id="auth0SecureText"></b></div>
          <div class="auth0-status" id="auth0Status"></div>
        </div>

        <div id="auth0Profile" hidden>
          <div class="auth0-profile-card">
            <img class="auth0-avatar" id="auth0Avatar" alt="" referrerpolicy="no-referrer">
            <div class="auth0-profile-copy">
              <small id="auth0ActiveText"></small>
              <strong id="auth0Name"></strong>
              <span id="auth0Email"></span>
            </div>
          </div>
          <div class="auth0-verified" id="auth0Verified"><span></span><b id="auth0VerifiedText"></b></div>
          <a class="auth0-btn auth0-btn-secondary" href="/auth/logout" id="auth0LogoutBtn"></a>
        </div>

        <a class="choose oauth-support-link auth0-support" href="https://discord.gg/thnzjVYt2" rel="noopener" target="_blank" id="auth0Support"></a>
      </div>
    `;

    if (isPreviewChild()) {
      ["auth0LoginBtn", "auth0SignupBtn", "auth0LogoutBtn"].forEach((id) => {
        const link = document.getElementById(id);
        if (link) link.target = "_top";
      });
    }

    document.getElementById("langSelect")?.addEventListener("change", render);
    return true;
  }

  function render() {
    const guest = document.getElementById("auth0Guest");
    const profile = document.getElementById("auth0Profile");
    const clientBtn = document.getElementById("clientBtn");
    if (!guest || !profile) return;

    document.getElementById("auth0Title").textContent = t("title");
    document.getElementById("auth0Desc").textContent = t("desc");
    document.getElementById("auth0LoginBtn").textContent = t("login");
    document.getElementById("auth0SignupBtn").textContent = t("signup");
    document.getElementById("auth0SecureText").textContent = t("secured");
    document.getElementById("auth0Support").textContent = t("support");

    const status = document.getElementById("auth0Status");
    if (status) {
      status.textContent = configured ? t("secured") : t("unavailable");
      status.classList.toggle("is-error", !configured);
    }

    if (user) {
      guest.hidden = true;
      profile.hidden = false;

      const avatar = document.getElementById("auth0Avatar");
      if (user.picture) {
        avatar.src = user.picture;
        avatar.hidden = false;
      } else {
        avatar.removeAttribute("src");
        avatar.hidden = true;
      }

      document.getElementById("auth0ActiveText").textContent = t("active");
      document.getElementById("auth0Name").textContent = user.name || user.nickname || user.email || "Emulate Shop";
      document.getElementById("auth0Email").textContent = user.email || "";
      document.getElementById("auth0VerifiedText").textContent = t("verified");
      document.getElementById("auth0Verified").hidden = !user.emailVerified;
      document.getElementById("auth0LogoutBtn").textContent = t("logout");

      if (clientBtn) {
        const firstName = (user.name || user.nickname || "Compte").trim().split(/\s+/)[0];
        clientBtn.textContent = `👤 ${firstName}`;
      }
    } else {
      guest.hidden = false;
      profile.hidden = true;
      if (clientBtn) clientBtn.textContent = language() === "fr" ? "👤 Espace client" : "👤 Account";
    }
  }

  async function loadState() {
    try {
      const statusResponse = await fetch("/auth/status", { cache: "no-store", credentials: "same-origin" });
      const statusData = await statusResponse.json().catch(() => ({}));
      configured = Boolean(statusData.configured);
    } catch (_) {
      configured = false;
    }

    try {
      const response = await fetch("/auth/me", { cache: "no-store", credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.authenticated && data.user) user = data.user;
    } catch (_) {}

    render();
  }

  function showAuthResult() {
    const url = new URL(window.location.href);
    const result = url.searchParams.get("auth");
    if (!result) return;

    if (result === "success") toast(t("success"));
    else toast(t("error"));

    url.searchParams.delete("auth");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function start() {
    initViewSwitch();
    if (!build()) return;
    render();
    showAuthResult();
    loadState();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
