"use client";

import { useCallback, useEffect, useRef } from "react";
import { brand } from "@/lib/event.config";
import {
  type Transform,
  drawCoverInRoundRect,
} from "@/lib/render/primitives";

const SIZE = 360;

/**
 * Live preview of the crop, drawn with the same `drawCover` maths the
 * exported assets use — so what the attendee frames here is exactly what
 * lands in the PNG. Drag to pan.
 */
export function CropPreview({
  photo,
  transform,
  onChange,
  round = false,
}: {
  photo: HTMLImageElement;
  transform: Transform;
  onChange: (next: Transform) => void;
  round?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number; t: Transform } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = brand.surface;
    ctx.fillRect(0, 0, SIZE, SIZE);
    drawCoverInRoundRect(
      ctx,
      photo,
      0,
      0,
      SIZE,
      SIZE,
      round ? SIZE / 2 : SIZE * 0.1,
      transform,
    );
  }, [photo, transform, round]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { x: e.clientX, y: e.clientY, t: transform };
    },
    [transform],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const start = drag.current;
      if (!start) return;
      // One preview-width of travel sweeps the full pan range.
      const dx = (e.clientX - start.x) / (SIZE / 2);
      const dy = (e.clientY - start.y) / (SIZE / 2);
      onChange({
        ...start.t,
        offsetX: Math.max(-1, Math.min(1, start.t.offsetX + dx)),
        offsetY: Math.max(-1, Math.min(1, start.t.offsetY + dy)),
      });
    },
    [onChange],
  );

  const endDrag = useCallback(() => {
    drag.current = null;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: SIZE, height: SIZE, touchAction: "none" }}
      className={`max-w-full cursor-grab active:cursor-grabbing ${
        round ? "rounded-full" : "rounded-[10%]"
      }`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      aria-label="Drag to reposition your photo"
    />
  );
}
