"use client";
import Link from "next/link";
import { useState, startTransition } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useMessages } from "@/lib/messages/use-messages";
import { getMockStore } from "@/lib/messages/mock-store";
import { unreadLabel, relativeTime } from "@/lib/messages/format";
import {
  readNotification,
  loadMessages,
} from "@/app/(public)/messages/actions";
export function NotificationList() {
  const { state, setState, demo, error } = useMessages();
  const [failure, setFailure] = useState("");
  function read(id?: string) {
    if (demo) getMockStore().markNotificationRead(id);
    else
      startTransition(async () => {
        try {
          await readNotification(id);
          setState(await loadMessages());
        } catch {
          setFailure("Nie udało się oznaczyć powiadomień. Spróbuj ponownie.");
        }
      });
  }
  return (
    <div className="space-y-4">
      {demo && (
        <p className="text-sm">
          Powiadomienia demonstracyjne, zapisane w tej przeglądarce.
        </p>
      )}
      <button
        className="min-h-11 text-primary underline"
        onClick={() => read()}
      >
        Oznacz wszystkie jako przeczytane
      </button>
      {(error || failure) && <p role="alert">{error || failure}</p>}
      <ul className="divide-y">
        {state.notifications.map((n) => (
          <li key={n.id} className="space-y-2 py-4">
            <Link
              onClick={() => read(n.id)}
              className="inline-flex min-h-11 items-center text-primary underline"
              href={n.link}
            >
              {n.title}
            </Link>
            {!n.readAt && <span className="ml-2 font-semibold">Nowe</span>}
            <p>{n.body}</p>
            <time
              dateTime={n.createdAt}
              className="text-sm text-muted-foreground"
            >
              {relativeTime(n.createdAt)}
            </time>
          </li>
        ))}
      </ul>
      {!state.notifications.length && <p>Nie masz jeszcze powiadomień.</p>}
    </div>
  );
}
export function NotificationBell() {
  const { state } = useMessages();
  const count = state.notifications.filter((n) => !n.readAt).length;
  return (
    <Sheet>
      <SheetTrigger
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-sm px-2"
        aria-label={unreadLabel(count)}
      >
        <BellIcon aria-hidden="true" className="size-6" />
        <span className="text-sm font-semibold">{count}</span>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto p-6">
        <SheetHeader>
          <SheetTitle>Powiadomienia</SheetTitle>
          <SheetDescription>
            Odpowiedzi i informacje o Twoich pomysłach.
          </SheetDescription>
        </SheetHeader>
        <NotificationList />
        <Link className="min-h-11 text-primary underline" href="/notifications">
          Zobacz wszystkie powiadomienia
        </Link>
      </SheetContent>
    </Sheet>
  );
}
