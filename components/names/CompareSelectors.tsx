"use client";

import { useRouter } from "next/navigation";
import SearchBox from "./SearchBox";

function Slot({
  label,
  accent,
  value,
  onPick,
  onClear,
}: {
  label: string;
  accent: string;
  value?: string;
  onPick: (name: string) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <span className="block text-xs font-mono text-muted mb-2">{label}</span>
      {value ? (
        <div className="flex items-center justify-between rounded-card border border-line bg-panel px-5 py-4">
          <span className="font-mono text-lg" style={{ color: accent }}>
            {value}
          </span>
          <button
            onClick={onClear}
            className="text-xs text-muted hover:text-paper transition-colors"
          >
            Change
          </button>
        </div>
      ) : (
        <SearchBox placeholder="Type a first name…" onSelect={onPick} />
      )}
    </div>
  );
}

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
      <Slot label="NAME A" accent="var(--data)" value={a} onPick={(n) => navigate(n, b)} onClear={() => navigate(undefined, b)} />
      <Slot label="NAME B" accent="#ba3e1c" value={b} onPick={(n) => navigate(a, n)} onClear={() => navigate(a, undefined)} />
    </div>
  );
}
