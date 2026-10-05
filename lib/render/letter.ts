import { brand, canvasSizes, event } from "@/lib/event.config";
import {
  createCanvas,
  drawCoverInCircle,
  drawFadedRule,
  drawFittedText,
  drawWrappedText,
  ensureFonts,
  font,
} from "./primitives";
import {
  type IdentityInput,
  brandGradient,
  drawBackdrop,
  drawGlyphRow,
  drawLockup,
} from "./common";

/** Formal A4 invitation letter, addressed to the attendee by name. */
export async function renderLetter(input: IdentityInput): Promise<string> {
  await ensureFonts();
  const { w, h } = canvasSizes.letter;
  const { canvas, ctx } = createCanvas(w, h);
  const pad = w * 0.105;
  const col = w - pad * 2;

  // A letter wants a calmer field than the card: keep the glow low and faint.
  drawBackdrop(ctx, w, h, { reach: 0.46, intensity: 0.5, cell: Math.round(w / 44) });

  // Gradient spine down the left edge.
  ctx.save();
  ctx.fillStyle = brandGradient(ctx, 0, 0, 0, h);
  ctx.fillRect(0, 0, w * 0.012, h);
  ctx.restore();

  // Letterhead.
  const logoH = await drawLockup(ctx, w / 2, pad * 0.72, w * 0.46);
  let y = pad * 0.72 + logoH + h * 0.045;

  drawFittedText(ctx, "OFFICIAL INVITATION", w / 2, y, col, {
    weight: 700,
    size: w * 0.019,
    color: brand.lime,
    letterSpacing: `${w * 0.009}px`,
  });

  y += h * 0.022;
  drawFadedRule(ctx, pad, y, col, brand.line);

  // Salutation.
  y += h * 0.055;
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = font("sans", 400, w * 0.028);
  ctx.fillStyle = brand.muted;
  ctx.fillText("Dear", pad, y);
  const dearW = ctx.measureText("Dear ").width;
  ctx.restore();

  drawFittedText(ctx, `${input.name},`, pad + dearW, y, col - dearW, {
    weight: 800,
    size: w * 0.038,
    minSize: w * 0.022,
    color: brand.cream,
    align: "left",
  });

  // Body.
  y += h * 0.05;
  const body =
    `It is our pleasure to invite you to ${event.fullName}, a gathering of the ` +
    `builders, founders and creatives shaping what comes next.\n\n` +
    `${event.tagline} This invitation admits you to a full day of talks, ` +
    `workshops and conversations with the people building the future of our ` +
    `industry  and to the room where those conversations keep going.\n\n` +
    `We look forward to welcoming you in ${event.city}.`;

  y = drawWrappedText(ctx, body, pad, y, col - w * 0.04, w * 0.042, {
    weight: 400,
    size: w * 0.0235,
    color: "#C7CDD4",
    align: "left",
  });

  // Attendee seal: portrait in a gradient ring, with name and role beside it.
  const sealR = w * 0.085;
  const sealX = pad + sealR;
  const sealY = y + h * 0.085;

  ctx.save();
  ctx.beginPath();
  ctx.arc(sealX, sealY, sealR + 7, 0, Math.PI * 2);
  ctx.strokeStyle = brandGradient(
    ctx,
    sealX - sealR,
    sealY - sealR,
    sealX + sealR,
    sealY + sealR,
  );
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();
  drawCoverInCircle(ctx, input.photo, sealX, sealY, sealR, input.transform);

  const infoX = sealX + sealR + w * 0.045;
  drawFittedText(ctx, input.name, infoX, sealY - w * 0.004, col - (infoX - pad), {
    weight: 800,
    size: w * 0.03,
    minSize: w * 0.018,
    color: brand.cream,
    align: "left",
  });
  if (input.role.trim()) {
    drawFittedText(
      ctx,
      input.role,
      infoX,
      sealY + w * 0.032,
      col - (infoX - pad),
      {
        weight: 500,
        size: w * 0.021,
        minSize: w * 0.014,
        color: brand.lime,
        align: "left",
      },
    );
  }

  // Detail block: date, time, venue.
  const detailY = sealY + sealR + h * 0.075;
  drawFadedRule(ctx, pad, detailY - h * 0.03, col, brand.line);

  const details: Array<[string, string]> = [
    ["DATE", event.dateLabel],
    ["TIME", event.timeLabel],
    ["VENUE", event.venue],
  ];
  const colW = col / details.length;
  details.forEach(([label, value], i) => {
    const x = pad + colW * i;
    drawFittedText(ctx, label, x, detailY, colW - w * 0.03, {
      weight: 700,
      size: w * 0.0145,
      color: brand.muted,
      letterSpacing: `${w * 0.005}px`,
      align: "left",
    });
    drawFittedText(ctx, value, x, detailY + h * 0.028, colW - w * 0.03, {
      weight: 700,
      size: w * 0.024,
      minSize: w * 0.014,
      color: brand.cream,
      align: "left",
    });
  });

  // Sign-off.
  const footY = h - pad * 0.78;
  drawGlyphRow(ctx, pad, footY - w * 0.055, w * 0.03);
  drawFittedText(ctx, event.hashtag, w - pad, footY - w * 0.02, col * 0.4, {
    weight: 700,
    size: w * 0.019,
    color: brand.muted,
    align: "right",
  });

  return canvas.toDataURL("image/png");
}
