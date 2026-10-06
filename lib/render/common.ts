import {
  type Participation,
  assets,
  brand,
  event,
  sponsors,
} from "@/lib/event.config";
import {
  type Transform,
  drawFadedRule,
  drawGlyph,
  drawPixelHorizon,
  font,
  loadImage,
} from "./primitives";

export type IdentityInput = {
  /** The attendee's photo, already decoded. */
  photo: HTMLImageElement;
  /** Zoom / pan chosen in the cropper. */
  transform: Transform;
  name: string;
  role: string;
  /** Attending or volunteering \u2014 drives the wording on every asset. */
  participation: Participation;
};

/** The logo lockup is a PNG; cache the decode across all four renders. */
let lockupPromise: Promise<HTMLImageElement> | null = null;
export function loadLockup(): Promise<HTMLImageElement> {
  lockupPromise ??= loadImage(assets.logoLockup);
  return lockupPromise;
}

/**
 * Black field + the pixel-mosaic horizon rising from the bottom edge.
 * Every asset shares this so the set reads as one system.
 */
export function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: { intensity?: number; cell?: number; reach?: number } = {},
): void {
  ctx.fillStyle = brand.ink;
  ctx.fillRect(0, 0, w, h);
  drawPixelHorizon(ctx, 0, 0, w, h, {
    focusY: 1.04,
    reach: opts.reach ?? 0.86,
    cell: opts.cell ?? Math.round(w / 32),
    intensity: opts.intensity ?? 1,
  });
}

/** Draw the horizontal lockup centred on `cx`, at the given width. */
export async function drawLockup(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  width: number,
): Promise<number> {
  const logo = await loadLockup();
  const height = (logo.height / logo.width) * width;
  ctx.drawImage(logo, cx - width / 2, top, width, height);
  return height;
}

/**
 * The four brand glyphs in a row — a compact signature for corners and
 * footers where the full lockup would be too heavy.
 */
export function drawGlyphRow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  gap = size * 0.34,
): number {
  const step = size + gap;
  drawGlyph(ctx, "arch", x, y, size, brand.lime);
  drawGlyph(ctx, "g", x + step, y, size, brand.violet);
  drawGlyph(ctx, "asterisk", x + step * 2, y, size, brand.magenta);
  drawGlyph(ctx, "s", x + step * 3, y, size, brand.cyan);
  return step * 3 + size;
}

/** A four-stop brand gradient, used for rules and ring strokes. */
export function brandGradient(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): CanvasGradient {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, brand.lime);
  g.addColorStop(0.34, brand.violet);
  g.addColorStop(0.67, brand.magenta);
  g.addColorStop(1, brand.cyan);
  return g;
}

/** Date on the left, venue on the right, with a hairline above. */
export function drawFooterMeta(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  size: number,
): void {
  drawFadedRule(ctx, x, y - size * 1.6, w, brand.line);

  const left = `${event.dateLabel.toUpperCase()}  ·  ${event.timeLabel}`;
  const right = event.venueShort.toUpperCase();

  ctx.save();
  ctx.letterSpacing = `${size * 0.06}px`;
  // Shrink until the two ends clear each other with a gap between them —
  // venue and date strings are config, so their widths are not fixed.
  let s = size;
  const fits = () => {
    ctx.font = font("sans", 600, s);
    return (
      ctx.measureText(left).width + ctx.measureText(right).width + size * 2 <= w
    );
  };
  while (!fits() && s > size * 0.6) s -= 0.5;

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = brand.muted;
  ctx.textAlign = "left";
  ctx.fillText(left, x, y);
  ctx.textAlign = "right";
  ctx.fillStyle = brand.lime;
  ctx.fillText(right, x + w, y);
  ctx.restore();
}

/** Sponsor logos are PNGs; cache the decodes across all four renders. */
const sponsorLogos = new Map<string, Promise<HTMLImageElement>>();
function loadSponsorLogo(src: string): Promise<HTMLImageElement> {
  let p = sponsorLogos.get(src);
  if (!p) {
    p = loadImage(src);
    sponsorLogos.set(src, p);
  }
  return p;
}

/** Decode every sponsor logo once, up front. */
export async function preloadSponsorLogos(): Promise<void> {
  await Promise.all(
    sponsors.map((s) => loadSponsorLogo(s.logo).catch(() => null)),
  );
}

/**
 * A row of sponsor logos, centred, under a small "SPONSORED BY" label.
 *
 * Alignment is the whole job here. Matching logos on bounding-box height
 * looks wrong, because a box contains different things for each file: one
 * wordmark has a descender, another has none, and two of them carry symbols
 * that overshoot the type. So instead each logo is scaled to a common
 * **x-height** and sat on a shared **baseline**, using metrics measured from
 * the artwork. Symbols have no baseline, so they are centred on the x-height
 * band instead.
 *
 * The row is then scaled down as a whole until it fits `maxWidth`, which
 * keeps the relative weighting intact whatever the container.
 *
 * Returns the total height drawn, so callers can lay out above it.
 */
export async function drawSponsorStrip(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  maxWidth: number,
  opts: { xHeight: number; labelSize: number; gap?: number },
): Promise<number> {
  if (sponsors.length === 0) return 0;

  const label = "SPONSORED BY";
  const labelGap = opts.labelSize * 1.5;
  const gap = opts.gap ?? opts.xHeight * 2.2;
  /** How tall a symbol stands relative to the type's x-height. */
  const SYMBOL_SCALE = 1.8;

  const loaded = await Promise.all(
    sponsors.map(async (sponsor) => {
      try {
        return { sponsor, img: await loadSponsorLogo(sponsor.logo) };
      } catch {
        return null; // a missing file must not take the whole asset down
      }
    }),
  );
  const items = loaded.filter((x): x is NonNullable<typeof x> => x !== null);
  if (items.length === 0) return 0;

  const sized = items.map(({ sponsor, img }) => {
    const h = sponsor.markOnly
      ? opts.xHeight * SYMBOL_SCALE
      : opts.xHeight / sponsor.xHeight;
    const w = (img.width / img.height) * h;
    // Distance from the top of the drawn logo down to the shared baseline.
    const toBaseline = sponsor.markOnly
      ? h / 2 + opts.xHeight / 2 // centre the symbol on the x-height band
      : sponsor.baseline * h;
    return { img, w, h, toBaseline };
  });

  const naturalW =
    sized.reduce((sum, s) => sum + s.w, 0) + gap * (sized.length - 1);
  const scale = Math.min(1, maxWidth / naturalW);
  const rowW = naturalW * scale;

  // The band has to clear whatever rises highest above the baseline and
  // whatever hangs lowest below it.
  const above = Math.max(...sized.map((s) => s.toBaseline)) * scale;
  const below = Math.max(...sized.map((s) => s.h - s.toBaseline)) * scale;
  const rowH = above + below;

  ctx.save();
  ctx.font = font("sans", 600, opts.labelSize);
  ctx.letterSpacing = `${opts.labelSize * 0.22}px`;
  ctx.fillStyle = brand.muted;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(label, cx, top + opts.labelSize);
  ctx.restore();

  const baselineY = top + opts.labelSize + labelGap + above;
  let x = cx - rowW / 2;
  for (const item of sized) {
    const w = item.w * scale;
    const h = item.h * scale;
    ctx.drawImage(item.img, x, baselineY - item.toBaseline * scale, w, h);
    x += w + gap * scale;
  }

  return opts.labelSize + labelGap + rowH;
}
