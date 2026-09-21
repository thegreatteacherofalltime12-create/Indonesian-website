/* ArgaMatt_Buitenzorg furniture — client script: nav toggle, quote list (load plan), container fill, inquiry form. */
(function () {
  'use strict';
  var KEY = 'blh_quote_v1';
  var LANG = (document.documentElement.lang || 'en').slice(0, 2) === 'id' ? 'id' : 'en';
  var BASE = document.body.getAttribute('data-base') || '';
  var STR = {
    en: { added: 'Added ✓', nested: 'm³ nested', onRequest: function (n) { return ' + ' + n + ' item' + (n > 1 ? 's' : '') + ' on request'; }, summary: function (n, v, p) { return n + ' item' + (n > 1 ? 's' : '') + ' · ' + v + ' m³ · ' + p + '% of a 40HC'; }, planPrefix: 'Load plan: ', planEmpty: 'Load plan is empty', estLoad: function (v, p) { return 'Estimated load ' + v + ' m³ nested (' + p + '% of a 40HC)'; }, qtyOf: 'Quantity of ', remove: 'Remove ', errName: 'Please enter your name.', errCompany: 'Please enter your company.', errEmail: 'Please enter a valid email address.', errCountry: 'Please tell us the destination country or port.', errCheck: function (n) { return 'Please check the highlighted field' + (n > 1 ? 's' : '') + '.'; }, sent: 'Thank you — your request has been sent. We reply within one business day.', preview: 'Received. This is a preview build: email delivery is not connected yet, so please also send your request by WhatsApp or email for now.', failed: 'Could not send just now. Please try again or contact us on WhatsApp.', cancelled: 'Form and load plan cleared.', serverErrors: { 'Invalid email': 'Please check your email address.', 'Missing required fields': 'Please fill in every required field.' } },
    id: { added: 'Ditambahkan ✓', nested: 'm³ bersarang', onRequest: function (n) { return ' + ' + n + ' produk berdasarkan permintaan'; }, summary: function (n, v, p) { return n + ' produk · ' + v + ' m³ · ' + p + '% dari 40HC'; }, planPrefix: 'Rencana muatan: ', planEmpty: 'Rencana muatan kosong', estLoad: function (v, p) { return 'Perkiraan muatan ' + v + ' m³ bersarang (' + p + '% dari 40HC)'; }, qtyOf: 'Jumlah ', remove: 'Hapus ', errName: 'Masukkan nama Anda.', errCompany: 'Masukkan nama perusahaan.', errEmail: 'Masukkan alamat email yang valid.', errCountry: 'Sebutkan negara atau pelabuhan tujuan.', errCheck: function (n) { return 'Periksa kolom yang ditandai.'; }, sent: 'Terima kasih — permintaan Anda sudah terkirim. Kami membalas dalam satu hari kerja.', preview: 'Diterima. Ini versi pratinjau: pengiriman email belum terhubung, jadi untuk sementara kirim juga permintaan Anda lewat WhatsApp atau email.', failed: 'Tidak bisa mengirim saat ini. Coba lagi atau hubungi kami lewat WhatsApp.', cancelled: 'Formulir dan rencana muatan dikosongkan.', serverErrors: { 'Invalid email': 'Periksa alamat email Anda.', 'Missing required fields': 'Isi semua kolom wajib.' } }
  }[LANG];
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
          return '<li><span><span class="sku">' + esc(p.sku) + '</span><br>' + esc(p.name) + ((p.per40hc || p.cbm) ? '<br><span class="sku">' + fmt(vol(p, q[s]), 1) + ' ' + STR.nested + '</span>' : '') + '</span>' +
            '<input type="number" min="0" step="1" value="' + q[s] + '" aria-label="' + STR.qtyOf + esc(p.name) + '" data-qty="' + esc(s) + '">' +
            '<button type="button" aria-label="' + STR.remove + esc(p.name) + '" data-remove="' + esc(s) + '">×</button></li>';
        }).join('');
      });
      document.querySelectorAll('[data-quote-empty]').forEach(function (el) { el.style.display = skus.length ? 'none' : ''; });
      document.querySelectorAll('[data-total-cbm]').forEach(function (el) { el.textContent = fmt(total, 1) + ' m³' + (unknown ? STR.onRequest(unknown) : ''); });
      Object.keys(caps).forEach(function (k) {
        var pct = caps[k] ? total / caps[k] * 100 : 0;
        document.querySelectorAll('[data-bar="' + k + '"]').forEach(function (b) { b.style.width = Math.min(100, pct) + '%'; b.classList.toggle('over', pct > 103); b.classList.toggle('full', pct >= 97 && pct <= 103); });
        document.querySelectorAll('[data-pct="' + k + '"]').forEach(function (b) { b.textContent = Math.round(pct) + '%'; });
      });
      var n40 = Math.round(total / caps.cbm40hc * 100);
      var summary = skus.length ? STR.summary(skus.length, fmt(total, 1), n40) : '';
      document.querySelectorAll('[data-plan-announce]').forEach(function (el) { el.textContent = summary ? STR.planPrefix + summary : STR.planEmpty; });
      var bar = document.querySelector('[data-plan-bar]');
      if (bar) { bar.hidden = !skus.length; document.body.classList.toggle('has-plan-bar', !!skus.length); var sm = bar.querySelector('[data-plan-summary]'); if (sm) sm.textContent = summary; }
      var ta = document.getElementById('f-items');
      if (ta && !ta.dataset.userEdited) {
        ta.value = skus.map(function (s) { var p = P[s] || { name: s }; return (P[s] ? p.sku + ' — ' : '') + p.name + ' × ' + q[s]; }).join('\n') + (total ? '\n\n' + STR.estLoad(fmt(total, 1), n40) : '');
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
      var old = t.textContent; t.textContent = STR.added; t.disabled = true;
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
  document.addEventListener('click', function (e) {
    document.querySelectorAll('details.lang-menu[open]').forEach(function (d) { if (!d.contains(e.target)) d.removeAttribute('open'); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') document.querySelectorAll('details.lang-menu[open]').forEach(function (d) { d.removeAttribute('open'); }); });
  document.addEventListener('change', function (e) {
    var i = e.target.closest('[data-qty]');
    if (i) setQty(i.getAttribute('data-qty'), parseInt(i.value, 10) || 0);
  });
  var cancelBtn = document.querySelector('[data-cancel]');
  if (cancelBtn) cancelBtn.addEventListener('click', function () {
    var f = cancelBtn.closest('form'); f.reset();
    f.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
    f.querySelectorAll('.field-error').forEach(function (el) { el.remove(); });
    var ta = document.getElementById('f-items'); if (ta) { delete ta.dataset.userEdited; ta.value = ''; }
    writeQuote({}); updateCount(); renderPanels();
    var st = f.querySelector('[data-status]'); if (st) { st.className = 'status ok'; st.textContent = STR.cancelled; }
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
      if (!String(data.name || '').trim()) bad('f-name', STR.errName);
      if (!String(data.company || '').trim()) bad('f-company', STR.errCompany);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email || '').trim())) bad('f-email', STR.errEmail);
      if (!String(data.country || '').trim()) bad('f-country', STR.errCountry);
      if (problems.length) { status.className = 'status err'; status.textContent = STR.errCheck(problems.length); problems[0].focus(); return; }
      if (data.website) { status.className = 'status ok'; status.textContent = 'Thanks — received.'; return; } // honeypot
      var q = quote(); data.quote = Object.keys(q).map(function (s) { return { sku: s, qty: q[s] }; });
      data.page = location.href;
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true;
      fetch('/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, j: j }; }); })
        .then(function (res) {
          if (res.ok && res.j.delivered) { status.className = 'status ok'; status.textContent = STR.sent; form.reset(); writeQuote({}); updateCount(); renderPanels(); }
          else if (res.ok) { status.className = 'status ok'; status.textContent = STR.preview; }
          else { var e = new Error(res.j.error || 'failed'); e.client = res.status >= 400 && res.status < 500; throw e; }
        })
        .catch(function (err) {
          status.className = 'status err';
          status.textContent = err && err.client ? (STR.serverErrors[err.message] || err.message) : STR.failed;
        })
        .then(function () { btn.disabled = false; });
    });
  }

  updateCount();
  renderPanels();
  // Deep link hash → filter chip (also on same-document hash changes)
  function applyHash() {
    if (location.pathname.indexOf(BASE + '/products') !== 0) return;
    var chip = document.querySelector('[data-filter="' + (location.hash ? location.hash.slice(1) : 'all') + '"]');
    if (chip) { chip.click(); var sec = location.hash && document.getElementById(location.hash.slice(1)); if (sec) sec.scrollIntoView(); }
  }
  applyHash();
  window.addEventListener('hashchange', applyHash);
})();
