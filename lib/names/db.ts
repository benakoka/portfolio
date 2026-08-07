import path from "node:path";
import Database from "better-sqlite3";
import type {
  NameRow,
  PopularityPoint,
  AgePmfBucket,
  NeighborRow,
  GeoStateRow,
  GeoRegionRow,
  NameProfile,
  RarityInfo,
} from "./types";
import { forecastPopularity } from "./forecast";

const FORECAST_HORIZON_YEARS = 10;

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), "data", "names.db");
    db = new Database(dbPath, { readonly: true, fileMustExist: true });
    db.pragma("query_only = true");
  }
  return db;
}

export function getNameRow(name: string): NameRow | undefined {
  const row = getDb()
    .prepare("SELECT * FROM names WHERE name_lower = ?")
    .get(name.toLowerCase().trim()) as NameRow | undefined;
  return row;
}

let totalNamesCache: number | null = null;

function getTotalNames(): number {
  if (totalNamesCache == null) {
    totalNamesCache = (getDb().prepare("SELECT COUNT(*) AS c FROM names").get() as { c: number }).c;
  }
  return totalNamesCache;
}

let maxYearCache: number | null = null;

export function getMaxYear(): number {
  if (maxYearCache == null) {
    maxYearCache = (getDb().prepare("SELECT MAX(year) AS y FROM popularity_curve").get() as { y: number }).y;
  }
  return maxYearCache;
}

/**
 * Where a given share value would rank among every name recorded in `year`
 * (1 = most popular). Only fast for the most recent year -- that's the only
 * year with a share index (a partial index scoped to it; see
 * scripts/build-predictive-tables.js), since it's the only year the app
 * ever calls this with (translating a *forecasted* share into a rank, by
 * comparing it against the latest year's actual distribution). A name's own
 * *historical* rank in past years is precomputed and read straight off its
 * curve rows instead -- see the `rank` field on PopularityPoint.
 */
export function rankInYear(year: number, sharePerMillion: number): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) + 1 AS rank FROM popularity_curve WHERE year = ? AND share_per_million > ?")
    .get(year, Math.round(sharePerMillion)) as { rank: number };
  return row.rank;
}

const shareForRankCache = new Map<string, number | null>();

/** The share_per_million of the Nth-most-popular name in `year`. Cached -- most callers ask about the same handful of (latestYear, milestone) pairs. */
export function shareForRank(year: number, rank: number): number | null {
  const key = `${year}:${rank}`;
  const cached = shareForRankCache.get(key);
  if (cached !== undefined) return cached;
  const row = getDb()
    .prepare(
      "SELECT share_per_million AS s FROM popularity_curve WHERE year = ? ORDER BY share_per_million DESC LIMIT 1 OFFSET ?"
    )
    .get(year, rank - 1) as { s: number } | undefined;
  const result = row ? row.s : null;
  shareForRankCache.set(key, result);
  return result;
}

/**
 * Walks a name's own curve backward from its most recent year to find how
 * far back its *current, unbroken* run above `threshold` (by rank) started.
 * Returns null if the name isn't above the threshold right now. Uses each
 * point's precomputed `rank` -- no DB access needed.
 */
export function currentSpellStartYear(curve: PopularityPoint[], threshold: number): number | null {
  let spellStart: number | null = null;
  for (let i = curve.length - 1; i >= 0; i--) {
    const p = curve[i];
    if (p.rank != null && p.rank <= threshold) {
      spellStart = p.year;
    } else {
      break;
    }
  }
  return spellStart;
}

export interface SurvivalCurvePoint {
  t: number;
  survival: number;
  nAtRisk: number;
}

const survivalCurveCache = new Map<number, SurvivalCurvePoint[]>();

/** Precomputed Kaplan-Meier survival curve for a rank threshold (see scripts/build-predictive-tables.js). */
export function getSurvivalCurve(threshold: number): SurvivalCurvePoint[] {
  let rows = survivalCurveCache.get(threshold);
  if (!rows) {
    rows = getDb()
      .prepare("SELECT t, survival, n_at_risk AS nAtRisk FROM survival_curve WHERE threshold = ? ORDER BY t")
      .all(threshold) as SurvivalCurvePoint[];
    survivalCurveCache.set(threshold, rows);
  }
  return rows;
}

export interface SurvivalMeta {
  totalSpells: number;
  medianT: number | null;
}

