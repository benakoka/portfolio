"use client";

export default function InfoTooltip({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`relative inline-flex group ${className}`}>
      <button
        type="button"
        className="w-4 h-4 rounded-full border border-line text-muted text-[10px] leading-none flex items-center justify-center cursor-default hover:border-data hover:text-data transition-colors shrink-0"
        aria-label="More info"
      >
        i
      </button>
      <span
        role="tooltip"
        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 rounded-lg border border-line bg-panel-2 px-3 py-2 text-xs text-muted opacity-0 pointer-events-none transition-opacity z-20 shadow-lg group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
