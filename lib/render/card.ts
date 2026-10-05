import { brand, canvasSizes, event } from "@/lib/event.config";
import {
  createCanvas,
  drawCoverInRoundRect,
  drawFittedText,
  drawGlow,
  ensureFonts,
  font,
  hexWithAlpha,
  roundRect,
} from "./primitives";
import {
  type IdentityInput,
  brandGradient,
  drawBackdrop,
  drawFooterMeta,
  drawLockup,
} from "./common";

/** The 4:5 "I'm attending" card  the primary share asset. */
export async function renderCard(input: IdentityInput): Promise<string> {
  await ensureFonts();
  const { w, h } = canvasSizes.card;
  const { canvas, ctx } = createCanvas(w, h);
  const pad = w * 0.085;

  drawBackdrop(ctx, w, h, { reach: 0.52, intensity: 1, cell: Math.round(w / 30) });

  /*
   * Vertical rhythm is laid out top-down with explicit gaps. Each gap is
   * measured baseline-to-baseline, so it has to clear the cap height of the
   * type that follows  hence the generous step before the headline.
   */
  const logoTop = pad * 0.85;
  const logoH = await drawLockup(ctx, w / 2, logoTop, w * 0.5);

  const eyebrowY = logoTop + logoH + h * 0.055;
  drawFittedText(
    ctx,
    event.cardHeadline.toUpperCase(),
    w / 2,
    eyebrowY,
    w - pad * 2,
    {
      weight: 700,
      size: w * 0.026,
      color: brand.muted,
      letterSpacing: `${w * 0.008}px`,
    },
  );

  const headlineY = eyebrowY + h * 0.08;
  drawFittedText(ctx, "NEXT GEN SUMMIT 26", w / 2, headlineY, w - pad * 1.4, {
    weight: 900,
    size: w * 0.082,
    color: brand.cream,
    letterSpacing: `${-w * 0.0012}px`,
  });

  // Portrait.
  const photoSize = w * 0.5;
  const photoX = (w - photoSize) / 2;
  const photoY = headlineY + h * 0.032;
  const radius = photoSize * 0.14;

  drawGlow(ctx, w / 2, photoY + photoSize / 2, photoSize, brand.violet, 0.32);

  ctx.save();
  roundRect(ctx, photoX - 5, photoY - 5, photoSize + 10, photoSize + 10, radius + 5);
  ctx.strokeStyle = brandGradient(
    ctx,
    photoX,
    photoY,
    photoX + photoSize,
    photoY + photoSize,
  );
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();

  drawCoverInRoundRect(
    ctx,
    input.photo,
    photoX,
    photoY,
    photoSize,
    photoSize,
    radius,
    input.transform,
  );

  // Name + role.
  const hasRole = Boolean(input.role.trim());
  let y = photoY + photoSize + h * 0.068;
  drawFittedText(ctx, input.name, w / 2, y, w - pad * 2, {
    weight: 800,
    size: w * 0.06,
    minSize: w * 0.03,
    color: brand.cream,
  });

  if (hasRole) {
    y += h * 0.033;
    drawFittedText(ctx, input.role, w / 2, y, w - pad * 2.4, {
      weight: 500,
      size: w * 0.029,
      minSize: w * 0.019,
      color: brand.lime,
    });
  }

  // "I'M ATTENDING" chip.
  const chipLabel = "I'M ATTENDING";
  const chipH = w * 0.064;
  const chipY = y + h * 0.028;
  ctx.save();
  ctx.font = font("sans", 800, w * 0.025);
  ctx.letterSpacing = `${w * 0.008}px`;
  const chipW = ctx.measureText(chipLabel).width + w * 0.08;
  roundRect(ctx, (w - chipW) / 2, chipY, chipW, chipH, chipH / 2);
  ctx.fillStyle = brand.lime;
  ctx.fill();
  ctx.fillStyle = brand.accentInk;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(chipLabel, w / 2, chipY + chipH / 2 + 1);
  ctx.restore();

  // Keep the footer legible over the brightest part of the horizon.
  const vig = ctx.createLinearGradient(0, h * 0.8, 0, h);
  vig.addColorStop(0, hexWithAlpha(brand.ink, 0));
  vig.addColorStop(1, hexWithAlpha(brand.ink, 0.8));
  ctx.fillStyle = vig;
  ctx.fillRect(0, h * 0.8, w, h * 0.2);

  // Footer meta. The lockup already carries the glyphs, so no second mark.
  drawFooterMeta(ctx, pad, h - pad * 0.72, w - pad * 2, w * 0.021);

  return canvas.toDataURL("image/png");
}
