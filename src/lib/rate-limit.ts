/**
 * Tiny in-memory limiter for public forms. It protects each server instance
 * from floods and casual abuse; it is not a substitute for a WAF.
 */
const hits = new Map<string, { count: number; resetAt: number }>();
const MAX_KEYS = 5000;

export function allowRequest(key: string, limit: number, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.resetAt <= now) {
    if (hits.size >= MAX_KEYS) {
      const oldest = hits.keys().next().value;
      if (oldest !== undefined) hits.delete(oldest);
    }
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}
