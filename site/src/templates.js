// Page templates. Plain functions returning HTML strings; no framework.
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmtDims = p => (p.w && p.d && p.h) ? `${p.w} × ${p.d} × ${p.h} cm` : null;
const inch = cm => Math.round(cm / 2.54 * 10) / 10;
const fmtDimsIn = p => (p.w && p.d && p.h) ? `${inch(p.w)} × ${inch(p.d)} × ${inch(p.h)} in` : null;
const money = n => n == null ? null : `US$${n.toLocaleString('en-US')}`;

function picture(manifest, name, alt, { sizes = '100vw', className = '', loading = 'lazy', fetchpriority } = {}) {
  const m = manifest[name];
  if (!m) return `<div class="placeholder">Photo to come</div>`;
  const srcset = m.widths.length > 1 || (m.widths.length === 1 && !m.fallbackW) ? '' : '';
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
  ship: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0M4 14l1.5-5h13L20 14M8 9V5h8v4"/></svg>',
  visit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1.1 2.7 11.4 11.4 0 0 0 4.4 3.9c1.6.7 2.3.8 3.1.6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3z"/></svg>',
};

const mark = `<svg class="brand-mark" viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="6" fill="#4C6A1D"/><path d="M8 26c3-9 7-14 18-18-2 8-7 14-18 18zm0 0c5-3 9-7 12-12" fill="none" stroke="#F5F3EE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function layout({ site, manifest, title, description, path, body, extraHead = '', preview = true }) {
  const nav = [
    ['/products/', 'Products'],
    ['/how-to-order/', 'How to order'],
    ['/workshops/', 'Workshops'],
    ['/contact/', 'Contact'],
  ];
  const fullTitle = path === '/' ? `${site.brand} — Indonesian furniture for trade buyers` : `${title} — ${site.shortBrand}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(site.url + path)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(site.url + path)}">
<meta property="og:image" content="${esc(site.url)}/images/hero.jpg">
<meta name="theme-color" content="#1F2A18">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Figtree:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/styles.css">
${extraHead}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${preview ? `<div class="preview-banner">Preview build — contact details, prices and terms are placeholders until confirmed by ${esc(site.brand)}.</div>` : ''}
<header class="site-header">
  <div class="wrap nav">
    <a class="brand" href="/" aria-label="${esc(site.brand)} home">${mark}<span>${esc(site.shortBrand)}<small>Homecraft · Bogor, Indonesia</small></span></a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="nav-links" aria-label="Menu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    <ul class="nav-links" id="nav-links">
      ${nav.map(([href, label]) => `<li><a href="${href}"${path.startsWith(href) ? ' aria-current="page"' : ''}>${label}</a></li>`).join('')}
    </ul>
    <div class="nav-cta">
      <a class="btn btn-primary btn-sm quote-pill" href="/contact/"><span class="long">Request a quote</span><span class="short">Quote</span> <span class="count" data-n="0" data-quote-count>0</span></a>
    </div>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <h4>${esc(site.brand)}</h4>
        <p>Export sourcing for Indonesian outdoor furniture, rattan and natural-fibre craft. Based in Bogor, West Java; workshops in Cirebon, Yogyakarta and Ngawi.</p>
        <p style="margin-top:10px">${site.address.lines.map(esc).join('<br>')}</p>
        <p style="margin-top:10px">${site.legalEntity ? `${esc(site.legalEntity)}${site.legalEntityConfirmed ? '' : ' <span class="muted">(entity details to be confirmed)</span>'}` : ''}</p>
      </div>
      <div>
        <h4>Browse</h4>
        <ul>
          <li><a href="/products/">All products</a></li>
          <li><a href="/products/#outdoor">Outdoor furniture</a></li>
          <li><a href="/products/#lighting">Lighting</a></li>
          <li><a href="/products/#wall-decor">Wall decor</a></li>
          <li><a href="/workshops/">Workshops</a></li>
        </ul>
      </div>
      <div>
        <h4>Buying</h4>
        <ul>
          <li><a href="/how-to-order/">How to order</a></li>
          <li><a href="/how-to-order/#documents">Export documents</a></li>
          <li><a href="/how-to-order/#packing">Packing &amp; loading</a></li>
          <li><a href="/contact/">Request a quote</a></li>
        </ul>
      </div>
      <div>
        <h4>Contact</h4>
        <ul>
          <li><a href="mailto:${esc(site.contact.email)}">${site.contact.emailConfirmed ? esc(site.contact.email) : 'Email (to be confirmed)'}</a></li>
          <li><a href="https://wa.me/${site.contact.whatsapp.replace(/\D/g, '')}" rel="noopener">WhatsApp ${esc(site.contact.whatsapp)}</a></li>
          <li><a href="${esc(site.contact.instagram)}" rel="noopener">Instagram ${esc(site.contact.instagramHandle)}</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} ${esc(site.brand)}. Prices quoted ${esc(site.commerce.priceBasis)}; buyer is importer of record.</span>
      <span><a href="/privacy/">Privacy</a> · <a href="/terms/">Terms of sale</a></span>
    </div>
  </div>
