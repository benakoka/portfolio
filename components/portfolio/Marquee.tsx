/** Decorative, ambient ticker of the same skills listed in the Instrumentation
 *  section below. Duplicated once for a seamless loop and hidden from
 *  assistive tech since it's a repeat of already-accessible content. Freezes
 *  under prefers-reduced-motion via CSS. */
export default function Marquee({ items }: { items: string[] }) {
  const strip = items.join("  ·  ") + "  ·  ";
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        <span className="mono">{strip}</span>
        <span className="mono">{strip}</span>
      </div>
    </div>
  );
}
