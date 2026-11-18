import { createEvent as createLocalEvent, createOrganization as createLocalOrganization, loadState, saveState } from './localRepository.ts';
import { AdminState, EventRecord, Organization } from './types.ts';
import { normalizeThemeSettings } from './validation.ts';
import { apiBase } from '../apiBase.ts';

export interface AdminRepository {
  load(): Promise<AdminState>;
  saveEvent(event: EventRecord, existingId?: string): Promise<EventRecord>;
  cloneEvent(eventId: string): Promise<EventRecord>;
  setEventStatus(eventId: string, status: EventRecord['publicationStatus']): Promise<EventRecord>;
  createOrganization(name: string): Promise<Organization>;
  updateOrganization(id: string, patch: Partial<Organization>): Promise<Organization>;
}

const parseJson = async (response: Response) => {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.errors ? Object.values(body.errors).join(' ') : body?.error;
    throw new Error(message || `API 요청이 실패했습니다. (${response.status})`);
  }
  return body;
};

export const toEvent = (row: any): EventRecord => ({
  id: String(row.id ?? row.event_id), slug: String(row.slug ?? ''), organizationId: row.organizationId ?? row.organization_id ?? undefined,
  customLogoId: row.customLogoId ?? row.custom_logo_asset_id ?? undefined, logoSourceType: row.logoSourceType ?? row.logo_source_type ?? 'none', logoExternalUrl: row.logoExternalUrl ?? row.logo_external_url ?? undefined,
  title: String(row.title ?? ''), eventType: String(row.eventType ?? row.event_type ?? '일반 행사'), host: String(row.host ?? ''), intro: String(row.intro ?? ''), eventDateTime: String(row.eventDateTime ?? row.event_datetime ?? ''), venue: String(row.venue ?? ''), address: String(row.address ?? ''), coordinates: row.coordinates,
  transportationInfo: String(row.transportationInfo ?? row.transportation_info ?? ''), parkingInfo: String(row.parkingInfo ?? row.parking_info ?? ''), mapSettings: row.mapSettings ?? row.map_settings ?? { enabled: false }, videoUrl: String(row.videoUrl ?? row.video_url ?? ''), videoTitle: String(row.videoTitle ?? row.video_title ?? ''), gallery: Array.isArray(row.gallery) ? row.gallery : [], fontSettings: row.fontSettings ?? row.font_settings ?? { title: 'noto-serif-kr', body: 'noto-sans-kr', titleSize: 32, bodySize: 16 }, themeSettings: normalizeThemeSettings(row.themeSettings ?? row.theme_settings), sections: row.sections ?? { gallery: true, map: true, video: false, contact: false, guestbook: false }, logoPosition: row.logoPosition ?? row.logo_position ?? 'hidden', logoSize: row.logoSize ?? row.logo_size ?? 'medium', logoVisible: Boolean(row.logoVisible ?? row.logo_visible), publicationStatus: row.publicationStatus ?? row.publication_status ?? 'draft', deletedAt: row.deletedAt ?? row.deleted_at ?? undefined, createdAt: String(row.createdAt ?? row.created_at ?? ''), updatedAt: String(row.updatedAt ?? row.updated_at ?? ''),
});

const toOrganization = (row: any): Organization => ({ id: String(row.id ?? row.organization_id), name: String(row.name ?? ''), defaultLogoId: row.defaultLogoId ?? row.logo_asset_id ?? undefined, defaultLogoSourceType: row.defaultLogoSourceType ?? row.logo_source_type ?? 'none', defaultLogoExternalUrl: row.defaultLogoExternalUrl ?? row.logo_external_url ?? undefined, createdAt: String(row.createdAt ?? row.created_at ?? ''), updatedAt: String(row.updatedAt ?? row.updated_at ?? '') });

const eventPayload = (event: EventRecord) => ({ eventId: event.id || undefined, updatedAt: event.updatedAt, organizationId: event.organizationId, customLogoId: event.customLogoId, logoSourceType: event.logoSourceType, logoExternalUrl: event.logoExternalUrl, slug: event.slug, title: event.title, eventType: event.eventType, host: event.host, intro: event.intro, eventDateTime: event.eventDateTime, venue: event.venue, address: event.address, coordinates: event.coordinates, transportationInfo: event.transportationInfo, parkingInfo: event.parkingInfo, mapSettings: event.mapSettings, videoUrl: event.videoUrl, videoTitle: event.videoTitle, gallery: event.gallery, fontSettings: event.fontSettings, themeSettings: event.themeSettings, sections: event.sections, logoPosition: event.logoPosition, logoSize: event.logoSize, logoVisible: event.logoVisible, publicationStatus: event.publicationStatus });

