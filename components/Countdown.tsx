"use client";

import { useMemo, useSyncExternalStore } from "react";
import { event } from "@/lib/event.config";

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown() {
  const target = useMemo(() => new Date(event.startsAt).getTime(), []);

  /*
   * The clock is an external, always-changing value, so it belongs in
   * useSyncExternalStore rather than an effect that calls setState. The
   * server snapshot is null, which is also what React uses for the
   * hydration pass  so the markup matches and only then does the live
   * value take over.
   *
   * The snapshot must be a primitive: returning a fresh object every call
   * would make React think the store changed on every render.
   */
  const secondsLeft = useSyncExternalStore(
    subscribe,
    () => Math.max(0, Math.floor((target - Date.now()) / 1000)),
    () => null,
  );

  const label =
    secondsLeft === null
      ? ""
      : `${Math.floor(secondsLeft / 86400)}d : ${pad(
          Math.floor((secondsLeft % 86400) / 3600),
        )}h : ${pad(Math.floor((secondsLeft % 3600) / 60))}m : ${pad(
          secondsLeft % 60,
        )}s`;

  return (
    <span
      className="font-mono text-[0.78rem] tabular-nums tracking-tight text-muted sm:text-sm"
      aria-label="Time until the summit"
    >
      {label}
    </span>
  );
}
