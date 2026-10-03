import { expect, it } from "vitest";
import { requiredAccess } from "@/lib/auth/access";

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
