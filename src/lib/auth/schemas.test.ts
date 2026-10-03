import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "@/lib/auth/schemas";

const valid = {
  displayName: "Anna Przykładowa",
  email: "anna@hubmi.example",
  password: "haslo-testowe",
  role: "expert",
  municipality: "Wieliczka",
};

function firstError(input: unknown) {
  const result = signUpSchema.safeParse(input);
  return result.success ? null : result.error.issues[0].message;
}

describe("signUpSchema", () => {
  it("accepts a complete form and trims text fields", () => {
    const result = signUpSchema.parse({
      ...valid,
      displayName: "  Anna Przykładowa ",
      email: " anna@hubmi.example ",
      municipality: " Wieliczka ",
    });
    expect(result).toEqual(valid);
  });

  it("allows an empty municipality", () => {
    expect(
      signUpSchema.parse({ ...valid, municipality: "" }).municipality,
    ).toBe("");
  });

  it("requires at least 8 characters in the password", () => {
    expect(firstError({ ...valid, password: "1234567" })).toBe(
      "Hasło musi mieć co najmniej 8 znaków.",
    );
  });

  it("rejects the admin role and unknown roles", () => {
    expect(firstError({ ...valid, role: "admin" })).toBe(
      "Wybierz, kim jesteś.",
    );
    expect(firstError({ ...valid, role: undefined })).toBe(
      "Wybierz, kim jesteś.",
    );
  });

  it("rejects a malformed e-mail and a blank name", () => {
    expect(firstError({ ...valid, email: "anna" })).toMatch(/poprawny adres/);
    expect(firstError({ ...valid, email: "" })).toBe("Podaj adres e-mail.");
    expect(firstError({ ...valid, displayName: " " })).toMatch(
      /imię lub nazwę/,
    );
  });
});

describe("signInSchema", () => {
  it("requires both fields", () => {
    expect(signInSchema.safeParse({ email: "", password: "" }).success).toBe(
      false,
    );
    expect(
      signInSchema.safeParse({ email: "anna@hubmi.example", password: "x" })
        .success,
    ).toBe(true);
  });
});