</footer>
<script src="/app.js" defer></script>
</body>
</html>`;
}

function productCard(p, { site, manifest, categories }) {
  const isThumb = /^ld-/.test(p.image || '');
  const cat = categories.find(c => c.slug === p.category);
  const dims = fmtDims(p);
  const spec = [p.frame, p.weave].filter(Boolean).join(' · ') || cat?.name;
  const price = site.commerce.showPrices && p.price ? `<span class="price">${money(p.price)}</span>` : `<span class="price-note">Price on request</span>`;
  return `<article class="card" data-sku="${esc(p.sku)}" data-category="${esc(p.category)}">
  <a class="media${isThumb ? ' thumb' : ''}" href="/products/${p.sku.toLowerCase()}/" aria-label="${esc(p.name)}">
    ${p.image ? picture(manifest, p.image.replace(/\.jpg$/, ''), p.name, { sizes: '(max-width:600px) 100vw, (max-width:980px) 50vw, 300px' }) : '<div class="placeholder">Photo to come</div>'}
    ${isThumb ? '<span class="tag">Price-list photo</span>' : ''}
  </a>
  <div class="body">
    <span class="sku">${esc(p.sku)}</span>
    <h3><a href="/products/${p.sku.toLowerCase()}/">${esc(p.name)}</a></h3>
    <p class="spec">${esc(spec)}</p>
    ${dims ? `<p class="dims">${esc(dims)} · ${p.cbm.toFixed(3)} m³ · ${p.per40hc}/40HC</p>` : ''}
    <div class="foot">${price}<button class="btn btn-secondary btn-sm" type="button" data-add="${esc(p.sku)}">Add to quote</button></div>
  </div>
</article>`;
}

function home({ site, manifest, catalog }) {
  const featured = catalog.products.filter(p => ['LD-005', 'LD-007', 'LD-016', 'LD-003', 'WD-SET4', 'LT-ONION'].includes(p.sku));
  const body = `
<section class="hero">
  ${picture(manifest, 'hero', 'Weavers finishing rattan chair frames in the Cirebon workshop', { sizes: '100vw', loading: 'eager', fetchpriority: 'high' })}
  <div class="wrap hero-inner">
    <span class="eyebrow" style="color:#D9C58E">Bogor, West Java · Export sourcing</span>
    <h1 style="margin-top:10px">Indonesian outdoor furniture and rattan craft, sourced and shipped for trade buyers.</h1>
    <p class="lede">We source from established workshops in Cirebon, Yogyakarta and Ngawi, inspect before loading, consolidate mixed containers and handle the export paperwork. You place one order and clear one container.</p>
    <div class="actions">
      <a class="btn btn-primary" href="/products/">Browse the catalog</a>
      <a class="btn btn-secondary" href="/how-to-order/">How ordering works</a>
    </div>
    <div class="hero-facts">
      <div><b>1999</b>Partner workshops producing since</div>
      <div><b>US · CA · UK · AU</b>Markets already supplied</div>
      <div><b>SVLK</b>V-Legal documented timber</div>
      <div><b>BSCI</b>amfori social audit member</div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head">
      <div><span class="eyebrow">What we do</span><h2 style="margin-top:8px">One contact between your buying team and the workshops</h2></div>
      <p>A retailer or designer in the United States cannot fill a container from one small workshop, inspect it in person or chase export documents across three provinces. That is the work we do.</p>
    </div>
    <div class="grid grid-4">
      <div class="service"><span class="icon">${icons.source}</span><h3>Sourcing</h3><p>Outdoor, indoor rattan, lighting and natural-fibre decor from workshops we have worked with directly, with one price list and one spec-sheet format.</p></div>
      <div class="service"><span class="icon">${icons.container}</span><h3>Mixed containers</h3><p>Combine loungers from Cirebon with wall decor from Yogyakarta in one 40HC. We plan the load, consolidate and stuff the container.</p></div>
      <div class="service"><span class="icon">${icons.check}</span><h3>Inspection before loading</h3><p>We check every batch at the workshop. Third-party inspection by SGS, QIMA, Intertek or your own agent is welcome.</p></div>
      <div class="service"><span class="icon">${icons.docs}</span><h3>Export documents</h3><p>Commercial invoice, packing list, bill of lading, certificate of origin, V-Legal document and fumigation certificate, prepared for your customs broker.</p></div>
    </div>
  </div>
</section>

