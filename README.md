# ⚡ AlignCraft Studio

<div align="center">

### The Production-Grade SLM Fine-Tuning (QLoRA), Automated Red-Teaming & LLM-as-a-Judge Evaluation Studio

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status](https://img.shields.io/badge/Zero--Key%20Ready-Yes-emerald.svg)](#)

</div>

---

## 🌟 Overview

**AlignCraft Studio** is a unified, full-stack open-source platform that teaches and operationalizes the entire **Small Language Model (SLM) Alignment Lifecycle**:
1. **📝 Dataset Studio**: Synthesize high-density instruction datasets, apply automated quality filtering, and export to Alpaca, ShareGPT, or ChatML formats.
2. **⚡ QLoRA Fine-Tuning Control Room**: Configure LoRA rank $r$, $\alpha$, 4-bit NF4 quantization, and target projection modules with real-time SSE training loss streaming.
3. **🛡️ Red-Team Battleground**: Stress-test base vs. aligned models with an automated adversarial fuzzer running 25+ attack vectors (DAN jailbreaks, indirect prompt injection, system leakage, sycophancy).
4. **⚖️ LLM-as-a-Judge Evaluation & Leaderboard**: Benchmark models side-by-side on calibrated rubrics (Safety, Format Compliance, Accuracy, Speed, Cost) rendered on dynamic 5-axis Radar Charts.
5. **🧪 Side-by-Side Model Arena**: Test custom prompts and jailbreak probes across Base SLMs, Fine-Tuned SLMs, and Frontier LLMs simultaneously with live judge verdicts.

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/align-studio.git
cd align-studio/backend
pip install -r requirements.txt
```

### 2. Configure Environment (Optional)
```bash
cp .env.example .env
# Add GEMINI_API_KEY or OPENAI_API_KEY if desired.
# If omitted, AlignCraft Studio runs in high-fidelity zero-key simulation mode!
```

### 3. Launch the Studio Server
```bash
python3 run.py
```
Open your browser at **`http://127.0.0.1:8000`** to access the interactive web application.

---

## 📊 Features & Capabilities

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ALIGNCRAFT STUDIO PIPELINE                      │
├───────────────────┬───────────────────┬────────────────────────────────┤
│  Dataset Studio   │   QLoRA Training  │    Red-Teaming & Evals         │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ • Synthetic Pairs │ • LoRA (r, alpha) │ • 25+ Adversarial Attacks      │
│ • Quality Filters │ • 4-bit NF4 Quant │ • Automated Fuzzer Mutations   │
│ • Alpaca / ChatML │ • Live Loss (SSE) │ • LLM-as-a-Judge Rubrics       │
│ • Format Exporter │ • Ollama Export   │ • 5-Axis Performance Radar     │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

* **Zero-API-Key Out-of-the-Box Ready**: Comes with high-fidelity mock providers and pre-loaded attack suites so anyone can learn without GPU clusters or paid keys.
* **Production Deployment Scripts**: Automatically generates Ollama `Modelfile` and standalone PyTorch/HuggingFace `SFTTrainer` scripts with one click.
* **Modern Dark Glassmorphic UI**: High-density visual interface with native SVG charts, responsive layouts, and zero heavy chart dependencies.

---

## 📚 Deep Dive Educational Guides

Check out our in-depth guides in the [`docs/`](docs/) directory:
* [⚡ Complete Fine-Tuning Guide (LoRA & QLoRA Mechanics)](docs/FINE_TUNING_GUIDE.md)
* [🛡️ Automated Red-Teaming & Attack Taxonomy](docs/RED_TEAMING_GUIDE.md)
* [⚖️ LLM-as-a-Judge Evaluation Methodology](docs/EVALS_METHODOLOGY.md)
* [🏗️ System Architecture & Data Flow](docs/ARCHITECTURE.md)

---

## 🔒 Security & Threat Model

AlignCraft Studio is built with defense-in-depth principles:
* No API keys or credentials exposed in client-side bundles.
* Strict input validation with Pydantic schemas.
* Safe mock isolation for zero-privilege simulation.
* See [SECURITY.md](SECURITY.md) for full security policy.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
