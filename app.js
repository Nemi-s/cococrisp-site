/* =====================================================================
   CocoCrisp store config – change prices, shipping and payments HERE.
   ===================================================================== */
var CONFIG = {
  CURRENCY_SYMBOL: '₹',
  PACK_SIZE: '50 g pack',
  PRICE_PER_PACK: 49,          // LAUNCH PRICE in rupees – change this one number to reprice every flavour
  SHIPPING: 0,                 // flat shipping in rupees; 0 shows "Calculated at checkout"
  MAX_QTY_PER_ITEM: 50,

  // ---- Payments (Razorpay Standard Checkout) ----
  // Leave RAZORPAY_KEY_ID empty until Razorpay is live: the Pay button stays
  // disabled and says "Online payment launching soon".
  RAZORPAY_KEY_ID: '',         // e.g. 'rzp_live_XXXXXXXXXXXX' (Key ID only – NEVER put the Key Secret here)
  // Standard Checkout needs a small server (see README.md):
  RAZORPAY_ORDER_ENDPOINT: '', // POST {amount, currency, receipt, notes} -> {id, amount, currency}
  RAZORPAY_VERIFY_ENDPOINT: '',// POST {razorpay_order_id, razorpay_payment_id, razorpay_signature, order} -> {verified:true}
  BRAND_NAME: 'CocoCrisp',
  WHATSAPP_SUPPORT: '919769700512'
};

var FLAVOURS = {
  'Classic Salted':  { color: '#1F5FA8', img: 'img/classic-salted-thumb.webp' },
  'Jaggery Elaichi': { color: '#E0962A', img: 'img/jaggery-elaichi-thumb.webp' },
  'Masala':          { color: '#D6392C', img: 'img/masala-thumb.webp' },
  'Chilli Lime':     { color: '#86B52B', img: 'img/chilli-lime-thumb.webp' }
};