<section class="section alt">
  <div class="wrap">
    <div class="section-head">
      <div><span class="eyebrow">Catalog</span><h2 style="margin-top:8px">Selected pieces</h2></div>
      <a class="btn btn-ghost" href="/products/">All products →</a>
    </div>
    <div class="products">${featured.map(p => productCard(p, { site, manifest, categories: catalog.categories })).join('')}</div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head"><div><span class="eyebrow">How it works</span><h2 style="margin-top:8px">From inquiry to a container on the water</h2></div></div>
    <div class="steps">
      <div class="step"><h3>Inquiry</h3><p>Send the pieces and quantities you are considering. We reply within one business day with availability, lead time and a proforma invoice.</p></div>
      <div class="step"><h3>Sample or visit</h3><p>Order samples, ask for production photos, or visit the workshops with us in Cirebon and Yogyakarta.</p></div>
      <div class="step"><h3>Production and inspection</h3><p>Deposit against the proforma; production typically 6–12 weeks. We inspect at the workshop and send photos before loading.</p></div>
      <div class="step"><h3>Loading and documents</h3><p>Container stuffed under supervision, balance paid, full document set sent to your customs broker. You clear the goods in your country.</p></div>
    </div>
  </div>
</section>

<section class="section alt">
  <div class="wrap">
    <div class="section-head">
      <div><span class="eyebrow">Where it is made</span><h2 style="margin-top:8px">Established workshops, not a trading desk</h2></div>
      <a class="btn btn-ghost" href="/workshops/">About the workshops →</a>
    </div>
    <div class="gallery">
      <figure>${picture(manifest, 'ws-weaving', 'Weavers working on rattan chair frames', { sizes: '(max-width:700px) 50vw, 33vw' })}<figcaption>Rattan seating, Plumbon, Cirebon</figcaption></figure>
      <figure>${picture(manifest, 'ws-teak-tops', 'Stacks of teak table tops in the joinery', { sizes: '(max-width:700px) 50vw, 33vw' })}<figcaption>Teak joinery, Ngawi</figcaption></figure>
      <figure>${picture(manifest, 'ws-wrapping', 'Finished chairs being wrapped in paper for export', { sizes: '(max-width:700px) 50vw, 33vw' })}<figcaption>Wrapping for export</figcaption></figure>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head"><div><span class="eyebrow">Compliance</span><h2 style="margin-top:8px">Documented timber, audited workshops</h2></div><p>Your customs broker will ask for wood species, legality documents and treated packaging. We supply them with every shipment.</p></div>
    <div class="creds">
      <div class="cred">${picture(manifest, 'v-legal', 'Indonesian Legal Wood V-Legal mark VLHH-32-07-10', { sizes: '64px' })}<div><b>Indonesian Legal Wood (SVLK)</b><span>V-Legal document with every wood shipment · VLHH-32-07-10</span></div></div>
      <div class="cred">${picture(manifest, 'bsci', 'amfori BSCI', { sizes: '64px' })}<div><b>amfori BSCI</b><span>Social audit membership, ID 360-000323-000</span></div></div>
      <div class="cred"><span class="mark">${icons.check}</span><div><b>Lacey Act ready</b><span>Species by scientific name on every spec sheet; ISPM-15 stamped pallets and crates</span></div></div>
    </div>
  </div>
</section>

<section class="section deep">
  <div class="wrap" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:20px">
    <div><h2>Planning a container for next season?</h2><p style="margin-top:8px;max-width:56ch">Tell us what you are looking at and where it is going. We will come back with lead times, a load plan and a proforma.</p></div>
    <a class="btn btn-primary" href="/contact/">Request a quote</a>
  </div>
</section>`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'Organization', name: site.brand, url: site.url,
    address: { '@type': 'PostalAddress', addressLocality: 'Bogor', addressRegion: 'West Java', addressCountry: 'ID' },
    sameAs: [site.contact.instagram], description: site.tagline,
  };
  return layout({ site, manifest, title: 'Home', description: `${site.brand}: Indonesian outdoor furniture, rattan lighting and natural-fibre decor sourced from established workshops and shipped FOB to trade buyers in the US, Canada, UK and Australia.`, path: '/', body, extraHead: `<script type="application/ld+json">${JSON.stringify(ld)}</script>` });
}

function catalogPage({ site, manifest, catalog }) {
  const cats = catalog.categories;
  const body = `
<section class="section-tight">
  <div class="wrap">
    <span class="eyebrow">Catalog</span>
    <h1 style="margin-top:8px;font-size:clamp(30px,4vw,44px)">Products</h1>
    <p class="measure muted" style="margin-top:10px">Outdoor pieces are listed with dimensions, volume and pieces per 40HC container from the workshop's current price list. Add items to build a load plan; we quote ${esc(site.commerce.priceBasis)}.</p>
  </div>
