import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
  createClient: vi.fn(),
  redirect: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/headers", () => ({ headers: vi.fn() }));
import { signOut } from "./actions";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.createClient.mockResolvedValue({ auth: { signOut: mocks.signOut } });
  mocks.signOut.mockResolvedValue({ error: null });
  mocks.redirect.mockImplementation(() => {
    throw new Error("NEXT_REDIRECT");
  });
});

it("signs out only this browser, so others on a shared demo account stay signed in", async () => {
  await expect(signOut()).rejects.toThrow("NEXT_REDIRECT");
  expect(mocks.signOut).toHaveBeenCalledTimes(1);
  expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  expect(mocks.redirect).toHaveBeenCalledWith("/");
});
