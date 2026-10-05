import { assets, brand, event } from "@/lib/event.config";
import {
  type Transform,
  drawFadedRule,
  drawGlyph,
  drawPixelHorizon,
  loadImage,
} from "./primitives";

export type IdentityInput = {
  /** The attendee's photo, already decoded. */
  photo: HTMLImageElement;
  /** Zoom / pan chosen in the cropper. */
  transform: Transform;
  name: string;
  role: string;
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
 * The four brand glyphs in a row  a compact signature for corners and
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
  ctx.save();
  ctx.font = `600 ${size}px ${
    getComputedStyle(document.documentElement).getPropertyValue("--font-sans") ||
    "sans-serif"
  }`;
  ctx.letterSpacing = `${size * 0.06}px`;
  ctx.fillStyle = brand.muted;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillText(`${event.dateLabel.toUpperCase()}  ·  ${event.timeLabel}`, x, y);
  ctx.textAlign = "right";
  ctx.fillStyle = brand.lime;
  ctx.fillText(event.venue.toUpperCase(), x + w, y);
  ctx.restore();
}
