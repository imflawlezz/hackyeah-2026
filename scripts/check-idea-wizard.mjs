import { chromium } from "playwright-core";
import fs from "node:fs";
import assert from "node:assert/strict";
(async () => {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 360, height: 900 },
    });
    const results = [];
    for (const theme of ["default", "high-contrast"])
      for (const font of ["default", "large", "largest"]) {
        await page.goto("http://localhost:3100/ideas/new");
        await page.evaluate(
          ({ theme, font }) => {
            document.documentElement.dataset.theme = theme;
            document.documentElement.dataset.fontSize = font;
          },
          { theme, font },
        );
        await page.addScriptTag({ path: process.env.AXE_PATH });
        for (let step = 0; step < 3; step++) {
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            true,
            `Overflow: ${theme}/${font}/${step}`,
          );
          const audit = await page.evaluate(async () => {
            const r = await axe.run(document, {
              runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
              },
            });
            return r.violations.map((v) => ({
              id: v.id,
              nodes: v.nodes.map((n) => n.target),
            }));
          });
          results.push({ theme, font, step: step + 1, violations: audit });
          assert.deepEqual(audit, [], `axe: ${theme}/${font}/${step}`);
          if (step === 0) {
            await page.locator("#idea-title").focus();
            await page.keyboard.type("Pomoc sasiedzka");
            for (const [id, text] of [
              ["problem", "Seniorzy potrzebuja wsparcia."],
              ["targetGroup", "Seniorzy"],
              ["summary", "Sasiedzi pomagaja w codziennych sprawach."],
            ]) {
              for (let tab = 0; tab < 30; tab++) {
                await page.keyboard.press("Tab");
                if (
                  await page
                    .locator("#idea-" + id)
                    .evaluate((el) => el === document.activeElement)
                )
                  break;
              }
              assert.equal(
                await page
                  .locator("#idea-" + id)
                  .evaluate((el) => el === document.activeElement),
                true,
              );
              await page.keyboard.type(text);
            }
            await activate("Dalej");
          } else if (step === 1) await activate("Pomiń ten krok");
        }
        await activate("Wyślij do Hubu");
        await page
          .getByRole("status")
          .filter({ hasText: "tej przeglądarce" })
          .waitFor();
        assert.equal(
          await page.evaluate(
            () => JSON.parse(localStorage.getItem("hubmi.ideas"))[0].status,
          ),
          "submitted",
        );
        await page.evaluate(() => localStorage.clear());
      }
    fs.writeFileSync(
      "docs/idea-wizard-a11y.json",
      JSON.stringify(results, null, 2) + "\n",
    );
    console.log(
      `PASS: ${results.length} axe audits, no horizontal overflow, keyboard submission in both themes at all font sizes.`,
    );
    async function activate(name) {
      const button = page.getByRole("button", { name, exact: true });
      for (let tab = 0; tab < 60; tab++) {
        await page.keyboard.press("Tab");
        if (await button.evaluate((el) => el === document.activeElement)) break;
      }
      assert.equal(
        await button.evaluate((el) => el === document.activeElement),
        true,
        "Keyboard did not reach " + name,
      );
      await page.keyboard.press("Enter");
      await page.waitForTimeout(150);
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
