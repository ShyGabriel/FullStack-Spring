// login.js (reemplaza la impl. existente)
export function initLogin() {
  const servers = [
    "https://apiutp-1.onrender.com",
    "https://apiutp-2.onrender.com",
    "https://apiutp-3.onrender.com",
    "https://apiutp-4.onrender.com",
    "https://apiutp-5.onrender.com",
  ];

  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  const loginBtn = document.getElementById("loginBtn");
  if (!loginBtn) return;

  if (loginForm.dataset.listenerAdded === "true") return;

  // ---------- Helpers ----------
  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function fetchWithTimeout(url, opts = {}, timeout = 3000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, {
        ...opts,
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(id);
      return res;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  // Intenta muchos /status en paralelo (rápido) y devuelve el primero libre.
  async function getFreeServer() {
    // Chequeos paralelos rápidos (timeout corto)
    const checks = servers.map((server) =>
      fetchWithTimeout(`${server}/status`, {}, 2500)
        .then((r) => r.json().then((data) => ({ server, data })))
        .catch((err) => {
          console.warn("status failed:", server, err && err.name);
          return null;
        })
    );

    const results = await Promise.all(checks);
    const free = results.find((r) => r && !r.data?.busy);
    if (free) return free.server;

    // Fallback: chequeo secuencial con timeout más alto (intentar despertar servidores)
    for (const server of servers) {
      try {
        const res = await fetchWithTimeout(`${server}/status`, {}, 7000);
        const data = await res.json();
        if (!data.busy) return server;
      } catch (err) {
        // ignorar
      }
    }
    return null;
  }

  // Fade helper
  async function setLoadingMessage(el, msg, duration = 600) {
    if (!el) return;

    // Fade out
    el.classList.add("fade-out");
    await new Promise((r) => setTimeout(r, duration));

    // Cambiar texto
    el.textContent = msg;

    // Fade in
    el.classList.remove("fade-out");
  }

  // ---------- UI / login helpers ----------
  function updateLoginLinks() {
    const isLoggedIn = !!localStorage.getItem("userData");
    const mobileLoginLink = document.querySelector(
      "#mobileNavbarMenu .nav-link.loginLinkMobile"
    );
    const sidebarLoginLink = document.querySelector(
      "#sidebar .loginLinkDesktop"
    );

    if (isLoggedIn) {
      if (mobileLoginLink) {
        mobileLoginLink.innerHTML =
          '<i class="bi bi-box-arrow-right me-2"></i>Cerrar sesión';
        mobileLoginLink.removeAttribute("data-bs-toggle");
        mobileLoginLink.removeAttribute("data-bs-target");
        mobileLoginLink.onclick = cerrarSesion;
      }
      if (sidebarLoginLink) {
        sidebarLoginLink.innerHTML =
          '<i class="bi bi-box-arrow-right"></i><span class="link-text">Cerrar sesión</span>';
        sidebarLoginLink.removeAttribute("data-bs-toggle");
        sidebarLoginLink.removeAttribute("data-bs-target");
        sidebarLoginLink.onclick = cerrarSesion;
      }
    } else {
      if (mobileLoginLink) {
        mobileLoginLink.innerHTML =
          '<i class="bi bi-box-arrow-in-right me-2"></i>Login';
        mobileLoginLink.setAttribute("data-bs-toggle", "modal");
        mobileLoginLink.setAttribute("data-bs-target", "#loginModal");
        mobileLoginLink.onclick = null;
      }
      if (sidebarLoginLink) {
        sidebarLoginLink.innerHTML =
          '<i class="bi bi-box-arrow-in-right"></i><span class="link-text">Login</span>';
        sidebarLoginLink.setAttribute("data-bs-toggle", "modal");
        sidebarLoginLink.setAttribute("data-bs-target", "#loginModal");
        sidebarLoginLink.onclick = null;
      }
    }
  }

  function cerrarSesion(e) {
    e && e.preventDefault();
    localStorage.removeItem("userData");
    updateLoginLinks();
    window.location.href = "index.html";
  }

  updateLoginLinks();

  // ---------- Submit/login ----------
  loginBtn.addEventListener("click", () => loginForm.requestSubmit());

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("codigo")?.value.trim();
    const password = document.getElementById("password")?.value.trim();
    if (!username || !password) {
      alert("Por favor, ingresa tu usuario y contraseña.");
      return;
    }

    loginBtn.disabled = true;
    const modalBody = loginForm.closest(".modal-body");
    const loaderOverlay = document.getElementById("modalLoaderOverlay");
    const loadingTextElement = document.getElementById("loadingText");

    loaderOverlay.style.display = "flex";
    modalBody.classList.add("modal-loading");

    // Si ya hay datos guardados: reproducir mensajes locales y luego ir a schedule
    const savedData = localStorage.getItem("userData");
    if (savedData) {
      const mensajesLocales = [
        "Conectando con datos guardados",
        "Cargando cursos",
        "Cargando actividades",
        "Listo 🚀",
      ];

      try {
        for (let i = 0; i < mensajesLocales.length; i++) {
          await setLoadingMessage(loadingTextElement, mensajesLocales[i], 350);
          // dejar visible un poco
          await sleep(10000);
        }
      } catch (err) {
        console.error("Error al mostrar mensajes locales:", err);
      } finally {
        loaderOverlay.style.display = "none";
        modalBody.classList.remove("modal-loading");
        loginBtn.disabled = false;
        updateLoginLinks();
        // Cerrar modal si está abierto
        try {
          const loginModal = bootstrap.Modal.getInstance(
            document.getElementById("loginModal")
          );
          if (loginModal) loginModal.hide();
        } catch (err) {}
        // Mostrar welcome (sin redirigir)
        showWelcome(localStorage.getItem("userData"));
      }

      return;
    }

    // --------- Si no hay savedData: buscar servidor libre y conectar SSE ----------
    try {
      await setLoadingMessage(
        loadingTextElement,
        "Buscando servidor disponible...",
        250
      );

      const server = await getFreeServer();
      if (!server) {
        await setLoadingMessage(
          loadingTextElement,
          "Todos los servidores están ocupados. Intenta más tarde.",
          250
        );
        loaderOverlay.style.display = "none";
        modalBody.classList.remove("modal-loading");
        loginBtn.disabled = false;
        return;
      }

      await setLoadingMessage(
        loadingTextElement,
        `Conectando a ${server}...`,
        250
      );

      const url = `${server}/api/eventos-stream?username=${encodeURIComponent(
        username
      )}&password=${encodeURIComponent(password)}`;
      console.log("Conectando a:", url);

      const evtSource = new EventSource(url);

      let userData = {};

      evtSource.addEventListener("estado", async (event) => {
        try {
          const data = JSON.parse(event.data);
          await setLoadingMessage(
            loadingTextElement,
            data.mensaje || "Procesando...",
            250
          );
        } catch (err) {
          console.warn("estado parse error", err);
        }
      });

      evtSource.addEventListener("nombre", (event) => {
        try {
          const data = JSON.parse(event.data);
          userData.nombreEstudiante = data.nombreEstudiante;
        } catch (err) {
          console.warn("nombre parse error", err);
        }
      });

      evtSource.addEventListener("eventos", (event) => {
        try {
          const data = JSON.parse(event.data);
          userData.eventos = data.eventos;
        } catch (err) {
          console.warn("eventos parse error", err);
        }
      });

      evtSource.addEventListener("semana", (event) => {
        try {
          const data = JSON.parse(event.data);
          userData.semanaInfo = data.semanaInfo;
        } catch (err) {
          console.warn("semana parse error", err);
        }
      });

      evtSource.addEventListener("fin", async () => {
        try {
          userData.success = true;
          localStorage.setItem("userData", JSON.stringify(userData));
          loaderOverlay.style.display = "none";
          evtSource.close();

          updateLoginLinks();

          // Cerrar el modal de login
          try {
            const loginModal = bootstrap.Modal.getInstance(
              document.getElementById("loginModal")
            );
            if (loginModal) loginModal.hide();
          } catch (err) {}

          // Mostrar splash/welcome en la misma página
          showWelcome(localStorage.getItem("userData"));
        } catch (err) {
          console.error("fin handler error", err);
        }
      });

      evtSource.addEventListener("error", (err) => {
        console.error("SSE error:", err);
        loaderOverlay.style.display = "none";
        try {
          evtSource.close();
        } catch (e) {}
        alert(
          "Error al iniciar sesión, revisa tus credenciales o intenta más tarde."
        );
      });
    } catch (error) {
      console.error("Login flow error:", error);
      loaderOverlay.style.display = "none";
      alert("Error al iniciar sesión, revisa tus credenciales.");
    } finally {
      modalBody.classList.remove("modal-loading");
      loginBtn.disabled = false;
    }
  });

  loginForm.dataset.listenerAdded = "true";
}

