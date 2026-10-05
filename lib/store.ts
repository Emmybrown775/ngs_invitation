import "server-only";

/**
 * Persistence for the two social numbers on the landing page: how many
 * identities have been generated, and the most recent faces.
 *
 * Two drivers:
 *   - Upstash Redis over REST, when UPSTASH_REDIS_REST_URL / _TOKEN are set.
 *     This is the one to use in production; Vercel's serverless functions
 *     have no shared memory between invocations.
 *   - An in-process fallback, so `next dev` works with no setup at all.
 *     Its numbers reset whenever the server restarts.
 */

const COUNT_KEY = "ngs:count";
const FACES_KEY = "ngs:faces";
const MAX_FACES = 24;

export type Feed = { count: number; thumbnails: string[] };

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const isPersistent = Boolean(url && token);

/* ------------------------------------------------------------- redis driver */

async function redis<T>(command: (string | number)[]): Promise<T> {
  const res = await fetch(url!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { result: T };
  return body.result;
}

/* -------------------------------------------------------------- memory driver */

const memory = { count: 0, faces: [] as string[] };

/* ------------------------------------------------------------------- public */

export async function readFeed(): Promise<Feed> {
  if (!isPersistent) {
    return { count: memory.count, thumbnails: [...memory.faces] };
  }
  const [count, thumbnails] = await Promise.all([
    redis<string | null>(["GET", COUNT_KEY]),
    redis<string[]>(["LRANGE", FACES_KEY, 0, MAX_FACES - 1]),
  ]);
  return {
    count: Number(count ?? 0),
    thumbnails: Array.isArray(thumbnails) ? thumbnails : [],
  };
}

/**
 * Record one generated identity. `thumbnail` is optional  attendees who
 * decline to appear on the wall still count toward the total.
 */
export async function recordIdentity(thumbnail?: string): Promise<Feed> {
  if (!isPersistent) {
    memory.count += 1;
    if (thumbnail) {
      memory.faces.unshift(thumbnail);
      memory.faces.length = Math.min(memory.faces.length, MAX_FACES);
    }
    return { count: memory.count, thumbnails: [...memory.faces] };
  }

  const count = await redis<number>(["INCR", COUNT_KEY]);
  if (thumbnail) {
    await redis(["LPUSH", FACES_KEY, thumbnail]);
    await redis(["LTRIM", FACES_KEY, 0, MAX_FACES - 1]);
  }
  const thumbnails = await redis<string[]>([
    "LRANGE",
    FACES_KEY,
    0,
    MAX_FACES - 1,
  ]);
  return { count, thumbnails: Array.isArray(thumbnails) ? thumbnails : [] };
}

/* --------------------------------------------------------------- rate limit */

const windowSeconds = 60;
const maxPerWindow = 8;
const memoryHits = new Map<string, { n: number; resetAt: number }>();

/** Returns true when the caller is over quota. Fails open on store errors. */
export async function isRateLimited(ip: string): Promise<boolean> {
  const key = `ngs:rl:${ip}`;
  if (!isPersistent) {
    const now = Date.now();
    const entry = memoryHits.get(key);
    if (!entry || entry.resetAt < now) {
      memoryHits.set(key, { n: 1, resetAt: now + windowSeconds * 1000 });
      return false;
    }
    entry.n += 1;
    return entry.n > maxPerWindow;
  }
  try {
    const n = await redis<number>(["INCR", key]);
    if (n === 1) await redis(["EXPIRE", key, windowSeconds]);
    return n > maxPerWindow;
  } catch {
    return false;
  }
}
