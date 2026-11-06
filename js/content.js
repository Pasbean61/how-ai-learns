/* content.js: analogy, loop, cards, ladder, DIY code, videos, quiz, glossary, references */
(function () {
  "use strict";
  const { $, $$, seg } = window.AI;

  // ---------------- References ----------------
  const REFS = [
    [1, "3Blue1Brown (Grant Sanderson).", "Neural Networks, a visual video series (chapters 1–7).", "https://www.3blue1brown.com/topics/neural-networks"],
    [2, "Google for Developers.", "Machine Learning Crash Course.", "https://developers.google.com/machine-learning/crash-course"],
    [3, "Goodfellow, I., Bengio, Y. & Courville, A. (2016).", "Deep Learning. MIT Press (free online).", "https://www.deeplearningbook.org/"],
    [4, "Nielsen, M. (2015).", "Neural Networks and Deep Learning (free online book).", "http://neuralnetworksanddeeplearning.com/"],
    [5, "Karpathy, A.", "micrograd: a tiny autograd engine that implements backpropagation in ~100 lines.", "https://github.com/karpathy/micrograd"],
    [6, "Rumelhart, D. E., Hinton, G. E. & Williams, R. J. (1986).", "Learning representations by back-propagating errors. Nature 323, 533–536.", "https://www.nature.com/articles/323533a0"],
    [7, "Kingma, D. P. & Ba, J. (2014).", "Adam: A Method for Stochastic Optimization. arXiv:1412.6980.", "https://arxiv.org/abs/1412.6980"],
    [8, "Vaswani, A. et al. (2017).", "Attention Is All You Need. arXiv:1706.03762.", "https://arxiv.org/abs/1706.03762"],
    [9, "Brown, T. et al. (2020).", "Language Models are Few-Shot Learners (GPT-3, 175B parameters). arXiv:2005.14165.", "https://arxiv.org/abs/2005.14165"],
    [10, "Ouyang, L. et al. (2022).", "Training language models to follow instructions with human feedback (InstructGPT / RLHF). arXiv:2203.02155.", "https://arxiv.org/abs/2203.02155"],
    [11, "Bai, Y. et al. (2022).", "Constitutional AI: Harmlessness from AI Feedback. Anthropic. arXiv:2212.08073.", "https://arxiv.org/abs/2212.08073"],
    [12, "Srivastava, N. et al. (2014).", "Dropout: A Simple Way to Prevent Neural Networks from Overfitting. JMLR 15.", "https://jmlr.org/papers/v15/srivastava14a.html"],
    [13, "Kaplan, J. et al. (2020).", "Scaling Laws for Neural Language Models. arXiv:2001.08361.", "https://arxiv.org/abs/2001.08361"],
    [14, "Hoffmann, J. et al. (2022).", "Training Compute-Optimal Large Language Models (Chinchilla). arXiv:2203.15556.", "https://arxiv.org/abs/2203.15556"],
    [15, "PyTorch.", "Learn the Basics, the official PyTorch tutorials.", "https://pytorch.org/tutorials/beginner/basics/intro.html"],
    [16, "Llama Team, Meta AI (2024).", "The Llama 3 Herd of Models (pre-trained on ~15T tokens). arXiv:2407.21783.", "https://arxiv.org/abs/2407.21783"],
    [17, "Google.", "Teachable Machine: train a model in your browser, no code.", "https://teachablemachine.withgoogle.com/"],
    [18, "Kaggle Learn.", "Intro to Machine Learning (free course).", "https://www.kaggle.com/learn/intro-to-machine-learning"],
    [19, "scikit-learn.", "load_digits: the handwritten digits dataset (1,797 images, 8×8 pixels).", "https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_digits.html"],
    [20, "Gradio / Hugging Face.", "Gradio: build and share ML demo apps; host them on Hugging Face Spaces.", "https://www.gradio.app/"],
    [21, "Hugging Face.", "AutoTrain documentation: train models without writing code.", "https://huggingface.co/docs/autotrain/index"],
    [22, "fast.ai.", "Practical Deep Learning for Coders (free course).", "https://course.fast.ai/"],
    [23, "LeCun, Y., Bottou, L., Bengio, Y. & Haffner, P. (1998).", "Gradient-based learning applied to document recognition (LeNet-5). Proc. IEEE 86(11).", "https://ieeexplore.ieee.org/document/726791"],
    [24, "He, K., Zhang, X., Ren, S. & Sun, J. (2015).", "Deep Residual Learning for Image Recognition (ResNet). arXiv:1512.03385.", "https://arxiv.org/abs/1512.03385"],
    [25, "Radford, A. et al. (2019).", "Language Models are Unsupervised Multitask Learners (GPT-2, 1.5B parameters). OpenAI.", "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf"],
    [26, "Ruder, S. (2016).", "An overview of gradient descent optimization algorithms. arXiv:1609.04747.", "https://arxiv.org/abs/1609.04747"],
    [27, "Smilkov, D. & Carter, S.", "TensorFlow Playground, the inspiration for Demo 8.", "https://playground.tensorflow.org/"],
    [28, "Google for Developers.", "Overfitting: Machine Learning Crash Course module.", "https://developers.google.com/machine-learning/crash-course/overfitting"],
  ];
  $("#refList").innerHTML = REFS.map(([n, a, t, u]) =>
    `<li id="ref-${n}" data-n="${n}">${a} <span class="rt">${t}</span><br><a href="${u}" target="_blank" rel="noopener">${u.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a></li>`).join("");
  const cite = (n) => `<a class="cite" href="#ref-${n}">[${n}]</a>`;

  // ---------------- Analogy ----------------
  const ROWS = [
    ["Plan", "Decide what the site is for", "Who visits it, and what should they be able to do?",
      "Frame the problem", "What goes in, what comes out, and how will success be measured?",
      "Example: “Given a photo of a handwritten digit, output which digit 0–9 it is. Success = over 95% correct on photos the model has never seen.”"],
    ["Content", "Write the text, gather images", "The raw material of the page.",
      "Collect &amp; clean the data", "Thousands to trillions of labelled examples.",
      "Data quality matters more than anything else. A model can only learn patterns that are actually in its data, including biased or wrong ones. Remember “garbage in, garbage out”."],
    ["Skeleton", "HTML", "Defines the structure: headings, sections, buttons.",
      "Model architecture", "Defines the structure of the maths: layers of neurons and how they connect.",
      "Like HTML, the architecture is chosen by a person: a straight line, a decision tree, a neural network or a Transformer. But it starts out “blank”: all its weights are random."],
    ["Make it right", "CSS: you tweak it by hand", "You adjust colours and sizes until it looks right.",
      "Training: the computer tweaks itself", "An algorithm adjusts millions of weights automatically until the loss is low.",
      "<span class='tag'>The big difference</span>This is where ML is fundamentally different. You never set the weights yourself. You set up the loss (what “right” means) and the optimiser (how to improve), then the data does the rest. See Steps 4–5."],
    ["Test", "Open it on phones and browsers", "Does it work for real visitors?",
      "Evaluate on unseen data", "Check it on a test set the model never trained on.",
      "A model that scores 100% on its training data may simply have memorised it. Only the test set tells you if it will work in the real world (Step 6)."],
    ["Publish", "GitHub Pages / a domain", "Make it available to everyone.",
      "Deploy as an app or API", "Wrap the trained model so people or programs can use it, then monitor it.",
      "Hugging Face Spaces is to ML demos what GitHub Pages is to websites: free hosting for a shareable demo " + "<a class='cite' href='#ref-20'>[20]</a>."],
    ["Shortcut", "Vibe coding", "Ask Claude to write the HTML and CSS for you.",
      "Vibe coding / no-code ML", "Ask Claude to write the training code, or use tools like Teachable Machine.",
      "Both shortcuts are real and useful (see Route C below). In both cases you still need to understand the steps to judge whether the result is correct."],
  ];
  const at = $("#analogy-table");
  at.insertAdjacentHTML("beforeend", ROWS.map((r, i) => `
    <div class="arow${i === 3 ? " diff" : ""}${i === 6 ? " shortcut" : ""}" tabindex="0" role="button" aria-expanded="false">
      <span class="anum">${i === 6 ? "★" : i + 1}</span>
      <div class="acell web"><b>${r[1]}</b><span>${r[2]}</span></div>
      <div class="acell ml"><b>${r[3]}</b><span>${r[4]}</span></div>
      <div class="amore">${r[5]}</div>
    </div>`).join(""));
  $$(".arow", at).forEach((row, i) => {
    const toggle = () => { const o = row.classList.toggle("open"); row.setAttribute("aria-expanded", o); };
    row.addEventListener("click", (e) => { if (!e.target.closest("a")) toggle(); });
    row.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    if (i === 3) { row.classList.add("open"); row.setAttribute("aria-expanded", "true"); }
  });

  // ---------------- Loop ----------------
  const BEATS = [
    ["1 · Predict (the forward pass)", "Feed an example into the model. Its current weights turn the input into a prediction. At the very start the weights are random, so the prediction is nonsense.",
      "<b>House-price model:</b> input = 85 m², 3 bedrooms → the model predicts <b>£210,000</b>."],
    ["2 · Measure the loss", "Compare the prediction with the correct answer (the label) and turn the mistake into one number: the loss. Lower is better, and 0 means perfect.",
      "True price = <b>£250,000</b>. Error = −£40k. Squared error loss = (−40)² = <b>1,600</b> (in £k²)."],
    ["3 · Find the gradient (backpropagation)", "For <em>every</em> weight, calculus asks: “if I nudge this weight up a tiny bit, does the loss go up or down, and by how much?” The list of all these answers is the gradient. Backpropagation computes it efficiently, from the output backwards " + cite(6) + ".",
      "Gradient says: increasing the “size” weight would <b>reduce</b> the loss, so it should go up."],
    ["4 · Update the weights (gradient descent)", "Move every weight a small step in the direction that lowers the loss: <code>w_new = w_old − η × gradient</code>. Then take the next batch of examples and repeat, thousands or millions of times.",
      "After the update, the same house is predicted at <b>£228,000</b>, which is closer. Repeat until the predictions are good."],
  ];
  const detail = $("#loopDetail"), beatBtns = $$(".beat");
  let beat = 0, beatTimer = null, userTouched = false;
  function showBeat(i) {
    beat = i;
    beatBtns.forEach((b, j) => b.classList.toggle("on", j === i));
    const [h, p, ex] = BEATS[i];
    detail.innerHTML = `<h4>${h}</h4><p>${p}</p><div class="ex">${ex}</div>`;
  }
  beatBtns.forEach((b, i) => {
    b.addEventListener("mouseenter", () => { userTouched = true; showBeat(i); });
    b.addEventListener("click", () => { userTouched = true; showBeat(i); });
  });
  showBeat(0);
  window.AI.whenVisible($("#loopDiagram"), (vis) => {
    clearInterval(beatTimer);
    if (vis && !window.AI.reduced) beatTimer = setInterval(() => { if (!userTouched) showBeat((beat + 1) % 4); }, 3600);
  });

  // ---------------- Problem-type cards ----------------
  const TYPES = { cls: ["Classification", "#2f4bdc"], reg: ["Regression", "#1f8a5b"], clu: ["Clustering", "#7a4fd1"], gen: ["Generation", "#ef6a32"] };
  const CARDS = [
    ["Is this email spam or not?", "cls", "Output: one of 2 categories. A <em>binary</em> classifier."],
    ["What will this flat rent for in Edinburgh next year?", "reg", "Output: a number in £ per month."],
    ["Which digit, 0–9, is in this photo?", "cls", "Output: one of 10 categories. You can train this one yourself in Route B."],
    ["Split our customers into groups that behave alike (we have no labels).", "clu", "No correct answers are given, so this is <em>unsupervised</em> learning."],
    ["Write a polite reply to this email.", "gen", "Output: new text, produced one token at a time by an LLM."],
    ["How many bikes will be rented tomorrow?", "reg", "Output: a count (a number)."],
  ];
  const cardBox = $("#typeCards");
  cardBox.innerHTML = CARDS.map(([q, t, a]) =>
    `<button class="tcard" aria-expanded="false"><div class="q">${q}</div><div class="ans"><b style="background:${TYPES[t][1]}">${TYPES[t][0]}</b><br>${a}</div></button>`).join("");
  $$(".tcard", cardBox).forEach((c) => c.addEventListener("click", () => { const o = c.classList.toggle("open"); c.setAttribute("aria-expanded", o); }));

  // ---------------- Model-size ladder ----------------
  const LADDER = [
    ["Line fit", "Demo 5 on this page", 2, ""],
    ["Single neuron", "Demo 4", 3, ""],
    ["Neural-net lab", "Demo 8, 2 layers × 6", 67, ""],
    ["Digit reader", "Route B code below", 4810, ""],
    ["LeNet-5 (1998)", "read cheques for banks", 6e4, cite(23)],
    ["ResNet-50 (2015)", "image recognition", 2.56e7, cite(24)],
    ["GPT-2 (2019)", "language model", 1.5e9, cite(25)],
    ["GPT-3 (2020)", "language model", 1.75e11, cite(9)],
  ];
  const human = (n) => n >= 1e9 ? (n / 1e9).toFixed(n >= 1e10 ? 0 : 1) + " billion" : n >= 1e6 ? (n / 1e6).toFixed(1) + " million" : n >= 1e4 ? Math.round(n / 1e3) + ",000" : n.toLocaleString("en-GB");
  const lad = $("#ladder");
  lad.innerHTML = LADDER.map(([name, sub, n, c]) =>
    `<div class="lrow"><div class="lname"><b>${name} ${c}</b><span>${sub}</span></div><div class="ltrack"><div class="lbar" data-w="${Math.max(1.2, (Math.log10(n) / 12) * 100)}"></div></div><div class="lval">${n >= 1e4 ? "~" : ""}${human(n)}</div></div>`).join("") +
    `<div class="laxis"><span></span><div><span>1</span><span>1,000</span><span>1 million</span><span>1 billion</span><span>1 trillion</span></div><span>parameters</span></div>`;
  const growBars = () => $$(".lbar", lad).forEach((b, i) => setTimeout(() => (b.style.width = b.dataset.w + "%"), i * 90));
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { growBars(); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(lad);
  } else growBars();

  // ---------------- DIY routes ----------------
  seg($("#routeTabs"), (b) => $$(".route").forEach((r) => r.classList.toggle("on", r.id === "route-" + b.dataset.r)));

  const STEPS = { 1: "Step 1 · Frame", 2: "Step 2 · Data", 3: "Step 3 · Model", 4: "Step 4 · Loss", 5: "Step 5 · Train", 6: "Step 6 · Evaluate" };
  const SK = [
    ["# Goal: look at an 8x8 picture of a handwritten digit and say which digit (0-9) it is", 1, "We frame it as <b>classification with 10 classes</b>. Success = high accuracy on images the model has never seen."],
    ["from sklearn.datasets import load_digits", 2, "scikit-learn ships with small practice datasets. This one has 1,797 digit images " + cite(19) + "."],
    ["from sklearn.model_selection import train_test_split", 2, "A helper that randomly splits the data into training and test sets."],
    ["from sklearn.preprocessing import StandardScaler", 2, "Rescales each feature to mean 0 and spread 1, which helps gradient descent."],
    ["from sklearn.neural_network import MLPClassifier", 3, "MLP = multi-layer perceptron, the classic neural network you trained in Demo 8."],
    ["from sklearn.metrics import accuracy_score", 6, "Accuracy = the fraction of predictions that are correct."],
    ["", 0, ""],
    ["X, y = load_digits(return_X_y=True)   # X: 1797 images x 64 pixels, y: the digit", 2, "<b>X</b> holds the features (64 pixel brightness values per image). <b>y</b> holds the labels (the true digit)."],
    ["print(X.shape)                        # (1797, 64)", 2, "Always look at your data first: how many examples, and how many features?"],
    ["", 0, ""],
    ["X_train, X_test, y_train, y_test = train_test_split(", 2, "Keep 20% of the data locked away as the test set. <code>stratify=y</code> keeps the same mix of digits in both parts."],
    ["    X, y, test_size=0.2, random_state=0, stratify=y)", 2, "<code>random_state=0</code> makes the random split repeatable, so you get the same result each run."],
    ["", 0, ""],
    ["scaler = StandardScaler().fit(X_train)   # learn the scaling from TRAIN data only", 2, "This avoids <b>data leakage</b>: the scaler must never see the test data."],
    ["X_train, X_test = scaler.transform(X_train), scaler.transform(X_test)", 2, "Apply the same scaling to both sets."],
    ["", 0, ""],
    ["model = MLPClassifier(hidden_layer_sizes=(64,), learning_rate_init=0.001,", 3, "Architecture: 64 inputs → <b>one hidden layer of 64 neurons</b> → 10 outputs. About 4,800 weights in total. The learning rate is the η from Demo 6."],
    ["                      max_iter=300, random_state=0)", 5, "Train for at most 300 epochs. By default it uses the <b>Adam</b> optimiser " + cite(7) + " and <b>cross-entropy</b> loss (Step 4)."],
    ["", 0, ""],
    ["model.fit(X_train, y_train)               # the whole learning loop runs in here", 5, "This one line runs the full loop from Section 01: predict → loss → backprop → update, repeated over mini-batches and epochs."],
    ["", 0, ""],
    ["print(\"train accuracy:\", accuracy_score(y_train, model.predict(X_train)))", 6, "Score on data it trained on. This is usually very high, so on its own it proves little."],
    ["print(\"test accuracy: \", accuracy_score(y_test, model.predict(X_test)))", 6, "<b>The honest score</b>, on 360 images the model never saw. We ran this exact code: train 100%, test <b>97.2%</b>."],
  ];
  const PT = [
    ["import torch", 3, "PyTorch is the most widely used deep-learning library in research " + cite(15) + "."],
    ["from torch import nn", 3, "<code>nn</code> contains building blocks: layers, activations and losses."],
    ["from sklearn.datasets import load_digits", 2, "Same digits dataset as the beginner version."],
    ["from sklearn.model_selection import train_test_split", 2, ""],
    ["", 0, ""],
    ["torch.manual_seed(0)                      # make the random starting weights repeatable", 3, "Weights start random. Fixing the seed makes results reproducible."],
    ["X, y = load_digits(return_X_y=True)", 2, "Features X (1797 × 64) and labels y."],
    ["X = X / 16.0                              # pixel values 0..16  ->  0..1", 2, "Simple scaling. The raw pixels range from 0 to 16."],
    ["X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0, stratify=y)", 2, "80% train, 20% test."],
    ["X_tr = torch.tensor(X_tr, dtype=torch.float32)", 2, "Convert to <b>tensors</b>, PyTorch’s arrays, which can run on a GPU."],
    ["X_te = torch.tensor(X_te, dtype=torch.float32)", 2, ""],
    ["y_tr, y_te = torch.tensor(y_tr), torch.tensor(y_te)", 2, ""],
    ["", 0, ""],
    ["model = nn.Sequential(", 3, "The architecture, written layer by layer, just like HTML elements nested in a page."],
    ["    nn.Linear(64, 64), nn.ReLU(),           # hidden layer: 64 neurons + ReLU squash", 3, "Each of the 64 neurons computes a weighted sum of all 64 pixels plus a bias, then applies ReLU (max(0, z))."],
    ["    nn.Linear(64, 10))                      # output: one score per digit", 3, "10 output scores, one per digit. The biggest score is the prediction."],
    ["", 0, ""],
    ["loss_fn = nn.CrossEntropyLoss()                        # the scorecard", 4, "Cross-entropy: −log(probability given to the correct digit). See Step 4."],
    ["optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)  # how to improve", 5, "Adam " + cite(7) + " is gradient descent with an adaptive step size for each weight. <code>lr</code> is the learning rate η."],
    ["", 0, ""],
    ["for epoch in range(30):                                  # 30 passes over the data", 5, "One <b>epoch</b> = one full pass through the training set."],
    ["    for i in torch.randperm(len(X_tr)).split(32):        # random mini-batches of 32", 5, "Shuffle, then cut into <b>mini-batches</b> of 32 examples."],
    ["        pred = model(X_tr[i])                            # 1. predict (forward pass)", 5, "Beat 1 of the loop: forward pass."],
    ["        loss = loss_fn(pred, y_tr[i])                    # 2. measure the loss", 4, "Beat 2: one number for how wrong this batch was."],
    ["        optimizer.zero_grad()                            #    clear old gradients", 5, "PyTorch adds gradients up, so we reset them each step."],
    ["        loss.backward()                                  # 3. backpropagation", 5, "Beat 3: PyTorch computes the gradient for every one of the 4,810 weights automatically, the same way as Demo 7."],
    ["        optimizer.step()                                 # 4. update every weight", 5, "Beat 4: every weight takes a small step downhill."],
    ["    if epoch % 10 == 0:", 6, "Print progress every 10 epochs. The loss should fall."],
    ["        print(f\"epoch {epoch}: loss {loss.item():.3f}\")", 6, "Our run: epoch 0 → 2.011, epoch 10 → 0.186, epoch 20 → 0.108."],
    ["", 0, ""],
    ["with torch.no_grad():                                    # evaluation: no learning", 6, "Turn off gradient tracking. We are only testing now, not learning."],
    ["    acc = (model(X_te).argmax(dim=1) == y_te).float().mean()", 6, "Pick the highest-scoring digit for each test image and compare it with the truth."],
    ["print(f\"test accuracy: {acc:.1%}\")", 6, "We ran this exact code: <b>96.7%</b> on unseen images. Your number may differ slightly."],
  ];
  const KW = /\b(from|import|for|in|with|print|if|range|len|True|False|None)\b/g;
  function hl(src) {
    let s = src.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    let comment = "";
    const ci = s.indexOf("#");
    if (ci >= 0) { comment = s.slice(ci); s = s.slice(0, ci); }
    s = s.replace(/(f?"[^"]*")/g, "\u0001$1\u0002");
    s = s.split(/(\u0001[^\u0002]*\u0002)/).map((part) => {
      if (part.startsWith("\u0001")) return `<span class="s">${part.slice(1, -1)}</span>`;
      return part.replace(KW, "<b>$1</b>").replace(/\b(\d+(?:\.\d+)?(?:e-?\d+)?)\b/g, "<i>$1</i>");
    }).join("");
    return s + (comment ? `<span class="c">${comment}</span>` : "");
  }
  const codeBox = $("#codeBox"), codeNote = $("#codeNote"), codeRes = $("#codeResult");
  const RESULTS = {
    sk: "▶ Output when we ran it: <code>(1797, 64)</code>, <code>train accuracy: 1.0</code>, <code>test accuracy: 0.972</code>. Training takes a few seconds on a laptop.",
    pt: "▶ Output when we ran it: loss 2.011 → 0.186 → 0.108, <code>test accuracy: 96.7%</code>. Runs in seconds, with no GPU needed for a model this small.",
  };
  function renderCode(which) {
    const L = which === "sk" ? SK : PT;
    codeBox.innerHTML = L.map(([t, s, n], i) =>
      `<span class="ln"${s ? ` data-s="${s}" data-i="${i}"` : ""}><span class="g">${s ? s : ""}</span>${t ? hl(t) : " "}</span>`).join("");
    codeRes.innerHTML = RESULTS[which];
    $$(".ln[data-s]", codeBox).forEach((ln) => {
      const show = () => {
        const [, s, n] = L[+ln.dataset.i];
        $$(".ln", codeBox).forEach((x) => { x.classList.toggle("hl", x.dataset.s === String(s)); x.classList.toggle("dim", x.dataset.s !== String(s)); });
        codeNote.innerHTML = `<span class="stepchip">${STEPS[s]}</span><p>${n || "Part of " + STEPS[s].split(" · ")[1].toLowerCase() + "."}</p>`;
      };
      ln.addEventListener("mouseenter", show);
      ln.addEventListener("click", show);
    });
    codeBox.onmouseleave = () => $$(".ln", codeBox).forEach((x) => x.classList.remove("hl", "dim"));
    codeNote.innerHTML = `<p class="ctl-label">Hover a line</p><p>The grey number at the start of each line is its step in the 7-step process. Hover or tap a line for an explanation.</p>`;
  }
  seg($("#codeTabs"), (b) => renderCode(b.dataset.c));
  renderCode("sk");

  $("#copyPrompt").addEventListener("click", (e) => {
    const t = $("#vibePrompt").textContent, btn = e.currentTarget;
    const done = () => { btn.textContent = "Copied ✓"; setTimeout(() => (btn.textContent = "Copy prompt"), 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, () => fallback());
    else fallback();
    function fallback() { const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (_) {} ta.remove(); }
  });

  // ---------------- Videos ----------------
  const VIDS = [
    ["IHZwWFHWa-w", "3Blue1Brown", "Gradient descent, how neural networks learn", "Beginner", "The clearest visual explanation of the loss landscape and of “walking downhill”. Watch it right after Demo 6.", "Steps 4–5", true],
    ["aircAruvnKk", "3Blue1Brown", "But what is a neural network?", "Beginner", "Neurons, layers, weights and biases, built up from scratch with a digit-recognition example.", "Step 3"],
    ["Ilg3gGewQ5U", "3Blue1Brown", "Backpropagation, intuitively", "Beginner", "How the network decides which weights to blame for an error, without heavy maths.", "Step 5"],
    ["tIeHLnjs5U8", "3Blue1Brown", "Backpropagation calculus", "Intermediate", "The chain-rule maths behind Demo 7. Optional, for those who like calculus.", "Step 5"],
    ["LPZh9BOjkQs", "3Blue1Brown", "Large Language Models explained briefly", "Beginner", "A short overview of how chatbots like ChatGPT and Claude are trained.", "LLM section"],
    ["wjZofJX0v4M", "3Blue1Brown", "Transformers, the tech behind LLMs", "Intermediate", "What happens inside a Transformer as it predicts the next word.", "LLM section"],
    ["zjkBMFhNj_g", "Andrej Karpathy", "[1hr Talk] Intro to Large Language Models", "Beginner", "A former OpenAI and Tesla AI lead explains pre-training, fine-tuning and what LLMs can and cannot do.", "LLM stages 1–3"],
    ["7xTGNNLPyMI", "Andrej Karpathy", "Deep Dive into LLMs like ChatGPT", "In-depth", "A long, thorough, non-technical walkthrough of the full LLM training pipeline, from internet data to RL.", "LLM stages 1–3"],
    ["VMj-3S1tku0", "Andrej Karpathy", "The spelled-out intro to neural networks and backpropagation: building micrograd", "Hands-on code", "Build backpropagation from scratch in Python, line by line. The best next step after Route B " + cite(5) + ".", "Steps 3–5"],
  ];
  $("#videoGrid").innerHTML = VIDS.map(([id, by, title, lvl, desc, step, feat]) => `
    <article class="video${feat ? " feature" : ""}">
      <button class="vframe" data-id="${id}" aria-label="Play video: ${title.replace(/"/g, "")}">
        <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360"><span class="play"></span>
      </button>
      <div class="vmeta">
        <span class="vby">${by} <span class="lvl${lvl === "Hands-on code" ? " hands" : ""}">${lvl}</span>${feat ? '<span class="lvl hands">Start here</span>' : ""}</span>
        <h4>${title}</h4>
        <p>${desc}</p>
        <span class="vstep">Goes with: ${step} · <a href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">open on YouTube ↗</a></span>
      </div>
    </article>`).join("");
  $$(".vframe").forEach((b) => b.addEventListener("click", () => {
    const f = document.createElement("iframe");
    f.src = `https://www.youtube-nocookie.com/embed/${b.dataset.id}?autoplay=1&rel=0`;
    f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    f.allowFullscreen = true;
    f.title = b.getAttribute("aria-label");
    const div = document.createElement("div");
    div.className = "vframe";
    div.appendChild(f);
    b.replaceWith(div);
  }));

  // ---------------- Quiz ----------------
  const QUIZ = [
    ["In machine learning, where do the rules the model uses come from?",
      ["A programmer writes them line by line", "They are learned from data and stored as numbers (weights)", "They are downloaded from the internet"], 1,
      "The programmer writes the <em>learning procedure</em>. The rules themselves are learned weights. That is the key difference from building a website."],
    ["What does the loss measure?",
      ["How fast the model runs", "How many parameters the model has", "How wrong the model’s predictions are, as a single number"], 2,
      "Training is the search for weights that make this number as small as possible."],
    ["You set the learning rate far too high. What typically happens?",
      ["Training is very slow but steady", "The loss bounces around or explodes instead of falling", "The model becomes more accurate"], 1,
      "Each step overshoots the valley. Try the “too big” preset in Demo 6."],
    ["Training accuracy is 99% but test accuracy is 61%. What is the most likely problem?",
      ["Overfitting: it memorised the training data", "Underfitting: the model is too simple", "The test set is too large"], 0,
      "A big gap between training and test performance is the signature of overfitting (Demo 9)."],
    ["What does backpropagation compute?",
      ["The prediction for a new input", "The gradient: how much each weight contributed to the error", "The best architecture for the problem"], 1,
      "It applies the chain rule backwards from the loss to every weight (Demo 7). The optimiser then uses these gradients."],
    ["During pre-training, what task does a large language model learn?",
      ["Predicting the next token in text", "Answering exam questions written by experts", "Copying web pages word for word into memory"], 0,
      "Next-token prediction with cross-entropy loss. Instruction-following and helpfulness come later, from fine-tuning and feedback."],
  ];
  const qb = $("#quizBox"), qs = $("#quizScore");
  let answered = 0, correct = 0;
  qb.innerHTML = QUIZ.map(([q, opts], i) => `
    <div class="qcard" data-i="${i}"><span class="qn">Question ${i + 1} of ${QUIZ.length}</span><h4>${q}</h4>
    ${opts.map((o, j) => `<button class="qopt" data-j="${j}">${o}</button>`).join("")}
    <p class="qexp"></p></div>`).join("");
  $$(".qcard", qb).forEach((card) => {
    const i = +card.dataset.i, [, , ans, exp] = QUIZ[i];
    $$(".qopt", card).forEach((b) => b.addEventListener("click", () => {
      const j = +b.dataset.j, ok = j === ans;
      $$(".qopt", card).forEach((x, k) => { x.disabled = true; if (k === ans) x.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      card.classList.add("done");
      $(".qexp", card).innerHTML = (ok ? "<b>Correct.</b> " : "<b>Not quite.</b> ") + exp;
      answered++; if (ok) correct++;
      qs.textContent = answered === QUIZ.length
        ? `You scored ${correct} / ${QUIZ.length}. ${correct === QUIZ.length ? "Perfect. You know how the AI learns." : correct >= 4 ? "Great work." : "Scroll back to the demos and try again."}`
        : `${correct} / ${answered} correct so far…`;
    }));
  });

  // ---------------- Glossary ----------------
  const GLOSS = [
    ["Parameter / weight", "One adjustable number inside a model. Training finds good values for all of them."],
    ["Bias", "An extra weight added to a neuron’s sum, which shifts its output up or down."],
    ["Feature", "An input variable, e.g. size in m², or one pixel’s brightness."],
    ["Label / target", "The correct answer the model should learn to predict."],
    ["Training set", "The examples the model learns from."],
    ["Validation set", "Held-out examples used while building, to choose settings and detect overfitting."],
    ["Test set", "Examples kept locked away until the very end, for an honest final score."],
    ["Loss function", "Turns the model’s mistakes into a single number to minimise (e.g. MSE, cross-entropy)."],
    ["Gradient", "For each weight, the direction and steepness in which the loss increases."],
    ["Gradient descent", "Repeatedly moving the weights a small step against the gradient, i.e. downhill."],
    ["Learning rate (η)", "How big each gradient-descent step is. Too small is slow, and too big diverges."],
    ["Backpropagation", "An efficient way to compute every weight’s gradient using the chain rule, from output back to input."],
    ["Epoch", "One full pass through the training set."],
    ["Mini-batch", "A small random group of examples used for one update step."],
    ["Optimiser", "The algorithm that updates the weights, such as SGD or Adam."],
    ["Activation function", "The non-linear “squash” inside a neuron (ReLU, tanh, sigmoid). It lets networks learn curves."],
    ["Overfitting", "Memorising the training data, including its noise, so the model does badly on new data."],
    ["Underfitting", "The model is too simple to capture the real pattern."],
    ["Regularisation", "Techniques that discourage overly complex models, such as weight penalties and dropout."],
    ["Hyperparameter", "A setting you choose before training: learning rate, layers, batch size…"],
    ["Inference", "Using a trained model to make predictions."],
    ["Token", "A chunk of text, roughly ¾ of an English word on average, that an LLM reads and predicts."],
    ["Pre-training", "The first, huge training stage of an LLM: next-token prediction on vast amounts of text."],
    ["Fine-tuning", "Further training of a pretrained model on a smaller, specific dataset."],
    ["RLHF", "Reinforcement Learning from Human Feedback: tuning a model towards answers people prefer."],
    ["Transfer learning", "Reusing a model trained on one task as the starting point for another."],
  ];
  const gl = $("#glossList");
  function renderGloss(q) {
    q = (q || "").trim().toLowerCase();
    const hits = GLOSS.filter(([t, d]) => !q || t.toLowerCase().includes(q) || d.toLowerCase().includes(q));
    gl.innerHTML = hits.length ? hits.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("") : `<div class="none">No matching term.</div>`;
  }
  $("#glossSearch").addEventListener("input", (e) => renderGloss(e.target.value));
  renderGloss("");
})();
