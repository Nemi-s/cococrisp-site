#!/usr/bin/env python3
"""Builds SEO pieces for cococrisp.in: index.html <head> meta + JSON-LD, the four flavour pages,
sitemap.xml and robots.txt. Run from the repo root:  python3 tools/build-seo.py
Bump VER when assets change."""
import json, re, html, os, sys, datetime
sys.path.insert(0, os.path.dirname(__file__))
from seo_data import SITE, PRICE, PACK, WHATSAPP, AVAILABILITY, FLAVOURS

VER = '8'
TODAY = datetime.date.today().isoformat()
ROOT = os.path.join(os.path.dirname(__file__), '..')
HOME_TITLE = 'Baked Coconut Chips in 4 Indian Flavours, ₹49 | CocoCrisp'
HOME_DESC = ('CocoCrisp baked coconut chips: thin slices of real coconut, baked not fried, in Classic Salted, '
             'Masala, Chilli Lime & Jaggery Elaichi. 50 g pack, ₹49.')
ORG_ID, SITE_ID = SITE + '/#organization', SITE + '/#website'
FONT = '/fonts/jost-latin.woff2'

def esc(s): return html.escape(s, quote=True)

def org():
    return {"@type": "Organization", "@id": ORG_ID, "name": "CocoCrisp", "url": SITE + "/",
            "logo": {"@type": "ImageObject", "url": SITE + "/icon-512.png", "width": 512, "height": 512},
            "description": "Baked coconut chips in Indian flavours.",
            "contactPoint": [{"@type": "ContactPoint", "contactType": "customer service", "telephone": WHATSAPP,
                              "url": "https://wa.me/" + re.sub(r'\D', '', WHATSAPP), "areaServed": "IN",
                              "availableLanguage": ["en", "hi"]}]}

def product(f):
    url = f"{SITE}/{f['slug']}/"
    offer = {"@type": "Offer", "url": url, "price": f"{PRICE:.2f}", "priceCurrency": "INR",
             "itemCondition": "https://schema.org/NewCondition", "seller": {"@id": ORG_ID}}
    if AVAILABILITY: offer["availability"] = AVAILABILITY
    return {"@type": "Product", "@id": url + "#product", "name": f"CocoCrisp {f['name']} Baked Coconut Chips {PACK}",
            "url": url, "sku": "CC-" + f['slug'].upper() + "-50G", "category": "Snacks > Chips > Coconut chips",
            "image": [f"{SITE}/img/pack/{f['slug']}.webp", f"{SITE}/img/og/{f['slug']}.jpg"],
            "description": re.sub('<[^>]+>', '', f['lead']) + " Baked, not fried.",
            "brand": {"@type": "Brand", "name": "CocoCrisp"},
            "size": PACK, "weight": {"@type": "QuantitativeValue", "value": 50, "unitCode": "GRM"},
            "additionalProperty": [{"@type": "PropertyValue", "name": "Ingredients", "value": f['ingredients']},
                                   {"@type": "PropertyValue", "name": "Preparation", "value": "Baked, not fried"}],
            "offers": offer}

def ld(obj): return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + '</script>'

def head_common(title, desc, url, image, image_alt, og_type='website'):
    return f'''<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="{url}">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="CocoCrisp">
<meta property="og:locale" content="en_IN">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{esc(image_alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{image}">
<meta name="theme-color" content="#FFFFFF">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="{FONT}" as="font" type="font/woff2" crossorigin>
'''

