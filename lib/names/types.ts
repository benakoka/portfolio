export interface NameRow {
  id: number;
  name: string;
  name_lower: string;
  total_count: number;
  peak_year: number | null;
  peak_share: number | null;
  first_year: number | null;
  last_year: number | null;
  recent_share: number | null;
  pct_change_from_peak: number | null;
  years_active: number | null;
  total_living: number | null;
  median_age: number | null;
  p15_age: number | null;
  p85_age: number | null;
  mean_age: number | null;
  pct_male: number | null;
  pct_female: number | null;
  median_age_m: number | null;
  p15_age_m: number | null;
  p85_age_m: number | null;
  median_age_f: number | null;
  p15_age_f: number | null;
  p85_age_f: number | null;
  archetype: string | null;
  has_neighbors: number;
  has_geo: number;
}

export interface PopularityPoint {
  year: number;
  share: number;
}

export interface AgePmfBucket {
  age_bucket: number;
  pct: number;
}

export interface NeighborRow {
  neighbor: string;
  rank: number;
  similarity: number;
}

export interface GeoStateRow {
  state: string;
  index: number;
}

export interface GeoRegionRow {
  region: string;
  index: number;
}

export interface NameProfile {
  name: NameRow;
  curve: PopularityPoint[];
  agePmf: AgePmfBucket[];
  neighbors: NeighborRow[];
  geoStates: GeoStateRow[];
  geoRegions: GeoRegionRow[];
}

export const ARCHETYPE_COPY: Record<string, { label: string; blurb: string }> = {
  "steady classic": {
    label: "Steady Classic",
    blurb: "Consistently popular across generations, never a fad.",
  },
  "one-generation wonder": {
    label: "One-Generation Wonder",
    blurb: "A sharp, defining spike for one generation, then a steep fade.",
  },
  "comeback kid": {
    label: "Comeback Kid",
    blurb: "Popular, faded for decades, then surged back.",
  },
  "recently invented": {
    label: "Recently Invented",
    blurb: "Almost no history before the last couple decades.",
  },
  "rising star": {
    label: "Rising Star",
    blurb: "Still climbing, close to its all-time peak right now.",
  },
  "faded classic": {
    label: "Faded Classic",
    blurb: "Once everywhere, now rare — a name from a different era.",
  },
};
