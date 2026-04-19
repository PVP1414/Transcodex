export function getSharePath(mediaId) {
  return `/share/${encodeURIComponent(String(mediaId))}`;
}
