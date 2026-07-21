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
            Everything here is built from three SSA datasets: the national
            baby names file (name, sex, and count by year, back to 1880),
            the state-level baby names file (1910 onward), and the SSA
            period life table, which gives survival probabilities by
            single year of age and sex. One thing worth knowing &mdash; SSA
            itself drops any name given to fewer than 5 babies in a year,
            so a genuinely rare name will show up as &ldquo;limited
            data&rdquo; instead of a full profile.
          </p>
        </section>

        <section>
          <h2 className="text-paper text-lg font-semibold mb-2">
            Living-age distribution
          </h2>
          <p>
            This is the part most people get wrong: a name&apos;s age
            distribution today isn&apos;t the same as it was when the name
            was popular. What we actually do is take every birth-year
            cohort and weight it by that cohort&apos;s survival probability
            to today, pulling the numbers from the SSA life table&apos;s
            number-of-lives column (l<sub>x</sub>), split by sex. Peaked in
            1950? That cohort has had 75 years to age and thin out. Peaked
            in 2015? Barely any time at all. So the median and 15th/85th
            percentile ages you see are survival-weighted &mdash; not just
            raw birth counts from however many decades ago.
          </p>
        </section>

        <section>
          <h2 className="text-paper text-lg font-semibold mb-2">
            Popularity arc &amp; trend archetype
          </h2>
          <p>
            We measure popularity as a share of all births in a given year,
            not raw counts &mdash; otherwise you&apos;d be comparing eras
            with wildly different birth volumes and the whole thing would
            fall apart. The archetype badge takes a bit more work: we run
            k-means clustering on a few shape features of each name&apos;s
            curve (how recent the peak is, how long it stayed active, how
            much of that peak strength survives today, whether it dipped
            and then came back), then match each resulting cluster to
            whichever of six hand-defined archetypes fits best.
          </p>
        </section>

        <section>
          <h2 className="text-paper text-lg font-semibold mb-2">
            Name neighbors
          </h2>
          <p>
            These come from cosine similarity between full-resolution
            yearly popularity curves &mdash; names whose rise and fall
            tracked each other closely over the decades. We filter out
            simple spelling variants on purpose, otherwise half your
            &ldquo;neighbors&rdquo; would just be other spellings of your
            own name, which isn&apos;t very interesting.
          </p>
        </section>

        <section>
          <h2 className="text-paper text-lg font-semibold mb-2">
            Geographic fingerprint
          </h2>
          <p>
            For every state and Census region, we compare a name&apos;s
            share of local births to its share of births nationally, over
            the same window (1910 to present, since that&apos;s as far
            back as the state-level data goes). If a state comes back with
            an index of 2.0, that name is showing up twice as often there
            as you&apos;d expect from the national baseline.
          </p>
        </section>
      </div>
    </div>
  );
}
