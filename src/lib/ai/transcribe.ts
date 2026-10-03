import "server-only";
import { hasOpenAI, TRANSCRIPTION_MODEL } from "./models";

export async function transcribeAudio(file: File): Promise<string> {
  if (!hasOpenAI || !process.env.OPENAI_API_KEY) throw new Error("Unavailable");
  const form = new FormData();
  form.set("file", file);
  form.set("model", TRANSCRIPTION_MODEL);
  form.set("language", "pl");
  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form,
      signal: AbortSignal.timeout(20_000),
    },
  );
  if (!response.ok) throw new Error("Transcription failed");
  const data: unknown = await response.json();
  if (
    !data ||
    typeof data !== "object" ||
    !("text" in data) ||
    typeof data.text !== "string"
  )
    throw new Error("Invalid transcription");
  return data.text;
}
