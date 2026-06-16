/**
 * Canonical site URL for Supabase auth redirects (password recovery, etc.).
 * In production, set NEXT_PUBLIC_SITE_URL to the live app origin — never localhost.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

export function getAuthRedirectUrl(path: string): string {
  const base = getSiteUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
