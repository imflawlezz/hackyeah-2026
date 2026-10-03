import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { getMockStore } from "@/lib/messages/mock-store";
import type { Notification } from "@/types";

/**
 * One shared notification source for the header bell(s) and /notifications.
 *
 * - "demo": Supabase is not configured; notifications live in this browser.
 * - "signed-out": Supabase is configured but nobody is signed in.
 * - "ready": the signed-in user's rows, read with the RLS browser client and
 *   kept fresh with Realtime.
 */
export type NotificationStatus =
  "loading" | "demo" | "signed-out" | "ready" | "error";

export type NotificationSnapshot = {
  status: NotificationStatus;
  notifications: Notification[];
  error: string;
};

type Row = {
  id: string;
  user_id: string;
  type: Notification["type"];
  title: string;
  body: string;
  link: string;
  read_at: string | null;
  created_at: string;
};

export const NOTIFICATION_LIMIT = 50;
const LOAD_ERROR =
  "Nie udało się pobrać powiadomień. Odśwież stronę i spróbuj ponownie.";
const READ_ERROR = "Nie udało się oznaczyć powiadomień. Spróbuj ponownie.";

export function toNotification(row: Row): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body ?? "",
    link: row.link?.startsWith("/") ? row.link : "/notifications",
    ...(row.read_at ? { readAt: row.read_at } : {}),
    createdAt: row.created_at,
  };
}

export function unreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.readAt).length;
}

const INITIAL: NotificationSnapshot = {
  status: "loading",
  notifications: [],
  error: "",
};

export function createNotificationStore(
  getClient: () => SupabaseClient | null,
) {
  let snapshot: NotificationSnapshot = INITIAL;
  let started = false;
  let client: SupabaseClient | null = null;
  let userId = "";
  let channel: RealtimeChannel | null = null;
  let stopDemo: (() => void) | null = null;
  let loadId = 0;
  const listeners = new Set<() => void>();

  const set = (next: Partial<NotificationSnapshot>) => {
    snapshot = { ...snapshot, ...next };
    listeners.forEach((fn) => fn());
  };

  async function fetchRows(): Promise<void> {
    if (!client || !userId) return;
    const id = ++loadId;
    const { data, error } = await client
      .from("notifications")
      .select("id,user_id,type,title,body,link,read_at,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(NOTIFICATION_LIMIT);
    if (id !== loadId) return;
    if (error) {
      set({ status: "error", error: LOAD_ERROR });
      return;
    }
    set({
      status: "ready",
      error: "",
      notifications: (data as Row[]).map(toNotification),
    });
  }

  function unsubscribe() {
    if (channel && client) void client.removeChannel(channel);
    channel = null;
  }

  async function syncSession(): Promise<void> {
    if (!client) return;
    const { data } = await client.auth.getSession();
    const nextUser = data.session?.user.id ?? "";
    if (nextUser === userId && snapshot.status !== "loading") return;
    userId = nextUser;
    unsubscribe();
    if (!userId) {
      loadId++;
      set({ status: "signed-out", notifications: [], error: "" });
      return;
    }
    set({ status: "loading", notifications: [], error: "" });
    channel = client
      .channel(`notifications-${userId}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => void fetchRows(),
      )
      .subscribe();
    await fetchRows();
  }

  function start() {
    if (started) return;
    started = true;
    client = getClient();
    if (!client) {
      const store = getMockStore();
      const sync = () =>
        set({
          status: "demo",
          error: "",
          notifications: store.getSnapshot().notifications,
        });
      sync();
      stopDemo = store.subscribe(sync);
      return;
    }
    client.auth.onAuthStateChange(() => {
      // Supabase advises against awaiting other calls inside the callback.
      setTimeout(() => void syncSession().catch(onLoadError), 0);
    });
    void syncSession().catch(onLoadError);
  }

  function onLoadError() {
    set({ status: "error", error: LOAD_ERROR });
  }

  async function markRead(id?: string): Promise<void> {
    if (snapshot.status === "demo") {
      getMockStore().markNotificationRead(id);
      return;
    }
    if (!client || !userId) return;
    const now = new Date().toISOString();
    const previous = snapshot.notifications;
    if (!previous.some((n) => !n.readAt && (!id || n.id === id))) return;
    set({
      error: "",
      notifications: previous.map((n) =>
        !n.readAt && (!id || n.id === id) ? { ...n, readAt: now } : n,
      ),
    });
    let query = client
      .from("notifications")
      .update({ read_at: now })
      .eq("user_id", userId)
      .is("read_at", null);
    if (id) query = query.eq("id", id);
    const { error } = await query;
    if (error) {
      set({ notifications: previous, error: READ_ERROR });
    }
  }

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => INITIAL,
    subscribe(fn: () => void) {
      listeners.add(fn);
      start();
      return () => {
        listeners.delete(fn);
      };
    },
    markRead,
    refresh: () => fetchRows(),
    /** Test helper: drops subscriptions and state. */
    reset() {
      unsubscribe();
      stopDemo?.();
      stopDemo = null;
      started = false;
      client = null;
      userId = "";
      snapshot = INITIAL;
      listeners.clear();
    },
  };
}
