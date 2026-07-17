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

  /* --- gallery: RUN THE EXTRACTION SCRIPT AND PASTE URLS HERE --- */
  "g1":"", "g2":"", "g3":"", "g4":"", "g5":"", "g6":"",
  "g7":"", "g8":"", "g9":"", "g10":"", "g11":"", "g12":""
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

/* ---------- quote form (demo only) ----------
   NOTE FOR DANIEL: this demo shows the confirmation without sending.
   Wire it to a form handler (Formspree, GHL, Netlify Forms, etc.)
   before delivery, plus an instant email/text notification to Jeff. */
const form = document.querySelector('#quote-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    /* honeypot: bots fill the hidden field, humans never see it */
    if (form.querySelector('input[name="company"]').value) return;
    form.querySelector('.form-confirm').style.display = 'block';
    form.querySelector('button[type="submit"]').disabled = true;
  });
}

/* ---------- footer year ---------- */
document.querySelectorAll('.year').forEach(el => el.textContent = new Date().getFullYear());
