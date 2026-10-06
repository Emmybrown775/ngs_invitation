/**
 * Canvas drawing primitives shared by every asset renderer.
 * Everything here runs in the browser only — no uploaded photo ever
 * leaves the device.
 */

import { brand } from "@/lib/event.config";

export type Transform = {
  /** 1 = fit, >1 = zoomed in. */
  zoom: number;
  /** -1..1, fraction of the overflow available on each axis. */
  offsetX: number;
  offsetY: number;
};

export const identityTransform: Transform = { zoom: 1, offsetX: 0, offsetY: 0 };

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src}`));
    img.src = src;
  });
}

/* ------------------------------------------------------------------ fonts */

/**
 * next/font generates hashed family names, so canvas has to read the real
 * value back off the document rather than hardcoding a family string.
 */
export function fontStack(which: "display" | "sans" | "mono"): string {
  if (typeof window === "undefined") return "serif";
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--font-${which}`)
    .trim();
  return value || (which === "display" ? "serif" : "sans-serif");
}

export function font(
  which: "display" | "sans" | "mono",
  weight: number,
  size: number,
): string {
  return `${weight} ${size}px ${fontStack(which)}`;
}

/**
 * next/font only fetches a face once something on the page uses it, and
 * canvas draws do not count. Prime every face we are about to draw with.
 */
export async function ensureFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const specs = [
    font("display", 400, 64),
    font("display", 600, 64),
    font("sans", 400, 32),
    font("sans", 500, 32),
    font("sans", 600, 32),
    font("sans", 700, 32),
    font("mono", 500, 32),
  ];
  await Promise.all(
    specs.map((spec) => document.fonts.load(spec).catch(() => undefined)),
  );
  await document.fonts.ready;
}

/* ------------------------------------------------------------------ shapes */

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Draw `img` so it covers the box completely (object-fit: cover), honouring
 * the user's zoom and pan from the cropper.
 */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  t: Transform = identityTransform,
): void {
  const scale = Math.max(w / img.width, h / img.height) * t.zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;
  // Overflow is what is available to pan through on each axis.
  const slackX = Math.max(0, dw - w) / 2;
  const slackY = Math.max(0, dh - h) / 2;
  const dx = x + (w - dw) / 2 + slackX * t.offsetX;
  const dy = y + (h - dh) / 2 + slackY * t.offsetY;
  ctx.drawImage(img, dx, dy, dw, dh);
}

export function drawCoverInCircle(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  r: number,
  t: Transform = identityTransform,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  drawCover(ctx, img, cx - r, cy - r, r * 2, r * 2, t);
  ctx.restore();
}

export function drawCoverInRoundRect(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  t: Transform = identityTransform,
): void {
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  drawCover(ctx, img, x, y, w, h, t);
  ctx.restore();
}

/* -------------------------------------------------------------------- text */

/** Shrink `size` until the string fits `maxWidth`, then draw it. */
export function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  opts: {
    which?: "display" | "sans" | "mono";
    weight?: number;
    size: number;
    minSize?: number;
    color?: string;
    align?: CanvasTextAlign;
    letterSpacing?: string;
  },
): number {
  const which = opts.which ?? "sans";
  const weight = opts.weight ?? 500;
  const min = opts.minSize ?? 12;
  let size = opts.size;
  ctx.save();
  if (opts.letterSpacing) ctx.letterSpacing = opts.letterSpacing;
  ctx.font = font(which, weight, size);
  while (ctx.measureText(text).width > maxWidth && size > min) {
    size -= 1;
    ctx.font = font(which, weight, size);
  }
  ctx.fillStyle = opts.color ?? brand.cream;
  ctx.textAlign = opts.align ?? "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y);
  ctx.restore();
  return size;
}

/** Greedy word wrap. Returns the y of the baseline after the last line. */
export function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  opts: {
    which?: "display" | "sans" | "mono";
    weight?: number;
    size: number;
    color?: string;
    align?: CanvasTextAlign;
    maxLines?: number;
  },
): number {
  ctx.save();
  ctx.font = font(opts.which ?? "sans", opts.weight ?? 400, opts.size);
  ctx.fillStyle = opts.color ?? brand.cream;
  ctx.textAlign = opts.align ?? "left";
  ctx.textBaseline = "alphabetic";

  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }

  const shown = opts.maxLines ? lines.slice(0, opts.maxLines) : lines;
  let cursor = y;
  for (const line of shown) {
    ctx.fillText(line, x, cursor);
    cursor += lineHeight;
  }
  ctx.restore();
  return cursor - lineHeight;
}