// ---------- showWelcome (mejorado) ----------
export function showWelcome(userData) {
  try {
    const data = typeof userData === "string" ? JSON.parse(userData) : userData;
    if (!data) return console.warn("showWelcome: no hay userData");

    const nombre = data.nombreEstudiante || "Estudiante";
    const eventos = data.eventos || [];

    // Fecha ISO yyyy-mm-dd
    const hoy = new Date().toISOString().split("T")[0];

    const clasesHoy = eventos.filter(
      (e) => e.tipo === "Clase" && e.fecha === hoy
    );
    const tieneClase = clasesHoy.length > 0;

    const actividadesPend = eventos.filter(
      (e) => e.tipo === "Actividad" && e.estado !== "Entregada"
    );

    const msg = `Hola ${nombre}.`;
    const submsg = tieneClase
      ? `Hoy tienes clase. Te quedan por hacer ${actividadesPend.length} actividades.`
      : `No tienes clase hoy. Te quedan por hacer ${actividadesPend.length} actividades.`;

    const elMsg = document.getElementById("welcome-msg");
    const elSub = document.getElementById("welcome-submsg");
    if (elMsg) elMsg.textContent = msg;
    if (elSub) elSub.textContent = submsg;

    const welcome = document.getElementById("welcome-screen");
    if (!welcome) return console.warn("welcome-screen no encontrado");

    // Asegúrate de que el elemento empiece oculto: class="welcome hidden"
    welcome.classList.remove("hidden");
    // fuerza reflow para que transition funcione
    void welcome.offsetWidth;
    welcome.classList.add("show");

    const goBtn = document.getElementById("goDashboardBtn");
    if (goBtn) {
      goBtn.onclick = () => {
        welcome.classList.remove("show");
        setTimeout(() => welcome.classList.add("hidden"), 500);
        // si quieres redirigir:
        // window.location.href = "dashboard.html";
      };
    }
  } catch (err) {
    console.error("Error en showWelcome:", err);
  }
}
