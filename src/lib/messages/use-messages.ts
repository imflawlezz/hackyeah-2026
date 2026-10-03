"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMockStore, seed, type MessageState } from "./mock-store";
import { loadMessages } from "@/app/(public)/messages/actions";
export function useMessages(conversationId?: string) {
  const [state, setState] = useState<MessageState>({
    conversations: [],
    messages: [],
    notifications: [],
  });
  const [demo, setDemo] = useState(false);
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    let cleanup = () => {};
    const refresh = async () => {
      const result = await loadMessages();
      if (!active) return result;
      setDemo(result.demo);
      setUserId(result.userId);
      setState(result.demo ? getMockStore().getSnapshot() : result);
      setReady(true);
      return result;
    };
    void refresh()
      .then((result) => {
        if (!active) return;
        if (result.demo) {
          const store = getMockStore();
          setState(store.getSnapshot() ?? seed);
          cleanup = store.subscribe(() => setState(store.getSnapshot()));
        } else {
          const client = createClient();
          if (!client) return;
          const channel = client
            .channel(`messages-${crypto.randomUUID()}`)
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "messages",
                ...(conversationId
                  ? { filter: `conversation_id=eq.${conversationId}` }
                  : {}),
              },
              () => {
                void refresh().catch(() =>
                  setError(
                    "Nie udało się odświeżyć wiadomości. Odśwież stronę.",
                  ),
                );
              },
            )
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "notifications",
                filter: `user_id=eq.${result.userId}`,
              },
              () => {
                void refresh().catch(() =>
                  setError("Nie udało się odświeżyć powiadomień."),
                );
              },
            )
            .subscribe();
          cleanup = () => {
            void client.removeChannel(channel);
          };
        }
      })
      .catch(() => {
        if (active) {
          setError(
            "Nie udało się pobrać wiadomości. Odśwież stronę i spróbuj ponownie.",
          );
          setReady(true);
        }
      });
    return () => {
      active = false;
      cleanup();
    };
  }, [conversationId]);
  return { state, setState, demo, userId, error, ready };
}
