"use client";

import { useSyncExternalStore } from "react";
import type { FeedbackScores } from "@/lib/testing/summary";
import type { Rating } from "@/types";

// Demo mode (no Supabase): sign-ups and opinions stay in this browser only.

const SIGNUPS_KEY = "hubmi-test-signups";
const FEEDBACK_KEY = "hubmi-test-feedback";

export type LocalFeedback = FeedbackScores & { innovationId: string };

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function read(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "[]";
  } catch {
    return "[]";
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked; the page still works for this visit.
  }
  for (const listener of listeners) listener();
}

function parseList(raw: string): unknown[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isRating(value: unknown): value is Rating {
  return typeof value === "number" && [1, 2, 3, 4, 5].includes(value);
}

export function parseSignups(raw: string): string[] {
  return parseList(raw).filter((item) => typeof item === "string");
}

export function parseFeedback(raw: string): LocalFeedback[] {
  return parseList(raw).flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const entry = item as Record<string, unknown>;
    if (typeof entry.innovationId !== "string" || !isRating(entry.rating)) {
      return [];
    }
    return [
      {
        innovationId: entry.innovationId,
        rating: entry.rating,
        easeOfUse: isRating(entry.easeOfUse) ? entry.easeOfUse : undefined,
        wouldRecommend:
          typeof entry.wouldRecommend === "boolean"
            ? entry.wouldRecommend
            : undefined,
      },
    ];
  });
}

// useSyncExternalStore needs a stable snapshot, so the raw string is the
// snapshot and parsing is cached per string.
function cached<T>(parse: (raw: string) => T): (raw: string) => T {
  let lastRaw: string | null = null;
  let lastValue: T;
  return (raw) => {
    if (raw !== lastRaw) {
      lastRaw = raw;
      lastValue = parse(raw);
    }
    return lastValue;
  };
}

const signupsFrom = cached(parseSignups);
const feedbackFrom = cached(parseFeedback);

/** Ids of the tests signed up for in this browser. Empty during server rendering. */
export function useLocalSignups(): string[] {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(SIGNUPS_KEY),
    () => "[]",
  );
  return signupsFrom(raw);
}

/** Opinions given in this browser. Empty during server rendering. */
export function useLocalFeedback(): LocalFeedback[] {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(FEEDBACK_KEY),
    () => "[]",
  );
  return feedbackFrom(raw);
}

export function addLocalSignup(testId: string): void {
  const current = parseSignups(read(SIGNUPS_KEY));
  if (!current.includes(testId)) write(SIGNUPS_KEY, [...current, testId]);
}

export function addLocalFeedback(entry: LocalFeedback): void {
  write(FEEDBACK_KEY, [...parseFeedback(read(FEEDBACK_KEY)), entry]);
}
