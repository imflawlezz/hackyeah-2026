import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadEnvConfig } from "@next/env";
import {
  type Browser,
  type BrowserContext,
  chromium,
  type Page,
} from "playwright-core";

/**
 * Renders the UX/UI mockup set from the running application.
 *
 * 1. Frames: PNG screenshots of each screen at 1440 × 900 and 390 × 844,
 *    written to docs/mockups/frames with a manifest (frames.json).
 * 2. Board: docs/mockups/hubmi-makiety.html and .pdf, one screen per page with
 *    a Polish caption and numbered annotations placed on the frames.
 *
 * Usage: npx tsx scripts/render-mockups.ts [--only=id,id] [--board-only]
 *
 * Environment (from the shell or .env.local, never from this file):
 * - MOCKUP_BASE_URL       site to render; defaults to production
 * - DEMO_USER_PASSWORD    password of the fictional demo accounts
 * - MOCKUP_RESIDENT_EMAIL defaults to resident@hubmi.example
 * - MOCKUP_ADMIN_EMAIL    defaults to admin@hubmi.example
 * - MOCKUP_BROWSER        Playwright channel, for example "chrome" or "msedge"
 *
 * The script only reads and searches: it submits no idea, message, sign-up or
 * moderation decision. The two /match searches and the institution plan are
 * ordinary requests of the application.
 */

const PRODUCTION_URL = "https://hubml-hackyeah2026-ab.vercel.app";
const OUT_DIR = path.join(process.cwd(), "docs", "mockups");
const FRAMES_DIR = path.join(OUT_DIR, "frames");
const MANIFEST = path.join(FRAMES_DIR, "frames.json");

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, label: "Komputer, 1440 × 900" },
  mobile: { width: 390, height: 844, label: "Telefon, 390 × 844" },
} as const;
type ViewportName = keyof typeof VIEWPORTS;
const VIEWPORT_NAMES = Object.keys(VIEWPORTS) as ViewportName[];

type Role = "guest" | "resident" | "admin";
type Prefs = { theme?: "high-contrast"; font?: "largest" };

type Annotation = {
  /** Polish explanation of the UX decision. */
  text: string;
  /** Playwright selector of the element the number points at. */
  target: string;
  /** Put the number under the target instead of beside it (for controls in a row). */
  below?: boolean;
};

type Screen = {
  id: string;
  flow: number;
  /** Screen name, shown under the flow title. */
  title: string;
  caption: string;
  role?: Role;
  prefs?: Prefs;
  /** The screen is the login page itself, so ending there is not a failed sign-in. */
  onLogin?: boolean;
  /** Navigates and brings the screen to the state to capture. */
  open: (page: Page, viewport: ViewportName) => Promise<void>;
  /** CSS selector of the element scrolled to the top of the frame; the page top when omitted. */
  scrollTo?: string;
  annotations: Annotation[];
};

const FLOWS: Record<number, string> = {
  1: "Strona główna",
  2: "Znajdź rozwiązania",
  3: "Baza wiedzy",
  4: "Kreator pomysłów z asystentem",
  5: "Pomysł z odpowiedzią ROPS",
  6: "Dla instytucji",
  7: "Testowanie innowacji",
  8: "Wiadomości",
  9: "Panel administratora ROPS",
  10: "Dostępność: wysoki kontrast i A++",
  11: "Konta demonstracyjne",
};

const GOOD_QUERY =
  "Seniorzy w naszej wsi są samotni i nie mają z kim porozmawiać.";
const UNMET_QUERY = "Na drodze powiatowej jest dziura w jezdni.";
const IDEA_PROBLEM =
  "Seniorzy z naszej wsi nie mają jak dojechać do lekarza w mieście.";
const INSTITUTION_PROFILE = {
  institutionType: "ops_cus",
  municipalityType: "wiejska",
  populationBand: "5-20k",
  budgetBand: "20-100k",
  staffAvailable: "2",
  targetGroup: "Samotni seniorzy w małych miejscowościach",
  need: "Starsi mieszkańcy sołectw rzadko wychodzą z domu i nie mają z kim porozmawiać. Szukamy sposobu na regularny kontakt.",
  constraints: "Nie mamy własnego samochodu ani stałej sali.",
  timeline: "6",
};

async function goto(page: Page, route: string) {
  await page.goto(route, { waitUntil: "load" });
  await page.waitForLoadState("networkidle").catch(() => {});
}

