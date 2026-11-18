export interface IData {
  emojis: string[];
  greeting: IGreeting;
  event?: IEvent;
  hostInfo: IHostInfo[];
  locationInfo: ILocationInfo[];
  mapInfo: IMapInfo;
  video?: IVideo;
}

export interface IEvent {
  title: string;
  organizer: string;
  type: string;
  intro: string;
  dateTime?: string;
  venue?: string;
  address?: string;
  detail?: string;
  mainImage?: string;
  galleryImages?: string[];
  themeColor?: string;
  shareTitle?: string;
  shareImage?: string;
  showContact?: boolean;
  showMap?: boolean;
  contact?: string;
  showGallery?: boolean;
}

export interface IVideo {
  enabled: boolean;
  title?: string;
  url?: string;
}

export interface IGreeting {
  mainImg: string;
  title: string;
  date: string;
  message: string;
  host: {
    groom: {
      name: string;
      relation: string;
      parents: Parent;
    };
    bride: {
      name: string;
      relation: string;
      parents: Parent;
    };
  };
  eventDetail: string;
}

export interface BrideAndGroom {
  name: string;
  relation: string;
  parents: Parent;
}

type Parent = { relation: string; isDeceased?: boolean; name: string }[];

export interface IHostInfo {
  host: string;
  accountInfo: { name: string; relation: string; bank: string; account: string }[];
}

export interface IMapInfo {
  enabled?: boolean;
  address1: string;
  address2: string;
  naverMap: string;
  kakaoMap: string;
  lat: number;
  lon: number;
  parking?: string;
  transit?: string;
}

export interface ILocationInfo {
  title: string;
  desc: string;
}
