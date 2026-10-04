import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  createClient: vi.fn(),
  redirect: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { signInAsDemo } from "./demo-actions";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("DEMO_LOGIN_ENABLED", "true");
  vi.stubEnv("DEMO_USER_PASSWORD", "fictional-test-secret");
  mocks.createClient.mockResolvedValue({
    auth: { signInWithPassword: mocks.signIn },
  });
  mocks.signIn.mockResolvedValue({ error: null });
  mocks.redirect.mockImplementation(() => {
    throw new Error("NEXT_REDIRECT");
  });
});
afterEach(() => vi.unstubAllEnvs());

it.each([undefined, "false", "TRUE"])(
  "refuses disabled flag %s",
  async (flag) => {
    vi.stubEnv("DEMO_LOGIN_ENABLED", flag);
    expect(await signInAsDemo("admin")).toHaveProperty("error");
    expect(mocks.createClient).not.toHaveBeenCalled();
  },
);
it.each(["owner", "__proto__", "constructor", null, {}, 1])(
  "rejects invalid role %s",
  async (role) => {
    expect(await signInAsDemo(role)).toHaveProperty("error");
    expect(mocks.createClient).not.toHaveBeenCalled();
  },
);
it.each([
  ["resident", "/ideas/new"],
  ["jst", "/institutions"],
  ["expert", "/messages"],
  ["admin", "/admin/moderation"],
])("signs in %s and redirects", async (role, path) => {
  await expect(signInAsDemo(role)).rejects.toThrow("NEXT_REDIRECT");
  expect(mocks.signIn).toHaveBeenCalledWith({
    email: `${role}@hubmi.example`,
    password: "fictional-test-secret",
  });
  expect(mocks.revalidate).toHaveBeenCalledWith("/", "layout");
  expect(mocks.redirect).toHaveBeenCalledWith(path);
});
it("does not expose provider errors or secrets", async () => {
  mocks.signIn.mockRejectedValue(new Error("fictional-test-secret"));
  const result = await signInAsDemo("resident");
  expect(result).toHaveProperty("error");
  expect(JSON.stringify(result)).not.toContain("fictional-test-secret");
  expect(mocks.redirect).not.toHaveBeenCalled();
});
it("refuses missing password", async () => {
  vi.stubEnv("DEMO_USER_PASSWORD", "");
  expect(await signInAsDemo("resident")).toHaveProperty("error");
  expect(mocks.createClient).not.toHaveBeenCalled();
});
it("refuses unconfigured Supabase and failed credentials", async () => {
  mocks.createClient.mockResolvedValueOnce(null);
  expect(await signInAsDemo("resident")).toHaveProperty("error");
  mocks.signIn.mockResolvedValueOnce({ error: { message: "secret" } });
  expect(await signInAsDemo("resident")).toHaveProperty("error");
  expect(mocks.redirect).not.toHaveBeenCalled();
});
