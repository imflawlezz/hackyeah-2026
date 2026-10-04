/**
 * Hand-off from /match to the message form when nothing fits the problem.
 * The description travels in sessionStorage, never in the URL: it is the
 * visitor's own text and must not end up in history, logs or referrers.
 */
export const CHALLENGE_DRAFT_KEY = "hubmi-challenge-draft";
export const CHALLENGE_SUBJECT = "Nowe wyzwanie";
export const CHALLENGE_HREF = `/messages/new?kind=ask_rops&subject=${encodeURIComponent(CHALLENGE_SUBJECT)}`;

const MAX_LENGTH = 4000;

/** The message body offered to the visitor: the problem and the chosen category. */
export function challengeDraftText(problem: string, category?: string): string {
  const text = problem.trim();
  const area = category?.trim();
  return (area ? `${text}\n\nKategoria: ${area}` : text).slice(0, MAX_LENGTH);
}

export function saveChallengeDraft(problem: string, category?: string): void {
  try {
    window.sessionStorage.setItem(
      CHALLENGE_DRAFT_KEY,
      challengeDraftText(problem, category),
    );
  } catch {
    // Storage can be blocked; the message form then starts empty.
  }
}

export function readChallengeDraft(): string {
  try {
    return (
      window.sessionStorage
        .getItem(CHALLENGE_DRAFT_KEY)
        ?.slice(0, MAX_LENGTH) ?? ""
    );
  } catch {
    return "";
  }
}

export function clearChallengeDraft(): void {
  try {
    window.sessionStorage.removeItem(CHALLENGE_DRAFT_KEY);
  } catch {
    // Nothing to clear.
  }
}