</section>
<section class="section-tight">
  <div class="wrap catalog-layout">
    <div>
      <div class="filters" role="group" aria-label="Filter by category">
        <button class="chip" type="button" data-filter="all" aria-pressed="true">All</button>
        ${cats.map(c => `<button class="chip" type="button" data-filter="${c.slug}" aria-pressed="false">${esc(c.short)}</button>`).join('')}
      </div>
      ${cats.map(c => {
        const items = catalog.products.filter(p => p.category === c.slug);
        return `<section class="cat" id="${c.slug}" data-category-section="${c.slug}" style="margin-bottom:44px">
          <div class="section-head" style="margin-bottom:16px"><div><h2 style="font-size:24px">${esc(c.name)}</h2></div><p style="font-size:15px">${esc(c.blurb)}</p></div>
          ${items.length ? `<div class="products">${items.map(p => productCard(p, { site, manifest, categories: cats })).join('')}</div>` : `<p class="muted">Specification sheets available on request.</p>`}
          ${c.comingSoon ? `<p class="note">Full indoor range (${c.slug === 'indoor-rattan' ? '114 designs across chairs, sofas and tables' : ''}) is being photographed. Ask for the current price list.</p>` : ''}
        </section>`;
      }).join('')}
    </div>
    <aside class="panel" aria-labelledby="quote-title" data-quote-panel>
      <h3 id="quote-title">Your load plan</h3>
      <p class="hint">Quantities are estimates for planning. Final loading is confirmed on the proforma.</p>
      <ul class="quote-items" data-quote-list></ul>
      <p class="empty" data-quote-empty>No items yet. Use “Add to quote” on any product.</p>
      <div class="total-cbm"><span>Total volume</span><b data-total-cbm>0.000 m³</b></div>
      <div class="fill" data-fill>
        <div class="row"><span>20 ft</span><div class="bar"><i data-bar="cbm20"></i></div><span class="pct" data-pct="cbm20">0%</span></div>
        <div class="row"><span>40 ft</span><div class="bar"><i data-bar="cbm40"></i></div><span class="pct" data-pct="cbm40">0%</span></div>
        <div class="row"><span>40 HC</span><div class="bar"><i data-bar="cbm40hc"></i></div><span class="pct" data-pct="cbm40hc">0%</span></div>
      </div>
      <a class="btn btn-primary" href="/contact/">Request a quote for this load</a>
    </aside>
  </div>
</section>`;
  return layout({ site, manifest, title: 'Products', description: 'Outdoor sun loungers, daybeds and egg chairs, indoor rattan, rattan lighting and wall decor from Indonesian workshops, with dimensions, volume and container loadability.', path: '/products/', body });
}

function productPage(p, { site, manifest, catalog }) {
  const cat = catalog.categories.find(c => c.slug === p.category);
  const ws = catalog.workshops.find(w => w.slug === p.workshop);
  const isThumb = /^ld-/.test(p.image || '');
  const rows = [
    ['Frame', p.frame], ['Weave / material', p.weave], ['Finish', p.finish], ['Cushion', p.cushion], ['Colour', p.colour],
    ['Dimensions (W × D × H)', fmtDims(p) ? `<span class="mono">${fmtDims(p)}</span><br><span class="mono muted">${fmtDimsIn(p)}</span>` : null],
    ['Volume', p.cbm ? `<span class="mono">${p.cbm.toFixed(3)} m³</span>` : null],
    ['Pieces per 40HC', p.per40hc ? `<span class="mono">${p.per40hc}</span> <span class="muted">(workshop estimate)</span>` : null],
    ['Packaging', p.packaging], ['Made in', ws ? `${ws.name}, ${ws.region}` : 'Indonesia'],
  ].filter(r => r[1]);
  const price = site.commerce.showPrices && p.price ? `<p class="price" style="font-size:24px;margin-top:12px">${money(p.price)} <span class="price-note">${esc(site.commerce.priceBasis)}</span></p>` : `<p class="muted" style="margin-top:12px">Price on request — quoted ${esc(site.commerce.priceBasis)}.</p>`;
  const body = `
