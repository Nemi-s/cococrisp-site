# Shared SEO data for CocoCrisp (used by build-seo.py). Keep claims factual.
SITE = 'https://cococrisp.in'
PRICE = 49          # ₹ launch price per pack (keep in sync with app.js CONFIG.PRICE_PER_PACK)
PACK = '50 g'
WHATSAPP = '+91-97697-00512'
# schema.org Offer availability. Online payment is not live yet, so we leave availability OUT
# (honest: price is real, but a visitor cannot complete a purchase today).
# When Razorpay goes live and stock is ready, set to 'https://schema.org/InStock' and rebuild.
AVAILABILITY = None

FLAVOURS = [
  dict(slug='classic-salted', name='Classic Salted', accent='#1F5FA8', tag='Savoury', notes='Coconut · Salt',
       kw='salted coconut chips',
       title='Classic Salted Coconut Chips, Baked Not Fried | CocoCrisp',
       desc='CocoCrisp Classic Salted: thin slices of real coconut, baked crisp and finished with a pinch of salt. Baked, not fried. 50 g pack, ₹49 launch price.',
       h1='Classic Salted <em>coconut chips</em>',
       lead='Just coconut and a pinch of salt. Thin slices of real coconut, baked until crisp, for anyone who likes their chips namkeen.',
       body=['Classic Salted is the simplest CocoCrisp: mature coconut, pared of its brown skin, sliced paper-thin, seasoned with salt and baked until golden. There is no frying at any stage.',
             'It is the one to start with if you are new to coconut chips: clean, crunchy and savoury, with the natural taste of toasted coconut.'],
       ingredients='Coconut, Salt.', pair='Chai, a mid-afternoon break, or a handful straight from the pouch.'),
  dict(slug='masala', name='Masala', accent='#D6392C', tag='Tangy & spiced', notes='Chilli · Amchur · Kala namak',
       kw='masala coconut chips',
       title='Masala Coconut Chips, Baked Chatpata Snack | CocoCrisp',
       desc='CocoCrisp Masala coconut chips: real coconut slices, baked crisp and tossed in a tangy Indian masala with chilli, amchur and black salt. 50 g, ₹49.',
       h1='Masala <em>coconut chips</em>',
       lead='Chatpata, in a refined way. Thin slices of real coconut, baked crisp and tossed in a tangy Indian masala.',
       body=['Our Masala coconut chips bring the flavours of a good chaat to a baked snack: red chilli warmth, tangy amchur (dry mango) and the savoury depth of kala namak (black salt).',
             'Like every CocoCrisp flavour, the coconut is sliced thin and baked, never fried.'],
       ingredients='Coconut, Spice mix (Red chilli, Coriander, Cumin, Turmeric, Black salt, Dry mango), Salt.', pair='Evening chai, movie nights and long drives.'),
  dict(slug='chilli-lime', name='Chilli Lime', accent='#86B52B', tag='Zesty', notes='Red chilli · Lime',
       kw='chilli lime coconut chips',
       title='Chilli Lime Coconut Chips, Baked Not Fried | CocoCrisp',
       desc='CocoCrisp Chilli Lime coconut chips: thin slices of real coconut, baked crisp with chilli flakes and a squeeze of lime. Baked, not fried. 50 g pack, ₹49.',
       h1='Chilli Lime <em>coconut chips</em>',
       lead='Bright lime and a clean chilli warmth over toasted coconut. Thin slices of real coconut, baked crisp.',
       body=['Chilli Lime pairs the gentle sweetness of toasted coconut with chilli flakes and a sharp, citrusy lime finish.',
             'The slices are cut thin and baked until crisp, never fried, so every chip stays light and crunchy.'],
       ingredients='Coconut, Chilli flakes, Lime (Citric acid), Salt.', pair='Chai time, road trips and good company.'),
  dict(slug='jaggery-elaichi', name='Jaggery Elaichi', accent='#E0962A', tag='Sweet', notes='Gur · Cardamom',
       kw='jaggery coconut chips',
       title='Jaggery Elaichi Coconut Chips, Sweet & Baked | CocoCrisp',
       desc='CocoCrisp Jaggery Elaichi: real coconut slices baked crisp with a light jaggery (gur) glaze and green cardamom. Baked, not fried. 50 g pack, ₹49.',
       h1='Jaggery Elaichi <em>coconut chips</em>',
       lead='Golden coconut glazed in jaggery with a warm note of green cardamom. Familiar, festive and quietly moreish.',
       body=['Jaggery Elaichi is our sweet coconut chip: thin slices of real coconut rested in jaggery (gur), finished with green cardamom (elaichi) and baked until golden and crisp.',
             'It tastes of Indian festive sweets, in a light, crunchy, baked snack.'],
       ingredients='Coconut, Jaggery, Cardamom.', pair='After a meal, with coffee, or in a festive gift box.'),
]
