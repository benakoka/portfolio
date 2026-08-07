import type { Metadata } from "next";
import Link from "next/link";
import "./bengpt.css";
import Chat from "@/components/bengpt/Chat";

// Intentionally unlisted: no nav link, no sitemap entry, and noindex here so
// it doesn't show up in search results either. Reachable only by knowing
// the URL.
export const metadata: Metadata = {
  title: "BenGPT | Ben Akoka",
  description: "An AI built to sound like Ben Akoka.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BenGptPage() {
  return (
    <div className="bengpt-page">
      <header className="bengpt-header wrap">
        <Link className="bengpt-back" href="/">&larr; benakoka.com</Link>
        <h1>BenGPT</h1>
        <p className="bengpt-disclaimer">
          An AI built to sound like Ben Akoka — not Ben himself. Powered by Claude. Ask about his background,
          projects, or fit for a role, or use it for quick everyday stuff.
        </p>
      </header>
      <main className="bengpt-main wrap">
        <Chat />
      </main>
    </div>
  );
}