# ---------------- index.html ----------------
def build_index():
    p = os.path.join(ROOT, 'index.html'); s = open(p, encoding='utf-8').read()
    head = head_common(HOME_TITLE, HOME_DESC, SITE + '/', SITE + '/img/og/home.jpg',
                       'CocoCrisp baked coconut chips: four white pouches, Classic Salted, Masala, Chilli Lime and Jaggery Elaichi')
    head += (f'<link rel="preload" as="image" href="img/hero-mobile.avif?v={VER}" type="image/avif" media="(max-width: 899px)" fetchpriority="high">\n'
             f'<link rel="preload" as="image" href="img/hero-1280.avif?v={VER}" type="image/avif" media="(min-width: 900px)" fetchpriority="high">\n')
    s = re.sub(r'<!--seo:head-->.*?<!--/seo:head-->', lambda m: '<!--seo:head-->\n' + head + '<!--/seo:head-->', s, flags=re.S)
    # FAQPage from the visible FAQ so the two never drift apart
    faq = []
    for q, a in re.findall(r'<details><summary>(.*?)</summary><p>(.*?)</p></details>', s, flags=re.S):
        faq.append({"@type": "Question", "name": html.unescape(re.sub('<[^>]+>', '', q)),
                    "acceptedAnswer": {"@type": "Answer", "text": html.unescape(re.sub('<[^>]+>', '', a))}})
    graph = {"@context": "https://schema.org", "@graph": [
        org(),
        {"@type": "WebSite", "@id": SITE_ID, "name": "CocoCrisp", "url": SITE + "/", "inLanguage": "en-IN", "publisher": {"@id": ORG_ID}},
        {"@type": "WebPage", "@id": SITE + "/#webpage", "url": SITE + "/", "name": HOME_TITLE, "description": HOME_DESC,
         "isPartOf": {"@id": SITE_ID}, "about": {"@id": ORG_ID}, "inLanguage": "en-IN",
         "primaryImageOfPage": {"@type": "ImageObject", "url": SITE + "/img/og/home.jpg", "width": 1200, "height": 630}},
        {"@type": "ItemList", "name": "CocoCrisp baked coconut chips", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "item": product(f)} for i, f in enumerate(FLAVOURS)]},
        {"@type": "FAQPage", "@id": SITE + "/#faq", "mainEntity": faq}]}
    s = re.sub(r'<!--seo:jsonld-->.*?<!--/seo:jsonld-->', lambda m: '<!--seo:jsonld-->\n' + ld(graph) + '\n<!--/seo:jsonld-->', s, flags=re.S)
    open(p, 'w', encoding='utf-8').write(s)
    print('index.html', len(HOME_TITLE), 'title chars,', len(HOME_DESC), 'desc chars,', len(faq), 'FAQs')

# ---------------- flavour pages ----------------
CSS = '''@font-face{font-family:Jost;font-style:normal;font-weight:300 700;font-display:swap;src:url(/fonts/jost-latin.woff2) format("woff2")}
:root{--esp:#141210;--muted:#3A3835;--line:#E7E5E0;--paper:#F6F6F3}
*{box-sizing:border-box;margin:0;padding:0}html{-webkit-text-size-adjust:100%}
body{font-family:Jost,system-ui,-apple-system,sans-serif;color:var(--esp);background:#fff;line-height:1.7;-webkit-font-smoothing:antialiased}
img{display:block;max-width:100%;height:auto}a{color:inherit}
.wrap{max-width:1160px;margin:0 auto;padding:0 24px}
body>nav{border-bottom:1px solid var(--line)}body>nav .wrap{display:flex;align-items:center;justify-content:space-between;height:68px}
body>nav .links a{margin-left:26px;font-size:.78rem;font-weight:500;letter-spacing:.2em;text-transform:uppercase;text-decoration:none}
.crumbs{font-size:.86rem;color:var(--muted);padding:22px 0 0}.crumbs a{text-decoration:none}.crumbs a:hover{text-decoration:underline}
.hero{display:grid;grid-template-columns:1fr 1.05fr;gap:56px;align-items:start;padding:28px 0 72px}
.packbox{background:radial-gradient(120% 90% at 50% 30%,#fff 0%,#F4F3F0 62%,#ECEAE5 100%);border-radius:4px;aspect-ratio:4/5;display:flex;align-items:flex-end;justify-content:center;padding:0 0 9%}
.packbox img{width:62%;filter:drop-shadow(0 24px 22px rgba(20,18,16,.16))}
.eyebrow{font-size:.74rem;font-weight:600;letter-spacing:.24em;text-transform:uppercase;display:flex;align-items:center;gap:10px}
.eyebrow:before{content:"";width:22px;height:3px;background:var(--acc)}
h1{font-size:clamp(2.4rem,5.6vw,3.8rem);line-height:1.04;letter-spacing:-.025em;font-weight:600;margin:16px 0 18px}h1 em{font-style:normal;color:var(--acc-t)}
h2{font-size:1.6rem;line-height:1.15;letter-spacing:-.015em;font-weight:600;margin-bottom:12px}
.lead{font-size:1.15rem;color:var(--muted)}
.price{display:flex;align-items:baseline;gap:12px;margin:26px 0 8px}.price b{font-size:2rem;font-weight:600}.price small{font-size:1rem;color:var(--muted)}
.launch{font-size:.72rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;border:1.5px solid var(--esp);padding:3px 10px;border-radius:20px}
.btn{display:inline-flex;align-items:center;justify-content:center;padding:16px 30px;border-radius:2px;font-size:.8rem;font-weight:600;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;background:var(--esp);color:#fff;margin-top:14px}
.btn:hover{background:#2a2725}.note{font-size:.92rem;color:var(--muted);margin-top:12px}
.badges{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px;list-style:none}.badges li{font-size:.8rem;font-weight:500;letter-spacing:.08em;background:var(--paper);padding:6px 14px;border-radius:20px}
.sec{padding:56px 0;border-top:1px solid var(--line)}.cols{display:grid;grid-template-columns:1fr 1fr;gap:56px}
.sec p{color:var(--muted);font-size:1.05rem;margin-bottom:12px}.sec dl{display:grid;grid-template-columns:auto 1fr;gap:8px 22px;font-size:1.02rem}.sec dt{font-weight:600}.sec dd{color:var(--muted)}
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:28px;margin-top:18px}.steps h3{font-size:1.1rem;font-weight:600;margin-bottom:6px}.steps p{font-size:.98rem}
.more{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:20px}.more a{text-decoration:none;display:flex;gap:16px;align-items:center;padding:14px;border:1px solid var(--line);border-radius:4px}.more a:hover{border-color:var(--esp)}
.more img{width:56px;height:70px;object-fit:contain}.more b{display:block;font-weight:600}.more span{font-size:.9rem;color:var(--muted)}
footer{background:var(--esp);color:#DAD6D0;padding:56px 0 36px;margin-top:40px}footer .wrap{display:grid;grid-template-columns:1.6fr 1fr 1fr;gap:40px}
footer h2{font-size:.74rem;letter-spacing:.24em;text-transform:uppercase;color:#fff;font-weight:500;margin-bottom:14px}footer a{display:block;text-decoration:none;margin-bottom:8px}footer a:hover{color:#fff}
footer .copy{grid-column:1/-1;border-top:1px solid #3a3633;padding-top:20px;font-size:.88rem;display:flex;justify-content:space-between}
@media(max-width:860px){.hero,.cols{grid-template-columns:1fr;gap:28px}.steps{grid-template-columns:1fr 1fr}.more{grid-template-columns:1fr}footer .wrap{grid-template-columns:1fr}body>nav .links a:not(.shop){display:none}.packbox{aspect-ratio:1/1}.packbox img{width:48%}}'''
TEXT_ACC = {'#86B52B': '#4E7314', '#E0962A': '#9A5C0E', '#D6392C': '#B92E22'}

