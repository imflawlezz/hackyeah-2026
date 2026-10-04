import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// Narzędzia instalujemy poza aplikacją; ścieżka przez PITCH_TOOLS.
const require = createRequire(
  path.resolve(process.env.PITCH_TOOLS, "package.json"),
);
const { chromium } = require("playwright");
const { PDFDocument } = require("pdf-lib");
const dir = path.dirname(fileURLToPath(import.meta.url));
const source = await fs.readFile(path.join(dir, "deck.md"), "utf8");
const slides = source
  .trim()
  .split(/\r?\n---\r?\n/)
  .map((s) => s.trim());
const words = (s) => s.trim().split(/\s+/).length;
const escape = (s) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
if (slides.length !== 10) throw new Error("Wymagane dokładnie 10 slajdów");
const sections = [];
for (const [i, slide] of slides.entries()) {
  const lines = slide.split(/\r?\n/);
  const title = lines.find((l) => l.startsWith("# ")).slice(2);
  const bullets = lines
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2));
  if (
    words(title) > 8 ||
    bullets.length > 3 ||
    bullets.some((b) => words(b) > 12)
  )
    throw new Error(`Przekroczony limit tekstu: ${i + 1}`);
  const visual = lines.find((l) => l.startsWith("Wizual: ")).slice(8);
  const imgLine = lines.find((l) => l.startsWith("Obraz: "));
  let img = "";
  if (imgLine) {
    const [name, alt] = imgLine.slice(7).split(" | ");
    const bytes = await fs.readFile(path.resolve(dir, name));
    img = `<img src="data:image/png;base64,${bytes.toString("base64")}" alt="${escape(alt)}">`;
  }
  const disclosure = lines.find((l) => l.startsWith("Ujawnienie AI: "));
  // Hasła: krótkie słowa kluczowe pod tytułem, rozdzielone " | ".
  const tags = (lines.find((l) => l.startsWith("Hasła: ")) ?? "")
    .slice(7)
    .split(" | ")
    .filter(Boolean);
  if (tags.length > 5 || tags.some((t) => words(t) > 5))
    throw new Error(`Za dużo haseł lub za długie hasło: ${i + 1}`);
  sections.push(
    `<section><header>HubMI.pl · HackYeah 2026 · prototyp</header><h1>${escape(title)}</h1>${tags.length ? `<ul class="tags" aria-label="Hasła">${tags.map((t) => `<li>${escape(t)}</li>`).join("")}</ul>` : ""}<div class="body ${img ? "with-image" : ""}"><ul>${bullets.map((b) => `<li>${escape(b)}</li>`).join("")}</ul>${img}</div><p class="visual">${escape(visual)}</p>${disclosure ? `<p class="disclosure">${escape(disclosure.slice(15))}</p>` : ""}<footer>${i + 1} / 10</footer></section>`,
  );
}
const font = await fs.readFile(path.join(dir, "open-sans-400.ttf"));
const boldFont = await fs.readFile(path.join(dir, "open-sans-700.ttf"));
const html = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>HubMI.pl — prezentacja prototypu HackYeah 2026</title><style>
@font-face{font-family:'Open Sans';src:url(data:font/ttf;base64,${font.toString("base64")}) format('truetype');font-weight:400}
@font-face{font-family:'Open Sans';src:url(data:font/ttf;base64,${boldFont.toString("base64")}) format('truetype');font-weight:700}
@page{size:1440px 900px;margin:0}*{box-sizing:border-box}body{margin:0;color:#1b1b1b;background:white;font-family:'Open Sans',sans-serif}section{width:1440px;height:900px;padding:48px 64px;position:relative;break-after:page;border-top:12px solid #0052a5}section:last-child{break-after:auto}header{font-size:24px;color:#0052a5;font-weight:700}h1{font-size:50px;line-height:1.2;margin:24px 0 28px;max-width:1200px}ul{padding-left:36px;margin:0}li{font-size:32px;line-height:1.4;margin:0 0 22px}.tags{list-style:none;padding:0;margin:0 0 28px;display:flex;flex-wrap:wrap;gap:12px}.tags li{font-size:24px;line-height:1.3;font-weight:700;color:#0052a5;border:2px solid #0052a5;border-radius:4px;padding:8px 16px;margin:0}.body{min-height:400px}.with-image{display:grid;grid-template-columns:1fr 590px;gap:36px}.with-image img{width:590px;max-height:400px;object-fit:contain;object-position:top;border:1px solid #ccc}.visual{font-size:24px;line-height:1.4;margin:24px 0 0}.disclosure{font-size:20px;line-height:1.4;border-top:2px solid #0052a5;padding-top:16px;margin-top:22px}footer{position:absolute;bottom:28px;right:64px;color:#0052a5;font-size:24px}
</style></head><body>${sections.join("")}</body></html>`;
await fs.writeFile(path.join(dir, "hubmi-pitch.html"), html);
const browser = await chromium.launch({
  channel: process.env.PITCH_BROWSER || "chrome",
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  const checks = await page.evaluate(() =>
    [...document.querySelectorAll("section")].map((s) => ({
      overflow: s.scrollHeight > s.clientHeight,
      font: document.fonts.check('32px "Open Sans"'),
    })),
  );
  if (checks.some((c) => c.overflow || !c.font))
    throw new Error("Przepełnienie slajdu lub brak czcionki");
  for (const i of [0, 3, 7, 9])
    await page
      .locator("section")
      .nth(i)
      .screenshot({ path: path.join(dir, `preview-${i + 1}.png`) });
  const bytes = await page.pdf({
    width: "1440px",
    height: "900px",
    printBackground: true,
    tagged: true,
    outline: true,
  });
  const pdf = await PDFDocument.load(bytes);
  pdf.setTitle("HubMI.pl — prezentacja prototypu HackYeah 2026");
  pdf.setLanguage("pl-PL");
  pdf.setSubject("Prototyp platformy Małopolskiego Hubu Innowacji Społecznych");
  if (pdf.getPageCount() !== 10) throw new Error("Niepoprawna liczba stron");
  const output = await pdf.save();
  if (output.length >= 10_000_000) throw new Error("PDF przekracza 10 MB");
  await fs.writeFile(path.join(dir, "hubmi-pitch.pdf"), output);
  console.log(
    JSON.stringify({
      pages: pdf.getPageCount(),
      bytes: output.length,
      title: pdf.getTitle(),
      language: pdf.catalog
        .get(require("pdf-lib").PDFName.of("Lang"))
        .toString(),
      checks,
    }),
  );
} finally {
  await browser.close();
}

const criteria = [
  "Wyzwanie 40%, wdrożenie 20%, dostępność 20%, materiały 10%",
  "Wyzwanie 40%, interfejs 10%",
  "Wyzwanie 40%, wdrożenie 20%",
  "Wyzwanie 40%, dostępność 20%",
  "Wyzwanie 40%",
  "Wyzwanie 40%, wdrożenie 20%",
  "Wyzwanie 40%, wdrożenie 20%",
  "Dostępność 20%, interfejs 10%",
  "Wdrożenie 20%",
  "Wdrożenie 20%, materiały 10%",
];
await fs.writeFile(
  path.join(dir, "../outline.md"),
  "# HubMI.pl: źródło prezentacji, 10 slajdów\n\nTreść zgodna z [deck.md](deck/deck.md); eksport: [hubmi-pitch.pdf](deck/hubmi-pitch.pdf). Stan: 4 października 2026.\n\n" +
    slides
      .map((s, i) =>
        s
          .replace(/^# /, `## ${i + 1}. `)
          .replace(/^Obraz: (.*)$/gm, "Klatka makiety: $1"),
      )
      .join("\n\n") +
    "\n\n## Powiązanie z kryteriami oceny\n\nTabela nie jest częścią prezentacji. Wagi: [brief, §8](../task/CHALLENGE.md).\n\n| Slajd | Kryteria |\n| --- | --- |\n" +
    criteria.map((c, i) => `| ${i + 1} | ${c} |`).join("\n") +
    "\n",
);
