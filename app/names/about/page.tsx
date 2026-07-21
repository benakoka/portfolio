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
            The numbers on this site come from three SSA datasets. There&apos;s
            the national baby names file (name, sex, and count going back
            to 1880), the state-level version of that same file (1910
            onward), and the SSA&apos;s period life table, which has
            survival probabilities broken out by age and sex. Worth
            knowing: SSA already excludes any name given to fewer than 5
            babies in a year. So if a name is genuinely rare, you&apos;ll
            just see a &ldquo;limited data&rdquo; note instead of a real
            profile.
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
            to today, using the SSA life table&apos;s number-of-lives
            column (l<sub>x</sub>), split by sex. Peaked in 1950? That
            cohort has had 75 years to age and thin out. Peaked in 2015?
            Barely any time at all. The median and 15th/85th percentile
            ages you see come from that survival-weighted distribution, not
            just raw birth counts from however many decades back.
          </p>
        </section>

        <section>
          <h2 className="text-paper text-lg font-semibold mb-2">
            Popularity arc &amp; trend archetype
          </h2>
          <p>
            We measure popularity as a share of all births in a given year
            rather than raw counts. Otherwise you&apos;d be comparing eras
            with wildly different birth volumes, and the comparison
            wouldn&apos;t mean much. The archetype badge takes more work.
            We run k-means clustering on a handful of shape features from
            each name&apos;s curve: how recent the peak is, how long it
            stayed active, how much of that peak strength survives today,
            and whether it dipped and then came back. Each resulting
            cluster gets matched to whichever of six hand-defined
            archetypes fits best.
          </p>
        </section>

        <section>
          <h2 className="text-paper text-lg font-semibold mb-2">
            Name neighbors
          </h2>
          <p>
            Name neighbors come from cosine similarity between
            full-resolution yearly popularity curves. In plain terms,
            names whose rise and fall tracked each other closely over the
            decades. We filter out simple spelling variants on purpose.
            Otherwise half your &ldquo;neighbors&rdquo; would just be other
            spellings of your own name, which isn&apos;t much of an
            insight.
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
