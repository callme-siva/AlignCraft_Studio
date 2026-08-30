/**
 * Fine-Tuning Control Room View Controller
 */

const FineTuneView = {
  activeJobId: null,
  streamSource: null,
  lossHistory: [],

  async init() {
    await this.loadModels();
    this.bindEvents();
    ChartRenderer.renderLossChart("loss-chart-container", []);
  },

  bindEvents() {
    const launchBtn = document.getElementById("btn-launch-finetune");
    if (launchBtn) {
      launchBtn.addEventListener("click", () => this.handleLaunch());
    }

    const modelfileBtn = document.getElementById("btn-view-modelfile");
    if (modelfileBtn) {
      modelfileBtn.addEventListener("click", () => this.handleViewModelfile());
    }

    const scriptBtn = document.getElementById("btn-view-script");
    if (scriptBtn) {
      scriptBtn.addEventListener("click", () => this.handleViewScript());
    }
  },

  async loadModels() {
    try {
      const models = await API.getSupportedSLMs();
      const select = document.getElementById("ft-base-model-select");
      if (!select) return;

      select.innerHTML = Object.entries(models).map(([key, data]) => `
        <option value="${key}">${data.name} (${data.params}) — Context: ${data.context_window} tokens</option>
      `).join("");
    } catch (e) {
      console.error("Failed to load models", e);
    }
  },

  getConfigFromForm() {
    return {
      run_name: document.getElementById("ft-run-name")?.value || "slm-alignment-run-1",
      base_model: document.getElementById("ft-base-model-select")?.value || "meta-llama/Llama-3.2-1B-Instruct",
      dataset_id: DatasetView.currentDatasetId || "structured_extraction",
      lora_r: parseInt(document.getElementById("ft-lora-r")?.value || "16", 10),
      lora_alpha: parseInt(document.getElementById("ft-lora-alpha")?.value || "32", 10),
      lora_dropout: parseFloat(document.getElementById("ft-lora-dropout")?.value || "0.05"),
      quantization: document.getElementById("ft-quantization")?.value || "4bit",
      learning_rate: parseFloat(document.getElementById("ft-lr")?.value || "0.0002"),
      epochs: parseInt(document.getElementById("ft-epochs")?.value || "3", 10),
      batch_size: parseInt(document.getElementById("ft-batch-size")?.value || "4", 10),
      gradient_accumulation_steps: 4,
      warmup_ratio: 0.03,
      lr_scheduler: "cosine",
      max_seq_length: 1024
    };
  },

  async handleLaunch() {
    const config = this.getConfigFromForm();
    const btn = document.getElementById("btn-launch-finetune");
    const logBox = document.getElementById("ft-log-terminal");

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Fine-Tuning Active...`;
    }

    if (logBox) {
      logBox.innerHTML = `[00:00.00] 🚀 Initializing QLoRA Supervised Fine-Tuning...\n[00:00.50] Loading ${config.base_model} in ${config.quantization} precision...\n`;
    }

    this.lossHistory = [];
    ChartRenderer.renderLossChart("loss-chart-container", []);

    try {
      const res = await API.launchFineTune(config);
      this.activeJobId = res.job_id;
      App.showToast(`Fine-tuning launched (${res.job_id})! Streaming telemetry...`, "info");

      // Connect SSE
      this.streamSource = API.connectTrainingStream(
        res.job_id,
        (metric) => this.onMetricReceived(metric),
        (completeData) => this.onTrainingCompleted(completeData),
        (err) => {
          console.error("Stream error", err);
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = `🚀 Launch QLoRA Fine-Tuning`;
          }
        }
      );
    } catch (e) {
      App.showToast("Failed to launch job: " + e.message, "error");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `🚀 Launch QLoRA Fine-Tuning`;
      }
    }
  },

  onMetricReceived(metric) {
    this.lossHistory.push(metric);
    ChartRenderer.renderLossChart("loss-chart-container", this.lossHistory);

    // Update Telemetry widgets
    const stepEl = document.getElementById("metric-current-step");
    const lossEl = document.getElementById("metric-train-loss");
    const pplEl = document.getElementById("metric-perplexity");
    const lrEl = document.getElementById("metric-learning-rate");
    const progressBar = document.getElementById("ft-progress-bar-fill");

    if (stepEl) stepEl.textContent = `${metric.step}/${metric.total_steps}`;
    if (lossEl) lossEl.textContent = metric.train_loss.toFixed(4);
    if (pplEl) pplEl.textContent = metric.perplexity.toFixed(2);
    if (lrEl) lrEl.textContent = metric.learning_rate.toExponential(2);
    if (progressBar) progressBar.style.width = `${(metric.step / metric.total_steps) * 100}%`;

    // Append to log terminal
    const logBox = document.getElementById("ft-log-terminal");
    if (logBox) {
      const evalText = metric.eval_loss != null ? ` | eval_loss: ${metric.eval_loss.toFixed(4)}` : "";
      logBox.innerHTML += `[Step ${metric.step.toString().padStart(3, '0')}/${metric.total_steps}] epoch: ${metric.epoch.toFixed(2)} | loss: ${metric.train_loss.toFixed(4)}${evalText} | lr: ${metric.learning_rate.toExponential(2)} | gnorm: ${metric.grad_norm}\n`;
      logBox.scrollTop = logBox.scrollHeight;
    }
  },

  onTrainingCompleted(completeData) {
    const btn = document.getElementById("btn-launch-finetune");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `🚀 Launch QLoRA Fine-Tuning`;
    }

    const logBox = document.getElementById("ft-log-terminal");
    if (logBox) {
      logBox.innerHTML += `\n=======================================================\n${completeData.message}\nAdapter path: ${completeData.adapter_path}\nFinal Perplexity: ${completeData.final_perplexity}\n=======================================================\n`;
      logBox.scrollTop = logBox.scrollHeight;
    }

    App.showToast("Fine-Tuning completed successfully! Model aligned and ready for Red-Teaming & Evals.", "success");
  },

  async handleViewModelfile() {
    const config = this.getConfigFromForm();
    try {
      const res = await API.exportOllamaModelfile(config);
      this.showModal("Ollama Modelfile (Local Deployment)", res.modelfile);
    } catch (e) {
      App.showToast("Failed to generate Modelfile: " + e.message, "error");
    }
  },

  async handleViewScript() {
    const config = this.getConfigFromForm();
    try {
      const res = await API.exportQLoRAScript(config);
      this.showModal("PyTorch & HuggingFace QLoRA SFT Script", res.script);
    } catch (e) {
      App.showToast("Failed to generate script: " + e.message, "error");
    }
  },

  showModal(title, code) {
    const modal = document.getElementById("generic-code-modal");
    const titleEl = document.getElementById("generic-modal-title");
    const codeEl = document.getElementById("generic-modal-code");
    if (modal && titleEl && codeEl) {
      titleEl.textContent = title;
      codeEl.textContent = code;
      modal.style.display = "flex";
    }
  }
};
