// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AiText } from "@/components/ai/ai-text";

afterEach(cleanup);

function renderText(text: string) {
  return render(<AiText>{text}</AiText>).container;
}

describe("AiText", () => {
  it("renders bold, italics and paragraphs", () => {
    const container = renderText(
      "**Grupa docelowa**: seniorzy.\n\nDrugi *akapit*.",
    );
    expect(container.querySelector("strong")).toHaveTextContent(
      "Grupa docelowa",
    );
    expect(container.querySelector("em")).toHaveTextContent("akapit");
    expect(container.querySelectorAll("p")).toHaveLength(2);
    expect(container.textContent).not.toContain("**");
  });

  it("renders bullet and numbered lists", () => {
    const container = renderText(
      "Kroki:\n\n- rozmowa z sołtysem\n- ankieta\n\n1. pierwszy\n2. drugi",
    );
    expect(container.querySelectorAll("ul > li")).toHaveLength(2);
    expect(container.querySelectorAll("ol > li")).toHaveLength(2);
  });

  it("keeps single line breaks", () => {
    const container = renderText("Pierwsza linia\nDruga linia");
    expect(container.querySelector("br")).not.toBeNull();
  });

  it("never renders raw HTML as markup", () => {
    const container = renderText(
      'Tekst <script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">\n\n<b>gruby</b>',
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(container.innerHTML).not.toMatch(/<script|<img|onerror/);
    // Tags are skipped; any text between them stays inert plain text.
    expect(container).toHaveTextContent("gruby");
  });

  it("unwraps links, images, headings and code to inert text", () => {
    const container = renderText(
      "# Nagłówek\n\n[kliknij](javascript:alert(1)) ![obraz](https://example.com/a.png)\n\n`kod`",
    );
    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("h1")).toBeNull();
    expect(container.querySelector("code")).toBeNull();
    expect(container.innerHTML).not.toContain("javascript:");
    expect(container).toHaveTextContent("kliknij");
    expect(container).toHaveTextContent("Nagłówek");
  });
});
