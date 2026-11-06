/* core.js: shared helpers, page chrome (nav, progress, reveal) */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const C = {
    paper: "#f6f4ee", paper2: "#efece3", card: "#ffffff",
    ink: "#16161a", ink2: "#4c4d55", ink3: "#85868f",
    line: "#e3dfd4", line2: "#d3cec1",
    blue: "#2f4bdc", orange: "#ef6a32", green: "#1f8a5b", red: "#c8372d",
  };

  // Seeded RNG (mulberry32) so demos are reproducible
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) {
    let u = 0, v = 0;
    while (u === 0) u = r();
    while (v === 0) v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** Canvas with DPR scaling; calls draw(ctx, w, h) on resize. Returns {ctx, w, h, redraw}. */
  function canvas(el, draw) {
    const ctx = el.getContext("2d");
    const st = { el, ctx, w: 0, h: 0, redraw: null };
    function fit() {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      if (w === st.w && h === st.h && el.width === Math.round(w * dpr)) return false;
      st.w = w; st.h = h;
      el.width = Math.round(w * dpr); el.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    }
    st.redraw = function () { fit(); draw(ctx, st.w, st.h); };
    if ("ResizeObserver" in window) new ResizeObserver(() => { if (fit()) draw(ctx, st.w, st.h); }).observe(el);
    else window.addEventListener("resize", st.redraw);
    fit();
    return st;
  }

  /** Run fn only while el is visible on screen (saves CPU for animations). */
  function whenVisible(el, onChange) {
    if (!("IntersectionObserver" in window)) { onChange(true); return; }
    new IntersectionObserver((es) => es.forEach((e) => onChange(e.isIntersecting)), { threshold: 0.05 }).observe(el);
  }

  function fmt(x, d = 3) {
    if (!isFinite(x)) return "∞";
    const a = Math.abs(x);
    if (a >= 1e4) return x.toExponential(1);
    return x.toFixed(d);
  }

  function seg(container, onPick) {
    const btns = $$("button", container);
    btns.forEach((b) => b.addEventListener("click", () => {
      btns.forEach((x) => x.classList.toggle("on", x === b));
      onPick(b);
    }));
  }

  function axes(ctx, w, h, pad, opts = {}) {
    ctx.save();
    ctx.strokeStyle = C.line; ctx.lineWidth = 1;
    const n = opts.grid || 4;
    for (let i = 0; i <= n; i++) {
      const x = pad + (i / n) * (w - 2 * pad), y = pad + (i / n) * (h - 2 * pad);
      ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, h - pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
    }
    ctx.restore();
  }

  window.AI = { $, $$, C, rng, gauss, canvas, whenVisible, fmt, seg, axes,
    reduced: window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches };

  // ---------- page chrome ----------
  document.addEventListener("DOMContentLoaded", () => {
    const bar = $("#progressBar"), top = $(".topbar");
    const navLinks = $$(".topnav a");
    const stepLinks = $$("#stepper a");
    const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
    const steps = stepLinks.map((a) => $(a.getAttribute("href")));

    function onScroll() {
      const st = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (max > 0 ? (st / max) * 100 : 0) + "%";
      top.classList.toggle("scrolled", st > 8);
      const probe = st + innerHeight * 0.3;
      let cur = -1;
      sections.forEach((s, i) => { if (s.offsetTop <= probe) cur = i; });
      navLinks.forEach((a, i) => a.classList.toggle("active", i === cur));
      let cs = -1;
      steps.forEach((s, i) => { if (s && s.offsetTop <= probe) cs = i; });
      stepLinks.forEach((a, i) => { a.classList.toggle("active", i === cs); a.classList.toggle("done", i < cs); });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    const tog = $("#navToggle"), nav = $(".topnav");
    tog.addEventListener("click", () => {
      const o = nav.classList.toggle("open");
      tog.setAttribute("aria-expanded", o);
    });
    navLinks.forEach((a) => a.addEventListener("click", () => { nav.classList.remove("open"); tog.setAttribute("aria-expanded", "false"); }));

    // reveal on scroll
    const rv = $$(".sec-head, .demo, .step-body > p, .callout, .stage, .video, .qcard, .ladder, .deploy, .analogy, .loop");
    if ("IntersectionObserver" in window && !window.AI.reduced) {
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
      rv.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top > innerHeight) { el.classList.add("reveal"); io.observe(el); }
      });
    }
  });
})();
