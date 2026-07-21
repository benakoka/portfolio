import BackButton from "@/components/names/BackButton";

export const metadata = { title: "Methodology" };

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-7 py-16">
      <BackButton />
      <h1 className="text-3xl font-semibold mb-8">Methodology</h1>

      <div className="space-y-8 text-sm text-muted leading-relaxed">
        <section>
          <h2 className="text-paper text-lg font-semibold mb-2">Data sources</h2>
          <p>
            The statistics on this site are drawn from three Social
            Security Administration datasets: the national baby names
            file, which records name, sex, and count by year back to
            1880; the state-level version of that file, available from
            1910 onward; and the SSA&apos;s period life table, which
            provides survival probabilities by age and sex. The Social
            Security Administration excludes any name given to fewer than
            five babies in a given year, so a sufficiently rare name will
            display a &ldquo;limited data&rdquo; notice rather than a full
            profile.
          </p>
        </section>

        <section>
          <h2 className="text-paper text-lg font-semibold mb-2">
            Living-age distribution
          </h2>
          <p>
            This is the point most visitors misunderstand: a name&apos;s
            age distribution today is not the same as it was during the
            name&apos;s period of popularity. Each birth-year cohort is
            weighted by its survival probability to the present, using the
            number-of-lives column (l<sub>x</sub>) from the SSA life
            table, calculated separately by sex. A name that peaked in
            1950 has had 75 years for its cohort to age and, actuarially,
            thin out; a name that peaked in 2015 has not. The median and
            15th/85th percentile ages shown come from this
            survival-weighted distribution, rather than from raw birth
            counts.
          </p>
        </section>

        <section>
          <h2 className="text-paper text-lg font-semibold mb-2">
            Popularity arc &amp; trend archetype
          </h2>
          <p>
            Popularity is measured as a name&apos;s share of all births in
            a given year rather than as a raw count, which allows for
            fair comparison across eras with very different total birth
            volumes. The archetype badge is generated through k-means
            clustering on several shape features of each name&apos;s
            popularity curve: the recency of its peak, the duration it
            remained active, the proportion of peak strength that
            persists today, and whether the curve shows a decline
            followed by a resurgence. Each resulting cluster is matched to
            the closest of six predefined archetypes.
          </p>
        </section>

        <section>
          <h2 className="text-paper text-lg font-semibold mb-2">
            Name neighbors
          </h2>
          <p>
            Name neighbors are computed using cosine similarity between
            full-resolution yearly popularity curves, identifying names
            whose rise and fall tracked one another closely over the
            decades. Simple spelling variants are filtered out
            deliberately; without this step, most results would consist
            of alternate spellings of the same name rather than
            genuinely related names.
          </p>
        </section>

        <section>
          <h2 className="text-paper text-lg font-semibold mb-2">
            Geographic fingerprint
          </h2>
          <p>
            For each state and Census region, a name&apos;s share of local
            births is compared to its share of national births over the
            same period, from 1910 to the present, matching the
            availability of state-level data. An index of 2.0 indicates
            that a name appears twice as frequently in that state as would
            be expected based on the national baseline.
          </p>
        </section>
      </div>
    </div>
  );
}
