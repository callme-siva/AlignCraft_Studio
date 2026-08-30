/**
 * Dataset Studio View Controller
 */

const DatasetView = {
  currentDatasetId: "structured_extraction",
  samples: [],

  async init() {
    await this.loadSummary();
    await this.loadDataset(this.currentDatasetId);
    this.bindEvents();
  },

  bindEvents() {
    const genBtn = document.getElementById("btn-generate-dataset");
    if (genBtn) {
      genBtn.addEventListener("click", () => this.handleGenerate());
    }

    const exportBtn = document.getElementById("btn-export-dataset");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => this.handleExport());
    }

    const domainSelect = document.getElementById("dataset-domain-select");
    if (domainSelect) {
      domainSelect.addEventListener("change", (e) => {
        this.currentDatasetId = e.target.value;
        this.loadDataset(this.currentDatasetId);
      });
    }
  },

  async loadSummary() {
    try {
      const summary = await API.getDatasetSummary();
      const container = document.getElementById("dataset-summary-cards");
      if (!container) return;

      container.innerHTML = Object.entries(summary).map(([key, data]) => `
        <div class="stat-card" style="cursor:pointer; border-color:${key === this.currentDatasetId ? 'var(--accent-indigo)' : 'var(--border-subtle)'}" onclick="DatasetView.selectDomain('${key}')">
          <div class="stat-label">${data.title}</div>
          <div class="stat-value">${data.sample_count} <span style="font-size:0.9rem; color:var(--text-muted);">samples</span></div>
          <div class="stat-subtext">Avg Quality: ${(data.avg_quality_score * 100).toFixed(0)}% • ${data.total_tokens} tokens</div>
        </div>
      `).join("");
    } catch (e) {
      console.error("Failed to load dataset summary", e);
    }
  },

  selectDomain(domainKey) {
    this.currentDatasetId = domainKey;
    const domainSelect = document.getElementById("dataset-domain-select");
    if (domainSelect) domainSelect.value = domainKey;
    this.loadDataset(domainKey);
    this.loadSummary();
  },

  async loadDataset(id) {
    const listEl = document.getElementById("dataset-samples-list");
    if (listEl) {
      listEl.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--text-muted);">Loading dataset samples...</div>`;
    }

    try {
      const samples = await API.getDataset(id);
      this.samples = samples;
      this.renderSamples(samples);
    } catch (e) {
      if (listEl) {
        listEl.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--accent-rose);">Failed to load samples</div>`;
      }
    }
  },

  renderSamples(samples) {
    const listEl = document.getElementById("dataset-samples-list");
    if (!listEl) return;

    if (samples.length === 0) {
      listEl.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--text-muted);">No samples yet. Click 'Generate Synthetic Pairs' to create data!</div>`;
      return;
    }

    listEl.innerHTML = samples.map((s, idx) => `
      <div class="card" style="margin-bottom:1rem; padding:1.2rem; background:var(--bg-secondary);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <span style="font-weight:700; color:var(--accent-indigo); font-family:var(--font-mono); font-size:0.8rem;">#${idx+1} [ID: ${s.id}]</span>
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <span class="badge badge-low">Quality: ${(s.quality_score * 100).toFixed(0)}%</span>
            <span class="badge" style="background:rgba(255,255,255,0.06); color:var(--text-muted);">${s.tokens} est. tokens</span>
          </div>
        </div>

        <div style="margin-bottom:0.6rem;">
          <div style="font-size:0.75rem; font-weight:600; color:var(--text-muted); text-transform:uppercase;">Instruction:</div>
          <div style="font-size:0.88rem; color:var(--text-primary); margin-top:0.2rem;">${s.instruction}</div>
        </div>

        ${s.input ? `
          <div style="margin-bottom:0.6rem;">
            <div style="font-size:0.75rem; font-weight:600; color:var(--text-muted); text-transform:uppercase;">Input Context:</div>
            <div style="font-size:0.82rem; color:var(--text-secondary); background:rgba(0,0,0,0.25); padding:0.5rem; border-radius:4px; margin-top:0.2rem; font-family:var(--font-mono);">${s.input}</div>
          </div>
        ` : ''}

        <div>
          <div style="font-size:0.75rem; font-weight:600; color:var(--accent-emerald); text-transform:uppercase;">Target Output (Gold Label):</div>
          <pre class="code-container" style="margin-top:0.3rem; max-height:160px;">${s.output}</pre>
        </div>
      </div>
    `).join("");
  },

  async handleGenerate() {
    const btn = document.getElementById("btn-generate-dataset");
    const countInput = document.getElementById("gen-num-samples");
    const customTopicInput = document.getElementById("gen-custom-topic");

    const num = parseInt(countInput ? countInput.value : "5", 10) || 5;
    const topic = customTopicInput ? customTopicInput.value : "";

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Synthesizing Data...`;
    }

    try {
      const res = await API.generateDataset({
        domain: this.currentDatasetId,
        custom_topic: topic,
        num_samples: num,
        filter_low_quality: true
      });

      App.showToast(`Synthesized ${res.generated_count} high-quality training pairs!`, "success");
      await this.loadDataset(this.currentDatasetId);
      await this.loadSummary();
    } catch (e) {
      App.showToast("Failed to generate synthetic data: " + e.message, "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `✨ Synthesize Instruction Pairs`;
      }
    }
  },

  async handleExport() {
    const formatSelect = document.getElementById("export-format-select");
    const fmt = formatSelect ? formatSelect.value : "alpaca";

    try {
      const text = await API.exportDataset(this.currentDatasetId, fmt);
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dataset_${this.currentDatasetId}_${fmt}.jsonl`;
      a.click();
      URL.revokeObjectURL(url);
      App.showToast(`Exported ${this.currentDatasetId} in ${fmt.toUpperCase()} format!`, "success");
    } catch (e) {
      App.showToast("Export failed: " + e.message, "error");
    }
  }
};
