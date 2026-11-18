export type PublicationStatus = 'draft' | 'private' | 'public' | 'trash';
export type LogoPosition = 'top-center' | 'top-left' | 'bottom' | 'hidden';
export type LogoSize = 'small' | 'medium' | 'large';
export type LogoSourceType = 'upload' | 'url' | 'none';

export interface LogoAsset {
  id: string;
  name: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  size: number;
  width: number;
  height: number;
  dataUrl: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  defaultLogoId?: string;
  defaultLogoSourceType?: LogoSourceType;
  defaultLogoExternalUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventSections {
  gallery: boolean;
  map: boolean;
  video: boolean;
  contact: boolean;
  guestbook: boolean;
}

export interface FontSettings {
  title: FontId;
  body: FontId;
  titleSize: number;
  bodySize: number;
}

export interface ThemeSettings {
  backgroundPresetId: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  backgroundImageAssetId?: string;
}

export type FontId =
  | 'noto-serif-kr'
  | 'nanum-myeongjo'
  | 'gowun-batang'
  | 'hahmlet'
  | 'noto-sans-kr'
  | 'pretendard'
  | 'ibm-plex-sans-kr'
  | 'nanum-gothic'
  | 'gowun-dodum'
  | 'jua'
  | 'gaegu'
  | 'nanum-brush-script';

export interface EventRecord {
  id: string;
  slug: string;
  organizationId?: string;
  customLogoId?: string;
  logoSourceType: LogoSourceType;
  logoExternalUrl?: string;
  title: string;
  eventType: string;
  host: string;
  intro: string;
  eventDateTime: string;
  venue: string;
  address: string;
  coordinates?: { lat: number; lon: number };
  transportationInfo: string;
  parkingInfo: string;
  mapSettings: { naverUrl?: string; kakaoUrl?: string; enabled: boolean };
  videoUrl: string;
  videoTitle: string;
  fontSettings: FontSettings;
  themeSettings: ThemeSettings;
  sections: EventSections;
  logoPosition: LogoPosition;
  logoSize: LogoSize;
  logoVisible: boolean;
  publicationStatus: PublicationStatus;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminState {
  organizations: Organization[];
  logos: LogoAsset[];
  events: EventRecord[];
}
