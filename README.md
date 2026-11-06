# How the AI Learns: the technical version

An interactive, single-page guide to **how machine learning is actually carried out**, step by step. It was written as an extra report for Week 1 (“How the AI learns”).

**Live site:** https://pasbean61.github.io/how-ai-learns/

## What's inside

- **The analogy:** building a website (HTML → CSS → GitHub Pages, or vibe coding) vs. training a model.
- **The core loop:** predict → measure loss → compute gradient → update weights.
- **The 7 steps of a real ML project:** frame the problem, prepare data, choose a model, define the loss, train, evaluate, deploy.
- **11 live demos that really compute in the browser:** problem types, features and labels, train/val/test split, a hand-tuned neuron, “you are the optimiser”, live gradient descent on a loss landscape, a step-by-step backpropagation graph, a neural-network lab (backprop and Adam from scratch), overfitting, a confusion matrix, and a tiny bigram language model.
- **How LLMs like ChatGPT and Claude learn:** pre-training, fine-tuning, RLHF and Constitutional AI.
- **Three do-it-yourself routes:** no-code (Teachable Machine), Python in Colab (scikit-learn / PyTorch, with line-by-line annotations; both scripts were run and their real outputs are shown), and vibe coding with Claude.
- **9 curated videos** (3Blue1Brown, Andrej Karpathy), a quiz, a glossary and **28 references**.

## Tech

Plain HTML, CSS and JavaScript with no build step and no dependencies (except Google Fonts). All demos run locally in the browser. YouTube videos load only when you press play (`youtube-nocookie.com`).

```
index.html        page structure and text
styles.css        design
js/core.js        helpers, navigation, scroll progress
js/content.js     analogy, cards, code walkthrough, videos, quiz, glossary, references
js/demos-*.js     the interactive demos
```

To run locally: `python3 -m http.server` in this folder, then open http://localhost:8000.
