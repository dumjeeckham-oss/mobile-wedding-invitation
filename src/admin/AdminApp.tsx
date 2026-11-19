import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { getFont, FONT_OPTIONS } from './catalog.ts';
import { BACKGROUND_PRESETS, getBackground } from './backgrounds.ts';
import { createAdminRepository } from './repository.ts';
import { normalizeThemeSettings, resolveLogo, slugify, validateBackgroundFile, validateBackgroundUrl, validateEvent, validateLogo, validateLogoUrl } from './validation.ts';
import { AdminState, EventRecord, LogoAsset, Organization } from './types.ts';

type Tab = 'dashboard' | 'events' | 'organizations' | 'logos' | 'design';

const newEvent = (): EventRecord => {
  const timestamp = new Date().toISOString();
  return { id: '', slug: 'new-event', title: '', eventType: '일반 행사', host: '', intro: '', eventDateTime: '', venue: '', address: '', mapSettings: { enabled: false }, transportationInfo: '', parkingInfo: '', videoUrl: '', videoTitle: '', gallery: [], fontSettings: { title: 'noto-serif-kr', body: 'noto-sans-kr', titleSize: 32, bodySize: 16 }, themeSettings: normalizeThemeSettings(), sections: { gallery: true, map: true, video: false, contact: false, guestbook: false }, logoSourceType: 'none', logoPosition: 'hidden', logoSize: 'medium', logoVisible: false, publicationStatus: 'draft', createdAt: timestamp, updatedAt: timestamp };
};

