const allowedStatuses = new Set(['draft', 'private', 'public', 'trash']);
const allowedLogoSources = new Set(['upload', 'url', 'none']);

export const validatePayload = (payload: Record<string, unknown>) => {
  const errors: Record<string, string> = {};
  for (const field of ['title', 'host', 'slug']) if (typeof payload[field] !== 'string' || !String(payload[field]).trim()) errors[field] = `${field} is required`;
  if (typeof payload.slug === 'string' && !/^[a-z0-9가-힣][a-z0-9가-힣-]{0,63}$/.test(payload.slug)) errors.slug = 'invalid slug';
  if (payload.publicationStatus && !allowedStatuses.has(String(payload.publicationStatus))) errors.publicationStatus = 'invalid status';
  if (payload.logoSourceType && !allowedLogoSources.has(String(payload.logoSourceType))) errors.logoSourceType = 'invalid logo source';
  if (payload.logoExternalUrl) {
    try { const url = new URL(String(payload.logoExternalUrl)); if (url.protocol !== 'https:' || url.username || url.password || url.hostname === 'localhost' || url.hostname === '127.0.0.1') errors.logoExternalUrl = 'invalid external logo URL'; } catch { errors.logoExternalUrl = 'invalid external logo URL'; }
  }
  if (payload.videoUrl) {
    try { const url = new URL(String(payload.videoUrl)); if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname.toLowerCase())) errors.videoUrl = 'YouTube URL required'; } catch { errors.videoUrl = 'invalid video URL'; }
  }
  return errors;
};

export const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
