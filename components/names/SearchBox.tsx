"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Hit {
  name: string;
  total_count: number;
}

export default function SearchBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [fuzzy, setFuzzy] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/names/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setHits(data.hits ?? []);
        setFuzzy(data.fuzzy ?? false);
        setOpen(true);
        setActiveIdx(-1);
      } catch {
        // ignore aborted/failed lookups
      }
    }, 150);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function go(name: string) {
    setOpen(false);
    setQuery("");
    router.push(`/names/name/${encodeURIComponent(name.toLowerCase())}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || hits.length === 0) {
      if (e.key === "Enter" && query.trim()) go(query.trim());
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = activeIdx >= 0 ? hits[activeIdx] : hits[0];
      if (pick) go(pick.name);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="rounded-card border border-line bg-panel overflow-hidden focus-within:border-data transition-colors">
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="font-mono text-data text-sm">$</span>
          <input
            autoFocus={autoFocus}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => hits.length > 0 && setOpen(true)}
            placeholder="Type a first name…"
            className="flex-1 min-w-0 bg-transparent outline-none text-paper placeholder:text-muted font-mono text-base"
            aria-label="Search for a name"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>

      {open && hits.length > 0 && (
        <div className="absolute mt-2 w-full rounded-card border border-line bg-panel shadow-2xl overflow-hidden z-10">
          {fuzzy && (
            <div className="px-4 py-2 text-xs text-muted border-b border-line">
              No exact match — did you mean:
            </div>
          )}
          <ul>
            {hits.map((hit, i) => (
              <li key={hit.name}>
                <button
                  onClick={() => go(hit.name)}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={`w-full text-left px-5 py-3 flex items-center justify-between transition-colors ${
                    i === activeIdx ? "bg-panel-2 text-paper" : "text-paper/90"
                  }`}
                >
                  <span>{hit.name}</span>
                  {hit.total_count > 0 && (
                    <span className="font-mono text-xs text-muted">
                      {hit.total_count.toLocaleString()} born
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
