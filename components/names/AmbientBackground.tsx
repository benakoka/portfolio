"use client";

import { useEffect } from "react";
import NetworkField from "@/components/portfolio/NetworkField";

/**
 * Drop this into a page whose root element carries the `names-shell`
 * class (see the AMBIENT BACKGROUND block in globals.css) to get the same
 * particle-network + cursor-spotlight background as the portfolio home.
 * Left out of the Methodology page on purpose — that one stays plain for
 * easier reading.
 */
export default function AmbientBackground() {
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(".names-shell");
    if (!shell) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let pendingX = 0;
    let pendingY = 0;

    function onMove(e: MouseEvent) {
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        shell!.style.setProperty("--pf-mx", `${(pendingX / window.innerWidth) * 100}%`);
        shell!.style.setProperty("--pf-my", `${(pendingY / window.innerHeight) * 100}%`);
      });
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <NetworkField />;
}
