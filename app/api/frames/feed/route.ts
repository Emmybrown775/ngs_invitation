import { readFeed } from "@/lib/store";

/** Live attendee count and the most recent faces. Polled by the landing page. */
export async function GET() {
  try {
    const feed = await readFeed();
    return Response.json(feed, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("feed read failed:", error);
    return Response.json(
      { count: 0, thumbnails: [] },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
}
