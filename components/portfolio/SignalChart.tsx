"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

/**
 * The hero's signature graphic: a scatter of noisy observations with a
 * fitted regression line drawing itself in, echoing the OLS work
 * (Y = β₀ + β₁X + ε) from the NBA career-longevity case study below. Point
 * positions are generated once from a fixed seed so server and client
 * render identically (no Math.random at runtime).
 */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 440;
const H = 300;
const PAD = 26;

const rand = mulberry32(42);
const POINTS = Array.from({ length: 17 }, (_, i) => {
  const x = PAD + (i / 16) * (W - PAD * 2);
  const trend = H - PAD - (i / 16) * (H - PAD * 2 - 20);
  const noise = (rand() - 0.5) * 62;
  const y = Math.min(H - PAD, Math.max(PAD, trend + noise));
  return { x, y };
});

const LINE_Y1 = H - PAD - 6;
const LINE_Y2 = PAD + 18;

export default function SignalChart() {
  const cardRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [enableTilt, setEnableTilt] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; nearest: number } | null>(null);

  function onChartMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    if (x < PAD || x > W - PAD || y < PAD || y > H - PAD) {
      setCursor(null);
      return;
    }
    let nearest = 0;
    let bestD = Infinity;
    POINTS.forEach((p, i) => {
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        nearest = i;
      }
    });
    setCursor({ x, y, nearest });
  }
  function onChartLeave() {
    setCursor(null);
  }

  const rx = useSpring(useMotionValue(0), { stiffness: 220, damping: 22 });
  const ry = useSpring(useMotionValue(0), { stiffness: 220, damping: 22 });
  const rotateX = useTransform(rx, (v) => `${v}deg`);
  const rotateY = useTransform(ry, (v) => `${v}deg`);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!enableTilt) return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * 6);
    rx.set(py * -6);
  }
  function onMouseLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      ref={cardRef}
      className="signal-card"
      style={{ rotateX, rotateY }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseEnter={() =>
        setEnableTilt(!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      }
    >
      <div className="signal-bar">
        <span className="signal-dot" aria-hidden="true"></span>
        <span className="signal-title">~/models/ols_regression_fit.py</span>
      </div>
      <div className="signal-body">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Illustrative scatter plot with a fitted regression line, interactive on hover"
          onMouseMove={onChartMove}
          onMouseLeave={onChartLeave}
        >
          <line className="axis" x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} />
          <line className="axis" x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} />
          {[0.25, 0.5, 0.75].map((t) => (
            <line key={t} className="grid-line" x1={PAD} x2={W - PAD} y1={PAD + t * (H - PAD * 2)} y2={PAD + t * (H - PAD * 2)} />
          ))}

          <motion.line
            className="fit-line"
            x1={PAD}
            y1={LINE_Y1}
            x2={W - PAD}
            y2={LINE_Y2}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
          />

          {/* ambient "signal" travelling along the fitted line, on a loop */}
          <motion.circle
            className="fit-pulse"
            r={3}
            initial={{ cx: PAD, cy: LINE_Y1, opacity: 0 }}
            animate={{ cx: [PAD, W - PAD], cy: [LINE_Y1, LINE_Y2], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.6, delay: 1.8, repeat: Infinity, repeatDelay: 1.1, ease: "linear" }}
          />

          {POINTS.map((p, i) => (
            <motion.circle
              key={i}
              className="pt"
              cx={p.x}
              cy={p.y}
              r={cursor?.nearest === i ? 6.5 : 4.5}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.045, ease: [0.16, 1, 0.3, 1] }}
              style={{ transition: "r 0.15s ease" }}
            />
          ))}

          {cursor && (
            <g className="crosshair" aria-hidden="true">
              <line x1={PAD} y1={cursor.y} x2={W - PAD} y2={cursor.y} />
              <line x1={cursor.x} y1={PAD} x2={cursor.x} y2={H - PAD} />
              <circle className="crosshair-dot" cx={POINTS[cursor.nearest].x} cy={POINTS[cursor.nearest].y} r={9} />
            </g>
          )}
        </svg>
        {cursor && (
          <div className="signal-readout mono" style={{ left: `${(cursor.x / W) * 100}%`, top: `${(cursor.y / H) * 100}%` }}>
            obs #{String(cursor.nearest + 1).padStart(2, "0")}
          </div>
        )}
      </div>
      <div className="signal-caption">
        <span className="mono">Y = β₀ + β₁X + ε</span>
        <span className="mono signal-r2">R² = 0.84</span>
      </div>
    </motion.div>
  );
}
