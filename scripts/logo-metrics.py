#!/usr/bin/env python3
"""Prepare a sponsor logo for the Summit identity generator.

Takes a logo in more or less any form - white on transparent, dark on white,
light on black - and produces the white-on-transparent PNG the assets need,
then prints the typographic metrics to paste into `sponsors` in
`lib/event.config.ts`.

    python3 scripts/logo-metrics.py path/to/logo.png acme

Why the metrics: the strip cannot align logos on bounding box alone. One
wordmark has a descender and another does not; two of ours carry symbols that
overshoot the type. Scaling boxes to a common height therefore makes the
letterforms different sizes, and centring boxes leaves the baselines ragged.
So each logo is scaled to a common x-height and sat on a shared baseline, and
these two numbers are what make that possible.

Requires Pillow:  pip3 install pillow
"""

import os
import sys

from PIL import Image, ImageChops

OUT_DIR = os.path.join("public", "brand", "sponsors")


def detect_mode(im):
    """Guess whether the artwork sits on transparency, on white, or on black."""
    alpha = im.getchannel("A")
    lo, hi = alpha.getextrema()
    if lo < 250:
        return "alpha"
    # Opaque: compare the corners to decide light field vs dark field.
    w, h = im.size
    corners = [im.getpixel(p)[:3] for p in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1))]
    mean = sum(sum(c) / 3 for c in corners) / len(corners)
    return "on_light" if mean > 127 else "on_dark"


def dense_bbox(alpha, cutoff=40, min_px=2):
    """Bounding box ignoring rows/columns holding only a stray pixel or two."""
    px = alpha.load()
    w, h = alpha.size
    cols = [x for x in range(w) if sum(1 for y in range(h) if px[x, y] >= cutoff) >= min_px]
    rows = [y for y in range(h) if sum(1 for x in range(w) if px[x, y] >= cutoff) >= min_px]
    return (cols[0], rows[0], cols[-1] + 1, rows[-1] + 1) if cols and rows else alpha.getbbox()


def keyed(im, mode, floor=40, clamp=170):
    r, g, b, a = im.split()
    if mode == "alpha":
        alpha = a
    elif mode == "on_dark":
        alpha = ImageChops.lighter(ImageChops.lighter(r, g), b)
    else:
        alpha = ImageChops.invert(ImageChops.darker(ImageChops.darker(r, g), b))

    lo, hi = alpha.getextrema()
    if hi > lo:
        alpha = alpha.point(lambda v: int(255 * (v - lo) / (hi - lo)))
    # Compression noise leaves a faint haze that defeats the trim.
    alpha = alpha.point(lambda v: 0 if v < floor else v)
    # A coloured mark keyed off a flat field lands short of opaque and reads
    # grey beside type that keyed at 255; make solids solid, keep the ramp.
    alpha = alpha.point(lambda v: min(255, round(v * 255 / clamp)))
    return alpha


def metrics(alpha):
    """x-height and baseline, as fractions of the image height.

    Row ink peaks across the x-height band, because that is where most
    lowercase letters have mass. Taking the rows at or above 55% of that peak
    isolates the band; its lower edge is the baseline.
    """
    w, h = alpha.size
    px = alpha.load()
    rows = [sum(1 for x in range(w) if px[x, y] > 128) for y in range(h)]
    peak = max(rows)
    band = [y for y, v in enumerate(rows) if v >= peak * 0.55]
    top, bottom = band[0], band[-1]
    return (bottom - top + 1) / h, (bottom + 1) / h


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    src, name = sys.argv[1], sys.argv[2]

    im = Image.open(src).convert("RGBA")
    mode = detect_mode(im)
    alpha = keyed(im, mode)

    white = Image.new("RGBA", im.size, (255, 255, 255, 0))
    white.putalpha(alpha)
    white = white.crop(dense_bbox(alpha))

    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, name + ".png")
    white.save(out, optimize=True)

    x_height, baseline = metrics(white.getchannel("A"))
    print("read %s as %s" % (os.path.basename(src), mode))
    print("wrote %s  (%dx%d)" % (out, white.width, white.height))
    print()
    print("Add to `sponsors` in lib/event.config.ts:")
    print("  {")
    print('    name: "%s",' % name.capitalize())
    print('    url: "",')
    print('    logo: "/brand/sponsors/%s.png",' % name)
    print("    xHeight: %.3f," % x_height)
    print("    baseline: %.3f," % baseline)
    print("  },")
    print()
    print("That form assumes a SINGLE LINE of type.")
    print("If the logo is a bare symbol, or a stacked lockup with more than")
    print("one line, drop xHeight/baseline (they mean nothing in that case -")
    print("the measured band spans both lines) and use instead:")
    print()
    print("    align: \"block\",")
    print("    blockScale: 2.35,   // omit for a symbol; raise it for a stack")
    print()
    print("Check the result on black before shipping - white artwork is assumed.")


if __name__ == "__main__":
    main()
