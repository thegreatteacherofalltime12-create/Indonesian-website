// Extract text from a PDF without dependencies: inflate the content streams and
// pull the strings out of the text-showing operators (Tj, TJ, ', ").
// Embedded font programs also inflate cleanly, so only streams that look like
// page content (a BT...ET text block, mostly printable) are considered.
// Usage: node tools/extract-pdf-text.js <pdf>
const fs = require('fs');
const zlib = require('zlib');

const pdfPath = process.argv[2];
if (!pdfPath) { console.error('usage: node extract-pdf-text.js <pdf>'); process.exit(1); }
const buf = fs.readFileSync(pdfPath);
const latin = buf.toString('latin1');

const printableRatio = s => {
  let ok = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 9 || c === 10 || c === 13 || (c >= 32 && c < 127)) ok++;
  }
  return ok / (s.length || 1);
};

const chunks = [];
let pos = 0;
while (true) {
  const kw = latin.indexOf('stream', pos);
  if (kw < 0) break;
  let start = kw + 6;
  if (latin[start] === '\r') start++;
  if (latin[start] === '\n') start++;
  const end = latin.indexOf('endstream', start);
  if (end < 0) break;
  pos = end + 9;
  let s;
  try { s = zlib.inflateSync(buf.subarray(start, end)).toString('latin1'); } catch { continue; }
  if (!/\bBT\b/.test(s) || !/(Tj|TJ)\b/.test(s)) continue; // not a text-bearing content stream
  if (printableRatio(s) < 0.9) continue;                   // font program or image data
  chunks.push(s);
}

const unescape = s => s
  .replace(/\\([nrtbf])/g, (m, c) => ({ n: '\n', r: '\r', t: '\t', b: '', f: '' }[c]))
  .replace(/\\([0-7]{1,3})/g, (m, o) => String.fromCharCode(parseInt(o, 8)))
  .replace(/\\(.)/g, '$1');

const out = [];
for (const c of chunks) {
  for (const line of c.split(/(?<=Tj|TJ|ET)\s/)) {
    const parts = [...line.matchAll(/\(((?:[^()\\]|\\.)*)\)/g)].map(m => unescape(m[1]));
    if (!parts.length) continue;
    const text = parts.join('').replace(/id-ID/g, '').replace(/[^\x20-\x7E -ɏ]/g, '').trim();
    if (text) out.push(text);
  }
}

console.log(out.join('\n').replace(/\n{3,}/g, '\n\n').trim() ||
  '(no extractable text — the PDF is probably a scan; extract images instead)');
