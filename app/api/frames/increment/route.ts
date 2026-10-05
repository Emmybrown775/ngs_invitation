import type { NextRequest } from "next/server";
import { isRateLimited, recordIdentity } from "@/lib/store";

/** A 96px WebP thumbnail is ~4KB; anything much larger is not one of ours. */
const MAX_THUMBNAIL_BYTES = 24_000;
const THUMBNAIL_PREFIX = "data:image/webp;base64,";

/** Record a generated identity, optionally adding the face to the wall. */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (await isRateLimited(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  let thumbnail: string | undefined;
  try {
    const body = (await request.json()) as { thumbnail?: unknown };
    if (typeof body.thumbnail === "string") {
      // Only accept the exact shape the client produces, and cap the size 
      // this endpoint is public and writes to a shared list.
      const ok =
        body.thumbnail.startsWith(THUMBNAIL_PREFIX) &&
        body.thumbnail.length <= MAX_THUMBNAIL_BYTES;
      if (ok) thumbnail = body.thumbnail;
    }
  } catch {
    // No body is fine — count the identity without a face.
  }

  try {
    const feed = await recordIdentity(thumbnail);
    return Response.json(feed, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("increment failed:", error);
    return Response.json({ error: "Could not record" }, { status: 500 });
  }
}
