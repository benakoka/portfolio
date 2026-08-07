import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, getAllNamesForFuzzy } from "@/lib/names/db";
import { fuzzySuggest } from "@/lib/names/fuzzy";
import AgeDistribution from "@/components/names/AgeDistribution";
import PopularityChart from "@/components/names/PopularityChart";
import NameNeighbors from "@/components/names/NameNeighbors";
import GeoChoropleth from "@/components/names/GeoChoropleth";
import GenderBalance from "@/components/names/GenderBalance";
import RarityMeter from "@/components/names/RarityMeter";
import ShareButton from "@/components/names/ShareButton";
import SearchBox from "@/components/names/SearchBox";
import PeakPopularityPrediction from "@/components/names/predict/PeakPopularityPrediction";
import LifeCycleModel from "@/components/names/predict/LifeCycleModel";
import SurvivalCurve from "@/components/names/predict/SurvivalCurve";
import { getPredictiveInsights } from "@/lib/names/predict";
import { Reveal, Stagger, StaggerItem, StaggerLinkItem } from "@/components/motion/Reveal";

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
          <Stagger mode="load" className="flex flex-wrap gap-2 justify-center mb-10">
            {suggestions.map((s) => (
              <StaggerLinkItem
                key={s}
                href={`/names/name/${s.toLowerCase()}`}
                className="px-3 py-1.5 rounded-full border border-line hover:border-data transition-colors font-mono text-sm"
                lift={2}
              >
                {s}
              </StaggerLinkItem>
            ))}
          </Stagger>
        )}
        <div className="flex justify-center">
          <SearchBox />
        </div>
      </div>
    );
  }

  const n = profile.name;
  const isLowData = n.total_count < 200;
  const insights = getPredictiveInsights(profile);
  const survivalTop1000 = insights.survival.find((s) => s.threshold === 1000);

  return (
    <div className="max-w-5xl mx-auto px-7 py-12">
      <div className="mb-6">
        <SearchBox />
      </div>

      <Reveal mode="load" as="header" className="mb-8">
        <h1 className="text-5xl font-semibold">{n.name}</h1>
        <p className="mt-2 text-muted">
          {n.total_count.toLocaleString()} recorded births · active{" "}
          {n.first_year}–{n.last_year}
        </p>
        <Link
          href={`/names/compare?a=${encodeURIComponent(n.name)}`}
          className="mt-2 inline-block text-sm text-data hover:text-paper transition-colors font-mono"
        >
          Compare {n.name} →
        </Link>
        {isLowData && (
          <p className="mt-3 inline-block px-3 py-2 rounded-lg border border-line bg-panel text-xs text-muted">
            Limited US data for this name — stats below may be noisy.
          </p>
        )}
      </Reveal>

      <Stagger mode="load" className="grid md:grid-cols-2 gap-6">
        <StaggerItem className="grid h-full"><AgeDistribution name={n} agePmf={profile.agePmf} /></StaggerItem>
        <StaggerItem className="grid h-full"><PopularityChart name={n} curve={profile.curve} forecast={profile.forecast} /></StaggerItem>
        <StaggerItem className="grid h-full"><GenderBalance name={n} /></StaggerItem>
        <StaggerItem className="grid h-full"><RarityMeter name={n} rarity={profile.rarity} /></StaggerItem>
        <StaggerItem className="grid h-full"><NameNeighbors name={n.name} neighbors={profile.neighbors} /></StaggerItem>
        <StaggerItem className="grid h-full"><GeoChoropleth name={n.name} geoStates={profile.geoStates} geoRegions={profile.geoRegions} /></StaggerItem>
      </Stagger>

      <Reveal mode="scroll" className="mt-10 mb-4">
        <h2 className="text-2xl font-semibold">Predictive modeling</h2>
        <p className="mt-1 text-sm text-muted">
          Three statistical models, all fit to {n.name}&apos;s own SSA history plus the historical behavior of every
          other name in the dataset.
        </p>
      </Reveal>

      <div className="flex flex-col gap-6">
        <Reveal mode="scroll">
          <PeakPopularityPrediction name={n} prediction={insights.peak} />
        </Reveal>
        <Reveal mode="scroll">
          <LifeCycleModel lifecycle={insights.lifecycle} survivalTop1000={survivalTop1000} />
        </Reveal>
        <Reveal mode="scroll">
          <SurvivalCurve name={n} results={insights.survival} />
        </Reveal>
      </div>

      <Reveal mode="load" delay={0.5} className="mt-6 flex md:justify-start">
        <ShareButton name={n.name} />
      </Reveal>
    </div>
  );
}