class LocalTestRepository implements AdminRepository {
  async load() { return loadState(); }
  async saveEvent(event: EventRecord, existingId?: string) { const state = loadState(); const saved = { ...event, id: existingId || event.id || crypto.randomUUID(), createdAt: existingId ? event.createdAt : new Date().toISOString(), updatedAt: new Date().toISOString() }; saveState({ ...state, events: existingId ? state.events.map((item) => item.id === existingId ? saved : item) : [...state.events, saved] }); return saved; }
  async cloneEvent(eventId: string) { const state = loadState(); const source = state.events.find((item) => item.id === eventId); if (!source) throw new Error('행사를 찾을 수 없습니다.'); const cloned = createLocalEvent(source); saveState({ ...state, events: [...state.events, cloned] }); return cloned; }
  async setEventStatus(eventId: string, status: EventRecord['publicationStatus']) { const state = loadState(); const item = state.events.find((event) => event.id === eventId); if (!item) throw new Error('행사를 찾을 수 없습니다.'); const updated = { ...item, publicationStatus: status, deletedAt: status === 'trash' ? new Date().toISOString() : undefined, updatedAt: new Date().toISOString() }; saveState({ ...state, events: state.events.map((event) => event.id === eventId ? updated : event) }); return updated; }
  async createOrganization(name: string) { const state = loadState(); const organization = createLocalOrganization(name); saveState({ ...state, organizations: [...state.organizations, organization] }); return organization; }
  async updateOrganization(id: string, patch: Partial<Organization>) { const state = loadState(); const current = state.organizations.find((item) => item.id === id); if (!current) throw new Error('단체를 찾을 수 없습니다.'); const updated = { ...current, ...patch, updatedAt: new Date().toISOString() }; saveState({ ...state, organizations: state.organizations.map((item) => item.id === id ? updated : item) }); return updated; }
}

class WorkerApiRepository implements AdminRepository {
  private readonly base = apiBase;
  private readonly testJwt = import.meta.env.DEV ? String(import.meta.env.VITE_ADMIN_TEST_JWT || '') : '';
  private async request(path: string, init?: RequestInit) { const headers = new Headers(init?.headers); headers.set('content-type', 'application/json'); if (this.testJwt) headers.set('Cf-Access-Jwt-Assertion', this.testJwt); return parseJson(await fetch(`${this.base}${path}`, { ...init, headers })); }
  async load() { const [events, organizations] = await Promise.all([this.request('/api/admin/events'), this.request('/api/admin/organizations')]); return { events: events.map(toEvent), organizations: organizations.map(toOrganization), logos: [] }; }
  async saveEvent(event: EventRecord, existingId?: string) { const body = await this.request(existingId ? `/api/admin/events/${encodeURIComponent(existingId)}` : '/api/admin/events', { method: existingId ? 'PATCH' : 'POST', body: JSON.stringify(eventPayload(event)) }); const id = existingId || body.event_id; return toEvent(await this.request(`/api/admin/events/${encodeURIComponent(id)}`)); }
  async cloneEvent(eventId: string) { const body = await this.request(`/api/admin/events/${encodeURIComponent(eventId)}/clone`, { method: 'POST', body: '{}' }); return toEvent(await this.request(`/api/admin/events/${encodeURIComponent(body.event_id)}`)); }
  async setEventStatus(eventId: string, status: EventRecord['publicationStatus']) { const action = status === 'public' ? 'publish' : status === 'trash' ? null : 'unpublish'; if (status === 'trash') await this.request(`/api/admin/events/${encodeURIComponent(eventId)}`, { method: 'DELETE' }); else if (action) await this.request(`/api/admin/events/${encodeURIComponent(eventId)}/${action}`, { method: 'POST' }); else await this.request(`/api/admin/events/${encodeURIComponent(eventId)}/restore`, { method: 'POST' }); return toEvent(await this.request(`/api/admin/events/${encodeURIComponent(eventId)}`)); }
  async createOrganization(name: string) { const body = await this.request('/api/admin/organizations', { method: 'POST', body: JSON.stringify({ name }) }); return toOrganization(await this.request(`/api/admin/organizations/${encodeURIComponent(body.organization_id)}`)); }
  async updateOrganization(id: string, patch: Partial<Organization>) { return toOrganization(await this.request(`/api/admin/organizations/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ defaultLogoId: patch.defaultLogoId, defaultLogoSourceType: patch.defaultLogoSourceType, defaultLogoExternalUrl: patch.defaultLogoExternalUrl, name: patch.name }) })); }
}

export const createAdminRepository = (): AdminRepository => (import.meta.env.VITE_ADMIN_REPOSITORY_MODE === 'local-test' ? new LocalTestRepository() : new WorkerApiRepository());

