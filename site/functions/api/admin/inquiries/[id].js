// GET   /api/admin/inquiries/:id      full record + events
// PATCH /api/admin/inquiries/:id      {status?, notes?, note?}  — status change and/or internal note
import { json, requireAdmin, unauthorized, STAGES } from '../_lib.js';

export async function onRequestGet({ request, env, params }) {
  const admin = await requireAdmin({ request, env });
  if (!admin) return unauthorized(env);
  const id = Number(params.id);
  if (!id) return json({ error: 'Bad id' }, 400);
  const inquiry = await env.DB.prepare('SELECT * FROM inquiries WHERE id = ?').bind(id).first();
  if (!inquiry) return json({ error: 'Not found' }, 404);
  const events = await env.DB.prepare('SELECT at, actor, kind, from_status, to_status, note FROM events WHERE inquiry_id = ? ORDER BY at DESC').bind(id).all();
  return json({ inquiry, events: events.results, stages: STAGES });
}

export async function onRequestPatch({ request, env, params }) {
  const admin = await requireAdmin({ request, env });
  if (!admin) return unauthorized(env);
  const id = Number(params.id);
  if (!id) return json({ error: 'Bad id' }, 400);
  let d; try { d = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const cur = await env.DB.prepare('SELECT id, status, notes FROM inquiries WHERE id = ?').bind(id).first();
  if (!cur) return json({ error: 'Not found' }, 404);
  const sets = [], binds = [];
  const stmts = [];
  if (d.status !== undefined) {
    if (!STAGES.includes(d.status)) return json({ error: 'Unknown status' }, 400);
    if (d.status !== cur.status) {
      sets.push('status = ?'); binds.push(d.status);
      stmts.push(env.DB.prepare(`INSERT INTO events (inquiry_id, actor, kind, from_status, to_status, note) VALUES (?, ?, 'status', ?, ?, ?)`).bind(id, admin.email, cur.status, d.status, String(d.note || '').slice(0, 2000) || null));
    }
  }
  if (d.notes !== undefined) { sets.push('notes = ?'); binds.push(String(d.notes).slice(0, 10000)); }
  if (d.note && d.status === undefined) {
    stmts.push(env.DB.prepare(`INSERT INTO events (inquiry_id, actor, kind, note) VALUES (?, ?, 'note', ?)`).bind(id, admin.email, String(d.note).slice(0, 2000)));
  }
  if (sets.length) {
    sets.push(`updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`);
    stmts.unshift(env.DB.prepare(`UPDATE inquiries SET ${sets.join(', ')} WHERE id = ?`).bind(...binds, id));
  }
  if (stmts.length) await env.DB.batch(stmts);
  const inquiry = await env.DB.prepare('SELECT * FROM inquiries WHERE id = ?').bind(id).first();
  return json({ ok: true, inquiry });
}

export async function onRequestDelete({ request, env, params }) {
  const admin = await requireAdmin({ request, env });
  if (!admin) return unauthorized(env);
  const id = Number(params.id);
  if (!id) return json({ error: 'Bad id' }, 400);
  const cur = await env.DB.prepare('SELECT id, ref FROM inquiries WHERE id = ?').bind(id).first();
  if (!cur) return json({ error: 'Not found' }, 404);
  // Permanent removal, history included. The confirm dialog in the admin UI is
  // the only gate besides Access itself, so keep this endpoint boring and exact.
  await env.DB.batch([
    env.DB.prepare('DELETE FROM events WHERE inquiry_id = ?').bind(id),
    env.DB.prepare('DELETE FROM inquiries WHERE id = ?').bind(id),
  ]);
  return json({ ok: true, deleted: cur.ref });
}
