const allowedRequestHeaders = ['accept', 'content-type', 'cf-access-jwt-assertion'];
const allowedMethods = new Set(['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS']);

export const normalizeApiOrigin = (value: string | undefined) => {
  const raw = String(value || '').trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    if (url.protocol === 'https:') return url.origin;
    if (url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) return url.origin;
    return null;
  } catch {
    return null;
  }
};

const jsonError = (status: number, error: string) => new Response(JSON.stringify({ error }), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

export const proxyApiRequest = async (request: Request, apiOrigin: string | undefined) => {
  const origin = normalizeApiOrigin(apiOrigin);
  if (!origin) return jsonError(503, 'staging API origin is not configured');
  if (!allowedMethods.has(request.method)) return jsonError(405, 'method not allowed');

  const incoming = new URL(request.url);
  const target = new URL(`${incoming.pathname}${incoming.search}`, origin);
  const headers = new Headers();
  for (const name of allowedRequestHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const init: RequestInit = { method: request.method, headers, redirect: 'manual', cache: 'no-store' };
  if (request.method !== 'GET' && request.method !== 'HEAD') init.body = await request.arrayBuffer();
  const response = await fetch(target, init);
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set('cache-control', 'no-store');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: responseHeaders });
};