/**
 * Lay text around a circle, centred on `startAngle` (radians, 0 = 3 o'clock).
 * `flip` draws the glyphs upright for text running along the bottom arc.
 */
export function drawCurvedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  opts: {
    centerAngle: number;
    which?: "display" | "sans" | "mono";
    weight?: number;
    size: number;
    color?: string;
    letterSpacing?: number;
    flip?: boolean;
    /** Largest arc the text may span, in radians. */
    maxSweep?: number;
  },
): void {
  ctx.save();
  const which = opts.which ?? "sans";
  const weight = opts.weight ?? 600;
  let size = opts.size;
  let extra = opts.letterSpacing ?? 0;
  ctx.font = font(which, weight, size);

  const measure = () => {
    const chars = [...text];
    const widths = chars.map((c) => ctx.measureText(c).width + extra);
    return { chars, widths, total: widths.reduce((a, b) => a + b, 0) };
  };

  /*
   * Longer strings sweep further around the ring and run into whatever sits
   * at the sides. Shrink until the sweep fits the allowance, so a short
   * label and a long one both sit inside the same arc.
   */
  let m = measure();
  if (opts.maxSweep) {
    const minSize = opts.size * 0.6;
    while (m.total / radius > opts.maxSweep && size > minSize) {
      size -= 0.5;
      extra = (opts.letterSpacing ?? 0) * (size / opts.size);
      ctx.font = font(which, weight, size);
      m = measure();
    }
  }

  ctx.fillStyle = opts.color ?? brand.cream;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const { chars, widths, total } = m;
  // Arc length -> angle. Flipped text reads clockwise in the other direction.
  const dir = opts.flip ? -1 : 1;
  let angle = opts.centerAngle - (dir * total) / (2 * radius);

  chars.forEach((char, i) => {
    const step = widths[i] / radius;
    const mid = angle + (dir * step) / 2;
    ctx.save();
    ctx.translate(cx + Math.cos(mid) * radius, cy + Math.sin(mid) * radius);
    ctx.rotate(mid + (opts.flip ? -Math.PI / 2 : Math.PI / 2));
    ctx.fillText(char, 0, 0);
    ctx.restore();
    angle += dir * step;
  });
  ctx.restore();
}

/* ---------------------------------------------------------------- textures */

/** Mix two hex colours. `t` runs 0 (a) -> 1 (b). */
export function mixHex(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const c = hex.replace("#", "");
    const n = parseInt(
      c.length === 3
        ? c
            .split("")
            .map((ch) => ch + ch)
            .join("")
        : c,
      16,
    );
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const k = Math.max(0, Math.min(1, t));
  return `rgb(${Math.round(r1 + (r2 - r1) * k)}, ${Math.round(
    g1 + (g2 - g1) * k,
  )}, ${Math.round(b1 + (b2 - b1) * k)})`;
}

