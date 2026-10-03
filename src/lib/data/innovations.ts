import type { Innovation } from "@/types";

type InnovationRow = {
  id: string;
  title: string;
  description?: string | null;
  summary?: string | null;
  category: string;
  target_group: string;
  tags?: string[] | null;
  video_url?: string | null;
  image_url?: string | null;
  created_at?: string | null;
};

export function toInnovation(row: InnovationRow): Innovation {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? row.summary ?? "",
    category: row.category,
    targetGroup: row.target_group,
    tags: row.tags ?? [],
    videoUrl: row.video_url ?? undefined,
    imageUrl: row.image_url ?? undefined,
    createdAt: row.created_at ?? "",
  };
}