def build_flavour(f):
    url = f"{SITE}/{f['slug']}/"; others = [o for o in FLAVOURS if o['slug'] != f['slug']]
    plain_h1 = re.sub('<[^>]+>', '', f['h1'])
    crumbs = {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": "Coconut chips", "item": SITE + "/#shop"},
        {"@type": "ListItem", "position": 3, "name": f['name'], "item": url}]}
    graph = {"@context": "https://schema.org", "@graph": [
        org(), product(f), crumbs,
        {"@type": "WebPage", "@id": url + "#webpage", "url": url, "name": f['title'], "description": f['desc'],
         "isPartOf": {"@type": "WebSite", "@id": SITE_ID, "name": "CocoCrisp", "url": SITE + "/"},
         "mainEntity": {"@id": url + "#product"}, "inLanguage": "en-IN"}]}
    head = head_common(f['title'], f['desc'], url, f"{SITE}/img/og/{f['slug']}.jpg",
                       f"CocoCrisp {f['name']} baked coconut chips, 50 g pouch", 'product')
    body = ''.join(f'<p>{esc(b)}</p>' for b in f['body'])
    more = ''.join(f'<a href="/{o["slug"]}/"><img src="/img/{o["slug"]}-thumb.webp?v={VER}" alt="" width="56" height="70" loading="lazy"><span><b>{o["name"]}</b><span>{o["kw"].capitalize()}</span></span></a>' for o in others)
    wa = 'https://wa.me/' + re.sub(r'\D', '', WHATSAPP) + '?text=' + 'Hi%2C%20I%20have%20a%20question%20about%20CocoCrisp.'
    flinks = ''.join(f'<a href="/{o["slug"]}/">{o["name"]}</a>' for o in FLAVOURS)
    page = f'''<!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
{head}<link rel="preload" as="image" href="/img/pack/{f['slug']}.webp?v={VER}" fetchpriority="high">
<style>{CSS}</style>
{ld(graph)}
</head>
<body style="--acc:{f['accent']};--acc-t:{TEXT_ACC.get(f['accent'], f['accent'])}">
<nav><div class="wrap"><a href="/" aria-label="CocoCrisp home"><img src="/brand/logo-mono.svg" alt="CocoCrisp" width="133" height="34" style="width:133px;height:34px"></a>
<div class="links"><a href="/#story">Our coconut</a><a href="/#faq">FAQ</a><a class="shop" href="/#shop">Shop all flavours</a></div></div></nav>
<main>
<div class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/#shop">Coconut chips</a> › <span aria-current="page">{f['name']}</span></nav>
<div class="hero">
<div class="packbox"><img src="/img/pack/{f['slug']}.webp?v={VER}" alt="CocoCrisp {f['name']} baked coconut chips, 50 g white pouch" width="500" height="750" fetchpriority="high"></div>
<div>
<span class="eyebrow">Baked coconut chips · {esc(f['tag'])}</span>
<h1>{f['h1']}</h1>
<p class="lead">{esc(f['lead'])}</p>
<div class="price"><b>₹{PRICE}</b><small>{PACK} pack</small><span class="launch">Launch price</span></div>
<a class="btn" href="/?add={f['slug']}#shop" rel="nofollow">Add to cart</a>
<p class="note">Online payment is launching soon. Bulk or gifting order? <a href="{wa}" target="_blank" rel="noopener">Message us on WhatsApp</a>.</p>
<ul class="badges"><li>Baked, not fried</li><li>Real coconut</li><li>{PACK} pack</li><li>Veg</li><li>FSSAI registered</li></ul>
</div>
</div>
</div>
<section class="sec"><div class="wrap cols">
<div><h2>About {f['name']} coconut chips</h2>{body}</div>
<div><h2>Ingredients &amp; details</h2><dl>
<dt>Ingredients</dt><dd>{esc(f['ingredients'])}</dd>
<dt>Allergens</dt><dd>Contains coconut (tree nut).</dd>
<dt>Flavour notes</dt><dd>{esc(f['notes'])}</dd>
<dt>Net weight</dt><dd>{PACK}</dd>
<dt>Price</dt><dd>₹{PRICE} per pack (launch price)</dd>
<dt>Storage</dt><dd>Store in a cool, dry place. Reseal after opening.</dd>
<dt>Good with</dt><dd>{esc(f['pair'])}</dd>
</dl><p style="margin-top:14px;font-size:.92rem">The full ingredient list and nutrition information are printed on every pack.</p></div>
</div></section>
<section class="sec"><div class="wrap">
<h2>How we make baked coconut chips</h2>
<div class="steps">
<div><h3>Pick &amp; peel</h3><p>Mature coconuts are opened and every trace of brown skin is pared away by hand.</p></div>
<div><h3>Slice thin</h3><p>The white flesh is cut into long, paper-thin ribbons so each chip bakes light and even.</p></div>
<div><h3>Flavour</h3><p>Slices are seasoned with salt or our spice blends, or rest in jaggery, to take on each flavour.</p></div>
<div><h3>Bake &amp; seal</h3><p>Slow-dried and toasted until golden, never fried, then sealed straight away to keep the crunch.</p></div>
</div></div></section>
<section class="sec"><div class="wrap">
<h2>More CocoCrisp flavours</h2>
<div class="more">{more}</div>
</div></section>
</main>
<footer><div class="wrap">
<div><img src="/brand/logo-mono-white.svg" alt="CocoCrisp" width="140" height="36" loading="lazy" style="height:36px;width:auto;margin-bottom:16px"><p>Baked coconut chips in Indian flavours.</p></div>
<div><h2>Flavours</h2>{flinks}</div>
<div><h2>Contact</h2><a href="{wa}" target="_blank" rel="noopener">WhatsApp us</a><a href="/#bulk">Wholesale enquiries</a><a href="/#faq">FAQ</a></div>
<div class="copy"><span>© {datetime.date.today().year} CocoCrisp</span><span>cococrisp.in</span></div>
</div></footer>
</body>
</html>
'''
    d = os.path.join(ROOT, f['slug']); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(page)
    print(f['slug'], len(f['title']), 'title chars,', len(f['desc']), 'desc chars')

def build_sitemap():
    urls = [(SITE + '/', '1.0')] + [(f"{SITE}/{f['slug']}/", '0.8') for f in FLAVOURS]
    x = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for u, pr in urls: x += f'  <url><loc>{u}</loc><lastmod>{TODAY}</lastmod><priority>{pr}</priority></url>\n'
    open(os.path.join(ROOT, 'sitemap.xml'), 'w').write(x + '</urlset>\n')
    open(os.path.join(ROOT, 'robots.txt'), 'w').write(
        'User-agent: *\nAllow: /\nDisallow: /*?add=\nDisallow: /shots/\nDisallow: /tools/\n\nSitemap: ' + SITE + '/sitemap.xml\n')

if __name__ == '__main__':
    build_index(); [build_flavour(f) for f in FLAVOURS]; build_sitemap()
