function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}

/** Cheap typo-tolerant suggestion: closest names by edit distance, capped to a
 * small max distance so wildly different queries don't return noise. */
export function fuzzySuggest(query: string, pool: string[], limit = 5): string[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const maxDist = q.length <= 4 ? 1 : q.length <= 7 ? 2 : 3;
  const scored: { name: string; dist: number }[] = [];
  for (const name of pool) {
    const lower = name.toLowerCase();
    if (Math.abs(lower.length - q.length) > maxDist + 1) continue;
    const dist = levenshtein(q, lower);
    if (dist <= maxDist) scored.push({ name, dist });
  }
  scored.sort((a, b) => a.dist - b.dist);
  return scored.slice(0, limit).map((s) => s.name);
}
