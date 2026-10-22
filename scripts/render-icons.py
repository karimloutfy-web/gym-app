# Renders the Rep Star icon set (see icon.svg). Usage: python3 scripts/render-icons.py .   (needs Pillow)
import math, sys
from PIL import Image, ImageDraw
BG=(0x11,0x1c,0x2b); TRACK=(0x1f,0x30,0x42); TEAL=(0x35,0xc8,0xb6); WHITE=(255,255,255)
def star_pts(cx, cy, R, ratio=0.46):
    return [(cx+(R if i%2==0 else R*ratio)*math.cos(math.radians(-90+i*36)), cy+(R if i%2==0 else R*ratio)*math.sin(math.radians(-90+i*36))) for i in range(10)]
def render(size, scale=1.0):
    """scale shrinks the artwork around the centre (for the maskable safe zone)"""
    S = 4096; k = S/1024
    im = Image.new("RGB", (S, S), BG); d = ImageDraw.Draw(im)
    def P(x, y): return (S/2 + (x-512)*k*scale, S/2 + (y-512)*k*scale)
    def L(v): return v*k*scale
    cx, cy = P(512, 512); r = L(330); w = L(64)
    d.ellipse([cx-r-w/2, cy-r-w/2, cx+r+w/2, cy+r+w/2], outline=TRACK, width=round(w))
    # progress arc: 300 degrees clockwise from 12 o'clock, round caps
    d.arc([cx-r-w/2, cy-r-w/2, cx+r+w/2, cy+r+w/2], start=-90, end=210, fill=TEAL, width=round(w))
    for ang in (-90, 210):
        ex, ey = cx + r*math.cos(math.radians(ang)), cy + r*math.sin(math.radians(ang))
        d.ellipse([ex-w/2, ey-w/2, ex+w/2, ey+w/2], fill=TEAL)
    pts = [P(x, y) for x, y in star_pts(512, 530, 165)]
    sw = L(44)
    d.polygon(pts, fill=WHITE)
    d.line(pts + [pts[0]], fill=WHITE, width=round(sw), joint="curve")
    for x, y in pts: d.ellipse([x-sw/2, y-sw/2, x+sw/2, y+sw/2], fill=WHITE)
    return im.resize((size, size), Image.LANCZOS)
out = sys.argv[1]
render(1024).save(f"{out}/icon-1024.png")                 # App Store (no transparency)
render(512).save(f"{out}/icon-512.png")
render(192).save(f"{out}/icon-192.png")
render(180).save(f"{out}/apple-touch-icon.png")
render(512, scale=0.86).save(f"{out}/icon-maskable-512.png")   # artwork inside the 80% safe circle
render(32).save(f"{out}/favicon-32.png")
print("ok")
