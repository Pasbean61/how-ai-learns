/* demos-basic.js: hero animation, data table, split, neuron, manual line fit */
(function () {
  "use strict";
  const { $, C, rng, gauss, canvas, whenVisible, fmt, seg } = window.AI;

  // ---------- shared: probability heatmap (blue = 1, orange = 0) ----------
  const off = document.createElement("canvas");
  function heatmap(ctx, w, h, fn, res = 64) {
    off.width = res; off.height = res;
    const octx = off.getContext("2d"), img = octx.createImageData(res, res), d = img.data;
    for (let j = 0; j < res; j++) {
      const y = 1 - (2 * (j + 0.5)) / res;
      for (let i = 0; i < res; i++) {
        const x = (2 * (i + 0.5)) / res - 1;
        let p = fn(x, y);
        if (!isFinite(p)) p = 0.5;
        const s = Math.min(1, Math.abs(p - 0.5) * 2), k = (j * res + i) * 4;
        // white -> blue tint (p→1) or orange tint (p→0)
        const t = p > 0.5 ? [150, 168, 240] : [246, 178, 146];
        d[k] = 255 + (t[0] - 255) * s * 0.85;
        d[k + 1] = 255 + (t[1] - 255) * s * 0.85;
        d[k + 2] = 255 + (t[2] - 255) * s * 0.85;
        d[k + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, w, h);
  }
  function dot(ctx, x, y, r, fill, stroke = "#fff", lw = 1.5) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  window.AI.heatmap = heatmap;
  window.AI.dot = dot;

  // ---------- shared line dataset ----------
  function makeLineData(seed, n = 14) {
    const r = rng(seed), pts = [];
    for (let i = 0; i < n; i++) {
      const x = 0.05 + 0.9 * (i + r() * 0.8) / n;
      pts.push([x, 0.25 + 1.0 * x + gauss(r) * 0.075]);
    }
    return pts;
  }
  function mse(pts, w, b) { let s = 0; for (const [x, y] of pts) { const e = w * x + b - y; s += e * e; } return s / pts.length; }
  function grad(pts, w, b) { let gw = 0, gb = 0; for (const [x, y] of pts) { const e = w * x + b - y; gw += 2 * e * x; gb += 2 * e; } return [gw / pts.length, gb / pts.length]; }
  function ols(pts) {
    const n = pts.length; let sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (const [x, y] of pts) { sx += x; sy += y; sxx += x * x; sxy += x * y; }
    const w = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    return [w, (sy - w * sx) / n];
  }
  window.AI.line = { makeLineData, mse, grad, ols };

  // draws points + line in a plot area; X in [0,1], Y in [ymin,ymax]
  function plotLine(ctx, w, h, pts, lw, lb, opts = {}) {
    const pad = opts.pad || 18, ymin = -0.2, ymax = 1.6;
    const X = (x) => pad + x * (w - 2 * pad), Y = (y) => h - pad - ((y - ymin) / (ymax - ymin)) * (h - 2 * pad);
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
    window.AI.axes(ctx, w, h, pad);
    // residuals / squares
    for (const [x, y] of pts) {
      const yh = lw * x + lb, px = X(x), py = Y(y), ph = Y(yh);
      if (opts.squares) {
        const s = Math.abs(ph - py);
        ctx.fillStyle = "rgba(239,106,50,.13)"; ctx.strokeStyle = "rgba(239,106,50,.55)"; ctx.lineWidth = 1;
        const dir = px + s > w - pad ? -1 : 1;
        ctx.fillRect(dir > 0 ? px : px - s, Math.min(py, ph), s, s);
        ctx.strokeRect(dir > 0 ? px : px - s, Math.min(py, ph), s, s);
      } else {
        ctx.strokeStyle = "rgba(239,106,50,.75)"; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, ph); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    // line
    ctx.save(); ctx.beginPath(); ctx.rect(pad, pad, w - 2 * pad, h - 2 * pad); ctx.clip();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2.5; ctx.beginPath();
    ctx.moveTo(X(0), Y(lb)); ctx.lineTo(X(1), Y(lw + lb)); ctx.stroke(); ctx.restore();
    for (const [x, y] of pts) dot(ctx, X(x), Y(y), opts.r || 5, C.blue);
  }
  window.AI.plotLine = plotLine;

  // ================= HERO =================
  (function hero() {
    const el = $("#heroCanvas"); if (!el) return;
    const stepEl = $("#heroStep"), lossEl = $("#heroLoss");
    let seed = 7, pts = makeLineData(seed, 22), w, b, it, still, pause = 0, running = false, raf = 0, frame = 0;
    function restart() {
      const r = rng(seed++ * 31);
      pts = makeLineData(seed, 22);
      w = -0.8 + r() * 0.6; b = 1.2 + r() * 0.3; it = 0; still = 0;
    }
    restart();
    const cv = canvas(el, (ctx, cw, ch) => plotLine(ctx, cw, ch, pts, w, b, { pad: 22, r: 5.5 }));
    function tick() {
      frame++;
      if (pause > 0) { pause--; if (pause === 0) restart(); }
      else if (frame % 2 === 0) {
        const [gw, gb] = grad(pts, w, b);
        w -= 0.45 * gw; b -= 0.45 * gb; it++;
        if (Math.abs(gw) + Math.abs(gb) < 0.004) still++;
        if (still > 25 || it > 400) pause = 110;
      }
      stepEl.textContent = it;
      lossEl.textContent = mse(pts, w, b).toFixed(4);
      cv.redraw();
      if (running) raf = requestAnimationFrame(tick);
    }
    if (window.AI.reduced) { const [ow, ob] = ols(pts); w = ow; b = ob; cv.redraw(); lossEl.textContent = mse(pts, w, b).toFixed(4); return; }
    whenVisible(el, (v) => { running = v; cancelAnimationFrame(raf); if (v) raf = requestAnimationFrame(tick); });
  })();

  // ================= DATA TABLE =================
  (function dataTable() {
    const raw = [
      ["Flat A", 62, 2, 3.1, "no", 245],
      ["Flat B", 85, 3, 5.4, "yes", 290],
      ["Flat C", 48, 1, 1.2, "no", 210],
      ["House D", 120, 4, 8.0, "yes", 365],
      ["Flat E", 780, 3, 2.5, "no", 330],
      ["House F", 95, null, 6.3, "Yes ", 305],
    ];
    const head = ["Home", "Size m²", "Bedrooms", "Km to centre", "Garden", "Price £k"];
    const tbl = $("#houseTable"), note = $("#dataNote");
    const NOTES = {
      raw: "Real data is messy. Spot the problems: a typo (780 m² should be 78), a missing value (—), and inconsistent text (“Yes ” vs “yes”). <i>Illustrative numbers.</i>",
      roles: "<b style='color:#2f4bdc'>Features</b> (blue) are what the model gets to see. The <b style='color:#ef6a32'>label</b> (orange) is the answer it must learn to predict. The name column is not used, because it carries no useful pattern.",
      scaled: "After cleaning: the typo is fixed, the missing bedrooms are filled with the median (3), and yes/no becomes 1/0. Every feature is then <b>scaled to 0–1</b> so no single feature dominates just because its numbers are bigger. In real projects, the scaling is computed from the <em>training</em> set only.",
    };
    function render(v) {
      let rows = raw.map((r) => r.slice());
      let cells = rows.map((r) => r.map((c) => (c === null ? "—" : c)));
      const marks = rows.map(() => head.map(() => ""));
      if (v === "raw") { marks[4][1] = "bad"; marks[5][2] = "bad"; marks[5][4] = "bad"; }
      if (v === "scaled") {
        rows[4][1] = 78; rows[5][2] = 3;
        rows.forEach((r) => (r[4] = r[4].trim().toLowerCase() === "yes" ? 1 : 0));
        const cols = [1, 2, 3];
        cols.forEach((c) => {
          const vals = rows.map((r) => r[c]), mn = Math.min(...vals), mx = Math.max(...vals);
          rows.forEach((r) => (r[c] = ((r[c] - mn) / (mx - mn)).toFixed(2)));
        });
        cells = rows.map((r) => r.slice());
        marks[4][1] = "fixed"; marks[5][2] = "fixed"; marks[5][4] = "fixed";
      }
      const role = (i) => (v === "raw" ? "" : i >= 1 && i <= 4 ? "feat" : i === 5 ? "lab" : "");
      const rl = (i) => (v === "raw" ? "" : i >= 1 && i <= 4 ? "<span class='role'>feature</span>" : i === 5 ? "<span class='role'>label</span>" : "<span class='role'>&nbsp;</span>");
      tbl.innerHTML = `<thead><tr>${head.map((h, i) => `<th class="${role(i)}">${h}${rl(i)}</th>`).join("")}</tr></thead><tbody>` +
        cells.map((r, ri) => `<tr>${r.map((c, i) => `<td class="${role(i)} ${marks[ri][i]}">${String(c).trim() || c}</td>`).join("")}</tr>`).join("") + "</tbody>";
      note.innerHTML = NOTES[v];
    }
    seg($("#dataView"), (b) => render(b.dataset.v));
    render("raw");
  })();

  // ================= SPLIT =================
  (function split() {
    const grid = $("#splitGrid"), tr = $("#trRange"), va = $("#vaRange");
    const r = rng(42), order = Array.from({ length: 100 }, (_, i) => i);
    for (let i = 99; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    grid.innerHTML = "<i></i>".repeat(100);
    const dots = Array.from(grid.children);
    function upd(src) {
      let t = +tr.value, v = +va.value;
      if (t + v > 95) { if (src === tr) { v = 95 - t; va.value = v; } else { t = 95 - v; tr.value = t; } }
      const te = 100 - t - v;
      $("#trOut").textContent = t + "%"; $("#vaOut").textContent = v + "%"; $("#teOut").textContent = te + "%";
      order.forEach((d, rank) => (dots[d].className = rank < t ? "tr" : rank < t + v ? "va" : "te"));
    }
    tr.addEventListener("input", () => upd(tr)); va.addEventListener("input", () => upd(va));
    upd(tr);
  })();

  // ================= NEURON =================
  (function neuron() {
    const el = $("#neuronCanvas"); if (!el) return;
    const r = rng(11), pts = [];
    while (pts.length < 40) {
      const x = r() * 1.8 - 0.9, y = r() * 1.8 - 0.9, s = 1.3 * x - y + 0.15;
      if (Math.abs(s) < 0.18) continue;
      pts.push([x, y, s > 0 ? 1 : 0]);
    }
    const w1 = $("#w1"), w2 = $("#w2"), bb = $("#bb");
    let hover = null;
    const sig = (z) => 1 / (1 + Math.exp(-z));
    const cv = canvas(el, draw);
    function draw(ctx, w, h) {
      const a = +w1.value, c = +w2.value, b = +bb.value;
      heatmap(ctx, w, h, (x, y) => sig(a * x + c * y + b), 72);
      // boundary a x + c y + b = 0
      const X = (x) => ((x + 1) / 2) * w, Y = (y) => ((1 - y) / 2) * h;
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.beginPath();
      if (Math.abs(c) > 1e-6) { ctx.moveTo(X(-1), Y((-b + a) / c)); ctx.lineTo(X(1), Y((-b - a) / c)); }
      else if (Math.abs(a) > 1e-6) { ctx.moveTo(X(-b / a), 0); ctx.lineTo(X(-b / a), h); }
      ctx.stroke(); ctx.setLineDash([]);
      let ok = 0;
      for (const [x, y, l] of pts) {
        const p = sig(a * x + c * y + b), right = (p > 0.5 ? 1 : 0) === l; if (right) ok++;
        dot(ctx, X(x), Y(y), 6, l ? C.blue : C.orange, right ? "#fff" : C.ink, right ? 1.5 : 2.5);
      }
      $("#neuronAcc").textContent = Math.round((ok / pts.length) * 100) + "%";
      $("#w1o").textContent = a.toFixed(1); $("#w2o").textContent = c.toFixed(1); $("#bo").textContent = b.toFixed(1);
      let f = `z = <span class="w">${a.toFixed(1)}</span>·x₁ + <span class="w">${c.toFixed(1)}</span>·x₂ + <span class="w">${b.toFixed(1)}</span><br>output = σ(z) = 1 / (1 + e<sup>−z</sup>)`;
      if (hover) {
        const z = a * hover[0] + c * hover[1] + b;
        f += `<br><span class="muted">at cursor: z = ${z.toFixed(2)}, P(blue) = ${sig(z).toFixed(2)}</span>`;
      } else f += `<br><span class="muted">hover the plot to see the output</span>`;
      $("#neuronFormula").innerHTML = f;
      if (hover) { dot(ctx, X(hover[0]), Y(hover[1]), 4, C.ink, null); }
    }
    [w1, w2, bb].forEach((s) => s.addEventListener("input", cv.redraw));
    el.addEventListener("pointermove", (e) => {
      const rc = el.getBoundingClientRect();
      hover = [((e.clientX - rc.left) / rc.width) * 2 - 1, 1 - ((e.clientY - rc.top) / rc.height) * 2];
      cv.redraw();
    });
    el.addEventListener("pointerleave", () => { hover = null; cv.redraw(); });
    cv.redraw();
  })();

  // ================= MANUAL FIT =================
  (function manual() {
    const el = $("#manualCanvas"); if (!el) return;
    const pts = makeLineData(3), [bw, bbst] = ols(pts), best = mse(pts, bw, bbst);
    const mw = $("#mw"), mb = $("#mb"), sq = $("#mSquares");
    const cv = canvas(el, (ctx, w, h) => {
      const a = +mw.value, b = +mb.value, L = mse(pts, a, b);
      plotLine(ctx, w, h, pts, a, b, { squares: sq.checked, pad: 20 });
      $("#mwo").textContent = a.toFixed(2); $("#mbo").textContent = b.toFixed(2);
      $("#mLoss").textContent = L.toFixed(4);
      const ratio = L / best, em = $("#mBest");
      em.className = ratio < 1.08 ? "ok" : "";
      em.textContent = ratio < 1.08 ? "✓ essentially optimal" : `best possible: ${best.toFixed(4)} · you: ${ratio.toFixed(1)}× worse`;
    });
    [mw, mb].forEach((s) => s.addEventListener("input", cv.redraw));
    sq.addEventListener("change", cv.redraw);
    cv.redraw();
  })();
})();
