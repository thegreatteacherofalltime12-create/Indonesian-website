// Weekly health check for argamattbuitenzorg.com.
// Run from the repo root: node tools/health-check.js
// Writes client-docs/health/report-YYYY-MM-DD.md and keeps a photo baseline in
// client-docs/health/baseline.json (both git-ignored). Exit code 1 if anything
// needs attention. Read-only: it never deploys, commits or edits site files.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const DIST = path.join(SITE, 'dist');
const HEALTH = path.join(ROOT, 'client-docs', 'health');
const LIVE = 'https://argamattbuitenzorg.com';
const SLOW_MS = 1500;
const ALLOWED_HOSTS = new Set([
  'argamattbuitenzorg.com', 'www.argamattbuitenzorg.com', 'fonts.googleapis.com', 'fonts.gstatic.com',
  'www.instagram.com', 'wa.me', 'schema.org', 'www.w3.org',
]);
const REQUIRED_HEADERS = ['x-content-type-options', 'referrer-policy', 'x-frame-options'];

const d0 = new Date();
const today = `${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, '0')}-${String(d0.getDate()).padStart(2, '0')}`;
const out = { bugs: [], speed: [], security: [], photos: [], info: [] };
const sha = buf => crypto.createHash('sha256').update(buf).digest('hex');
// Cloudflare's Email Address Obfuscation rewrites addresses on the live pages;
// fold both sides to the same form so only real differences remain.
const normHtml = s => String(s)
  .replace(/<script data-cfasync="false" src="\/cdn-cgi\/scripts\/[^"]+\/email-decode\.min\.js"><\/script>/g, '')
  .replace(/(Last updated|Terakhir diperbarui) \d{1,2} \S+ \d{4}/g, '$1 DATE')
  .replace(/<a href="\/cdn-cgi\/l\/email-protection" class="__cf_email__"[^>]*>[^<]*<\/a>/g, 'EMAIL')
  .replace(/<a href="(?:mailto:[^"]*|\/cdn-cgi\/l\/email-protection[^"]*)"([^>]*)>[\s\S]*?<\/a>/g, '<a EMAIL$1>EMAIL</a>')
  .replace(/<span class="__cf_email__"[^>]*>[^<]*<\/span>/g, 'EMAIL')
  .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, 'EMAIL');
const walk = dir => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]) : [];
const rel = p => path.relative(ROOT, p).replace(/\\/g, '/');

async function timed(url) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { redirect: 'manual', headers: { 'cache-control': 'no-cache' } });
    const body = Buffer.from(await r.arrayBuffer());
    return { url, status: r.status, ms: Date.now() - t0, bytes: body.length, body, headers: r.headers };
  } catch (e) {
    return { url, status: 0, ms: Date.now() - t0, bytes: 0, body: Buffer.alloc(0), error: e.message };
  }
}
async function pool(items, n, fn) {
  const res = []; let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; res[k] = await fn(items[k]); } }));
  return res;
}