/** Follows the first link under `listRoute` whose href starts with `prefix`. */
async function openFirst(
  page: Page,
  listRoute: string,
  prefix: string,
  preferred?: string,
) {
  await goto(page, listRoute);
  const links = page.locator(`main a[href^="${prefix}"]`);
  await links.first().waitFor({ timeout: 15_000 });
  const wanted = preferred
    ? links.filter({ hasText: preferred }).first()
    : links.first();
  const link = (await wanted.count()) > 0 ? wanted : links.first();
  const href = await link.getAttribute("href");
  if (!href) throw new Error(`No link starting with ${prefix}`);
  await goto(page, href.split("#")[0]!);
}

async function openMatch(page: Page, query: string) {
  await goto(page, `/match?q=${encodeURIComponent(query)}`);
  await page.locator("#match-results-heading").waitFor({ timeout: 30_000 });
}

async function openInstitutionForm(page: Page) {
  await goto(page, "/institutions");
  // The form restores its answers from sessionStorage on load.
  await page.evaluate((profile) => {
    window.sessionStorage.setItem(
      "hubmi-institution-profile",
      JSON.stringify(profile),
    );
  }, INSTITUTION_PROFILE);
  await goto(page, "/institutions");
  await page.locator("#need").waitFor();
}

const SCREENS: Screen[] = [
  {
    id: "home",
    flow: 1,
    title: "Wejście do serwisu",
    caption:
      "Mieszkaniec od razu widzi, co może zrobić, i zaczyna od opisu problemu.",
    open: (page) => goto(page, "/"),
    annotations: [
      {
        text: "Nagłówek mówi językiem mieszkańca: opisz, czego brakuje w Twojej okolicy.",
        target: "#hero-heading",
      },
      {
        text: "Jedno główne działanie na ekranie. Pozostałe ścieżki są w menu.",
        target: 'main a[href="/match"]',
      },
      {
        text: "Rozmiar tekstu i wysoki kontrast są pod ręką na każdej stronie.",
        target: 'role=button[name="Wysoki kontrast"]',
        below: true,
      },
    ],
  },
  {
    id: "match-form",
    flow: 2,
    title: "Opis problemu",
    caption: "Wyszukiwarka rozwiązań przyjmuje opis problemu zwykłymi słowami.",
    open: (page) => goto(page, "/match"),
    scrollTo: "main h1",
    annotations: [
      {
        text: "Jedno pole i przykłady. Mieszkaniec nie musi znać nazw usług.",
        target: "#problem",
      },
      {
        text: "Opis można podyktować, jeśli pisanie jest trudne.",
        target: 'role=button[name="Wprowadź głosowo"]',
      },
      {
        text: "Przykład wypełnia pole jednym kliknięciem i pokazuje, jak pisać.",
        target: "#examples-heading",
      },
    ],
  },
  {
    id: "match-results",
    flow: 2,
    title: "Dobre dopasowanie",
    caption: "Wyniki pokazują, które rozwiązania pasują do opisu i dlaczego.",
    open: (page) => openMatch(page, GOOD_QUERY),
    scrollTo: "#match-results-heading",
    annotations: [
      {
        text: "Nagłówek z liczbą wyników dostaje fokus, a czytnik ekranu odczytuje go od razu.",
        target: "#match-results-heading",
      },
      {
        text: "Trafność ma etykietę, ikonę i procent. Nie polegamy na samym kolorze.",
        target: "[data-tier]",
      },
      {
        text: "Każdy wynik ma krótkie uzasadnienie, dlaczego pasuje do opisu.",
        target: "text=Dlaczego to pasuje",
      },
    ],
  },
  {
    id: "match-none",
    flow: 2,
    title: "Brak dobrego dopasowania",
    caption:
      "Gdy baza nie ma odpowiedzi, serwis mówi to wprost i proponuje następny krok.",
    open: (page) => openMatch(page, UNMET_QUERY),
    scrollTo: "#match-results-heading",
    annotations: [
      {
        text: "Brak dopasowania to też odpowiedź. Nie pokazujemy przypadkowych wyników jako trafnych.",
        target: "#match-results-heading",
      },
      {
        text: "Brak dopasowania → zgłoszenie nowego wyzwania. Opis problemu przenosi się do wiadomości dla ROPS.",
        target: 'role=link[name="Zgłoś nowe wyzwanie"]',
      },
      {
        text: "Luźno powiązane rozwiązania są osobno, bez procentu i bez etykiety dopasowania.",
        target: "#match-related-heading",
      },
    ],
  },
  {
    id: "knowledge-detail",
    flow: 3,
    title: "Karta innowacji",
    caption:
      "Karta innowacji z biblioteki opisuje rozwiązanie i prowadzi do dalszych kroków.",
    open: (page) =>
      openFirst(
        page,
        "/knowledge?tab=library",
        "/knowledge/",
        "Teleopieka sąsiedzka",
      ),
    annotations: [
      {
        text: "Okruszki pokazują drogę powrotu do biblioteki.",
        target: 'nav[aria-label="Ścieżka okruszków"]',
      },
      {
        text: "Opis w stałym układzie: dla kogo jest rozwiązanie i jak działa.",
        target: "main h1",
      },
      {
        text: "Z karty prowadzą następne kroki: test, pytanie do ROPS i plan wdrożenia dla instytucji.",
        target: 'role=heading[name="Co dalej"]',
      },
    ],
  },
  {
    id: "idea-creator",
    flow: 4,
    title: "Nowy pomysł",
    caption:
      "Kreator prowadzi od problemu do gotowej kanwy innowacji. Asystent pomaga na żądanie.",
    role: "resident",
    open: async (page, viewport) => {
      await goto(page, "/ideas/new");
      await page.locator("#idea-step-heading").waitFor();
      await page.locator("main textarea").first().fill(IDEA_PROBLEM);
      if (viewport === "desktop") {
        await page
          .getByRole("button", { name: "Jak sprawdzić, czy to potrzebne?" })
          .click();
        // The suggestion buttons stay disabled while the answer streams in.
        await page.waitForTimeout(1000);
        await page
          .locator('button:has-text("Co może pójść nie tak?"):not([disabled])')
          .waitFor({ timeout: 45_000 })
          .catch(() => {});
        await page.waitForTimeout(500);
      }
    },
    annotations: [
      {
        text: "Dziewięć krótkich kroków zamiast jednego długiego formularza.",
        target: "text=/^Krok \\d+ z \\d+/",
      },
      {
        text: "Jedno pytanie na ekran, zadane prostym językiem.",
        target: "#idea-step-heading",
      },
      {
        text: "Asystent podpowiada na żądanie. Jego tekst jest oznaczony jako przygotowany automatycznie.",
        target: 'role=heading[name="Asystent"]',
      },
    ],
  },
  {
    id: "idea-response",
    flow: 5,
    title: "Strona pomysłu autora",
    caption: "Autor widzi na stronie swojego pomysłu odpowiedź zespołu ROPS.",
    role: "resident",
    open: async (page) => {
      await goto(page, "/ideas");
      const hrefs = await page
        .locator('main a[href^="/ideas/"]:not([href="/ideas/new"])')
        .evaluateAll((links) => [
          ...new Set(links.map((link) => link.getAttribute("href") ?? "")),
        ]);
      for (const href of hrefs.slice(0, 12)) {
        await goto(page, href);
        if ((await page.locator("h2#review-heading").count()) > 0) return;
      }
      throw new Error(
        "No idea with a ROPS response is visible to this account. Sign in as the author (DEMO_USER_PASSWORD) and make sure one of the ideas was reviewed with a note.",
      );
    },
    scrollTo: "h2#review-heading",
    annotations: [
      {
        text: "Odpowiedź ROPS jest na stronie pomysłu, z datą. Widzi ją tylko autor.",
        target: "h2#review-heading",
      },
      {
        text: "Kanwa porządkuje pomysł w stałe pola, te same dla wszystkich.",
        target: 'role=heading[name="Kanwa innowacji"]',
      },
      {
        text: "Z kanwy powstaje szkic wniosku grantowego do dalszej pracy.",
        target: 'role=heading[name="Generator wniosków"]',
      },
    ],
  },
  {
    id: "institutions-form",
    flow: 6,
    title: "Krok 1: instytucja i potrzeba",
    caption:
      "Pracownik gminy lub ośrodka opisuje instytucję i potrzebę w jednym formularzu.",
    open: openInstitutionForm,
    annotations: [
      {
        text: "Krótkie pytania o instytucję: typ, liczba mieszkańców, budżet i zespół.",
        target: "#institution-type",
      },
      {
        text: "Pola wyboru mają duże cele kliknięcia i widoczne zaznaczenie.",
        target: "text=5–20 tys.",
      },
      {
        text: "Odpowiedzi zostają w karcie przeglądarki, więc powrót do formularza nie kasuje pracy.",
        target: 'role=heading[name="Opisz instytucję i potrzebę"]',
      },
    ],
  },
  {
    id: "institutions-plan",
    flow: 6,
    title: "Plan wdrożenia",
    caption:
      "Po wyborze rozwiązania powstaje szkic planu wdrożenia do omówienia w zespole.",
    open: async (page) => {
      await openInstitutionForm(page);
      await page.getByRole("button", { name: "Dobierz rozwiązania" }).click();
      await page.locator("#candidates-heading").waitFor({ timeout: 30_000 });
      await page.locator('input[name="candidate"]').first().check();
      await page.getByRole("button", { name: "Przygotuj plan" }).click();
      await page
        .getByRole("button", { name: /Drukuj/ })
        .waitFor({ timeout: 45_000 });
      await page.waitForTimeout(500);
    },
    annotations: [
      {
        text: "Plan można wydrukować, pobrać albo skopiować do własnego dokumentu.",
        target: "role=button[name=/Drukuj/]",
      },
      {
        text: "Szkic jest oznaczony jako przygotowany automatycznie i wymaga sprawdzenia.",
        target: "text=/Tekst przygotowany automatycznie/",
      },
      {
        text: "Plan zaczyna się od danych instytucji. Dalej są kroki, koszty, zespół i ryzyka.",
        target: "main dl",
      },
    ],
  },
  {
    id: "testing",
    flow: 7,
    title: "Otwarte testy i opinie",
    caption:
      "Mieszkaniec zgłasza się do testu innowacji, a potem dzieli się opinią.",
    open: (page) => openFirst(page, "/test", "/test/"),
    scrollTo: "#tests-heading",
    annotations: [
      {
        text: "Każdy test ma miejsce, termin i liczbę wolnych miejsc.",
        target: "#tests-heading",
      },
      {
        text: "Zgłoszenie pyta o dogodną porę i potrzebne udogodnienia.",
        target: "text=Kiedy możesz?",
      },
      {
        text: "Opinie testujących wracają jako podsumowanie: średnia i rozkład ocen.",
        target: "#results-heading",
      },
    ],
  },
  {
    id: "messages",
    flow: 8,
    title: "Rozmowy",
    caption: "Mieszkaniec, ekspert i zespół ROPS rozmawiają w jednym miejscu.",
    role: "resident",
    open: async (page) => {
      await goto(page, "/messages");
      await page.locator("main h1").waitFor();
    },
    annotations: [
      {
        text: "Nowa rozmowa: pytanie do ROPS, do eksperta albo szukanie partnera.",
        target: 'main a[href="/messages/new"]',
      },
      {
        text: "Lista rozmów i treść wątku są obok siebie. Na telefonie jedna pod drugą.",
        target: '[aria-label="Treść rozmowy"]',
      },
      {
        text: "Odpowiedź można wpisać albo podyktować.",
        target: "#message-body",
      },
    ],
  },
  {
    id: "admin-moderation",
    flow: 9,
    title: "Moderacja",
    caption:
      "Zespół ROPS przegląda pomysły, zgłoszone problemy i szkice innowacji.",
    role: "admin",
    open: async (page) => {
      await goto(page, "/admin/moderation");
      await page.locator('[role="tablist"]').waitFor();
    },
    annotations: [
      {
        text: "Trzy kolejki pracy z licznikami. Aktywna zakładka ma też pasek, nie tylko kolor.",
        target: '[role="tablist"]',
      },
      {
        text: "Pomysł czeka na przegląd z pełnym opisem i linkiem do strony.",
        target: "#moderation-ideas-heading",
      },
      {
        text: "Decyzja z notatką wraca do autora jako odpowiedź ROPS.",
        target: 'role=button[name="Odpowiedz autorowi"]',
      },
    ],
  },
  {
    id: "admin-trends",
    flow: 9,
    title: "Trendy potrzeb",
    caption:
      "Zgłoszenia z wyszukiwarki pokazują, czego mieszkańcy szukają i czego w bazie brakuje.",
    role: "admin",
    open: async (page) => {
      await goto(page, "/admin/trends");
      await page.locator("main h1").waitFor();
    },
    scrollTo: "main h1",
    annotations: [
      {
        text: "Okres analizy wybiera się jednym polem.",
        target: "text=Okres",
      },
      {
        text: "Podsumowanie okresu zbiera najważniejsze liczby zwykłym językiem.",
        target: 'role=heading[name="Podsumowanie okresu"]',
      },
      {
        text: "Zgłoszenia są zapisywane bez danych osobowych i liczone według kategorii.",
        target: 'role=heading[name="Zgłoszenia według kategorii"]',
      },
    ],
  },
  {
    id: "a11y-high-contrast",
    flow: 10,
    title: "Wysoki kontrast",
    caption:
      "Wysoki kontrast włącza się jednym przyciskiem i działa na każdej stronie.",
    prefs: { theme: "high-contrast" },
    open: (page) => goto(page, "/"),
    annotations: [
      {
        text: "Przełącznik jest w nagłówku. Wybór zostaje zapamiętany w przeglądarce.",
        target: "role=button[name=/kontrast/i]",
        below: true,
      },
      {
        text: "Ten sam układ strony, osobna paleta: żółty i biały na czarnym.",
        target: "#hero-heading",
      },
      {
        text: "Przyciski i linki zachowują wyraźną ramkę i widoczny fokus.",
        target: 'main a[href="/match"]',
      },
    ],
  },
  {
    id: "a11y-largest-text",
    flow: 10,
    title: "Największy tekst (A++)",
    caption:
      "Przy największym rozmiarze tekstu układ się zawija i nie wymaga przewijania w poziomie.",
    prefs: { font: "largest" },
    open: (page) => openMatch(page, UNMET_QUERY),
    scrollTo: "#match-results-heading",
    annotations: [
      {
        text: "Nagłówek łamie się na kilka wierszy zamiast wychodzić poza ekran.",
        target: "#match-results-heading",
      },
      {
        text: "Przycisk rośnie razem z tekstem i zachowuje cel kliknięcia co najmniej 44 px.",
        target: 'role=link[name="Zgłoś nowe wyzwanie"]',
      },
    ],
  },
  {
    id: "login-demo",
    flow: 11,
    title: "Logowanie jednym kliknięciem",
    caption:
      "Cztery fikcyjne konta pozwalają sprawdzić każdą rolę bez rejestracji i bez hasła.",
    onLogin: true,
    open: async (page) => {
      await goto(page, "/login");
      await page.locator("#demo-accounts-heading").waitFor();
    },
    scrollTo: "#demo-accounts-heading",
    annotations: [
      {
        text: "Sekcja mówi wprost, że dane są fikcyjne.",
        target: "#demo-accounts-heading",
      },
      {
        text: "Każda rola ma własny przycisk. Hasło zostaje na serwerze i nie trafia do przeglądarki.",
        target: 'role=button[name="Administrator ROPS"]',
      },
      {
        text: "Pod przyciskiem jest jedno zdanie o tym, co dana rola może zrobić.",
        target: "#demo-admin-description",
      },
    ],
  },
];

