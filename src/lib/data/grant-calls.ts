import type { GrantCall, GrantSection } from "@/types";
import { grantCalls } from "@/lib/mocks";
import { createClient, hasSupabase } from "@/lib/supabase/server";

type GrantCallRow = {
  id: string;
  title: string;
  organizer: string;
  description: string;
  starts_at: string;
  ends_at: string;
  max_amount_pln?: number | null;
  required_sections: unknown;
  created_at: string;
};

export function isGrantCallOpen(call: GrantCall, now = new Date()): boolean {
  const time = now.getTime();
  return (
    time >= new Date(call.startsAt).getTime() &&
    time <= new Date(call.endsAt).getTime()
  );
}

export function toGrantCall(row: GrantCallRow): GrantCall {
  return {
    id: row.id,
    title: row.title,
    organizer: row.organizer,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    maxAmountPln: row.max_amount_pln ?? undefined,
    requiredSections: sectionsFromJson(row.required_sections),
    createdAt: row.created_at,
  };
}

function sectionsFromJson(value: unknown): GrantSection[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const section = item as Record<string, unknown>;
    if (
      typeof section.key !== "string" ||
      typeof section.heading !== "string" ||
      typeof section.guidance !== "string" ||
      typeof section.maxChars !== "number"
    ) {
      return [];
    }
    return [
      {
        key: section.key,
        heading: section.heading,
        guidance: section.guidance,
        maxChars: section.maxChars,
      },
    ];
  });
}

async function loadCalls(): Promise<GrantCall[]> {
  if (!hasSupabase) return grantCalls;
  try {
    const supabase = await createClient();
    if (!supabase) return grantCalls;
    const { data, error } = await supabase
      .from("grant_calls")
      .select(
        "id, title, organizer, description, starts_at, ends_at, max_amount_pln, required_sections, created_at",
      )
      .order("starts_at", { ascending: false });
    if (error || !data?.length) return grantCalls;
    return data.map((row) => toGrantCall(row as GrantCallRow));
  } catch {
    return grantCalls;
  }
}

export async function getGrantCall(id: string): Promise<GrantCall | null> {
  const calls = await loadCalls();
  return calls.find((call) => call.id === id) ?? null;
}

export async function getActiveGrantCall(
  now = new Date(),
): Promise<GrantCall | null> {
  const calls = await loadCalls();
  return calls.find((call) => isGrantCallOpen(call, now)) ?? null;
}
