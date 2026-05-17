const CSRF_COOKIE_NAME = "csrfToken";

export function getCsrfToken(): string | null {
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`));
  return match
    ? decodeURIComponent(match.slice(CSRF_COOKIE_NAME.length + 1))
    : null;
}
