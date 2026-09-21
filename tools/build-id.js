const fs = require('fs');
const md = fs.readFileSync('../docs/intake/intake-id.md', 'utf8');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = s => {
  s = esc(s);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\n]+?)\*(?![*\w])/g, '$1<em>$2</em>');
  s = s.replace(/\b(PPQ \d{3}|PPQ Form \d{3}|\d+ CFR [\d.]+(?:\([a-z]\))?|HTS \d[\d.]*|Form \d{3,4}|9903\.\d{2}\.\d{2}|\d{4}\.\d{2}(?:\.\d{2,4})*(?:\/\.\d+)*)\b/g, '<code>$1</code>');
  return s;
};
const slug = s => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const lines = md.split('\n');
let out = []; let i = 0; let toc = []; let mode = ''; let h2n = 0; const MODES = ['flags','q','table','facts'];
while (i < lines.length) {
  const l = lines[i];
  if (l.startsWith('## ')) {
    const t = l.slice(3);
    mode = MODES[h2n++];
    out.push(`</section><section id="${slug(t)}" class="${mode}"><h2>${inline(t)}</h2>`); i++; continue;
  }
  if (l.startsWith('### ')) { const t = l.slice(4); const id = slug(t); toc.push({ t, id }); out.push(`<h3 id="${id}">${inline(t)}</h3>`); i++; continue; }
  if (/^\d+\. /.test(l)) {
    const startNum = parseInt(l.match(/^(\d+)\./)[1]);
    const items = []; while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(lines[i].replace(/^\d+\. /, '')); i++; }
    if (mode === 'flags') {
      out.push('<ol class="flags">' + items.map(it => { const m = it.match(/^\*\*(.+?)\*\*\s*(.*)$/); return m ? `<li><strong>${inline(m[1])}</strong><p>${inline(m[2])}</p></li>` : `<li><p>${inline(it)}</p></li>`; }).join('') + '</ol>');
    } else {
      out.push(`<ol class="qs" start="${startNum}">` + items.map(it => { const k = it.indexOf(' — '); const q = k > 0 ? it.slice(0, k) : it; const w = k > 0 ? it.slice(k + 3) : ''; return `<li><p class="q">${inline(q)}</p>${w ? `<p class="why">${inline(w)}</p>` : ''}</li>`; }).join('') + '</ol>');
    }
    continue;
  }
  if (l.startsWith('- ')) { const items = []; while (i < lines.length && lines[i].startsWith('- ')) { items.push(lines[i].slice(2)); i++; } out.push('<ul>' + items.map(it => `<li>${inline(it)}</li>`).join('') + '</ul>'); continue; }
  if (l.startsWith('|')) {
    const rows = []; while (i < lines.length && lines[i].startsWith('|')) { rows.push(lines[i]); i++; }
    const cells = r => r.split('|').slice(1, -1).map(c => c.trim()); const h = cells(rows[0]); const body = rows.slice(2).map(cells);
    out.push(`<div class="tw"><table><thead><tr>${h.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`); continue;
  }
  if (/^\*\*[^*]+\*\*$/.test(l.trim())) { out.push(`<h3 class="sub">${inline(l.trim().replace(/\*\*/g, ''))}</h3>`); i++; continue; }
  if (l.trim()) out.push(`<p>${inline(l)}</p>`);
  i++;
}
const counts = {}; let cur = null;
lines.forEach(l => { if (l.startsWith('### ')) { cur = l.slice(4); counts[cur] = 0; } else if (cur && /^\d+\. /.test(l)) counts[cur]++; });
const tocHtml = toc.map(x => `<li><a href="#${x.id}">${inline(x.t)}</a><span>${counts[x.t]}</span></li>`).join('');
const total = Object.values(counts).reduce((a, b) => a + b, 0);
const body = out.join('\n').replace(/^<\/section>/, '');
const css = fs.readFileSync('style.css', 'utf8');
const html = `<title>Kebutuhan Situs Buitenzorg Lemongrass</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>${css}</style>
<div class="wrap">
<header>
<span class="eyebrow">Kuesioner sebelum situs dibangun</span>
<h1>Kebutuhan Situs Buitenzorg Lemongrass</h1>
<p class="lede">Hal-hal yang dibutuhkan pembuat situs dari Buitenzorg Lemongrass Homecraft untuk membangun situs katalog ekspor bagi pembeli bisnis di Amerika Serikat. Jawab sesuai nomor; untuk sebagian besar pertanyaan, jawaban yang diharapkan berupa dokumen, nama, atau ya/tidak. Nomor pertanyaan sama dengan versi bahasa Inggris.</p>
<div class="meta"><span>${total} pertanyaan dalam 4 kelompok</span><span>Riset per 15–20 Sep 2026; model agen ekspor</span><span>Aturan tarif AS sering berubah; pembeli sebaiknya cek ulang sebelum memesan</span></div>
</header>
<nav class="toc" aria-label="Kelompok pertanyaan"><span class="eyebrow">Kelompok pertanyaan</span><ol>${tocHtml}</ol></nav>
${body}</section>
<footer>Disusun dari dokumentasi USDA APHIS (Lacey Act), CBP, USITC HTS, USTR, Federal Register, CITES, Shopify, Stripe, PayPal, Xendit, dan Midtrans; setiap klaim penting dicek ulang secara independen. Butir yang ditandai "belum diverifikasi ulang" atau "belum terkonfirmasi" sebaiknya dikonfirmasi ke PPJK/customs broker atau langsung ke platform terkait.</footer>
</div>`;
fs.writeFileSync('../docs/intake/intake-id.html', html);
console.log('ok', total, html.length);
