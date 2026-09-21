// Shared helpers for the admin API: Cloudflare Access JWT verification, pipeline stages, JSON responses.
export const STAGES = ['new', 'quoted', 'proforma_sent', 'deposit_received', 'in_production', 'inspected', 'loaded', 'documents_sent', 'balance_received', 'shipped', 'closed', 'lost'];

export const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const b64url = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), c => c.charCodeAt(0));

let certCache = { at: 0, keys: [] };
async function accessKeys(team) {
  if (Date.now() - certCache.at < 10 * 60 * 1000 && certCache.keys.length) return certCache.keys;
  const res = await fetch(`https://${team}.cloudflareaccess.com/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error('certs ' + res.status);
  const { keys } = await res.json();
  certCache = { at: Date.now(), keys };
  return keys;
}

// Returns { email } for a valid Access JWT, or null. Locally (wrangler pages dev) DEV_ADMIN_EMAIL in .dev.vars bypasses Access.
export async function requireAdmin({ request, env }) {
  if (env.DEV_ADMIN_EMAIL && new URL(request.url).hostname === '127.0.0.1') return { email: env.DEV_ADMIN_EMAIL };
  if (!env.ACCESS_TEAM || !env.ACCESS_AUD) return null;
  const token = request.headers.get('Cf-Access-Jwt-Assertion') || (request.headers.get('Cookie') || '').match(/CF_Authorization=([^;]+)/)?.[1];
  if (!token) return null;
  try {
    const [h, p, s] = token.split('.');
    const header = JSON.parse(new TextDecoder().decode(b64url(h)));
    const payload = JSON.parse(new TextDecoder().decode(b64url(p)));
    if (header.alg !== 'RS256') return null;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now || (payload.nbf && payload.nbf > now)) return null;
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(env.ACCESS_AUD)) return null;
    if (payload.iss !== `https://${env.ACCESS_TEAM}.cloudflareaccess.com`) return null;
    const keys = await accessKeys(env.ACCESS_TEAM);
    const jwk = keys.find(k => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64url(s), new TextEncoder().encode(`${h}.${p}`));
    if (!ok) return null;
    return { email: payload.email || payload.sub };
  } catch (e) {
    console.log('access jwt error', e && e.message);
    return null;
  }
}

export function unauthorized(env) {
  if (!env.ACCESS_TEAM || !env.ACCESS_AUD) return json({ error: 'Admin is not configured yet (ACCESS_TEAM / ACCESS_AUD).' }, 503);
  return json({ error: 'Sign in required' }, 401);
}

// Q-2026-0001 style references
export async function nextRef(db) {
  const year = new Date().getUTCFullYear();
  const row = await db.prepare(`SELECT COUNT(*) AS n FROM inquiries WHERE ref LIKE ?`).bind(`Q-${year}-%`).first();
  return `Q-${year}-${String((row?.n || 0) + 1).padStart(4, '0')}`;
}
