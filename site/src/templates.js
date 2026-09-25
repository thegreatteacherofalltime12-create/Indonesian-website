// Page templates. Plain functions returning HTML strings; no framework.
// Every page is rendered once per locale: ctx.L is the language file (i18n/en.js or id.js), ctx.base is '' or '/id'.
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = (L, n, d) => { const s = d == null ? String(n) : Number(n).toFixed(d); return L && L.lang === 'id' ? s.replace('.', ',') : s; };
const fmtDims = (p, L) => (p.w && p.d && p.h) ? `${num(L, p.w)} × ${num(L, p.d)} × ${num(L, p.h)} cm` : null;
const inch = cm => Math.round(cm / 2.54 * 10) / 10;
const fmtDimsIn = (p, L) => (p.w && p.d && p.h) ? `${num(L, inch(p.w))} × ${num(L, inch(p.d))} × ${num(L, inch(p.h))} ${L && L.lang === 'id' ? 'inci' : 'in'}` : null;
const fmtDate = L => { const d = new Date(); return d.toLocaleDateString(L && L.lang === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); };
const money = n => n == null ? null : `US$${n.toLocaleString('en-US')}`;
// Translate a data value (from site.json / catalog.json) if the locale has it; otherwise pass through.
const tv = (L, s) => (s == null ? s : (L.values[s] ?? s));

function picture(manifest, name, alt, { sizes = '100vw', className = '', loading = 'lazy', fetchpriority } = {}) {
  const m = manifest[name];
  if (!m) return `<div class="placeholder">${esc(alt)}</div>`;
  const webp = m.fallbackW ? m.widths.map(w => `/images/${name}-${w}.webp ${w}w`).join(', ') : `/images/${name}.webp`;
  const src = `/images/${name}.jpg`;
  const attrs = `alt="${esc(alt)}" loading="${loading}" decoding="async" width="${m.fallbackW ? m.fallbackW : m.w}" height="${m.fallbackW ? Math.round(m.h * (m.fallbackW / m.w)) : m.h}"${fetchpriority ? ` fetchpriority="${fetchpriority}"` : ''}${className ? ` class="${className}"` : ''}`;
  return `<picture><source type="image/webp" srcset="${webp}"${m.fallbackW ? ` sizes="${sizes}"` : ''}><img src="${src}" ${attrs}></picture>`;
}

const icons = {
  source: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/></svg>',
  container: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="11" rx="1"/><path d="M6 7v11M10 7v11M14 7v11M18 7v11M2 12h20"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>',
  docs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/></svg>',
  visit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/></svg>',
};
const serviceIcons = [icons.source, icons.container, icons.check, icons.docs];
const mark = `<img class="brand-mark" src="/images/logo-mark.png" width="113" height="160" alt="" decoding="async">`;

// Mark "to be confirmed" values with the locale's label.
const tbcFor = L => s => {
  const v = tv(L, s);
  return /to be confirmed|belum dikonfirmasi/i.test(v) ? `${esc(v.replace(L.tbcPattern, '').trim())} <span class="tbc">${L.tbcLabel}</span>` : esc(v);
};

function gallery(manifest, items, cls = '') {
  return `<div class="gallery"${cls ? ` style="${cls}"` : ''}>${items.map(([name, alt, cap, tall]) => `<figure${tall ? ' class="tall"' : ''}>${picture(manifest, name, alt, { sizes: '(max-width:700px) 50vw, 380px' })}<figcaption>${esc(cap)}</figcaption></figure>`).join('')}</div>`;
}

