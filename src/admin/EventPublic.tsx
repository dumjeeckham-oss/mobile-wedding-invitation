import styled from '@emotion/styled';
import GalleryWrap from '@/layout/Gallery/GalleryWrap.tsx';
import { getBackground } from './backgrounds.ts';
import { getFont } from './catalog.ts';
import { loadState } from './localRepository.ts';
import { resolveLogo } from './validation.ts';
import { EventRecord } from './types.ts';
import { getKakaoMapLinks, getNaverMapLinks, getYouTubeEmbedUrl, openExternalAppOrWeb } from '@/utils/externalLinks.ts';

const EventPublic = ({ slug }: { slug: string }) => {
  const event = loadState().events.find((item) => item.slug === slug && item.publicationStatus === 'public' && !item.deletedAt);
  if (!event) return <NotFound>공개된 초대장을 찾을 수 없습니다.</NotFound>;
  return <Invitation event={event} />;
};

const Invitation = ({ event }: { event: EventRecord }) => {
  const state = loadState();
  const logo = resolveLogo(event, state.organizations, state.logos);
  const background = getBackground(event.themeSettings.backgroundPresetId);
  const titleFont = getFont(event.fontSettings.title);
  const bodyFont = getFont(event.fontSettings.body);
  const mapName = event.venue || event.title;
  const naver = getNaverMapLinks(mapName, event.address, event.coordinates?.lat || 0, event.coordinates?.lon || 0, 'public');
  const naverCar = getNaverMapLinks(mapName, event.address, event.coordinates?.lat || 0, event.coordinates?.lon || 0, 'car');
  const kakao = getKakaoMapLinks(mapName, event.address, event.coordinates?.lat || 0, event.coordinates?.lon || 0, 'public');
  const car = getKakaoMapLinks(mapName, event.address, event.coordinates?.lat || 0, event.coordinates?.lon || 0, 'car');
  const video = event.sections.video ? getYouTubeEmbedUrl(event.videoUrl) : null;
  return <PublicShell style={{ background: background.css, color: event.themeSettings.textColor || background.textColor, fontFamily: bodyFont.family }}>
    {logo && event.logoVisible && event.logoPosition !== 'hidden' && <Logo position={event.logoPosition} size={event.logoSize}><img src={logo.dataUrl} alt="행사 로고" onError={(image) => { image.currentTarget.style.display = 'none'; }} /></Logo>}
    <small>모바일 초대장</small>
    <h1 style={{ fontFamily: titleFont.family, color: event.themeSettings.accentColor }}>{event.title}</h1>
    <p>{event.intro}</p>
    <Meta>{event.eventType} · {event.host}{event.eventDateTime && ` · ${event.eventDateTime}`}</Meta>
    {event.sections.video && (video ? <Video title={event.videoTitle || '행사 영상'} src={video} /> : <p>동영상 링크를 재생할 수 없습니다.</p>)}
    {event.sections.gallery && <><h2>Gallery</h2><GalleryWrap /></>}
    {event.sections.map && <><h2>오시는 길</h2><p>{event.venue}</p><p>{event.address}</p><p>{event.transportationInfo}</p><p>{event.parkingInfo}</p><MapButtons><a href={naver.webUrl} onClick={(click) => { click.preventDefault(); openExternalAppOrWeb(naver.appUrl, naver.webUrl); }}>네이버 대중교통</a><a href={naverCar.webUrl} onClick={(click) => { click.preventDefault(); openExternalAppOrWeb(naverCar.appUrl, naverCar.webUrl); }}>네이버 차량</a><a href={kakao.webUrl} onClick={(click) => { click.preventDefault(); openExternalAppOrWeb(kakao.appUrl, kakao.webUrl); }}>카카오 대중교통</a><a href={car.webUrl} onClick={(click) => { click.preventDefault(); openExternalAppOrWeb(car.appUrl, car.webUrl); }}>카카오 차량</a></MapButtons></>}
  </PublicShell>;
};

export default EventPublic;

const NotFound = styled.div`padding:40px;text-align:center;`;
const PublicShell = styled.main`width:min(100% - 32px,520px);min-height:100vh;margin:0 auto;padding:32px 16px;box-sizing:border-box;text-align:center;h1{line-height:1.25;}h2{margin-top:32px;}p{white-space:pre-line;line-height:1.8;}`;
const Meta = styled.p`font-size:.9rem;opacity:.8;`;
const Video = styled.iframe`width:100%;aspect-ratio:16/9;border:0;border-radius:10px;margin-top:16px;`;
const MapButtons = styled.div`display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:16px 0;a{padding:10px 12px;border:1px solid currentColor;border-radius:8px;color:inherit;text-decoration:none;}`;
const Logo = styled.div<{position: EventRecord['logoPosition'];size: EventRecord['logoSize']}>`display:flex;justify-content:${p=>p.position==='top-left'?'flex-start':'center'};margin-bottom:16px;img{max-width:${p=>p.size==='large'?'80%':p.size==='medium'?'55%':'35%'};max-height:96px;object-fit:contain;}`;
