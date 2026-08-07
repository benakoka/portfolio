/**
 * Best-effort in-memory rate limiter, keyed by IP.
 *
 * This is a cost/abuse throttle for a low-traffic personal site, not a
 * distributed rate limiter — it lives in the memory of a single serverless
 * function instance, so a cold start or a request landing on a different
 * instance resets its view of that IP. That's fine here: the real backstop
 * against a runaway bill is the hard spend cap set on the Anthropic API key
 * in the Console. If this route ever sees real traffic, swap this for
 * Upstash/Vercel KV so limits hold across instances.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 15;

const hits = new Map<string, number[]>();

/** Periodically drop IPs with no recent activity so the map doesn't grow forever. */
function sweep(now: number) {
  for (const [ip, timestamps] of hits) {
    const recent = timestamps.filter((t) => now - t < WINDOW_MS);
    if (recent.length === 0) hits.delete(ip);
    else hits.set(ip, recent);
  }
}

let requestsSinceSweep = 0;

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();

  requestsSinceSweep += 1;
  if (requestsSinceSweep >= 200) {
    sweep(now);
    requestsSinceSweep = 0;
  }

  const timestamps = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = timestamps[0];
    const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  timestamps.push(now);
  hits.set(ip, timestamps);
  return { allowed: true };
}

/** Best-effort client IP extraction behind Vercel's proxy. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
