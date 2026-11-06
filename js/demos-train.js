/* demos-train.js: gradient descent (Demo 6), backprop graph (Demo 7), neural-net lab (Demo 8) */
(function () {
  "use strict";
  const { $, $$, C, rng, gauss, canvas, whenVisible, fmt, seg } = window.AI;
  const { makeLineData, mse, grad, ols } = window.AI.line;

  // ======================= DEMO 6: GRADIENT DESCENT =======================
  (function gd() {
    const dEl = $("#gdData"), lEl = $("#gdLand"), cEl = $("#gdCurve"); if (!dEl) return;
    const pts = makeLineData(5), [ow, ob] = ols(pts), Lmin = mse(pts, ow, ob);
    // critical learning rate = 2 / largest eigenvalue of the Hessian
    let sxx = 0, sx = 0; for (const [x] of pts) { sxx += x * x; sx += x; }
    const n = pts.length, a = 2 * sxx / n, bq = 2 * sx / n, d = 2;
    const lamMax = (a + d) / 2 + Math.sqrt(((a - d) / 2) ** 2 + bq * bq), lrCrit = 2 / lamMax;
    const W0 = -1.5, W1 = 3.5, B0 = -1.2, B1 = 1.8;
    const LMIN = 0.005, LMAX = 1.25;
    const lrFromV = (v) => LMIN * Math.pow(LMAX / LMIN, v / 100);
    const vFromLr = (lr) => Math.round((100 * Math.log(lr / LMIN)) / Math.log(LMAX / LMIN));
    const lrIn = $("#gdLr");
    lrIn.value = vFromLr(0.5);
    // presets relative to the critical rate
    const P = $$(".presets button");
    P[0].dataset.lr = (0.02).toString(); P[1].dataset.lr = (0.55 * lrCrit).toFixed(2); P[2].dataset.lr = (1.07 * lrCrit).toFixed(2);

    let w, b, it, path, hist, playing = false, raf = 0, status = "";
    function reset(sw = -1.0, sb = 1.5) { w = sw; b = sb; it = 0; path = [[w, b]]; hist = [mse(pts, w, b)]; status = ""; msg(""); }
    reset();

    // landscape image (fixed domain) cached
    const land = document.createElement("canvas"); land.width = 160; land.height = 120;
    (function buildLand() {
      const c = land.getContext("2d"), img = c.createImageData(160, 120), D = img.data;
      const lo = Math.log(Lmin), hi = Math.log(mse(pts, W0, B1));
      for (let j = 0; j < 120; j++) for (let i = 0; i < 160; i++) {
        const ww = W0 + (i + 0.5) / 160 * (W1 - W0), bb = B1 - (j + 0.5) / 120 * (B1 - B0);
        const t = Math.min(1, Math.max(0, (Math.log(mse(pts, ww, bb)) - lo) / (hi - lo)));
        const band = Math.floor(t * 14) % 2 === 0 ? 0 : 7;   // contour bands
        const g = 40 + t * 200 + band, k = (j * 160 + i) * 4;
        D[k] = g - 6 * (1 - t); D[k + 1] = g - 4 * (1 - t); D[k + 2] = g + 14 * (1 - t); D[k + 3] = 255;
      }
      c.putImageData(img, 0, 0);
    })();

    const dataCv = canvas(dEl, (ctx, cw, ch) => window.AI.plotLine(ctx, cw, ch, pts, w, b, { pad: 18 }));
    const landCv = canvas(lEl, (ctx, cw, ch) => {
      ctx.imageSmoothingEnabled = true; ctx.drawImage(land, 0, 0, cw, ch);
      const X = (v) => ((v - W0) / (W1 - W0)) * cw, Y = (v) => ((B1 - v) / (B1 - B0)) * ch;
      // axes labels
      ctx.fillStyle = C.ink2; ctx.font = "11px JetBrains Mono, monospace";
      ctx.fillText("w (slope) →", cw - 92, ch - 8); ctx.save(); ctx.translate(12, 84); ctx.rotate(-Math.PI / 2); ctx.fillText("b (intercept) →", 0, 0); ctx.restore();
      // optimum
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; const ox = X(ow), oy = Y(ob);
      ctx.beginPath(); ctx.moveTo(ox - 6, oy); ctx.lineTo(ox + 6, oy); ctx.moveTo(ox, oy - 6); ctx.lineTo(ox, oy + 6); ctx.stroke();
      ctx.fillText("minimum", ox + 8, oy - 6);
      // path
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, cw, ch); ctx.clip();
      ctx.strokeStyle = C.orange; ctx.lineWidth = 2; ctx.beginPath();
      path.forEach(([pw, pb], i) => (i ? ctx.lineTo(X(pw), Y(pb)) : ctx.moveTo(X(pw), Y(pb)))); ctx.stroke();
      const step = Math.max(1, Math.floor(path.length / 60));
      path.forEach(([pw, pb], i) => { if (i % step === 0) window.AI.dot(ctx, X(pw), Y(pb), 2.4, C.orange, null); });
      window.AI.dot(ctx, X(w), Y(b), 7, C.orange, "#fff", 2);
      ctx.restore();
    });
    const curveCv = canvas(cEl, (ctx, cw, ch) => {
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cw, ch);
      const pad = 10, N = Math.max(60, hist.length), top = Math.log10(Math.max(hist[0], 1)), bot = Math.log10(Lmin * 0.8);
      const X = (i) => pad + (i / (N - 1)) * (cw - 2 * pad), Y = (v) => pad + ((top - Math.log10(Math.max(v, 1e-9))) / (top - bot)) * (ch - 2 * pad);
      ctx.strokeStyle = C.line; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(pad, Y(Lmin)); ctx.lineTo(cw - pad, Y(Lmin)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.ink3; ctx.font = "10.5px JetBrains Mono, monospace"; ctx.fillText("lowest possible loss", cw - 140, Y(Lmin) - 4);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, cw, ch); ctx.clip();
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath();
      hist.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)))); ctx.stroke(); ctx.restore();
    });

    function msg(t, ok) { const m = $("#gdMsg"); m.textContent = t; m.className = "msg" + (ok ? " ok" : ""); }
    function readout() {
      const lr = lrFromV(+lrIn.value);
      $("#gdLrOut").textContent = lr.toFixed(lr < 0.1 ? 3 : 2);
      $("#gdIt").textContent = it; $("#gdW").textContent = fmt(w, 3); $("#gdB").textContent = fmt(b, 3); $("#gdL").textContent = fmt(mse(pts, w, b), 4);
    }
    function drawAll() { dataCv.redraw(); landCv.redraw(); curveCv.redraw(); readout(); }
    function step() {
      if (status) return false;
      const lr = lrFromV(+lrIn.value), [gw, gb] = grad(pts, w, b);
      w -= lr * gw; b -= lr * gb; it++;
      const L = mse(pts, w, b);
      path.push([w, b]); hist.push(L);
      if (!isFinite(L) || L > 40) { status = "div"; msg("Diverged! Each step overshoots the valley. Lower the learning rate, then Reset."); return false; }
      if (Math.hypot(gw, gb) < 2e-4) { status = "ok"; msg(`Converged in ${it} steps ✓`, true); return false; }
      if (it >= 3000) { status = "slow"; msg("3,000 steps and still not there. This learning rate is too small."); return false; }
      return true;
    }
    function loop() {
      if (!playing) return;
      const k = it < 40 ? 1 : it < 300 ? 2 : 6;     // speed up later so slow runs don't take forever
      let go = true;
      for (let i = 0; i < k && go; i++) go = step();
      drawAll();
      if (!go) setPlay(false); else raf = requestAnimationFrame(loop);
    }
    function setPlay(p) {
      playing = p; $("#gdPlay").textContent = p ? "❚❚ Pause" : "▶ Play";
      cancelAnimationFrame(raf); if (p) raf = requestAnimationFrame(loop);
    }
    $("#gdPlay").addEventListener("click", () => { if (status) reset(path[0][0], path[0][1]); setPlay(!playing); });
    $("#gdStep").addEventListener("click", () => { setPlay(false); step(); drawAll(); });
    $("#gdReset").addEventListener("click", () => { setPlay(false); reset(); drawAll(); });
    lrIn.addEventListener("input", () => { if (status === "div" || status === "slow") { reset(path[0][0], path[0][1]); } readout(); drawAll(); });
    P.forEach((p) => p.addEventListener("click", () => { lrIn.value = vFromLr(+p.dataset.lr); reset(); drawAll(); setPlay(true); }));
    lEl.addEventListener("click", (e) => {
      const r = lEl.getBoundingClientRect();
      const nw = W0 + ((e.clientX - r.left) / r.width) * (W1 - W0), nb = B1 - ((e.clientY - r.top) / r.height) * (B1 - B0);
      reset(nw, nb); drawAll(); setPlay(true);
    });
    whenVisible(dEl.closest(".demo"), (v) => { if (!v && playing) setPlay(false); });
    drawAll();
  })();

  // ======================= DEMO 7: BACKPROP GRAPH =======================
  (function bp() {
    const svg = $("#bpGraph"); if (!svg) return;
    const wrap = svg.closest(".bp");
    const X_IN = 2, Y_T = 5, LR = 0.05;
    let w = 0.5, b = 0, round = 1, phase = 0, V = {}, G = {};
    const N = {
      x: [70, 52, "x", "input"], w: [70, 172, "w", "param"], mul: [228, 112, "z = w·x", ""],
      b: [340, 208, "b", "param"], add: [400, 112, "ŷ = z + b", ""], y: [505, 208, "y (true)", ""],
      sub: [560, 112, "e = ŷ − y", ""], sq: [698, 112, "L = e²", "loss"],
    };
    const E = [["x", "mul"], ["w", "mul"], ["mul", "add"], ["b", "add"], ["add", "sub"], ["y", "sub"], ["sub", "sq"]];
    const NS = "http://www.w3.org/2000/svg";
    const mk = (t, a, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
    const edgeEls = {}, valEls = {}, gradEls = {};
    E.forEach(([s, t]) => {
      const [x1, y1] = N[s], [x2, y2] = N[t];
      const sx = x1 + 52, ex = x2 - 52, mx = (sx + ex) / 2;
      edgeEls[s + t] = mk("path", { d: `M${sx},${y1} C${mx},${y1} ${mx},${y2} ${ex},${y2}`, class: "edge" }, svg);
    });
    Object.entries(N).forEach(([k, [x, y, label, kind]]) => {
      const g = mk("g", { class: "node " + kind, transform: `translate(${x},${y})` }, svg);
      mk("rect", { x: -52, y: -30, width: 104, height: 60, rx: 10 }, g);
      mk("text", { y: -8 }, g).textContent = label;
      valEls[k] = mk("text", { y: 11, class: "val" }, g);
      gradEls[k] = mk("text", { y: 48, class: "grad" }, g);
    });
    const r2 = (v) => (Math.round(v * 100) / 100).toString();
    function render() {
      const show = (k, v) => (valEls[k].textContent = v === undefined ? "= ?" : "= " + r2(v));
      show("x", X_IN); show("w", w); show("b", b); show("y", Y_T);
      ["mul", "add", "sub", "sq"].forEach((k) => show(k, phase >= 1 ? V[k] : undefined));
      const gl = { sq: "∂L/∂L = 1", sub: `∂L/∂e = 2e = ${r2(G.e)}`, add: `∂L/∂ŷ = ${r2(G.yh)}`, mul: `∂L/∂z = ${r2(G.z)}`, b: `∂L/∂b = ${r2(G.b)}`, w: `∂L/∂w = x·${r2(G.z)} = ${r2(G.w)}` };
      Object.keys(gradEls).forEach((k) => (gradEls[k].textContent = phase >= 2 && gl[k] ? gl[k] : ""));
      wrap.classList.toggle("back", phase >= 2);
      $("#bpFwd").disabled = phase !== 0; $("#bpBwd").disabled = phase !== 1; $("#bpUpd").disabled = phase !== 2;
      $("#bpRound").textContent = round; $("#bpLoss").textContent = phase >= 1 ? r2(V.sq) : "—";
    }
    function light(cls, order, done) {
      Object.values(edgeEls).forEach((e) => e.classList.remove("lit", "blit"));
      order.forEach((k, i) => setTimeout(() => { edgeEls[k].classList.add(cls); if (i === order.length - 1 && done) done(); }, i * 160));
    }
    $("#bpFwd").addEventListener("click", () => {
      V.mul = w * X_IN; V.add = V.mul + b; V.sub = V.add - Y_T; V.sq = V.sub * V.sub; phase = 1;
      light("lit", ["xmul", "wmul", "muladd", "badd", "addsub", "ysub", "subsq"]);
      render();
      $("#bpNote").innerHTML = `<b>Forward pass:</b> z = ${r2(w)}×2 = ${r2(V.mul)}, then ŷ = ${r2(V.mul)} + ${r2(b)} = ${r2(V.add)}, so the error e = ${r2(V.add)} − 5 = ${r2(V.sub)} and the loss L = ${r2(V.sq)}. Now press <b>Backward</b> to find out who is to blame.`;
    });
    $("#bpBwd").addEventListener("click", () => {
      G.e = 2 * V.sub; G.yh = G.e; G.b = G.yh; G.z = G.yh; G.w = G.z * X_IN; phase = 2;
      light("blit", ["subsq", "addsub", "badd", "muladd", "wmul"]);
      render();
      $("#bpNote").innerHTML = `<b>Backward pass (chain rule):</b> start at the loss and multiply local slopes going backwards. ∂L/∂e = 2e = ${r2(G.e)}. The “+” passes it straight through, so ∂L/∂b = ${r2(G.b)}. The “×” multiplies by the other input, so ∂L/∂w = ${r2(G.z)} × x(=2) = <b>${r2(G.w)}</b>. A negative gradient means increasing that weight lowers the loss.`;
    });
    $("#bpUpd").addEventListener("click", () => {
      const ow = w, ob = b;
      w = w - LR * G.w; b = b - LR * G.b; round++; phase = 0;
      Object.values(edgeEls).forEach((e) => e.classList.remove("lit", "blit"));
      render();
      $("#bpNote").innerHTML = `<b>Update:</b> w = ${r2(ow)} − 0.05 × (${r2(G.w)}) = <b>${r2(w)}</b>, and b = ${r2(ob)} − 0.05 × (${r2(G.b)}) = <b>${r2(b)}</b>. Press <b>Forward</b> again: the loss should be smaller. ${round > 3 ? "The loss keeps falling towards 0. This is learning." : ""}`;
    });
    $("#bpReset").addEventListener("click", () => {
      w = 0.5; b = 0; round = 1; phase = 0; V = {}; G = {};
      Object.values(edgeEls).forEach((e) => e.classList.remove("lit", "blit"));
      $("#bpNote").innerHTML = "Example: input <b>x = 2</b>, correct answer <b>y = 5</b>. The model starts with w = 0.5, b = 0, so it predicts 1. Press <b>Forward</b>.";
      render();
    });
    render();
  })();

  // ======================= DEMO 8: NEURAL NETWORK LAB =======================
  (function nnLab() {
    const el = $("#nnCanvas"); if (!el) return;
    const LRS = [0.001, 0.003, 0.01, 0.03, 0.1, 0.3];
    const S = { data: "circle", layers: 2, neurons: 6, lr: 2, noise: 10, act: "tanh", seed: 1 };
    let train = [], test = [], net = null, epoch = 0, histTr = [], histTe = [], playing = false, raf = 0, frame = 0;

    // ---- datasets ----
    function genData() {
      const r = rng(1234 + ["circle", "xor", "moons", "spiral"].indexOf(S.data) * 101), pts = [], nz = S.noise / 100;
      const N = 300;
      for (let i = 0; i < N; i++) {
        let x, y, l;
        if (S.data === "circle") {
          l = i % 2;
          const rad = l ? r() * 0.45 : 0.62 + r() * 0.3, t = r() * Math.PI * 2;
          x = rad * Math.cos(t); y = rad * Math.sin(t);
        } else if (S.data === "xor") {
          x = r() * 1.8 - 0.9; y = r() * 1.8 - 0.9;
          x += x > 0 ? 0.06 : -0.06; y += y > 0 ? 0.06 : -0.06;
          l = x * y > 0 ? 1 : 0;
        } else if (S.data === "moons") {
          l = i % 2; const t = r() * Math.PI;
          let mx = l ? Math.cos(t) : 1 - Math.cos(t), my = l ? Math.sin(t) : 0.5 - Math.sin(t);
          x = (mx - 0.5) / 1.6; y = (my - 0.25) / 1.05;
        } else {
          l = i % 2; const k = Math.floor(i / 2) / (N / 2);
          const rad = 0.06 + k * 0.86, t = 1.6 * k * 2 * Math.PI + (l ? Math.PI : 0);
          x = rad * Math.sin(t); y = rad * Math.cos(t);
        }
        x += gauss(r) * nz * 0.3; y += gauss(r) * nz * 0.3;
        pts.push([Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)), l]);
      }
      // shuffle then split 2:1
      for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
      train = pts.slice(0, 200); test = pts.slice(200);
    }

    // ---- network ----
    const ACT = {
      tanh: [(z) => Math.tanh(z), (z, a) => 1 - a * a],
      relu: [(z) => (z > 0 ? z : 0), (z) => (z > 0 ? 1 : 0)],
      sigmoid: [(z) => 1 / (1 + Math.exp(-z)), (z, a) => a * (1 - a)],
    };
    function build() {
      const r = rng(S.seed * 7919), sizes = [2, ...Array(S.layers).fill(S.neurons), 1];
      const L = [];
      for (let l = 1; l < sizes.length; l++) {
        const nin = sizes[l - 1], nout = sizes[l], sc = Math.sqrt((S.act === "relu" ? 2 : 1) / nin);
        const W = new Float64Array(nin * nout).map(() => gauss(r) * sc);
        const B = new Float64Array(nout).fill(S.act === "relu" && l < sizes.length - 1 ? 0.05 : 0);
        L.push({ nin, nout, W, B, gW: new Float64Array(nin * nout), gB: new Float64Array(nout),
          mW: new Float64Array(nin * nout), vW: new Float64Array(nin * nout), mB: new Float64Array(nout), vB: new Float64Array(nout),
          z: new Float64Array(nout), a: new Float64Array(nout), d: new Float64Array(nout) });
      }
      net = { L, sizes, t: 0 };
      epoch = 0; histTr = []; histTe = [];
    }
    const sig = (z) => 1 / (1 + Math.exp(-z));
    function forward(x, y) {
      const f = ACT[S.act][0];
      let inp = [x, y];
      for (let l = 0; l < net.L.length; l++) {
        const Ly = net.L[l], last = l === net.L.length - 1;
        for (let j = 0; j < Ly.nout; j++) {
          let s = Ly.B[j];
          for (let i = 0; i < Ly.nin; i++) s += Ly.W[j * Ly.nin + i] * inp[i];
          Ly.z[j] = s; Ly.a[j] = last ? sig(s) : f(s);
        }
        inp = Ly.a;
      }
      return net.L[net.L.length - 1].a[0];
    }
    function backward(x, y, t) {
      const df = ACT[S.act][1], Ls = net.L, last = Ls.length - 1;
      Ls[last].d[0] = Ls[last].a[0] - t;                 // dBCE/dz for sigmoid output
      for (let l = last; l >= 0; l--) {
        const Ly = Ls[l], prevA = l ? Ls[l - 1].a : [x, y];
        for (let j = 0; j < Ly.nout; j++) {
          const dj = Ly.d[j]; Ly.gB[j] += dj;
          for (let i = 0; i < Ly.nin; i++) Ly.gW[j * Ly.nin + i] += dj * prevA[i];
        }
        if (l > 0) {
          const P = Ls[l - 1];
          for (let i = 0; i < P.nout; i++) {
            let s = 0; for (let j = 0; j < Ly.nout; j++) s += Ly.W[j * Ly.nin + i] * Ly.d[j];
            P.d[i] = s * df(P.z[i], P.a[i]);
          }
        }
      }
    }
    function adam(bs) {
      const lr = LRS[S.lr], b1 = 0.9, b2 = 0.999, eps = 1e-8; net.t++;
      const c1 = 1 - Math.pow(b1, net.t), c2 = 1 - Math.pow(b2, net.t);
      for (const Ly of net.L) {
        for (const [P, G, M, V] of [[Ly.W, Ly.gW, Ly.mW, Ly.vW], [Ly.B, Ly.gB, Ly.mB, Ly.vB]]) {
          for (let k = 0; k < P.length; k++) {
            const g = G[k] / bs; G[k] = 0;
            M[k] = b1 * M[k] + (1 - b1) * g; V[k] = b2 * V[k] + (1 - b2) * g * g;
            P[k] -= (lr * (M[k] / c1)) / (Math.sqrt(V[k] / c2) + eps);
          }
        }
      }
    }
    const shuf = rng(99);
    function trainEpoch() {
      const idx = train.map((_, i) => i);
      for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(shuf() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      const BS = 10;
      for (let s = 0; s < idx.length; s += BS) {
        const batch = idx.slice(s, s + BS);
        for (const k of batch) { const [x, y, t] = train[k]; forward(x, y); backward(x, y, t); }
        adam(batch.length);
      }
      epoch++;
    }
    function evalSet(set) {
      let L = 0, ok = 0;
      for (const [x, y, t] of set) {
        const p = Math.min(1 - 1e-7, Math.max(1e-7, forward(x, y)));
        L += -(t * Math.log(p) + (1 - t) * Math.log(1 - p));
        if ((p > 0.5 ? 1 : 0) === t) ok++;
      }
      return [L / set.length, ok / set.length];
    }
    function record() {
      const [lt] = evalSet(train), [le, acc] = evalSet(test);
      histTr.push(lt); histTe.push(le);
      if (histTr.length > 600) { histTr = histTr.filter((_, i) => i % 2 === 0); histTe = histTe.filter((_, i) => i % 2 === 0); }
      $("#nnEpoch").textContent = epoch; $("#nnTrain").textContent = lt.toFixed(3); $("#nnTest").textContent = le.toFixed(3);
      $("#nnAcc").textContent = Math.round(acc * 100) + "%";
    }

    // ---- drawing ----
    const cv = canvas(el, (ctx, w, h) => {
      window.AI.heatmap(ctx, w, h, (x, y) => forward(x, y), 56);
      const X = (x) => ((x + 1) / 2) * w, Y = (y) => ((1 - y) / 2) * h;
      for (const [x, y, l] of train) window.AI.dot(ctx, X(x), Y(y), 4.2, l ? C.blue : C.orange, "#fff", 1.2);
      for (const [x, y, l] of test) window.AI.dot(ctx, X(x), Y(y), 3.4, "#fff", l ? C.blue : C.orange, 1.6);
    });
    const curve = canvas($("#nnCurve"), (ctx, w, h) => {
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
      if (histTr.length < 2) { ctx.fillStyle = C.ink3; ctx.font = "12px Inter, sans-serif"; ctx.fillText("Press Train to start", 12, h / 2 + 4); return; }
      const pad = 8, n = histTr.length, mx = Math.max(0.75, ...histTr.slice(0, 3), ...histTe.slice(0, 3));
      const X = (i) => pad + (i / (n - 1)) * (w - 2 * pad), Y = (v) => h - pad - (Math.min(v, mx) / mx) * (h - 2 * pad);
      [[histTe, C.orange], [histTr, C.ink]].forEach(([H, col]) => {
        ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.beginPath();
        H.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)))); ctx.stroke();
      });
    });
    const netSvg = $("#nnNet"), NS = "http://www.w3.org/2000/svg";
    function drawNet() {
      const sizes = net.sizes, W = 420, H = 170, cols = sizes.length;
      const pos = sizes.map((n, l) => Array.from({ length: n }, (_, i) => [30 + (l * (W - 60)) / (cols - 1), H / 2 + (i - (n - 1) / 2) * Math.min(16, (H - 24) / Math.max(1, n - 1 || 1))]));
      let s = "";
      net.L.forEach((Ly, l) => {
        for (let j = 0; j < Ly.nout; j++) for (let i = 0; i < Ly.nin; i++) {
          const wv = Ly.W[j * Ly.nin + i], [x1, y1] = pos[l][i], [x2, y2] = pos[l + 1][j];
          s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${wv > 0 ? C.blue : C.orange}" stroke-width="${Math.min(4, 0.3 + Math.abs(wv) * 0.9).toFixed(2)}" stroke-opacity="${Math.min(0.9, 0.15 + Math.abs(wv) * 0.35).toFixed(2)}"/>`;
        }
      });
      pos.forEach((col, l) => col.forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="${l === 0 || l === cols - 1 ? 6 : 5}" fill="${l === 0 ? C.ink : "#fff"}" stroke="${C.ink}" stroke-width="1.3"/>`; }));
      s += `<text x="30" y="${H - 6}" font-size="10" fill="${C.ink3}" text-anchor="middle" font-family="JetBrains Mono">input</text><text x="${W - 30}" y="${H - 6}" font-size="10" fill="${C.ink3}" text-anchor="middle" font-family="JetBrains Mono">output</text>`;
      let nparams = 0; net.L.forEach((Ly) => (nparams += Ly.W.length + Ly.B.length));
      s += `<text x="${W / 2}" y="12" font-size="10.5" fill="${C.ink2}" text-anchor="middle" font-family="JetBrains Mono">${nparams} parameters</text>`;
      netSvg.innerHTML = s;
    }
    function drawAll() { cv.redraw(); curve.redraw(); drawNet(); }

    function loop() {
      if (!playing) return;
      frame++;
      trainEpoch(); if (epoch > 150) trainEpoch();
      record(); cv.redraw(); curve.redraw();
      if (frame % 8 === 0) drawNet();
      if (epoch >= 4000) setPlay(false); else raf = requestAnimationFrame(loop);
    }
    function setPlay(p) {
      playing = p; $("#nnPlay").textContent = p ? "❚❚ Pause" : "▶ Train";
      cancelAnimationFrame(raf); if (p) raf = requestAnimationFrame(loop); else drawNet();
    }
    function rebuild(newData) {
      if (newData) genData();
      build(); record(); histTr = []; histTe = []; drawAll();
      $("#nnEpoch").textContent = 0;
    }
    $("#nnPlay").addEventListener("click", () => setPlay(!playing));
    $("#nnStep").addEventListener("click", () => { setPlay(false); trainEpoch(); record(); drawAll(); });
    $("#nnReset").addEventListener("click", () => { S.seed++; rebuild(false); });
    seg($("#nnData"), (b) => { S.data = b.dataset.d; rebuild(true); });
    seg($("#nnAct"), (b) => { S.act = b.dataset.a; rebuild(false); });
    const bind = (id, out, key, fmtF, data) => {
      const inp = $(id);
      inp.addEventListener("input", () => { S[key] = +inp.value; $(out).textContent = fmtF(+inp.value); if (key !== "lr") rebuild(data); });
      $(out).textContent = fmtF(+inp.value);
    };
    bind("#nnLayers", "#nnLo", "layers", (v) => v, false);
    bind("#nnNeurons", "#nnNo", "neurons", (v) => v, false);
    bind("#nnLr", "#nnLro", "lr", (v) => LRS[v], false);
    bind("#nnNoise", "#nnNz", "noise", (v) => v + "%", true);
    whenVisible(el.closest(".demo"), (v) => { if (!v && playing) setPlay(false); });
    genData(); rebuild(false);
  })();
})();
