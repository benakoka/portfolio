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
} from "./types";

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

export function getProfile(name: string): NameProfile | null {
  const row = getNameRow(name);
  if (!row) return null;

  const curveRaw = getDb()
    .prepare("SELECT year, share_per_million FROM popularity_curve WHERE name_id = ? ORDER BY year")
    .all(row.id) as { year: number; share_per_million: number }[];
  const curve: PopularityPoint[] = curveRaw.map((r) => ({
    year: r.year,
    share: r.share_per_million / 1_000_000,
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

  return { name: row, curve, agePmf, neighbors, geoStates, geoRegions };
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
