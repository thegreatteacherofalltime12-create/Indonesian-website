// Render an ArgaMatt-branded price list from a JSON data file.
// Usage: node tools/argamatt-pricelist.js <data.json> <out.html>
// Photos are embedded as data URIs so the single HTML file travels (and prints
// to PDF) with nothing else attached.
const fs = require('fs');
const path = require('path');

const [, , dataPath, outPath] = process.argv;
if (!dataPath || !outPath) { console.error('usage: node argamatt-pricelist.js <data.json> <out.html>'); process.exit(1); }

const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'site/data/site.json'), 'utf8'));

const b64 = p => {
  const full = path.isAbsolute(p) ? p : path.join(ROOT, p);
  if (!fs.existsSync(full)) return null;
  const ext = path.extname(full).slice(1).toLowerCase().replace('jpg', 'jpeg');
  return `data:image/${ext};base64,${fs.readFileSync(full).toString('base64')}`;
};

const logo = b64('client-docs/logo/variant-e-curved-tight.png');
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rp = n => 'Rp ' + Number(n).toLocaleString('id-ID');

const rows = data.items.map(it => {
  const img = it.photo ? b64(it.photo) : null;
  const sizes = it.sizes.map(s =>
    `<tr><td>${esc(s.label || '')}</td><td class="mono">${esc(s.size)}</td><td class="mono price">${rp(s.price)}</td></tr>`).join('');
  return `<tr class="item">
    <td class="no">${it.no}</td>
    <td class="photo">${img ? `<img src="${img}" alt="">` : `<div class="ph">Foto menyusul<br><small>photo to follow</small></div>`}</td>
    <td class="detail">
      ${it.name ? `<div class="name">${esc(it.name)}</div>` : ''}
      <table class="sizes"><tbody>${sizes}</tbody></table>
      <div class="material">${esc(it.material)}</div>
    </td>
  </tr>`;
}).join('\n');

const html = `<!doctype html>
<html lang="id"><head><meta charset="utf-8">
<title>${esc(data.title)} — ${esc(site.brand)}</title>
<style>
  :root { --ink:#1B1F1A; --muted:#646B61; --rule:#DDD8CC; --accent:#4C6A1D; --honey:#8A5E1E; --bg:#F5F3EE; }
  * { box-sizing:border-box; } body { font:14px/1.45 Georgia,serif; color:var(--ink); margin:0; background:#fff; }
  .page { max-width:820px; margin:0 auto; padding:34px 40px; }
  header { display:flex; gap:22px; align-items:center; border-bottom:3px solid var(--accent); padding-bottom:18px; }
  header img { height:110px; width:auto; }
  .co h1 { margin:0; font-size:26px; letter-spacing:.02em; }
  .co p { margin:3px 0 0; color:var(--muted); font-size:12.5px; }
  .doc { display:flex; justify-content:space-between; align-items:baseline; margin:20px 0 6px; }
  .doc h2 { margin:0; font-size:19px; color:var(--accent); text-transform:uppercase; letter-spacing:.08em; }
  .doc span { color:var(--muted); font-size:12.5px; }
  table.list { width:100%; border-collapse:collapse; margin-top:10px; }
  table.list > tbody > tr.item > td { border-bottom:1px solid var(--rule); padding:12px 8px; vertical-align:top; }
  td.no { width:34px; font-weight:bold; color:var(--honey); font-size:16px; }
  td.photo { width:170px; } td.photo img { width:160px; height:160px; object-fit:contain; background:var(--bg); border-radius:6px; }
  .ph { width:160px; height:160px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--bg); border-radius:6px; color:var(--muted); font-size:12px; text-align:center; }
  .name { font-weight:bold; margin-bottom:6px; }
  table.sizes { border-collapse:collapse; } table.sizes td { padding:2px 14px 2px 0; font-size:13.5px; }
  .mono { font-family:Consolas,monospace; } .price { color:var(--accent); font-weight:bold; }
  .material { margin-top:8px; color:var(--muted); font-size:12.5px; font-style:italic; }
  footer { margin-top:22px; padding-top:12px; border-top:1px solid var(--rule); color:var(--muted); font-size:11.5px; display:flex; justify-content:space-between; gap:18px; }
  @media print { .page { padding:10mm 12mm; max-width:none; } tr.item { break-inside:avoid; } @page { size:A4; margin:8mm; } }
</style></head><body><div class="page">
<header>
  ${logo ? `<img src="${logo}" alt="${esc(site.brand)}">` : ''}
  <div class="co">
    <h1>${esc(site.brand)}</h1>
    <p>${site.address.lines.map(esc).join(' · ')}</p>
    <p>${esc(site.contact.email)} · WhatsApp ${esc(site.contact.whatsapp)} · ${esc(site.url.replace('https://', ''))}</p>
  </div>
</header>
<div class="doc"><h2>${esc(data.title)}</h2><span>${esc(data.subtitle || '')}</span></div>
<table class="list"><tbody>
${rows}
</tbody></table>
<footer>
  <span>${esc(data.footNote || 'Harga dalam IDR, sudah termasuk packing standar. / Prices in IDR, standard packing included.')}</span>
  <span>${esc(new Date().toISOString().slice(0, 10))}</span>
</footer>
</div></body></html>`;

fs.writeFileSync(outPath, html);
console.log('wrote', outPath, Math.round(html.length / 1024) + ' KB,', data.items.length, 'items');
