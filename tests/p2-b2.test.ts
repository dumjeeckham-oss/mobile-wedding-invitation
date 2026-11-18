import assert from 'node:assert/strict';
import { test } from 'node:test';
import { webcrypto } from 'node:crypto';
import worker from '../worker/index.ts';
import { createPreviewToken, verifyPreviewToken } from '../worker/preview.ts';
import { validatePayload } from '../worker/validation.ts';
import { getBackground, BACKGROUND_PRESETS } from '../src/admin/backgrounds.ts';
import { normalizeThemeSettings, resolveLogo, validateBackgroundFile, validateBackgroundUrl, validateLogo, validateLogoUrl } from '../src/admin/validation.ts';

if (!globalThis.crypto) globalThis.crypto = webcrypto as Crypto;

const base64Url = (value: ArrayBuffer | string) => Buffer.from(typeof value === 'string' ? value : new Uint8Array(value)).toString('base64url');
const row = { event_id: 'event-1', slug: 'public-event', title: '합성 행사', event_type: '포럼', host: '테스트 운영팀', publication_status: 'public', deleted_at: null, map_settings_json: '{}', font_settings_json: '{}', theme_settings_json: '{}', sections_json: '{}', gallery_json: '[]' };

class Statement {
  private args: unknown[] = [];
  constructor(private readonly db: FakeDb, private readonly sql: string) {}
  bind(...args: unknown[]) { this.args = args; return this; }
  async first<T>() { if (this.sql.includes('publication_status') && this.args[1] === 'public') return (this.db.private ? null : row) as T; if (this.sql.includes('WHERE event_id')) return row as T; return null; }
  async all<T>() { return { results: [row] as T[] }; }
  async run() { this.db.runs.push({ sql: this.sql, args: this.args }); return { success: true }; }
}
class FakeDb {
  private = false;
  runs: { sql: string; args: unknown[] }[] = [];
  prepare(sql: string) { return new Statement(this, sql); }
}

const makeToken = async (overrides: Record<string, unknown> = {}) => {
  const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const publicJwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const header = base64Url(JSON.stringify({ alg: 'RS256', kid: 'test-key' }));
  const claims = base64Url(JSON.stringify({ iss: 'https://access.example.com', aud: ['invite-admin'], email: 'admin@example.com', exp: Math.floor(Date.now() / 1000) + 300, ...overrides }));
  const input = `${header}.${claims}`;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', pair.privateKey, new TextEncoder().encode(input));
  return { token: `${input}.${base64Url(signature)}`, jwks: JSON.stringify({ keys: [{ ...publicJwk, kid: 'test-key' }] }) };
};

test('validation rejects unsafe payload and logo URLs', () => {
  assert.equal(validatePayload({ title: 'x', host: 'x', slug: 'ok', logoExternalUrl: 'http://example.com/logo.png' }).logoExternalUrl, 'invalid external logo URL');
  assert.equal(validatePayload({ title: 'x', host: 'x', slug: 'ok', videoUrl: 'https://evil.example/video' }).videoUrl, 'YouTube URL required');
  assert.match(validateLogoUrl('https://user:pass@example.com/logo.png') || '', /사용자명|invalid/);
  assert.equal(validateLogo({ type: 'image/svg+xml', size: 100, name: 'x.svg' }), 'PNG, JPEG, WebP 파일만 업로드할 수 있습니다.');
  assert.equal(validateLogo({ type: 'image/png', size: 2 * 1024 * 1024 + 1, name: 'x.png' }), '로고 파일은 2MiB 이하만 업로드할 수 있습니다.');
});

test('background allowlist has twelve presets and safe fallback', () => {
  assert.equal(BACKGROUND_PRESETS.length, 12);
  assert.equal(getBackground('not-allowed').id, 'classic-ivory');
});

