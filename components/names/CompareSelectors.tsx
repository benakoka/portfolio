"use client";

import { useRouter } from "next/navigation";
import SearchBox from "./SearchBox";

export default function CompareSelectors({ a, b }: { a?: string; b?: string }) {
  const router = useRouter();

  function navigate(nextA?: string, nextB?: string) {
    const params = new URLSearchParams();
    if (nextA) params.set("a", nextA);
    if (nextB) params.set("b", nextB);
    router.push(`/names/compare${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div>
        <span className="block text-xs font-mono text-muted mb-2">NAME A</span>
        <SearchBox
          key={a ?? "a-empty"}
          initialValue={a}
          accentColor="var(--data)"
          placeholder="Type a first name…"
          onSelect={(n) => navigate(n, b)}
        />
      </div>
      <div>
        <span className="block text-xs font-mono text-muted mb-2">NAME B</span>
        <SearchBox
          key={b ?? "b-empty"}
          initialValue={b}
          accentColor="#ba3e1c"
          placeholder="Type a first name…"
          onSelect={(n) => navigate(a, n)}
        />
      </div>
    </div>
  );
}
