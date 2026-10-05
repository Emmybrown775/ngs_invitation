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
  drawGlyphRow,
  drawLockup,
} from "./common";

/** 9:16 vertical for WhatsApp Status and Instagram Stories. */
export async function renderStory(input: IdentityInput): Promise<string> {
  await ensureFonts();
  const { w, h } = canvasSizes.story;
  const { canvas, ctx } = createCanvas(w, h);
  const pad = w * 0.095;

  drawBackdrop(ctx, w, h, { reach: 0.6, cell: Math.round(w / 30) });

  // Lockup, well clear of the platform's top chrome.
  const logoH = await drawLockup(ctx, w / 2, h * 0.095, w * 0.56);

  // Portrait.
  const photoSize = w * 0.62;
  const photoX = (w - photoSize) / 2;
  const photoY = h * 0.095 + logoH + h * 0.055;
  const radius = photoSize * 0.5; // circular on story

  drawGlow(ctx, w / 2, photoY + photoSize / 2, photoSize, brand.violet, 0.34);

  ctx.save();
  roundRect(ctx, photoX - 6, photoY - 6, photoSize + 12, photoSize + 12, radius + 6);
  ctx.strokeStyle = brandGradient(
    ctx,
    photoX,
    photoY,
    photoX + photoSize,
    photoY + photoSize,
  );
  ctx.lineWidth = 6;
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
  let y = photoY + photoSize + h * 0.055;
  drawFittedText(ctx, input.name, w / 2, y, w - pad * 2, {
    weight: 800,
    size: w * 0.068,
    minSize: w * 0.034,
    color: brand.cream,
  });
  if (input.role.trim()) {
    y += h * 0.028;
    drawFittedText(ctx, input.role, w / 2, y, w - pad * 2.2, {
      weight: 500,
      size: w * 0.031,
      minSize: w * 0.02,
      color: brand.lime,
    });
  }

  // Statement.
  y += h * 0.085;
  drawFittedText(ctx, "I'M ATTENDING", w / 2, y, w - pad * 2, {
    weight: 900,
    size: w * 0.085,
    color: brand.cream,
    letterSpacing: `${-w * 0.001}px`,
  });
  y += h * 0.044;
  drawFittedText(ctx, "NEXT GEN SUMMIT 26", w / 2, y, w - pad * 1.5, {
    weight: 900,
    size: w * 0.085,
    color: brand.lime,
    letterSpacing: `${-w * 0.001}px`,
  });

  // Keep the lower third readable over the horizon.
  const vig = ctx.createLinearGradient(0, h * 0.78, 0, h);
  vig.addColorStop(0, hexWithAlpha(brand.ink, 0));
  vig.addColorStop(1, hexWithAlpha(brand.ink, 0.8));
  ctx.fillStyle = vig;
  ctx.fillRect(0, h * 0.78, w, h * 0.22);

  // Date / venue pill.
  const pill = `${event.dateLabel.toUpperCase()}  ·  ${event.venueShort.toUpperCase()}`;
  ctx.save();
  // Venue names vary a lot in length, so size the type to the pill rather
  // than trusting one fixed value to fit.
  const pillMax = w - pad * 2;
  let pillSize = w * 0.028;
  ctx.letterSpacing = `${w * 0.005}px`;
  ctx.font = font("sans", 700, pillSize);
  while (ctx.measureText(pill).width + w * 0.09 > pillMax && pillSize > w * 0.016) {
    pillSize -= 1;
    ctx.font = font("sans", 700, pillSize);
  }
  const pillW = Math.min(pillMax, ctx.measureText(pill).width + w * 0.09);
  const pillH = w * 0.085;
  const pillY = h - pad * 2.1;
  roundRect(ctx, (w - pillW) / 2, pillY, pillW, pillH, pillH / 2);
  ctx.strokeStyle = brand.line;
  ctx.lineWidth = 2;
  ctx.fillStyle = hexWithAlpha(brand.surface, 0.9);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = brand.cream;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(pill, w / 2, pillY + pillH / 2 + 1);
  ctx.restore();

  // Glyph signature, centred at the very bottom.
  const rowSize = w * 0.038;
  const rowW = rowSize * 4 + rowSize * 0.34 * 3;
  drawGlyphRow(ctx, (w - rowW) / 2, h - pad * 0.8, rowSize);

  return canvas.toDataURL("image/png");
}
