const COOKIE_NAME = "preferred-locale";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

function setLocaleCookie(locale: string) {
  document.cookie = `${COOKIE_NAME}=${locale};max-age=${COOKIE_MAX_AGE};path=/`;
}

function switchLang() {
  const langBtn = document.querySelector<HTMLButtonElement>("#lang-btn");
  if (!langBtn) return;

  langBtn.addEventListener("click", () => {
    const currentLocale = langBtn.dataset.currentLocale ?? "en";
    const targetLocale = currentLocale === "zh-cn" ? "en" : "zh-cn";

    // Get current path, strip base if needed
    let path = window.location.pathname;

    // Remove existing /zh-cn prefix if present
    if (path.startsWith("/zh-cn/")) {
      path = path.slice("/zh-cn".length);
    } else if (path === "/zh-cn") {
      path = "/";
    }

    // Build new path
    let newPath: string;
    if (targetLocale === "en") {
      newPath = path;
    } else {
      newPath = path === "/" ? "/zh-cn/" : `/zh-cn${path}`;
    }

    // Preserve query string and hash
    const search = window.location.search;
    const hash = window.location.hash;

    // Save preference
    localStorage.setItem(COOKIE_NAME, targetLocale);
    setLocaleCookie(targetLocale);

    // Navigate - View Transitions will handle the animation
    window.location.href = newPath + search + hash;
  });
}

switchLang();
document.addEventListener("astro:after-swap", switchLang);