function layout({ site, manifest, L, base, title, description, path, body, extraHead = '', ogImage }) {
  const preview = site.preview !== false;
  const nav = [['/products/', L.nav.products], ['/how-to-order/', L.nav.howToOrder], ['/workshops/', L.nav.workshops], ['/contact/', L.nav.contact]];
  const fullTitle = path === '/' ? `${site.shortBrand} — ${L.homeTitle}` : `${title} — ${site.shortBrand}`;
  const here = base + path, other = L.otherDir + path;
  const langs = [['en', 'English', path], ['id', 'Bahasa Indonesia', '/id' + path]];
  const langMenu = `<li class="lang-item"><details class="lang-menu"><summary aria-label="${L.nav.langSwitch}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg><span>${L.lang === 'id' ? 'ID' : 'EN'}</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><ul>${langs.map(([code, label, href]) => `<li><a href="${href}" lang="${code}" hreflang="${code}"${code === L.lang ? ' aria-current="true"' : ''}>${label}</a></li>`).join('')}</ul></details></li>`;
  return `<!doctype html>
<html lang="${L.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(site.url + here)}">
<link rel="alternate" hreflang="en" href="${esc(site.url + path)}">
<link rel="alternate" hreflang="id" href="${esc(site.url + '/id' + path)}">
<link rel="alternate" hreflang="x-default" href="${esc(site.url + path)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(site.url + here)}">
<meta property="og:image" content="${esc(site.url)}${ogImage || '/images/hero.jpg'}">
<meta property="og:site_name" content="${esc(site.brand)}">
<meta property="og:locale" content="${L.lang === 'id' ? 'id_ID' : 'en_US'}">
<meta name="twitter:card" content="summary_large_image">${preview ? '\n<meta name="robots" content="noindex,nofollow">' : ''}
<meta name="theme-color" content="#1F2A18">
<link rel="icon" href="/images/icon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="/images/icon-512.png" sizes="512x512" type="image/png">
<link rel="apple-touch-icon" href="/images/icon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Figtree:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/styles.css">
${extraHead}
</head>
<body data-base="${base}">
<a class="skip" href="#main">${L.nav.skip}</a>
${preview ? `<div class="preview-banner">${L.previewBanner(esc(site.brand))}</div>` : ''}
<header class="site-header">
  <div class="wrap nav">
    <a class="brand" href="${base}/" aria-label="${esc(site.brand)}">${mark}<span>${esc(site.shortBrand)}<small>${esc(L.brandSub)}</small></span></a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="nav-links" aria-label="${L.nav.menu}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    <nav aria-label="${L.nav.primary}"><ul class="nav-links" id="nav-links">
      ${langMenu}${nav.map(([href, label]) => `<li><a href="${base}${href}"${path.startsWith(href) ? ' aria-current="page"' : ''}>${label}</a></li>`).join('')}
    </ul></nav>
    <div class="nav-cta">
      <a class="btn btn-primary btn-sm quote-pill" href="${base}/contact/"><span class="long">${L.nav.quote}</span><span class="short">${L.nav.quoteShort}</span> <span class="count" data-n="0" data-quote-count>0</span></a>
    </div>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <nav class="footer-grid" aria-label="${L.nav.footer}">
      <div>
        <img class="footer-logo" src="/images/logo-lockup-light.png" width="640" height="756" alt="${esc(site.brand)}" loading="lazy" decoding="async">
        <h4 class="visually-hidden">${esc(site.brand)}</h4>
        <p>${esc(L.footer.about)}</p>
        <p style="margin-top:10px">${site.address.lines.map(l => esc(tv(L, l))).join('<br>')}</p>
        <p style="margin-top:10px">${site.showLegalEntity && site.legalEntity ? esc(site.legalEntity) : esc(L.footer.entity)}</p>
      </div>
      <div>
        <h4>${L.footer.browse}</h4>
        <ul>
          <li><a href="${base}/products/">${L.footer.all}</a></li>
          <li><a href="${base}/products/#outdoor">${L.footer.outdoor}</a></li>
          <li><a href="${base}/products/#lighting">${L.footer.lighting}</a></li>
          <li><a href="${base}/products/#wall-decor">${L.footer.wallDecor}</a></li>
          <li><a href="${base}/workshops/">${L.footer.workshops}</a></li>
        </ul>
      </div>
      <div>
        <h4>${L.footer.buying}</h4>
        <ul>
          <li><a href="${base}/how-to-order/">${L.footer.howToOrder}</a></li>
          <li><a href="${base}/how-to-order/#documents">${L.footer.documents}</a></li>
          <li><a href="${base}/how-to-order/#packing">${L.footer.packing}</a></li>
          <li><a href="${base}/contact/">${L.footer.quote}</a></li>
        </ul>
      </div>
      <div>
        <h4>${L.footer.contact}</h4>
        <ul>
          <li>${site.contact.emailConfirmed ? `<a href="mailto:${esc(site.contact.email)}">${esc(site.contact.email)}</a>` : `<span class="muted">${L.footer.emailTbc}</span>`}</li>
          <li><a href="https://wa.me/${site.contact.whatsapp.replace(/\D/g, '')}" rel="noopener">${L.footer.whatsapp} ${esc(site.contact.whatsapp)}</a></li>
          <li><a href="${esc(site.contact.instagram)}" rel="noopener">${L.footer.instagram} ${esc(site.contact.instagramHandle)}</a></li>
          <li class="muted">${esc(tv(L, site.contact.hours))}</li>
          <li><a class="lang" href="${other}" lang="${L.otherLang}" hreflang="${L.otherLang}">${L.otherLabel}</a></li>
        </ul>
      </div>
    </nav>
    <div class="footer-bottom">
      <span>${L.footer.legal(esc(site.brand), esc(tv(L, site.commerce.priceBasis)))}</span>
      <span><a href="${base}/privacy/">${L.footer.privacy}</a> · <a href="${base}/terms/">${L.footer.terms}</a></span>
    </div>
  </div>
</footer>
<div class="plan-bar" data-plan-bar hidden><span data-plan-summary></span><a class="btn btn-primary btn-sm" href="${base}/contact/">${L.planBar.cta}</a></div>
<script src="/app.js" defer></script>
</body>
</html>`;
}

