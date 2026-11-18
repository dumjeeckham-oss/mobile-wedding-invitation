const allowedStatuses = new Set(['draft', 'private', 'public', 'trash']);
const allowedLogoSources = new Set(['upload', 'url', 'none']);
const allowedBackgroundSources = new Set(['preset', 'url', 'upload']);
const allowedBackgroundPresets = new Set(['classic-ivory', 'navy-gold', 'botanical-green', 'floral-pink', 'modern-blue', 'natural-beige', 'burgundy-classic', 'lavender-pastel', 'festival', 'black-premium', 'sky-blue', 'traditional-hanji']);
const allowedBackgroundFits = new Set(['cover', 'contain']);
const allowedBackgroundPositions = new Set(['top', 'center', 'bottom']);

const validateHttpsImageUrl = (value: unknown) => {
  if (typeof value !== 'string' || value.length > 2048) return true;
  try { const url = new URL(value); return url.protocol !== 'https:' || Boolean(url.username || url.password) || ['localhost', '127.0.0.1', '::1'].includes(url.hostname); } catch { return true; }
};

export const validatePayload = (payload: Record<string, unknown>) => {
  const errors: Record<string, string> = {};
  for (const field of ['title', 'host', 'slug']) if (typeof payload[field] !== 'string' || !String(payload[field]).trim()) errors[field] = `${field} is required`;
  if (typeof payload.slug === 'string' && !/^[a-z0-9가-힣][a-z0-9가-힣-]{0,63}$/.test(payload.slug)) errors.slug = 'invalid slug';
  if (payload.publicationStatus && !allowedStatuses.has(String(payload.publicationStatus))) errors.publicationStatus = 'invalid status';
  if (payload.logoSourceType && !allowedLogoSources.has(String(payload.logoSourceType))) errors.logoSourceType = 'invalid logo source';
  if (payload.logoSourceType === 'url' && !payload.logoExternalUrl) errors.logoExternalUrl = '외부 로고 URL을 입력하세요.';
  if (payload.logoExternalUrl) {
    try { const url = new URL(String(payload.logoExternalUrl)); if (url.protocol !== 'https:' || url.username || url.password || url.hostname === 'localhost' || url.hostname === '127.0.0.1') errors.logoExternalUrl = 'invalid external logo URL'; } catch { errors.logoExternalUrl = 'invalid external logo URL'; }
  }
  const theme = payload.themeSettings && typeof payload.themeSettings === 'object' ? payload.themeSettings as Record<string, unknown> : undefined;
  if (theme) {
    if (theme.backgroundSourceType && !allowedBackgroundSources.has(String(theme.backgroundSourceType))) errors.backgroundSourceType = 'invalid background source';
    if (theme.backgroundPresetId && !allowedBackgroundPresets.has(String(theme.backgroundPresetId))) errors.backgroundPresetId = 'invalid background preset';
    if (theme.backgroundFit && !allowedBackgroundFits.has(String(theme.backgroundFit))) errors.backgroundFit = 'invalid background fit';
    if (theme.backgroundPosition && !allowedBackgroundPositions.has(String(theme.backgroundPosition))) errors.backgroundPosition = 'invalid background position';
    if (theme.backgroundSourceType === 'url' && !theme.backgroundImageUrl) errors.backgroundImageUrl = '배경 이미지 URL을 입력하세요.';
    if (theme.backgroundImageUrl && validateHttpsImageUrl(theme.backgroundImageUrl)) errors.backgroundImageUrl = 'invalid background image URL';
    if (theme.backgroundOverlayOpacity !== undefined && (!Number.isFinite(Number(theme.backgroundOverlayOpacity)) || Number(theme.backgroundOverlayOpacity) < 0 || Number(theme.backgroundOverlayOpacity) > 80)) errors.backgroundOverlayOpacity = 'overlay opacity must be 0-80';
    if (theme.backgroundFallbackColor !== undefined && (typeof theme.backgroundFallbackColor !== 'string' || !/^#[0-9a-f]{6}$/i.test(theme.backgroundFallbackColor))) errors.backgroundFallbackColor = 'invalid fallback color';
  }
  if (payload.videoUrl) {
    try { const url = new URL(String(payload.videoUrl)); if (url.protocol !== 'https:' || !['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname.toLowerCase())) errors.videoUrl = 'YouTube URL required'; } catch { errors.videoUrl = 'invalid video URL'; }
  }
  return errors;
};

export const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
