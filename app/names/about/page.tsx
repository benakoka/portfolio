export const metadata = { title: "Methodology" };

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-7 py-16">
      <h1 className="text-3xl font-semibold mb-8">Methodology</h1>

      <div className="space-y-8 text-sm text-muted leading-relaxed">
        <section>
          <h2 className="text-paper text-lg font-semibold mb-2">Data sources</h2>
          <p>
            Every statistic on this site comes from three public Social
            Security Administration datasets: the national baby names file
            (yearly name/sex/count, 1880–present), the state-level baby
            names file (1910–present), and the SSA period life table
            (single-year-of-age survival probabilities by sex). Names given
            to fewer than 5 babies in a given year are excluded by SSA
            itself, so extremely rare names may show &ldquo;limited
            data.&rdquo;
          </p>
        </section>

        <section>
          <h2 className="text-paper text-lg font-semibold mb-2">
            Living-age distribution
          </h2>
          <p>
            This is the part people usually get wrong: a name&apos;s age
            distribution today is not the same as when it was popular. We
            take every birth-year cohort for a name and weight it by that
            cohort&apos;s sex-specific survival probability to the current
            year, using the SSA actuarial life table&apos;s number-of-lives
            (l<sub>x</sub>) column. A name that peaked in 1950 has had 75
            years for its cohort to age and, actuarially, thin out — a name
            that peaked in 2015 hasn&apos;t. The median and 15th/85th
            percentile ages come from that survival-weighted distribution,
            not from raw birth counts.
          </p>
        </section>

        <section>
          <h2 className="text-paper text-lg font-semibold mb-2">
            Popularity arc &amp; trend archetype
          </h2>
          <p>
            Popularity is measured as a name&apos;s share of all births in a
            given year (not raw counts), so eras with very different total
            birth volumes are comparable. The archetype badge comes from
            k-means clustering on a handful of shape features (how recent
            the peak is, how long the name stayed active, how much of its
            peak strength remains today, whether it shows a dip-then-
            resurgence pattern), with each cluster matched to the closest of
            six hand-defined archetypes.
          </p>
        </section>

        <section>
          <h2 className="text-paper text-lg font-semibold mb-2">
            Name neighbors
          </h2>
          <p>
            Computed via cosine similarity between full-resolution yearly
            popularity curves — names whose rise and fall tracked each other
            closely over the decades, with simple spelling variants filtered
            out so the result is more interesting than &ldquo;other
            spellings of your own name.&rdquo;
          </p>
        </section>

        <section>
          <h2 className="text-paper text-lg font-semibold mb-2">
            Geographic fingerprint
          </h2>
          <p>
            For each state (and Census region), we compare a name&apos;s
            share of that state&apos;s births to its share of national
            births over the same period (1910–present, matching state data
            availability). An index of 2.0 means the name is twice as common
            there as you&apos;d expect nationally.
          </p>
        </section>
      </div>
    </div>
  );
}
