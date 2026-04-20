export function canAccessMedia(media, user, apiKey) {
  if (!media) return false;
  if (media.access === "public") return true;

  if (apiKey) return true;

  const userId = user?.id?.toString?.() ?? user?.id;
  const ownerId = media.user?.toString?.() ?? media.user;

  return Boolean(userId && ownerId && userId === ownerId);
}

export function denyMediaAccess(res) {
  return res.status(403).json({
    success: false,
    message: "Media is not publicly shared",
  });
}
