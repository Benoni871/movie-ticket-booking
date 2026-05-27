export function toYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  let id: string | null = null;

  // youtu.be/<id>
  const shortMatch = trimmed.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  if (shortMatch) id = shortMatch[1];

  // youtube.com/watch?v=<id>
  if (!id) {
    const watchMatch = trimmed.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
    if (watchMatch) id = watchMatch[1];
  }

  // youtube.com/embed/<id>
  if (!id) {
    const embedMatch = trimmed.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/);
    if (embedMatch) id = embedMatch[1];
  }

  // youtube.com/shorts/<id>
  if (!id) {
    const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/);
    if (shortsMatch) id = shortsMatch[1];
  }

  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}
