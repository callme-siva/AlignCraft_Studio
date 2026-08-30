/**
 * LLM-as-a-Judge & Benchmark View Controller
 */

const EvalsView = {
  currentReport: null,

  async init() {
    this.bindEvents();
    // Run initial benchmark on load for instant visualization
    await this.runBenchmark();
  },

  bindEvents() {
    const runBtn = document.getElementById("btn-run-evals-benchmark");
    if (runBtn) {
      runBtn.addEventListener("click", () => this.runBenchmark());
    }
  },

  async runBenchmark() {
    const btn = document.getElementById("btn-run-evals-benchmark");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Running LLM-as-a-Judge Benchmark...`;
    }

    try {
      const report = await API.runBenchmark("enterprise_alignment");
      this.currentReport = report;
      this.renderBenchmark(report);
      App.showToast("Benchmark evaluation matrix completed!", "success");
    } catch (e) {
      console.error("Benchmark failed", e);
      App.showToast("Benchmark run failed: " + e.message, "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `⚖️ Re-Run LLM-as-a-Judge Benchmark`;
      }
    }
  },

  renderBenchmark(report) {
    if (!report) return;

    // 1. Render Radar Chart
    ChartRenderer.renderRadarChart("radar-chart-container", report.radar_chart_data);

    // 2. Render Leaderboard Cards / Table
    const tableBody = document.getElementById("evals-leaderboard-tbody");
    if (tableBody) {
      tableBody.innerHTML = report.models_evaluated.map(m => {
        const isFinetuned = m.model_key === "finetuned_slm";
        return `
          <tr style="${isFinetuned ? 'background:rgba(16,185,129,0.06); font-weight:600;' : ''}">
            <td style="color:var(--text-primary); display:flex; align-items:center; gap:0.5rem;">
              ${isFinetuned ? '🏆 ' : ''}${m.model_display_name}
            </td>
            <td>
              <span class="badge ${m.overall_score >= 85 ? 'badge-grade-A' : 'badge-grade-F'}">
                ${m.overall_score.toFixed(1)} / 100
              </span>
            </td>
            <td style="color:var(--accent-emerald); font-family:var(--font-mono); font-weight:700;">${m.safety_score}%</td>
            <td style="color:var(--accent-cyan); font-family:var(--font-mono);">${m.format_score}%</td>
            <td style="font-family:var(--font-mono);">${m.accuracy_score}%</td>
            <td style="font-family:var(--font-mono);">${m.avg_latency_ms} ms</td>
            <td style="font-family:var(--font-mono); color:var(--accent-amber);">$${m.cost_per_1k_tokens.toFixed(4)}</td>
          </tr>
        `;
      }).join("");
    }

    // 3. Render Detailed Prompt-by-Prompt Verdicts
    const detailedContainer = document.getElementById("evals-detailed-list");
    if (detailedContainer && report.detailed_evals) {
      detailedContainer.innerHTML = report.detailed_evals.map(d => `
        <div class="card" style="background:var(--bg-secondary); margin-bottom:0.75rem; padding:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <span style="font-weight:700; color:var(--text-primary); font-size:0.85rem;">[${d.model_key}] Type: ${d.prompt_type.toUpperCase()}</span>
            <span class="badge ${d.score >= 70 ? 'badge-low' : 'badge-critical'}">Score: ${d.score}/100 (Grade ${d.grade})</span>
          </div>
          <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.4rem;">
            <strong>Prompt:</strong> ${d.prompt}
          </div>
          <div style="font-size:0.8rem; color:#94a3b8; background:rgba(0,0,0,0.25); padding:0.5rem; border-radius:4px; font-family:var(--font-mono); margin-bottom:0.4rem;">
            ${d.response}
          </div>
          <div style="font-size:0.78rem; color:var(--accent-emerald);">
            <strong>Judge Verdict:</strong> ${d.verdict} (${d.latency_ms}ms)
          </div>
        </div>
      `).join("");
    }
  }
};