function productCard(p, { site, manifest, catalog, L, base }) {
  const isThumb = /^ld-/.test(p.image || '');
  const cat = catalog.categories.find(c => c.slug === p.category);
  const dims = fmtDims(p, L);
  const spec = [tv(L, p.frame), tv(L, p.weave)].filter(Boolean).join(' · ') || tv(L, cat?.name);
  const price = site.commerce.showPrices && p.price ? `<span class="price">${money(p.price)}</span>` : `<span class="price-note">${L.card.priceOnRequest}</span>`;
  const href = `${base}/products/${p.sku.toLowerCase()}/`;
  return `<article class="card" data-sku="${esc(p.sku)}" data-category="${esc(p.category)}">
  <a class="media${isThumb ? ' thumb' : ''}" href="${href}" aria-label="${esc(p.name)}">
    ${p.image ? picture(manifest, p.image.replace(/\.jpg$/, ''), p.name, { sizes: '(max-width:600px) 100vw, (max-width:980px) 50vw, 300px' }) : `<div class="placeholder">${L.card.photoToCome}</div>`}
    ${isThumb ? `<span class="tag">${L.card.thumbTag}</span>` : ''}
  </a>
  <div class="body">
    <span class="sku">${esc(p.sku)}</span>
    <h3><a href="${href}">${esc(p.name)}</a></h3>
    <p class="spec">${esc(spec)}</p>
    ${dims ? `<p class="dims">${esc(dims)} · ${num(L, p.cbm, 3)} m³ · ${p.per40hc}${L.card.per40}</p>` : ''}
    <div class="foot">${price}<button class="btn btn-secondary btn-sm" type="button" data-add="${esc(p.sku)}">${L.card.add}</button></div>
  </div>
</article>`;
}

function loadPlanPanel(L, base, { cta = true, hint = true } = {}) {
  return `<h3 id="quote-title">${L.catalog.planTitle}</h3>
      ${hint ? `<p class="hint">${L.catalog.planHint}</p>` : ''}
      <p class="sr-only" aria-live="polite" data-plan-announce></p>
      <ul class="quote-items" data-quote-list></ul>
      <p class="empty" data-quote-empty>${cta ? L.catalog.planEmpty : L.contact.planEmpty(base)}</p>
      <div class="total-cbm"><span>${L.catalog.loadVolume}</span><b data-total-cbm>${num(L, 0, 1)} m³</b></div>
      <div class="fill" data-fill>
        <div class="row"><span>20 ft</span><div class="bar"><i data-bar="cbm20"></i></div><span class="pct" data-pct="cbm20">0%</span></div>
        <div class="row"><span>40 ft</span><div class="bar"><i data-bar="cbm40"></i></div><span class="pct" data-pct="cbm40">0%</span></div>
        <div class="row"><span>40HC</span><div class="bar"><i data-bar="cbm40hc"></i></div><span class="pct" data-pct="cbm40hc">0%</span></div>
      </div>
      ${cta ? `<a class="btn btn-primary" href="${base}/contact/">${L.catalog.planCta}</a>` : ''}`;
}

