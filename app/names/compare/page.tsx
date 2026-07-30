import type { Metadata } from "next";
import { getProfile } from "@/lib/names/db";
import CompareSelectors from "@/components/names/CompareSelectors";
import CompareChart from "@/components/names/CompareChart";
import CompareGeoMap from "@/components/names/CompareGeoMap";
import CompareStats from "@/components/names/CompareStats";

export const metadata: Metadata = {
  title: "Compare two names — What does the internet think of your name?",
  description:
    "Compare the popularity history, rarity, gender split, and age profile of two first names side by side.",
};

type Props = { searchParams: Promise<{ a?: string; b?: string }> };

export default async function ComparePage({ searchParams }: Props) {
  const { a, b } = await searchParams;
  const profileA = a ? getProfile(a) : null;
  const profileB = b ? getProfile(b) : null;

  return (
    <div className="max-w-5xl mx-auto px-7 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-semibold">Compare two names</h1>
        <p className="mt-2 text-muted">
          Pick two names to see how they stack up, side by side.
        </p>
      </header>

      <CompareSelectors a={a} b={b} />

      {profileA && profileB ? (
        <div className="mt-8 flex flex-col gap-6">
          <CompareChart profileA={profileA} profileB={profileB} />
          <CompareGeoMap profileA={profileA} profileB={profileB} />
          <CompareStats profileA={profileA} profileB={profileB} />
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted">
          {a && !profileA && `No data for "${a}". `}
          {b && !profileB && `No data for "${b}". `}
          {(!a || !b) && "Pick two names above to compare them."}
        </p>
      )}
    </div>
  );
}
