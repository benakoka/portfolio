import BackButton from "@/components/names/BackButton";
import { Reveal } from "@/components/motion/Reveal";

export const metadata = { title: "Methodology" };

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-7 py-16">
      <BackButton />
      <h1 className="text-3xl font-semibold mb-8">Methodology</h1>

      <div className="space-y-8 text-sm text-muted leading-relaxed">
        <Reveal mode="scroll" as="section">
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
        </Reveal>

        <Reveal mode="scroll" as="section">
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
        </Reveal>

        <Reveal mode="scroll" as="section">
          <h2 className="text-paper text-lg font-semibold mb-2">
            Gender balance
          </h2>
          <p>
            Gender balance draws on the sex field already present in the
            SSA national baby names file: each name&apos;s overall share of
            male and female births, along with the median and 15th/85th
            percentile living ages calculated separately by sex. For names
            given overwhelmingly to one sex, the split is reported as a
            single dominant percentage rather than a full breakdown, since
            the minority share is usually too small to be meaningful.
          </p>
        </Reveal>

        <Reveal mode="scroll" as="section">
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
        </Reveal>

        <Reveal mode="scroll" as="section">
          <h2 className="text-paper text-lg font-semibold mb-2">
            Popularity forecast
          </h2>
          <p>
            The ten-year projection shown on the popularity arc is
            produced by Holt&apos;s damped-trend exponential smoothing,
            fit separately to each name&apos;s history. Rather than fixing
            the smoothing parameters (alpha, beta, phi) by hand, they are
            chosen by grid search to minimize one-step-ahead error. Fit
            quality and the resulting confidence interval are scored only
            against the trailing twenty-five years of data, not a
            name&apos;s full history: a name like Mildred swung sharply in
            the 1910s and has been flat and rare for decades, and scoring
            against a century of irrelevant volatility would produce an
            uselessly wide interval for its current, quieter era. The
            damping term keeps the projection from extrapolating an
            unrealistic runaway trend, and no forecast is shown for names
            that are no longer actively given.
          </p>
        </Reveal>

        <Reveal mode="scroll" as="section">
          <h2 className="text-paper text-lg font-semibold mb-2">Rarity</h2>
          <p>
            Rarity ranks each name by its all-time total births against
            the roughly 106,000 names that meet the SSA&apos;s
            five-births-per-year reporting threshold. The rank is the
            count of names with a strictly higher total, plus one; the
            reported percentile is the share of all names that a given
            name is more common than.
          </p>
        </Reveal>

        <Reveal mode="scroll" as="section">
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
        </Reveal>

        <Reveal mode="scroll" as="section">
          <h2 className="text-paper text-lg font-semibold mb-2">
            Geographic fingerprint
          </h2>
          <p>
            For each state and Census region, a name&apos;s share of local
            births is compared to its share of national births over the
            same period, from 1910 to the present, matching the
            availability of state-level data. An index of 2.0 indicates
            that a name appears twice as frequently in that state as would
            be expected based on the national baseline. On the map, red
            indicates a state where the name is under-indexed and blue
            indicates a state where it is over-indexed.
          </p>
        </Reveal>

        <Reveal mode="scroll" as="section">
          <h2 className="text-paper text-lg font-semibold mb-2">
            Head-to-head compare
          </h2>
          <p>
            The compare view reuses the same per-name statistics computed
            for individual profiles; nothing is recalculated for the
            comparison itself. Its state map colors each state by the
            ratio of the two names&apos; own geographic indices there.
            Because both indices are already normalized to that
            name&apos;s national average, comparing them directly answers
            which name leans harder into a given state relative to how
            each name typically behaves, rather than comparing raw,
            differently-scaled popularity.
          </p>
        </Reveal>
      </div>
    </div>
  );
}
