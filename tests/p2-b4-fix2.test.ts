import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeApiOrigin, proxyApiRequest } from '../functions/apiProxy.ts';
import { resolveApiBase } from '../src/apiBase.ts';

test('production uses same-origin API and development may use explicit API origin', () => {
  assert.equal(resolveApiBase({ dev: false, configured: 'https://production-worker.example' }), '');
  assert.equal(resolveApiBase({ dev: true, configured: 'http://127.0.0.1:8787/' }), 'http://127.0.0.1:8787');
  assert.equal(resolveApiBase({ dev: true }), '');
});

test('API origin accepts staging HTTPS and local HTTP only', () => {
  assert.equal(normalizeApiOrigin('https://invite-p2-staging-api.example.workers.dev/'), 'https://invite-p2-staging-api.example.workers.dev');
  assert.equal(normalizeApiOrigin('http://127.0.0.1:8787/'), 'http://127.0.0.1:8787');
  assert.equal(normalizeApiOrigin('http://api.example.test/'), null);
  assert.equal(normalizeApiOrigin('https://user:pass@example.test/'), null);
  assert.equal(normalizeApiOrigin('javascript:alert(1)'), null);
});

test('API proxy preserves path, method, body and Access JWT without production fallback', async () => {
  const originalFetch = globalThis.fetch;
  let forwarded: { url: string; init?: RequestInit } | undefined;
  globalThis.fetch = async (input, init) => {
    forwarded = { url: String(input), init };
    return new Response('{"ok":true}', { status: 201, headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600' } });
  };
  try {
    const request = new Request('https://staging.pages.dev/api/admin/events?draft=1', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'Cf-Access-Jwt-Assertion': 'synthetic-jwt' },
      body: '{"title":"synthetic"}',
    });
    const response = await proxyApiRequest(request, 'https://staging-api.example.workers.dev');
    assert.equal(response.status, 201);
    assert.equal(forwarded?.url, 'https://staging-api.example.workers.dev/api/admin/events?draft=1');
    assert.equal(forwarded?.init?.method, 'POST');
    assert.equal((forwarded?.init?.headers as Headers).get('Cf-Access-Jwt-Assertion'), 'synthetic-jwt');
    assert.equal(await new Response(forwarded?.init?.body).text(), '{"title":"synthetic"}');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await proxyApiRequest(new Request('https://staging.pages.dev/api/public/events/demo'), undefined)).status, 503);
    assert.equal((await proxyApiRequest(new Request('https://staging.pages.dev/api/admin/events', { method: 'PUT' }), 'https://staging-api.example.workers.dev')).status, 405);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
