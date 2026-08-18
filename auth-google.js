(() => {
  const copy = {
    fr: {
      loading: "Initialisation de Google…",
      ready: "Connexion Google sécurisée.",
      notConfigured: "Google n’est pas encore activé. Ajoute le Client ID Google dans Vercel.",
      success: "Connexion Google réussie",
      error: "Connexion Google impossible. Réessaie.",
      provider: "Connecté avec Google",
      session: "Session Google vérifiée",
      logout: "Se déconnecter"
    },
    en: {
      loading: "Initializing Google…",
      ready: "Secure Google sign-in is ready.",
      notConfigured: "Google is not enabled yet. Add the Google Client ID in Vercel.",
      success: "Google sign-in successful",
      error: "Google sign-in failed. Please try again.",
      provider: "Signed in with Google",
      session: "Verified Google session",
      logout: "Sign out"
    },
    es: {
      loading: "Inicializando Google…",
      ready: "Inicio de sesión seguro con Google listo.",
      notConfigured: "Google aún no está activado. Añade el Client ID de Google en Vercel.",
      success: "Inicio de sesión con Google correcto",
      error: "No se pudo iniciar sesión con Google.",
      provider: "Conectado con Google",
      session: "Sesión de Google verificada",
      logout: "Cerrar sesión"
    },
    de: {
      loading: "Google wird initialisiert…",
      ready: "Sichere Google-Anmeldung ist bereit.",
      notConfigured: "Google ist noch nicht aktiviert. Füge die Google Client ID in Vercel hinzu.",
      success: "Google-Anmeldung erfolgreich",
      error: "Google-Anmeldung fehlgeschlagen.",
      provider: "Mit Google angemeldet",
      session: "Verifizierte Google-Sitzung",
      logout: "Abmelden"
    },
    ar: {
      loading: "جارٍ تهيئة Google…",
      ready: "تسجيل الدخول الآمن عبر Google جاهز.",
      notConfigured: "لم يتم تفعيل Google بعد. أضف Google Client ID في Vercel.",
      success: "تم تسجيل الدخول عبر Google",
      error: "تعذر تسجيل الدخول عبر Google.",
      provider: "تم تسجيل الدخول عبر Google",
      session: "جلسة Google موثقة",
      logout: "تسجيل الخروج"
    }
  };

  const state = {
    user: null,
    clientId: "",
    configured: false,
    initialized: false,
    originalClientLabel: ""
  };

  function lang() {
    const select = document.getElementById("langSelect");
    const value = select?.value || document.documentElement.lang || "fr";
    return copy[value] ? value : "fr";
  }

  function t(key) {
    return copy[lang()]?.[key] || copy.fr[key] || key;
  }

  function notice(message) {
    const el = document.getElementById("notice");
    if (el) {
      el.textContent = message;
      el.classList.add("show");
      clearTimeout(notice.timer);
      notice.timer = setTimeout(() => el.classList.remove("show"), 2400);
    }
  }

  function waitForGoogle(timeout = 10000) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          resolve(window.google.accounts.id);
          return;
        }
        if (Date.now() - started > timeout) {
          clearInterval(timer);
          reject(new Error("Google Identity Services unavailable"));
        }
      }, 100);
    });
  }

  function buildUi() {
    const oauthBox = document.querySelector("#clientDrawer .oauth-box");
    const oldGoogle = oauthBox?.querySelector('.oauth-provider-btn[data-provider="google"]');
    if (!oauthBox || !oldGoogle) return null;

    const host = document.createElement("div");
    host.id = "emulateGoogleButton";
    host.className = "emulate-google-button";
    oldGoogle.replaceWith(host);

    const status = oauthBox.querySelector(".oauth-status");
    if (status) {
      status.id = "emulateGoogleStatus";
      status.removeAttribute("data-i18n");
      status.textContent = t("loading");
    }

    const profile = document.createElement("div");
    profile.id = "emulateGoogleProfile";
    profile.className = "emulate-google-profile";
    profile.hidden = true;
    profile.innerHTML = `
      <div class="emulate-google-profile-head">
        <img id="emulateGoogleAvatar" class="emulate-google-avatar" alt="" referrerpolicy="no-referrer">
        <div class="emulate-google-profile-copy">
          <small id="emulateGoogleProvider"></small>
          <strong id="emulateGoogleName">Google</strong>
          <span id="emulateGoogleEmail"></span>
        </div>
      </div>
      <div class="emulate-google-session"><span></span><b id="emulateGoogleSessionLabel"></b></div>
      <button type="button" id="emulateGoogleLogout" class="emulate-google-logout"></button>
    `;
    oauthBox.appendChild(profile);

    document.getElementById("emulateGoogleLogout")?.addEventListener("click", logout);
    document.getElementById("langSelect")?.addEventListener("change", () => {
      render();
      if (state.initialized && !state.user) renderGoogleButton();
    });

    const clientBtn = document.getElementById("clientBtn");
    if (clientBtn) state.originalClientLabel = clientBtn.textContent.trim();

    return { oauthBox, host, status, profile };
  }

  let ui;

  function render() {
    if (!ui) return;
    const { host, status, profile } = ui;
    const clientBtn = document.getElementById("clientBtn");

    if (state.user) {
      host.hidden = true;
      profile.hidden = false;
      if (status) status.hidden = true;

      const avatar = document.getElementById("emulateGoogleAvatar");
      const name = document.getElementById("emulateGoogleName");
      const email = document.getElementById("emulateGoogleEmail");
      const provider = document.getElementById("emulateGoogleProvider");
      const session = document.getElementById("emulateGoogleSessionLabel");
      const logoutBtn = document.getElementById("emulateGoogleLogout");

      if (avatar) {
        if (state.user.picture) {
          avatar.src = state.user.picture;
          avatar.hidden = false;
        } else {
          avatar.removeAttribute("src");
          avatar.hidden = true;
        }
      }
      if (name) name.textContent = state.user.name || state.user.email || "Google";
      if (email) email.textContent = state.user.email || "";
      if (provider) provider.textContent = t("provider");
      if (session) session.textContent = t("session");
      if (logoutBtn) logoutBtn.textContent = t("logout");

      if (clientBtn) {
        const firstName = (state.user.givenName || state.user.name || "Google").trim().split(/\s+/)[0];
        clientBtn.textContent = `👤 ${firstName}`;
      }
      return;
    }

    profile.hidden = true;
    host.hidden = false;
    if (status) {
      status.hidden = false;
      status.textContent = state.configured ? t("ready") : t("notConfigured");
    }
    if (clientBtn && state.originalClientLabel) clientBtn.textContent = state.originalClientLabel;
  }

  function renderGoogleButton() {
    if (!ui || !state.initialized || state.user) return;
    const host = ui.host;
    host.innerHTML = "";
    const width = Math.max(220, Math.min(360, Math.floor(host.clientWidth || 340)));
    window.google.accounts.id.renderButton(host, {
      type: "standard",
      theme: "filled_black",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      logo_alignment: "left",
      width,
      locale: lang()
    });
  }

  async function handleCredential(response) {
    if (!response?.credential) {
      notice(t("error"));
      return;
    }

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.user) throw new Error(data.error || "Google authentication failed");
      state.user = data.user;
      render();
      notice(t("success"));
    } catch (error) {
      console.error("Emulate Google auth:", error);
      notice(t("error"));
    }
  }

  async function restoreSession() {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store"
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      if (data.authenticated && data.user) state.user = data.user;
    } catch (_) {}
  }

  async function loadConfig() {
    try {
      const res = await fetch("/api/auth/config", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store"
      });
      const data = await res.json().catch(() => ({}));
      state.clientId = data.googleClientId || "";
      state.configured = Boolean(data.configured && state.clientId);
    } catch (_) {
      state.configured = false;
    }
  }

  async function initGoogle() {
    await Promise.all([restoreSession(), loadConfig()]);
    render();
    if (!state.configured) return;

    try {
      await waitForGoogle();
      window.google.accounts.id.initialize({
        client_id: state.clientId,
        callback: handleCredential,
        auto_select: false,
        cancel_on_tap_outside: true
      });
      state.initialized = true;
      renderGoogleButton();
    } catch (error) {
      console.error("Google Identity Services:", error);
      if (ui?.status) ui.status.textContent = t("error");
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin"
      });
    } catch (_) {}
    state.user = null;
    try { window.google?.accounts?.id?.disableAutoSelect(); } catch (_) {}
    render();
    if (state.initialized) renderGoogleButton();
  }

  function start() {
    ui = buildUi();
    if (!ui) return;
    initGoogle();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
