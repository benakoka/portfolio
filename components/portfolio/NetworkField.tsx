"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient full-viewport signature graphic: a drifting network of nodes
 * that link when close, brighten near the cursor, and occasionally send a
 * bright "packet" pulse across an edge — a data/AI network rendered in
 * plain canvas (no dependencies). Sits behind everything as .pf-network
 * (see the AMBIENT BACKGROUND block in portfolio.css for the z-stack).
 *
 * Respects prefers-reduced-motion by drawing one static frame and never
 * starting the animation loop, and pauses via the Page Visibility API so
 * it doesn't burn cycles in a background tab.
 */

type Node = { x: number; y: number; vx: number; vy: number; r: number };
type Pulse = { from: number; to: number; t: number; speed: number };

const LINK_DIST = 150;
const MOUSE_DIST = 180;
const LINE_RGB = "91, 157, 255";
const MOUSE_LINE_RGB = "34, 211, 238";
const NODE_RGB = "162, 194, 255";
const PULSE_RGB = "170, 232, 255";

export default function NetworkField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    let pulses: Pulse[] = [];
    const mouse = { x: -9999, y: -9999, active: false };

    function resize() {
      width = canvas!.clientWidth;
      height = canvas!.clientHeight;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(105, Math.max(32, (width * height) / 17000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.3 + 0.7,
      }));
      pulses = [];
    }

    function onMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    }
    function onLeave() {
      mouse.active = false;
    }

    function drawStatic() {
      ctx!.clearRect(0, 0, width, height);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (d < LINK_DIST) {
            const o = (1 - d / LINK_DIST) * 0.2;
            ctx!.strokeStyle = `rgba(${LINE_RGB}, ${o})`;
            ctx!.beginPath();
            ctx!.moveTo(nodes[i].x, nodes[i].y);
            ctx!.lineTo(nodes[j].x, nodes[j].y);
            ctx!.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(${NODE_RGB}, 0.5)`;
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    resize();
    window.addEventListener("resize", resize);

    if (reduceMotion) {
      drawStatic();
      return () => window.removeEventListener("resize", resize);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);

    let raf = 0;
    let last = performance.now();
    let pulseCooldown = 600;

    function spawnPulse() {
      const a = Math.floor(Math.random() * nodes.length);
      let best = -1;
      let bestD = LINK_DIST;
      for (let b = 0; b < nodes.length; b++) {
        if (b === a) continue;
        const d = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y);
        if (d < bestD) {
          bestD = d;
          best = b;
        }
      }
      if (best !== -1) pulses.push({ from: a, to: best, t: 0, speed: 0.8 + Math.random() * 0.6 });
    }

    function tick(now: number) {
      const dt = Math.min(now - last, 48);
      last = now;

      pulseCooldown -= dt;
      if (pulseCooldown <= 0) {
        spawnPulse();
        pulseCooldown = 900 + Math.random() * 1500;
      }

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
        if (mouse.active) {
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < MOUSE_DIST && d > 0.01) {
            const f = (1 - d / MOUSE_DIST) * 0.018;
            n.vx += (dx / d) * f;
            n.vy += (dy / d) * f;
          }
        }
        const sp = Math.hypot(n.vx, n.vy);
        if (sp > 0.55) {
          n.vx = (n.vx / sp) * 0.55;
          n.vy = (n.vy / sp) * 0.55;
        }
      }

      ctx!.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (d < LINK_DIST) {
            const o = (1 - d / LINK_DIST) * 0.22;
            ctx!.strokeStyle = `rgba(${LINE_RGB}, ${o})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(nodes[i].x, nodes[i].y);
            ctx!.lineTo(nodes[j].x, nodes[j].y);
            ctx!.stroke();
          }
        }
        if (mouse.active) {
          const dx = nodes[i].x - mouse.x;
          const dy = nodes[i].y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < MOUSE_DIST) {
            const o = (1 - d / MOUSE_DIST) * 0.4;
            ctx!.strokeStyle = `rgba(${MOUSE_LINE_RGB}, ${o})`;
            ctx!.beginPath();
            ctx!.moveTo(nodes[i].x, nodes[i].y);
            ctx!.lineTo(mouse.x, mouse.y);
            ctx!.stroke();
          }
        }
      }

      for (const n of nodes) {
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(${NODE_RGB}, 0.55)`;
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      pulses = pulses.filter((p) => p.t < 1);
      for (const p of pulses) {
        const a = nodes[p.from];
        const b = nodes[p.to];
        if (!a || !b) continue;
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        ctx!.save();
        ctx!.shadowColor = `rgba(${PULSE_RGB}, 0.9)`;
        ctx!.shadowBlur = 9;
        ctx!.fillStyle = `rgba(${PULSE_RGB}, 0.95)`;
        ctx!.beginPath();
        ctx!.arc(x, y, 2, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
        p.t += 0.011 * p.speed;
      }

      raf = requestAnimationFrame(tick);
    }

    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    }

    raf = requestAnimationFrame(tick);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="pf-network" aria-hidden="true" />;
}
