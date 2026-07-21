"use client";

import { useEffect } from "react";

const PROMPT = "ben@portfolio:~$";

const LINES = [
  { cmd: "whoami", out: "Ben Akoka — Statistics & Data Science, UCSB" },
  { cmd: "interests", out: "Data analytics, machine learning, AI" },
  { cmd: "status", out: "Open to internships, research, and part-time work" },
];

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

export default function PortfolioInteractivity() {
  useEffect(() => {
    const term = document.getElementById("terminal");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function idlePrompt() {
      if (!term) return;
      const line = el("div", "terminal-line");
      line.appendChild(el("span", "prompt", PROMPT));
      line.appendChild(el("span", "term-cursor"));
      term.appendChild(line);
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    let interval: ReturnType<typeof setInterval> | null = null;

    if (term) {
      if (reduceMotion) {
        LINES.forEach((l) => {
          const line = el("div", "terminal-line");
          line.appendChild(el("span", "prompt", PROMPT));
          line.appendChild(el("span", "cmd-text", " " + l.cmd));
          term.appendChild(line);
          term.appendChild(el("div", "terminal-output", l.out));
        });
        idlePrompt();
      } else {
        let li = 0;
        const nextLine = () => {
          if (li >= LINES.length) {
            idlePrompt();
            return;
          }
          const l = LINES[li++];
          const line = el("div", "terminal-line");
          const cmdEl = el("span", "cmd-text", "");
          const cursorEl = el("span", "term-cursor");
          line.appendChild(el("span", "prompt", PROMPT));
          line.appendChild(cmdEl);
          line.appendChild(cursorEl);
          term.appendChild(line);

          const full = " " + l.cmd;
          let ci = 0;
          interval = setInterval(() => {
            ci++;
            cmdEl.textContent = full.slice(0, ci);
            if (ci >= full.length) {
              if (interval) clearInterval(interval);
              cursorEl.remove();
              timers.push(
                setTimeout(() => {
                  term.appendChild(el("div", "terminal-output", l.out));
                  timers.push(setTimeout(nextLine, 550));
                }, 250)
              );
            }
          }, 45);
        };
        nextLine();
      }
    }

    // scroll reveal for project cards
    const cards = document.querySelectorAll(".project-card");
    const revealIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("reveal");
            revealIo.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    cards.forEach((c) => revealIo.observe(c));

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
      timers.forEach(clearTimeout);
      if (interval) clearInterval(interval);
      revealIo.disconnect();
      activeIo.disconnect();
      toggle?.removeEventListener("click", onToggleClick);
      linkEls.forEach((a) => a.removeEventListener("click", onLinkClick));
    };
  }, []);

  return null;
}