<section class="section-tight">
  <div class="wrap">
    <p class="muted" style="font-size:14px"><a href="/products/">Products</a> / <a href="/products/#${cat.slug}">${esc(cat.name)}</a></p>
    <div class="product" style="margin-top:18px">
      <div class="media${isThumb ? ' thumb' : ''}">${p.image ? picture(manifest, p.image.replace(/\.jpg$/, ''), p.name, { sizes: '(max-width:860px) 100vw, 55vw', loading: 'eager' }) : '<div class="placeholder">Photo to come</div>'}</div>
      <div>
        <span class="sku mono muted">${esc(p.sku)}</span>
        <h1 style="font-size:clamp(28px,3.6vw,40px);margin-top:6px">${esc(p.name)}</h1>
        <p class="muted" style="margin-top:8px">${esc(cat.name)}${ws ? ` · ${esc(ws.name)}` : ''}</p>
        ${price}
        <table class="specs"><tbody>${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</tbody></table>
        ${p.notes ? `<p class="note">${esc(p.notes)}</p>` : ''}
        ${isThumb ? `<p class="note">Image is the workshop's price-list photo. High-resolution photography is being prepared; ask for current production photos.</p>` : ''}
        <div class="qty-row">
          <label for="qty" style="margin:0">Quantity</label>
          <input id="qty" type="number" min="1" step="1" value="${p.per40hc && p.per40hc < 40 ? p.per40hc : 10}" inputmode="numeric">
          <button class="btn btn-primary" type="button" data-add="${esc(p.sku)}" data-qty-from="qty">Add to quote</button>
          <a class="btn btn-ghost" href="/contact/">Go to request →</a>
        </div>
        ${p.cbm ? `<p class="form-note" style="margin-top:10px">Full 40HC of this item ≈ ${p.per40hc} pieces (${(p.cbm * p.per40hc).toFixed(1)} m³).</p>` : ''}
      </div>
    </div>
  </div>
</section>`;
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.sku, brand: { '@type': 'Brand', name: site.brand }, material: [p.frame, p.weave].filter(Boolean).join('; '), image: p.image ? `${site.url}/images/${p.image}` : undefined };
  return layout({ site, manifest, title: p.name, description: `${p.name} (${p.sku}) — ${[p.frame, p.weave].filter(Boolean).join(', ')}. ${fmtDims(p) ? fmtDims(p) + ', ' + p.cbm.toFixed(3) + ' m³, ' + p.per40hc + ' per 40HC.' : cat.name + '.'} Quoted ${site.commerce.priceBasis}.`, path: `/products/${p.sku.toLowerCase()}/`, body, extraHead: `<script type="application/ld+json">${JSON.stringify(ld)}</script>` });
}

function howToOrder({ site, manifest }) {
  const c = site.commerce;
  const tbc = s => /to be confirmed/i.test(s) ? `${esc(s.replace(/\s*—\s*to be confirmed/i, ''))} <span class="tbc">(to be confirmed)</span>` : esc(s);
  const body = `
<section class="section-tight"><div class="wrap">
  <span class="eyebrow">Buying</span>
  <h1 style="margin-top:8px;font-size:clamp(30px,4vw,44px)">How to order</h1>
  <div class="prose" style="margin-top:20px">
    <p>We sell to businesses: retailers, interior designers, hospitality and project buyers, and importers. Goods are sold ${esc(c.priceBasis)}; you or your freight forwarder arrange ocean freight and customs clearance in your country, and we prepare the documents your broker needs.</p>

    <h2 id="terms">Terms at a glance</h2>
    <table>
      <tr><th>Price basis</th><td>${tbc(c.priceBasis)}</td></tr>
      <tr><th>Currency</th><td>${esc(c.currency)}</td></tr>
      <tr><th>Minimum order</th><td>${tbc(c.moq)}</td></tr>
      <tr><th>Payment</th><td>${tbc(c.paymentTerms)}</td></tr>
      <tr><th>Lead time</th><td>${tbc(c.leadTime)}</td></tr>
      <tr><th>Markets served</th><td>${site.markets.map(esc).join(', ')}</td></tr>
    </table>

    <h2>Step by step</h2>
    <ol>
      <li><strong>Inquiry.</strong> Use the <a href="/products/">catalog</a> to build a load plan, or email a list of pieces and quantities. We confirm availability, lead time and a proforma invoice within one business day.</li>
      <li><strong>Samples and production photos.</strong> Samples can be made and couriered; sample cost is credited against a container order. Workshop visits in Cirebon and Yogyakarta can be arranged.</li>
      <li><strong>Deposit and production.</strong> Production starts on receipt of the deposit against the proforma. We send progress photos and confirm the loading date.</li>
      <li><strong>Inspection.</strong> Every batch is checked at the workshop before wrapping. Third-party inspection (SGS, QIMA, Intertek) or your own agent is welcome; book it for the week before loading.</li>
      <li><strong>Loading and documents.</strong> The container is stuffed under supervision with loading photos. On receipt of the balance, the full document set is released to your customs broker.</li>
    </ol>

    <h2 id="documents">Export documents supplied</h2>
    <ul>
      <li>Commercial invoice with HS code and material per line</li>
      <li>Packing list with carton dimensions, volume and gross weight</li>
      <li>Bill of lading</li>
      <li>Certificate of origin</li>
      <li>V-Legal document (SVLK) for wood and rattan furniture</li>
      <li>Fumigation certificate and ISPM-15 treated pallets and crates</li>
      <li>Wood and rattan species by scientific name, for the buyer's Lacey Act declaration (United States)</li>
    </ul>
    <div class="callout">The buyer is the importer of record. Import duties, taxes and clearance in the destination country are the buyer's responsibility; your freight forwarder or customs broker can quote these from the documents above.</div>

    <h2 id="packing">Packing and loading</h2>
    <p>Rattan and aluminium pieces are wrapped in kraft paper with corner protection and stacked to the container profile; cushions travel in polybags inside cartons. Crated and palletised items use ISPM-15 heat-treated timber. Mixed containers from more than one workshop are consolidated and loaded at one point.</p>
    <div class="gallery" style="margin-top:14px">
      <figure>${picture(manifest, 'ws-wrapping', 'Chairs being wrapped in kraft paper', { sizes: '(max-width:700px) 50vw, 33vw' })}<figcaption>Wrapping at the workshop</figcaption></figure>
      <figure class="tall">${picture(manifest, 'ws-packed', 'Wrapped chairs stacked ready for loading', { sizes: '(max-width:700px) 50vw, 33vw' })}<figcaption>Stacked for loading</figcaption></figure>
      <figure>${picture(manifest, 'ws-packed-2', 'Wrapped seating stacked in the warehouse', { sizes: '(max-width:700px) 50vw, 33vw' })}<figcaption>Ready for the container</figcaption></figure>
    </div>

    <h2>Claims</h2>
    <p>Report transit damage with photos within 7 days of container devanning; we work with you and the carrier on the claim and replace or credit manufacturing defects on the next shipment. <span class="tbc">Claim terms to be confirmed.</span></p>
  </div>
</div></section>`;
  return layout({ site, manifest, title: 'How to order', description: 'Terms, ordering steps, export documents and packing standards for buying Indonesian furniture FOB through Buitenzorg Lemongrass Homecraft.', path: '/how-to-order/', body });
}

function workshops({ site, manifest, catalog }) {
  const body = `
<section class="section-tight"><div class="wrap">
  <span class="eyebrow">About</span>
  <h1 style="margin-top:8px;font-size:clamp(30px,4vw,44px)">The workshops behind the catalog</h1>
  <div class="prose" style="margin-top:20px">
    <p>${esc(site.brand)} is an export sourcing business in Bogor, West Java. We work directly with a small number of established Indonesian workshops, put their products into one catalog with one specification format, and manage inspection, consolidation and export for overseas trade buyers.</p>
    <p>Our principal manufacturing partner is the Lemongrass Homecraft group, producing natural-material furniture and craft since 1999 and exporting to the United States, United Kingdom, Canada and Australia. Their export entity holds Indonesian Legal Wood (SVLK) certification and amfori BSCI membership.</p>
  </div>
</div></section>
<section class="section-tight"><div class="wrap">
  <div class="gallery">
    <figure>${picture(manifest, 'ws-weaving', 'Weavers finishing rattan chair frames', { sizes: '(max-width:700px) 50vw, 33vw' })}<figcaption>Natural rattan seating, Plumbon, Cirebon</figcaption></figure>
    <figure class="tall">${picture(manifest, 'ws-assembly', 'Craftsman assembling a rattan chair frame', { sizes: '(max-width:700px) 50vw, 33vw' })}<figcaption>Frame assembly</figcaption></figure>
    <figure class="tall">${picture(manifest, 'ws-qc-papasan', 'Checking papasan chair frames before finishing', { sizes: '(max-width:700px) 50vw, 33vw' })}<figcaption>Checking papasan frames</figcaption></figure>
    <figure>${picture(manifest, 'ws-teak-tops', 'Stacks of round teak table tops in the joinery yard', { sizes: '(max-width:700px) 50vw, 33vw' })}<figcaption>Teak table tops, Ngawi</figcaption></figure>
    <figure class="tall">${picture(manifest, 'ws-lamp-frames', 'Rattan lamp shade frames in progress', { sizes: '(max-width:700px) 50vw, 33vw' })}<figcaption>Lamp shades, Yogyakarta</figcaption></figure>
    <figure>${picture(manifest, 'ws-wrapping', 'Chairs wrapped in paper for export', { sizes: '(max-width:700px) 50vw, 33vw' })}<figcaption>Wrapped for export</figcaption></figure>
  </div>
</div></section>
<section class="section"><div class="wrap">
  <div class="grid grid-3">
    ${catalog.workshops.map(w => `<div class="service"><span class="icon">${icons.visit}</span><h3>${esc(w.name)}</h3><p>${esc(w.region)}<br>${esc(w.makes)}</p></div>`).join('')}
  </div>
  <div class="prose" style="margin-top:36px">
    <h2>Visiting</h2>
    <p>Buyers are welcome at the workshops. Cirebon is three hours from Jakarta by train; Yogyakarta is an hour's flight. Tell us your dates and we will arrange the visits and a driver. <a href="/contact/">Contact us</a>.</p>
  </div>
</div></section>`;
  return layout({ site, manifest, title: 'Workshops', description: 'The Indonesian workshops in Cirebon, Yogyakarta and Ngawi behind the Buitenzorg Lemongrass Homecraft catalog, and how to visit them.', path: '/workshops/', body });
}

function contact({ site, manifest }) {
  const body = `
<section class="section-tight"><div class="wrap">
  <span class="eyebrow">Contact</span>
  <h1 style="margin-top:8px;font-size:clamp(30px,4vw,44px)">Request a quote</h1>
  <p class="measure muted" style="margin-top:10px">Tell us what you are looking at, roughly how many, and where it ships to. Items you added from the catalog are attached below. We reply within one business day (Western Indonesia time, UTC+7).</p>
  <div class="grid grid-2" style="margin-top:28px;align-items:start">
    <form class="form" data-inquiry novalidate>
      <div class="two">
        <div><label for="f-name">Your name</label><input id="f-name" name="name" type="text" autocomplete="name" required></div>
        <div><label for="f-company">Company</label><input id="f-company" name="company" type="text" autocomplete="organization" required></div>
      </div>
      <div class="two">
        <div><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
        <div><label for="f-country">Destination country / port</label><input id="f-country" name="country" type="text" placeholder="e.g. United States — Los Angeles" required></div>
      </div>
      <div>
        <label for="f-type">You are</label>
        <select id="f-type" name="buyerType">
          <option>Retailer</option><option>Interior designer / architect</option><option>Hospitality or project buyer</option><option>Importer / distributor</option><option>Other</option>
        </select>
      </div>
      <div>
        <label for="f-items">Items and quantities</label>
        <textarea id="f-items" name="items" placeholder="Added from the catalog automatically, or type your own list"></textarea>
      </div>
      <div>
        <label for="f-message">Anything else</label>
        <textarea id="f-message" name="message" style="min-height:100px" placeholder="Target ship date, custom colours or sizes, sample needs, forwarder details"></textarea>
      </div>
      <div class="hp" aria-hidden="true"><label for="f-web">Website</label><input id="f-web" name="website" type="text" tabindex="-1" autocomplete="off"></div>
      <div><button class="btn btn-primary" type="submit">Send request</button></div>
      <p class="form-note">By sending, you agree to our <a href="/privacy/">privacy policy</a>. We use your details only to answer this request.</p>
      <div class="status" role="status" aria-live="polite" data-status></div>
    </form>
    <aside>
      <div class="panel" style="position:static">
        <h3>Or reach us directly</h3>
        <ul style="list-style:none;padding:0;margin:12px 0 0;display:flex;flex-direction:column;gap:10px;font-size:15px">
          <li>Email: ${site.contact.emailConfirmed ? `<a href="mailto:${esc(site.contact.email)}">${esc(site.contact.email)}</a>` : '<span class="tbc">to be confirmed</span>'}</li>
          <li>WhatsApp: <a href="https://wa.me/${site.contact.whatsapp.replace(/\D/g, '')}" rel="noopener">${esc(site.contact.whatsapp)}</a></li>
          <li>Instagram: <a href="${esc(site.contact.instagram)}" rel="noopener">${esc(site.contact.instagramHandle)}</a></li>
          <li style="margin-top:6px" class="muted">${site.address.lines.map(esc).join('<br>')}</li>
        </ul>
      </div>
      <div class="panel" style="position:static;margin-top:16px">
        <h3>Your load plan</h3>
        <ul class="quote-items" data-quote-list></ul>
        <p class="empty" data-quote-empty>Nothing added yet. <a href="/products/">Browse products</a>.</p>
        <div class="total-cbm"><span>Total volume</span><b data-total-cbm>0.000 m³</b></div>
        <div class="fill" data-fill>
          <div class="row"><span>20 ft</span><div class="bar"><i data-bar="cbm20"></i></div><span class="pct" data-pct="cbm20">0%</span></div>
          <div class="row"><span>40 ft</span><div class="bar"><i data-bar="cbm40"></i></div><span class="pct" data-pct="cbm40">0%</span></div>
          <div class="row"><span>40 HC</span><div class="bar"><i data-bar="cbm40hc"></i></div><span class="pct" data-pct="cbm40hc">0%</span></div>
        </div>
      </div>
    </aside>
  </div>
</div></section>`;
  return layout({ site, manifest, title: 'Request a quote', description: 'Request a quote or load plan for Indonesian outdoor furniture, rattan lighting and decor from Buitenzorg Lemongrass Homecraft.', path: '/contact/', body });
}

function privacy({ site, manifest }) {
  const body = `<section class="section-tight"><div class="wrap prose">
  <h1 style="font-size:clamp(28px,3.6vw,40px)">Privacy policy</h1>
  <p class="muted">Last updated ${new Date().toISOString().slice(0, 10)}</p>
  <h2>Who we are</h2><p>${esc(site.brand)}${site.legalEntity ? ` (${esc(site.legalEntity)})` : ''}, ${site.address.lines.map(esc).join(', ')}.</p>
  <h2>What we collect</h2><p>When you send an inquiry we receive the details you type: name, company, email, destination and the items you are interested in. Our web host records standard server logs (IP address, browser, pages requested) for security and reliability.</p>
  <h2>Analytics</h2><p>${site.analytics.ga4 ? 'We use Google Analytics 4 to understand how the site is used. It sets cookies; you can decline them in the banner or block them in your browser.' : 'This site does not currently run analytics cookies. If that changes, this policy and a consent banner will be updated first.'}</p>
  <h2>How we use it</h2><p>To answer your inquiry, prepare quotations and ship orders. We do not sell or share your details with third parties other than freight forwarders, inspection agencies and banks involved in fulfilling an order you place.</p>
  <h2>Retention and your rights</h2><p>Inquiry details are kept for as long as needed to respond and for a reasonable period afterwards for follow-up, then deleted. You can ask us to correct or delete your information by emailing us.</p>
  <h2>Contact</h2><p>${site.contact.emailConfirmed ? esc(site.contact.email) : 'Contact details to be confirmed'} · WhatsApp ${esc(site.contact.whatsapp)}</p>
</div></section>`;
  return layout({ site, manifest, title: 'Privacy policy', description: `Privacy policy for ${site.brand}.`, path: '/privacy/', body });
}

function terms({ site, manifest }) {
  const c = site.commerce;
  const body = `<section class="section-tight"><div class="wrap prose">
  <h1 style="font-size:clamp(28px,3.6vw,40px)">Terms of sale</h1>
  <p class="muted">Draft — commercial terms marked <span class="tbc">(to be confirmed)</span> are placeholders pending confirmation by ${esc(site.brand)}.</p>
  <h2>Parties and scope</h2><p>These terms apply to sales of goods by ${esc(site.brand)}${site.legalEntity ? ` (${esc(site.legalEntity)}, Indonesia)` : ''} (“Seller”) to business buyers (“Buyer”). Sales are to businesses only; consumer-protection rules for retail purchases do not apply.</p>
  <h2>Quotations and orders</h2><p>Quotations are valid for 30 days <span class="tbc">(to be confirmed)</span> and are subject to material and exchange-rate movements after that. An order is confirmed when the Buyer accepts a proforma invoice and the deposit is received.</p>
  <h2>Prices and delivery terms</h2><p>Prices are in ${esc(c.currency)} and quoted ${esc(c.priceBasis)} under Incoterms® 2020. Risk passes to the Buyer when the goods are loaded on board the vessel at the named port. Ocean freight, insurance, import duties, taxes and customs clearance in the destination country are the Buyer's responsibility.</p>
  <h2>Payment</h2><p>${esc(c.paymentTerms)}. Goods and documents are released on receipt of cleared funds. Bank charges outside Indonesia are for the Buyer's account.</p>
  <h2>Lead time</h2><p>${esc(c.leadTime)}. Dates are estimates; the Seller will notify the Buyer of any material delay.</p>
  <h2>Quality and inspection</h2><p>Goods are handmade from natural materials; variation in colour, grain and weave is normal and not a defect. The Buyer may inspect or appoint an inspection agency before loading at the Buyer's cost. Claims for manufacturing defects must be notified with photographs within 7 days of devanning <span class="tbc">(to be confirmed)</span>; the Seller's liability is limited to replacement or credit of the affected pieces.</p>
  <h2>Compliance documents</h2><p>The Seller supplies commercial invoice, packing list, bill of lading, certificate of origin, V-Legal document where applicable, fumigation certificate and material/species information. Regulatory compliance in the destination country is the Buyer's responsibility.</p>
  <h2>Intellectual property</h2><p>Designs and photographs in the catalog belong to the Seller or its manufacturing partners. Buyer-supplied designs remain the Buyer's; the Buyer warrants it has the right to have them produced.</p>
  <h2>Law</h2><p>These terms are governed by the laws of the Republic of Indonesia. Disputes will first be addressed by negotiation in good faith.</p>
</div></section>`;
  return layout({ site, manifest, title: 'Terms of sale', description: `Terms of sale for ${site.brand}.`, path: '/terms/', body });
}

function notFound({ site, manifest }) {
  const body = `<section class="section"><div class="wrap prose"><h1>Page not found</h1><p style="margin-top:10px">The page may have moved. Try the <a href="/products/">catalog</a> or <a href="/">home</a>.</p></div></section>`;
  return layout({ site, manifest, title: 'Not found', description: 'Page not found', path: '/404.html', body });
}

module.exports = { home, catalogPage, productPage, howToOrder, workshops, contact, privacy, terms, notFound };
