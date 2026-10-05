"use client";

import Image from "next/image";
import { assets, event } from "@/lib/event.config";
import { Countdown } from "./Countdown";
import { FacesWall } from "./FacesWall";

export function Landing({
  onPick,
  refreshKey,
}: {
  onPick: () => void;
  refreshKey: number;
}) {
  return (
    <div className="ngs-rise flex w-full max-w-2xl flex-col items-center text-center">
      <Image
        src={assets.logoLockup}
        alt={`${event.fullName} logo`}
        width={1775}
        height={374}
        priority
        className="mb-10 w-[min(78vw,26rem)]"
      />

      <div className="mb-7 flex items-center gap-4 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
        <Countdown />
      </div>

      <h1 className="text-balance text-4xl font-black leading-[0.95] tracking-tight text-cream sm:text-6xl">
        Create your official
        <br />
        Summit identity
      </h1>

      <p className="mt-5 max-w-md text-balance text-base leading-relaxed text-muted sm:text-lg">
        Upload one photo and get your Summit profile picture, attending card,
        invitation letter and story &mdash; in a few seconds.
      </p>

      <button
        type="button"
        onClick={onPick}
        className="mt-9 rounded-full bg-lime px-9 py-4 text-base font-bold text-accent-ink transition-transform hover:scale-[1.03] active:scale-[0.98]"
      >
        Upload photo
      </button>

      <p className="ngs-on-glow mt-4 text-xs text-cream/60">
        Your photo never leaves your device.
      </p>

      <div className="mt-14">
        <FacesWall refreshKey={refreshKey} />
      </div>
    </div>
  );
}
