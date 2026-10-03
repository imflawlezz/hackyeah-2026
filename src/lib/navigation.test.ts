import { expect, it } from "vitest";
import { isCurrentRoute } from "@/lib/navigation";

it("matches the exact route", () => {
  expect(isCurrentRoute("/knowledge", "/knowledge")).toBe(true);
});

it("matches nested routes", () => {
  expect(isCurrentRoute("/knowledge/abc", "/knowledge")).toBe(true);
});

it("does not match a route that only shares a prefix", () => {
  expect(isCurrentRoute("/testing", "/test")).toBe(false);
});

it("matches the home page only exactly", () => {
  expect(isCurrentRoute("/", "/")).toBe(true);
  expect(isCurrentRoute("/match", "/")).toBe(false);
});
