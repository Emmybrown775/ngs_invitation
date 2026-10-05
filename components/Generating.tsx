"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Framing your portrait…",
  "Printing your attending card…",
  "Signing your invitation…",
  "Wrapping it all up…",
];

export function Generating() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => Math.min(s + 1, STEPS.length - 1)),
      900,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex flex-col items-center gap-6"
      role="status"
      aria-live="polite"
    >
      <div className="ngs-spin h-12 w-12 rounded-full border-2 border-white/10 border-t-lime" />
      <p className="text-sm text-muted">{STEPS[step]}</p>
    </div>
  );
}
