export function appendTranscript(
  current: string,
  transcript: string,
  limit: number,
): string | null {
  if (!transcript.trim()) return current;
  const combined =
    current + (current && !current.endsWith("\n") ? "\n" : "") + transcript;
  return combined.length <= limit ? combined : null;
}