type Mark = { n: number; x: number; y: number; below?: number };
type FrameEntry = {
  file: string;
  marks: Mark[];
};
type ScreenEntry = {
  source: string;
  renderedAt: string;
  frames: Partial<Record<ViewportName, FrameEntry>>;
};
type Manifest = Record<string, ScreenEntry>;

async function readManifest(): Promise<Manifest> {
  try {
    return JSON.parse(await readFile(MANIFEST, "utf8")) as Manifest;
  } catch {
    return {};
  }
}

/** Shrinks a screenshot with a palette, when sharp is installed (it ships with Next.js). */
async function optimise(png: Buffer): Promise<Buffer> {
  try {
    const { default: sharp } = await import("sharp");
    const small = await sharp(png)
      .png({ palette: true, quality: 90, effort: 9, compressionLevel: 9 })
      .toBuffer();
    return small.length < png.length ? small : png;
  } catch {
    return png;
  }
}

async function launch(): Promise<Browser> {
  const channels = process.env.MOCKUP_BROWSER
    ? [process.env.MOCKUP_BROWSER]
    : [undefined, "chrome", "msedge"];
  let failure: unknown;
  for (const channel of channels) {
    try {
      return await chromium.launch(channel ? { channel } : {});
    } catch (error) {
      failure = error;
    }
  }
  throw new Error(
    `No Chromium browser found. Run "npx playwright-core install chromium" or set MOCKUP_BROWSER=chrome|msedge. ${failure instanceof Error ? failure.message.split("\n")[0] : ""}`,
  );
}