function home(ctx) {
  const { site, manifest, catalog, L, base } = ctx;
  const H = L.home;
  const featured = catalog.products.filter(p => ['LD-005', 'LD-007', 'LD-016', 'LD-003', 'WD-SET4', 'LT-ONION'].includes(p.sku));
  const body = `
<section class="hero">
  ${picture(manifest, 'hero', H.heroAlt, { sizes: '100vw', loading: 'eager', fetchpriority: 'high' })}
  <div class="wrap hero-inner">
    <span class="eyebrow" style="color:#D9C58E">${esc(H.eyebrow)}</span>
    <h1 style="margin-top:10px">${esc(H.h1)}</h1>
    <p class="lede">${esc(H.lede)}</p>
    <div class="actions">
      <a class="btn btn-primary" href="${base}/products/">${H.browse}</a>
      <a class="btn btn-secondary" href="${base}/how-to-order/">${H.howOrdering}</a>
    </div>
    <div class="hero-facts">${H.facts.map(([b, t]) => `<div><b>${esc(b)}</b>${esc(t)}</div>`).join('\n      ')}</div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head">
      <div><span class="eyebrow">${H.whatEyebrow}</span><h2 style="margin-top:8px">${esc(H.whatH2)}</h2></div>
      <p>${esc(H.whatP)}</p>
    </div>
    <div class="grid grid-4">
      ${H.services.map(([h, p], i) => `<div class="service"><span class="icon">${serviceIcons[i]}</span><h3>${esc(h)}</h3><p>${p}</p></div>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="section alt">
  <div class="wrap">
    <div class="section-head">
      <div><span class="eyebrow">${H.catalogEyebrow}</span><h2 style="margin-top:8px">${esc(H.selected)}</h2></div>
      <a class="btn btn-ghost" href="${base}/products/">${H.allProducts}</a>
    </div>
    <div class="products">${featured.map(p => productCard(p, ctx)).join('')}</div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head"><div><span class="eyebrow">${H.howEyebrow}</span><h2 style="margin-top:8px">${esc(H.howH2)}</h2></div></div>
    <div class="steps">
      ${H.steps.map(([h, p]) => `<div class="step"><h3>${esc(h)}</h3><p>${p}</p></div>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="section alt">
  <div class="wrap">
    <div class="section-head">
      <div><span class="eyebrow">${H.whereEyebrow}</span><h2 style="margin-top:8px">${esc(H.whereH2)}</h2></div>
      <a class="btn btn-ghost" href="${base}/workshops/">${H.aboutWorkshops}</a>
    </div>
    ${gallery(manifest, H.gallery)}
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head"><div><span class="eyebrow">${H.compEyebrow}</span><h2 style="margin-top:8px">${esc(H.compH2)}</h2></div><p>${esc(H.compP)}</p></div>
    <div class="creds">
      <div class="cred"><span class="mark">${icons.check}</span><div><b>${esc(H.creds[0][0])}</b><span>${H.creds[0][1]}</span></div></div>
      <div class="cred"><span class="mark">${icons.check}</span><div><b>${esc(H.creds[1][0])}</b><span>${H.creds[1][1]}</span></div></div>
      <div class="cred"><span class="mark">${icons.check}</span><div><b>${esc(H.creds[2][0])}</b><span>${H.creds[2][1]}</span></div></div>
    </div>
  </div>
</section>

<section class="section deep">
  <div class="wrap" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:20px">
    <div><h2>${esc(H.ctaH2)}</h2><p style="margin-top:8px;max-width:56ch">${esc(H.ctaP)}</p></div>
    <a class="btn btn-primary" href="${base}/contact/">${H.cta}</a>
  </div>
</section>`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'Organization', name: site.brand, url: site.url,
    address: { '@type': 'PostalAddress', streetAddress: site.address.lines[0], addressLocality: 'Bogor', addressRegion: 'West Java', postalCode: '16136', addressCountry: 'ID' },
    sameAs: [site.contact.instagram], description: site.tagline, logo: site.url + '/images/icon-512.png',
    contactPoint: { '@type': 'ContactPoint', contactType: 'sales', telephone: site.contact.whatsapp.replace(/\s/g, ''), areaServed: site.markets, availableLanguage: ['en', 'id'], email: site.contact.email, hoursAvailable: '08:00-17:00 UTC+7' },
  };
  return layout({ ...ctx, title: 'Home', description: H.metaDesc, path: '/', body, extraHead: `<script type="application/ld+json">${JSON.stringify(ld)}</script>` });
}

function catalogPage(ctx) {
  const { site, catalog, L, base } = ctx;
  const C = L.catalog;
  const cats = catalog.categories;
  const body = `
<section class="section-tight">
  <div class="wrap">
    <span class="eyebrow">${C.eyebrow}</span>
    <h1 style="margin-top:8px;font-size:clamp(30px,4vw,44px)">${esc(C.h1)}</h1>
    <p class="measure muted" style="margin-top:10px">${esc(C.intro(tv(L, site.commerce.priceBasis)))}</p>
  </div>
</section>
<section class="section-tight">
  <div class="wrap catalog-layout">
    <div>
      <div class="filters" role="group" aria-label="${C.filterLabel}">
        <button class="chip" type="button" data-filter="all" aria-pressed="true">${C.all}</button>
        ${cats.map(c => `<button class="chip" type="button" data-filter="${c.slug}" aria-pressed="false">${esc(tv(L, c.short))}</button>`).join('')}
      </div>
      ${cats.map(c => {
        const items = catalog.products.filter(p => p.category === c.slug);
        return `<section class="cat" id="${c.slug}" data-category-section="${c.slug}" style="margin-bottom:44px">
          <div class="section-head" style="margin-bottom:16px"><div><h2 style="font-size:24px">${esc(tv(L, c.name))}</h2></div><p style="font-size:15px">${esc(tv(L, c.blurb))}</p></div>
          ${items.length ? `<div class="products">${items.map(p => productCard(p, ctx)).join('')}</div>` : `<p class="muted">${C.specsOnRequest}</p>`}
          ${c.comingSoon ? `<p class="note">${C.comingSoon}</p>` : ''}
        </section>`;
      }).join('')}
    </div>
    <aside class="panel" aria-labelledby="quote-title" data-quote-panel>
      ${loadPlanPanel(L, base)}
    </aside>
  </div>
</section>`;
  return layout({ ...ctx, title: C.metaTitle, description: C.metaDesc, path: '/products/', body });
}

function productPage(p, ctx) {
  const { site, manifest, catalog, L, base } = ctx;
  const P = L.product, R = P.rows;
  const cat = catalog.categories.find(c => c.slug === p.category);
  const ws = catalog.workshops.find(w => w.slug === p.workshop);
  const isThumb = /^ld-/.test(p.image || '');
  const rows = [
    [R.frame, esc(tv(L, p.frame))], [R.weave, esc(tv(L, p.weave))], [R.finish, esc(tv(L, p.finish))], [R.cushion, esc(tv(L, p.cushion))], [R.colour, esc(tv(L, p.colour))],
    [R.dims, fmtDims(p, L) ? `<span class="mono">${fmtDims(p, L)}</span><br><span class="mono muted">${fmtDimsIn(p, L)}</span>` : null],
    [R.volume, p.cbm ? `<span class="mono">${num(L, p.cbm, 3)} m³</span>` : null],
    [R.per40, p.per40hc ? `<span class="mono">${p.per40hc}</span> <span class="muted">${R.per40Note}</span>` : null],
    [R.packaging, esc(tv(L, p.packaging))], [R.shipped, esc(tv(L, p.assembly))], [R.madeIn, ws ? `${esc(tv(L, ws.name))}, ${esc(tv(L, ws.region))}` : R.indonesia],
  ].filter(r => r[1]);
  const basis = tv(L, site.commerce.priceBasis);
  const price = site.commerce.showPrices && p.price ? `<p class="price" style="font-size:24px;margin-top:12px">${money(p.price)} <span class="price-note">${esc(basis)}</span></p>` : `<p class="muted" style="margin-top:12px">${esc(P.priceOnRequest(basis))}</p>`;
  const body = `
<section class="section-tight">
  <div class="wrap">
    <p class="muted" style="font-size:14px"><a href="${base}/products/">${L.nav.products}</a> / <a href="${base}/products/#${cat.slug}">${esc(tv(L, cat.name))}</a></p>
    <div class="product" style="margin-top:18px">
      <div class="media${isThumb ? ' thumb' : ''}">${p.image ? picture(manifest, p.image.replace(/\.jpg$/, ''), p.name, { sizes: '(max-width:860px) 100vw, 600px', loading: 'eager', fetchpriority: 'high' }) : `<div class="placeholder">${L.card.photoToCome}</div>`}</div>
      <div>
        <span class="sku mono muted">${esc(p.sku)}</span>
        <h1 style="font-size:clamp(28px,3.6vw,40px);margin-top:6px">${esc(p.name)}</h1>
        <p class="muted" style="margin-top:8px">${esc(tv(L, cat.name))}${ws ? ` · ${esc(tv(L, ws.name))}` : ''}</p>
        ${price}
        <table class="specs"><tbody>${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</tbody></table>
        ${p.notes ? `<p class="note">${esc(tv(L, p.notes))}</p>` : ''}
        ${isThumb ? `<p class="note">${esc(P.thumbNote)}</p>` : ''}
        <div class="qty-row">
          <label for="qty" style="margin:0">${P.qty}</label>
          <input id="qty" type="number" min="1" step="1" value="${p.per40hc && p.per40hc < 40 ? p.per40hc : 10}" inputmode="numeric">
          <button class="btn btn-primary" type="button" data-add="${esc(p.sku)}" data-qty-from="qty">${P.add}</button>
          <a class="btn btn-ghost" href="${base}/contact/">${P.goToRequest}</a>
        </div>
        ${p.per40hc ? `<p class="form-note" style="margin-top:10px">${esc(P.full40(p.per40hc))}</p>` : ''}
      </div>
    </div>
  </div>
</section>`;
  const mats = [tv(L, p.frame), tv(L, p.weave)].filter(Boolean).join(', ');
  let desc = P.metaDesc(p, fmtDims(p, L), p.per40hc, mats);
  if (desc.length > 155) desc = desc.slice(0, 155).replace(/[^.]*$/, '').trim() || desc.slice(0, 152) + '…';
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.sku, description: desc, manufacturer: { '@type': 'Organization', name: P.manufacturer(ws && ws.name) }, material: [p.frame, p.weave].filter(Boolean).join('; ') || undefined, image: p.image ? `${site.url}/images/${p.image}` : undefined };
  return layout({ ...ctx, title: p.name, description: desc, path: `/products/${p.sku.toLowerCase()}/`, body, ogImage: p.image ? `/images/${p.image}` : undefined, extraHead: `<script type="application/ld+json">${JSON.stringify(ld)}</script>` });
}