const survivalMetaCache = new Map<number, SurvivalMeta>();

export function getSurvivalMeta(threshold: number): SurvivalMeta {
  let meta = survivalMetaCache.get(threshold);
  if (!meta) {
    meta = getDb()
      .prepare("SELECT total_spells AS totalSpells, median_t AS medianT FROM survival_meta WHERE threshold = ?")
      .get(threshold) as SurvivalMeta;
    survivalMetaCache.set(threshold, meta);
  }
  return meta;
}

function getRarity(totalCount: number): RarityInfo {
  const totalNames = getTotalNames();
  const moreCommon = (
    getDb().prepare("SELECT COUNT(*) AS c FROM names WHERE total_count > ?").get(totalCount) as { c: number }
  ).c;
  const rank = moreCommon + 1;
  return { rank, totalNames, percentile: 1 - (rank - 1) / totalNames };
}

export function getProfile(name: string): NameProfile | null {
  const row = getNameRow(name);
  if (!row) return null;

  const curveRaw = getDb()
    .prepare("SELECT year, share_per_million, rank FROM popularity_curve WHERE name_id = ? ORDER BY year")
    .all(row.id) as { year: number; share_per_million: number; rank: number | null }[];
  const curve: PopularityPoint[] = curveRaw.map((r) => ({
    year: r.year,
    share: r.share_per_million / 1_000_000,
    rank: r.rank,
  }));

  const agePmfRaw = getDb()
    .prepare("SELECT age_bucket, pct_bps FROM age_pmf WHERE name_id = ? ORDER BY age_bucket")
    .all(row.id) as { age_bucket: number; pct_bps: number }[];
  const agePmf: AgePmfBucket[] = agePmfRaw.map((r) => ({
    age_bucket: r.age_bucket,
    pct: r.pct_bps / 10_000,
  }));

  const neighborsRaw = row.has_neighbors
    ? (getDb()
        .prepare(
          `SELECT n.rank, n.similarity_bps, nm.name AS neighbor
           FROM name_neighbors n JOIN names nm ON nm.id = n.neighbor_id
           WHERE n.name_id = ? ORDER BY n.rank`
        )
        .all(row.id) as { rank: number; similarity_bps: number; neighbor: string }[])
    : [];
  const neighbors: NeighborRow[] = neighborsRaw.map((r) => ({
    neighbor: r.neighbor,
    rank: r.rank,
    similarity: r.similarity_bps / 10_000,
  }));

  const geoStatesRaw = row.has_geo
    ? (getDb()
        .prepare('SELECT state, index_x1000 FROM geo_index WHERE name_id = ? ORDER BY index_x1000 DESC')
        .all(row.id) as { state: string; index_x1000: number }[])
    : [];
  const geoStates: GeoStateRow[] = geoStatesRaw.map((r) => ({ state: r.state, index: r.index_x1000 / 1000 }));

  const geoRegionsRaw = row.has_geo
    ? (getDb()
        .prepare('SELECT region, index_x1000 FROM geo_region WHERE name_id = ? ORDER BY index_x1000 DESC')
        .all(row.id) as { region: string; index_x1000: number }[])
    : [];
  const geoRegions: GeoRegionRow[] = geoRegionsRaw.map((r) => ({ region: r.region, index: r.index_x1000 / 1000 }));

  const forecast = forecastPopularity(curve, FORECAST_HORIZON_YEARS, getMaxYear());
  const rarity = getRarity(row.total_count);

  return { name: row, curve, agePmf, neighbors, geoStates, geoRegions, forecast, rarity };
}

export interface SearchHit {
  name: string;
  total_count: number;
}

export function searchNames(query: string, limit = 8): SearchHit[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return getDb()
    .prepare(
      `SELECT name, total_count FROM names
       WHERE name_lower LIKE ? ORDER BY (name_lower != ?) , total_count DESC LIMIT ?`
    )
    .all(`${q}%`, q, limit) as SearchHit[];
}

let allNamesCache: string[] | null = null;

export function getAllNamesForFuzzy(): string[] {
  if (!allNamesCache) {
    const rows = getDb()
      .prepare("SELECT name FROM names WHERE total_count >= 200 ORDER BY total_count DESC")
      .all() as { name: string }[];
    allNamesCache = rows.map((r) => r.name);
  }
  return allNamesCache;
}
