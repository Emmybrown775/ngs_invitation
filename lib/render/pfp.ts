import {
  brand,
  canvasSizes,
  event,
  participation,
} from "@/lib/event.config";
import {
  createCanvas,
  drawCoverInCircle,
  drawCurvedText,
  drawGlyph,
  ensureFonts,
} from "./primitives";
import { type IdentityInput, brandGradient, drawBackdrop } from "./common";

/**
 * The circular avatar badge: the attendee's photo inside a brand ring
 * carrying curved "ATTENDING NEXT GEN SUMMIT 26" text.
 */
export async function renderPfp(input: IdentityInput): Promise<string> {
  await ensureFonts();
  const { w, h } = canvasSizes.pfp;
  const { canvas, ctx } = createCanvas(w, h);
  const cx = w / 2;
  const cy = h / 2;

  drawBackdrop(ctx, w, h, { reach: 0.95, cell: Math.round(w / 40) });

  const outer = w * 0.472; // outer edge of the ring band
  const bandWidth = w * 0.112;
  const photoR = outer - bandWidth;

  // Ring band: a dark plate so the curved text stays legible over any photo.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, outer, 0, Math.PI * 2);
  ctx.fillStyle = brand.ink;
  ctx.fill();
  ctx.restore();

  // Gradient hairlines on both edges of the band.
  for (const r of [outer - 2, photoR + 2]) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = brandGradient(ctx, cx - r, cy - r, cx + r, cy + r);
    ctx.lineWidth = w * 0.007;
    ctx.stroke();
    ctx.restore();
  }

  // The portrait.
  drawCoverInCircle(ctx, input.photo, cx, cy, photoR, input.transform);

  // Curved text: event name across the top arc, year across the bottom.
  const textR = outer - bandWidth / 2;
  drawCurvedText(ctx, participation[input.participation].ringText, cx, cy, textR, {
    centerAngle: -Math.PI / 2,
    weight: 800,
    size: w * 0.046,
    color: brand.cream,
    letterSpacing: w * 0.004,
    // Stop at the side glyphs: a little under a half-turn.
    maxSweep: Math.PI * 0.82,
  });
  drawCurvedText(ctx, event.city.toUpperCase(), cx, cy, textR, {
    centerAngle: Math.PI / 2,
    weight: 700,
    size: w * 0.04,
    color: brand.lime,
    letterSpacing: w * 0.012,
    flip: true,
    maxSweep: Math.PI * 0.6,
  });

  // Brand glyphs at the two side gaps, separating the top and bottom text.
  const glyphSize = w * 0.055;
  const glyphR = textR;
  const sides: Array<[number, Parameters<typeof drawGlyph>[1], string]> = [
    [0, "asterisk", brand.magenta],
    [Math.PI, "asterisk", brand.cyan],
  ];
  for (const [angle, glyph, color] of sides) {
    drawGlyph(
      ctx,
      glyph,
      cx + Math.cos(angle) * glyphR - glyphSize / 2,
      cy + Math.sin(angle) * glyphR - glyphSize / 2,
      glyphSize,
      color,
    );
  }

  return canvas.toDataURL("image/png");
}
