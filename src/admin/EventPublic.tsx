import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import GalleryWrap from '@/layout/Gallery/GalleryWrap.tsx';
import { getBackground } from './backgrounds.ts';
import { getFont } from './catalog.ts';
import { toEvent } from './repository.ts';
import { normalizeThemeSettings, validateBackgroundUrl } from './validation.ts';
import { EventRecord } from './types.ts';
import { getKakaoMapLinks, getNaverMapLinks, getYouTubeEmbedUrl, openExternalAppOrWeb } from '@/utils/externalLinks.ts';
import { apiBase } from '../apiBase.ts';

const EventPublic = ({ slug }: { slug: string }) => {
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch(`${apiBase}/api/public/events/${encodeURIComponent(slug)}`).then(async (response) => response.ok ? toEvent(await response.json()) : null).then(setEvent).catch(() => setEvent(null)).finally(() => setLoading(false)); }, [slug]);
  if (loading) return <NotFound>초대장을 불러오는 중입니다.</NotFound>;
  if (!event) return <NotFound>공개된 초대장을 찾을 수 없습니다.</NotFound>;
  return <Invitation event={event} />;
};

const Invitation = ({ event }: { event: EventRecord }) => {
  const logo = event.logoExternalUrl ? { dataUrl: event.logoExternalUrl } : undefined;
  const theme = normalizeThemeSettings(event.themeSettings);
  const background = getBackground(theme.backgroundPresetId);
  const externalBackground = theme.backgroundSourceType === 'url' && theme.backgroundImageUrl && !validateBackgroundUrl(theme.backgroundImageUrl) ? theme.backgroundImageUrl : undefined;
  const overlay = Math.min(80, Math.max(0, theme.backgroundOverlayOpacity || 0)) / 100;
  const backgroundStyle = externalBackground ? { backgroundColor: theme.backgroundFallbackColor || background.backgroundColor, backgroundImage: `linear-gradient(rgba(0,0,0,${overlay}),rgba(0,0,0,${overlay})),url(${JSON.stringify(externalBackground)})`, backgroundSize: theme.backgroundFit || 'cover', backgroundPosition: theme.backgroundPosition || 'center', backgroundRepeat: 'no-repeat' } : { background: background.css, backgroundColor: theme.backgroundFallbackColor || background.backgroundColor };
  const titleFont = getFont(event.fontSettings.title);
  const bodyFont = getFont(event.fontSettings.body);
  const captionFont = getFont('noto-sans-kr');
  const logoCaption = event.host === '진보당 부천시지역위원회' ? '부천시지역위원회' : undefined;
  const mapName = event.venue || event.title;
  const naver = getNaverMapLinks(mapName, event.address, event.coordinates?.lat || 0, event.coordinates?.lon || 0, 'public');
  const naverCar = getNaverMapLinks(mapName, event.address, event.coordinates?.lat || 0, event.coordinates?.lon || 0, 'car');
  const kakao = getKakaoMapLinks(mapName, event.address, event.coordinates?.lat || 0, event.coordinates?.lon || 0, 'public');
  const car = getKakaoMapLinks(mapName, event.address, event.coordinates?.lat || 0, event.coordinates?.lon || 0, 'car');
  const video = event.sections.video ? getYouTubeEmbedUrl(event.videoUrl) : null;
  return <PublicShell style={{ ...backgroundStyle, color: theme.textColor || background.textColor, fontFamily: bodyFont.family }}>
    {logo && event.logoVisible && event.logoPosition !== 'hidden' && event.logoPosition !== 'bottom' && <Logo position={event.logoPosition} size={event.logoSize}><img src={logo.dataUrl} alt="행사 로고" onError={(image) => { image.currentTarget.style.display = 'none'; }} /></Logo>}
    {logoCaption && <InvitationSubtitle style={{ fontFamily: captionFont.family }}><span>{logoCaption}</span></InvitationSubtitle>}
    <small>모바일 초대장</small>
    <h1 style={{ fontFamily: titleFont.family, color: theme.accentColor }}>{event.title}</h1>
    <p>{event.intro}</p>
    <Meta>{event.eventType} · {event.host}{event.eventDateTime && ` · ${event.eventDateTime}`}</Meta>
    {event.sections.video && (video ? <Video title={event.videoTitle || '행사 영상'} src={video} /> : <p>동영상 링크를 재생할 수 없습니다.</p>)}
    {event.sections.gallery && event.gallery.length > 0 && <><h2>Gallery</h2><GalleryWrap images={event.gallery} /></>}
    {event.sections.map && <><h2>오시는 길</h2><p>{event.venue}</p><p>{event.address}</p><p>{event.transportationInfo}</p><p>{event.parkingInfo}</p><MapButtons><MapRow><a href={naverCar.webUrl} onClick={(click) => { click.preventDefault(); openExternalAppOrWeb(naverCar.appUrl, naverCar.webUrl); }}><MapBrand brand="naver">N</MapBrand>네이버 차량</a><a href={naver.webUrl} onClick={(click) => { click.preventDefault(); openExternalAppOrWeb(naver.appUrl, naver.webUrl); }}><MapBrand brand="naver">N</MapBrand>네이버 대중교통</a></MapRow><MapRow><a href={car.webUrl} onClick={(click) => { click.preventDefault(); openExternalAppOrWeb(car.appUrl, car.webUrl); }}><MapBrand brand="kakao">kakao</MapBrand>카카오 차량</a><a href={kakao.webUrl} onClick={(click) => { click.preventDefault(); openExternalAppOrWeb(kakao.appUrl, kakao.webUrl); }}><MapBrand brand="kakao">kakao</MapBrand>카카오 대중교통</a></MapRow></MapButtons></>}
    {logo && event.logoVisible && event.logoPosition === 'bottom' && <Logo position="bottom" size={event.logoSize}><img src={logo.dataUrl} alt="행사 로고" onError={(image) => { image.currentTarget.style.display = 'none'; }} /></Logo>}
  </PublicShell>;
};

