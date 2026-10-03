import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { innovations as mockInnovations } from "@/lib/mocks/innovations";

const mocks = vi.hoisted(() => ({ client: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  hasSupabase: true,
  createClient: mocks.client,
}));
import { getInnovationById, getInnovations } from "./innovations";

const UUID = "00000000-0000-4000-8000-000000000008";

function row(title: string, id = UUID) {
  return {
    id,
    title,
    summary: "Skrót",
    description: "Opis",
    category: "Młodzież",
    target_group: "Dzieci i młodzież szkolna",
    region: "powiat chrzanowski",
    tags: ["młodzież"],
    video_url: null,
    image_url: null,
    created_at: "2025-06-01T08:00:00+00:00",
  };
}

type Result = { data: unknown; error: unknown };

function clientReturning(list: Result, single: Result = list) {
  const select = vi.fn();
  const eq = vi.fn();
  select.mockReturnValue({
    order: () => Promise.resolve(list),
    eq: eq.mockReturnValue({ maybeSingle: () => Promise.resolve(single) }),
  });
  const from = vi.fn().mockReturnValue({ select });
  mocks.client.mockResolvedValue({ from });
  return { from, select, eq };
}

const warn = vi.spyOn(console, "warn");

beforeEach(() => {
  warn.mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
});

it("lists database rows in Polish title order and never selects the embedding", async () => {
  const { from, select } = clientReturning({
    data: [row("Żłobek", "a"), row("Świetlica", "b"), row("Bank czasu", "c")],
    error: null,
  });

  const list = await getInnovations();

  expect(from).toHaveBeenCalledWith("innovations");
  const columns = select.mock.calls[0]![0] as string;
  expect(columns).not.toContain("embedding");
  expect(columns).not.toContain("*");
  expect(list.map(({ title }) => title)).toEqual([
    "Bank czasu",
    "Świetlica",
    "Żłobek",
  ]);
  expect(list[0]).toMatchObject({
    targetGroup: "Dzieci i młodzież szkolna",
    region: "powiat chrzanowski",
    summary: "Skrót",
  });
  expect(warn).not.toHaveBeenCalled();
});

it.each([
  ["a query error", { data: null, error: { message: "boom" } }],
  ["an empty table", { data: [], error: null }],
])("falls back to the mocks on %s", async (_name, result) => {
  clientReturning(result);
  const list = await getInnovations();
  expect(list).toHaveLength(mockInnovations.length);
  expect(warn).toHaveBeenCalledTimes(1);
});

it("falls back to the mocks when the query throws", async () => {
  mocks.client.mockResolvedValue({
    from: () => {
      throw new Error("network down");
    },
  });
  expect(await getInnovations()).toHaveLength(mockInnovations.length);
  expect(await getInnovationById("inn-after-school")).not.toBeNull();
  expect(await getInnovationById(UUID)).toBeNull();
  expect(warn).toHaveBeenCalledTimes(2);
});

it("lets the render-on-request signal from createClient through", async () => {
  const signal = new Error("Dynamic server usage");
  mocks.client.mockRejectedValue(signal);
  await expect(getInnovations()).rejects.toBe(signal);
  await expect(getInnovationById(UUID)).rejects.toBe(signal);
  expect(warn).not.toHaveBeenCalled();
});

it("loads one innovation by uuid", async () => {
  const { eq, select } = clientReturning({
    data: row("Świetlica otwarta po lekcjach"),
    error: null,
  });
  const innovation = await getInnovationById(UUID);
  expect(eq).toHaveBeenCalledWith("id", UUID);
  expect(select.mock.calls[0]![0]).not.toContain("embedding");
  expect(innovation?.title).toBe("Świetlica otwarta po lekcjach");
});

it("answers slugs from the mocks without querying", async () => {
  const { from } = clientReturning({ data: null, error: null });
  const innovation = await getInnovationById("inn-telecare");
  expect(innovation?.title).toBe("Teleopieka sąsiedzka");
  expect(from).not.toHaveBeenCalled();
});

it("returns null for an unknown uuid and for a malformed one", async () => {
  const { from } = clientReturning({ data: null, error: null });
  await expect(getInnovationById(UUID)).resolves.toBeNull();
  expect(from).toHaveBeenCalledTimes(1);
  await expect(getInnovationById(`${UUID}x`)).resolves.toBeNull();
  await expect(getInnovationById("../admin")).resolves.toBeNull();
  expect(from).toHaveBeenCalledTimes(1);
});