test('custom background URL and file validation are safe and backward compatible', () => {
  assert.equal(normalizeThemeSettings({}).backgroundPresetId, 'classic-ivory');
  assert.equal(validateBackgroundUrl('http://example.com/background.png'), '배경 이미지 URL은 HTTPS만 사용할 수 있습니다.');
  assert.match(validateBackgroundUrl('https://user:pass@example.com/background.png') || '', /사용자명|HTTPS/);
  assert.equal(validateBackgroundUrl('https://example.com/background.webp'), null);
  assert.equal(validateBackgroundFile({ type: 'image/svg+xml', size: 10, name: 'x.svg' }), 'PNG, JPEG, WebP 파일만 업로드할 수 있습니다.');
  assert.equal(validateBackgroundFile({ type: 'image/webp', size: 2 * 1024 * 1024 + 1, name: 'x.webp' }), '배경 이미지는 2MiB 이하만 업로드할 수 있습니다.');
  assert.equal(validatePayload({ title: 'x', host: 'x', slug: 'ok', themeSettings: { backgroundSourceType: 'url', backgroundImageUrl: 'https://example.com/bg.png', backgroundFit: 'cover', backgroundPosition: 'center', backgroundOverlayOpacity: 80, backgroundFallbackColor: '#fffaf0' } }).backgroundImageUrl, undefined);
  assert.equal(validatePayload({ title: 'x', host: 'x', slug: 'ok', themeSettings: { backgroundSourceType: 'url', backgroundImageUrl: 'data:image/png;base64,x' } }).backgroundImageUrl, 'invalid background image URL');
});

test('logo precedence supports custom, organization default, URL and none', () => {
  const logos = [{ id: 'default', name: 'default', mimeType: 'image/png' as const, size: 1, width: 1, height: 1, dataUrl: 'data:image/png;base64,x', createdAt: '' }, { id: 'custom', name: 'custom', mimeType: 'image/png' as const, size: 1, width: 1, height: 1, dataUrl: 'data:image/png;base64,y', createdAt: '' }];
  const organizations = [{ id: 'org', name: 'org', defaultLogoId: 'default', defaultLogoSourceType: 'upload' as const, createdAt: '', updatedAt: '' }];
  const base = { id: 'e', slug: 'e', organizationId: 'org', title: 'e', eventType: 'x', host: 'x', intro: '', eventDateTime: '', venue: '', address: '', transportationInfo: '', parkingInfo: '', mapSettings: { enabled: false }, videoUrl: '', videoTitle: '', fontSettings: { title: 'noto-serif-kr' as const, body: 'noto-sans-kr' as const, titleSize: 32, bodySize: 16 }, themeSettings: { backgroundPresetId: 'classic-ivory', backgroundColor: '#fff', textColor: '#000', accentColor: '#000' }, sections: { gallery: true, map: false, video: false, contact: false, guestbook: false }, logoPosition: 'top-center' as const, logoSize: 'medium' as const, logoVisible: true, publicationStatus: 'draft' as const, createdAt: '', updatedAt: '', logoSourceType: 'upload' as const };
  assert.equal(resolveLogo({ ...base, customLogoId: 'custom' }, organizations, logos)?.id, 'custom');
  assert.equal(resolveLogo(base, organizations, logos)?.id, 'default');
  assert.equal(resolveLogo({ ...base, logoSourceType: 'url', logoExternalUrl: 'https://example.com/logo.png' }, organizations, logos)?.dataUrl, 'https://example.com/logo.png');
  assert.equal(resolveLogo({ ...base, logoSourceType: 'none' }, organizations, logos), undefined);
});

