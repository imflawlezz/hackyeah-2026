import { expect, it } from "vitest";
import { isAdminPreviewPath, requiredAccess } from "@/lib/auth/access";

it.each([
  ["/", "public"],
  ["/match", "public"],
  ["/login", "public"],
  ["/knowledge/abc", "public"],
  ["/ideas", "public"],
  ["/ideas/new", "user"],
  ["/ideas/new/", "user"],
  ["/ideas/new/draft", "public"],
  ["/ideas/newest", "public"],
  ["/messages", "user"],
  ["/messages/", "user"],
  ["/messages/thread-1", "user"],
  ["/messagesx", "public"],
  ["/admin", "admin"],
  ["/admin/ideas/7", "admin"],
  ["/administrator", "public"],
] as const)("%s requires %s", (pathname, access) => {
  expect(requiredAccess(pathname)).toBe(access);
});

it.each([
  ["/admin", true],
  ["/admin/", true],
  ["/admin/innovations", true],
  ["/admin/moderation", true],
  ["/admin/trends", true],
  ["/admin/innovations/new", false],
  ["/admin/innovations/abc/edit", false],
  ["/admin/trendsx", false],
  ["/messages", false],
] as const)("admin preview path %s → %s", (pathname, open) => {
  expect(isAdminPreviewPath(pathname)).toBe(open);
});
