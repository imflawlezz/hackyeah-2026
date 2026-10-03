/** True when `pathname` is `href` or a route nested under it. */
export function isCurrentRoute(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
