import { innovations as mockInnovations } from "@/lib/mocks";
import { ideas as mockIdeas } from "@/lib/mocks/ideas";
import { getMockTrendProblems } from "@/lib/mocks/trends";
import type {
  AdminIdea,
  AdminInnovation,
  AdminProblem,
} from "@/lib/admin/types";

/**
 * In-memory copy used in demo mode (no Supabase). Edits live only in this
 * server process and are lost on restart, which the demo banner says.
 */
export interface DemoStore {
  innovations: AdminInnovation[];
  ideas: AdminIdea[];
  problems: AdminProblem[];
}

const DRAFT: AdminInnovation = {
  id: "inn-repair-cafe",
  title: "Kawiarenka naprawcza w świetlicy",
  summary:
    "Raz w miesiącu wolontariusze naprawiają z mieszkańcami sprzęt domowy.",
  description:
    "Raz w miesiącu w świetlicy wiejskiej wolontariusze pomagają mieszkańcom naprawić drobny sprzęt i ubrania. Spotkanie łączy pokolenia i ogranicza wydatki gospodarstw domowych.",
  category: "Aktywizacja",
  targetGroup: "Mieszkańcy małych miejscowości",
  region: "powiat myślenicki",
  tags: ["wolontariat", "sąsiedztwo", "naprawa"],
  status: "draft",
  hasEmbedding: false,
  createdAt: "2026-09-30T09:00:00.000Z",
  updatedAt: "2026-09-30T09:00:00.000Z",
};

function seed(): DemoStore {
  return {
    innovations: [
      ...mockInnovations.map((innovation, index): AdminInnovation => ({
        id: innovation.id,
        title: innovation.title,
        summary: innovation.description.split(". ")[0] + ".",
        description: innovation.description,
        category: innovation.category,
        targetGroup: innovation.targetGroup,
        region: "",
        tags: innovation.tags,
        videoUrl: innovation.videoUrl,
        imageUrl: innovation.imageUrl,
        status: "published",
        // A few rows without a vector so the backfill action has work to do.
        hasEmbedding: index % 4 !== 3,
        createdAt: innovation.createdAt,
        updatedAt: innovation.createdAt,
      })),
      DRAFT,
    ],
    ideas: mockIdeas.map((idea): AdminIdea => ({
      id: idea.id,
      title: idea.title,
      summary: idea.summary,
      targetGroup: idea.targetGroup,
      stage: idea.stage,
      status: idea.status,
      reviewNote: null,
      createdAt: idea.createdAt,
    })),
    problems: getMockTrendProblems(),
  };
}

const globalStore = globalThis as typeof globalThis & {
  __hubmiDemoStore?: DemoStore;
};

export function getDemoStore(): DemoStore {
  globalStore.__hubmiDemoStore ??= seed();
  return globalStore.__hubmiDemoStore;
}

/** For tests. */
export function resetDemoStore(): DemoStore {
  globalStore.__hubmiDemoStore = seed();
  return globalStore.__hubmiDemoStore;
}
