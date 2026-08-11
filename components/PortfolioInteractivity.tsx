"use client";

import { useEffect } from "react";

export default function PortfolioInteractivity() {
  useEffect(() => {
    // mobile nav toggle
    const toggle = document.getElementById("navToggle");
    const links = document.getElementById("navLinks");
    function onToggleClick() {
      if (!links || !toggle) return;
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }
    function onLinkClick() {
      if (!links || !toggle) return;
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
    toggle?.addEventListener("click", onToggleClick);
    const linkEls = links ? Array.from(links.querySelectorAll("a")) : [];
    linkEls.forEach((a) => a.addEventListener("click", onLinkClick));

    // active nav link on scroll
    const navA = document.querySelectorAll(".nav-links a");
    const byId = (id: string) => document.querySelector(`.nav-links a[href="#${id}"]`);
    const activeIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            navA.forEach((a) => a.classList.remove("active"));
            const link = byId(e.target.id);
            link?.classList.add("active");
            if (window.location.hash !== `#${e.target.id}`) {
              window.history.replaceState(null, "", `#${e.target.id}`);
            }
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    document.querySelectorAll("section[id]").forEach((s) => activeIo.observe(s));

    return () => {
      activeIo.disconnect();
      toggle?.removeEventListener("click", onToggleClick);
      linkEls.forEach((a) => a.removeEventListener("click", onLinkClick));
    };
  }, []);

  return null;
}
