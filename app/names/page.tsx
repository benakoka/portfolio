import Link from "next/link";
import SearchBox from "@/components/names/SearchBox";

const EXAMPLES = ["Brandon", "Olivia", "Mildred", "Emma", "Kevin"];

const FEATURES = [
  {
    tag: "01",
    title: "Living-age distribution",
    body: "Real SSA birth cohorts weighted by actuarial survival probability — not just when a name was popular, but how old people with it actually are today.",
  },
  {
    tag: "02",
    title: "Popularity arc",
    body: "The full 1880–present history: peak year, how far it's fallen (or risen), and a shape-based archetype badge.",
  },
  {
    tag: "03",
    title: "Geographic fingerprint",
    body: "Where a name over-indexes across US states and regions, relative to national baseline.",
  },
  {
    tag: "04",
    title: "Name neighbors",
    body: "The names whose rise and fall over the decades tracked yours most closely.",
  },
];

export default function NamesHome() {
  return (
    <div className="max-w-5xl mx-auto px-7">
      <section className="pt-20 pb-14 flex flex-col items-center text-center relative">
        <div
          aria-hidden
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-[min(900px,100vw)] h-[420px] pointer-events-none -z-10"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(63,214,196,0.10), transparent 65%)",
          }}
        />
        <h1 className="text-4xl sm:text-5xl font-semibold leading-tight max-w-2xl">
          What does the internet think of{" "}
          <span
            style={{
              backgroundImage:
                "linear-gradient(180deg, transparent 62%, rgba(212,255,74,0.4) 62%)",
            }}
          >
            your name?
          </span>
        </h1>
        <p className="mt-5 text-muted text-lg max-w-xl">
          Type any first name. Get a data-driven profile built from real SSA
          birth records and actuarial life tables.
        </p>

        <div className="mt-9 w-full flex justify-center">
          <SearchBox autoFocus />
        </div>

        <div className="mt-6 flex flex-wrap gap-2 justify-center text-sm">
          <span className="text-muted mr-1">Try:</span>
          {EXAMPLES.map((name) => (
            <Link
              key={name}
              href={`/names/name/${name.toLowerCase()}`}
              className="px-3 py-1 rounded-full border border-line text-paper/90 hover:border-data transition-colors font-mono text-xs"
            >
              {name}
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-line py-16">
        <div className="grid sm:grid-cols-2 gap-6">
          {FEATURES.map((f) => (
            <div key={f.tag} className="rounded-card border border-line bg-panel p-6">
              <span className="font-mono text-xs text-data">{f.tag}</span>
              <h3 className="mt-2 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
