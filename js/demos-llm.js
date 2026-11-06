/* demos-llm.js: a tiny bigram language model (Demo 11) */
(function () {
  "use strict";
  const { $, $$ } = window.AI;
  const DEFAULT = `The model makes a guess, and the loss measures the error. The model learns from the error, and the model gets a little better. The data teaches the model. The model sees the data again and again.
A neural network is a model with many weights. The weights change a little after every guess. The learning rate decides how big the change is.
The model learns patterns from the data, not rules from a programmer. A language model learns to predict the next word. The next word depends on the words before it. The model predicts the next word, and the loss measures how surprised the model is. A good model is rarely surprised. Training makes the model less surprised by real text.`;

  const corpusEl = $("#lmCorpus"), input = $("#lmInput"), bars = $("#lmBars"), note = $("#lmLossNote"), out = $("#lmOut");
  if (!corpusEl) return;
  corpusEl.value = DEFAULT;
  let big = new Map(), uni = new Map(), total = 0, timer = 0;

  const tok = (s) => (s.toLowerCase().match(/[a-z0-9']+|[.,!?;:]/g) || []);
  function trainLM() {
    const t = tok(corpusEl.value);
    big = new Map(); uni = new Map(); total = t.length;
    for (let i = 0; i < t.length; i++) {
      uni.set(t[i], (uni.get(t[i]) || 0) + 1);
      if (i + 1 < t.length) {
        if (!big.has(t[i])) big.set(t[i], new Map());
        const m = big.get(t[i]); m.set(t[i + 1], (m.get(t[i + 1]) || 0) + 1);
      }
    }
    let pairs = 0; big.forEach((m) => (pairs += m.size));
    $("#lmStats").textContent = `${total} tokens · ${uni.size} unique · ${pairs} word pairs learned`;
  }
  function dist(word, T = 1) {
    const m = big.get(word);
    const src = m && m.size ? m : uni;
    let arr = Array.from(src.entries()).map(([w, c]) => [w, Math.pow(c, 1 / T)]);
    const z = arr.reduce((s, [, v]) => s + v, 0);
    arr = arr.map(([w, v]) => [w, v / z]).sort((a, b) => b[1] - a[1]);
    return { arr, known: !!(m && m.size) };
  }
  function lastWord() { const t = tok(input.value); return t.length ? t[t.length - 1] : ""; }
  function render() {
    const w = lastWord();
    if (!w) { bars.innerHTML = `<p class="muted small">Type a word above.</p>`; return; }
    const { arr, known } = dist(w);
    const top = arr.slice(0, 6), mx = top[0] ? top[0][1] : 1;
    bars.innerHTML = (known ? "" : `<p class="muted small">“${w}” never appears in the training text, so the model falls back to overall word frequencies. Real LLMs avoid this by splitting rare words into sub-word tokens.</p>`) +
      top.map(([t, p]) => `<button class="bar" data-w="${t}" data-p="${p}"><span class="bl">${t}</span><span class="bt"><span class="bw" style="width:${(p / mx) * 100}%"></span></span><span class="bp">${(p * 100).toFixed(0)}%</span></button>`).join("");
    $$(".bar", bars).forEach((b) => b.addEventListener("click", () => {
      $$(".bar", bars).forEach((x) => x.classList.toggle("sel", x === b));
      const p = +b.dataset.p;
      note.innerHTML = `If the true next word after “${w}” is <b>“${b.dataset.w}”</b>, the model gave it p = ${p.toFixed(2)}, so the training loss for this word is −ln(${p.toFixed(2)}) = <b>${(-Math.log(p)).toFixed(2)}</b>. ${p > 0.5 ? "Confident and right means a small loss." : "Less confident means a bigger loss, and gradient descent would push this probability up."}`;
    }));
  }
  function join(tokens) { return tokens.map((t, i) => (i && !/^[.,!?;:]$/.test(t) ? " " : "") + t).join(""); }
  function generate() {
    clearTimeout(timer);
    const T = +$("#lmTemp").value / 10;
    let w = lastWord(); if (!w) return;
    const words = [];
    let r = Math.random;
    for (let i = 0; i < 20; i++) {
      const { arr } = dist(w, T);
      let u = r(), pick = arr[arr.length - 1][0];
      for (const [t, p] of arr) { u -= p; if (u <= 0) { pick = t; break; } }
      words.push(pick); w = pick;
    }
    out.innerHTML = `<span class="p">${input.value.trim()}</span><span class="g"></span>`;
    const g = $(".g", out);
    let i = 0;
    (function next() {
      if (i >= words.length) return;
      g.textContent = (/^[.,!?;:]$/.test(words[0]) ? "" : " ") + join(words.slice(0, ++i));
      timer = setTimeout(next, 70);
    })();
  }
  input.addEventListener("input", render);
  $("#lmGen").addEventListener("click", generate);
  $("#lmTemp").addEventListener("input", (e) => ($("#lmTo").textContent = (+e.target.value / 10).toFixed(1)));
  $("#lmTrain").addEventListener("click", () => { trainLM(); render(); out.textContent = ""; });
  trainLM(); render();
})();