async function signIn(page: Page, email: string, password: string) {
  await goto(page, "/login");
  await page.locator("#signin-email").fill(email);
  await page.locator("#signin-password").fill(password);
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  // On phones "Wyloguj" sits in the closed menu, so wait for the redirect.
  await page.waitForURL((url) => url.pathname !== "/login", {
    timeout: 20_000,
  });
}

async function renderFrames(browser: Browser, baseURL: string, only: string[]) {
  const password = process.env.DEMO_USER_PASSWORD;
  const accounts: Record<Exclude<Role, "guest">, string> = {
    resident: process.env.MOCKUP_RESIDENT_EMAIL ?? "resident@hubmi.example",
    admin: process.env.MOCKUP_ADMIN_EMAIL ?? "admin@hubmi.example",
  };
  const manifest = await readManifest();
  const failed: string[] = [];
  await mkdir(FRAMES_DIR, { recursive: true });

  for (const screen of SCREENS) {
    if (only.length > 0 && !only.includes(screen.id)) continue;
    const entry: ScreenEntry = {
      source: baseURL,
      renderedAt: new Date().toISOString().slice(0, 10),
      frames: {},
    };
    for (const name of VIEWPORT_NAMES) {
      const { width, height } = VIEWPORTS[name];
      let context: BrowserContext | undefined;
      try {
        context = await browser.newContext({
          baseURL,
          viewport: { width, height },
          deviceScaleFactor: 1,
          locale: "pl-PL",
          timezoneId: "Europe/Warsaw",
          reducedMotion: "reduce",
          isMobile: name === "mobile",
          hasTouch: name === "mobile",
        });
        await context.addInitScript((prefs: Prefs) => {
          window.localStorage.setItem("hubmi-theme", prefs.theme ?? "default");
          window.localStorage.setItem(
            "hubmi-font-size",
            prefs.font ?? "default",
          );
        }, screen.prefs ?? {});
        const page = await context.newPage();
        const role = screen.role ?? "guest";
        if (role !== "guest" && password) {
          await signIn(page, accounts[role], password);
        }
        await screen.open(page, name);
        if (!screen.onLogin && new URL(page.url()).pathname === "/login") {
          throw new Error(
            "this screen needs a signed-in account; set DEMO_USER_PASSWORD",
          );
        }
        await page.evaluate(() => document.fonts.ready);
        // Keep the skip link and toasts out of the frame.
        await page.addStyleTag({
          content:
            'a[href="#main"],[data-sonner-toaster]{display:none!important}',
        });
        await page.evaluate((selector) => {
          const target = selector
            ? document.querySelector<HTMLElement>(selector)
            : null;
          window.scrollTo({
            top: target
              ? Math.max(
                  0,
                  target.getBoundingClientRect().top + window.scrollY - 32,
                )
              : 0,
            behavior: "instant",
          });
          (document.activeElement as HTMLElement | null)?.blur?.();
        }, screen.scrollTo ?? null);
        await page.waitForTimeout(300);

        const marks: Mark[] = [];
        for (const [index, annotation] of screen.annotations.entries()) {
          const box = await page
            .locator(annotation.target)
            .first()
            .boundingBox({ timeout: 1500 })
            .catch(() => null);
          if (!box) continue;
          const inside =
            box.x >= 0 && box.y >= 0 && box.x < width && box.y < height - 8;
          if (inside) {
            const round = (value: number) => Math.round(value * 10000) / 10000;
            marks.push({
              n: index + 1,
              x: round(box.x / width),
              y: round(box.y / height),
              ...(annotation.below
                ? { below: round((box.y + box.height) / height) }
                : {}),
            });
          }
        }

        const file = `${screen.id}-${name}.png`;
        const png = await optimise(await page.screenshot({ type: "png" }));
        await writeFile(path.join(FRAMES_DIR, file), png);
        entry.frames[name] = { file, marks };
        console.log(
          `${file}  ${Math.round(png.length / 1024)} kB  marks ${marks.map((mark) => mark.n).join(",") || "none"}`,
        );
      } catch (error) {
        const reason =
          error instanceof Error ? error.message.split("\n")[0] : "error";
        failed.push(`${screen.id} (${name}): ${reason}`);
        console.warn(`SKIPPED ${screen.id} (${name}): ${reason}`);
      } finally {
        await context?.close();
      }
    }
    if (Object.keys(entry.frames).length > 0) manifest[screen.id] = entry;
  }

  const ordered: Manifest = {};
  for (const screen of SCREENS) {
    if (manifest[screen.id]) ordered[screen.id] = manifest[screen.id]!;
  }
  await writeFile(MANIFEST, `${JSON.stringify(ordered, null, 2)}\n`);
  return failed;
}

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const FRAME_HEIGHT = 540;
const MARK_RADIUS = 13;

