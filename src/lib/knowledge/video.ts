const YOUTUBE_ID = /^[\w-]{11}$/;

/** The 11-character video id from a YouTube link, or null for any other URL. */
export function youtubeVideoId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = parsed.pathname.slice(1).split("/")[0] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [, first, second] = parsed.pathname.split("/");
    if (first === "watch") {
      id = parsed.searchParams.get("v");
    } else if (first === "embed" || first === "shorts" || first === "live") {
      id = second ?? null;
    }
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

/** Privacy-enhanced embed address; no autoplay parameter on purpose. */
export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}
