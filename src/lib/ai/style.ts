export const POLISH_COPY_STYLE = `Pisz po polsku, prostym językiem o usługach społecznych w Małopolsce.
Krótkie zdania, strona czynna, forma „Ty”.
Bez wykrzykników, bez marketingu i bez pauz.
Nie wymyślaj kwot, dat, nazw partnerów ani statystyk. Brakujące fakty oznacz jako [uzupełnij: …].`;

export function withCopyStyle(systemPrompt: string): string {
  return `${POLISH_COPY_STYLE}\n\n${systemPrompt}`;
}
