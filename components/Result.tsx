"use client";

import Image from "next/image";
import { useState } from "react";
import {
  type AssetKind,
  type Participation,
  assetMeta,
  assetOrder,
  event,
} from "@/lib/event.config";
import type { RenderedSet } from "@/lib/render";
import { downloadAll, downloadOne, shareIdentity } from "@/lib/share";

export function Result({
  assets,
  mode,
  onRestart,
}: {
  assets: RenderedSet;
  mode: Participation;
  onRestart: () => void;
}) {
  const [active, setActive] = useState<AssetKind>("card");
  const [saving, setSaving] = useState(false);
  const meta = assetMeta[active];

  const saveAll = async () => {
    setSaving(true);
    try {
      await downloadAll(assets);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ngs-rise flex w-full max-w-3xl flex-col items-center">
      <p className="mb-1 text-sm font-semibold tracking-[0.2em] text-lime">
        YOU&rsquo;RE ALL SET
      </p>
      <h2 className="mb-8 text-center text-2xl font-black text-cream sm:text-3xl">
        {event.cityLine}
      </h2>

      {/* Asset switcher */}
      <div
        className="mb-6 flex flex-wrap justify-center gap-2"
        role="tablist"
        aria-label="Generated assets"
      >
        {assetOrder.map((kind) => (
          <button
            key={kind}
            role="tab"
            aria-selected={active === kind}
            onClick={() => setActive(kind)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active === kind
                ? "bg-lime text-accent-ink"
                : "border border-white/12 text-muted hover:text-cream"
            }`}
          >
            {assetMeta[kind].label}
          </button>
        ))}
      </div>

      <div className="flex w-full flex-col items-center">
        <Image
          key={active}
          src={assets[active]}
          alt={meta.label}
          width={1080}
          height={1350}
          unoptimized
          className="ngs-pop max-h-[58vh] w-auto max-w-full rounded-2xl border border-white/10 object-contain shadow-2xl shadow-violet/20"
        />
        <p className="mt-3 text-xs text-muted">{meta.blurb}</p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => downloadOne(assets, active)}
          className="rounded-full bg-lime px-6 py-3 text-sm font-bold text-accent-ink transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Download {meta.label.toLowerCase()}
        </button>
        <button
          onClick={saveAll}
          disabled={saving}
          className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-cream transition-colors hover:border-white/35 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Download all 4"}
        </button>
        <button
          onClick={() => shareIdentity(assets, active, mode)}
          className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-cream transition-colors hover:border-white/35"
        >
          Share
        </button>
      </div>

      <button
        onClick={onRestart}
        className="mt-6 text-sm text-muted underline-offset-4 hover:text-cream hover:underline"
      >
        Create another
      </button>
    </div>
  );
}
