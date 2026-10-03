import { expect, it } from "vitest";
import { loginPath, safeNext } from "@/lib/auth/redirect";

it.each([
  ["/messages", "/messages"],
  ["/admin/ideas?tab=new#top", "/admin/ideas?tab=new#top"],
  ["/", "/"],
])("keeps the relative path %s", (value, expected) => {
  expect(safeNext(value)).toBe(expected);
});

it.each([
  "//evil.com",
  "/\\evil.com",
  "https://evil.com",
  "javascript:alert(1)",
  "messages",
  "",
  "/ok\nSet-Cookie: x=1",
  null,
  undefined,
  ["/messages"],
])("falls back to / for %j", (value) => {
  expect(safeNext(value)).toBe("/");
});

it("builds the login path with an encoded next", () => {
  expect(loginPath("/messages")).toBe("/login?next=%2Fmessages");
  expect(loginPath("/admin/ideas?tab=new")).toBe(
    "/login?next=%2Fadmin%2Fideas%3Ftab%3Dnew",
  );
  expect(loginPath()).toBe("/login");
  expect(loginPath("//evil.com")).toBe("/login");
});
