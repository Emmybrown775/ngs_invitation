"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { event } from "@/lib/event.config";

type Feed = { count: number; thumbnails: string[] };

/** Poll on a jittered interval so a crowd does not sync into a thundering herd. */
const BASE_MS = 12_000;
const JITTER_MS = 4_000;

export function FacesWall({ refreshKey = 0 }: { refreshKey?: number }) {
  const [feed, setFeed] = useState<Feed>({ count: 0, thumbnails: [] });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      try {
        const res = await fetch("/api/frames/feed", { cache: "no-store" });
        if (res.ok && !cancelled) setFeed(await res.json());
      } catch {
        // Offline or the store is down — keep the last good numbers.
      }
      if (!cancelled) {
        timer = setTimeout(tick, BASE_MS + Math.random() * JITTER_MS);
      }
    };

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [refreshKey]);

  const faces = feed.thumbnails.slice(0, 6);
  const placeholders = Math.max(0, 5 - faces.length);

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-3">
        {faces.map((src, i) => (
          <Image
            key={`${i}-${src.slice(-12)}`}
            src={src}
            alt=""
            width={36}
            height={36}
            unoptimized
            className="h-9 w-9 rounded-full border-2 border-ink object-cover"
          />
        ))}
        {Array.from({ length: placeholders }).map((_, i) => (
          <span
            key={`ph-${i}`}
            className="h-9 w-9 rounded-full border-2 border-ink bg-raised"
          />
        ))}
      </div>
      <p className="ngs-on-glow text-left text-xs leading-tight text-cream/70 sm:text-sm">
        <span className="block font-semibold text-cream">
          {feed.count.toLocaleString()} attending
        </span>
        The faces of {event.fullName}
      </p>
    </div>
  );
}