export default EventPublic;

const NotFound = styled.div`padding:40px;text-align:center;`;
const PublicShell = styled.main`width:min(100% - 32px,520px);min-height:100vh;margin:0 auto;padding:32px 16px;box-sizing:border-box;text-align:center;h1{line-height:1.25;}h2{margin-top:32px;}p{white-space:pre-line;line-height:1.8;}`;
const Meta = styled.p`font-size:.9rem;opacity:.8;`;
const Video = styled.iframe`width:100%;aspect-ratio:16/9;border:0;border-radius:10px;margin-top:16px;`;
const MapButtons = styled.div`display:flex;flex-direction:column;gap:8px;margin:16px 0;`;
const MapRow = styled.div`display:flex;gap:8px;justify-content:center;flex-wrap:wrap;a{display:inline-flex;align-items:center;justify-content:center;gap:6px;flex:1;min-width:0;padding:10px 8px;border:1px solid currentColor;border-radius:8px;color:inherit;text-decoration:none;}`;
const MapBrand = styled.span<{brand: 'naver' | 'kakao'}>`display:inline-flex;align-items:center;justify-content:center;min-width:${p=>p.brand==='kakao'?'42px':'22px'};height:22px;padding:0 4px;box-sizing:border-box;border-radius:5px;background:${p=>p.brand==='naver'?'#03c75a':'#fee500'};color:${p=>p.brand==='naver'?'#fff':'#181600'};font-size:${p=>p.brand==='kakao'?'.55rem':'.9rem'};font-weight:800;line-height:1;`;
const InvitationSubtitle = styled.div`display:flex;flex-direction:column;gap:2px;margin:8px 0 12px;font-size:.95rem;font-weight:600;letter-spacing:.08em;line-height:1.35;`;
const Logo = styled.div<{position: EventRecord['logoPosition'];size: EventRecord['logoSize']}>`display:flex;justify-content:${p=>p.position==='top-left'?'flex-start':'center'};margin:${p=>p.position==='bottom'?'32px 0 0':'0 0 16px'};order:${p=>p.position==='bottom'?2:0};width:100%;box-sizing:border-box;img{max-width:${p=>p.size==='large'?'80%':p.size==='medium'?'55%':'35%'};max-height:96px;width:auto;height:auto;object-fit:contain;}`;
