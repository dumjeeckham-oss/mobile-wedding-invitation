import { getYouTubeVideoId } from '@/utils/externalLinks.ts';
import { EventRecord, LogoAsset, Organization } from './types.ts';

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
export const LOGO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export const slugify = (value: string) => value.trim().toLowerCase()
  .replace(/[^a-z0-9가-힣]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 64);

export const validateEvent = (event: Partial<EventRecord>, existing: EventRecord[] = [], currentId?: string) => {
  const errors: Record<string, string> = {};
  if (!event.title?.trim()) errors.title = '행사명을 입력하세요.';
  if (!event.host?.trim()) errors.host = '주최자 또는 주최 단체를 입력하세요.';
  const slug = slugify(event.slug || event.title || '');
  if (!slug) errors.slug = '영문, 숫자 또는 한글 slug를 입력하세요.';
  if (existing.some((item) => item.slug === slug && item.id !== currentId && !item.deletedAt)) {
    errors.slug = '이미 사용 중인 행사 URL입니다.';
  }
  if (event.videoUrl && !getYouTubeVideoId(event.videoUrl)) errors.videoUrl = 'YouTube watch, youtu.be 또는 shorts 링크만 사용할 수 있습니다.';
  if (event.logoSourceType === 'url' && event.logoExternalUrl) {
    const logoUrlError = validateLogoUrl(event.logoExternalUrl);
    if (logoUrlError) errors.logoExternalUrl = logoUrlError;
  }
  if (event.coordinates && (!Number.isFinite(event.coordinates.lat) || !Number.isFinite(event.coordinates.lon) || event.coordinates.lat < -90 || event.coordinates.lat > 90 || event.coordinates.lon < -180 || event.coordinates.lon > 180)) {
    errors.coordinates = '좌표 범위를 확인하세요.';
  }
  return { errors, slug };
};

export const validateLogo = (file: Pick<File, 'type' | 'size' | 'name'>) => {
  if (!(LOGO_MIME_TYPES as readonly string[]).includes(file.type)) return 'PNG, JPEG, WebP 파일만 업로드할 수 있습니다.';
  if (file.size > MAX_LOGO_BYTES) return '로고 파일은 2MiB 이하만 업로드할 수 있습니다.';
  if (!file.name.trim()) return '파일명을 확인하세요.';
  return null;
};

export const validateLogoUrl = (value: string) => {
  if (value.length > 2048) return '로고 URL은 2048자 이하만 사용할 수 있습니다.';
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return '로고 URL은 HTTPS만 사용할 수 있습니다.';
    if (url.username || url.password) return '사용자명·비밀번호가 포함된 URL은 사용할 수 없습니다.';
    if (['localhost', '127.0.0.1', '::1'].includes(url.hostname)) return '로컬 주소는 사용할 수 없습니다.';
    return null;
  } catch {
    return '올바른 HTTPS 이미지 URL을 입력하세요.';
  }
};

export const resolveLogo = (event: EventRecord, organizations: Organization[], logos: LogoAsset[]) => {
  if (!event.logoVisible || event.logoPosition === 'hidden') return undefined;
  const organization = organizations.find((item) => item.id === event.organizationId);
  if (event.logoSourceType === 'none') return undefined;
  if (event.logoSourceType === 'url') return event.logoExternalUrl ? { id: 'external', name: '외부 로고', mimeType: 'image/png' as const, size: 0, width: 1, height: 1, dataUrl: event.logoExternalUrl, createdAt: '' } : undefined;
  if (!event.customLogoId && organization?.defaultLogoSourceType === 'url' && organization.defaultLogoExternalUrl) {
    return { id: 'external-organization', name: '단체 외부 로고', mimeType: 'image/png' as const, size: 0, width: 1, height: 1, dataUrl: organization.defaultLogoExternalUrl, createdAt: '' };
  }
  const id = event.customLogoId || (organization?.defaultLogoSourceType === 'upload' ? organization.defaultLogoId : undefined);
  return logos.find((logo) => logo.id === id);
};