var STATES = ['Andaman and Nicobar Islands','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chandigarh','Chhattisgarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand','Karnataka','Kerala','Ladakh','Lakshadweep','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Puducherry','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];

(function () {
  var KEY = 'cococrisp_cart_v1';
  var $ = function (id) { return document.getElementById(id); };
  var money = function (n) { return CONFIG.CURRENCY_SYMBOL + n.toLocaleString('en-IN'); };

  /* ---------- cart state (localStorage) ---------- */
  function load() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY)) || {};
      Object.keys(c).forEach(function (k) { if (!FLAVOURS[k] || !(c[k] > 0)) delete c[k]; });
      return c;
    } catch (e) { return {}; }
  }
  var cart = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  function count() { return Object.keys(cart).reduce(function (a, k) { return a + cart[k]; }, 0); }
  function subtotal() { return count() * CONFIG.PRICE_PER_PACK; }
  function shipping() { return count() ? CONFIG.SHIPPING : 0; }
  function total() { return subtotal() + shipping(); }
  function setQty(f, q) {
    q = Math.max(0, Math.min(CONFIG.MAX_QTY_PER_ITEM, q));
    if (q) cart[f] = q; else delete cart[f];
    save(); render();
  }

  /* ---------- rendering ---------- */
  function shipText() { return CONFIG.SHIPPING > 0 ? money(CONFIG.SHIPPING) : 'Calculated at checkout'; }
  function render() {
    var n = count();
    $('ccount').textContent = n; $('ccount').setAttribute('data-n', n);
    var keys = Object.keys(cart);
    // drawer
    var box = $('citems'); box.innerHTML = '';
    if (!keys.length) box.innerHTML = '<p class="empty">Your cart is empty. Add a flavour to begin.</p>';
    keys.forEach(function (f) {
      var el = document.createElement('div'); el.className = 'citem';
      el.innerHTML = '<img class="thumb" src="' + FLAVOURS[f].img + '" alt="" width="64" height="80" style="background:' + FLAVOURS[f].color + '">' +
        '<div class="info"><b></b><small>' + CONFIG.PACK_SIZE + ' · ' + money(CONFIG.PRICE_PER_PACK) + '</small><br><button type="button" class="rm">Remove</button></div>' +
        '<div class="qty"><button type="button" aria-label="Decrease">−</button><output>' + cart[f] + '</output><button type="button" aria-label="Increase">+</button></div>';
      el.querySelector('b').textContent = f;
      var b = el.querySelectorAll('.qty button');
      b[0].onclick = function () { setQty(f, cart[f] - 1); };
      b[1].onclick = function () { setQty(f, cart[f] + 1); };
      el.querySelector('.rm').onclick = function () { setQty(f, 0); };
      box.appendChild(el);
    });
    $('d_sub').textContent = money(subtotal());
    $('d_ship').textContent = shipText();
    $('tocheckout').style.display = keys.length ? '' : 'none';
    // checkout summary
    var it = $('co_items'); it.innerHTML = '';
    if (!keys.length) it.innerHTML = '<p class="empty">Your cart is empty. <a href="#shop">Browse the collection</a>.</p>';
    keys.forEach(function (f) {
      var l = document.createElement('div'); l.className = 'sumline';
      var a = document.createElement('span'); a.textContent = f + ' × ' + cart[f];
      var c = document.createElement('span'); c.textContent = money(cart[f] * CONFIG.PRICE_PER_PACK);
      l.appendChild(a); l.appendChild(c); it.appendChild(l);
    });
    $('co_sub').textContent = money(subtotal());
    $('co_ship').textContent = shipText();
    $('co_total').textContent = money(total()) + (CONFIG.SHIPPING > 0 ? '' : ' + shipping');
    updatePay();
  }

  /* ---------- payment button state ---------- */
  function paymentsReady() { return !!(CONFIG.RAZORPAY_KEY_ID && CONFIG.RAZORPAY_ORDER_ENDPOINT && CONFIG.RAZORPAY_VERIFY_ENDPOINT); }
  function updatePay() {
    var btn = $('paybtn');
    if (!paymentsReady()) { btn.disabled = true; btn.textContent = 'Online payment launching soon'; return; }
    btn.disabled = !count();
    btn.textContent = count() ? 'Pay ' + money(total()) + ' securely' : 'Add items to pay';
  }

  /* ---------- drawer ---------- */
  function openCart() { document.body.classList.add('cart-open'); var d = $('drawer'); d.setAttribute('aria-hidden', 'false'); d.inert = false; d.removeAttribute('inert'); }
  function closeCart() { document.body.classList.remove('cart-open'); var d = $('drawer'); d.setAttribute('aria-hidden', 'true'); d.inert = true; d.setAttribute('inert', ''); }
  $('cartbtn').onclick = openCart; $('cartclose').onclick = closeCart; $('overlay').onclick = closeCart;
  $('tocheckout').onclick = closeCart;
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCart(); });

  function openCartSoon() { if (window.matchMedia('(min-width: 900px)').matches) setTimeout(openCart, 250); }
  var toastT;
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 1800); }

  [].forEach.call(document.querySelectorAll('[data-add]'), function (b) {
    b.onclick = function () { var f = b.getAttribute('data-add'); setQty(f, (cart[f] || 0) + 1); toast(f + ' added to your cart'); openCartSoon(); };
  });
  [].forEach.call(document.querySelectorAll('[data-price]'), function (e) { e.textContent = money(CONFIG.PRICE_PER_PACK); });
  [].forEach.call(document.querySelectorAll('[data-pack]'), function (e) { e.textContent = CONFIG.PACK_SIZE; });

  /* ---------- checkout form ---------- */
  var sel = $('c_state');
  STATES.forEach(function (s) { var o = document.createElement('option'); o.value = o.textContent = s; sel.appendChild(o); });
  ['c_phone', 'c_pin'].forEach(function (id) { $(id).addEventListener('input', function () { this.value = this.value.replace(/\D/g, ''); }); });
  var frm = $('cofrm');
  [].forEach.call(frm.elements, function (el) { el.addEventListener('blur', function () { el.classList.add('touched'); }); });

  function customer() {
    return { name: $('c_name').value.trim(), phone: $('c_phone').value.trim(), email: $('c_email').value.trim(),
      address: $('c_addr').value.trim(), city: $('c_city').value.trim(), state: sel.value, pin: $('c_pin').value.trim() };
  }
  function msg(t) { $('paymsg').textContent = t; }

  function loadRazorpay() {
    return new Promise(function (res, rej) {
      if (window.Razorpay) return res();
      var s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = res; s.onerror = function () { rej(new Error('Could not load Razorpay')); }; document.head.appendChild(s);
    });
  }
  function postJSON(url, body) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw new Error('Server error ' + r.status); return r.json(); });
  }

  frm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!paymentsReady()) { msg('Online payment is launching soon.'); return; }
    if (!count()) { msg('Your cart is empty.'); return; }
    [].forEach.call(frm.elements, function (el) { el.classList.add('touched'); });
    if (!frm.checkValidity()) { msg('Please fill in all delivery details correctly.'); var bad = frm.querySelector(':invalid'); if (bad) bad.focus(); return; }
    var c = customer();
    var order = { items: cart, price_per_pack: CONFIG.PRICE_PER_PACK, shipping: shipping(), amount_inr: total(), customer: c };
    var btn = $('paybtn'); btn.disabled = true; msg('Connecting to secure payment…');
    // NOTE: the server must recompute the amount from the items – never trust the browser total.
    loadRazorpay().then(function () {
      return postJSON(CONFIG.RAZORPAY_ORDER_ENDPOINT, { amount: total() * 100, currency: 'INR', receipt: 'cc_' + Date.now(), order: order });
    }).then(function (rzOrder) {
      var rzp = new window.Razorpay({
        key: CONFIG.RAZORPAY_KEY_ID, order_id: rzOrder.id, amount: rzOrder.amount, currency: rzOrder.currency || 'INR',
        name: CONFIG.BRAND_NAME, description: count() + ' pack(s) of CocoCrisp',
        prefill: { name: c.name, email: c.email, contact: '+91' + c.phone },
        notes: { address: c.address + ', ' + c.city + ', ' + c.state + ' ' + c.pin },
        theme: { color: '#2fa36b' },
        handler: function (resp) {
          msg('Verifying your payment…');
          postJSON(CONFIG.RAZORPAY_VERIFY_ENDPOINT, { razorpay_order_id: resp.razorpay_order_id, razorpay_payment_id: resp.razorpay_payment_id, razorpay_signature: resp.razorpay_signature, order: order })
            .then(function (v) {
              if (v && v.verified) { cart = {}; save(); render(); msg('Payment confirmed – thank you! Payment ID: ' + resp.razorpay_payment_id + '. We\'ll email you the order details.'); }
              else { msg('We couldn\'t verify the payment yet. If money was deducted, contact us with Payment ID ' + resp.razorpay_payment_id + '.'); updatePay(); }
            }).catch(function () { msg('We couldn\'t verify the payment yet. If money was deducted, contact us with Payment ID ' + resp.razorpay_payment_id + '.'); updatePay(); });
        },
        modal: { ondismiss: function () { msg('Payment cancelled. Your cart is saved.'); updatePay(); } }
      });
      rzp.on('payment.failed', function (r) { msg('Payment failed: ' + ((r.error && r.error.description) || 'please try again') + '.'); updatePay(); });
      rzp.open(); msg('');
    }).catch(function (err) { msg('Sorry, payment could not start (' + err.message + '). Please try again.'); updatePay(); });
  });

  /* ---------- misc ---------- */
  $('yr').textContent = new Date().getFullYear();
  var wa = 'https://wa.me/' + CONFIG.WHATSAPP_SUPPORT + '?text=';
  $('footwa').href = wa + encodeURIComponent('Hi, I have a question about CocoCrisp.');
  $('bulkbtn').href = wa + encodeURIComponent("Hi, I'm interested in a bulk order of CocoCrisp.\nBusiness name: \nType (store / cafe / gifting / office): \nCity: \nApprox. quantity: ");
  window.addEventListener('storage', function (e) { if (e.key === KEY) { cart = load(); render(); } });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .12 });
    [].forEach.call(document.querySelectorAll('.reveal'), function (el) { io.observe(el); });
  } else { [].forEach.call(document.querySelectorAll('.reveal'), function (el) { el.classList.add('in'); }); }

  render();

  /* ---------- "Add to cart" links from the flavour pages: /?add=masala#shop ---------- */
  try {
    var addSlug = new URLSearchParams(location.search).get('add');
    if (addSlug) {
      var addName = Object.keys(FLAVOURS).filter(function (n) { return n.toLowerCase().replace(/\s+/g, '-') === addSlug; })[0];
      if (addName) { setQty(addName, (cart[addName] || 0) + 1); toast(addName + ' added to your cart'); setTimeout(openCart, 400); }
      if (history.replaceState) history.replaceState(null, '', location.pathname + (location.hash || '#shop'));
    }
  } catch (e) {}
  window.CocoCrisp = { cart: function () { return JSON.parse(JSON.stringify(cart)); }, setQty: setQty, total: total };
})();
