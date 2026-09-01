// Attribution tracking — persists UTM + AppLovin params into first-party cookies

const PARAM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "aleid",
  "alart",
] as const;

export type AttributionData = Partial<Record<(typeof PARAM_KEYS)[number], string>>;

function cookieDomain(): string {
  return location.hostname.includes("bycat.ai") ? ";domain=.bycat.ai" : "";
}

function setCookie(name: string, value: string, maxAge = 2592000) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge}${cookieDomain()};SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Call once on app load — reads URL params and writes first_touch / last_touch cookies */
export function initAttribution() {
  const params = new URLSearchParams(location.search);
  const current: AttributionData = {};

  for (const key of PARAM_KEYS) {
    const val = params.get(key);
    if (val) current[key] = val;
  }

  if (Object.keys(current).length === 0) return;

  // last touch: always overwrite
  setCookie("last_touch", JSON.stringify(current));

  // first touch: only if not already set
  if (!getCookie("first_touch")) {
    setCookie("first_touch", JSON.stringify(current));
  }
}

export function getLastTouch(): AttributionData {
  try {
    return JSON.parse(getCookie("last_touch") || "{}");
  } catch {
    return {};
  }
}

export function getFirstTouch(): AttributionData {
  try {
    return JSON.parse(getCookie("first_touch") || "{}");
  } catch {
    return {};
  }
}
