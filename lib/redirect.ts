const DEFAULT_REDIRECT = "/listings";

/**
 * Only same-site relative paths are accepted so `?redirect=` cannot be used to
 * bounce users to another origin after logging in. Backslashes are normalized
 * first because browsers treat them as slashes when parsing URLs.
 */
export function safeRedirect(value: string | null | undefined): string {
  if (!value) return DEFAULT_REDIRECT;
  const normalized = value.replace(/\\/g, "/");
  if (!normalized.startsWith("/") || normalized.startsWith("//")) return DEFAULT_REDIRECT;
  return normalized;
}
