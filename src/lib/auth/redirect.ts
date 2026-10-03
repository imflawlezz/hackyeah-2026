/**
 * Returns `value` only when it is a same-site relative path; otherwise "/".
 * Blocks open redirects such as "//evil.com", "/\evil.com" and absolute URLs.
 */
export function safeNext(value: unknown): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (/[\\\u0000-\u001f]/.test(value)) return "/";
  return value;
}

export function loginPath(next?: string): string {
  const target = safeNext(next);
  return target === "/"
    ? "/login"
    : `/login?next=${encodeURIComponent(target)}`;
}
