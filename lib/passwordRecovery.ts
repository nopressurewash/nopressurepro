const RECOVERY_FLAG = "np_password_recovery";

export function markPasswordRecoveryPending() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RECOVERY_FLAG, "1");
}

export function clearPasswordRecoveryPending() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(RECOVERY_FLAG);
}

export function isPasswordRecoveryPending(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(RECOVERY_FLAG) === "1";
}

export function urlIndicatesRecovery(): boolean {
  if (typeof window === "undefined") return false;

  const hashParams = new URLSearchParams(
    window.location.hash.replace(/^#/, ""),
  );
  if (hashParams.get("type") === "recovery") return true;

  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.has("code");
}

export function readAuthUrlError(): string | null {
  if (typeof window === "undefined") return null;

  const hashParams = new URLSearchParams(
    window.location.hash.replace(/^#/, ""),
  );
  const fromHash =
    hashParams.get("error_description") ?? hashParams.get("error");
  if (fromHash) return decodeURIComponent(fromHash.replace(/\+/g, " "));

  const searchParams = new URLSearchParams(window.location.search);
  const fromQuery =
    searchParams.get("error_description") ?? searchParams.get("error");
  if (fromQuery) return decodeURIComponent(fromQuery.replace(/\+/g, " "));

  return null;
}

export function stripAuthParamsFromUrl() {
  if (typeof window === "undefined") return;
  window.history.replaceState({}, document.title, window.location.pathname);
}
