# CocoCrisp website

Static site (HTML/CSS/JS, no backend) served by GitHub Pages from `main`.

- `index.html` – page + styles
- `app.js` – cart, checkout and payment logic. **All settings are in the `CONFIG` object at the top.**

## Changing prices / shipping
Edit `app.js` → `CONFIG`:
- `PRICE_PER_PACK: 49` – launch price per 50 g pack (₹). Changes every flavour card, the cart and checkout.
- `PACK_SIZE: '50 g pack'`
- `SHIPPING: 0` – flat shipping in ₹. While it's `0` the site shows "Shipping calculated at checkout".

The cart is saved in the visitor's browser (`localStorage`, key `cococrisp_cart_v1`).

## Payments – current state
No payment gateway is connected. `RAZORPAY_KEY_ID` is empty, so the Pay button is disabled and reads
"Online payment launching soon". The site never collects card details itself – Razorpay's own
popup/page does that.

There are two ways to switch payments on:

### Option A – Razorpay Payment Link / Payment Button / Payment Page (no backend)
Easiest, no server needed.
1. Activate a Razorpay account (KYC: PAN, bank account, business details, website URL).
2. In the Razorpay Dashboard create a **Payment Page** or **Payment Button** with the products
   (e.g. "CocoCrisp 50 g – Jaggery Elaichi ₹49", with quantity selection and customer address fields).
3. Razorpay gives you a link (`https://rzp.io/...` / `https://pages.razorpay.com/...`) or a Payment Button
   `<form><script src="https://checkout.razorpay.com/v1/payment-button.js" data-payment_button_id="pl_..."></script></form>` snippet.
4. Either paste the button snippet into the checkout section of `index.html`, or link the Pay button to the page URL.
   Trade-off: the customer re-selects quantities on Razorpay's page – our cart total is not passed over,
   because a browser-only site can't safely create a payment for an arbitrary amount.
   Razorpay records the payment and sends you/the customer receipts; you see orders in the Dashboard.

### Option B – Razorpay Standard Checkout (`checkout.js`, already wired into `app.js`)
Uses our own cart and checkout form, but Razorpay **requires a server** for two steps, because they need
the Key **Secret**, which must never be in this public website:
1. **Create order** – server calls `POST https://api.razorpay.com/v1/orders` with the amount in paise
   (recomputed on the server from the items – never trust the browser total) and returns `{id, amount, currency}`.
2. **Verify payment** – after payment, server checks
   `HMAC_SHA256(order_id + "|" + payment_id, KEY_SECRET) == razorpay_signature` and returns `{verified: true}`.
   (Also set up a Razorpay webhook for `payment.captured` as a backup.)

A tiny serverless function (Cloudflare Workers, Vercel, Netlify Functions, Firebase) is enough. Then set in `CONFIG`:
```js
RAZORPAY_KEY_ID: 'rzp_live_xxxxxxxx',            // Key ID only (public). Never the Secret.
RAZORPAY_ORDER_ENDPOINT: 'https://<your-fn>/create-order',
RAZORPAY_VERIFY_ENDPOINT: 'https://<your-fn>/verify',
```
The Pay button only turns on when all three are set. The site shows "Payment confirmed" only after the
server says the signature is verified. Test first with `rzp_test_...` keys.

## Custom domain
Not connected yet. After the BigRock DNS points to GitHub Pages, add a `CNAME` file containing `cococrisp.in`
and set the custom domain + "Enforce HTTPS" in repo Settings → Pages.

## Brand kit (`brand/`)
Current direction (v2, Nov 2026): bright white matte packs, bold sans typography, one accent colour per flavour,
round clear window showing the real chips. Deliberately distinct from Sukoon (kraft pouches, serif, earthy palette).
- `logo-mono.svg` / `logo-mono-white.svg` – primary logo for white / dark backgrounds (crescent mark + "CocoCrisp" wordmark, outlined).
  `logo.svg` / `logo-light.svg` – gold-mark variant. PNGs: `logo-dark-on-light.png`, `logo-light-on-dark.png`, `logo-mark.png`,
  `logo-instagram-dark.png`, `logo-instagram-light.png` (1080×1080).
- Palette: white `#FFFFFF`, ink `#141210`, light grey `#F6F6F3`; flavour accents Classic Salted blue `#1F5FA8`, Jaggery Elaichi amber `#E0962A`,
  Masala red `#D6392C`, Chilli Lime green `#86B52B`.
- Type: Jost (all site + pack text, SIL OFL); Cormorant Garamond only inside the logo (outlined).
- `packaging/<flavour>-front.svg` / `-front-print.pdf` – flat front panel per flavour, 130 × 200 mm trim + 3 mm bleed
  (136 × 206 mm), all text outlined. The circle is the CLEAR WINDOW (no ink / no white underlay); the chips drawn inside
  are for visualisation only – ask the printer to set it up as a window on their dieline.
  Before printing: confirm pouch size with the converter, add back-panel mandatory info (ingredients, nutrition, FSSAI logo +
  licence no., MRP, batch/dates, manufacturer address).
- `mockups/` – AI-generated photoreal mockups and hero (concept visuals). `mockups/v1-dark/` keeps the earlier dark-pouch round.
- Web images are WebP in `img/`.
