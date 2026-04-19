export function getSharePath(mediaId) {
  return `/share/${encodeURIComponent(String(mediaId))}`;
}

export function getShareUrl(mediaId) {
  if (typeof window === "undefined") {
    return getSharePath(mediaId);
  }
  return `${window.location.origin}${getSharePath(mediaId)}`;
}

export async function copyShareUrl(mediaId) {
  const shareUrl = getShareUrl(mediaId);
  await navigator.clipboard.writeText(shareUrl);
  return shareUrl;
}
