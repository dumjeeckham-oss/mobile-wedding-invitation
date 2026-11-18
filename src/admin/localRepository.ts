import { AdminState, EventRecord, LogoAsset, Organization } from './types.ts';

const KEY = 'invite-admin-local-v1';
const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

const initialState = (): AdminState => {
  const timestamp = now();
  const organization: Organization = { id: id('org'), name: '데모 행사 운영팀', defaultLogoSourceType: 'none', createdAt: timestamp, updatedAt: timestamp };
  return {
    organizations: [organization],
    logos: [],
    events: [{
      id: id('evt'), slug: 'design-sample', organizationId: organization.id, title: '모바일 초대장 디자인 샘플', eventType: '공개 디자인 데모', host: organization.name, logoSourceType: 'none',
      intro: '실제 행사가 아닌 디자인 시연용 초대장입니다.', eventDateTime: '', venue: '온라인 디자인 시연 공간', address: '', transportationInfo: '', parkingInfo: '',
      mapSettings: { enabled: false }, videoUrl: '', videoTitle: '', fontSettings: { title: 'noto-serif-kr', body: 'noto-sans-kr', titleSize: 32, bodySize: 16 },
      themeSettings: { backgroundPresetId: 'classic-ivory', backgroundColor: '#fffaf0', textColor: '#3d3028', accentColor: '#a26d52' }, sections: { gallery: true, map: true, video: false, contact: false, guestbook: false },
      logoPosition: 'hidden', logoSize: 'medium', logoVisible: false, publicationStatus: 'public', createdAt: timestamp, updatedAt: timestamp,
    }],
  };
};

export const loadState = (): AdminState => {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? JSON.parse(saved) as AdminState : initialState();
  } catch {
    return initialState();
  }
};

export const saveState = (state: AdminState) => {
  localStorage.setItem(KEY, JSON.stringify(state));
};

export const createEvent = (event: EventRecord): EventRecord => ({ ...event, id: id('evt'), slug: `${event.slug}-${Math.random().toString(36).slice(2, 6)}`, publicationStatus: 'draft', createdAt: now(), updatedAt: now() });
export const createLogo = (file: LogoAsset): LogoAsset => ({ ...file, id: id('logo'), createdAt: now() });
export const createOrganization = (name: string): Organization => ({ id: id('org'), name: name.trim(), createdAt: now(), updatedAt: now() });
