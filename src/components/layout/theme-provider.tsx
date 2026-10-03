"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { THEMES, THEME_STORAGE_KEY } from "@/lib/a11y/preferences";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      themes={[...THEMES]}
      defaultTheme="default"
      enableSystem={false}
      enableColorScheme={false}
      storageKey={THEME_STORAGE_KEY}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
