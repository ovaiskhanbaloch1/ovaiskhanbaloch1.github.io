/* =====================================================================
   Collection's by Zoni — Admin Connector
   Links this storefront to the Admin Panel (admin.html). Both sides share
   one data store in this browser (localStorage key "zoni_admin_v1"):
   - Products, categories, settings and reviews edited in the admin panel
     are applied to the storefront on the next page load.
   - Orders placed at checkout are recorded into the store so the admin
     panel can manage them (status, TCS consignment number, notes).
   - The Track Order page reads the admin record (real status + TCS no).
   If no admin data exists yet, the site runs on its built-in catalog.
   ===================================================================== */
(function () {
  var KEY = "zoni_admin_v1";
  function load() { try { var v = localStorage.getItem(KEY); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function save(st) { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  window.ZoniStore = {
    key: KEY, load: load, save: save,
    ensure: function () {
      var cur = load();
      if (cur && cur.products) return cur;
      var seed = {
        version: 1, seededAt: new Date().toISOString(),
        settings: JSON.parse(JSON.stringify(SETTINGS)),
        announcements: ABAR_MSGS.slice(),
        categories: CATEGORIES.filter(function (c) { return c !== "All"; }).map(function (n) { return { name: n, color: (typeof CATBAND !== "undefined" && CATBAND[n]) || "#F5B301" }; }),
        products: JSON.parse(JSON.stringify(PRODUCTS)).map(function (p) {
          p.active = true; p.featured = false;
          p.sizesAdv = (p.sizes || []).map(function (l) { return { label: l, price: null, soldOut: false }; });
          p.sizeChart = p.sizeChart || [];
          (p.reviews || []).forEach(function (r) { if (!r.status) r.status = "approved"; });
          return p;
        }),
        orders: [], adminPass: null
      };
      save(seed); return seed;
    }
  };

  /* ---------- 1) Apply admin data over the built-in catalog ---------- */
  var st = load();
  var hasAdmin = !!(st && st.products && st.products.length);
  if (hasAdmin) {
    try {
      if (st.settings) { for (var k in st.settings) { if (Object.prototype.hasOwnProperty.call(SETTINGS, k)) SETTINGS[k] = st.settings[k]; } }
      if (st.announcements && st.announcements.length) ABAR_MSGS.splice.apply(ABAR_MSGS, [0, ABAR_MSGS.length].concat(st.announcements));
      if (st.categories && st.categories.length) {
        CATEGORIES.splice.apply(CATEGORIES, [0, CATEGORIES.length, "All"].concat(st.categories.map(function (c) { return c.name; })));
        for (var key in CATBAND) delete CATBAND[key];
        st.categories.forEach(function (c) { CATBAND[c.name] = c.color || "#F5B301"; });
      }
      var act = st.products.filter(function (p) { return p.active !== false; });
      var mapped = act.map(function (p) {
        var q = JSON.parse(JSON.stringify(p));
        q.reviews = (p.reviews || []).filter(function (r) { return r.status !== "pending"; });
        if (p.reviews && p.reviews.length) q.reviewCount = q.reviews.length;
        delete q.active; delete q.featured;
        return q;
      });
      PRODUCTS.splice.apply(PRODUCTS, [0, PRODUCTS.length].concat(mapped));
      var fids = act.filter(function (p) { return p.featured; }).map(function (p) { return p.id; });
      if (fids.length && typeof FEATURED_IDS !== "undefined") FEATURED_IDS.splice.apply(FEATURED_IDS, [0, FEATURED_IDS.length].concat(fids));
    } catch (e) { /* fall back to built-in catalog */ }
  }

  /* ---------- 2) Small styles for connector elements ---------- */
  var css = document.createElement("style");
  css.textContent =
    ".size-pill.zoni-soldout{opacity:.45;text-decoration:line-through;cursor:not-allowed}" +
    ".zoni-chart-btn{display:inline-flex;align-items:center;gap:7px;margin-top:12px;background:none;border:0;font:inherit;font-size:15px;font-weight:600;color:var(--acc-ink,#262019);cursor:pointer;padding:4px 2px}" +
    ".zoni-chart-btn:hover{color:var(--acc-strong,#BE8B00)}" +
    ".zoni-chart-btn svg{flex:0 0 auto}" +
    ".zoni-modal{position:fixed;inset:0;background:rgba(30,25,15,.55);display:none;align-items:flex-end;justify-content:center;z-index:200;padding:0}" +
    ".zoni-modal.open{display:flex}" +
    ".zoni-modal-box{background:#fff;width:100%;max-width:560px;max-height:88vh;overflow:auto;border-radius:22px 22px 0 0;padding:26px 22px 30px;position:relative}" +
    "@media(min-width:640px){.zoni-modal{align-items:center;padding:20px}.zoni-modal-box{border-radius:22px}}" +
    ".zoni-modal-box h3{font-size:24px;line-height:1.25;margin:0 40px 8px 0}" +
    ".zoni-modal-box .zoni-note{color:#3C4057;font-size:15px;margin-bottom:16px}" +
    ".zoni-modal-close{position:absolute;top:14px;right:14px;width:38px;height:38px;border-radius:50%;border:1.5px solid #E7D9A8;background:#fff;font-size:17px;cursor:pointer;line-height:1}" +
    ".zoni-chart-table{width:100%;border-collapse:collapse;font-size:14.5px}" +
    ".zoni-chart-table th,.zoni-chart-table td{border:1px solid #E3E3E3;padding:9px 8px;text-align:center}" +
    ".zoni-chart-table th{background:#FBF6E3;font-weight:700}" +
    ".zoni-revform{margin-top:18px;border:1.5px solid var(--acc-sep,#FCE7AE);border-radius:16px;padding:16px;background:#FFFDF4}" +
    ".zoni-revform h4{margin:0 0 10px;font-size:16px}" +
    ".zoni-revform input,.zoni-revform select,.zoni-revform textarea{width:100%;padding:9px 11px;border:1.5px solid #E7D9A8;border-radius:10px;margin-bottom:9px;font:inherit;font-size:14.5px}" +
    ".zoni-revform button{background:var(--acc,#F5B301);border:0;padding:10px 18px;border-radius:999px;font-weight:700;cursor:pointer;color:var(--acc-ink,#262019)}" +
    "#zoniTrackInfo{margin-top:16px}" +
    ".zoni-track-card{border:1.5px solid var(--acc-sep,#FCE7AE);background:#FFFDF4;border-radius:16px;padding:14px 16px;font-size:15px}" +
    ".zoni-status{display:inline-block;background:var(--acc,#F5B301);color:var(--acc-ink,#262019);font-weight:700;border-radius:999px;padding:3px 12px;font-size:13px;margin-left:6px}" +
    ".zoni-tcs-btn{display:inline-block;margin-top:8px;background:#1F7A3D;color:#fff;padding:8px 16px;border-radius:999px;font-weight:700;text-decoration:none}";
  document.head.appendChild(css);

  /* ---------- 3) Page enhancements after the store renders ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var page = (document.body && document.body.dataset.page) || "home";

    if (hasAdmin) {
      document.querySelectorAll('a[href^="https://wa.me/"]').forEach(function (a) { a.href = SETTINGS.whatsapp; });
      var mail = document.querySelector('footer a[href^="mailto:"]');
      if (mail) { mail.href = "mailto:" + SETTINGS.email; mail.textContent = SETTINGS.email; }
      var waTxt = document.querySelector('footer a[href^="https://wa.me/"]');
      if (waTxt) waTxt.textContent = SETTINGS.phoneDisplay;
    }
    if (page === "product") enhanceProduct();
    if (page === "checkout") hookCheckout();
    if (page === "track") hookTrack();
  });

  function curProduct() { try { return state.current || null; } catch (e) { return null; } }

  function enhanceProduct() {
    var p = curProduct(); if (!p) return;
    var adv = p.sizesAdv || [];
    function advFor(label) { for (var i = 0; i < adv.length; i++) if (adv[i].label === label) return adv[i]; return null; }

    /* sold-out sizes: disable + strike-through */
    document.querySelectorAll("#pdSizes .size-pill").forEach(function (pill) {
      var a = advFor(pill.dataset.size);
      if (a && a.soldOut) { pill.classList.add("zoni-soldout"); pill.disabled = true; pill.title = "Sold out"; }
    });

    /* per-size price: adjust the product's sale price + the shown price */
    var baseSale = p.salePrice;
    document.addEventListener("click", function (e) {
      var pill = e.target.closest ? e.target.closest("#pdSizes .size-pill") : null;
      if (!pill || pill.disabled) return;
      var a = advFor(pill.dataset.size);
      var newPrice = (a && a.price) ? a.price : baseSale;
      p.salePrice = newPrice;
      var priceEl = document.querySelector(".pd-price");
      if (priceEl && priceEl.childNodes.length && priceEl.childNodes[0].nodeType === 3) priceEl.childNodes[0].textContent = money(newPrice) + " ";
      if (a && a.price) {
        var note = document.getElementById("zoniSizePrice");
        if (!note) { note = document.createElement("div"); note.id = "zoniSizePrice"; note.style.cssText = "font-size:13.5px;color:#7A6A2F;margin-top:4px"; var sizesBox = document.getElementById("pdSizes"); if (sizesBox && sizesBox.parentNode) sizesBox.parentNode.insertBefore(note, sizesBox.nextSibling); }
        if (note) note.textContent = "Price for size " + pill.dataset.size + ": " + money(newPrice);
      } else {
        var n2 = document.getElementById("zoniSizePrice"); if (n2) n2.textContent = "";
      }
    });

    /* size chart — "Size Chart" link under the sizes opens a popup with the
       garment measurements, like the client's reference. Uses the product's
       own chart from the admin panel when set, otherwise the client's
       standard chart below. */
    var DEFAULT_CHART = [
      { size: "1-2 Years", chest: "13", length: "16", sleeve: "12.25" },
      { size: "2-3 Years", chest: "13.5", length: "17", sleeve: "13" },
      { size: "3-4 Years", chest: "14", length: "18", sleeve: "13.75" },
      { size: "4-5 Years", chest: "14.5", length: "19", sleeve: "14.5" },
      { size: "5-6 Years", chest: "15", length: "20", sleeve: "15.25" },
      { size: "6-7 Years", chest: "15.5", length: "21", sleeve: "16" },
      { size: "7-8 Years", chest: "16", length: "22", sleeve: "16.75" },
      { size: "8-9 Years", chest: "17", length: "23", sleeve: "17" }
    ];
    var sizesBox2 = document.getElementById("pdSizes");
    if (sizesBox2 && sizesBox2.parentNode && !document.querySelector(".zoni-chart-btn")) {
      var chartRows = (p.sizeChart && p.sizeChart.length) ? p.sizeChart : DEFAULT_CHART;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "zoni-chart-btn";
      btn.innerHTML = '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 17 17 3l4 4L7 21H3v-4z"/><path d="M8 16l1.5 1.5M11 13l1.5 1.5M14 10l1.5 1.5"/></svg> Size Chart';
      sizesBox2.parentNode.insertBefore(btn, sizesBox2.nextSibling);
      var modal = document.createElement("div");
      modal.className = "zoni-modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-label", "Size chart");
      var rowsHtml = chartRows.map(function (r) {
        return "<tr><td>" + esc(r.size) + "</td><td>" + esc(r.chest || "—") + "</td><td>" + esc(r.length || "—") + "</td><td>" + esc(r.sleeve || "—") + "</td></tr>";
      }).join("");
      modal.innerHTML = '<div class="zoni-modal-box"><button type="button" class="zoni-modal-close" aria-label="Close">✕</button>' +
        "<h3>Garment Measurements</h3>" +
        '<p class="zoni-note">Please note below chart is based on garment measurements.</p>' +
        '<table class="zoni-chart-table"><tr><th>Years</th><th>Chest (Inches)</th><th>Length (Inches)</th><th>Sleeve Length (Inches)</th></tr>' + rowsHtml + "</table></div>";
      document.body.appendChild(modal);
      btn.addEventListener("click", function () { modal.classList.add("open"); });
      modal.addEventListener("click", function (e) { if (e.target === modal) modal.classList.remove("open"); });
      modal.querySelector(".zoni-modal-close").addEventListener("click", function () { modal.classList.remove("open"); });
    }

    /* write-a-review form -> goes to admin for approval */
    var revEl = document.querySelector(".review");
    if (revEl && revEl.parentNode && !document.querySelector(".zoni-revform")) {
      var form = document.createElement("form");
      form.className = "zoni-revform";
      form.innerHTML = "<h4>Write a Review</h4>" +
        '<input name="rname" required placeholder="Your name">' +
        '<input name="rcity" placeholder="Your city">' +
        '<select name="rrating"><option value="5">5 - Excellent</option><option value="4">4 - Good</option><option value="3">3 - Average</option><option value="2">2 - Poor</option><option value="1">1 - Bad</option></select>' +
        '<textarea name="rtext" required rows="3" placeholder="Share your experience with this product"></textarea>' +
        '<button type="submit">Submit Review</button>';
      revEl.parentNode.appendChild(form);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        var st2 = ZoniStore.ensure();
        var prod = null;
        for (var i = 0; i < st2.products.length; i++) if (st2.products[i].id === p.id) prod = st2.products[i];
        if (!prod) return;
        prod.reviews = prod.reviews || [];
        prod.reviews.push({ name: String(fd.get("rname") || "Customer"), city: String(fd.get("rcity") || ""), rating: parseInt(fd.get("rrating"), 10) || 5, text: String(fd.get("rtext") || ""), date: "Just now", status: "pending" });
        ZoniStore.save(st2);
        form.innerHTML = "<h4>Thank you!</h4><p>Your review was submitted and will appear here after the store team approves it.</p>";
      });
    }
  }

  function hookCheckout() {
    var snap = null;
    document.addEventListener("click", function (e) {
      if (!(e.target.closest && e.target.closest("#placeBtn"))) return;
      try {
        var f = document.getElementById("checkoutForm") || document.querySelector("form");
        var fv = function (n) { var el = f ? f.querySelector('[name="' + n + '"]') : null; return el ? el.value.trim() : ""; };
        var sub = cartSubtotal();
        snap = {
          name: fv("cname"), phone: fv("cphone"), whatsapp: fv("cwhats") || fv("cphone"),
          city: fv("ccity") || "Rahim Yar Khan", address: fv("caddress"), email: fv("cemail"),
          payment: fv("payment") || "Cash on Delivery",
          lines: state.cart.map(function (l) { var pr = byId(l.id); return { id: l.id, title: pr ? pr.title : "Product", size: l.size, qty: l.qty, price: l.price }; }),
          subtotal: sub, shipping: shipFee(sub)
        };
      } catch (err) { snap = null; }
    }, true);

    var done = document.getElementById("doneBox");
    if (!done) return;
    var recorded = false;
    var obs = new MutationObserver(function () {
      if (recorded || !snap || !done.innerHTML) return;
      var lo = null; try { lo = state.lastOrder; } catch (e) {}
      if (!lo || !lo.orderNumber) return;
      recorded = true;
      var st2 = ZoniStore.ensure();
      if (!st2.orders.some(function (o) { return o.orderNumber === lo.orderNumber; })) {
        st2.orders.unshift({
          orderNumber: lo.orderNumber, name: snap.name, phone: snap.phone, whatsapp: snap.whatsapp,
          city: snap.city, address: snap.address, email: snap.email, payment: snap.payment,
          date: lo.date, items: snap.lines, itemsCount: lo.items, subtotal: snap.subtotal,
          shipping: snap.shipping, total: lo.total, status: "Pending", tcs: "", note: "", ts: Date.now()
        });
        ZoniStore.save(st2);
      }
      obs.disconnect();
    });
    obs.observe(done, { childList: true, subtree: true });
  }

  function hookTrack() {
    var result = document.getElementById("trackResult");
    if (!result || !result.parentNode) return;
    var info = document.createElement("div");
    info.id = "zoniTrackInfo";
    result.parentNode.insertBefore(info, result.nextSibling);
    var form = document.getElementById("trackForm");
    if (!form) return;
    form.addEventListener("submit", function () {
      var q = (document.getElementById("trackInput").value || "").trim().toUpperCase();
      var st2 = load();
      info.innerHTML = "";
      if (!st2 || !st2.orders) return;
      var ord = null;
      for (var i = 0; i < st2.orders.length; i++) if (String(st2.orders[i].orderNumber).toUpperCase() === q) ord = st2.orders[i];
      if (!ord) return;
      try { state.lastOrder = { orderNumber: ord.orderNumber, name: ord.name, city: ord.city, payment: ord.payment, date: ord.date, items: ord.itemsCount || (ord.items ? ord.items.length : 0), total: ord.total }; } catch (e) {}
      var tpl = (st2.settings && st2.settings.tcsTrackUrl) || "https://www.tcsexpress.com/tracking";
      var html = '<div class="zoni-track-card"><strong>Store update for order ' + esc(ord.orderNumber) + ':</strong>' +
        '<span class="zoni-status">' + esc(ord.status || "Pending") + "</span><br>" +
        (ord.tcs
          ? "TCS consignment number: <strong>" + esc(ord.tcs) + '</strong><br><a class="zoni-tcs-btn" target="_blank" rel="noopener" href="' + esc(tpl.replace("{no}", encodeURIComponent(ord.tcs))) + '">Track on TCS</a>'
          : "Your parcel has not been handed to TCS yet. The TCS consignment number will appear here once your order is shipped.") +
        "</div>";
      info.innerHTML = html;
    });
  }
})();