function howToOrder(ctx) {
  const { site, manifest, L, base } = ctx;
  const H = L.how, c = site.commerce, tbc = tbcFor(L);
  const body = `
<section class="section-tight"><div class="wrap">
  <span class="eyebrow">${H.eyebrow}</span>
  <h1 style="margin-top:8px;font-size:clamp(30px,4vw,44px)">${esc(H.h1)}</h1>
  <div class="prose" style="margin-top:20px">
    <p>${esc(H.intro(tv(L, c.priceBasis)))}</p>
    <div class="callout">${H.exporterNote(esc(site.brand))}</div>

    <h2 id="terms">${esc(H.termsH2)}</h2>
    <table>
      <tr><th>${H.termRows.basis}</th><td>${tbc(c.priceBasis)}</td></tr>
      <tr><th>${H.termRows.currency}</th><td>${esc(c.currency)}</td></tr>
      <tr><th>${H.termRows.moq}</th><td>${tbc(c.moq)}</td></tr>
      <tr><th>${H.termRows.payment}</th><td>${tbc(c.paymentTerms)}</td></tr>
      <tr><th>${H.termRows.lead}</th><td>${tbc(c.leadTime)}</td></tr>
      <tr><th>${H.termRows.container}</th><td>${H.termRows.containerVal}</td></tr>
      <tr><th>${H.termRows.markets}</th><td>${site.markets.map(m => esc(tv(L, m))).join(', ')}</td></tr>
      <tr><th>${H.termRows.comms}</th><td>${esc(H.termRows.commsVal(tv(L, site.contact.hours)))}</td></tr>
    </table>

    <h2>${esc(H.stepsH2)}</h2>
    <ol>${H.steps(base).map(s => `<li>${s}</li>`).join('\n      ')}</ol>

    <h2 id="documents">${esc(H.docsH2)}</h2>
    <ul>${H.docs.map(d => `<li>${d}</li>`).join('\n      ')}</ul>
    <div class="callout">${esc(H.importerNote)}</div>

    <h2 id="packing">${esc(H.packingH2)}</h2>
    <p>${H.packingP}</p>
    ${gallery(manifest, H.packGallery, 'margin-top:14px')}

    <h2>${esc(H.claimsH2)}</h2>
    <p>${H.claimsP}</p>
  </div>
</div></section>`;
  return layout({ ...ctx, title: H.metaTitle, description: H.metaDesc(site.brand), path: '/how-to-order/', body });
}

