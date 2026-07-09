// Cloudflare Pages Functions middleware for geo-based language detection.
// Runs on Cloudflare edge; does not affect local dev or non-Cloudflare deployments.
// Priority: user cookie > Cloudflare geo-IP > Accept-Language header

const ZH_COUNTRIES = ["CN", "TW", "HK", "MO", "SG"];
const COOKIE_NAME = "preferred-locale";

export function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const { pathname } = url;

  // Skip if request already has a locale prefix
  if (pathname.startsWith("/zh-cn/") || pathname === "/zh-cn") {
    return context.next();
  }

  // Skip non-GET requests and static assets
  if (request.method !== "GET") {
    return context.next();
  }

  // Skip asset files (has file extension)
  if (pathname.includes(".") && !pathname.endsWith("/")) {
    return context.next();
  }

  // Check for user's explicit language preference cookie
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookieMatch = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (cookieMatch) {
    const preferred = cookieMatch[1];
    if (preferred === "zh-cn") {
      return redirectToLocale(url, "zh-cn");
    }
    // en or unknown - stay on default locale
    return context.next();
  }

  // Cloudflare geo-IP detection
  const country = request.cf?.country;
  if (country && ZH_COUNTRIES.includes(country)) {
    return redirectToLocale(url, "zh-cn");
  }

  // Fallback: Accept-Language header
  const acceptLang = request.headers.get("Accept-Language") || "";
  if (acceptLang.toLowerCase().includes("zh")) {
    return redirectToLocale(url, "zh-cn");
  }

  return context.next();
}

function redirectToLocale(url, locale) {
  const newPath =
    url.pathname === "/" ? `/${locale}/` : `/${locale}${url.pathname}`;
  const redirectUrl = new URL(newPath, url.origin);
  redirectUrl.search = url.search;
  return Response.redirect(redirectUrl.toString(), 302);
}
