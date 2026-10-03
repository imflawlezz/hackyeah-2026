"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  FONT_SIZE_ATTRIBUTE,
  FONT_SIZE_STORAGE_KEY,
  type FontSize,
  parseFontSize,
} from "@/lib/a11y/preferences";

const FONT_SIZE_OPTIONS: { value: FontSize; text: string; label: string }[] = [
  { value: "default", text: "A", label: "Domyślny rozmiar tekstu" },
  { value: "large", text: "A+", label: "Większy tekst" },
  { value: "largest", text: "A++", label: "Największy tekst" },
];

const FONT_SIZE_EVENT = "hubmi:font-size";

function subscribeFontSize(onChange: () => void) {
  window.addEventListener(FONT_SIZE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(FONT_SIZE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readFontSize(): FontSize {
  return parseFontSize(
    document.documentElement.getAttribute(FONT_SIZE_ATTRIBUTE),
  );
}

function writeFontSize(size: FontSize) {
  document.documentElement.setAttribute(FONT_SIZE_ATTRIBUTE, size);
  try {
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, size);
  } catch {
    // Storage can be blocked; the choice then lasts for this page only.
  }
  window.dispatchEvent(new Event(FONT_SIZE_EVENT));
}

const subscribeNoop = () => () => {};

const toggleClassName =
  "aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary-hover";

export function AccessibilityToolbar() {
  const fontSize = useSyncExternalStore(
    subscribeFontSize,
    readFontSize,
    () => "default" as FontSize,
  );
  // The stored theme is only known in the browser.
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const { theme, setTheme } = useTheme();
  const highContrast = hydrated && theme === "high-contrast";

  return (
    <div
      role="group"
      aria-label="Ustawienia dostępności"
      className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2"
    >
      <span className="text-sm">Dostępność</span>
      <div role="group" aria-label="Rozmiar tekstu" className="flex gap-1">
        {FONT_SIZE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant="outline"
            aria-label={`${option.text}: ${option.label}`}
            aria-pressed={fontSize === option.value}
            onClick={() => writeFontSize(option.value)}
            className={`min-w-11 px-2 font-semibold ${toggleClassName}`}
          >
            {option.text}
          </Button>
        ))}
      </div>
      <Button
        variant="outline"
        aria-pressed={highContrast}
        onClick={() => setTheme(highContrast ? "default" : "high-contrast")}
        className={toggleClassName}
      >
        Wysoki kontrast
      </Button>
    </div>
  );
}
