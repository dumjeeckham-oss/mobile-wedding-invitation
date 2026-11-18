const encode = (value: string | ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(typeof value === 'string' ? new TextEncoder().encode(value) : value))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export const createPreviewToken = async (eventId: string, secret: string, ttlSeconds = 300) => {
  const payload = `${eventId}.${Math.floor(Date.now() / 1000) + ttlSeconds}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${encode(payload)}.${encode(signature)}`;
};

export const verifyPreviewToken = async (token: string, eventId: string, secret: string) => {
  const [encodedPayload, encodedSignature] = token.split('.');
  if (!encodedPayload || !encodedSignature) return false;
  const payload = new TextDecoder().decode(Uint8Array.from(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0)));
  const [tokenEventId, expiresAt] = payload.split('.');
  if (tokenEventId !== eventId || Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const signature = Uint8Array.from(atob(encodedSignature.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0));
  return crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(payload));
};
