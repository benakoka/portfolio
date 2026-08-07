import type { NameRow } from "@/lib/names/types";
import type { LifeCycleResult, LifeCycleStage, SurvivalResult } from "@/lib/names/predict";

const STAGE_STYLE: Record<LifeCycleStage, { color: string; dot: string }> = {
  Emerging: { color: "#3d8a63", dot: "#3d8a63" },
  Growing: { color: "var(--data)", dot: "#3d7a9e" },
  Peaking: { color: "#c9932c", dot: "#c9932c" },
  Declining: { color: "#ba6a3e", dot: "#ba6a3e" },
  Historic: { color: "#8073a8", dot: "#8073a8" },
  Extinct: { color: "var(--muted)", dot: "#8a8f98" },
};

const TREND_ARROW: Record<LifeCycleResult["trend"], string> = {
  rising: "↗",
  stable: "→",
  falling: "↘",
};

export default function LifeCycleModel({
  name,
  lifecycle,
  survivalTop1000,
}: {
  name: NameRow;
  lifecycle: LifeCycleResult;
  survivalTop1000: SurvivalResult | undefined;
}) {
  const style = STAGE_STYLE[lifecycle.stage];
  const remaining = survivalTop1000?.currentlyAbove ? survivalTop1000.medianRemaining : null;

  return (
    <div className="rounded-card border border-line bg-panel p-6">
      <h3 className="text-lg font-semibold mb-1">Name life-cycle stage</h3>
      <p className="text-sm text-muted mb-4">
        A rule-based classifier over {name.name}&apos;s recent growth rate, whether that growth is accelerating or
        cooling, and how it sits relative to its all-time peak.
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
            {remaining != null ? `~${remaining}y` : survivalTop1000?.currentlyAbove ? ">30y" : "n/a"}
          </div>
          <div className="text-[11px] text-muted mt-1">est. left in Top 1000</div>
        </div>
      </div>
    </div>
  );
}
