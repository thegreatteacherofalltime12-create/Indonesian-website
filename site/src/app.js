/* ArgaMatt_Buitenzorg furniture — client script: nav toggle, quote list (load plan), container fill, inquiry form. */
(function () {
  'use strict';
  var KEY = 'blh_quote_v1';
  var products = null; // loaded from /products.json on demand
  var caps = { cbm20: 26, cbm40: 53, cbm40hc: 60 };

  function readQuote() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } }
  function writeQuote(q) { try { localStorage.setItem(KEY, JSON.stringify(q)); } catch (e) { /* private mode: keep in memory only */ } memQuote = q; }
  var memQuote = readQuote();
  function quote() { return memQuote; }

  function loadProducts() {
    if (products) return Promise.resolve(products);
    return fetch('/products.json').then(function (r) { return r.json(); }).then(function (d) {
      products = {}; d.products.forEach(function (p) { products[p.sku] = p; });
      if (d.container) caps = d.container;
      return products;
    }).catch(function () { products = {}; return products; });
  }

  function count() { var q = quote(); return Object.keys(q).reduce(function (n, k) { return n + (q[k] > 0 ? 1 : 0); }, 0); }
  function updateCount() {
    document.querySelectorAll('[data-quote-count]').forEach(function (el) { var n = count(); el.textContent = n; el.setAttribute('data-n', n); });
  }

  function add(sku, qty) {
    var q = quote(); qty = Math.max(1, Math.round(qty || 1));
    q[sku] = (q[sku] || 0) + qty; writeQuote(q); updateCount(); renderPanels();
  }
  function setQty(sku, qty) { var q = quote(); if (qty > 0) q[sku] = qty; else delete q[sku]; writeQuote(q); updateCount(); renderPanels(); }

  function fmt(n, d) { return Number(n).toFixed(d == null ? 3 : d); }

  function renderPanels() {
    var lists = document.querySelectorAll('[data-quote-list]');
    if (!lists.length && !document.querySelector('[data-plan-bar]')) return;
    loadProducts().then(function (P) {
      var q = quote(); var skus = Object.keys(q).filter(function (s) { return q[s] > 0; });
      var total = 0, unknown = 0;
      function vol(p, qty) { if (p && p.per40hc) return qty * (caps.cbm40hc / p.per40hc); if (p && p.cbm) return qty * p.cbm; return 0; }
      skus.forEach(function (s) { var p = P[s]; if (p && (p.per40hc || p.cbm)) total += vol(p, q[s]); else unknown++; });
      lists.forEach(function (list) {
        list.innerHTML = skus.map(function (s) {
          var p = P[s] || { name: s, sku: s };
          return '<li><span><span class="sku">' + esc(p.sku) + '</span><br>' + esc(p.name) + ((p.per40hc || p.cbm) ? '<br><span class="sku">' + fmt(vol(p, q[s]), 1) + ' m³ nested</span>' : '') + '</span>' +
            '<input type="number" min="0" step="1" value="' + q[s] + '" aria-label="Quantity of ' + esc(p.name) + '" data-qty="' + esc(s) + '">' +
            '<button type="button" aria-label="Remove ' + esc(p.name) + '" data-remove="' + esc(s) + '">×</button></li>';
        }).join('');
      });
      document.querySelectorAll('[data-quote-empty]').forEach(function (el) { el.style.display = skus.length ? 'none' : ''; });
      document.querySelectorAll('[data-total-cbm]').forEach(function (el) { el.textContent = fmt(total, 1) + ' m³' + (unknown ? ' + ' + unknown + ' item' + (unknown > 1 ? 's' : '') + ' on request' : ''); });
      Object.keys(caps).forEach(function (k) {
        var pct = caps[k] ? total / caps[k] * 100 : 0;
        document.querySelectorAll('[data-bar="' + k + '"]').forEach(function (b) { b.style.width = Math.min(100, pct) + '%'; b.classList.toggle('over', pct > 103); b.classList.toggle('full', pct >= 97 && pct <= 103); });
        document.querySelectorAll('[data-pct="' + k + '"]').forEach(function (b) { b.textContent = Math.round(pct) + '%'; });
      });
      var n40 = Math.round(total / caps.cbm40hc * 100);
      var summary = skus.length ? skus.length + ' item' + (skus.length > 1 ? 's' : '') + ' · ' + fmt(total, 1) + ' m³ · ' + n40 + '% of a 40HC' : '';
      document.querySelectorAll('[data-plan-announce]').forEach(function (el) { el.textContent = summary ? 'Load plan: ' + summary : 'Load plan is empty'; });
      var bar = document.querySelector('[data-plan-bar]');
      if (bar) { bar.hidden = !skus.length; document.body.classList.toggle('has-plan-bar', !!skus.length); var sm = bar.querySelector('[data-plan-summary]'); if (sm) sm.textContent = summary; }
      var ta = document.getElementById('f-items');
      if (ta && !ta.dataset.userEdited) {
        ta.value = skus.map(function (s) { var p = P[s] || { name: s }; return (P[s] ? p.sku + ' — ' : '') + p.name + ' × ' + q[s]; }).join('\n') + (total ? '\n\nEstimated load ' + fmt(total, 1) + ' m³ nested (' + n40 + '% of a 40HC)' : '');
      }
    });
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-add]');
    if (t) {
      var qty = 1; var from = t.getAttribute('data-qty-from');
      if (from) { var inp = document.getElementById(from); if (inp) qty = parseInt(inp.value, 10) || 1; }
      add(t.getAttribute('data-add'), qty);
      var old = t.textContent; t.textContent = 'Added ✓'; t.disabled = true;
      setTimeout(function () { t.textContent = old; t.disabled = false; }, 1200);
      return;
    }
    var r = e.target.closest('[data-remove]');
    if (r) { setQty(r.getAttribute('data-remove'), 0); return; }
    var f = e.target.closest('[data-filter]');
    if (f) {
      var val = f.getAttribute('data-filter');
      document.querySelectorAll('[data-filter]').forEach(function (c) { c.setAttribute('aria-pressed', c === f ? 'true' : 'false'); });
      document.querySelectorAll('[data-category-section]').forEach(function (s) { s.hidden = !(val === 'all' || s.getAttribute('data-category-section') === val); });
      return;
    }
    var nt = e.target.closest('.nav-toggle');
    if (nt) { var links = document.getElementById('nav-links'); var open = links.classList.toggle('open'); nt.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  });
  document.addEventListener('change', function (e) {
    var i = e.target.closest('[data-qty]');
    if (i) setQty(i.getAttribute('data-qty'), parseInt(i.value, 10) || 0);
  });
  var itemsTa = document.getElementById('f-items');
  if (itemsTa) itemsTa.addEventListener('input', function () { itemsTa.dataset.userEdited = '1'; });

  // Inquiry form
  var form = document.querySelector('[data-inquiry]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('[data-status]');
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      var problems = [];
      form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
      form.querySelectorAll('.field-error').forEach(function (el) { el.remove(); });
      function bad(id, msg) { var el = document.getElementById(id); if (!el) return; el.setAttribute('aria-invalid', 'true'); var p = document.createElement('p'); p.className = 'field-error'; p.id = id + '-error'; p.textContent = msg; el.insertAdjacentElement('afterend', p); el.setAttribute('aria-describedby', p.id); problems.push(el); }
      if (!String(data.name || '').trim()) bad('f-name', 'Please enter your name.');
      if (!String(data.company || '').trim()) bad('f-company', 'Please enter your company.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email || '').trim())) bad('f-email', 'Please enter a valid email address.');
      if (!String(data.country || '').trim()) bad('f-country', 'Please tell us the destination country or port.');
      if (problems.length) { status.className = 'status err'; status.textContent = 'Please check the highlighted field' + (problems.length > 1 ? 's' : '') + '.'; problems[0].focus(); return; }
      if (data.website) { status.className = 'status ok'; status.textContent = 'Thanks — received.'; return; } // honeypot
      var q = quote(); data.quote = Object.keys(q).map(function (s) { return { sku: s, qty: q[s] }; });
      data.page = location.href;
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true;
      fetch('/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, j: j }; }); })
        .then(function (res) {
          if (res.ok && res.j.delivered) { status.className = 'status ok'; status.textContent = 'Thank you — your request has been sent. We reply within one business day.'; form.reset(); writeQuote({}); updateCount(); renderPanels(); }
          else if (res.ok) { status.className = 'status ok'; status.textContent = 'Received. This is a preview build: email delivery is not connected yet, so please also send your request by WhatsApp or email for now.'; }
          else { var e = new Error(res.j.error || 'failed'); e.client = res.status >= 400 && res.status < 500; throw e; }
        })
        .catch(function (err) {
          status.className = 'status err';
          status.textContent = err && err.client ? ({ 'Invalid email': 'Please check your email address.', 'Missing required fields': 'Please fill in every required field.' }[err.message] || err.message) : 'Could not send just now. Please try again or contact us on WhatsApp.';
        })
        .then(function () { btn.disabled = false; });
    });
  }

  updateCount();
  renderPanels();
  // Deep link hash → filter chip (also on same-document hash changes)
  function applyHash() {
    if (location.pathname.indexOf('/products') !== 0) return;
    var chip = document.querySelector('[data-filter="' + (location.hash ? location.hash.slice(1) : 'all') + '"]');
    if (chip) { chip.click(); var sec = location.hash && document.getElementById(location.hash.slice(1)); if (sec) sec.scrollIntoView(); }
  }
  applyHash();
  window.addEventListener('hashchange', applyHash);
})();
