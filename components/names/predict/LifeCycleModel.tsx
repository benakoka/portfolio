import type { LifeCycleResult, LifeCycleStage, SurvivalResult } from "@/lib/names/predict";

// Plain hex (not var(--token)) because these get concatenated with an alpha
// suffix below (`${color}66`), which only works on literal hex strings.
// Tuned to stay legible against the dark theme's near-black background.
const STAGE_STYLE: Record<LifeCycleStage, { color: string; dot: string }> = {
  Emerging: { color: "#4ade80", dot: "#4ade80" },
  Growing: { color: "#5b9dff", dot: "#5b9dff" }, // matches --data
  Peaking: { color: "#fbbf24", dot: "#fbbf24" },
  Declining: { color: "#fb923c", dot: "#fb923c" },
  Historic: { color: "#a78bfa", dot: "#a78bfa" },
  Extinct: { color: "#7c86a8", dot: "#8b93b0" }, // color matches --muted
};

const TREND_ARROW: Record<LifeCycleResult["trend"], string> = {
  rising: "↗",
  stable: "→",
  falling: "↘",
};

export default function LifeCycleModel({
  lifecycle,
  survivalTop1000,
}: {
  lifecycle: LifeCycleResult;
  survivalTop1000: SurvivalResult | undefined;
}) {
  const style = STAGE_STYLE[lifecycle.stage];
  const remaining = survivalTop1000?.currentlyAbove ? survivalTop1000.medianRemaining : null;

  return (
    <div className="rounded-card border border-line bg-panel p-6">
      <h3 className="text-lg font-semibold mb-1">Name life-cycle stage</h3>
      <p className="text-sm text-muted mb-4">
        A rule-based classifier over recent growth, momentum, and peak proximity.
      </p>

      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-mono text-sm mb-3"
        style={{ borderColor: `${style.color}66`, background: `${style.color}1a`, color: style.color }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: style.dot }} />
        {lifecycle.stage}
      </div>

      <p className="text-sm text-muted mb-5">{lifecycle.explanation}</p>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-line bg-panel-2 px-2 py-3">
          <div className="text-lg font-mono text-paper">
            {lifecycle.yearsSincePeak != null ? lifecycle.yearsSincePeak : "—"}
          </div>
          <div className="text-[11px] text-muted mt-1">years since peak</div>
        </div>
        <div className="rounded-lg border border-line bg-panel-2 px-2 py-3">
          <div className="text-lg font-mono capitalize" style={{ color: style.color }}>
            {TREND_ARROW[lifecycle.trend]} {lifecycle.trend}
          </div>
          <div className="text-[11px] text-muted mt-1">overall trend</div>
        </div>
        <div className="rounded-lg border border-line bg-panel-2 px-2 py-3">
          <div className="text-lg font-mono text-paper">
            {remaining != null ? `~${remaining} years` : survivalTop1000?.currentlyAbove ? "30+ years" : "n/a"}
          </div>
          <div className="text-[11px] text-muted mt-1">estimated time left in top 1000</div>
        </div>
      </div>
    </div>
  );
}
