import { type AssetKind, assetMeta, event } from "@/lib/event.config";
import type { RenderedSet } from "@/lib/render";
import { createCanvas, drawCoverInCircle } from "@/lib/render/primitives";
import type { Transform } from "@/lib/render/primitives";

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(head)?.[1] ?? "image/png";
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  return new File([dataUrlToBlob(dataUrl)], filename, {
    type: dataUrlToBlob(dataUrl).type,
  });
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const url = URL.createObjectURL(dataUrlToBlob(dataUrl));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function downloadOne(assets: RenderedSet, kind: AssetKind): void {
  downloadDataUrl(assets[kind], assetMeta[kind].filename);
}

/**
 * Save every asset. Browsers throttle rapid programmatic downloads, so
 * stagger them rather than firing four clicks in the same tick.
 */
export async function downloadAll(assets: RenderedSet): Promise<void> {
  const kinds = Object.keys(assets) as AssetKind[];
  for (let i = 0; i < kinds.length; i += 1) {
    downloadOne(assets, kinds[i]);
    if (i < kinds.length - 1) {
      await new Promise((r) => setTimeout(r, 450));
    }
  }
}

function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod|Android/.test(navigator.userAgent) ||
    (window.matchMedia?.("(pointer: coarse)").matches ?? false)
  );
}

function canShareFiles(files: File[]): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    typeof navigator.share === "function" &&
    navigator.canShare({ files })
  );
}

/**
 * On a phone, hand the card to the native share sheet (WhatsApp, X,
 * Instagram all accept it). On desktop, open an X intent and save the
 * card so it can be attached to the post.
 */
export async function shareIdentity(
  assets: RenderedSet,
  kind: AssetKind = "card",
): Promise<"native" | "intent"> {
  const file = dataUrlToFile(assets[kind], assetMeta[kind].filename);

  if (isTouchDevice() && canShareFiles([file])) {
    try {
      await navigator.share({
        files: [file],
        text: `${event.shareText}\n${event.siteUrl}`,
      });
      return "native";
    } catch (error) {
      // A cancelled share sheet is not a failure; anything else falls back.
      if ((error as Error)?.name === "AbortError") return "native";
    }
  }

  const intent = new URL("https://x.com/intent/tweet");
  intent.searchParams.set("text", event.shareText);
  intent.searchParams.set("url", event.siteUrl);
  window.open(intent.toString(), "_blank", "noopener,noreferrer");
  downloadOne(assets, kind);
  return "intent";
}

/**
 * A 96px circular WebP crop of the attendee's photo, for the public
 * "faces" wall. Deliberately tiny  it is the only pixel of the upload
 * that ever leaves the device, and only when the attendee opts in.
 */
export async function makeThumbnail(
  photo: HTMLImageElement,
  transform: Transform,
): Promise<string> {
  const size = 96;
  const { canvas, ctx } = createCanvas(size, size);
  drawCoverInCircle(ctx, photo, size / 2, size / 2, size / 2, transform);
  return canvas.toDataURL("image/webp", 0.72);
}

export async function reportIdentity(thumbnail?: string): Promise<void> {
  try {
    await fetch("/api/frames/increment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(thumbnail ? { thumbnail } : {}),
    });
  } catch (error) {
    // The counter is decoration  never block the attendee on it.
    console.warn("Could not report identity:", error);
  }
}
