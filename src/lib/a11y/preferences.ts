export const FONT_SIZES = ["default", "large", "largest"] as const;
export type FontSize = (typeof FONT_SIZES)[number];

export const FONT_SIZE_STORAGE_KEY = "hubmi-font-size";
export const FONT_SIZE_ATTRIBUTE = "data-font-size";

export const THEMES = ["default", "high-contrast"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "hubmi-theme";

export function parseFontSize(value: unknown): FontSize {
  return FONT_SIZES.includes(value as FontSize)
    ? (value as FontSize)
    : "default";
}

// Runs in <head> before first paint so a stored size never flashes the default.
export const fontSizeInitScript = `(function(){try{var s=localStorage.getItem(${JSON.stringify(
  FONT_SIZE_STORAGE_KEY,
)});if(${JSON.stringify(
  FONT_SIZES,
)}.indexOf(s)===-1)s="default";document.documentElement.setAttribute(${JSON.stringify(
  FONT_SIZE_ATTRIBUTE,
)},s)}catch(e){}})();`;
