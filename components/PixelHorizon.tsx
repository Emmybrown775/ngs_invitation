"use client";

import { useEffect, useRef } from "react";
import { brand } from "@/lib/event.config";
import { drawPixelHorizon } from "@/lib/render/primitives";

/**
 * The page backdrop, drawn with the very same routine the exported PNGs
 * use — so the site and the assets people download are the same artwork.
 */
export function PixelHorizon() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = brand.ink;
      ctx.fillRect(0, 0, w, h);
      drawPixelHorizon(ctx, 0, 0, w, h, {
        focusY: 1.06,
        reach: 0.88,
        cell: w < 640 ? 18 : 30,
        intensity: 1,
      });
    };

    draw();
    // Ignore the keyboard-driven resizes mobile browsers fire on focus.
    let last = window.innerWidth;
    const onResize = () => {
      if (Math.abs(window.innerWidth - last) < 2) return;
      last = window.innerWidth;
      draw();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", draw);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", draw);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
