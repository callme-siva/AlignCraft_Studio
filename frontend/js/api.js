/**
 * API Client for AlignCraft Studio
 */

const API = {
  baseUrl: window.location.origin,

  async getStatus() {
    const res = await fetch(`${this.baseUrl}/api/status`);
    return res.json();
  },

  // Dataset Endpoints
  async getDatasetSummary() {
    const res = await fetch(`${this.baseUrl}/api/dataset/summary`);
    return res.json();
  },

  async getDataset(id) {
    const res = await fetch(`${this.baseUrl}/api/dataset/${id}`);
    return res.json();
  },

  async generateDataset(req) {
    const res = await fetch(`${this.baseUrl}/api/dataset/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req)
    });
    return res.json();
  },

  async exportDataset(id, format) {
    const res = await fetch(`${this.baseUrl}/api/dataset/export/${id}?format=${format}`);
    return res.text();
  },

  // Fine-Tuning Endpoints
  async getSupportedSLMs() {
    const res = await fetch(`${this.baseUrl}/api/finetune/models`);
    return res.json();
  },

  async launchFineTune(config) {
    const res = await fetch(`${this.baseUrl}/api/finetune/launch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    return res.json();
  },

  connectTrainingStream(jobId, onMetric, onComplete, onError) {
    const evtSource = new EventSource(`${this.baseUrl}/api/finetune/stream/${jobId}`);

    evtSource.addEventListener("metric", (e) => {
      const data = JSON.parse(e.data);
      if (onMetric) onMetric(data);
    });

    evtSource.addEventListener("completed", (e) => {
      const data = JSON.parse(e.data);
      if (onComplete) onComplete(data);
      evtSource.close();
    });

    evtSource.onerror = (err) => {
      if (onError) onError(err);
      evtSource.close();
    };

    return evtSource;
  },

  async exportOllamaModelfile(config) {
    const res = await fetch(`${this.baseUrl}/api/finetune/export/ollama-modelfile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    return res.json();
  },

  async exportQLoRAScript(config) {
    const res = await fetch(`${this.baseUrl}/api/finetune/export/qlora-script`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    return res.json();
  },

  // Red-Teaming Endpoints
  async getAttacks(category) {
    const url = category ? `${this.baseUrl}/api/redteam/attacks?category=${category}` : `${this.baseUrl}/api/redteam/attacks`;
    const res = await fetch(url);
    return res.json();
  },

  async runRedTeamSuite(req) {
    const res = await fetch(`${this.baseUrl}/api/redteam/run-suite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req)
    });
    return res.json();
  },

  async testSingleAttack(attackId, model, mutate) {
    const res = await fetch(`${this.baseUrl}/api/redteam/test-single?attack_id=${attackId}&model=${model}&mutate=${mutate}`, {
      method: "POST"
    });
    return res.json();
  },

  // Evaluation & Benchmark Endpoints
  async runBenchmark(domain = "enterprise_alignment") {
    const res = await fetch(`${this.baseUrl}/api/evals/run-benchmark?domain=${domain}`, {
      method: "POST"
    });
    return res.json();
  },

  // Playground
  async sendPlaygroundPrompt(req) {
    const res = await fetch(`${this.baseUrl}/api/playground/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req)
    });
    return res.json();
  }
};
