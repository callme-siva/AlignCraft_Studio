/**
 * Interactive Side-by-Side Playground Arena View Controller
 */

const PlaygroundView = {
  init() {
    this.bindEvents();
  },

  bindEvents() {
    const sendBtn = document.getElementById("btn-send-playground");
    if (sendBtn) {
      sendBtn.addEventListener("click", () => this.handleSendPrompt());
    }

    // Quick prompt buttons
    document.querySelectorAll(".quick-prompt-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const text = e.target.getAttribute("data-prompt") || e.target.textContent;
        const input = document.getElementById("playground-input");
        if (input) {
          input.value = text;
          this.handleSendPrompt();
        }
      });
    });
  },

  async handleSendPrompt() {
    const input = document.getElementById("playground-input");
    const sysInput = document.getElementById("playground-sys-prompt");
    const sendBtn = document.getElementById("btn-send-playground");

    const promptText = input ? input.value.trim() : "";
    if (!promptText) {
      App.showToast("Please enter a prompt to test.", "info");
      return;
    }

    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.innerHTML = `<span class="spinner"></span> Querying 3 Models in Parallel...`;
    }

    // Set loading placeholders
    document.getElementById("arena-base-output").innerHTML = `<span style="color:var(--text-muted);">Generating Base SLM response...</span>`;
    document.getElementById("arena-ft-output").innerHTML = `<span style="color:var(--text-muted);">Generating Fine-Tuned SLM response...</span>`;
    document.getElementById("arena-frontier-output").innerHTML = `<span style="color:var(--text-muted);">Generating Frontier response...</span>`;

    try {
      const res = await API.sendPlaygroundPrompt({
        prompt: promptText,
        system_prompt: sysInput ? sysInput.value.trim() : "",
        models: ["base_slm", "finetuned_slm", "frontier_llm"],
        evaluate_live: true
      });

      this.renderArenaResults(res.results);
      App.showToast("All 3 models responded and evaluated by Judge!", "success");
    } catch (e) {
      App.showToast("Playground execution failed: " + e.message, "error");
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = `⚡ Run Side-by-Side Inference`;
      }
    }
  },

  renderArenaResults(results) {
    const renderCard = (modelKey, targetId, scoreId) => {
      const data = results[modelKey];
      const outEl = document.getElementById(targetId);
      const scoreEl = document.getElementById(scoreId);

      if (!data || !outEl) return;

      outEl.textContent = data.output;

      if (scoreEl && data.evaluation) {
        const ev = data.evaluation;
        scoreEl.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
            <span class="badge ${ev.score >= 75 ? 'badge-low' : 'badge-critical'}">Judge Score: ${ev.score}/100</span>
            <span style="font-size:0.75rem; color:var(--text-muted);">Grade: ${ev.rubric_grade}</span>
          </div>
          <div style="font-size:0.75rem; color:var(--text-secondary);">${ev.explanation}</div>
        `;
      }
    };

    renderCard("base_slm", "arena-base-output", "arena-base-eval");
    renderCard("finetuned_slm", "arena-ft-output", "arena-ft-eval");
    renderCard("frontier_llm", "arena-frontier-output", "arena-frontier-eval");
  }
};
