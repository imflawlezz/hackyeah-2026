import { describe, expect, it } from "vitest";
import { innovations } from "@/lib/mocks/innovations";
import { createRateLimiter } from "@/lib/rate-limit";
import {
  implementationPlanSchema,
  institutionProfileSchema,
} from "@/lib/validators";
import type { BudgetBand, InstitutionProfile } from "@/types";
import { ruralProfile, validDraft } from "./fixtures";
import {
  parseStoredProfile,
  PROFILE_FORM_DEFAULTS,
  profileFormSchema,
} from "./form";
import {
  BUDGET_BAND_RANGE,
  formatPln,
  formatPlnRange,
  peopleText,
  weeksText,
} from "./labels";
import { PLAN_SECTIONS, planToMarkdown } from "./plan-markdown";
import { checkPlanDraft } from "./plan-service";
import { profileToProblem } from "./problem-text";
import { buildTemplatePlan } from "./template-plan";

const telecare = innovations.find(({ id }) => id === "inn-telecare")!;
// Intl separates thousands with a non-breaking space.
const nbsp = (text: string) => text.replace(/ (?=\d{3}|zł)/g, " ");

describe("institutionProfileSchema", () => {
  it("accepts a complete profile and an omitted municipality type", () => {
    expect(institutionProfileSchema.parse(ruralProfile)).toEqual(ruralProfile);
    const { municipalityType: _omitted, ...rest } = ruralProfile;
    void _omitted;
    expect(institutionProfileSchema.safeParse(rest).success).toBe(true);
  });

  it.each([
    ["an unknown institution type", { institutionType: "bank" }],
    ["an unknown budget band", { budgetBand: "1m" }],
    ["too many staff", { staffAvailable: 21 }],
    ["fractional staff", { staffAvailable: 1.5 }],
    ["a need under 10 characters", { need: "za krótko" }],
    ["a need over 1500 characters", { need: "a".repeat(1501) }],
    ["constraints over 1000 characters", { constraints: "a".repeat(1001) }],
    ["a timeline outside 3, 6, 12", { timeline: 9 }],
    ["an empty target group", { targetGroup: "  " }],
  ])("rejects %s", (_name, change) => {
    expect(
      institutionProfileSchema.safeParse({ ...ruralProfile, ...change })
        .success,
    ).toBe(false);
  });
});

describe("profileFormSchema", () => {
  const filled = {
    institutionType: "gmina",
    municipalityType: "wiejska",
    populationBand: "5-20k",
    budgetBand: "20-100k",
    staffAvailable: " 2 ",
    targetGroup: " samotni seniorzy z przysiółków ",
    need: "Seniorzy mieszkający samotnie nie mają z kim porozmawiać w ciągu dnia.",
    constraints: "",
    timeline: "6",
  };

  it("turns form strings into an InstitutionProfile", () => {
    const profile = profileFormSchema.parse(filled);
    expect(profile).toEqual({
      institutionType: "gmina",
      municipalityType: "wiejska",
      populationBand: "5-20k",
      budgetBand: "20-100k",
      staffAvailable: 2,
      targetGroup: "samotni seniorzy z przysiółków",
      need: filled.need,
      constraints: undefined,
      timeline: 6,
    });
    expect(institutionProfileSchema.safeParse(profile).success).toBe(true);
    expect(
      profileFormSchema.parse({ ...filled, municipalityType: "" })
        .municipalityType,
    ).toBeUndefined();
  });

  it("explains every missing answer in Polish", () => {
    const result = profileFormSchema.safeParse({
      ...PROFILE_FORM_DEFAULTS,
      // Emptied radio groups arrive as null.
      populationBand: null,
      timeline: null,
    });
    const messages = Object.fromEntries(
      result.error!.issues.map((issue) => [issue.path[0], issue.message]),
    );
    expect(messages).toEqual({
      institutionType: "Wybierz typ instytucji.",
      populationBand: "Wybierz liczbę mieszkańców.",
      budgetBand: "Wybierz roczny budżet.",
      staffAvailable: "Podaj liczbę osób od 0 do 20.",
      targetGroup: "Napisz, kogo ma objąć wsparcie.",
      need: "Opisz potrzebę. Napisz co najmniej 10 znaków.",
      timeline: "Wybierz termin.",
    });
  });

  it.each(["21", "-1", "2,5", "dwie", "", "007"])(
    "rejects %j as a staff number",
    (staffAvailable) => {
      expect(
        profileFormSchema.safeParse({ ...filled, staffAvailable }).success,
      ).toBe(false);
    },
  );

  it("accepts 0 and 20 staff", () => {
    expect(
      profileFormSchema.parse({ ...filled, staffAvailable: "0" })
        .staffAvailable,
    ).toBe(0);
    expect(
      profileFormSchema.parse({ ...filled, staffAvailable: "20" })
        .staffAvailable,
    ).toBe(20);
  });

  it("restores only known string answers from storage", () => {
    expect(
      parseStoredProfile(
        JSON.stringify({ ...filled, staffAvailable: 3, extra: "x" }),
      ),
    ).toEqual({ ...filled, staffAvailable: "" });
    expect(parseStoredProfile("not json")).toBeNull();
    expect(parseStoredProfile(null)).toBeNull();
    expect(parseStoredProfile("[]")).toEqual(PROFILE_FORM_DEFAULTS);
  });
});

