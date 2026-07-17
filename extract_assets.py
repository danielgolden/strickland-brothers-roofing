#!/usr/bin/env python3
"""Extract assets from Strickland Roofing website"""
import urllib.request
import os
import ssl

# Disable SSL verification for some sites
ssl._create_default_https_context = ssl._create_unverified_context

# Create directories
os.makedirs("images", exist_ok=True)

# Images from the site
images = {
    "logo-large.jpg": "https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/logo+%282%29+less+space-1920w.jpg",
    "logo-small.jpg": "https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/logo+%282%29+less+space-367w.jpg",
    "hero-roof.jpg": "https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/photo-1506290690282-661fbd742be8-bc8a1edd-431w.jpg",
    "commercial-roof.jpg": "https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/commroofrep-696w.jpg",
    "residential-roof.jpg": "https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/20200115_143135-678d20ed-696w.jpg",
    "f-wave-shingles.jpg": "https://lirp.cdn-website.com/66a233cc/dms3rep/multi/opt/F-Wave+shingles-4--591h.jpg",
}

print("Downloading images...")
for filename, url in images.items():
    try:
        filepath = os.path.join("images", filename)
        urllib.request.urlretrieve(url, filepath)
        print(f"  ✓ {filename}")
    except Exception as e:
        print(f"  ✗ {filename}: {e}")

print("\nDone! Images saved to ./images/")
