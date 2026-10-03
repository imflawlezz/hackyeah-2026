import { describe, expect, it } from "vitest";
import {
  ROLE_LABELS,
  SIGNUP_ROLES,
  sanitizeSignupRole,
} from "@/lib/auth/roles";

describe("sanitizeSignupRole", () => {
  it.each(SIGNUP_ROLES)("keeps the sign-up role %s", (role) => {
    expect(sanitizeSignupRole(role)).toBe(role);
  });

  it.each([
    "admin",
    "ADMIN",
    "superuser",
    "",
    " expert",
    null,
    undefined,
    1,
    {},
  ])("turns %j into resident", (value) => {
    expect(sanitizeSignupRole(value)).toBe("resident");
  });
});

it("labels every role in Polish", () => {
  expect(ROLE_LABELS).toEqual({
    resident: "Mieszkaniec lub organizacja",
    jst: "Samorząd (JST)",
    expert: "Ekspert",
    admin: "Administrator ROPS",
  });
});
