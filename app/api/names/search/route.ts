import { NextRequest } from "next/server";
import { searchNames, getAllNamesForFuzzy } from "@/lib/names/db";
import { fuzzySuggest } from "@/lib/names/fuzzy";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) {
    return Response.json({ hits: [], fuzzy: false });
  }

  const hits = searchNames(q, 8);
  if (hits.length > 0) {
    return Response.json({ hits, fuzzy: false });
  }

  const pool = getAllNamesForFuzzy();
  const suggestions = fuzzySuggest(q, pool, 5);
  return Response.json({
    hits: suggestions.map((name) => ({ name, total_count: 0 })),
    fuzzy: true,
  });
}
