export type TravelMode = 'public' | 'car';

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);
const NAVER_MAP_HOSTS = new Set(['map.naver.com', 'm.map.naver.com', 'naver.me']);
const KAKAO_MAP_HOSTS = new Set(['map.kakao.com', 'm.map.kakao.com']);

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

export const isAllowedMapUrl = (value: string | undefined, provider: 'naver' | 'kakao') => {
  if (!value || !isHttpUrl(value)) return false;
  const host = new URL(value).hostname.toLowerCase();
  return (provider === 'naver' ? NAVER_MAP_HOSTS : KAKAO_MAP_HOSTS).has(host);
};

export const getYouTubeVideoId = (value?: string) => {
  if (!value || !isHttpUrl(value)) return null;

  const url = new URL(value);
  if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;

  if (url.hostname === 'youtu.be') {
    return /^[a-zA-Z0-9_-]{11}$/.test(url.pathname.slice(1)) ? url.pathname.slice(1) : null;
  }

  const id = url.searchParams.get('v') ?? url.pathname.match(/^\/(?:shorts\/|embed\/)?([a-zA-Z0-9_-]{11})/)?.[1];
  return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
};

export const getYouTubeEmbedUrl = (value?: string) => {
  const id = getYouTubeVideoId(value);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
};

export const hasValidCoordinates = (lat: number, lon: number) =>
  Number.isFinite(lat) && Number.isFinite(lon) && lat !== 0 && lon !== 0 && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;

export const getNaverMapLinks = (name: string, address: string, lat: number, lon: number, mode: TravelMode) => {
  const encodedName = encodeURIComponent(name);
  const appUrl = hasValidCoordinates(lat, lon)
    ? `nmap://route/${mode}?dlat=${lat}&dlng=${lon}&dname=${encodedName}&appname=invite-trial`
    : null;
  return {
    appUrl,
    webUrl: `https://map.naver.com/p/search/${encodeURIComponent(address || name)}`,
  };
};

export const getKakaoMapLinks = (name: string, address: string, lat: number, lon: number, mode: TravelMode) => {
  const modeCode = mode === 'public' ? 'PUB' : 'CAR';
  return {
    appUrl: hasValidCoordinates(lat, lon) ? `kakaomap://route?ep=${lat},${lon}&by=${modeCode}` : null,
    webUrl: hasValidCoordinates(lat, lon)
      ? `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lon}`
      : `https://map.kakao.com/?q=${encodeURIComponent(address || name)}`,
  };
};

export const openExternalAppOrWeb = (appUrl: string | null, webUrl: string) => {
  if (!appUrl) {
    window.open(webUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  let fallbackOpened = false;
  const fallback = () => {
    if (fallbackOpened) return;
    fallbackOpened = true;
    window.open(webUrl, '_blank', 'noopener,noreferrer');
  };
  const timer = window.setTimeout(fallback, 900);
  window.addEventListener('blur', () => window.clearTimeout(timer), { once: true });
  window.location.href = appUrl;
};