describe("labels", () => {
  it("formats PLN amounts and ranges", () => {
    expect(formatPln(20000)).toBe(nbsp("20 000 zł"));
    expect(formatPlnRange(20000, 100000)).toBe(
      `${nbsp("20 000 zł")} – ${nbsp("100 000 zł")}`,
    );
    expect(formatPlnRange(500, 500)).toBe(nbsp("500 zł"));
  });

  it("uses Polish plurals for weeks and people", () => {
    expect([1, 3, 5, 22].map(weeksText)).toEqual([
      "1 tydzień",
      "3 tygodnie",
      "5 tygodni",
      "22 tygodnie",
    ]);
    expect([0, 1, 2, 5].map(peopleText)).toEqual([
      "0 osób",
      "1 osoba",
      "2 osoby",
      "5 osób",
    ]);
  });
});

describe("buildTemplatePlan", () => {
  const plan = buildTemplatePlan(ruralProfile, telecare);

  it("is a valid plan with every section filled and the template source", () => {
    expect(implementationPlanSchema.parse(plan)).toEqual(plan);
    expect(plan.source).toBe("template");
    expect(plan.innovationId).toBe("inn-telecare");
    expect(plan.title).toBe("Plan wdrożenia: Teleopieka sąsiedzka");
    for (const key of [
      "adaptations",
      "steps",
      "costs",
      "people",
      "partners",
      "risks",
      "kpis",
      "fundingOptions",
      "assumptions",
    ] as const) {
      expect(plan[key].length, key).toBeGreaterThan(0);
    }
  });

  it("follows the standard phases with owners and weeks inside the timeline", () => {
    expect(plan.steps.map(({ title }) => title)).toEqual([
      "Diagnoza potrzeb",
      "Partnerzy i zespół",
      "Pilotaż",
      "Ocena",
      "Decyzja o utrzymaniu",
    ]);
    expect(plan.steps.every(({ owner }) => owner.length > 0)).toBe(true);
    for (const timeline of [3, 6, 12] as const) {
      const { steps } = buildTemplatePlan(
        { ...ruralProfile, timeline },
        telecare,
      );
      expect(steps.every(({ weeks }) => weeks >= 1)).toBe(true);
      expect(steps.reduce((total, step) => total + step.weeks, 0)).toBe(
        { 3: 13, 6: 26, 12: 52 }[timeline],
      );
    }
  });

  it("has totals equal to the sum of the cost rows", () => {
    for (const budgetBand of Object.keys(BUDGET_BAND_RANGE) as BudgetBand[]) {
      for (const timeline of [3, 6, 12] as const) {
        const { costs, totalMinPln, totalMaxPln } = buildTemplatePlan(
          { ...ruralProfile, budgetBand, timeline },
          telecare,
        );
        expect(totalMinPln).toBe(
          costs.reduce((sum, row) => sum + row.minPln, 0),
        );
        expect(totalMaxPln).toBe(
          costs.reduce((sum, row) => sum + row.maxPln, 0),
        );
        expect(costs.every((row) => row.minPln <= row.maxPln)).toBe(true);
      }
    }
  });

  it("scales cost ranges with the budget band and the timeline", () => {
    const totals = (Object.keys(BUDGET_BAND_RANGE) as BudgetBand[]).map(
      (budgetBand) =>
        buildTemplatePlan(
          { ...ruralProfile, budgetBand, timeline: 12 },
          telecare,
        ).totalMaxPln,
    );
    expect(totals).toEqual([20_000, 100_000, 500_000, 1_000_000]);
    // Six months of a 20–100 thousand yearly budget.
    expect(plan.totalMinPln).toBe(10_000);
    expect(plan.totalMaxPln).toBe(50_000);
  });

  it("adapts to the profile: rural, small team, small budget, constraints", () => {
    expect(plan.adaptations.join(" ")).toContain("sołectwach");
    expect(plan.adaptations.join(" ")).toContain(ruralProfile.constraints);
    expect(plan.partners.map(({ type }) => type)).toContain(
      "sołtysi i koło gospodyń wiejskich",
    );
    expect(plan.fundingOptions[0]).toBe("środki własne gminy");

    const urbanNgo: InstitutionProfile = {
      ...ruralProfile,
      institutionType: "ngo",
      municipalityType: "miejska",
      budgetBand: "<20k",
      staffAvailable: 0,
      constraints: undefined,
    };
    const other = buildTemplatePlan(urbanNgo, telecare);
    expect(other.partners.map(({ type }) => type)).toContain(
      "rada osiedla lub rada seniorów",
    );
    expect(other.adaptations.join(" ")).toContain("zasobach, które już masz");
    expect(other.people[0]!.note).toContain("nie ma wolnych osób");
    expect(other.fundingOptions[0]).toBe(
      "środki własne organizacji i darowizny",
    );
    expect(other.steps[0]!.owner).toBe("koordynator w organizacji");
  });

  it("is deterministic", () => {
    expect(buildTemplatePlan(ruralProfile, telecare)).toEqual(plan);
  });

  it("names partner types, not organisations, and makes no promises with numbers", () => {
    const text = JSON.stringify([
      plan.partners,
      plan.kpis,
      plan.fundingOptions,
    ]);
    expect(text).not.toMatch(/\d+\s?%/);
    expect(text).not.toMatch(/Stowarzyszenie|Fundacja [A-ZŁŚŻ]/);
  });
});

