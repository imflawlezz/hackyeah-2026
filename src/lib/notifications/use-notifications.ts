"use client";
import { useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import { createNotificationStore, unreadCount } from "./store";

let store: ReturnType<typeof createNotificationStore> | undefined;

export function getNotificationStore() {
  store ??= createNotificationStore(createClient);
  return store;
}

export function useNotifications() {
  const s = getNotificationStore();
  const snapshot = useSyncExternalStore(
    s.subscribe,
    s.getSnapshot,
    s.getServerSnapshot,
  );
  return {
    ...snapshot,
    unread: unreadCount(snapshot.notifications),
    markRead: s.markRead,
  };
}
