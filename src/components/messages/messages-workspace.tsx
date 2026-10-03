"use client";
import Link from "next/link";
import { useEffect, useRef, useState, startTransition } from "react";
import { useMessages } from "@/lib/messages/use-messages";
import { getMockStore } from "@/lib/messages/mock-store";
import { relativeTime, roleLabels } from "@/lib/messages/format";
import { sendMessage, markRead } from "@/app/(public)/messages/actions";
import type { Message } from "@/types";
export function DemoBanner() {
  return (
    <p className="border-l-4 border-primary bg-muted p-4">
      Wersja demonstracyjna. Wiadomości są zapisywane tylko w tej przeglądarce.
    </p>
  );
}
export function MessagesWorkspace({ id }: { id?: string }) {
  const { state, demo, userId, error, ready } = useMessages(id);
  const conversation =
    state.conversations.find((c) => c.id === id) ??
    (!id ? state.conversations[0] : undefined);
  const [body, setBody] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [pending, setPending] = useState<Message[]>([]);
  const [failed, setFailed] = useState<string[]>([]);
  const bottom = useRef<HTMLDivElement>(null);
  const seen = useRef<Set<string> | null>(null);
  const cid = conversation?.id;
  const messages = state.messages.filter((m) => m.conversationId === cid);
  const displayed = [
    ...messages,
    ...pending.filter(
      (p) => p.conversationId === cid && !messages.some((m) => m.id === p.id),
    ),
  ];
  useEffect(() => {
    seen.current = null;
  }, [cid]);
  useEffect(() => {
    if (!ready || !cid) return;
    const current = state.messages.filter((m) => m.conversationId === cid);
    if (seen.current) {
      const incoming = current.filter(
        (m) => !seen.current!.has(m.id) && m.authorId !== userId,
      );
      if (incoming.length)
        setAnnouncement(
          `Nowa wiadomość od ${conversation?.people.find((p) => p.id === incoming.at(-1)?.authorId)?.displayName ?? "uczestnika rozmowy"}.`,
        );
    }
    seen.current = new Set(current.map((m) => m.id));
    bottom.current?.scrollIntoView?.({ block: "nearest" });
  }, [state.messages, cid, ready, userId, conversation?.people]);
  useEffect(() => {
    if (!ready || !cid) return;
    if (
      !id &&
      typeof window.matchMedia === "function" &&
      !window.matchMedia("(min-width: 1024px)").matches
    )
      return;
    if (demo) getMockStore().markRead(cid);
    else
      startTransition(() => {
        void markRead(cid).catch(() =>
          setAnnouncement("Nie udało się oznaczyć rozmowy jako przeczytanej."),
        );
      });
  }, [cid, demo, ready, messages.length, id]);
  async function send(retry?: Message) {
    const text = retry?.body ?? body.trim();
    if (!text || !cid) return;
    const message = retry ?? {
      id: crypto.randomUUID(),
      conversationId: cid,
      authorId: userId,
      body: text,
      createdAt: new Date().toISOString(),
    };
    if (!retry) {
      setPending((p) => [...p, message]);
      setBody("");
    }
    setFailed((f) => f.filter((id) => id !== message.id));
    try {
      if (demo) {
        getMockStore().send(cid, text);
        setPending((p) => p.filter((m) => m.id !== message.id));
      } else {
        const sent = await sendMessage(cid, text);
        setPending((p) => p.map((m) => (m.id === message.id ? sent : m)));
      }
    } catch {
      setFailed((f) => [...f, message.id]);
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl text-heading">Wiadomości</h1>
        <Link
          className="inline-flex min-h-11 items-center text-primary underline"
          href="/messages/new"
        >
          Napisz wiadomość
        </Link>
      </div>
      {demo && <DemoBanner />}
      {error && <p role="alert">{error}</p>}
      {!ready && <p role="status">Wczytujemy rozmowy…</p>}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      {ready && !state.conversations.length && !error && (
        <div>
          <p>Nie masz jeszcze żadnych rozmów.</p>
          <Link
            className="inline-flex min-h-11 items-center text-primary underline"
            href="/messages/new?kind=ask_rops"
          >
            Napisz do ROPS
          </Link>
          {" · "}
          <Link
            className="inline-flex min-h-11 items-center text-primary underline"
            href="/messages/new?kind=ask_expert"
          >
            Zapytaj eksperta
          </Link>
        </div>
      )}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <nav aria-label="Rozmowy" className={id ? "hidden lg:block" : ""}>
          <ul className="divide-y border-y">
            {[...state.conversations]
              .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
              .map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/messages/${c.id}`}
                    aria-current={cid === c.id ? "page" : undefined}
                    className="block space-y-2 p-4 hover:bg-muted aria-[current=page]:bg-muted"
                  >
                    <span className="block font-semibold">{c.subject}</span>
                    <span className="block text-sm">
                      {c.people
                        .filter((p) => p.id !== userId)
                        .map((p) => `${p.displayName} · ${roleLabels[p.role]}`)
                        .join(", ")}
                    </span>
                    <span className="block truncate text-muted-foreground">
                      {c.preview}
                    </span>
                    <time dateTime={c.lastMessageAt} className="text-sm">
                      {relativeTime(c.lastMessageAt)}
                    </time>
                    {c.unread && (
                      <span className="ml-4 text-sm font-semibold">
                        <span aria-hidden="true">● </span>Nowe
                      </span>
                    )}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
        <section
          className={id ? "min-w-0" : "hidden min-w-0 lg:block"}
          aria-label="Treść rozmowy"
        >
          {id && (
            <Link
              href="/messages"
              className="inline-flex min-h-11 items-center text-primary underline lg:hidden"
            >
              Wróć do rozmów
            </Link>
          )}
          {conversation ? (
            <>
              <h2 className="mb-4 text-2xl text-heading">
                {conversation.subject}
              </h2>
              {(conversation.innovationId || conversation.ideaId) && (
                <p className="mb-4 border bg-muted p-4">
                  Rozmowa dotyczy:{" "}
                  <Link
                    className="text-primary underline"
                    href={
                      conversation.innovationId
                        ? `/knowledge/${conversation.innovationId}`
                        : `/ideas/${conversation.ideaId}`
                    }
                  >
                    {conversation.innovationId
                      ? "Zobacz innowację"
                      : "Zobacz pomysł"}
                  </Link>
                </p>
              )}
              <div
                role="log"
                aria-label="Wiadomości w rozmowie"
                aria-live="off"
                className="max-h-[55vh] overflow-y-auto border-y py-6"
              >
                <ol className="space-y-6">
                  {displayed.map((m) => (
                    <li key={m.id} className="border-l-2 border-primary pl-4">
                      <p className="font-semibold">
                        {conversation.people.find((p) => p.id === m.authorId)
                          ?.displayName ?? "Uczestnik rozmowy"}
                      </p>
                      <time
                        className="text-sm text-muted-foreground"
                        dateTime={m.createdAt}
                      >
                        {new Intl.DateTimeFormat("pl", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(m.createdAt))}
                      </time>
                      <p className="mt-2 break-words whitespace-pre-wrap">
                        {m.body}
                      </p>
                      {failed.includes(m.id) && (
                        <div role="alert">
                          <p>Nie udało się wysłać. Spróbuj ponownie.</p>
                          <button
                            className="min-h-11 text-primary underline"
                            onClick={() =>
                              startTransition(() => {
                                void send(m);
                              })
                            }
                          >
                            Spróbuj ponownie
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                  <li aria-hidden="true">
                    <div ref={bottom} />
                  </li>
                </ol>
              </div>
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  startTransition(() => {
                    void send();
                  });
                }}
              >
                <label htmlFor="message-body" className="block font-semibold">
                  Twoja wiadomość
                </label>
                <textarea
                  id="message-body"
                  className="min-h-32 w-full rounded-sm border border-input p-3"
                  required
                  maxLength={4000}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                />
                <button
                  disabled={!body.trim()}
                  className="min-h-11 rounded-sm bg-primary px-6 py-2 text-primary-foreground disabled:opacity-50"
                >
                  Wyślij
                </button>
              </form>
            </>
          ) : (
            ready &&
            id && (
              <p>Nie znaleźliśmy tej rozmowy lub nie masz do niej dostępu.</p>
            )
          )}
        </section>
      </div>
    </div>
  );
}