describe("planToMarkdown", () => {
  const plan = buildTemplatePlan(ruralProfile, telecare);
  const markdown = planToMarkdown(plan, telecare, ruralProfile);

  it("matches the snapshot", () => {
    expect(markdown).toMatchSnapshot();
  });

  it("keeps the section order of the page and labels the source at the top", () => {
    const headings = markdown
      .split("\n")
      .filter((line) => line.startsWith("## "))
      .map((line) => line.slice(3));
    expect(headings).toEqual(PLAN_SECTIONS.map(({ title }) => title));
    const lines = markdown.split("\n");
    expect(lines[0]).toBe("# Plan wdrożenia: Teleopieka sąsiedzka");
    expect(lines[2]).toBe(
      "> Tekst przygotowany automatycznie. Sprawdź go przed użyciem.",
    );
    expect(lines[3]).toBe("> Plan przygotowany według szablonu, bez AI.");
    expect(markdown).toContain(
      `| **Razem** | **${nbsp("10 000 zł")} – ${nbsp("50 000 zł")}** | |`,
    );
  });

  it("omits the template label for AI plans and escapes table breakers", () => {
    const aiMarkdown = planToMarkdown(
      {
        ...plan,
        source: "ai",
        risks: [{ risk: "Koszt | czas", mitigation: "Linia 1\nLinia 2" }],
      },
      telecare,
      ruralProfile,
    );
    expect(aiMarkdown).not.toContain("według szablonu");
    expect(aiMarkdown).toContain("| Koszt \\| czas | Linia 1 Linia 2 |");
  });
});

