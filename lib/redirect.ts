const DEFAULT_REDIRECT = "/listings";

/**
 * Only same-site relative paths are accepted so `?redirect=` cannot be used to
 * bounce users to another origin after logging in.
 *
 * The value is normalized the way a browser parses a URL before it is
 * validated, and the normalized form is what gets returned — otherwise a
 * string that looks relative here can still resolve to another origin once
 * navigated to. Browsers treat backslashes as slashes, and strip tabs,
 * newlines and other control characters entirely, so `/<tab>/evil.com` would
 * pass a naive leading-`//` check and then load `//evil.com`.
 */
export function safeRedirect(value: string | null | undefined): string {
  if (!value) return DEFAULT_REDIRECT;
  const normalized = value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\\/g, "/");
  if (!normalized.startsWith("/") || normalized.startsWith("//")) return DEFAULT_REDIRECT;
  return normalized;
}