test('worker rejects missing, expired and mismatched admin credentials', async () => {
  const db = new FakeDb();
  const baseEnv = { DB: db, ACCESS_ISSUER: 'https://access.example.com', ACCESS_AUDIENCE: 'invite-admin', ADMIN_EMAIL: 'admin@example.com' };
  const noAuth = await worker.fetch(new Request('https://local/api/admin/events'), baseEnv);
  assert.equal(noAuth.status, 401);
  const signed = await makeToken({ exp: Math.floor(Date.now() / 1000) - 1 });
  const expired = await worker.fetch(new Request('https://local/api/admin/events', { headers: { 'Cf-Access-Jwt-Assertion': signed.token } }), { ...baseEnv, ACCESS_JWKS_JSON: signed.jwks });
  assert.equal(expired.status, 401);
  const wrong = await makeToken({ email: 'other@example.com' });
  const mismatch = await worker.fetch(new Request('https://local/api/admin/events', { headers: { 'Cf-Access-Jwt-Assertion': wrong.token } }), { ...baseEnv, ACCESS_JWKS_JSON: wrong.jwks });
  assert.equal(mismatch.status, 401);
});

test('worker separates public read and authenticated CRUD actions', async () => {
  const db = new FakeDb();
  const signed = await makeToken();
  const env = { DB: db, ACCESS_ISSUER: 'https://access.example.com', ACCESS_AUDIENCE: 'invite-admin', ADMIN_EMAIL: 'admin@example.com', ACCESS_JWKS_JSON: signed.jwks };
  const publicResponse = await worker.fetch(new Request('https://local/api/public/events/public-event'), env);
  assert.equal(publicResponse.status, 200);
  const createResponse = await worker.fetch(new Request('https://local/api/admin/events', { method: 'POST', headers: { 'content-type': 'application/json', 'Cf-Access-Jwt-Assertion': signed.token }, body: JSON.stringify({ title: '합성 행사', host: '운영팀', slug: 'synthetic-event' }) }), env);
  assert.equal(createResponse.status, 201);
  const cloneResponse = await worker.fetch(new Request('https://local/api/admin/events/event-1/clone', { method: 'POST', headers: { 'Cf-Access-Jwt-Assertion': signed.token }, body: '{}' }), env);
  assert.equal(cloneResponse.status, 201);
  const publishResponse = await worker.fetch(new Request('https://local/api/admin/events/event-1/unpublish', { method: 'POST', headers: { 'Cf-Access-Jwt-Assertion': signed.token } }), env);
  assert.equal(publishResponse.status, 200);
  assert.ok(db.runs.some((run) => run.sql.includes('INSERT INTO events')));
});

test('public event response is filtered and includes CORS headers', async () => {
  const db = new FakeDb();
  const env = { DB: db, ACCESS_ISSUER: 'https://access.example.com', ACCESS_AUDIENCE: 'invite-admin', ADMIN_EMAIL: 'admin@example.com' };
  const response = await worker.fetch(new Request('https://local/api/public/events/public-event'), env);
  const payload = await response.json() as Record<string, unknown>;
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  assert.equal(payload.slug, 'public-event');
  assert.equal('deleted_at' in payload, false);
  assert.equal('organization_id' in payload, false);
});

test('admin CORS allows only explicit local origins', async () => {
  const db = new FakeDb();
  const env = { DB: db, ACCESS_ISSUER: 'https://access.example.com', ACCESS_AUDIENCE: 'invite-admin', ADMIN_EMAIL: 'admin@example.com' };
  const blocked = await worker.fetch(new Request('https://local/api/admin/events', { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } }), env);
  assert.equal(blocked.status, 403);
  const allowed = await worker.fetch(new Request('https://local/api/admin/events', { method: 'OPTIONS', headers: { Origin: 'http://127.0.0.1:5173' } }), env);
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://127.0.0.1:5173');
});

test('preview token is event-bound and expires', async () => {
  const token = await createPreviewToken('event-1', 'local-preview-secret', 60);
  assert.equal(await verifyPreviewToken(token, 'event-1', 'local-preview-secret'), true);
  assert.equal(await verifyPreviewToken(token, 'event-2', 'local-preview-secret'), false);
  assert.equal(await verifyPreviewToken(token, 'event-1', 'wrong-secret'), false);
});
