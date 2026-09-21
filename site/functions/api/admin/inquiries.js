// GET  /api/admin/inquiries?status=&q=          list (newest first)
// POST /api/admin/inquiries                       create a manual inquiry {name, company, email, country, items_text, message, source}
import { json, requireAdmin, unauthorized, STAGES, nextRef } from './_lib.js';

export async function onRequestGet({ request, env }) {
  const admin = await requireAdmin({ request, env });
  if (!admin) return unauthorized(env);
  if (!env.DB) return json({ error: 'Database not bound' }, 500);
  const u = new URL(request.url);
  const status = u.searchParams.get('status');
  const q = (u.searchParams.get('q') || '').trim();
  const where = [], binds = [];
  if (status && STAGES.includes(status)) { where.push('status = ?'); binds.push(status); }
  if (q) { where.push('(name LIKE ? OR company LIKE ? OR email LIKE ? OR country LIKE ? OR ref LIKE ?)'); for (let i = 0; i < 5; i++) binds.push(`%${q}%`); }
  const sql = `SELECT id, ref, created_at, updated_at, status, source, lang, name, company, email, country, buyer_type, quote_json, delivered FROM inquiries${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT 300`;
  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  const counts = await env.DB.prepare('SELECT status, COUNT(*) AS n FROM inquiries GROUP BY status').all();
  return json({ inquiries: results, counts: Object.fromEntries(counts.results.map(r => [r.status, r.n])), stages: STAGES, me: admin.email });
}

export async function onRequestPost({ request, env }) {
  const admin = await requireAdmin({ request, env });
  if (!admin) return unauthorized(env);
  if (!env.DB) return json({ error: 'Database not bound' }, 500);
  let d; try { d = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const s = v => String(v ?? '').trim().slice(0, 2000);
  const name = s(d.name), company = s(d.company), email = s(d.email), country = s(d.country);
  if (!name || !company || !country) return json({ error: 'name, company and country are required' }, 400);
  const ref = await nextRef(env.DB);
  const r = await env.DB.prepare(`INSERT INTO inquiries (ref, status, source, name, company, email, country, buyer_type, items_text, message, notes) VALUES (?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(ref, ['email', 'whatsapp', 'manual'].includes(d.source) ? d.source : 'manual', name, company, email || '-', country, s(d.buyerType) || null, s(d.items_text) || null, s(d.message) || null, s(d.notes) || null).run();
  const id = r.meta.last_row_id;
  await env.DB.prepare(`INSERT INTO events (inquiry_id, actor, kind, to_status, note) VALUES (?, ?, 'created', 'new', ?)`).bind(id, admin.email, `Added manually (${d.source || 'manual'})`).run();
  return json({ ok: true, id, ref });
}