function workshops(ctx) {
  const { site, manifest, catalog, L, base } = ctx;
  const W = L.ws;
  const body = `
<section class="section-tight"><div class="wrap">
  <span class="eyebrow">${W.eyebrow}</span>
  <h1 style="margin-top:8px;font-size:clamp(30px,4vw,44px)">${esc(W.h1)}</h1>
  <div class="prose" style="margin-top:20px">
    <p>${esc(W.p1(site.brand))}</p>
    <p>${esc(W.p2)}</p>
  </div>
</div></section>
<section class="section-tight"><div class="wrap">
  ${gallery(manifest, W.gallery)}
</div></section>
<section class="section"><div class="wrap">
  <div class="grid grid-3">
    ${catalog.workshops.map(w => `<div class="service"><span class="icon">${icons.visit}</span><h3>${esc(tv(L, w.name))}</h3><p>${esc(tv(L, w.region))}<br>${esc(tv(L, w.makes))}</p></div>`).join('')}
  </div>
  <div class="prose" style="margin-top:36px">
    <h2>${esc(W.visitingH2)}</h2>
    <p>${W.visitingP(base)}</p>
  </div>
</div></section>`;
  return layout({ ...ctx, title: W.metaTitle, description: W.metaDesc(site.brand), path: '/workshops/', body });
}

