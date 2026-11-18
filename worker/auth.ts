export interface AccessClaims { iss: string; aud: string | string[]; exp: number; email: string; sub?: string; }

const decode = (value: string) => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0));

const parseToken = (token: string) => {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !encodedSignature) return null;
  try { return { header: JSON.parse(new TextDecoder().decode(decode(encodedHeader))) as { alg?: string; kid?: string }, claims: JSON.parse(new TextDecoder().decode(decode(encodedPayload))) as AccessClaims, signature: decode(encodedSignature), input: new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`) }; } catch { return null; }
};

export const authenticateAccess = async (request: Request, env: { ACCESS_ISSUER: string; ACCESS_AUDIENCE: string; ADMIN_EMAIL: string; ACCESS_JWKS_URL?: string; ACCESS_JWKS_JSON?: string }) => {
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return null;
  const parsed = parseToken(token);
  if (!parsed || parsed.header.alg !== 'RS256' || !parsed.header.kid) return null;
  const jwks = env.ACCESS_JWKS_JSON ? JSON.parse(env.ACCESS_JWKS_JSON) as { keys: (JsonWebKey & { kid?: string })[] } : env.ACCESS_JWKS_URL ? await (await fetch(env.ACCESS_JWKS_URL)).json() as { keys: (JsonWebKey & { kid?: string })[] } : null;
  const key = jwks?.keys.find((item) => item.kid === parsed.header.kid);
  if (!key) return null;
  const cryptoKey = await crypto.subtle.importKey('jwk', key, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, parsed.signature, parsed.input);
  if (!valid || parsed.claims.iss !== env.ACCESS_ISSUER || parsed.claims.email !== env.ADMIN_EMAIL || parsed.claims.exp <= Math.floor(Date.now() / 1000)) return null;
  const audience = Array.isArray(parsed.claims.aud) ? parsed.claims.aud : [parsed.claims.aud];
  return audience.includes(env.ACCESS_AUDIENCE) ? parsed.claims : null;
};
