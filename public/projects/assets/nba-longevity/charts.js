/*
 * Interactive replacements for the NBA career-longevity write-up's static
 * matplotlib figures. Every chart below is backed by real numbers pulled
 * from the analysis notebook's printed outputs (regression tables,
 * classification report, cluster profile means, injury counts) or, where
 * the notebook only produced an image, digitised as closely as reasonably
 * possible from the original PNG (boxplot quartiles, KM step curves, the
 * ROC curve, the elbow curve, the standardized logistic coefficients).
 * Distributions the notebook never printed as numbers (the raw career-
 * length histogram, the two scatter clouds, the residual scatter, the
 * per-cluster density curves) are reconstructed to match the shapes in
 * the original figures and the summary statistics that ARE known exactly
 * (sample sizes, means, medians, the 22.6% long-career rate, etc.) — not
 * independently fabricated findings.
 *
 * No dependencies: plain SVG, vanilla JS. Respects prefers-reduced-motion.
 */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var C = {
    data: "#5b9dff", // primary — matches site accent
    signal: "#22d3ee", // secondary
    warm: "#ff6b57", // "compare-b" warm accent
    violet: "#a78bfa",
    muted: "#7c86a8",
    mutedSoft: "rgba(124,134,168,0.45)",
    line: "#202847",
    lineSoft: "rgba(142,172,255,0.14)",
    paper: "#edf1fb",
  };

  function mulberry32(seed) {
    var a = seed;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gaussian(rng) {
    var u = 1 - rng();
    var v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function el(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    if (attrs) {
      for (var k in attrs) {
        if (attrs[k] != null) e.setAttribute(k, attrs[k]);
      }
    }
    return e;
  }

  function scaleLinear(domain, range) {
    var d0 = domain[0],
      d1 = domain[1],
      r0 = range[0],
      r1 = range[1];
    var span = d1 - d0 || 1;
    return function (v) {
      return r0 + ((v - d0) / span) * (r1 - r0);
    };
  }

  function ticks(domain, count) {
    var span = domain[1] - domain[0];
    var raw = span / count;
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var norm = raw / mag;
    var step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag;
    var start = Math.ceil(domain[0] / step) * step;
    var out = [];
    for (var v = start; v <= domain[1] + 1e-9; v += step) {
      out.push(Math.round(v * 1000) / 1000);
    }
    return out;
  }

  function fmt(v) {
    if (Math.abs(v) >= 1000) return (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + "k";
    if (Number.isInteger(v)) return String(v);
    return v.toFixed(v < 1 && v > -1 ? 2 : 1);
  }

  /* ---------- chart scaffold: SVG root + axes ---------- */

  function makeSvg(mount, W, H) {
    var svgEl = el("svg", {
      viewBox: "0 0 " + W + " " + H,
      class: "chart-svg",
      role: "img",
    });
    mount.appendChild(svgEl);
    return svgEl;
  }

  function axisX(svgEl, opts) {
    // opts: {x, yBase, scale, domain, count, label, fmt}
    var t = ticks(opts.domain, opts.count || 5);
    var g = el("g", { class: "chart-axis" });
    g.appendChild(
      el("line", { x1: opts.x0, x2: opts.x1, y1: opts.yBase, y2: opts.yBase, class: "chart-axis-line" })
    );
    t.forEach(function (v) {
      var x = opts.scale(v);
      var tick = el("g");
      tick.appendChild(el("line", { x1: x, x2: x, y1: opts.yBase, y2: opts.yBase + 5, class: "chart-axis-line" }));
      var txt = el("text", { x: x, y: opts.yBase + 18, class: "chart-tick", "text-anchor": "middle" });
      txt.textContent = (opts.fmt || fmt)(v);
      tick.appendChild(txt);
      g.appendChild(tick);
    });
    if (opts.label) {
      var lbl = el("text", {
        x: (opts.x0 + opts.x1) / 2,
        y: opts.yBase + 36,
        class: "chart-axis-label",
        "text-anchor": "middle",
      });
      lbl.textContent = opts.label;
      g.appendChild(lbl);
    }
    svgEl.appendChild(g);
  }

  function axisY(svgEl, opts) {
    // opts: {x0, y0, y1, scale, domain, count, label, fmt, grid, gridX1}
    var t = ticks(opts.domain, opts.count || 5);
    var g = el("g", { class: "chart-axis" });
    g.appendChild(el("line", { x1: opts.x0, x2: opts.x0, y1: opts.y0, y2: opts.y1, class: "chart-axis-line" }));
    t.forEach(function (v) {
      var y = opts.scale(v);
      if (opts.grid) {
        g.appendChild(el("line", { x1: opts.x0, x2: opts.gridX1, y1: y, y2: y, class: "chart-grid-line" }));
      }
      var txt = el("text", { x: opts.x0 - 8, y: y + 4, class: "chart-tick", "text-anchor": "end" });
      txt.textContent = (opts.fmt || fmt)(v);
      g.appendChild(txt);
    });
    if (opts.label) {
      var lbl = el("text", {
        x: -(opts.y0 + opts.y1) / 2,
        y: 2,
        class: "chart-axis-label",
        "text-anchor": "middle",
        transform: "rotate(-90)",
      });
      lbl.textContent = opts.label;
      g.appendChild(lbl);
    }
    svgEl.appendChild(g);
  }

  function legend(frame, items) {
    var wrap = el("div", { class: "chart-legend" });
    var box = document.createElement("div");
    box.className = "chart-legend";
    items.forEach(function (it) {
      var row = document.createElement("span");
      row.className = "chart-legend-item";
      var sw = document.createElement("span");
      sw.className = "chart-swatch";
      sw.style.background = it.color;
      row.appendChild(sw);
      row.appendChild(document.createTextNode(it.label));
      box.appendChild(row);
    });
    frame.appendChild(box);
    return wrap;
  }

  /* ---------- tooltip ---------- */

  function makeTooltip(frame) {
    var tip = document.createElement("div");
    tip.className = "chart-tooltip";
    tip.style.opacity = "0";
    frame.appendChild(tip);
    return {
      show: function (html, clientX, clientY) {
        var rect = frame.getBoundingClientRect();
        tip.innerHTML = html;
        tip.style.opacity = "1";
        var x = clientX - rect.left;
        var y = clientY - rect.top;
        tip.style.left = Math.min(Math.max(x, 4), rect.width - 4) + "px";
        tip.style.top = Math.max(y, 4) + "px";
      },
      hide: function () {
        tip.style.opacity = "0";
      },
    };
  }

  /* ---------- reveal-on-scroll ---------- */

  function onReveal(frame, cb) {
    if (REDUCE_MOTION) {
      cb();
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            cb();
            io.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(frame);
  }

  function animatePath(path, delay) {
    if (REDUCE_MOTION) return;
    var len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    path.getBoundingClientRect(); // force layout
    path.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.16,1,.3,1) " + (delay || 0) + "s";
    requestAnimationFrame(function () {
      path.style.strokeDashoffset = "0";
    });
  }

  function animateIn(node, delay) {
    if (REDUCE_MOTION) return;
    node.style.opacity = "0";
    node.getBoundingClientRect();
    node.style.transition = "opacity .5s ease " + (delay || 0) + "s, transform .5s cubic-bezier(.16,1,.3,1) " + (delay || 0) + "s";
    requestAnimationFrame(function () {
      node.style.opacity = "1";
    });
  }

  /* =====================================================================
     CHART RENDERERS
     ===================================================================== */

  // ---- Histogram: bars from pre-binned {x0,x1,count}[] ----
  function renderHistogram(mount, cfg) {
    var W = 460,
      H = 300,
      M = { l: 58, r: 16, t: 14, b: 40 };
    var svgEl = makeSvg(mount, W, H);
    var x0 = M.l,
      x1 = W - M.r,
      y0 = H - M.b,
      y1 = M.t;
    var xMax = cfg.bins[cfg.bins.length - 1].x1;
    var yMax = Math.max.apply(null, cfg.bins.map(function (b) { return b.count; }));
    var sx = scaleLinear([0, xMax], [x0, x1]);
    var sy = scaleLinear([0, yMax * 1.12], [y0, y1]);

    axisY(svgEl, { x0: x0, y0: y0, y1: y1, scale: sy, domain: [0, yMax * 1.12], count: 4, label: cfg.yLabel, grid: true, gridX1: x1 });
    axisX(svgEl, { x0: x0, x1: x1, yBase: y0, scale: sx, domain: [0, xMax], count: 6, label: cfg.xLabel });

    if (cfg.thresholdLine != null) {
      var tx = sx(cfg.thresholdLine);
      svgEl.appendChild(el("line", { x1: tx, x2: tx, y1: y0, y2: y1, class: "chart-ref-line" }));
      var tt = el("text", { x: tx + 5, y: y1 + 12, class: "chart-tick", fill: C.warm });
      tt.textContent = cfg.thresholdLabel || "";
      svgEl.appendChild(tt);
    }

    var tip = makeTooltip(mount);
    var bars = cfg.bins.map(function (b) {
      var bx = sx(b.x0),
        bw = Math.max(sx(b.x1) - sx(b.x0) - 1, 1);
      var rect = el("rect", {
        x: bx,
        width: bw,
        y: y0,
        height: 0,
        fill: cfg.color || C.data,
        class: "chart-bar",
      });
      svgEl.appendChild(rect);
      rect.addEventListener("mousemove", function (e) {
        tip.show(b.x0 + "–" + b.x1 + " szn<br><strong>" + b.count + "</strong> players", e.clientX, e.clientY);
        rect.classList.add("is-hot");
      });
      rect.addEventListener("mouseleave", function () {
        tip.hide();
        rect.classList.remove("is-hot");
      });
      return { rect: rect, y: sy(b.count), h: y0 - sy(b.count) };
    });

    onReveal(mount, function () {
      bars.forEach(function (b, i) {
        if (REDUCE_MOTION) {
          b.rect.setAttribute("y", b.y);
          b.rect.setAttribute("height", b.h);
          return;
        }
        b.rect.style.transition = "y .6s cubic-bezier(.16,1,.3,1) " + i * 0.012 + "s, height .6s cubic-bezier(.16,1,.3,1) " + i * 0.012 + "s";
        requestAnimationFrame(function () {
          b.rect.setAttribute("y", b.y);
          b.rect.setAttribute("height", b.h);
        });
      });
    });
  }

  // ---- Simple / ranked bar chart (vertical) ----
  function renderBarChart(mount, cfg) {
    var W = 460,
      H = 320,
      M = { l: 58, r: 12, t: 14, b: cfg.rotateLabels ? 66 : 34 };
    var svgEl = makeSvg(mount, W, H);
    var x0 = M.l,
      x1 = W - M.r,
      y0 = H - M.b,
      y1 = M.t;
    var n = cfg.bars.length;
    var vals = cfg.bars.map(function (b) { return b.value; });
    var vMin = Math.min(0, Math.min.apply(null, vals));
    var vMax = Math.max(0, Math.max.apply(null, vals));
    var pad = (vMax - vMin) * 0.12 || 1;
    var domain = [vMin - (vMin < 0 ? pad : 0), vMax + pad];
    var sy = scaleLinear(domain, [y0, y1]);
    var zeroY = sy(0);
    var bw = ((x1 - x0) / n) * 0.62;
    var slot = (x1 - x0) / n;

    axisY(svgEl, { x0: x0, y0: y0, y1: y1, scale: sy, domain: domain, count: 4, label: cfg.yLabel, grid: true, gridX1: x1 });
    svgEl.appendChild(el("line", { x1: x0, x2: x1, y1: zeroY, y2: zeroY, class: "chart-axis-line" }));

    var tip = makeTooltip(mount);
    var ly = y0 + (cfg.rotateLabels ? 14 : 18);
    var bars = cfg.bars.map(function (b, i) {
      var cx = x0 + slot * (i + 0.5);
      var rect = el("rect", {
        x: cx - bw / 2,
        width: bw,
        y: zeroY,
        height: 0,
        fill: b.color || cfg.color || C.data,
        class: "chart-bar",
      });
      svgEl.appendChild(rect);
      var labelText = el("text", {
        x: cx,
        y: ly,
        class: "chart-tick",
        "text-anchor": cfg.rotateLabels ? "end" : "middle",
        transform: cfg.rotateLabels ? "rotate(-40 " + cx + " " + ly + ")" : null,
      });
      labelText.textContent = b.label;
      svgEl.appendChild(labelText);
      rect.addEventListener("mousemove", function (e) {
        tip.show("<strong>" + b.label + "</strong><br>" + (cfg.tooltipFmt ? cfg.tooltipFmt(b) : b.value), e.clientX, e.clientY);
        rect.classList.add("is-hot");
      });
      rect.addEventListener("mouseleave", function () {
        tip.hide();
        rect.classList.remove("is-hot");
      });
      var barTop = Math.min(sy(b.value), zeroY);
      var barH = Math.abs(sy(b.value) - zeroY);
      return { rect: rect, y: barTop, h: barH };
    });

    onReveal(mount, function () {
      bars.forEach(function (b, i) {
        if (REDUCE_MOTION) {
          b.rect.setAttribute("y", b.y);
          b.rect.setAttribute("height", b.h);
          return;
        }
        b.rect.style.transition = "y .6s cubic-bezier(.16,1,.3,1) " + i * 0.05 + "s, height .6s cubic-bezier(.16,1,.3,1) " + i * 0.05 + "s";
        requestAnimationFrame(function () {
          b.rect.setAttribute("y", b.y);
          b.rect.setAttribute("height", b.h);
        });
      });
    });
  }

  // ---- Grouped bar chart (2 series) ----
  function renderGroupedBar(mount, cfg) {
    var W = 460,
      H = 320,
      M = { l: 58, r: 12, t: 14, b: 44 };
    var svgEl = makeSvg(mount, W, H);
    var x0 = M.l,
      x1 = W - M.r,
      y0 = H - M.b,
      y1 = M.t;
    var groups = cfg.groups;
    var seriesNames = cfg.series;
    var colors = cfg.colors || [C.data, C.warm];
    var yMax =
      Math.max.apply(
        null,
        groups.map(function (g) {
          return Math.max.apply(null, seriesNames.map(function (s) { return g[s]; }));
        })
      ) * 1.15;
    var sy = scaleLinear([0, yMax], [y0, y1]);
    var slot = (x1 - x0) / groups.length;
    var groupW = slot * 0.66;
    var barW = groupW / seriesNames.length;

    axisY(svgEl, { x0: x0, y0: y0, y1: y1, scale: sy, domain: [0, yMax], count: 4, label: cfg.yLabel, grid: true, gridX1: x1 });
    svgEl.appendChild(el("line", { x1: x0, x2: x1, y1: y0, y2: y0, class: "chart-axis-line" }));

    var tip = makeTooltip(mount);
    var bars = [];
    groups.forEach(function (g, gi) {
      var gx = x0 + slot * (gi + 0.5) - groupW / 2;
      seriesNames.forEach(function (s, si) {
        var cx = gx + barW * si;
        var rect = el("rect", { x: cx, width: barW - 2, y: y0, height: 0, fill: colors[si], class: "chart-bar" });
        svgEl.appendChild(rect);
        rect.addEventListener("mousemove", function (e) {
          tip.show("<strong>" + g.label + "</strong> · " + s + "<br>" + g[s].toFixed(1) + " seasons", e.clientX, e.clientY);
          rect.classList.add("is-hot");
        });
        rect.addEventListener("mouseleave", function () {
          tip.hide();
          rect.classList.remove("is-hot");
        });
        bars.push({ rect: rect, y: sy(g[s]), h: y0 - sy(g[s]), delay: gi * 0.08 + si * 0.04 });
      });
      var lbl = el("text", { x: x0 + slot * (gi + 0.5), y: y0 + 18, class: "chart-tick", "text-anchor": "middle" });
      lbl.textContent = g.label;
      svgEl.appendChild(lbl);
    });

    legend(mount, seriesNames.map(function (s, i) { return { label: s, color: colors[i] }; }));

    onReveal(mount, function () {
      bars.forEach(function (b) {
        if (REDUCE_MOTION) {
          b.rect.setAttribute("y", b.y);
          b.rect.setAttribute("height", b.h);
          return;
        }
        b.rect.style.transition = "y .6s cubic-bezier(.16,1,.3,1) " + b.delay + "s, height .6s cubic-bezier(.16,1,.3,1) " + b.delay + "s";
        requestAnimationFrame(function () {
          b.rect.setAttribute("y", b.y);
          b.rect.setAttribute("height", b.h);
        });
      });
    });
  }

  // ---- Box plot ----
  function renderBoxplot(mount, cfg) {
    var W = 460,
      H = 320,
      M = { l: 58, r: 12, t: 14, b: 40 };
    var svgEl = makeSvg(mount, W, H);
    var x0 = M.l,
      x1 = W - M.r,
      y0 = H - M.b,
      y1 = M.t;
    var groups = cfg.groups;
    var yMax = cfg.yMax != null ? cfg.yMax : Math.max.apply(null, groups.map(function (g) { return Math.max(g.max, (g.outliers || []).reduce(function (a, b) { return Math.max(a, b); }, 0)); })) * 1.08;
    var sy = scaleLinear([0, yMax], [y0, y1]);
    var slot = (x1 - x0) / groups.length;
    var boxW = slot * 0.42;

    axisY(svgEl, { x0: x0, y0: y0, y1: y1, scale: sy, domain: [0, yMax], count: 5, label: cfg.yLabel, grid: true, gridX1: x1 });
    svgEl.appendChild(el("line", { x1: x0, x2: x1, y1: y0, y2: y0, class: "chart-axis-line" }));

    var tip = makeTooltip(mount);
    var pieces = [];
    groups.forEach(function (g, i) {
      var cx = x0 + slot * (i + 0.5);
      var color = g.color || cfg.color || C.data;
      var grp = el("g", { class: "chart-box" });

      var whisker = el("line", { x1: cx, x2: cx, y1: sy(g.min), y2: sy(g.max), class: "chart-whisker", stroke: color });
      grp.appendChild(whisker);
      grp.appendChild(el("line", { x1: cx - boxW * 0.22, x2: cx + boxW * 0.22, y1: sy(g.min), y2: sy(g.min), class: "chart-whisker", stroke: color }));
      grp.appendChild(el("line", { x1: cx - boxW * 0.22, x2: cx + boxW * 0.22, y1: sy(g.max), y2: sy(g.max), class: "chart-whisker", stroke: color }));

      var box = el("rect", {
        x: cx - boxW / 2,
        width: boxW,
        y: sy(g.q3),
        height: Math.max(sy(g.q1) - sy(g.q3), 1),
        fill: color,
        "fill-opacity": 0.28,
        stroke: color,
        class: "chart-box-rect",
      });
      grp.appendChild(box);

      var med = el("line", { x1: cx - boxW / 2, x2: cx + boxW / 2, y1: sy(g.median), y2: sy(g.median), class: "chart-median", stroke: color });
      grp.appendChild(med);

      (g.outliers || []).forEach(function (o) {
        grp.appendChild(el("circle", { cx: cx, cy: sy(o), r: 2.6, fill: "none", stroke: color, "stroke-width": 1 }));
      });

      svgEl.appendChild(grp);
      pieces.push(grp);

      var hit = el("rect", { x: cx - slot / 2, width: slot, y: y1, height: y0 - y1, fill: "transparent" });
      svgEl.appendChild(hit);
      hit.addEventListener("mousemove", function (e) {
        tip.show(
          "<strong>" + g.label + "</strong>" + (g.n ? " (n=" + g.n + ")" : "") + "<br>median " + g.median +
            " · IQR " + g.q1 + "–" + g.q3,
          e.clientX,
          e.clientY
        );
      });
      hit.addEventListener("mouseleave", function () {
        tip.hide();
      });

      var lbl = el("text", { x: cx, y: y0 + 18, class: "chart-tick", "text-anchor": "middle" });
      lbl.textContent = g.label;
      svgEl.appendChild(lbl);
    });

    onReveal(mount, function () {
      pieces.forEach(function (p, i) {
        animateIn(p, i * 0.07);
      });
    });
  }

  // ---- Scatter ----
  function renderScatter(mount, cfg) {
    var W = 460,
      H = 300,
      M = { l: 58, r: 16, t: 14, b: 40 };
    var svgEl = makeSvg(mount, W, H);
    var x0 = M.l,
      x1 = W - M.r,
      y0 = H - M.b,
      y1 = M.t;
    var sx = scaleLinear(cfg.xDomain, [x0, x1]);
    var sy = scaleLinear(cfg.yDomain, [y0, y1]);

    axisY(svgEl, { x0: x0, y0: y0, y1: y1, scale: sy, domain: cfg.yDomain, count: 5, label: cfg.yLabel, grid: true, gridX1: x1 });
    axisX(svgEl, { x0: x0, x1: x1, yBase: y0, scale: sx, domain: cfg.xDomain, count: 6, label: cfg.xLabel });

    var tip = makeTooltip(mount);
    var pts = cfg.points.map(function (p) {
      var c = el("circle", {
        cx: sx(p.x),
        cy: sy(p.y),
        r: cfg.r || 2.6,
        fill: p.color || cfg.color || C.data,
        "fill-opacity": cfg.opacity || 0.55,
        class: "chart-pt",
      });
      svgEl.appendChild(c);
      c.addEventListener("mousemove", function (e) {
        tip.show(cfg.tooltip ? cfg.tooltip(p) : p.x.toFixed(1) + ", " + p.y.toFixed(1), e.clientX, e.clientY);
        c.setAttribute("r", (cfg.r || 2.6) * 1.8);
      });
      c.addEventListener("mouseleave", function () {
        tip.hide();
        c.setAttribute("r", cfg.r || 2.6);
      });
      return c;
    });

    if (cfg.legendItems) legend(mount, cfg.legendItems);

    onReveal(mount, function () {
      pts.forEach(function (p, i) {
        animateIn(p, Math.min(i * 0.003, 0.9));
      });
    });
  }

  // ---- Residual scatter (scatter + zero reference line) ----
  function renderResidual(mount, cfg) {
    var W = 460,
      H = 300,
      M = { l: 58, r: 16, t: 14, b: 40 };
    var svgEl = makeSvg(mount, W, H);
    var x0 = M.l,
      x1 = W - M.r,
      y0 = H - M.b,
      y1 = M.t;
    var sx = scaleLinear(cfg.xDomain, [x0, x1]);
    var sy = scaleLinear(cfg.yDomain, [y0, y1]);

    axisY(svgEl, { x0: x0, y0: y0, y1: y1, scale: sy, domain: cfg.yDomain, count: 5, label: cfg.yLabel, grid: true, gridX1: x1 });
    axisX(svgEl, { x0: x0, x1: x1, yBase: y0, scale: sx, domain: cfg.xDomain, count: 5, label: cfg.xLabel });

    var zy = sy(0);
    svgEl.appendChild(el("line", { x1: x0, x2: x1, y1: zy, y2: zy, class: "chart-ref-line" }));

    var tip = makeTooltip(mount);
    var pts = cfg.points.map(function (p) {
      var c = el("circle", { cx: sx(p.x), cy: sy(p.y), r: 2.6, fill: C.data, "fill-opacity": 0.5, class: "chart-pt" });
      svgEl.appendChild(c);
      c.addEventListener("mousemove", function (e) {
        tip.show("fitted " + p.x.toFixed(1) + "<br>resid " + (p.y >= 0 ? "+" : "") + p.y.toFixed(1), e.clientX, e.clientY);
        c.setAttribute("r", 5);
      });
      c.addEventListener("mouseleave", function () {
        tip.hide();
        c.setAttribute("r", 2.6);
      });
      return c;
    });

    onReveal(mount, function () {
      pts.forEach(function (p, i) {
        animateIn(p, Math.min(i * 0.003, 0.9));
      });
    });
  }

  // ---- Overlapping density curves ----
  function renderDensity(mount, cfg) {
    var W = 460,
      H = 300,
      M = { l: 58, r: 16, t: 14, b: 40 };
    var svgEl = makeSvg(mount, W, H);
    var x0 = M.l,
      x1 = W - M.r,
      y0 = H - M.b,
      y1 = M.t;
    var sx = scaleLinear(cfg.xDomain, [x0, x1]);
    var yMax = Math.max.apply(
      null,
      cfg.series.map(function (s) { return Math.max.apply(null, s.points.map(function (p) { return p[1]; })); })
    ) * 1.15;
    var sy = scaleLinear([0, yMax], [y0, y1]);

    axisY(svgEl, { x0: x0, y0: y0, y1: y1, scale: sy, domain: [0, yMax], count: 4, label: cfg.yLabel, grid: true, gridX1: x1 });
    axisX(svgEl, { x0: x0, x1: x1, yBase: y0, scale: sx, domain: cfg.xDomain, count: 6, label: cfg.xLabel });

    var pieces = [];
    cfg.series.forEach(function (s) {
      var d = "M " + sx(s.points[0][0]) + " " + y0;
      s.points.forEach(function (p) {
        d += " L " + sx(p[0]) + " " + sy(p[1]);
      });
      d += " L " + sx(s.points[s.points.length - 1][0]) + " " + y0 + " Z";
      var path = el("path", { d: d, fill: s.color, "fill-opacity": 0.28, stroke: s.color, "stroke-width": 1.6, class: "chart-density" });
      svgEl.appendChild(path);
      pieces.push(path);
    });

    legend(mount, cfg.series.map(function (s) { return { label: s.label, color: s.color }; }));

    onReveal(mount, function () {
      pieces.forEach(function (p, i) {
        animateIn(p, i * 0.15);
      });
    });
  }

  // ---- Confusion matrix heatmap ----
  function renderConfusion(mount, cfg) {
    var W = 300,
      H = 300,
      pad = 74;
    var svgEl = makeSvg(mount, W, H);
    var cell = (W - pad - 20) / 2;
    var x0 = pad,
      y0 = 24;
    var vals = cfg.matrix; // [[TN,FP],[FN,TP]]
    var max = Math.max(vals[0][0], vals[0][1], vals[1][0], vals[1][1]);
    var tip = makeTooltip(mount);

    var labels = cfg.labels;
    // axis labels
    var yTitle = el("text", { x: 14, y: y0 + cell, class: "chart-axis-label", "text-anchor": "middle", transform: "rotate(-90 14 " + (y0 + cell) + ")" });
    yTitle.textContent = "True";
    svgEl.appendChild(yTitle);
    var xTitle = el("text", { x: x0 + cell, y: H - 4, class: "chart-axis-label", "text-anchor": "middle" });
    xTitle.textContent = "Predicted";
    svgEl.appendChild(xTitle);

    for (var r = 0; r < 2; r++) {
      var rl = el("text", { x: x0 - 8, y: y0 + cell * r + cell / 2 + 4, class: "chart-tick", "text-anchor": "end" });
      rl.textContent = labels[r];
      svgEl.appendChild(rl);
      for (var c = 0; c < 2; c++) {
        if (r === 0) {
          var cl = el("text", { x: x0 + cell * c + cell / 2, y: y0 - 8, class: "chart-tick", "text-anchor": "middle" });
          cl.textContent = labels[c];
          svgEl.appendChild(cl);
        }
        var v = vals[r][c];
        var isCorrect = r === c;
        var t = v / max;
        var color = isCorrect ? C.data : C.warm;
        var rect = el("rect", {
          x: x0 + cell * c,
          y: y0 + cell * r,
          width: cell - 3,
          height: cell - 3,
          rx: 6,
          fill: color,
          "fill-opacity": 0.15 + t * 0.65,
          stroke: color,
          class: "chart-conf-cell",
        });
        svgEl.appendChild(rect);
        var txt = el("text", {
          x: x0 + cell * c + cell / 2,
          y: y0 + cell * r + cell / 2 + 6,
          "text-anchor": "middle",
          class: "chart-conf-num",
          fill: t > 0.55 ? "#05070d" : C.paper,
        });
        txt.textContent = v;
        svgEl.appendChild(txt);
        (function (rect, r, c, v) {
          rect.addEventListener("mousemove", function (e) {
            var pct = ((v / (r === 0 ? vals[0][0] + vals[0][1] : vals[1][0] + vals[1][1])) * 100).toFixed(0);
            tip.show(
              "actually <strong>" + labels[r] + "</strong>, predicted <strong>" + labels[c] + "</strong><br>" + v + " players (" + pct + "%)",
              e.clientX,
              e.clientY
            );
          });
          rect.addEventListener("mouseleave", function () {
            tip.hide();
          });
        })(rect, r, c, v);
      }
    }

    onReveal(mount, function () {
      svgEl.querySelectorAll(".chart-conf-cell, .chart-conf-num").forEach(function (n, i) {
        animateIn(n, i * 0.06);
      });
    });
  }

  // ---- ROC curve ----
  function renderROC(mount, cfg) {
    var W = 300,
      H = 300,
      M = { l: 52, r: 12, t: 14, b: 34 };
    var svgEl = makeSvg(mount, W, H);
    var x0 = M.l,
      x1 = W - M.r,
      y0 = H - M.b,
      y1 = M.t;
    var sx = scaleLinear([0, 1], [x0, x1]);
    var sy = scaleLinear([0, 1], [y0, y1]);

    axisY(svgEl, { x0: x0, y0: y0, y1: y1, scale: sy, domain: [0, 1], count: 5, label: "True positive rate", grid: true, gridX1: x1 });
    axisX(svgEl, { x0: x0, x1: x1, yBase: y0, scale: sx, domain: [0, 1], count: 5, label: "False positive rate" });

    svgEl.appendChild(el("line", { x1: sx(0), x2: sx(1), y1: sy(0), y2: sy(1), class: "chart-diag" }));

    var d = "M " + sx(cfg.points[0][0]) + " " + sy(cfg.points[0][1]);
    cfg.points.forEach(function (p, i) {
      if (i === 0) return;
      d += " L " + sx(p[0]) + " " + sy(p[1]);
    });
    var path = el("path", { d: d, fill: "none", stroke: C.data, "stroke-width": 2.5, class: "chart-line" });
    svgEl.appendChild(path);

    var auc = el("text", { x: x1 - 8, y: y1 + 16, class: "chart-tick", "text-anchor": "end", fill: C.data });
    auc.textContent = "AUC = " + cfg.auc.toFixed(3);
    svgEl.appendChild(auc);

    onReveal(mount, function () {
      animatePath(path, 0);
    });
  }

  // ---- Kaplan-Meier step survival ----
  function renderKM(mount, cfg) {
    var W = 460,
      H = 300,
      M = { l: 58, r: 16, t: 14, b: 40 };
    var svgEl = makeSvg(mount, W, H);
    var x0 = M.l,
      x1 = W - M.r,
      y0 = H - M.b,
      y1 = M.t;
    var xMax = cfg.xMax || 22;
    var sx = scaleLinear([0, xMax], [x0, x1]);
    var sy = scaleLinear([0, 1], [y0, y1]);

    axisY(svgEl, { x0: x0, y0: y0, y1: y1, scale: sy, domain: [0, 1], count: 5, label: "Survival probability", grid: true, gridX1: x1 });
    axisX(svgEl, { x0: x0, x1: x1, yBase: y0, scale: sx, domain: [0, xMax], count: 5, label: cfg.xLabel || "Career seasons" });

    var tip = makeTooltip(mount);
    var paths = [];
    cfg.series.forEach(function (s) {
      var d = "M " + sx(s.points[0][0]) + " " + sy(s.points[0][1]);
      for (var i = 1; i < s.points.length; i++) {
        var prev = s.points[i - 1],
          cur = s.points[i];
        d += " L " + sx(cur[0]) + " " + sy(prev[1]); // horizontal
        d += " L " + sx(cur[0]) + " " + sy(cur[1]); // vertical step
      }
      var path = el("path", { d: d, fill: "none", stroke: s.color, "stroke-width": 2.2, class: "chart-line" });
      svgEl.appendChild(path);
      paths.push(path);

      // invisible wide hit path for tooltip
      var hitPts = s.points;
      var hit = el("path", { d: d, fill: "none", stroke: "transparent", "stroke-width": 14 });
      svgEl.appendChild(hit);
      hit.addEventListener("mousemove", function (e) {
        var rect = svgEl.getBoundingClientRect();
        var mx = ((e.clientX - rect.left) / rect.width) * W;
        var t = Math.max(0, Math.min(xMax, sx.invert ? 0 : (mx - x0) / (x1 - x0) * xMax));
        var nearest = hitPts[0];
        hitPts.forEach(function (p) {
          if (p[0] <= t) nearest = p;
        });
        tip.show("<strong>" + s.label + "</strong><br>t=" + nearest[0] + " · S=" + nearest[1].toFixed(2), e.clientX, e.clientY);
      });
      hit.addEventListener("mouseleave", function () {
        tip.hide();
      });
    });

    legend(mount, cfg.series.map(function (s) { return { label: s.label, color: s.color }; }));
    if (cfg.note) {
      var note = el("text", { x: x1, y: y1 - 2, class: "chart-tick", "text-anchor": "end", fill: C.muted });
      note.textContent = cfg.note;
      svgEl.appendChild(note);
    }

    onReveal(mount, function () {
      paths.forEach(function (p, i) {
        animatePath(p, i * 0.15);
      });
    });
  }

  // ---- Simple line (elbow) ----
  function renderLine(mount, cfg) {
    var W = 460,
      H = 260,
      M = { l: 62, r: 16, t: 14, b: 36 };
    var svgEl = makeSvg(mount, W, H);
    var x0 = M.l,
      x1 = W - M.r,
      y0 = H - M.b,
      y1 = M.t;
    var sx = scaleLinear(cfg.xDomain, [x0, x1]);
    var sy = scaleLinear(cfg.yDomain, [y0, y1]);

    axisY(svgEl, { x0: x0, y0: y0, y1: y1, scale: sy, domain: cfg.yDomain, count: 4, label: cfg.yLabel, grid: true, gridX1: x1 });
    axisX(svgEl, { x0: x0, x1: x1, yBase: y0, scale: sx, domain: cfg.xDomain, count: cfg.points.length, label: cfg.xLabel, fmt: function (v) { return String(Math.round(v)); } });

    var d = cfg.points.map(function (p, i) { return (i === 0 ? "M " : "L ") + sx(p[0]) + " " + sy(p[1]); }).join(" ");
    var path = el("path", { d: d, fill: "none", stroke: C.data, "stroke-width": 2.2, class: "chart-line" });
    svgEl.appendChild(path);

    var tip = makeTooltip(mount);
    var dots = cfg.points.map(function (p) {
      var isMark = cfg.mark === p[0];
      var c = el("circle", { cx: sx(p[0]), cy: sy(p[1]), r: isMark ? 6 : 4, fill: isMark ? C.warm : C.data, class: "chart-pt" });
      svgEl.appendChild(c);
      c.addEventListener("mousemove", function (e) {
        tip.show("k=" + p[0] + "<br>inertia " + Math.round(p[1]) + (isMark ? "<br><em>chosen (elbow)</em>" : ""), e.clientX, e.clientY);
      });
      c.addEventListener("mouseleave", function () {
        tip.hide();
      });
      return c;
    });

    onReveal(mount, function () {
      animatePath(path, 0);
      dots.forEach(function (d, i) {
        animateIn(d, 0.1 + i * 0.06);
      });
    });
  }

  /* =====================================================================
     DATA (see file header for provenance notes)
     ===================================================================== */

  var rng;

  function buildCareerHistogram() {
    // Right-skewed synthetic histogram matching: n=2741, 22.6% (619) with
    // career_seasons >= 10 (both exact, from the notebook output), most
    // mass in the first few seasons per the write-up's "heavily right-
    // skewed" description.
    rng = mulberry32(11);
    var bins = [];
    for (var i = 1; i <= 22; i++) bins.push({ x0: i, x1: i + 1, count: 0 });
    var total = 2741,
      longTarget = 619;
    var shortTotal = total - longTarget;
    // short tail (1-9 seasons): geometric-ish decay
    var shortWeights = [];
    for (i = 0; i < 9; i++) shortWeights.push(Math.pow(0.78, i));
    var wSum = shortWeights.reduce(function (a, b) { return a + b; }, 0);
    shortWeights.forEach(function (w, i) {
      bins[i].count = Math.round((w / wSum) * shortTotal);
    });
    // long tail (10-22 seasons): decaying
    var longWeights = [];
    for (i = 0; i < 13; i++) longWeights.push(Math.pow(0.8, i));
    var lSum = longWeights.reduce(function (a, b) { return a + b; }, 0);
    longWeights.forEach(function (w, i) {
      bins[9 + i].count = Math.round((w / lSum) * longTarget);
    });
    return bins;
  }

  /* ---------- mount ---------- */

  var CHARTS = {
    "chart-fig1a": function (m) {
      renderHistogram(m, {
        bins: buildCareerHistogram(),
        xLabel: "Career seasons (≥ 20 games)",
        yLabel: "Players",
        color: C.data,
        thresholdLine: 10,
        thresholdLabel: "long-career threshold",
      });
    },
    "chart-fig1b": function (m) {
      renderBarChart(m, {
        bars: [
          { label: "1980s", value: 6.1 },
          { label: "1990s", value: 5.2 },
          { label: "2000s", value: 4.3 },
          { label: "2010s", value: 3.4 },
        ],
        yLabel: "Median seasons",
        color: C.signal,
        tooltipFmt: function (b) { return b.value.toFixed(1) + " seasons (median)"; },
      });
    },
    "chart-fig2a": function (m) {
      renderBoxplot(m, {
        yLabel: "Career seasons",
        yMax: 24,
        groups: [
          { label: "G", min: 1, q1: 2, median: 4, q3: 9, max: 19, outliers: [22], color: C.data },
          { label: "F", min: 1, q1: 2, median: 4, q3: 9, max: 19, outliers: [20, 21], color: C.signal },
          { label: "C", min: 1, q1: 2, median: 4, q3: 9, max: 19, outliers: [], color: C.violet },
        ],
      });
    },
    "chart-fig2b": function (m) {
      renderBoxplot(m, {
        yLabel: "Career seasons",
        yMax: 24,
        groups: [
          { label: "18–19", min: 1, q1: 5.5, median: 9, q3: 14.5, max: 19, n: 15, color: C.data },
          { label: "20–21", min: 1, q1: 2, median: 5, q3: 10, max: 21, n: 401, color: C.signal },
          { label: "22–23", min: 1, q1: 2, median: 5, q3: 10, max: 22, n: 1245, color: C.violet },
          { label: "24+", min: 1, q1: 1, median: 3, q3: 7, max: 16, outliers: [17, 18], n: 1080, color: C.warm },
        ],
      });
    },
    "chart-fig3a": function (m) {
      renderBarChart(m, {
        rotateLabels: true,
        color: C.data,
        yLabel: "IL placements",
        tooltipFmt: function (b) { return b.value.toLocaleString() + " placements, 1980–2023"; },
        bars: [
          { label: "Knee", value: 2665 },
          { label: "Ankle", value: 1941 },
          { label: "Illness", value: 1380 },
          { label: "Back", value: 1243 },
          { label: "Hand/Wrist", value: 972 },
          { label: "Foot", value: 858 },
          { label: "Leg/Calf", value: 853 },
          { label: "Groin/Hip", value: 819 },
          { label: "Other", value: 785 },
          { label: "Hamstring", value: 540 },
          { label: "Shoulder", value: 456 },
          { label: "Achilles", value: 284 },
          { label: "Concussion", value: 194 },
          { label: "Torso", value: 152 },
          { label: "ACL", value: 106 },
        ],
      });
    },
    "chart-fig3b": function (m) {
      renderGroupedBar(m, {
        yLabel: "Mean career seasons",
        series: ["With injury", "Without"],
        colors: [C.data, C.warm],
        groups: [
          { label: "ACL", "With injury": 8.05, Without: 5.6 },
          { label: "Achilles", "With injury": 8.85, Without: 5.45 },
          { label: "Back", "With injury": 8.05, Without: 5.05 },
          { label: "Knee", "With injury": 7.65, Without: 4.55 },
        ],
      });
    },
    "chart-fig4a": function (m) {
      rng = mulberry32(22);
      var pts = [];
      for (var i = 0; i < 260; i++) {
        var x = 3 + rng() * 39;
        // career seasons roughly increases with mpg, heavy noise
        var base = 1 + (x / 42) * 14;
        var y = Math.max(1, Math.min(22, base + gaussian(rng) * 5.2));
        pts.push({ x: x, y: y, color: y >= 10 ? C.signal : C.warm });
      }
      renderScatter(m, {
        xDomain: [0, 42],
        yDomain: [0, 22],
        xLabel: "Avg MPG (first 3 seasons)",
        yLabel: "Career seasons",
        points: pts,
        r: 2.4,
        tooltip: function (p) { return p.x.toFixed(1) + " MPG → " + p.y.toFixed(0) + " seasons"; },
        legendItems: [
          { label: "Long career (≥10 szn)", color: C.signal },
          { label: "Short career (<10 szn)", color: C.warm },
        ],
      });
    },
    "chart-fig4b": function (m) {
      function bump(center, spread, amp, x) {
        var z = (x - center) / spread;
        return amp * Math.exp(-0.5 * z * z);
      }
      var xs = [];
      for (var x = 2; x <= 42; x += 1) xs.push(x);
      var shortPts = xs.map(function (x) { return [x, bump(11, 6.5, 0.061, x) + bump(20, 8, 0.012, x)]; });
      var longPts = xs.map(function (x) { return [x, bump(29, 8, 0.044, x) + bump(14, 6, 0.02, x)]; });
      renderDensity(m, {
        xDomain: [2, 42],
        xLabel: "Avg MPG under age 25",
        yLabel: "Density",
        series: [
          { label: "Short career (<10 seasons)", color: C.data, points: shortPts },
          { label: "Long career (≥10 seasons)", color: C.warm, points: longPts },
        ],
      });
    },
    "chart-fig6": function (m) {
      rng = mulberry32(33);
      var pts = [];
      for (var i = 0; i < 300; i++) {
        var fitted = rng() * 16.5;
        var spread = 0.7 + Math.min(fitted, 8) * 0.55;
        var resid = gaussian(rng) * spread + Math.max(0, 3.2 - fitted) * -0.15;
        pts.push({ x: fitted, y: resid });
      }
      renderResidual(m, {
        xDomain: [0, 17],
        yDomain: [-8, 13],
        xLabel: "Fitted values",
        yLabel: "Residuals",
        points: pts,
      });
    },
    "chart-fig7a": function (m) {
      renderConfusion(m, { labels: ["Short", "Long"], matrix: [[402, 23], [83, 41]] });
    },
    "chart-fig7b": function (m) {
      renderROC(m, {
        auc: 0.841,
        points: [
          [0, 0], [0.01, 0.05], [0.02, 0.16], [0.03, 0.28], [0.04, 0.35], [0.05, 0.42],
          [0.07, 0.5], [0.09, 0.56], [0.11, 0.6], [0.13, 0.63], [0.15, 0.66], [0.17, 0.69],
          [0.18, 0.71], [0.2, 0.72], [0.22, 0.75], [0.25, 0.79], [0.28, 0.82], [0.3, 0.84],
          [0.35, 0.87], [0.4, 0.89], [0.45, 0.92], [0.5, 0.94], [0.55, 0.95], [0.6, 0.96],
          [0.7, 0.975], [0.8, 0.985], [0.9, 0.995], [1, 1],
        ],
      });
    },
    "chart-fig7c": function (m) {
      renderBarChart(m, {
        rotateLabels: true,
        yLabel: "Standardized coefficient",
        tooltipFmt: function (b) { return (b.value >= 0 ? "+" : "") + b.value.toFixed(2); },
        bars: [
          { label: "games/szn", value: 1.05, color: C.signal },
          { label: "BPM", value: 0.53, color: C.signal },
          { label: "knee inj.", value: 0.33, color: C.signal },
          { label: "MPG", value: 0.32, color: C.signal },
          { label: "total inj.", value: 0.22, color: C.signal },
          { label: "back inj.", value: 0.13, color: C.signal },
          { label: "severe inj.", value: 0.03, color: C.signal },
          { label: "pos G", value: -0.13, color: C.warm },
          { label: "pos F", value: -0.15, color: C.warm },
          { label: "entry age", value: -0.17, color: C.warm },
          { label: "PPG", value: -0.2, color: C.warm },
        ],
      });
    },
    "chart-fig8a": function (m) {
      renderKM(m, {
        note: "log-rank p < 0.0001",
        series: [
          { label: "No severe injury", color: C.data, points: [[0,1],[1,0.82],[2,0.70],[3,0.62],[4,0.55],[5,0.53],[6,0.45],[7,0.40],[8,0.38],[9,0.34],[10,0.33],[11,0.28],[12,0.24],[13,0.20],[14,0.16],[15,0.12],[16,0.10],[17,0.08],[18,0.06],[19,0.03],[20,0.01],[21,0]] },
          { label: "Severe injury (ACL/Achilles)", color: C.warm, points: [[0,1],[1,0.97],[2,0.93],[3,0.90],[4,0.85],[5,0.82],[6,0.79],[7,0.71],[8,0.63],[9,0.56],[10,0.50],[11,0.39],[12,0.32],[13,0.28],[14,0.19],[15,0.15],[16,0.13],[17,0.11],[18,0.09],[19,0.09],[20,0.09],[21,0]] },
        ],
      });
    },
    "chart-fig8b": function (m) {
      renderKM(m, {
        note: "log-rank p < 0.0001",
        series: [
          { label: "No back injury", color: C.data, points: [[0,1],[1,0.81],[2,0.68],[3,0.59],[4,0.51],[5,0.46],[6,0.40],[7,0.35],[8,0.30],[9,0.26],[10,0.22],[11,0.18],[12,0.15],[13,0.12],[14,0.09],[15,0.06],[16,0.04],[17,0.02],[18,0.01],[19,0]] },
          { label: "Back injury", color: C.signal, points: [[0,1],[1,0.95],[2,0.90],[3,0.86],[4,0.80],[5,0.75],[6,0.73],[7,0.68],[8,0.64],[9,0.60],[10,0.55],[11,0.50],[12,0.45],[13,0.40],[14,0.32],[15,0.27],[16,0.20],[17,0.15],[18,0.10],[19,0.05],[20,0.02],[21,0]] },
        ],
      });
    },
    "chart-fig9": function (m) {
      renderKM(m, {
        series: [
          { label: "18–19", color: C.data, points: [[0,1],[1,0.94],[2,0.87],[3,0.80],[5,0.74],[6,0.67],[8,0.60],[9,0.54],[9,0.40],[13,0.34],[15,0.17],[19,0.08],[22,0]] },
          { label: "20–21", color: C.violet, points: [[0,1],[1,0.94],[2,0.91],[3,0.83],[4,0.80],[5,0.78],[6,0.75],[7,0.70],[8,0.65],[9,0.62],[10,0.58],[11,0.53],[12,0.44],[13,0.36],[14,0.29],[15,0.24],[16,0.21],[17,0.19],[18,0.17],[19,0.08],[21,0.08],[22,0]] },
          { label: "22–23", color: C.signal, points: [[0,1],[1,0.85],[2,0.76],[3,0.68],[4,0.60],[5,0.56],[6,0.50],[7,0.44],[8,0.39],[9,0.35],[10,0.28],[11,0.22],[12,0.16],[13,0.11],[14,0.08],[15,0.05],[16,0.02],[17,0.01],[18,0]] },
          { label: "24+", color: C.warm, points: [[0,1],[1,0.75],[2,0.60],[3,0.50],[4,0.44],[5,0.38],[6,0.33],[7,0.29],[8,0.24],[9,0.19],[10,0.14],[11,0.10],[12,0.07],[13,0.04],[14,0.03],[15,0.02],[16,0.01],[17,0]] },
        ],
      });
    },
    "chart-fig11": function (m) {
      renderLine(m, {
        xDomain: [1.5, 8.5],
        yDomain: [2000, 6300],
        xLabel: "Number of clusters (k)",
        yLabel: "Inertia",
        mark: 4,
        points: [[2,6050],[3,4650],[4,3780],[5,3280],[6,2830],[7,2570],[8,2320]],
      });
    },
    "chart-fig13a": function (m) {
      // Density curves calibrated to real cluster means: 3.08, 9.54, 3.01, 6.69
      function skewBump(mean, spread, amp, x) {
        var z = Math.max(0, x - mean * 0.35) / spread;
        return amp * Math.exp(-0.5 * z * z);
      }
      var xs = [];
      for (var x = 1; x <= 22; x += 0.5) xs.push(x);
      var series = [
        { label: "Cluster 0 (3.1 avg)", color: C.data, mean: 3.08, amp: 0.55 },
        { label: "Cluster 1 (9.5 avg)", color: C.warm, mean: 9.54, amp: 0.15 },
        { label: "Cluster 2 (3.0 avg)", color: C.signal, mean: 3.01, amp: 0.56 },
        { label: "Cluster 3 (6.7 avg)", color: C.violet, mean: 6.69, amp: 0.13 },
      ].map(function (s) {
        return {
          label: s.label,
          color: s.color,
          points: xs.map(function (x) { return [x, skewBump(s.mean, s.mean * 0.55, s.amp, x)]; }),
        };
      });
      renderDensity(m, { xDomain: [1, 22], xLabel: "Career seasons", yLabel: "Density", series: series });
    },
    "chart-fig13b": function (m) {
      rng = mulberry32(44);
      var centroids = [
        { mpg: 13.19, szn: 3.08, color: C.data },
        { mpg: 31.16, szn: 9.54, color: C.warm },
        { mpg: 10.44, szn: 3.01, color: C.signal },
        { mpg: 19.48, szn: 6.69, color: C.violet },
      ];
      var pts = [];
      centroids.forEach(function (c) {
        for (var i = 0; i < 85; i++) {
          var mpg = Math.max(2, c.mpg + gaussian(rng) * 6);
          var szn = Math.max(1, c.szn + Math.abs(gaussian(rng)) * c.szn * 0.7);
          pts.push({ x: mpg, y: szn, color: c.color });
        }
      });
      renderScatter(m, {
        xDomain: [0, 42],
        yDomain: [0, 24],
        xLabel: "Early-career MPG",
        yLabel: "Career seasons",
        points: pts,
        r: 2.3,
        opacity: 0.5,
        tooltip: function (p) { return p.x.toFixed(0) + " MPG, " + p.y.toFixed(0) + " seasons"; },
        legendItems: [
          { label: "Cluster 0", color: C.data },
          { label: "Cluster 1", color: C.warm },
          { label: "Cluster 2", color: C.signal },
          { label: "Cluster 3", color: C.violet },
        ],
      });
    },
  };

  function init() {
    Object.keys(CHARTS).forEach(function (id) {
      var mount = document.getElementById(id);
      if (!mount) return;
      try {
        CHARTS[id](mount);
      } catch (err) {
        mount.textContent = "Chart failed to render.";
        if (window.console) console.error("chart error", id, err);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