(async () => {
  // ---------- 1. Bugs in the code ----------
  const jsFiles = [...walk(path.join(SITE, 'src')), ...walk(path.join(SITE, 'functions')), ...walk(path.join(SITE, 'i18n')),
    path.join(SITE, 'build.js'), ...walk(path.join(SITE, 'tools')), ...walk(path.join(ROOT, 'tools'))].filter(f => f.endsWith('.js'));
  for (const f of jsFiles) {
    let target = f;
    if (f.includes(path.sep + 'functions' + path.sep)) {
      target = path.join(require('os').tmpdir(), 'hc-' + path.basename(f, '.js') + '.mjs');
      fs.copyFileSync(f, target);
    }
    const r = spawnSync(process.execPath, ['--check', target], { encoding: 'utf8' });
    if (r.status !== 0) out.bugs.push(`Syntax error in \`${rel(f)}\`: ${(r.stderr || '').split('\n').find(l => /Error/.test(l)) || 'see node --check'}`);
  }
  out.info.push(`Syntax-checked ${jsFiles.length} JavaScript files.`);

  const build = spawnSync(process.execPath, ['build.js'], { cwd: SITE, encoding: 'utf8' });
  if (build.status !== 0) out.bugs.push(`Site build FAILED: ${(build.stderr || build.stdout).trim().split('\n').slice(-3).join(' / ')}`);
  else out.info.push(`Local build: ${build.stdout.trim()}`);

  const catalog = JSON.parse(fs.readFileSync(path.join(SITE, 'data', 'catalog.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(SITE, 'public', 'images', 'manifest.json'), 'utf8'));
  const idValues = require(path.join(SITE, 'i18n', 'id.js')).values;
  const cats = new Set(catalog.categories.map(c => c.slug));
  const skus = new Set();
  for (const p of catalog.products) {
    if (skus.has(p.sku)) out.bugs.push(`Duplicate product code ${p.sku}.`);
    skus.add(p.sku);
    if (!cats.has(p.category)) out.bugs.push(`${p.sku} points at a category that doesn't exist ("${p.category}").`);
    const key = (p.image || '').replace(/\.(jpe?g|png|webp)$/i, '');
    if (!manifest[key]) out.photos.push(`${p.sku} (${p.name}) has no photo — it shows a placeholder on the site.`);
    for (const f of ['name', 'notes', 'colour', 'frame', 'weave', 'cushion']) {
      const v = p[f];
      if (v && f !== 'name' && !idValues[v]) out.info.push(`Indonesian translation missing for ${p.sku} ${f}: "${v.slice(0, 60)}"`);
    }
  }
  for (const c of catalog.categories) for (const f of ['name', 'short', 'blurb'])
    if (c[f] && !idValues[c[f]]) out.bugs.push(`Category "${c.slug}" ${f} has no Indonesian translation, so the Indonesian site shows English.`);

  // broken internal links in the build
  if (build.status === 0) {
    const htmlFiles = walk(DIST).filter(f => f.endsWith('.html'));
    const broken = new Map();
    for (const f of htmlFiles) {
      const html = fs.readFileSync(f, 'utf8');
      for (const m of html.matchAll(/(?:href|src|srcset)="([^"]+)"/g)) {
        for (const part of m[1].split(',')) {
          let u = part.trim().split(/\s+/)[0];
          if (u.startsWith(LIVE)) u = u.slice(LIVE.length) || '/';
          if (!u.startsWith('/') || u.startsWith('//')) continue;
          const clean = decodeURIComponent(u.split(/[?#]/)[0]);
          if (clean.startsWith('/api/') || clean.startsWith('/admin')) continue;
          let target = path.join(DIST, clean);
          if (clean.endsWith('/')) target = path.join(target, 'index.html');
          if (!fs.existsSync(target) && !fs.existsSync(target + '.html')) {
            const k = clean; if (!broken.has(k)) broken.set(k, rel(f));
          }
        }
      }
    }
    for (const [u, from] of [...broken].slice(0, 25)) out.bugs.push(`Broken link \`${u}\` (first seen in ${from}).`);
    if (broken.size > 25) out.bugs.push(`…and ${broken.size - 25} more broken links.`);
    out.info.push(`Checked links across ${htmlFiles.length} built pages.`);
  }

  // dependency vulnerabilities
  try {
    const a = spawnSync('npm audit --json', { cwd: SITE, encoding: 'utf8', shell: true });
    const aj = JSON.parse(a.stdout || '{}');
    const v = aj.metadata?.vulnerabilities || {};
    const names = Object.entries(aj.vulnerabilities || {}).filter(([, x]) => ['high', 'critical'].includes(x.severity)).map(([n]) => n);
    const bad = (v.high || 0) + (v.critical || 0);
    if (bad) out.security.push(`npm audit: ${v.critical || 0} critical, ${v.high || 0} high vulnerabilities in the build tools (${names.join(", ")}). Not served to visitors, but worth updating.`);
    else out.info.push(`npm audit: no high/critical issues (${v.moderate || 0} moderate, ${v.low || 0} low).`);
  } catch { out.info.push('npm audit could not run.'); }

  // ---------- 2. Lag / delays + 3. tamper & malware (live) ----------
  const sitemapRes = await timed(`${LIVE}/sitemap.xml`);
  const urls = [...sitemapRes.body.toString().matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  if (!urls.length) out.bugs.push(`Live sitemap could not be read (status ${sitemapRes.status}).`);
  const pages = await pool(urls, 6, timed);
  const slow = pages.filter(p => p.ms > SLOW_MS).sort((a, b) => b.ms - a.ms);
  const down = pages.filter(p => p.status !== 200);
  const avg = pages.length ? Math.round(pages.reduce((s, p) => s + p.ms, 0) / pages.length) : 0;
  const worst = pages.reduce((m, p) => (p.ms > (m?.ms || 0) ? p : m), null);
  out.info.push(`Fetched ${pages.length} live pages: average ${avg} ms, slowest ${worst ? worst.ms + ' ms (' + worst.url.replace(LIVE, '') + ')' : 'n/a'}.`);
  for (const p of down) out.bugs.push(`Live page ${p.url.replace(LIVE, '') || '/'} returned ${p.status || 'no response'}${p.error ? ' (' + p.error + ')' : ''}.`);
  for (const p of slow.slice(0, 10)) out.speed.push(`${p.url.replace(LIVE, '') || '/'} took ${p.ms} ms (limit ${SLOW_MS} ms), ${(p.bytes / 1024).toFixed(0)} KB.`);
  const heavy = pages.filter(p => p.bytes > 250 * 1024);
  for (const p of heavy) out.speed.push(`${p.url.replace(LIVE, '')} page HTML is ${(p.bytes / 1024).toFixed(0)} KB — unusually large.`);

  // live images: speed + size
  const imgs = Object.entries(manifest).flatMap(([n, m]) => [`/images/${n}.jpg`, ...(m.fallbackW ? m.widths.map(w => `/images/${n}-${w}.webp`) : [`/images/${n}.webp`])]);
  const imgRes = await pool(imgs, 8, u => timed(LIVE + u));
  const imgDown = imgRes.filter(r => r.status !== 200);
  for (const r of imgDown.slice(0, 15)) out.photos.push(`Live image ${r.url.replace(LIVE, '')} returned ${r.status || 'no response'}.`);
  for (const r of imgRes.filter(r => r.bytes > 400 * 1024)) out.speed.push(`Image ${r.url.replace(LIVE, '')} is ${(r.bytes / 1024).toFixed(0)} KB — slow on phones.`);
  const slowImgs = imgRes.filter(r => r.ms > SLOW_MS * 2);
  if (slowImgs.length) out.speed.push(`${slowImgs.length} images took over ${SLOW_MS * 2} ms to load.`);
  out.info.push(`Fetched ${imgRes.length} live images.`);

  // headers
  const home = pages.find(p => p.url === `${LIVE}/`) || await timed(`${LIVE}/`);
  for (const h of REQUIRED_HEADERS) if (!home.headers?.get(h)) out.security.push(`Security header \`${h}\` is missing from the live site.`);
  const www = await timed('https://www.argamattbuitenzorg.com/');
  if (www.status !== 301 || !(www.headers?.get('location') || '').startsWith(LIVE)) out.bugs.push(`www redirect is not a 301 to the main domain (got ${www.status}).`);

  // malware scan on live HTML
  const susp = [/<iframe/i, /eval\(/, /document\.write\(/, /atob\(/, /crypto-?miner|coinhive|cryptonight/i, /<script[^>]+src="https?:\/\/(?!argamattbuitenzorg\.com)/i, /window\.location\s*=\s*["']https?:/i, /fromCharCode\(/];
  for (const p of pages) {
    const html = p.body.toString();
    for (const re of susp) if (re.test(html)) out.security.push(`Suspicious code pattern ${re} on live page ${p.url.replace(LIVE, '') || '/'}.`);
    for (const m of html.matchAll(/(?:src|href|action)="https?:\/\/([^"/:]+)/g))
      if (!ALLOWED_HOSTS.has(m[1].toLowerCase())) out.security.push(`Unknown outside site \`${m[1]}\` linked from ${p.url.replace(LIVE, '') || '/'}.`);
  }
  for (const f of ['/app.js', '/styles.css']) {
    const r = await timed(LIVE + f);
    const local = path.join(DIST, f);
    if (r.status === 200 && fs.existsSync(local) && sha(r.body) !== sha(fs.readFileSync(local)))
      out.security.push(`Live \`${f}\` differs from the local build — either changes not yet deployed, or the live file was altered.`);
  }

  // live HTML vs local build (tamper or undeployed changes)
  if (build.status === 0) {
    let diff = 0; const samples = [];
    for (const p of pages) {
      if (p.status !== 200) continue;
      const u = p.url.replace(LIVE, '');
      const local = path.join(DIST, u, u.endsWith('/') ? 'index.html' : '');
      if (!fs.existsSync(local)) { diff++; samples.push(u + ' (not in local build)'); continue; }
      if (sha(normHtml(p.body)) !== sha(normHtml(fs.readFileSync(local)))) { diff++; samples.push(u); }
    }
    if (diff) out.security.push(`${diff} live page(s) don't match the local build: ${samples.slice(0, 6).join(', ')}${diff > 6 ? '…' : ''}. If nothing was edited locally since the last deploy, someone changed the live site.`);
    else out.info.push('Every live page matches the local build byte-for-byte (no tampering, nothing undeployed).');
  }

  // repo integrity
  try {
    const st = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' }).trim();
    const risky = st.split('\n').filter(l => l && /site\/(functions|src|public)\//.test(l));
    if (risky.length) out.security.push(`Uncommitted changes to site code or public files: ${risky.slice(0, 8).map(l => l.trim()).join('; ')}.`);
    const ahead = execSync('git fetch -q && git rev-list --left-right --count HEAD...@{u}', { cwd: ROOT, encoding: 'utf8' }).trim().split(/\s+/);
    if (+ahead[1] > 0) out.security.push(`GitHub has ${ahead[1]} commit(s) that aren't on this computer — check who pushed them.`);
  } catch (e) { out.info.push('Git checks skipped: ' + e.message.split('\n')[0]); }

  // ---------- 4. Photos: edits since last week ----------
  const photoDirs = [path.join(SITE, 'public', 'images'), ...fs.readdirSync(path.join(ROOT, 'client-docs'), { withFileTypes: true })
    .filter(d => d.isDirectory()).flatMap(d => ['cropped', 'cleaned', 'source'].map(s => path.join(ROOT, 'client-docs', d.name, s)))];
  const now = {};
  for (const f of photoDirs.flatMap(walk)) {
    if (!/\.(jpe?g|png|webp)$/i.test(f)) continue;
    const buf = fs.readFileSync(f);
    now[rel(f)] = sha(buf);
    if (buf.length === 0) out.photos.push(`Empty (0 byte) image file: \`${rel(f)}\`.`);
  }
  fs.mkdirSync(HEALTH, { recursive: true });
  const basePath = path.join(HEALTH, 'baseline.json');
  if (fs.existsSync(basePath)) {
    const prev = JSON.parse(fs.readFileSync(basePath, 'utf8'));
    const added = Object.keys(now).filter(k => !(k in prev.files));
    const removed = Object.keys(prev.files).filter(k => !(k in now));
    const changed = Object.keys(now).filter(k => k in prev.files && prev.files[k] !== now[k]);
    const list = (label, arr) => arr.length && out.photos.push(`${arr.length} photo file(s) ${label} since ${prev.date}: ${arr.slice(0, 10).map(x => '`' + x + '`').join(', ')}${arr.length > 10 ? '…' : ''}`);
    list('EDITED', changed); list('added', added); list('deleted', removed);
    if (!added.length && !removed.length && !changed.length) out.info.push(`No photo files changed since ${prev.date} (${Object.keys(now).length} tracked).`);
  } else out.info.push(`First run: recorded a baseline of ${Object.keys(now).length} photo files to compare against next week.`);
  fs.writeFileSync(basePath, JSON.stringify({ date: today, files: now }, null, 1));

  // live images vs local (replaced on the server?)
  let imgMismatch = 0;
  for (const r of imgRes) {
    if (r.status !== 200) continue;
    const local = path.join(DIST, r.url.replace(LIVE, ''));
    if (fs.existsSync(local) && sha(r.body) !== sha(fs.readFileSync(local))) imgMismatch++;
  }
  if (imgMismatch) out.photos.push(`${imgMismatch} live image(s) differ from the local copies — a photo was swapped on the server or a local edit hasn't been deployed.`);

  // ---------- report ----------
  const sections = [
    ['1. Bugs in the code', out.bugs], ['2. Lag or delays', out.speed],
    ['3. Malware and tampering', out.security], ['4. Photos and other problems', out.photos],
  ];
  const problems = sections.reduce((s, [, a]) => s + a.length, 0);
  const md = [`# Website health check — ${today}`, '', problems ? `**${problems} item(s) need attention.**` : '**All clear — nothing needs attention.**', '',
    ...sections.flatMap(([t, a]) => [`## ${t}`, ...(a.length ? a.map(x => '- ' + x) : ['- OK']), '']),
    '## Details', ...out.info.map(x => '- ' + x), ''].join('\n');
  const reportPath = path.join(HEALTH, `report-${today}.md`);
  fs.writeFileSync(reportPath, md);
  console.log(md);
  console.log(`\nReport saved: ${rel(reportPath)}`);
  process.exit(problems ? 1 : 0);
})();