const clamp = (value: number, size: number) =>
  Math.round(Math.min(Math.max(value, MARK_RADIUS), size - MARK_RADIUS));

/**
 * A mark sits to the left of its target, level with the first line, so it
 * covers no text. Where the target touches the frame edge (phone frames), it
 * sits just above the target's corner instead.
 */
function markPosition(mark: Mark, shown: number): string {
  const x = mark.x * shown;
  const y = mark.y * FRAME_HEIGHT;
  if (mark.below !== undefined) {
    const under = mark.below * FRAME_HEIGHT + MARK_RADIUS + 2;
    return `left:${clamp(x + MARK_RADIUS, shown)}px;top:${clamp(under, FRAME_HEIGHT)}px`;
  }
  const roomOnLeft = x - MARK_RADIUS - 6 >= MARK_RADIUS;
  const left = roomOnLeft ? x - MARK_RADIUS - 6 : x + 4;
  const top = roomOnLeft ? y + 10 : y - MARK_RADIUS;
  return `left:${clamp(left, shown)}px;top:${clamp(top, FRAME_HEIGHT)}px`;
}

function frameHtml(
  screen: Screen,
  entry: ScreenEntry | undefined,
  name: ViewportName,
): string {
  const { width, height, label } = VIEWPORTS[name];
  const shown = Math.round((width / height) * FRAME_HEIGHT);
  const frame = entry?.frames[name];
  const body = frame
    ? `<img src="frames/${frame.file}" width="${shown}" height="${FRAME_HEIGHT}" alt="${escapeHtml(`${FLOWS[screen.flow]}: ${screen.title}. ${label}.`)}">${frame.marks
        .map(
          (mark) =>
            `<span class="mark" style="${markPosition(mark, shown)}">${mark.n}</span>`,
        )
        .join("")}`
    : `<p class="missing">Ta klatka powstaje po zalogowaniu na konto demonstracyjne.</p>`;
  return `<figure class="frame"><div class="shot" style="width:${shown}px;height:${FRAME_HEIGHT}px">${body}</div><figcaption>${label}</figcaption></figure>`;
}

