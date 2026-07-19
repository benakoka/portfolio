import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, getAllNamesForFuzzy } from "@/lib/names/db";
import { fuzzySuggest } from "@/lib/names/fuzzy";
import AgeDistribution from "@/components/names/AgeDistribution";
import PopularityChart from "@/components/names/PopularityChart";
import NameNeighbors from "@/components/names/NameNeighbors";
import GeoChoropleth from "@/components/names/GeoChoropleth";
import ShareButton from "@/components/names/ShareButton";
import SearchBox from "@/components/names/SearchBox";

type Props = { params: Promise<{ name: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const profile = getProfile(name);
  if (!profile) return { title: "Name not found" };
  const title = `${profile.name.name} — What does the internet think of your name?`;
  const description =
    profile.name.median_age != null
      ? `The median living ${profile.name.name} is ${profile.name.median_age}. Peak year: ${profile.name.peak_year}.`
      : `A data-driven profile of the name ${profile.name.name}.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`/api/names/og/${profile.name.name.toLowerCase()}`],
    },
  };
}

export default async function NamePage({ params }: Props) {
  const { name } = await params;
  const profile = getProfile(name);

  if (!profile) {
    const pool = getAllNamesForFuzzy();
    const suggestions = fuzzySuggest(name, pool, 6);
    return (
      <div className="max-w-2xl mx-auto px-7 py-20 text-center">
        <h1 className="text-3xl font-semibold mb-3">
          No data for &ldquo;{name}&rdquo;
        </h1>
        <p className="text-muted mb-8">
          Either it&apos;s not in the SSA dataset (fewer than 5 babies in any
          single year), or it&apos;s spelled differently.
        </p>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {suggestions.map((s) => (
              <Link
                key={s}
                href={`/names/name/${s.toLowerCase()}`}
                className="px-3 py-1.5 rounded-full border border-line hover:border-data transition-colors font-mono text-sm"
              >
                {s}
              </Link>
            ))}
          </div>
        )}
        <div className="flex justify-center">
          <SearchBox />
        </div>
      </div>
    );
  }

  const n = profile.name;
  const isLowData = n.total_count < 200;

  return (
    <div className="max-w-5xl mx-auto px-7 py-12">
      <div className="mb-6">
        <SearchBox />
      </div>

      <header className="mb-8">
        <h1 className="text-5xl font-semibold">{n.name}</h1>
        <p className="mt-2 text-muted">
          {n.total_count.toLocaleString()} recorded births · active{" "}
          {n.first_year}–{n.last_year}
        </p>
        {isLowData && (
          <p className="mt-3 inline-block px-3 py-2 rounded-lg border border-line bg-panel text-xs text-muted">
            Limited US data for this name — stats below may be noisy.
          </p>
        )}
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <AgeDistribution name={n} agePmf={profile.agePmf} />
        <PopularityChart name={n} curve={profile.curve} />
        <NameNeighbors name={n.name} neighbors={profile.neighbors} />
        <GeoChoropleth name={n.name} geoStates={profile.geoStates} geoRegions={profile.geoRegions} />
      </div>

      <div className="mt-6 flex md:justify-start">
        <ShareButton name={n.name} />
      </div>
    </div>
  );
}
