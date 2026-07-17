/* ============================================================
   Strickland Brothers Construction LLC & Roofing — spec redesign
   All photography © Strickland Brothers Construction LLC,
   hotlinked from stricklandroofing.net's CDN (lirp.cdn-website.com).
   If they buy the site, download these files and self-host them.

   HOW TO SWAP A PHOTO: edit the URL on one line below. Done.
   Empty string = labeled placeholder renders instead.

   NOTE FOR DANIEL: their gallery images are lazy-loaded and could
   not be captured from here. Run tools/extract_site_assets.py
   against https://www.stricklandroofing.net/ on your machine and
   paste the gallery URLs into the g1–g12 slots.
   ============================================================ */
const PHOTOS = {
  /* --- brand --- */
  "logo":            "https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/logo+%282%29+less+space-367w.jpg",

  /* --- home --- */
  /* Their current hero background video (Pexels stock, already licensed on their site) */
  "home-intro":      "https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/photo-1506290690282-661fbd742be8-bc8a1edd-431w.jpg", /* stock (Unsplash) — already on their site */
  "home-commercial": "https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/commroofrep-696w.jpg",
  "home-residential":"https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/20200115_143135-678d20ed-696w.jpg", /* real jobsite photo */

  /* --- interior banners (reusing their strongest real photos) --- */
  "comm-banner":     "https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/commroofrep-696w.jpg",
  "resi-banner":     "https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/20200115_143135-678d20ed-696w.jpg",

  /* --- GAF section / footer --- */
  "gaf-shingles":    "https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/F-Wave+shingles-4--591h.jpg",

  /* --- gallery: extracted from their CDN via extract_site_assets.py --- */
  "g1":"https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/roofers-2880w.jpg",
  "g2":"https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/roof+inspector-2880w.jpg",
  "g3":"https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/commercial-roof-2880w.jpg",
  "g4":"https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/commroofrep-e938ef17-2880w.jpg",
  "g5":"https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/damage-28eb7447-f26507e8-7942879b-3b6fa6b4-2880w.jpg",
  "g6":"https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/house1-0cc35d79-2880w.jpg",
  "g7":"https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/20190919_115158-2880w.jpg",
  "g8":"https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/07927-2880w.JPG",
  "g9":"https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/07924-d83053a6-2880w.JPG",
  "g10":"https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/GAF-designer-shingles-c3b7-2880w.jpg",
  "g11":"https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/Screenshot_20231116_122948_Gallery-1920w.jpg",
  "g12":"https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/Screenshot_20231116_122923_Gallery-1920w.jpg"
};

const HERO_VIDEO = "https://vid.cdn-website.com/md/pexels/videos/culdesac-drone-footage-homes-houses-4770380-v.mp4";

/* ---------- photo slot hydration + placeholder fallback ---------- */
document.querySelectorAll('img[data-slot]').forEach(img => {
  const url = PHOTOS[img.dataset.slot];
  if (url) {
    img.referrerPolicy = 'no-referrer';   /* dodges hotlink blocking */
    img.src = url;
    img.addEventListener('error', () => swapToPlaceholder(img));
  } else {
    swapToPlaceholder(img);
  }
});

function swapToPlaceholder(img){
  const d = document.createElement('div');
  d.className = 'ph-fallback';
  d.textContent = img.dataset.label || 'Client photo goes here';
  img.replaceWith(d);
}

/* ---------- hero video ---------- */
const heroVid = document.querySelector('.hero video');
if (heroVid && HERO_VIDEO && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const src = document.createElement('source');
  src.src = HERO_VIDEO; src.type = 'video/mp4';
  heroVid.appendChild(src);
  heroVid.play().catch(()=>{});
}

/* ---------- mobile nav ---------- */
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

/* ---------- quote form (Formspree integration) ----------
   Formspree form ID: strickland-brothers-roofing
   Replace with client's own Formspree/GHL endpoint before launch. */
const form = document.querySelector('#quote-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    /* honeypot: bots fill the hidden field, humans never see it */
    if (form.querySelector('input[name="company"]').value) return;

    const formData = new FormData(form);

    try {
      const response = await fetch('https://formspree.io/f/xblbbqww', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      });

      if (response.ok) {
        form.querySelector('.form-confirm').style.display = 'block';
        form.querySelector('button[type="submit"]').disabled = true;
        form.reset();
      } else {
        alert('There was an error submitting your form. Please call us directly at (717) 226-4781.');
      }
    } catch (error) {
      alert('There was an error submitting your form. Please call us directly at (717) 226-4781.');
    }
  });
}

/* ---------- footer year ---------- */
document.querySelectorAll('.year').forEach(el => el.textContent = new Date().getFullYear());