const AdminApp = () => {
  const repository = useMemo(() => createAdminRepository(), []);
  const [state, setState] = useState<AdminState>({ organizations: [], logos: [], events: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EventRecord>(newEvent());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [orgName, setOrgName] = useState('');
  const mounted = useRef(true);

  useEffect(() => { mounted.current = true; repository.load().then((loaded) => { if (mounted.current) { setState(loaded); setLoading(false); } }).catch((error: Error) => { if (mounted.current) { setNotice(error.message); setLoading(false); } }); return () => { mounted.current = false; }; }, [repository]);

  const activeEvent = state.events.find((event) => event.id === selectedId);
  const visibleEvents = state.events.filter((event) => !event.deletedAt);
  const draftLogo = useMemo(() => resolveLogo(draft, state.organizations, state.logos), [draft, state]);

  const selectEvent = (event: EventRecord) => { setSelectedId(event.id); setDraft({ ...event }); setErrors({}); setTab('events'); };
  const startCreate = () => { setSelectedId(null); setDraft(newEvent()); setErrors({}); setTab('events'); };

  const saveEvent = async (event: FormEvent) => {
    event.preventDefault();
    const result = validateEvent(draft, state.events, selectedId || undefined);
    setErrors(result.errors);
    if (Object.keys(result.errors).length) return;
    const persistableTheme = draft.themeSettings.backgroundSourceType === 'upload' ? { ...draft.themeSettings, backgroundSourceType: 'preset' as const, backgroundImageUrl: undefined, backgroundImageAssetId: undefined } : draft.themeSettings;
    const normalized = { ...draft, themeSettings: persistableTheme, slug: result.slug, id: selectedId || crypto.randomUUID(), updatedAt: selectedId ? draft.updatedAt : '', createdAt: selectedId ? draft.createdAt : new Date().toISOString() };
    try { const saved = await repository.saveEvent(normalized, selectedId || undefined); const refreshed = await repository.load(); setState(refreshed); setNotice(draft.themeSettings.backgroundSourceType === 'upload' ? '행사는 저장했지만 배경 파일은 영구 저장소 연결 전이라 저장하지 않았습니다.' : '서버에 행사를 저장했습니다.'); setSelectedId(saved.id); setDraft(saved); } catch (error) { setNotice(error instanceof Error ? error.message : '저장에 실패했습니다. 입력 내용을 유지합니다.'); }
  };

  const cloneEvent = async () => {
    if (!activeEvent) return;
    try { const cloned = await repository.cloneEvent(activeEvent.id); setState(await repository.load()); setNotice('행사를 복제했습니다.'); selectEvent(cloned); } catch (error) { setNotice(error instanceof Error ? error.message : '복제에 실패했습니다.'); }
  };

  const changeStatus = async (status: EventRecord['publicationStatus']) => {
    if (!selectedId) return;
    try { const updated = await repository.setEventStatus(selectedId, status); setState(await repository.load()); setDraft(updated); setNotice(status === 'public' ? '행사를 공개했습니다.' : status === 'trash' ? '휴지통으로 이동했습니다.' : status === 'draft' ? '행사를 복구했습니다.' : '행사 상태를 변경했습니다.'); } catch (error) { setNotice(error instanceof Error ? error.message : '상태 변경에 실패했습니다.'); }
  };

  const deleteEvent = async () => {
    if (!selectedId || draft.publicationStatus === 'trash') return;
    if (!window.confirm(`“${draft.title || '제목 없는 행사'}”를 삭제하시겠습니까? 삭제된 행사는 휴지통으로 이동하며 공개 링크에서 보이지 않습니다.`)) return;
    try {
      await repository.setEventStatus(selectedId, 'trash');
      setState(await repository.load());
      setSelectedId(null);
      setDraft(newEvent());
      setTab('dashboard');
      setNotice('행사를 삭제했습니다. 데이터는 휴지통에 보관됩니다.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '행사 삭제에 실패했습니다.');
    }
  };

  const createOrg = async () => {
    if (!orgName.trim()) return;
    try { await repository.createOrganization(orgName); setState(await repository.load()); setNotice('단체를 등록했습니다.'); setOrgName(''); } catch (error) { setNotice(error instanceof Error ? error.message : '단체 등록에 실패했습니다.'); }
  };
  const updateOrg = async (organizationId: string, patch: Partial<Organization>) => {
    try { await repository.updateOrganization(organizationId, patch); setState(await repository.load()); setNotice('단체 설정을 저장했습니다.'); } catch (error) { setNotice(error instanceof Error ? error.message : '단체 설정 저장에 실패했습니다.'); }
  };

  const uploadLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const validationError = validateLogo(file);
    if (validationError) { setNotice(validationError); return; }
    try {
      await readImage(file);
      setNotice('파일 검증은 완료했지만 영구 이미지 저장소가 연결되지 않아 저장 기능은 준비 중입니다. 외부 HTTPS URL을 사용하세요.');
    } catch { setNotice('이미지 콘텐츠를 읽을 수 없습니다. PNG, JPEG, WebP 파일을 확인하세요.'); }
  };

  const copyLink = async () => {
    if (!draft.slug) return;
    const url = `${window.location.origin}/e/${draft.slug}`;
    try { await navigator.clipboard.writeText(url); setNotice('초대장 링크를 복사했습니다.'); } catch { setNotice(url); }
  };

  if (loading) return <Shell><Body><Section><h2>관리자 데이터 불러오는 중</h2><p>Worker API 인증과 D1 연결을 확인하고 있습니다.</p></Section></Body></Shell>;
  return (
    <Shell>
      <Header><div><Eyebrow>INVITE ADMIN · API</Eyebrow><h1>초대장 관리</h1></div><a href="/">공개 데모 보기</a></Header>
      <Body>
        <Nav>{(['dashboard', 'events', 'organizations', 'logos', 'design'] as Tab[]).map((item) => <NavButton key={item} active={tab === item} onClick={() => setTab(item)}>{({ dashboard: '대시보드', events: '행사 관리', organizations: '단체 관리', logos: '로고 관리', design: '디자인 설정' } as Record<Tab, string>)[item]}</NavButton>)}</Nav>
        {notice && <Notice role="status">{notice === 'Failed to fetch' ? <><strong>Cloudflare Access 로그인이 필요합니다.</strong> <a href="/api/admin/events" target="_blank" rel="noreferrer">Access 로그인</a> 후 이 화면을 새로고침하세요.</> : notice}</Notice>}
        {tab === 'dashboard' && <Dashboard events={visibleEvents} onCreate={startCreate} onSelect={selectEvent} />}
        {tab === 'events' && <EventEditor draft={draft} setDraft={setDraft} errors={errors} organizations={state.organizations} logos={state.logos} selected={Boolean(selectedId)} onSave={saveEvent} onClone={cloneEvent} onStatus={changeStatus} onDelete={deleteEvent} onCopyLink={copyLink} previewLogo={draftLogo} />}
        {tab === 'organizations' && <Organizations organizations={state.organizations} events={state.events} logos={state.logos} orgName={orgName} setOrgName={setOrgName} onCreate={createOrg} onUpdate={updateOrg} onMessage={setNotice} />}
        {tab === 'logos' && <Logos logos={state.logos} organizations={state.organizations} onUpload={uploadLogo} />}
        {tab === 'design' && <DesignGuide />}
      </Body>
    </Shell>
  );
};

const Dashboard = ({ events, onCreate, onSelect }: { events: EventRecord[]; onCreate: () => void; onSelect: (event: EventRecord) => void }) => <Section><SectionHead><div><h2>대시보드</h2><p>단일 관리자가 여러 행사와 단체를 관리합니다.</p></div><Primary onClick={onCreate}>새 행사 만들기</Primary></SectionHead><Stats><Stat><strong>{events.length}</strong><span>행사</span></Stat><Stat><strong>{events.filter((event) => event.publicationStatus === 'public').length}</strong><span>공개</span></Stat><Stat><strong>{events.filter((event) => event.publicationStatus === 'draft').length}</strong><span>임시저장</span></Stat></Stats><h3>최근 행사</h3><List>{events.map((event) => <ListItem key={event.id} onClick={() => onSelect(event)}><div><strong>{event.title || '제목 없는 행사'}</strong><small>/{event.slug}</small></div><Badge status={event.publicationStatus}>{event.publicationStatus}</Badge></ListItem>)}</List></Section>;

const EventEditor = ({ draft, setDraft, errors, organizations, logos, selected, onSave, onClone, onStatus, onDelete, onCopyLink, previewLogo }: { draft: EventRecord; setDraft: (event: EventRecord) => void; errors: Record<string, string>; organizations: Organization[]; logos: LogoAsset[]; selected: boolean; onSave: (event: FormEvent) => void; onClone: () => void; onStatus: (status: EventRecord['publicationStatus']) => void; onDelete: () => void; onCopyLink: () => void; previewLogo?: LogoAsset }) => {
  const [backgroundUploadPreview, setBackgroundUploadPreview] = useState<string>();
  const update = <K extends keyof EventRecord>(key: K, value: EventRecord[K]) => setDraft({ ...draft, [key]: value });
  const updateSection = (key: keyof EventRecord['sections']) => setDraft({ ...draft, sections: { ...draft.sections, [key]: !draft.sections[key] } });
  const updateTheme = (patch: Partial<EventRecord['themeSettings']>) => update('themeSettings', normalizeThemeSettings({ ...draft.themeSettings, ...patch }));
  const updateThemePreset = (id: string) => { const preset = getBackground(id); updateTheme({ backgroundSourceType: 'preset', backgroundPresetId: preset.id, backgroundImageUrl: undefined, backgroundImageAssetId: undefined, backgroundColor: preset.backgroundColor, backgroundFallbackColor: preset.backgroundColor, textColor: preset.textColor, accentColor: preset.accentColor }); };
  const updateBackgroundSource = (source: NonNullable<EventRecord['themeSettings']['backgroundSourceType']>) => updateTheme({ backgroundSourceType: source });
  const uploadBackground = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; const validationError = validateBackgroundFile(file); if (validationError) { updateTheme({ backgroundSourceType: 'preset' }); setBackgroundUploadPreview(undefined); return; } try { const image = await readImage(file); setBackgroundUploadPreview(image.url); updateTheme({ backgroundSourceType: 'upload' }); } catch { setBackgroundUploadPreview(undefined); } };
  const setLogoSource = (source: EventRecord['logoSourceType']) => update('logoSourceType', source);
  return <Section>
    <SectionHead><div><h2>{selected ? '행사 수정' : '새 행사'}</h2><p>저장 전에는 공개 초대장에 반영되지 않습니다.</p></div><PreviewCard event={draft} logo={previewLogo} backgroundImageUrl={backgroundUploadPreview} /></SectionHead>
    <QuickActions><Primary type="submit" form="event-editor-form">저장</Primary></QuickActions>
    <form id="event-editor-form" onSubmit={onSave}>
      <Grid>
        <Field label="행사명" error={errors.title}><input value={draft.title} onChange={(event) => update('title', event.target.value)} /></Field>
        <Field label="고유 URL (slug)" error={errors.slug}><input value={draft.slug} onChange={(event) => update('slug', slugify(event.target.value))} /></Field>
        <Field label="주최 단체"><select value={draft.organizationId || ''} onChange={(event) => update('organizationId', event.target.value || undefined)}><option value="">개인 행사</option>{organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select></Field>
        <Field label="행사 유형"><input value={draft.eventType} onChange={(event) => update('eventType', event.target.value)} /></Field>
        <Field label="주최자" error={errors.host}><input value={draft.host} onChange={(event) => update('host', event.target.value)} /></Field>
        <Field label="일시"><input type="datetime-local" value={draft.eventDateTime} onChange={(event) => update('eventDateTime', event.target.value)} /></Field>
        <Field label="장소"><input value={draft.venue} onChange={(event) => update('venue', event.target.value)} /></Field>
        <Field label="주소"><input value={draft.address} onChange={(event) => update('address', event.target.value)} /></Field>
        <Field wide label="소개 문구"><textarea value={draft.intro} onChange={(event) => update('intro', event.target.value)} /></Field>
        <Field wide label="갤러리 이미지 URL (한 줄에 하나)" error={errors.gallery}><textarea value={draft.gallery.map((image) => image.source).join('\n')} placeholder="https://example.com/image.jpg" onChange={(event) => update('gallery', event.target.value.split('\n').map((source) => source.trim()).filter(Boolean).map((source) => ({ source, thumbnail: source, width: 1200, height: 800, alt: draft.title || '행사 이미지' })))} /></Field>
        <Field wide label="대중교통 안내"><textarea value={draft.transportationInfo} onChange={(event) => update('transportationInfo', event.target.value)} /></Field>
        <Field wide label="주차 안내"><textarea value={draft.parkingInfo} onChange={(event) => update('parkingInfo', event.target.value)} /></Field>
        <Field label="YouTube URL" error={errors.videoUrl}><input value={draft.videoUrl} onChange={(event) => update('videoUrl', event.target.value)} placeholder="https://youtu.be/..." /></Field>
        <Field label="영상 제목"><input value={draft.videoTitle} onChange={(event) => update('videoTitle', event.target.value)} /></Field>
      </Grid>
      <Panel><h3>지도·섹션</h3><Toggle label="지도 사용" checked={draft.mapSettings.enabled} onChange={() => update('mapSettings', { ...draft.mapSettings, enabled: !draft.mapSettings.enabled })} /><div className="checks">{(Object.keys(draft.sections) as (keyof EventRecord['sections'])[]).map((key) => <Toggle key={key} label={({ gallery: '갤러리', map: '지도', video: '동영상', contact: '연락처', guestbook: '방명록' } as Record<string, string>)[key]} checked={draft.sections[key]} onChange={() => updateSection(key)} />)}</div></Panel>
      <Panel><h3>로고</h3><div className="row"><label>소스<select value={draft.logoSourceType} onChange={(event) => setLogoSource(event.target.value as EventRecord['logoSourceType'])}><option value="none">로고 없음</option><option value="upload">업로드 이미지</option><option value="url">외부 HTTPS URL</option></select></label>{draft.logoSourceType === 'upload' && <label>행사별 로고<select value={draft.customLogoId || ''} onChange={(event) => update('customLogoId', event.target.value || undefined)}><option value="">단체 기본 로고 사용</option>{logos.map((logo) => <option key={logo.id} value={logo.id}>{logo.name}</option>)}</select></label>}{draft.logoSourceType === 'url' && <Field label="로고 URL" error={errors.logoExternalUrl}><input value={draft.logoExternalUrl || ''} onChange={(event) => update('logoExternalUrl', event.target.value)} placeholder="https://example.com/logo.png" /></Field>}<label>위치<select value={draft.logoPosition} onChange={(event) => update('logoPosition', event.target.value as EventRecord['logoPosition'])}><option value="hidden">숨김</option><option value="top-center">상단 중앙</option><option value="top-left">상단 왼쪽</option><option value="bottom">하단</option></select></label><label>크기<select value={draft.logoSize} onChange={(event) => update('logoSize', event.target.value as EventRecord['logoSize'])}><option value="small">작게</option><option value="medium">보통</option><option value="large">크게</option></select></label></div><Toggle label="로고 표시" checked={draft.logoVisible} onChange={() => update('logoVisible', !draft.logoVisible)} /></Panel>
      <Panel><h3>배경 디자인</h3><BackgroundChoices value={draft.themeSettings.backgroundPresetId} onChange={updateThemePreset} /><div className="row"><label>배경 소스<select value={draft.themeSettings.backgroundSourceType || 'preset'} onChange={(event) => updateBackgroundSource(event.target.value as NonNullable<EventRecord['themeSettings']['backgroundSourceType']>)}><option value="preset">기본 배경 12종</option><option value="url">외부 HTTPS 이미지 URL</option><option value="upload">이미지 파일 업로드</option></select></label>{draft.themeSettings.backgroundSourceType === 'url' && <Field label="배경 이미지 URL" error={errors.backgroundImageUrl}><input value={draft.themeSettings.backgroundImageUrl || ''} onChange={(event) => updateTheme({ backgroundImageUrl: event.target.value })} onBlur={() => { if (draft.themeSettings.backgroundImageUrl) { const error = validateBackgroundUrl(draft.themeSettings.backgroundImageUrl); if (error) setDraft({ ...draft, themeSettings: { ...draft.themeSettings, backgroundSourceType: 'url' } }); } }} placeholder="https://example.com/background.webp" /></Field>}{draft.themeSettings.backgroundSourceType === 'upload' && <label>배경 파일<input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadBackground} /></label>}</div><p>모바일 1080×1920px 권장 · 고해상도 1440×2560px · 가로형 1920×1080px · WebP/JPG/PNG · 권장 500KB 이하 · 최대 2MB · 세로 9:16 권장 · 글자·로고는 이미지에 직접 넣지 않는 것을 권장합니다.</p><div className="row"><label>표시 방식<select value={draft.themeSettings.backgroundFit || 'cover'} onChange={(event) => updateTheme({ backgroundFit: event.target.value as 'cover' | 'contain' })}><option value="cover">cover</option><option value="contain">contain</option></select></label><label>기준 위치<select value={draft.themeSettings.backgroundPosition || 'center'} onChange={(event) => updateTheme({ backgroundPosition: event.target.value as 'top' | 'center' | 'bottom' })}><option value="top">위</option><option value="center">가운데</option><option value="bottom">아래</option></select></label><label>오버레이 강도<input type="range" min="0" max="80" value={draft.themeSettings.backgroundOverlayOpacity ?? 0} onChange={(event) => updateTheme({ backgroundOverlayOpacity: Number(event.target.value) })} /><span>{draft.themeSettings.backgroundOverlayOpacity ?? 0}%</span></label><label>대체 색상<input type="color" value={draft.themeSettings.backgroundFallbackColor || draft.themeSettings.backgroundColor} onChange={(event) => updateTheme({ backgroundFallbackColor: event.target.value })} /></label></div>{draft.themeSettings.backgroundSourceType === 'upload' && <small>파일은 로컬 미리보기만 제공하며, 저장소 연결 전에는 서버에 저장되지 않습니다.</small>}</Panel>
      <Panel><h3>폰트·색상</h3><div className="row"><label>제목 폰트<select value={draft.fontSettings.title} onChange={(event) => update('fontSettings', { ...draft.fontSettings, title: event.target.value as EventRecord['fontSettings']['title'] })}>{FONT_OPTIONS.map((font) => <option key={font.id} value={font.id}>{font.label}</option>)}</select></label><label>본문 폰트<select value={draft.fontSettings.body} onChange={(event) => update('fontSettings', { ...draft.fontSettings, body: event.target.value as EventRecord['fontSettings']['body'] })}>{FONT_OPTIONS.map((font) => <option key={font.id} value={font.id}>{font.label}</option>)}</select></label><label>강조 색상<input type="color" value={draft.themeSettings.accentColor} onChange={(event) => update('themeSettings', { ...draft.themeSettings, accentColor: event.target.value })} /></label></div><FontPreviewGroup label="제목 폰트 미리보기" value={draft.fontSettings.title} onChange={(title) => update('fontSettings', { ...draft.fontSettings, title })} sample="모바일 초대장" /><FontPreviewGroup label="본문 폰트 미리보기" value={draft.fontSettings.body} onChange={(body) => update('fontSettings', { ...draft.fontSettings, body })} sample="가나다라 한글 초대 문구" /></Panel>
      <Actions><Primary type="submit">임시저장</Primary>{selected && <><button type="button" onClick={() => onStatus(draft.publicationStatus === 'public' ? 'private' : 'public')}>{draft.publicationStatus === 'public' ? '비공개 전환' : '공개 전환'}</button><button type="button" onClick={onClone}>복제</button>{draft.publicationStatus === 'trash' ? <button type="button" onClick={() => onStatus('draft')}>복구</button> : <button type="button" onClick={onDelete}>행사 삭제</button>}<button type="button" onClick={onCopyLink}>링크 복사</button></>}</Actions>
    </form>
  </Section>;
};

const Organizations = ({ organizations, events, logos, orgName, setOrgName, onCreate, onUpdate, onMessage }: { organizations: Organization[]; events: EventRecord[]; logos: LogoAsset[]; orgName: string; setOrgName: (value: string) => void; onCreate: () => void; onUpdate: (id: string, patch: Partial<Organization>) => void; onMessage: (value: string) => void }) => <Section><SectionHead><div><h2>단체 관리</h2><p>단체 기본 로고는 여러 행사에서 재사용됩니다.</p></div></SectionHead><div className="row"><input value={orgName} onChange={(event) => setOrgName(event.target.value)} placeholder="단체명" /><Primary onClick={onCreate}>단체 등록</Primary></div><List>{organizations.map((org) => <ListItem key={org.id}><div><strong>{org.name}</strong><small>{events.filter((event) => event.organizationId === org.id).length}개 행사</small></div><label>기본 로고 방식<select value={org.defaultLogoSourceType || 'none'} onChange={(event) => onUpdate(org.id, { defaultLogoSourceType: event.target.value as Organization['defaultLogoSourceType'] })}><option value="none">로고 없음</option><option value="upload">업로드 이미지</option><option value="url">외부 HTTPS URL</option></select></label>{org.defaultLogoSourceType === 'upload' && <label>업로드 로고<select value={org.defaultLogoId || ''} onChange={(event) => onUpdate(org.id, { defaultLogoId: event.target.value || undefined })}><option value="">선택하세요</option>{logos.map((logo) => <option key={logo.id} value={logo.id}>{logo.name}</option>)}</select></label>}{org.defaultLogoSourceType === 'url' && <label>기본 로고 URL<input defaultValue={org.defaultLogoExternalUrl || ''} placeholder="https://example.com/logo.png" onBlur={(event) => { const error = validateLogoUrl(event.target.value); if (error) { onMessage(error); return; } onUpdate(org.id, { defaultLogoExternalUrl: event.target.value }); }} /></label>}</ListItem>)}</List></Section>;

const Logos = ({ logos, organizations, onUpload }: { logos: LogoAsset[]; organizations: Organization[]; onUpload: (event: ChangeEvent<HTMLInputElement>) => void }) => <Section><SectionHead><div><h2>로고 관리</h2><p>PNG, JPEG, WebP · 2MiB 이하 · 로컬 테스트 저장소</p></div><label className="upload"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={onUpload} />로고 업로드</label></SectionHead><List>{logos.map((logo) => <ListItem key={logo.id}><img className="logo-thumb" src={logo.dataUrl} alt={logo.name} /><div><strong>{logo.name}</strong><small>{logo.mimeType} · {(logo.size / 1024).toFixed(1)}KiB · {logo.width}×{logo.height}</small></div><span>{organizations.some((org) => org.defaultLogoId === logo.id) ? '단체 기본' : '행사 선택 가능'}</span></ListItem>)}</List></Section>;

const DesignGuide = () => <Section><h2>디자인 설정</h2><p>행사 편집기의 폰트·색상·로고 설정은 저장 즉시 로컬 미리보기에 반영됩니다.</p><ul><li>허용 폰트 12종만 선택 가능</li><li>본문 기본 크기 16px 이상 권장</li><li>로고는 원본 비율을 유지하고 콘텐츠 영역을 침범하지 않음</li><li>최종 웹폰트 라이선스 고지는 P2-B2 배포 전에 보존</li></ul></Section>;

const BackgroundChoices = ({ value, onChange }: { value: string; onChange: (id: string) => void }) => <BackgroundGrid>{BACKGROUND_PRESETS.map((preset) => <button type="button" key={preset.id} aria-pressed={value === preset.id} onClick={() => onChange(preset.id)}><span style={{ background: preset.css }} /><small>{preset.label}</small></button>)}</BackgroundGrid>;
const FontPreviewGroup = ({ label, value, onChange, sample }: { label: string; value: EventRecord['fontSettings']['title']; onChange: (value: EventRecord['fontSettings']['title']) => void; sample: string }) => <FontPreviewSection><strong>{label}</strong><FontPreviewGrid>{FONT_OPTIONS.map((font) => <button type="button" key={font.id} aria-pressed={value === font.id} onClick={() => onChange(font.id)}><small>{font.label}</small><span style={{ fontFamily: font.family }}>{sample}</span></button>)}</FontPreviewGrid></FontPreviewSection>;

const PreviewCard = ({ event, logo, backgroundImageUrl }: { event: EventRecord; logo?: LogoAsset; backgroundImageUrl?: string }) => { const background = getBackground(event.themeSettings.backgroundPresetId); const imageUrl = backgroundImageUrl || (event.themeSettings.backgroundSourceType === 'url' ? event.themeSettings.backgroundImageUrl : undefined); const logoUrl = logo?.dataUrl || (event.logoSourceType === 'url' ? event.logoExternalUrl : undefined); const backgroundStyle = imageUrl ? { backgroundColor: event.themeSettings.backgroundFallbackColor || background.backgroundColor, backgroundImage: `linear-gradient(rgba(0,0,0,${(event.themeSettings.backgroundOverlayOpacity || 0) / 100}),rgba(0,0,0,${(event.themeSettings.backgroundOverlayOpacity || 0) / 100})),url(${JSON.stringify(imageUrl)})`, backgroundSize: event.themeSettings.backgroundFit || 'cover', backgroundPosition: event.themeSettings.backgroundPosition || 'center', backgroundRepeat: 'no-repeat' } : { background: background.css }; return <Preview><div style={{ ...backgroundStyle, color: event.themeSettings.textColor || background.textColor, fontFamily: getFont(event.fontSettings.title).family }}><small>실시간 미리보기</small>{logoUrl && event.logoVisible && event.logoPosition !== 'hidden' && <img src={logoUrl} alt="행사 로고 미리보기" onError={(error) => { error.currentTarget.style.display = 'none'; }} style={{ maxWidth: event.logoSize === 'large' ? '80%' : event.logoSize === 'medium' ? '55%' : '35%' }} />}<h3>{event.title || '행사명 미리보기'}</h3><p style={{ fontFamily: getFont(event.fontSettings.body).family, fontSize: `${Math.max(16, event.fontSettings.bodySize)}px` }}>{event.intro || '소개 문구 미리보기'}</p></div></Preview>; };

const Field = ({ label, error, wide, children }: { label: string; error?: string; wide?: boolean; children: React.ReactNode }) => <FieldStyle wide={wide}><span>{label}</span>{children}{error && <em>{error}</em>}</FieldStyle>;
const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => <ToggleStyle><input type="checkbox" checked={checked} onChange={onChange} /><span>{label}</span></ToggleStyle>;
const readImage = (file: File) => new Promise<{ url: string; width: number; height: number }>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error('read')); reader.onload = () => { const image = new Image(); image.onerror = () => reject(new Error('decode')); image.onload = () => resolve({ url: String(reader.result), width: image.naturalWidth, height: image.naturalHeight }); image.src = String(reader.result); }; reader.readAsDataURL(file); });

