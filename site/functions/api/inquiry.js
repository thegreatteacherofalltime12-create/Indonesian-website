// Cloudflare Pages Function: POST /api/inquiry
// Sends the inquiry by email through Resend when RESEND_API_KEY, INQUIRY_TO and INQUIRY_FROM are set;
// otherwise accepts the request and reports delivered:false (preview mode).
export async function onRequestPost({ request, env }) {
  let data;
  try { data = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return json({ error: 'Invalid JSON' }, 400);
  const s = v => String(v ?? '').trim().slice(0, 2000);
  const name = s(data.name), company = s(data.company), email = s(data.email), country = s(data.country);
  if (!name || !company || !email || !country) return json({ error: 'Missing required fields' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Invalid email' }, 400);
  if (s(data.website)) return json({ ok: true, delivered: false }); // honeypot

  const lines = [
    `Name: ${name}`, `Company: ${company}`, `Email: ${email}`, `Destination: ${country}`, `Buyer type: ${s(data.buyerType)}`,
    '', 'Items:', s(data.items) || '(none)', '', 'Message:', s(data.message) || '(none)',
    '', `Quote list: ${JSON.stringify(data.quote || [])}`, `Page: ${s(data.page)}`, `IP: ${request.headers.get('cf-connecting-ip') || ''}`, `Country (CF): ${request.cf?.country || ''}`,
  ];
  const text = lines.join('\n');

  // Order book: save every request in D1 before trying to email it, so nothing is lost.
  let saved = null;
  if (env.DB) {
    try {
      const year = new Date().getUTCFullYear();
      const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM inquiries WHERE ref LIKE ?').bind(`Q-${year}-%`).first();
      const ref = `Q-${year}-${String((row?.n || 0) + 1).padStart(4, '0')}`;
      const r = await env.DB.prepare(`INSERT INTO inquiries (ref, source, lang, name, company, email, country, buyer_type, items_text, message, quote_json, page, ip, cf_country) VALUES (?, 'website', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(ref, s(data.page).includes('/id/') ? 'id' : 'en', name, company, email, country, s(data.buyerType) || null, s(data.items) || null, s(data.message) || null, JSON.stringify(Array.isArray(data.quote) ? data.quote.slice(0, 200) : []), s(data.page) || null, request.headers.get('cf-connecting-ip') || null, request.cf?.country || null).run();
      saved = { id: r.meta.last_row_id, ref };
      await env.DB.prepare(`INSERT INTO events (inquiry_id, actor, kind, to_status, note) VALUES (?, 'system', 'created', 'new', 'Website quote request')`).bind(saved.id).run();
    } catch (e) { console.log('d1 insert failed', e && e.message); }
  }
  if (env.INQUIRIES) { // optional KV namespace for a durable copy
    try { await env.INQUIRIES.put(`inq:${Date.now()}:${email}`, text, { expirationTtl: 60 * 60 * 24 * 365 }); } catch {}
  }

  if (!env.RESEND_API_KEY || !env.INQUIRY_TO || !env.INQUIRY_FROM) {
    console.log('inquiry (undelivered, preview mode)\n' + text);
    return json({ ok: true, delivered: false });
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.INQUIRY_FROM, to: env.INQUIRY_TO.split(',').map(x => x.trim()), reply_to: email,
        subject: `${saved ? saved.ref + ' · ' : ''}Quote request — ${company} (${country})`, text,
      }),
    });
    if (!res.ok) throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
    if (saved && env.DB) { try { await env.DB.prepare('UPDATE inquiries SET delivered = 1 WHERE id = ?').bind(saved.id).run(); } catch {} }
    return json({ ok: true, delivered: true, ref: saved && saved.ref });
  } catch (err) {
    // Never lose the lead: the full inquiry is logged (and in KV when bound) even when mail fails.
    console.log('inquiry (delivery FAILED: ' + (err && err.message) + ')\n' + text);
    return json({ error: 'Mail provider error' }, 502);
  }
}
export function onRequestGet() { return json({ error: 'POST only' }, 405); }
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