function contact(ctx) {
  const { site, L, base } = ctx;
  const C = L.contact;
  const body = `
<section class="section-tight"><div class="wrap">
  <span class="eyebrow">${C.eyebrow}</span>
  <h1 style="margin-top:8px;font-size:clamp(30px,4vw,44px)">${esc(C.h1)}</h1>
  <p class="measure muted" style="margin-top:10px">${esc(C.intro(tv(L, site.contact.hours)))}</p>
  <div class="grid grid-2" style="margin-top:28px;align-items:start">
    <form class="form" data-inquiry novalidate>
      <p class="form-note">${esc(C.required)}</p>
      <div class="two">
        <div><label for="f-name">${esc(C.name)}</label><input id="f-name" name="name" type="text" autocomplete="name" required aria-required="true"></div>
        <div><label for="f-company">${esc(C.company)}</label><input id="f-company" name="company" type="text" autocomplete="organization" required aria-required="true"></div>
      </div>
      <div class="two">
        <div><label for="f-email">${esc(C.email)}</label><input id="f-email" name="email" type="email" autocomplete="email" required aria-required="true"></div>
        <div><label for="f-country">${esc(C.country)}</label><input id="f-country" name="country" type="text" placeholder="${esc(C.countryPh)}" required aria-required="true"></div>
      </div>
      <div>
        <label for="f-type">${esc(C.youAre)}</label>
        <select id="f-type" name="buyerType">${C.types.map(t => `<option>${esc(t)}</option>`).join('')}</select>
      </div>
      <div>
        <label for="f-items">${esc(C.items)}</label>
        <textarea id="f-items" name="items" placeholder="${esc(C.itemsPh)}"></textarea>
      </div>
      <div>
        <label for="f-message">${esc(C.message)}</label>
        <textarea id="f-message" name="message" style="min-height:100px" placeholder="${esc(C.messagePh)}"></textarea>
      </div>
      <div class="hp" aria-hidden="true"><label for="f-web">${esc(C.website)}</label><input id="f-web" name="website" type="text" tabindex="-1" autocomplete="off"></div>
      <div class="form-actions"><button class="btn btn-primary" type="submit">${esc(C.send)}</button><button class="btn btn-secondary" type="button" data-cancel>${esc(C.cancel)}</button></div>
      <p class="form-note">${C.consent(base)}</p>
      <div class="status" role="status" aria-live="polite" data-status></div>
    </form>
    <aside>
      <div class="panel" style="position:static">
        <h3>${esc(C.direct)}</h3>
        <ul style="list-style:none;padding:0;margin:12px 0 0;display:flex;flex-direction:column;gap:10px;font-size:15px">
          <li>${C.emailL}: ${site.contact.emailConfirmed ? `<a href="mailto:${esc(site.contact.email)}">${esc(site.contact.email)}</a>` : `<span class="tbc">${C.tbc}</span>`}</li>
          <li>${C.hoursL}: ${esc(tv(L, site.contact.hours))}</li>
          <li>${C.whatsapp}: <a href="https://wa.me/${site.contact.whatsapp.replace(/\D/g, '')}" rel="noopener">${esc(site.contact.whatsapp)}</a></li>
          <li>${C.instagram}: <a href="${esc(site.contact.instagram)}" rel="noopener">${esc(site.contact.instagramHandle)}</a></li>
          <li style="margin-top:6px" class="muted">${site.address.lines.map(l => esc(tv(L, l))).join('<br>')}</li>
        </ul>
      </div>
      <div class="panel" style="position:static;margin-top:16px">
        ${loadPlanPanel(L, base, { cta: false, hint: false })}
      </div>
    </aside>
  </div>
</div></section>`;
  return layout({ ...ctx, title: C.metaTitle, description: C.metaDesc(site.brand), path: '/contact/', body });
}

