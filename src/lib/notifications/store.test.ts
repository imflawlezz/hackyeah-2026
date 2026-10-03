import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createNotificationStore, unreadCount } from "./store";

const rows = [
  {
    id: "n1",
    user_id: "u1",
    type: "message",
    title: "Nowa wiadomość",
    body: "Treść",
    link: "/messages/c1",
    read_at: null,
    created_at: "2026-10-03T10:00:00Z",
  },
  {
    id: "n2",
    user_id: "u1",
    type: "idea_reviewed",
    title: "Pomysł oceniony",
    body: "",
    link: "https://example.com",
    read_at: "2026-10-02T10:00:00Z",
    created_at: "2026-10-02T09:00:00Z",
  },
];

function fakeClient({
  userId,
  updateError = null,
}: {
  userId: string | null;
  updateError?: { message: string } | null;
}) {
  const update = vi.fn();
  const updateFilters: [string, string, unknown][] = [];
  const updateQuery = {
    eq(col: string, val: unknown) {
      updateFilters.push(["eq", col, val]);
      return updateQuery;
    },
    is(col: string, val: unknown) {
      updateFilters.push(["is", col, val]);
      return updateQuery;
    },
    then(resolve: (v: unknown) => void) {
      resolve({ error: updateError });
    },
  };
  const selectQuery = {
    eq: () => selectQuery,
    order: () => selectQuery,
    limit: async () => ({ data: rows, error: null }),
  };
  const channel = { on: () => channel, subscribe: () => channel };
  const client = {
    auth: {
      getSession: async () => ({
        data: { session: userId ? { user: { id: userId } } : null },
      }),
      onAuthStateChange: vi.fn(),
    },
    from: () => ({
      select: () => selectQuery,
      update: (values: unknown) => {
        update(values);
        return updateQuery;
      },
    }),
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(),
  };
  return {
    client: client as unknown as SupabaseClient,
    update,
    updateFilters,
    channel: client.channel,
  };
}

async function settle() {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

describe("notification store", () => {
  it("asks a signed-out visitor to sign in instead of showing demo data", async () => {
    const { client } = fakeClient({ userId: null });
    const store = createNotificationStore(() => client);
    store.subscribe(() => {});
    await vi.waitFor(() =>
      expect(store.getSnapshot().status).toBe("signed-out"),
    );
    expect(store.getSnapshot().notifications).toEqual([]);
  });

  it("loads the signed-in user's rows and subscribes to Realtime", async () => {
    const { client, channel } = fakeClient({ userId: "u1" });
    const store = createNotificationStore(() => client);
    expect(store.getSnapshot().status).toBe("loading");
    store.subscribe(() => {});
    await vi.waitFor(() => expect(store.getSnapshot().status).toBe("ready"));
    const { notifications } = store.getSnapshot();
    expect(notifications.map((n) => n.id)).toEqual(["n1", "n2"]);
    expect(notifications[1]!.link).toBe("/notifications");
    expect(unreadCount(notifications)).toBe(1);
    expect(channel).toHaveBeenCalledTimes(1);
  });

  it("marks notifications read in the database", async () => {
    const { client, update, updateFilters } = fakeClient({ userId: "u1" });
    const store = createNotificationStore(() => client);
    store.subscribe(() => {});
    await vi.waitFor(() => expect(store.getSnapshot().status).toBe("ready"));

    await store.markRead("n1");
    expect(update).toHaveBeenCalledWith({ read_at: expect.any(String) });
    expect(updateFilters).toContainEqual(["eq", "id", "n1"]);
    expect(updateFilters).toContainEqual(["eq", "user_id", "u1"]);
    expect(unreadCount(store.getSnapshot().notifications)).toBe(0);
  });

  it("restores the unread state when the update fails", async () => {
    const { client } = fakeClient({
      userId: "u1",
      updateError: { message: "denied" },
    });
    const store = createNotificationStore(() => client);
    store.subscribe(() => {});
    await vi.waitFor(() => expect(store.getSnapshot().status).toBe("ready"));

    await store.markRead();
    await settle();
    expect(unreadCount(store.getSnapshot().notifications)).toBe(1);
    expect(store.getSnapshot().error).toMatch(/Nie udało się oznaczyć/);
  });
});
