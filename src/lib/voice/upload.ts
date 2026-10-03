export const MAX_AUDIO_BYTES = 2 * 1024 * 1024;
export const MAX_BODY_BYTES = MAX_AUDIO_BYTES + 16 * 1024;
export class UploadError extends Error {
  constructor(public status: number) {
    super("Invalid upload");
  }
}

export async function readAudio(request: Request): Promise<File> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data;"))
    throw new UploadError(415);
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES)
    throw new UploadError(413);
  if (!request.body) throw new UploadError(400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    void reader.cancel();
  }, 10_000);
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new UploadError(413);
      }
      chunks.push(value);
    }
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
  if (timedOut) throw new UploadError(400);
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  let form: FormData;
  try {
    form = await new Response(bytes, {
      headers: { "Content-Type": contentType },
    }).formData();
  } catch {
    throw new UploadError(400);
  }
  const entries = form.getAll("audio");
  const file = entries[0];
  if (entries.length !== 1 || !(file instanceof File) || !file.size)
    throw new UploadError(400);
  if (file.size > MAX_AUDIO_BYTES) throw new UploadError(413);
  const header = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
  const ascii = new TextDecoder("latin1").decode(header);
  const webm =
    header[0] === 0x1a &&
    header[1] === 0x45 &&
    header[2] === 0xdf &&
    header[3] === 0xa3 &&
    ascii.includes("webm") &&
    ascii.includes("A_OPUS");
  const mp4 =
    ascii.slice(4, 8) === "ftyp" &&
    /M4A |mp4|isom|iso[2-9]/.test(ascii.slice(8, 64));
  const mime = file.type.split(";")[0];
  if (webm && mime === "audio/webm")
    return new File([file], "recording.webm", { type: "audio/webm" });
  if (mp4 && mime === "audio/mp4")
    return new File([file], "recording.m4a", { type: "audio/mp4" });
  throw new UploadError(415);
}
