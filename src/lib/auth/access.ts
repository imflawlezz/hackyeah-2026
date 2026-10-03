export type Access = "public" | "user" | "admin";

// `exact` rules match only the path itself; the others also match nested routes.
const RULES: { path: string; access: Access; exact?: boolean }[] = [
  { path: "/admin", access: "admin" },
  { path: "/messages", access: "user" },
  { path: "/ideas/new", access: "user", exact: true },
];

/** Who may open `pathname`. Shared by the proxy and documented in README. */
export function requiredAccess(pathname: string): Access {
  const path =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  const rule = RULES.find(
    (candidate) =>
      path === candidate.path ||
      (!candidate.exact && path.startsWith(`${candidate.path}/`)),
  );
  return rule?.access ?? "public";
}

// Read-only admin pages that ADMIN_PREVIEW=true opens to everyone. Forms and
// server actions still require an admin (see src/lib/auth/admin.ts).
const ADMIN_PREVIEW_PATHS = [
  "/admin",
  "/admin/innovations",
  "/admin/moderation",
  "/admin/trends",
];

/** True for admin pages the proxy lets through when ADMIN_PREVIEW=true. */
export function isAdminPreviewPath(pathname: string): boolean {
  const path =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  return ADMIN_PREVIEW_PATHS.includes(path);
}
