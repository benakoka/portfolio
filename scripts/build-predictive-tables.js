/**
 * One-time data-prep migration for the predictive-modeling features
 * (Peak Popularity Prediction, Name Life Cycle Model, Popularity Survival
 * Model). Not run automatically at build/deploy time -- like the rest of
 * data/names.db, its output is precomputed once and committed.
 *
 * It does three things to data/names.db:
 *
 *  1. Adds a `rank` column to popularity_curve (1 = most popular that year),
 *     computed once for every (name, year) pair. The app can then read a
 *     name's own historical rank straight off its already-fetched curve
 *     rows -- no per-request lookup needed -- reusing the existing name_id
 *     index rather than a new one.
 *
 *  2. Adds a *partial* index on share_per_million restricted to just the
 *     most recent year. The app translates a forecasted future *share*
 *     into a *rank* by comparing it against the latest year's actual
 *     distribution (see lib/names/predict/milestones.ts) -- that only ever
 *     needs one year's ~28k rows, so indexing all 146 years like a naive
 *     (year, share) index would is >20MB of index for years the app never
 *     queries that way.
 *
 *  3. Precomputes a Kaplan-Meier survival curve -- for each of the
 *     Top 1000 / 500 / 100 / 50 / 10 rank thresholds, "if a name enters this
 *     tier, how long does it typically stay above it before falling out?" --
 *     across every name's entire history, and stores the resulting step
 *     function (survival_curve) plus a small summary (survival_meta).
 *     Every contiguous run a name spends above a threshold is one survival
 *     "spell"; spells still above the threshold in the most recent year are
 *     correctly right-censored rather than counted as exits.
 *
 * Run with: node scripts/build-predictive-tables.js
 */
const path = require("node:path");
const Database = require("better-sqlite3");

const THRESHOLDS = [1000, 500, 100, 50, 10];
const MAX_T = 120; // years -- generously beyond the 146-year dataset span