function privacy(ctx) {
  const { site, L } = ctx;
  const P = L.privacy;
  const body = `<section class="section-tight"><div class="wrap prose">
  <h1 style="font-size:clamp(28px,3.6vw,40px)">${esc(P.h1)}</h1>
  <p class="muted">${P.updated} ${fmtDate(L)}</p>
  <h2>${P.who}</h2><p>${esc(P.whoP(site.brand, site.address.lines.map(l => tv(L, l)).join(', ')))}</p>
  <h2>${P.collect}</h2><p>${esc(P.collectP)}</p>
  <h2>${P.analytics}</h2><p>${esc(site.analytics.ga4 ? P.analyticsOn : P.analyticsOff)}</p>
  <h2>${P.use}</h2><p>${esc(P.useP)}</p>
  <h2>${P.retention}</h2><p>${esc(P.retentionP)}</p>
  <h2>${P.contact}</h2><p>${esc(site.contact.email)} · WhatsApp ${esc(site.contact.whatsapp)}</p>
</div></section>`;
  return layout({ ...ctx, title: P.metaTitle, description: P.metaDesc(site.brand), path: '/privacy/', body });
}

function terms(ctx) {
  const { site, L } = ctx;
  const T = L.terms, c = site.commerce, tbc = tbcFor(L);
  const body = `<section class="section-tight"><div class="wrap prose">
  <h1 style="font-size:clamp(28px,3.6vw,40px)">${esc(T.h1)}</h1>
  <p class="muted">${T.draft(esc(site.brand))}</p>
  <h2>${T.parties}</h2><p>${T.partiesP(esc(site.brand))}</p>
  <h2>${T.quotes}</h2><p>${T.quotesP}</p>
  <h2>${T.prices}</h2><p>${esc(T.pricesP(c.currency, tv(L, c.priceBasis)))}</p>
  <h2>${T.payment}</h2><p>${T.paymentP(tbc(c.paymentTerms))}</p>
  <h2>${T.lead}</h2><p>${esc(T.leadP(tv(L, c.leadTime)))}</p>
  <h2>${T.quality}</h2><p>${T.qualityP}</p>
  <h2>${T.docs}</h2><p>${esc(T.docsP)}</p>
  <h2>${T.ip}</h2><p>${esc(T.ipP)}</p>
  <h2>${T.law}</h2><p>${esc(T.lawP)}</p>
</div></section>`;
  return layout({ ...ctx, title: T.metaTitle, description: T.metaDesc(site.brand), path: '/terms/', body });
}

function notFound(ctx) {
  const { L, base } = ctx;
  const body = `<section class="section"><div class="wrap prose"><h1>${esc(L.notFound.h1)}</h1><p style="margin-top:10px">${L.notFound.p(base)}</p></div></section>`;
  return layout({ ...ctx, title: L.notFound.title, description: L.notFound.title, path: '/404.html', body });
}

module.exports = { home, catalogPage, productPage, howToOrder, workshops, contact, privacy, terms, notFound };
