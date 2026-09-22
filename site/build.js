// Static site generator. Run: node build.js  (from site/). Output: dist/
const fs = require('fs');
const path = require('path');
const T = require('./src/templates');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/site.json'), 'utf8'));
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/catalog.json'), 'utf8'));
const manifestPath = path.join(ROOT, 'public/images/manifest.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
const preview = site.preview !== false;

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

function write(rel, html) {
  const out = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
}
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name), d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

const locales = [require('./i18n/en'), require('./i18n/id')];
for (const L of locales) {
  const base = L.dir; const d = base ? base.slice(1) + '/' : '';
  const ctx = { site, manifest, catalog, L, base };
  write(d + 'index.html', T.home(ctx));
  write(d + 'products/index.html', T.catalogPage(ctx));
  for (const p of catalog.products) write(`${d}products/${p.sku.toLowerCase()}/index.html`, T.productPage(p, ctx));
  write(d + 'how-to-order/index.html', T.howToOrder(ctx));
  write(d + 'workshops/index.html', T.workshops(ctx));
  write(d + 'contact/index.html', T.contact(ctx));
  write(d + 'privacy/index.html', T.privacy(ctx));
  write(d + 'terms/index.html', T.terms(ctx));
  write(d + '404.html', T.notFound(ctx));
}

// Public data for the client script — never includes prices unless showPrices is on
if (site.commerce.showPrices && catalog.listBasis !== site.commerce.priceBasis) {
  throw new Error(`Refusing to publish prices: catalog list basis is "${catalog.listBasis}" but site priceBasis is "${site.commerce.priceBasis}". Re-price the catalog or align the basis first.`);
}
const pub = {
  container: site.commerce.container,
  products: catalog.products.map(p => ({ sku: p.sku, name: p.name, category: p.category, cbm: p.cbm, per40hc: p.per40hc, ...(site.commerce.showPrices ? { price: p.price } : {}) })),
};
write('products.json', JSON.stringify(pub));

// Assets
fs.copyFileSync(path.join(ROOT, 'src/styles.css'), path.join(DIST, 'styles.css'));
fs.copyFileSync(path.join(ROOT, 'src/app.js'), path.join(DIST, 'app.js'));
copyDir(path.join(ROOT, 'public'), DIST);
fs.rmSync(path.join(DIST, 'images/manifest.json'), { force: true });

// robots + sitemap
const paths = ['/', '/products/', '/how-to-order/', '/workshops/', '/contact/', '/privacy/', '/terms/', ...catalog.products.map(p => `/products/${p.sku.toLowerCase()}/`)];
const urls = [...paths, ...paths.map(p => '/id' + p)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${site.url}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', preview ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
// www -> apex, so the site has one canonical address. Pages applies this before serving.
const apexHost = site.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
if (!apexHost.startsWith('www.')) write('_redirects', `https://www.${apexHost}/* ${site.url}/:splat 301\n`);

write('_headers', `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY${preview ? '\n  X-Robots-Tag: noindex' : ''}\n/images/*\n  Cache-Control: public, max-age=86400, stale-while-revalidate=604800\n`);

console.log(`built ${urls.length} pages -> dist/`);
