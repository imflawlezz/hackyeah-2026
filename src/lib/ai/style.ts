// TODO(#23): replace with the full copy style from the design pass.
export const POLISH_COPY_STYLE = `Styl tekstu:
- Pisz prostą, konkretną polszczyzną o usługach społecznych w Małopolsce.
- Krótkie zdania, strona czynna, uprzejma forma „Ty”.
- Bez marketingowych przymiotników (np. „rewolucyjny”), bez wykrzykników, bez emoji.
- Nie nadużywaj myślników. Nie wymyślaj faktów ani liczb, których nie ma w danych.`;

export function withCopyStyle(systemPrompt: string): string {
  return `${systemPrompt.trim()}\n\n${POLISH_COPY_STYLE}`;
}