export default AdminApp;

const Shell = styled.div`width:100%;max-width:1100px;min-width:0;box-sizing:border-box;margin:0 auto;min-height:100vh;background:#f7f5f2;color:#332b2b;font-family:system-ui,sans-serif;`;
const Header = styled.header`display:flex;justify-content:space-between;align-items:center;padding:24px;gap:16px;background:#fff;border-bottom:1px solid #eadfdf;h1{margin:4px 0;font-size:1.6rem;}a{color:#7c4e60;}`;
const Eyebrow = styled.small`letter-spacing:.12em;color:#a36b7f;font-weight:700;`;
const Body = styled.main`padding:20px;`;
const Nav = styled.nav`display:flex;gap:8px;min-width:0;overflow-x:auto;margin-bottom:16px;`;
const NavButton = styled.button<{active:boolean}>`border:1px solid #e2d5d5;background:${p=>p.active?'#7c4e60':'#fff'};color:${p=>p.active?'#fff':'#533e44'};padding:10px 14px;border-radius:999px;white-space:nowrap;cursor:pointer;`;
const Notice = styled.div`padding:12px;background:#fff4d7;border:1px solid #ecd28a;border-radius:10px;margin-bottom:16px;`;
const Section = styled.section`background:#fff;border:1px solid #eadfdf;border-radius:16px;padding:20px;margin-bottom:16px;h2{margin:0 0 6px;}h3{margin-top:24px;}p{color:#6f6262;margin-top:4px;}`;
const SectionHead = styled.div`display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:20px;@media(max-width:680px){flex-direction:column;}`;
const Primary = styled.button`background:#7c4e60;color:white;border:0;border-radius:8px;padding:10px 14px;cursor:pointer;white-space:nowrap;`;
const Stats = styled.div`display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:20px 0;`;
const Stat = styled.div`padding:16px;background:#faf7f7;border-radius:12px;display:flex;flex-direction:column;strong{font-size:1.7rem;color:#7c4e60;}`;
const List = styled.div`display:flex;flex-direction:column;gap:8px;`;
const ListItem = styled.div`display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid #eee3e3;border-radius:10px;cursor:pointer;strong,small{display:block;}small{color:#8b7d7d;font-size:.82rem;margin-top:3px;}.logo-thumb{width:48px;height:48px;object-fit:contain;background:#f7f5f2;border-radius:6px;}`;
const Badge = styled.span<{status:string}>`font-size:.78rem;padding:4px 8px;border-radius:999px;background:${p=>p.status==='public'?'#e0f2e9':p.status==='trash'?'#f5dfdf':'#f4ecd6'};`;
const Grid = styled.div`display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;@media(max-width:680px){grid-template-columns:1fr;}`;
const FieldStyle = styled.label<{wide?:boolean}>`display:flex;flex-direction:column;gap:6px;grid-column:${p=>p.wide?'1/-1':'auto'};span{font-size:.85rem;font-weight:700;}input,textarea,select{font:inherit;border:1px solid #d9cece;border-radius:8px;padding:10px;background:#fff;box-sizing:border-box;width:100%;}textarea{min-height:80px;resize:vertical;}em{font-style:normal;color:#ba4b4b;font-size:.8rem;}`;
const Panel = styled.div`border-top:1px solid #eee3e3;margin-top:22px;padding-top:4px;.checks{display:flex;flex-wrap:wrap;gap:10px;}`;
const Actions = styled.div`display:flex;gap:8px;flex-wrap:wrap;margin-top:20px;button{border:1px solid #d9cece;background:#fff;color:#533e44;border-radius:8px;padding:10px 12px;cursor:pointer;}button[type="submit"]{background:#7c4e60;color:#fff;border:0;}`;
const QuickActions = styled.div`display:flex;justify-content:flex-end;margin:-4px 0 16px;position:sticky;top:8px;z-index:2;button{box-shadow:0 4px 12px rgba(82,52,63,.18);}`;
const Preview = styled.div`width:240px;border:1px solid #eadfdf;border-radius:12px;overflow:hidden;flex:0 0 auto;div{min-height:150px;padding:12px;text-align:center;}img{display:block;margin:8px auto;max-height:45px;object-fit:contain;}h3{margin:12px 0 6px;}p{margin:0;}`;
const BackgroundGrid = styled.div`display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;@media(max-width:680px){grid-template-columns:repeat(3,minmax(0,1fr));}button{border:1px solid #ddd0d0;background:white;border-radius:8px;padding:5px;cursor:pointer;text-align:left;}button[aria-pressed="true"]{outline:3px solid #7c4e60;}span{display:block;height:42px;border-radius:5px;}small{display:block;padding:5px 2px;font-size:.72rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}`;
const FontPreviewSection = styled.div`margin-top:16px;strong{display:block;margin-bottom:8px;font-size:.9rem;}`;
const FontPreviewGrid = styled.div`display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;@media(max-width:680px){grid-template-columns:repeat(2,minmax(0,1fr));}button{min-width:0;border:1px solid #ddd0d0;background:#fff;border-radius:8px;padding:8px;text-align:left;cursor:pointer;}button[aria-pressed="true"]{outline:3px solid #7c4e60;}small,span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}small{font-size:.72rem;color:#7c4e60;margin-bottom:4px;}span{font-size:1rem;}`;
const ToggleStyle = styled.label`display:inline-flex;align-items:center;gap:6px;margin:8px 12px 8px 0;cursor:pointer;`;
