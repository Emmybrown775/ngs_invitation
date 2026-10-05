import type { AssetKind } from "@/lib/event.config";
import type { IdentityInput } from "./common";
import { renderCard } from "./card";
import { renderLetter } from "./letter";
import { renderPfp } from "./pfp";
import { renderStory } from "./story";

export type { IdentityInput } from "./common";
export type { Transform } from "./primitives";
export { identityTransform } from "./primitives";

export type RenderedSet = Record<AssetKind, string>;

const renderers: Record<AssetKind, (i: IdentityInput) => Promise<string>> = {
  card: renderCard,
  pfp: renderPfp,
  letter: renderLetter,
  story: renderStory,
};

/**
 * Render every asset. Sequential rather than parallel: each renderer draws
 * on its own canvas but they all share the font and logo caches, and on a
 * mid-range phone four simultaneous 1080p+ canvases is enough to stutter.
 */
export async function renderAll(input: IdentityInput): Promise<RenderedSet> {
  const out = {} as RenderedSet;
  for (const kind of Object.keys(renderers) as AssetKind[]) {
    out[kind] = await renderers[kind](input);
  }
  return out;
}

export { renderCard, renderPfp, renderLetter, renderStory };