function main() {
  const dbPath = path.join(__dirname, "..", "data", "names.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  const { minYear, maxYear } = db
    .prepare("SELECT MIN(year) AS minYear, MAX(year) AS maxYear FROM popularity_curve")
    .get();
  const yearSpan = maxYear - minYear + 1;
  const { maxId } = db.prepare("SELECT MAX(id) AS maxId FROM names").get();

  console.log(`Years ${minYear}-${maxYear} (${yearSpan}), names 0-${maxId}`);
  console.log("Ranking every name in every year (single sorted pass)...");

  // rankGrid[nameId * yearSpan + (year - minYear)] = that name's rank that
  // year (1 = most popular), or 0 if the name has no data that year.
  const rankGrid = new Uint16Array((maxId + 1) * yearSpan);

  const rowIter = db
    .prepare(
      `SELECT name_id, year, share_per_million FROM popularity_curve
       ORDER BY year ASC, share_per_million DESC`
    )
    .raw(true)
    .iterate();

  let curYear = null;
  let counter = 0;
  for (const [nameId, year, /* share_per_million */] of rowIter) {
    if (year !== curYear) {
      curYear = year;
      counter = 0;
    }
    counter++;
    if (counter <= 0xffff) {
      rankGrid[nameId * yearSpan + (year - minYear)] = counter;
    }
  }

  console.log("Adding rank column to popularity_curve...");
  db.exec(`ALTER TABLE popularity_curve ADD COLUMN rank INTEGER`);
  // Update by rowid (fast, near-constant-time clustered lookup) rather than
  // a name_id+year WHERE clause, which would need a scan per row.
  const updateRank = db.prepare(`UPDATE popularity_curve SET rank = ? WHERE rowid = ?`);
  const updateAll = db.transaction((rows) => {
    for (const [rowid, rank] of rows) updateRank.run(rank, rowid);
  });
  {
    const batch = [];
    const iter2 = db
      .prepare(`SELECT rowid, name_id, year FROM popularity_curve`)
      .raw(true)
      .iterate();
    for (const [rowid, nameId, year] of iter2) {
      const rank = rankGrid[nameId * yearSpan + (year - minYear)];
      batch.push([rowid, rank]);
    }
    console.log(`  updating ${batch.length} rows...`);
    updateAll(batch);
  }

  console.log("Building partial index on the latest year's share...");
  db.exec(
    `CREATE INDEX idx_popcurve_latestyear_share ON popularity_curve(share_per_million) WHERE year = ${maxYear}`
  );

  console.log("Walking each name's history to find threshold spells...");
  const lastYearByName = new Map(
    db.prepare("SELECT id, last_year FROM names").all().map((r) => [r.id, r.last_year])
  );

  // spells[threshold] = [{ duration, censored }]
  const spells = new Map(THRESHOLDS.map((t) => [t, []]));
  const openSpellStart = new Map(THRESHOLDS.map((t) => [t, null]));

  for (let nameId = 0; nameId <= maxId; nameId++) {
    for (const t of THRESHOLDS) openSpellStart.set(t, null);

    for (let year = minYear; year <= maxYear; year++) {
      const rank = rankGrid[nameId * yearSpan + (year - minYear)];
      for (const threshold of THRESHOLDS) {
        const above = rank > 0 && rank <= threshold;
        const start = openSpellStart.get(threshold);
        if (above) {
          if (start === null) openSpellStart.set(threshold, year);
        } else if (start !== null) {
          spells.get(threshold).push({ duration: year - 1 - start + 1, censored: false });
          openSpellStart.set(threshold, null);
        }
      }
    }

    // Close any spell still open at the end of the dataset -- right-censored
    // only if this name is still actively recorded in the final year;
    // otherwise it's a real exit that just happens to land on the boundary.
    const stillActive = lastYearByName.get(nameId) === maxYear;
    for (const threshold of THRESHOLDS) {
      const start = openSpellStart.get(threshold);
      if (start !== null) {
        spells.get(threshold).push({
          duration: maxYear - start + 1,
          censored: stillActive,
        });
      }
    }
  }

  console.log("Computing Kaplan-Meier curves...");
  db.exec(`DROP TABLE IF EXISTS survival_curve`);
  db.exec(`DROP TABLE IF EXISTS survival_meta`);
  db.exec(
    `CREATE TABLE survival_curve (threshold INTEGER, t INTEGER, survival REAL, n_at_risk INTEGER)`
  );
  db.exec(`CREATE TABLE survival_meta (threshold INTEGER PRIMARY KEY, total_spells INTEGER, median_t INTEGER)`);
  db.exec(`CREATE INDEX idx_survival_threshold ON survival_curve(threshold, t)`);

  const insertCurve = db.prepare(
    `INSERT INTO survival_curve (threshold, t, survival, n_at_risk) VALUES (?, ?, ?, ?)`
  );
  const insertMeta = db.prepare(
    `INSERT INTO survival_meta (threshold, total_spells, median_t) VALUES (?, ?, ?)`
  );

  const insertAll = db.transaction(() => {
    for (const threshold of THRESHOLDS) {
      const list = spells.get(threshold);
      const eventCounts = new Array(MAX_T + 2).fill(0);
      const totalCounts = new Array(MAX_T + 2).fill(0);
      for (const s of list) {
        const d = Math.min(s.duration, MAX_T + 1);
        totalCounts[d]++;
        if (!s.censored) eventCounts[d]++;
      }
      const atRisk = new Array(MAX_T + 2).fill(0);
      let running = 0;
      for (let t = MAX_T + 1; t >= 1; t--) {
        running += totalCounts[t];
        atRisk[t] = running;
      }

      let survival = 1;
      let medianT = null;
      for (let t = 1; t <= MAX_T; t++) {
        const n_t = atRisk[t];
        const d_t = eventCounts[t];
        if (n_t > 0) survival *= 1 - d_t / n_t;
        insertCurve.run(threshold, t, survival, n_t);
        if (medianT === null && survival <= 0.5) medianT = t;
      }
      insertMeta.run(threshold, list.length, medianT);
      console.log(
        `  Top ${threshold}: ${list.length} historical spells, median survival ${
          medianT ?? `>${MAX_T}`
        } yrs`
      );
    }
  });
  insertAll();

  console.log("Checkpointing WAL and vacuuming...");
  db.pragma("wal_checkpoint(TRUNCATE)");
  db.pragma("journal_mode = DELETE");
  db.exec("VACUUM");
  db.close();
}

main();