describe("profileToProblem", () => {
  it("builds one Polish description from the profile", () => {
    expect(profileToProblem(ruralProfile)).toBe(
      "Seniorzy mieszkający samotnie nie mają z kim porozmawiać w ciągu dnia. Wsparcie ma objąć: samotni seniorzy z przysiółków. Instytucja: Gmina, gmina wiejska. Ograniczenia: Brak transportu publicznego między sołectwami.",
    );
    expect(
      profileToProblem({
        ...ruralProfile,
        need: "a".repeat(1500),
        constraints: "b".repeat(1000),
      }).length,
    ).toBeLessThanOrEqual(2000);
  });
});

describe("checkPlanDraft", () => {
  it("accepts a consistent draft and recomputes the totals", () => {
    const result = checkPlanDraft(
      { ...validDraft, totalMinPln: 10_100, totalMaxPln: 24_900 },
      ruralProfile,
      telecare,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan).toMatchObject({
      innovationId: "inn-telecare",
      source: "ai",
      totalMinPln: 10_000,
      totalMaxPln: 25_000,
    });
    // Nullable model fields become absent optional ones.
    expect(result.plan.costs[0]).toEqual({
      item: "Koordynacja",
      minPln: 8000,
      maxPln: 20000,
    });
    expect(result.plan.people[1]).toEqual({
      role: "Wolontariusze",
      note: "Do pozyskania.",
    });
    expect(implementationPlanSchema.safeParse(result.plan).success).toBe(true);
  });

  it.each([
    ["totals that do not match the rows", { totalMaxPln: 60_000 }],
    ["a minimum total above the maximum", { totalMinPln: 30_000 }],
    [
      "a row whose minimum exceeds its maximum",
      {
        costs: [
          { item: "Koordynacja", minPln: 9000, maxPln: 5000, note: null },
        ],
        totalMinPln: 9000,
        totalMaxPln: 5000,
      },
    ],
    [
      "a negative amount",
      {
        costs: [{ item: "Koordynacja", minPln: -5, maxPln: 5000, note: null }],
        totalMinPln: -5,
        totalMaxPln: 5000,
      },
    ],
    [
      "costs far above the stated budget",
      {
        costs: [
          { item: "Koordynacja", minPln: 400_000, maxPln: 500_000, note: null },
        ],
        totalMinPln: 400_000,
        totalMaxPln: 500_000,
      },
    ],
    ["an empty section", { risks: [] }],
    ["a blank summary", { summary: "   " }],
    [
      "a step without an owner",
      {
        steps: [
          { title: "Diagnoza", description: "Opis", weeks: 4, owner: "" },
        ],
      },
    ],
  ])("rejects %s", (_name, change) => {
    expect(
      checkPlanDraft({ ...validDraft, ...change }, ruralProfile, telecare).ok,
    ).toBe(false);
  });
});

describe("createRateLimiter", () => {
  it("allows `limit` requests per key per window", () => {
    const allow = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect([allow("a", 0), allow("a", 10), allow("a", 20)]).toEqual([
      true,
      true,
      false,
    ]);
    expect(allow("b", 20)).toBe(true);
    expect(allow("a", 1000)).toBe(true);
  });

  it("keeps separate counts per limiter", () => {
    const first = createRateLimiter({ limit: 1, windowMs: 1000 });
    const second = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(first("a", 0)).toBe(true);
    expect(second("a", 0)).toBe(true);
    expect(first("a", 1)).toBe(false);
  });
});
