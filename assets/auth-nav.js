import { watchUser, logout } from "./firebase.js";

export function setupAuthNavigation(nav, root = "") {
  if (!nav || nav.dataset.authReady === "true") return;
  nav.dataset.authReady = "true";
  const account = nav.querySelector("[data-auth-account]") || nav.querySelector('a[href*="dashboard.html"]');
  if (!account) return;
  const extras = () => nav.querySelectorAll("[data-auth-extra]").forEach(node => node.remove());
  const addLink = (label, href, attr = "") => {
    const link = document.createElement("a");
    link.href = root + href;
    link.textContent = label;
    link.dataset.authExtra = "true";
    if (attr) link.setAttribute("aria-label", attr);
    nav.appendChild(link);
    return link;
  };
  watchUser((user, profile) => {
    extras();
    if (!user || !profile) {
      account.textContent = "Iniciar sesión";
      account.href = root + "auth/login.html?next=" + encodeURIComponent(location.pathname + location.search);
      return;
    }
    const isAdmin = profile.role === "admin";
    account.textContent = isAdmin ? "Panel de administración" : ((profile.name || "Mi cuenta").split(" ")[0]);
    account.href = root + (isAdmin ? "admin/dashboard.html" : "cuenta/dashboard.html");
    addLink("Publicar anuncio", "cuenta/publicar.html");
    if (isAdmin) addLink("Mi cuenta", "cuenta/dashboard.html");
    const exit = document.createElement("a");
    exit.href = "#";
    exit.textContent = "Cerrar sesión";
    exit.dataset.authExtra = "true";
    exit.addEventListener("click", async event => {
      event.preventDefault();
      exit.textContent = "Cerrando sesión…";
      exit.setAttribute("aria-disabled", "true");
      try {
        await logout();
        location.assign(root + "index.html");
      } catch (error) {
        console.error("No se pudo cerrar la sesión", error);
        exit.textContent = "Reintentar cierre de sesión";
        exit.removeAttribute("aria-disabled");
      }
    });
    nav.appendChild(exit);
  });
}
