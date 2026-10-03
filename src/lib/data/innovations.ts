import { innovations as mockInnovations } from "@/lib/mocks/innovations";
import { createClient, hasSupabase } from "@/lib/supabase/server";
import type { Innovation } from "@/types";

type InnovationRow = {
  id: string;
  title: string;
  description?: string | null;
  summary?: string | null;
  category: string;
  target_group: string;
  region?: string | null;
  tags?: string[] | null;
  video_url?: string | null;
  image_url?: string | null;
  created_at?: string | null;
};

// Explicit list so the 1536-float embedding never leaves the database.
const INNOVATION_COLUMNS =
  "id, title, summary, description, category, target_group, region, tags, video_url, image_url, created_at";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function toInnovation(row: InnovationRow): Innovation {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary ?? undefined,
    description: row.description ?? row.summary ?? "",
    category: row.category,
    targetGroup: row.target_group,
    region: row.region ?? undefined,
    tags: row.tags ?? [],
    videoUrl: row.video_url ?? undefined,
    imageUrl: row.image_url ?? undefined,
    createdAt: row.created_at ?? "",
  };
}

function byTitle(left: Innovation, right: Innovation): number {
  return left.title.localeCompare(right.title, "pl");
}

function mockList(): Innovation[] {
  return [...mockInnovations].sort(byTitle);
}

/** Library contents: the database when configured and reachable, otherwise the mocks. */
export async function getInnovations(): Promise<Innovation[]> {
  if (!hasSupabase) return mockList();
  // Outside the try block: createClient() reads cookies, and Next.js signals
  // "render this route on request" by throwing from there during the build.
  const client = await createClient();
  if (!client) return mockList();
  try {
    const { data, error } = await client
      .from("innovations")
      .select(INNOVATION_COLUMNS)
      .order("title");
    if (error) {
      console.warn("Innovations fallback to mocks", { cause: "query failed" });
      return mockList();
    }
    if (!data?.length) {
      console.warn("Innovations fallback to mocks", { cause: "no rows" });
      return mockList();
    }
    // Sorted again here because the database collation is not Polish.
    return (data as InnovationRow[]).map(toInnovation).sort(byTitle);
  } catch {
    console.warn("Innovations fallback to mocks", { cause: "query threw" });
    return mockList();
  }
}

/** Accepts a database uuid or a mock slug. Returns null for anything unknown. */
export async function getInnovationById(
  id: string,
): Promise<Innovation | null> {
  // A non-uuid would make Postgres reject the query, so it never reaches it.
  if (hasSupabase && UUID_PATTERN.test(id)) {
    const client = await createClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("innovations")
          .select(INNOVATION_COLUMNS)
          .eq("id", id)
          .maybeSingle();
        if (data) return toInnovation(data as InnovationRow);
        if (error) {
          console.warn("Innovation fallback to mocks", {
            cause: "query failed",
          });
        }
      } catch {
        console.warn("Innovation fallback to mocks", { cause: "query threw" });
      }
    }
  }
  return mockInnovations.find((innovation) => innovation.id === id) ?? null;
}
