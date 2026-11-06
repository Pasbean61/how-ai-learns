/* demos-eval.js: overfitting (Demo 9) and confusion matrix (Demo 10) */
(function () {
  "use strict";
  const { $, C, rng, gauss, canvas } = window.AI;

  // ======================= DEMO 9: OVERFITTING =======================
  (function overfit() {
    const fEl = $("#ofFit"), eEl = $("#ofErr"); if (!fEl) return;
    const truth = (x) => 0.8 * Math.sin(2.6 * x) + 0.15 * x;
    const MAXD = 11;
    let seed = 21, train = [], test = [], fits = [], errs = [];

    // Chebyshev basis keeps the least-squares problem well-conditioned on [-1, 1]
    function basis(x, d) { const T = [1, x]; for (let k = 2; k <= d; k++) T.push(2 * x * T[k - 1] - T[k - 2]); return T.slice(0, d + 1); }
    function solve(A, b) {               // Gaussian elimination with partial pivoting
      const n = b.length;
      for (let c = 0; c < n; c++) {
        let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
        [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
        for (let r = c + 1; r < n; r++) { const f = A[r][c] / A[c][c]; for (let k = c; k < n; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; }
      }
      const x = new Array(n).fill(0);
      for (let r = n - 1; r >= 0; r--) { let s = b[r]; for (let k = r + 1; k < n; k++) s -= A[r][k] * x[k]; x[r] = s / A[r][r]; }
      return x;
    }
    function fit(d) {
      const n = d + 1, A = Array.from({ length: n }, () => new Array(n).fill(0)), b = new Array(n).fill(0);
      for (const [x, y] of train) { const T = basis(x, d); for (let i = 0; i < n; i++) { b[i] += T[i] * y; for (let j = 0; j < n; j++) A[i][j] += T[i] * T[j]; } }
      for (let i = 0; i < n; i++) A[i][i] += 1e-10;
      const c = solve(A, b);
      return (x) => basis(x, d).reduce((s, t, i) => s + t * c[i], 0);
    }
    const mse = (f, set) => set.reduce((s, [x, y]) => s + (f(x) - y) ** 2, 0) / set.length;
    function gen() {
      const r = rng(seed);
      train = Array.from({ length: 12 }, (_, i) => { const x = -0.95 + (1.9 * (i + 0.15 + r() * 0.7)) / 12; return [x, truth(x) + gauss(r) * 0.2]; });
      test = Array.from({ length: 40 }, () => { const x = r() * 1.9 - 0.95; return [x, truth(x) + gauss(r) * 0.2]; });
      fits = []; errs = [];
      for (let d = 0; d <= MAXD; d++) { const f = fit(d); fits.push(f); errs.push([Math.max(mse(f, train), 1e-5), mse(f, test)]); }
    }
    gen();
    const deg = $("#ofDeg"), showT = $("#ofShowTest");
    const YMIN = -1.7, YMAX = 1.7;
    const fitCv = canvas(fEl, (ctx, w, h) => {
      const d = +deg.value, pad = 16, X = (x) => pad + ((x + 1) / 2) * (w - 2 * pad), Y = (y) => h - pad - ((y - YMIN) / (YMAX - YMIN)) * (h - 2 * pad);
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); window.AI.axes(ctx, w, h, pad);
      ctx.save(); ctx.beginPath(); ctx.rect(pad, pad, w - 2 * pad, h - 2 * pad); ctx.clip();
      ctx.strokeStyle = C.line2; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]); ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const x = -1 + i / 100; i ? ctx.lineTo(X(x), Y(truth(x))) : ctx.moveTo(X(x), Y(truth(x))); } ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let i = 0; i <= 300; i++) { const x = -0.97 + (1.94 * i) / 300, y = Math.max(YMIN - 1, Math.min(YMAX + 1, fits[d](x))); i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); } ctx.stroke();
      ctx.restore();
      if (showT.checked) for (const [x, y] of test) window.AI.dot(ctx, X(x), Y(y), 3.6, "#fff", C.orange, 1.6);
      for (const [x, y] of train) window.AI.dot(ctx, X(x), Y(y), 5, C.blue);
      ctx.fillStyle = C.ink3; ctx.font = "11px JetBrains Mono, monospace"; ctx.fillText("- - true pattern", w - 130, pad + 14);
    });
    const errCv = canvas(eEl, (ctx, w, h) => {
      const d = +deg.value, padL = 34, pad = 16;
      const lo = Math.log10(1e-5), hi = Math.log10(Math.max(...errs.map((e) => e[1]), 1) * 1.5);
      const X = (i) => padL + (i / MAXD) * (w - padL - pad), Y = (v) => pad + ((hi - Math.log10(v)) / (hi - lo)) * (h - 2 * pad - 14);
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
      ctx.font = "10.5px JetBrains Mono, monospace"; ctx.fillStyle = C.ink3; ctx.strokeStyle = C.line;
      for (let e = Math.ceil(lo); e <= Math.floor(hi); e++) { ctx.beginPath(); ctx.moveTo(padL, Y(10 ** e)); ctx.lineTo(w - pad, Y(10 ** e)); ctx.stroke(); ctx.fillText(e === 0 ? "1" : "1e" + e, 2, Y(10 ** e) + 3); }
      for (let i = 0; i <= MAXD; i++) ctx.fillText(i, X(i) - 3, h - 6);
      ctx.fillStyle = "rgba(47,75,220,.06)"; ctx.fillRect(X(d) - 10, pad - 6, 20, h - pad - 14);
      [[1, C.orange], [0, C.ink]].forEach(([k, col]) => {
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
        errs.forEach((e, i) => (i ? ctx.lineTo(X(i), Y(e[k])) : ctx.moveTo(X(i), Y(e[k])))); ctx.stroke();
        errs.forEach((e, i) => window.AI.dot(ctx, X(i), Y(e[k]), i === d ? 5.5 : 2.5, col, i === d ? "#fff" : null, 2));
      });
      ctx.fillStyle = C.ink3; ctx.fillText("← simpler        degree        more flexible →", padL + 4, pad + 2);
    });
    function verdict() {
      const d = +deg.value, best = errs.reduce((bi, e, i) => (e[1] < errs[bi][1] ? i : bi), 0), v = $("#ofVerdict");
      const [tr, te] = errs[d], ok = te <= errs[best][1] * 1.35;
      $("#ofDegO").textContent = d;
      let cls, txt;
      if (ok) { cls = "good"; txt = `Good fit · test error ${te.toFixed(3)}`; }
      else if (d < best) { cls = "under"; txt = `Underfitting · train ${tr.toFixed(3)} · test ${te.toFixed(3)}`; }
      else { cls = "over"; txt = `Overfitting · train ${tr < 1e-4 ? "≈0" : tr.toFixed(3)} · test ${te > 100 ? te.toExponential(0) : te.toFixed(2)}`; }
      v.className = "verdict " + cls; v.textContent = txt;
    }
    function draw() { fitCv.redraw(); errCv.redraw(); verdict(); }
    deg.addEventListener("input", draw);
    showT.addEventListener("change", draw);
    $("#ofNew").addEventListener("click", () => { seed += 13; gen(); draw(); });
    draw();
  })();

  // ======================= DEMO 10: CONFUSION MATRIX =======================
  (function cm() {
    const el = $("#cmStrip"); if (!el) return;
    const r = rng(77), items = [];
    for (let i = 0; i < 60; i++) {
      const spam = i < 30 ? 1 : 0, z = (spam ? 1.15 : -1.15) + gauss(r) * 1.05;
      items.push([1 / (1 + Math.exp(-z)), spam]);
    }
    const tIn = $("#cmT");
    let drag = false;
    const cv = canvas(el, (ctx, w, h) => {
      const t = +tIn.value / 100, pad = 14, X = (s) => pad + s * (w - 2 * pad);
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(239,106,50,.07)"; ctx.fillRect(X(t), 0, w - X(t), h);
      ctx.font = "11px JetBrains Mono, monospace"; ctx.fillStyle = C.ink3;
      ctx.fillText("real email", pad, 16); ctx.fillText("spam", pad, h / 2 + 12);
      ctx.fillText("score 0", pad, h - 6); ctx.fillText("1", w - pad - 6, h - 6);
      ctx.fillStyle = C.orange; ctx.fillText("flagged as spam →", Math.min(X(t) + 6, w - 130), 16);
      const rr = rng(5);
      for (const [s, spam] of items) {
        const y = (spam ? h * 0.68 : h * 0.33) + (rr() - 0.5) * h * 0.18, flagged = s >= t;
        window.AI.dot(ctx, X(s), y, 5, spam ? C.orange : C.blue, flagged ? C.ink : "#fff", flagged ? 2 : 1.3);
      }
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(t), 4); ctx.lineTo(X(t), h - 4); ctx.stroke();
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(X(t), h / 2, 6, 0, Math.PI * 2); ctx.fill();
    });
    function update() {
      const t = +tIn.value / 100;
      let TP = 0, FP = 0, FN = 0, TN = 0;
      for (const [s, spam] of items) { const f = s >= t; if (f && spam) TP++; else if (f) FP++; else if (spam) FN++; else TN++; }
      $("#cmTo").textContent = t.toFixed(2);
      $("#cmTable").innerHTML = `<tr><th></th><th>Flagged spam</th><th>Let through</th></tr>
        <tr><th>Actually spam</th><td class="good">${TP}<small>caught ✓</small></td><td class="bad">${FN}<small>missed</small></td></tr>
        <tr><th>Real email</th><td class="bad">${FP}<small>wrongly binned</small></td><td class="good">${TN}<small>delivered ✓</small></td></tr>`;
      const pct = (v) => (isFinite(v) ? Math.round(v * 100) + "%" : "—");
      $("#cmMetrics").innerHTML = `<div><b>${pct((TP + TN) / 60)}</b>accuracy</div><div><b>${pct(TP / (TP + FP))}</b>precision</div><div><b>${pct(TP / (TP + FN))}</b>recall</div>`;
      cv.redraw();
    }
    tIn.addEventListener("input", update);
    const setFrom = (e) => { const rc = el.getBoundingClientRect(); tIn.value = Math.round(Math.max(0, Math.min(1, (e.clientX - rc.left - 14) / (rc.width - 28))) * 100); update(); };
    el.addEventListener("pointerdown", (e) => { drag = true; el.setPointerCapture(e.pointerId); setFrom(e); });
    el.addEventListener("pointermove", (e) => { if (drag) setFrom(e); });
    el.addEventListener("pointerup", () => (drag = false));
    el.style.cursor = "ew-resize";
    update();
  })();
})();