function boardHtml(manifest: Manifest): string {
  const total = SCREENS.length + 1;
  const date = Object.values(manifest)
    .map((entry) => entry.renderedAt)
    .sort()
    .at(-1);
  const flowPages = Object.entries(FLOWS).map(([flow, title]) => ({
    flow: Number(flow),
    title,
    page: SCREENS.findIndex((screen) => screen.flow === Number(flow)) + 2,
  }));
  const home = manifest.home?.frames.desktop?.file;

  const cover = `<section class="page cover">
  <div class="cover-text">
    <p class="brand">HubMI.pl</p>
    <h1>Makiety UX/UI</h1>
    <p class="lead">Małopolski Hub Innowacji Społecznych. Dziesięć przepływów, każdy na komputerze i na telefonie.</p>
    <ol class="contents">
      ${flowPages
        .map(
          ({ title, page }) =>
            `<li><span>${escapeHtml(title)}</span><span class="page-ref">s. ${page}</span></li>`,
        )
        .join("\n      ")}
    </ol>
    <p class="note">Klatki pochodzą z działającej aplikacji${date ? ` (stan na ${date.split("-").reverse().join(".")})` : ""}. Numery na klatkach odpowiadają opisom decyzji projektowych po lewej stronie. Dane na ekranach są fikcyjne.</p>
  </div>
  ${home ? `<div class="cover-shot"><img src="frames/${home}" alt=""></div>` : ""}
  <footer><span>Działająca wersja: ${escapeHtml(PRODUCTION_URL.replace(/^https?:\/\//, ""))}</span><span>HackYeah 2026</span></footer>
</section>`;

  const pages = SCREENS.map((screen, index) => {
    const entry = manifest[screen.id];
    return `<section class="page">
  <div class="rail">
    <p class="flow">Przepływ ${screen.flow} z ${Object.keys(FLOWS).length}</p>
    <h2>${escapeHtml(FLOWS[screen.flow]!)}</h2>
    <p class="screen">${escapeHtml(screen.title)}</p>
    <p class="caption">${escapeHtml(screen.caption)}</p>
    <ol class="notes">
      ${screen.annotations
        .map(
          (annotation, n) =>
            `<li><span class="mark static">${n + 1}</span><span>${escapeHtml(annotation.text)}</span></li>`,
        )
        .join("\n      ")}
    </ol>
  </div>
  <div class="frames">
    ${frameHtml(screen, entry, "desktop")}
    ${frameHtml(screen, entry, "mobile")}
  </div>
  <footer><span>HubMI.pl – makiety UX/UI</span><span>${index + 2} / ${total}</span></footer>
</section>`;
  });

  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<title>HubMI.pl – makiety UX/UI</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  /* Palette and type follow docs/design/STYLE.md, so the board reads as part of the product. */
  :root {
    --ink: #1b1b1b;
    --ink-soft: #656565;
    --blue: #0052a5;
    --navy: #00468d;
    --line: #767676;
    --hairline: #dadada;
    --surface: #f1f1f1;
  }
  @page { size: 1600px 900px; margin: 0; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    margin: 0;
    background: var(--surface);
    color: var(--ink);
    font-family: "Open Sans", Arial, sans-serif;
    font-size: 17px;
    line-height: 1.5;
  }
  p, h1, h2, ol, figure { margin: 0; }
  ol { padding: 0; list-style: none; }
  .page {
    position: relative;
    display: flex;
    width: 1600px;
    height: 900px;
    margin: 0 auto 24px;
    padding-bottom: 56px;
    overflow: hidden;
    background: #fff;
    break-after: page;
  }
  @media print { .page { margin: 0; } body { background: #fff; } }
  footer {
    position: absolute;
    inset: auto 0 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 56px;
    padding: 0 40px;
    background: var(--navy);
    color: #fff;
    font-size: 15px;
  }
  .rail {
    display: flex;
    flex-direction: column;
    width: 380px;
    padding: 48px 32px 32px 40px;
    border-right: 1px solid var(--hairline);
  }
  .flow { color: var(--ink-soft); font-size: 15px; }
  h2 { margin-top: 4px; font-size: 30px; line-height: 1.2; font-weight: 700; }
  .screen {
    margin-top: 12px;
    padding-left: 12px;
    border-left: 4px solid var(--blue);
    font-size: 19px;
    font-weight: 600;
  }
  .caption { margin-top: 20px; }
  .notes { display: flex; flex-direction: column; gap: 16px; margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--hairline); }
  .notes li { display: flex; gap: 12px; align-items: flex-start; font-size: 16px; }
  .mark {
    position: absolute;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    transform: translate(-50%, -50%);
    border: 2px solid #fff;
    border-radius: 50%;
    background: var(--blue);
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    line-height: 1;
    outline: 1px solid var(--navy);
  }
  .mark.static { position: static; flex: none; transform: none; margin-top: -1px; }
  .frames {
    display: flex;
    flex: 1;
    gap: 24px;
    align-items: center;
    justify-content: center;
    padding: 0 40px;
    background: var(--surface);
  }
  .frame figcaption { margin-top: 12px; color: var(--ink-soft); font-size: 15px; }
  .shot { position: relative; border: 1px solid var(--line); background: #fff; }
  .shot img { display: block; }
  .missing { display: grid; place-items: center; height: 100%; padding: 24px; color: var(--ink-soft); text-align: center; }
  .cover { background: #fff; }
  .cover-text { display: flex; flex-direction: column; width: 720px; padding: 64px 48px 32px 72px; }
  .brand { font-size: 22px; font-weight: 700; color: var(--blue); }
  h1 { margin-top: 8px; font-size: 76px; line-height: 1.05; font-weight: 700; letter-spacing: -0.01em; }
  .lead { margin-top: 20px; max-width: 30em; font-size: 21px; }
  .contents { display: grid; grid-template-columns: 1fr 1fr; column-gap: 40px; margin-top: 36px; border-top: 2px solid var(--ink); }
  .contents li { display: flex; justify-content: space-between; gap: 16px; padding: 9px 0; border-bottom: 1px solid var(--hairline); font-size: 16px; font-weight: 600; }
  .page-ref { flex: none; color: var(--ink-soft); font-weight: 400; }
  .note { margin-top: auto; max-width: 38em; color: var(--ink-soft); font-size: 15px; }
  .cover-shot { position: absolute; top: 96px; left: 792px; border: 1px solid var(--line); }
  .cover-shot img { display: block; width: 1040px; }
</style>
</head>
<body>
${cover}
${pages.join("\n")}
</body>
</html>
`;
}

async function renderBoard(browser: Browser) {
  const manifest = await readManifest();
  const htmlFile = path.join(OUT_DIR, "hubmi-makiety.html");
  // Formatted like the rest of the repository, so `npm run format:check` passes.
  const { format } = await import("prettier");
  await writeFile(
    htmlFile,
    await format(boardHtml(manifest), { parser: "html" }),
  );
  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
  });
  await page.goto(pathToFileURL(htmlFile).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const pdfFile = path.join(OUT_DIR, "hubmi-makiety.pdf");
  const pdf = await page.pdf({
    path: pdfFile,
    width: "1600px",
    height: "900px",
    printBackground: true,
    preferCSSPageSize: true,
  });
  await page.close();
  console.log(
    `hubmi-makiety.pdf  ${(pdf.length / 1024 / 1024).toFixed(1)} MB  ${SCREENS.length + 1} pages`,
  );
}

async function main() {
  loadEnvConfig(process.cwd());
  const args = process.argv.slice(2);
  const only =
    args
      .find((arg) => arg.startsWith("--only="))
      ?.slice("--only=".length)
      .split(",")
      .filter(Boolean) ?? [];
  const baseURL = (process.env.MOCKUP_BASE_URL ?? PRODUCTION_URL).replace(
    /\/$/,
    "",
  );
  const browser = await launch();
  try {
    let failed: string[] = [];
    if (!args.includes("--board-only")) {
      console.log(`Rendering frames from ${baseURL}`);
      failed = await renderFrames(browser, baseURL, only);
    }
    await renderBoard(browser);
    if (failed.length > 0) {
      console.warn(`\nNot rendered:\n- ${failed.join("\n- ")}`);
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Rendering failed.");
  process.exitCode = 1;
});
