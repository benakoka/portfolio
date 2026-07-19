import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What Does the Internet Think of Your Name?",
  description:
    "A data-driven profile of any first name: living-age distribution, popularity history, and where it over-indexes across the US, built from real SSA data.",
  openGraph: {
    title: "What Does the Internet Think of Your Name?",
    description:
      "Type any first name and get a data-driven profile: age distribution, popularity arc, geographic fingerprint, and name neighbors, grounded in real SSA data.",
    type: "website",
  },
};

export default function NamesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-col">
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-ink/75 border-b border-line">
        <div className="max-w-5xl mx-auto px-5 sm:px-7 h-16 flex items-center justify-between gap-3">
          <Link
            href="/#projects"
            className="font-mono text-xs sm:text-sm text-data whitespace-nowrap shrink-0 hover:text-paper transition-colors"
          >
            ← Back to portfolio
          </Link>
          <ul className="flex gap-4 sm:gap-7 text-xs sm:text-sm text-muted shrink-0">
            <li>
              <Link href="/names" className="hover:text-paper transition-colors">
                Search
              </Link>
            </li>
            <li>
              <Link href="/names/about" className="hover:text-paper transition-colors">
                Methodology
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
      <footer className="max-w-5xl mx-auto w-full px-7 py-8 flex justify-between text-xs text-muted">
        <span>Built from SSA public data.</span>
        <span className="font-mono">v1.5</span>
      </footer>
    </div>
  );
}