/** Deterministic hash -> 0..1, so a given cell always gets the same jitter. */
function cellNoise(c: number, r: number): number {
  const n = Math.sin(c * 127.1 + r * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * The NGS signature: a mosaic of square pixels glowing pale blue up out of
 * black, as on the official profile picture, X banner and teaser. Drawn
 * procedurally so the renderers carry no image dependency.
 */
export function drawPixelHorizon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: {
    /** Light source, as a fraction of the box. Default: just off the bottom. */
    focusX?: number;
    focusY?: number;
    /** How far the glow reaches, as a fraction of the box height. */
    reach?: number;
    /** Square size in px. Defaults to ~1/34 of the width. */
    cell?: number;
    /** Overall opacity ceiling. */
    intensity?: number;
  } = {},
): void {
  const fx = x + w * (opts.focusX ?? 0.5);
  const fy = y + h * (opts.focusY ?? 1.02);
  const reach = h * (opts.reach ?? 0.92);
  const cell = opts.cell ?? Math.max(6, Math.round(w / 34));
  const intensity = opts.intensity ?? 1;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const cols = Math.ceil(w / cell);
  const rows = Math.ceil(h / cell);

  for (let r = 0; r < rows; r += 1) {
    // The official art reads as distinct horizontal bands, so give every
    // row a constant multiplier on top of the radial falloff.
    const band = 0.82 + 0.18 * cellNoise(0, r);
    for (let c = 0; c < cols; c += 1) {
      const px = x + c * cell;
      const py = y + r * cell;
      const dx = px + cell / 2 - fx;
      const dy = py + cell / 2 - fy;
      // Squash vertically: the glow is wider than it is tall.
      const dist = Math.hypot(dx * 0.72, dy) / reach;
      if (dist >= 1) continue;

      let t = (1 - dist) ** 2.1;
      t *= band * (0.86 + 0.28 * cellNoise(c, r));
      const alpha = Math.min(1, t * intensity);
      if (alpha < 0.012) continue;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = mixHex(brand.glowFar, brand.glowNear, t);
      ctx.fillRect(px, py, cell + 0.6, cell + 0.6);
    }
  }
  ctx.restore();
}

/**
 * The four logo glyphs drawn as vector shapes, so they can be scaled,
 * recoloured and scattered without loading the logo PNG.
 * Each draws inside a unit box at (x, y, size, size).
 */
export type Glyph = "arch" | "g" | "asterisk" | "s";

export function drawGlyph(
  ctx: CanvasRenderingContext2D,
  glyph: Glyph,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.translate(x, y);
  const u = size;

  if (glyph === "arch") {
    // Semicircular top on a square base — the "N".
    ctx.beginPath();
    ctx.moveTo(0, u);
    ctx.lineTo(0, u * 0.5);
    ctx.arc(u * 0.5, u * 0.5, u * 0.5, Math.PI, 0);
    ctx.lineTo(u, u);
    ctx.closePath();
    ctx.fill();
  } else if (glyph === "g") {
    /*
     * Blocky G: rounded on the left, flat on the right, with the jaw slot
     * cut out of the right edge. The slot is a second subpath filled with
     * the even-odd rule — `destination-out` would punch a hole through
     * everything already on the canvas, not just this glyph.
     *
     * Canvas angles: -PI/2 is 12 o'clock and PI/2 is 6 o'clock, so sweeping
     * clockwise from PI/2 to 3PI/2 traces bottom -> left -> top, which is
     * the rounded side we want.
     */
    ctx.beginPath();
    ctx.moveTo(u, u);
    ctx.lineTo(u * 0.5, u);
    ctx.arc(u * 0.5, u * 0.5, u * 0.5, Math.PI / 2, Math.PI * 1.5);
    ctx.lineTo(u, 0);
    ctx.closePath();
    // Jaw slot, open to the right edge.
    ctx.moveTo(u * 1.02, u * 0.4);
    ctx.lineTo(u * 0.52, u * 0.4);
    ctx.lineTo(u * 0.52, u * 0.58);
    ctx.lineTo(u * 1.02, u * 0.58);
    ctx.closePath();
    ctx.fill("evenodd");
  } else if (glyph === "asterisk") {
    // Six-armed asterisk.
    ctx.translate(u / 2, u / 2);
    const arm = u * 0.5;
    const thick = u * 0.235;
    for (let i = 0; i < 3; i += 1) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 3);
      ctx.fillRect(-arm, -thick / 2, arm * 2, thick);
      ctx.restore();
    }
  } else {
    /*
     * S: two horizontal stadiums, top-left and bottom-right, forming a step.
     * They must overlap *vertically* to merge — stacked flush at the
     * midline each pill has tapered to its end cap there, so they meet at a
     * point and read as two separate blobs.
     */
    const tall = u * 0.58;
    const r = tall / 2;
    roundRect(ctx, 0, 0, u * 0.72, tall, r);
    ctx.fill();
    roundRect(ctx, u * 0.28, u - tall, u * 0.72, tall, r);
    ctx.fill();
  }
  ctx.restore();
}

/** The 2x2 logo mark, drawn as vectors at (x, y) with total width `size`. */
export function drawLogoGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  gap = size * 0.08,
): void {
  const cell = (size - gap) / 2;
  drawGlyph(ctx, "arch", x, y, cell, brand.lime);
  drawGlyph(ctx, "g", x + cell + gap, y, cell, brand.violet);
  drawGlyph(ctx, "asterisk", x, y + cell + gap, cell, brand.magenta);
  drawGlyph(ctx, "s", x + cell + gap, y + cell + gap, cell, brand.cyan);
}

/** Soft radial glow, used to lift subjects off the background. */
export function drawGlow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  alpha = 0.35,
): void {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  g.addColorStop(0, hexWithAlpha(color, alpha));
  g.addColorStop(1, hexWithAlpha(color, 0));
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.restore();
}

export function hexWithAlpha(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const n = parseInt(
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean,
    16,
  );
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Hairline divider with a fade at both ends. */
export function drawFadedRule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  color = brand.line,
): void {
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, hexWithAlpha(color, 0));
  g.addColorStop(0.5, hexWithAlpha(color, 1));
  g.addColorStop(1, hexWithAlpha(color, 0));
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, 1.5);
  ctx.restore();
}

/** Create a correctly-sized 2D context and return it with its canvas. */
export function createCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.textRendering = "optimizeLegibility";
  return { canvas, ctx };
}
