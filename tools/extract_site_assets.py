#!/usr/bin/env python3
"""
extract_site_assets.py — harvest every image, the favicon, and the logo from a site.

Run this on YOUR machine (Claude's sandbox can't reach arbitrary domains), then
paste the JSON back into the conversation.

    python3 extract_site_assets.py https://example.com > site-assets.json

Options:
    --max-pages N   how many same-domain pages to crawl (default 15)
    --quiet         suppress progress output on stderr

Standard library only — no pip install needed. Python 3.8+.
"""

import argparse
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " \
     "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"

SKIP_EXT = (".pdf", ".zip", ".doc", ".docx", ".xls", ".xlsx", ".mp4", ".mov")
IMG_EXT = (".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif")

# Images that are chrome, not content — usually worthless for a redesign.
JUNK_PAT = re.compile(
    r"(spacer|blank|pixel|1x1|loader|spinner|arrow|bullet|divider|"
    r"facebook|twitter|instagram|linkedin|youtube|yelp|houzz|"
    r"captcha|recaptcha|emoji|wp-emoji|gravatar)",
    re.I,
)


def fetch(url, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        charset = r.headers.get_content_charset() or "utf-8"
        return r.read().decode(charset, errors="replace")


def clean(u, base):
    """Absolutize, strip fragments/queries, drop WP size suffixes."""
    if not u:
        return None
    u = u.strip()
    if u.startswith(("data:", "javascript:", "mailto:", "tel:")):
        return None
    u = urllib.parse.urljoin(base, u)
    u, _ = urllib.parse.urldefrag(u)
    # my-photo-300x200.jpg -> my-photo.jpg (grab the full-size original)
    u = re.sub(r"-\d{2,4}x\d{2,4}(\.(?:jpg|jpeg|png|webp|gif|avif))$", r"\1", u, flags=re.I)
    return u


class SiteParser(HTMLParser):
    def __init__(self, base):
        super().__init__(convert_charrefs=True)
        self.base = base
        self.links = []
        self.images = []      # (url, alt)
        self.favicons = []
        self.logo = None
        self.title = ""
        self._in_title = False
        # rough section tracking: last heading seen before an image
        self.section = ""
        self._in_heading = False
        self._heading_buf = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "title":
            self._in_title = True
        elif tag in ("h1", "h2", "h3"):
            self._in_heading = True
            self._heading_buf = []
        elif tag == "a" and a.get("href"):
            u = clean(a["href"], self.base)
            if u:
                self.links.append(u)
        elif tag == "link":
            rel = (a.get("rel") or "").lower()
            if "icon" in rel and a.get("href"):
                u = clean(a["href"], self.base)
                if u:
                    self.favicons.append(u)
        elif tag == "meta":
            if a.get("property") in ("og:image", "og:image:url") and a.get("content"):
                u = clean(a["content"], self.base)
                if u:
                    self.images.append((u, "og:image"))
        elif tag == "img":
            src = a.get("src") or a.get("data-src") or a.get("data-lazy-src")
            u = clean(src, self.base)
            if u:
                alt = (a.get("alt") or "").strip()
                self.images.append((u, alt))
                blob = " ".join(filter(None, [u, alt, a.get("class", ""), a.get("id", "")]))
                if self.logo is None and re.search(r"logo|brand|header", blob, re.I):
                    self.logo = u
            # srcset: take the widest candidate
            ss = a.get("srcset") or a.get("data-srcset")
            if ss:
                best, best_w = None, -1
                for cand in ss.split(","):
                    parts = cand.strip().split()
                    if not parts:
                        continue
                    w = 0
                    if len(parts) > 1 and parts[1].endswith("w"):
                        try:
                            w = int(parts[1][:-1])
                        except ValueError:
                            w = 0
                    if w > best_w:
                        best, best_w = parts[0], w
                u2 = clean(best, self.base)
                if u2:
                    self.images.append((u2, (a.get("alt") or "").strip()))

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        elif tag in ("h1", "h2", "h3"):
            self._in_heading = False
            self.section = " ".join(self._heading_buf).strip()

    def handle_data(self, data):
        if self._in_title:
            self.title += data.strip()
        if self._in_heading:
            self._heading_buf.append(data.strip())


def css_backgrounds(html, base):
    out = []
    for m in re.finditer(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)", html, re.I):
        u = clean(m.group(1), base)
        if u and u.lower().endswith(IMG_EXT):
            out.append(u)
    return out


def same_host(u, host):
    try:
        return urllib.parse.urlparse(u).netloc.replace("www.", "") == host
    except ValueError:
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("--max-pages", type=int, default=15)
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    start = args.url if args.url.startswith("http") else "https://" + args.url
    host = urllib.parse.urlparse(start).netloc.replace("www.", "")

    def log(*a):
        if not args.quiet:
            print(*a, file=sys.stderr)

    queue = [start]
    seen_pages = set()
    records = []
    seen_imgs = set()
    favicons = []
    logo = None
    site_name = ""

    while queue and len(seen_pages) < args.max_pages:
        page = queue.pop(0)
        norm = page.rstrip("/")
        if norm in seen_pages or page.lower().endswith(SKIP_EXT):
            continue
        seen_pages.add(norm)

        try:
            html = fetch(page)
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError) as e:
            log(f"  ! skipped {page} ({e})")
            continue

        p = SiteParser(page)
        try:
            p.feed(html)
        except Exception as e:  # malformed markup shouldn't kill the crawl
            log(f"  ~ parse warning on {page}: {e}")

        log(f"  · {page}  ({len(p.images)} imgs)")
        if not site_name and p.title:
            site_name = p.title
        favicons.extend(p.favicons)
        if logo is None and p.logo:
            logo = p.logo

        for u, alt in p.images + [(b, "") for b in css_backgrounds(html, page)]:
            if not u.lower().endswith(IMG_EXT) or JUNK_PAT.search(u):
                continue
            if u == logo or u in seen_imgs:
                continue
            seen_imgs.add(u)
            records.append({
                "page_url": page,
                "page_title": p.title,
                "image_url": u,
                "alt_text": alt,
                "section": p.section,
                "context": "",
                "id": len(records) + 1,
            })

        for l in p.links:
            if same_host(l, host) and l.rstrip("/") not in seen_pages:
                if not l.lower().endswith(SKIP_EXT + IMG_EXT):
                    queue.append(l)

    if not favicons:
        favicons = [urllib.parse.urljoin(start, "/favicon.ico")]

    out = {
        "site": host,
        "site_name": site_name,
        "pages_crawled": sorted(seen_pages),
        "favicon_url": favicons[0],
        "favicon_candidates": sorted(set(favicons)),
        "logo_url": logo,
        "total_images": len(records),
        "images": records,
    }
    log(f"\n{len(records)} images across {len(seen_pages)} pages. Logo: {logo or 'not found'}")
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
