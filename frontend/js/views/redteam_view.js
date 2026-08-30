/**
 * Red-Team Battleground View Controller
 */

const RedTeamView = {
  attacks: [],
  selectedCategory: null,
  activeResults: [],

  async init() {
    await this.loadAttacks();
    this.bindEvents();
  },

  bindEvents() {
    const runAllBtn = document.getElementById("btn-run-redteam-suite");
    if (runAllBtn) {
      runAllBtn.addEventListener("click", () => this.handleRunSuite());
    }

    const catFilter = document.getElementById("redteam-cat-filter");
    if (catFilter) {
      catFilter.addEventListener("change", (e) => {
        this.selectedCategory = e.target.value || null;
        this.loadAttacks(this.selectedCategory);
      });
    }
  },

  async loadAttacks(category = null) {
    try {
      this.attacks = await API.getAttacks(category);
      this.renderAttackCards(this.attacks);
    } catch (e) {
      console.error("Failed to load attacks", e);
    }
  },

  renderAttackCards(attacks) {
    const container = document.getElementById("redteam-attacks-grid");
    if (!container) return;

    if (attacks.length === 0) {
      container.innerHTML = `<div style="color:var(--text-muted); padding:2rem; text-align:center;">No attack vectors in this category.</div>`;
      return;
    }

    container.innerHTML = attacks.map(a => `
      <div class="card" style="background:var(--bg-secondary); margin-bottom:1rem; padding:1.25rem;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
          <div>
            <div style="font-weight:700; font-size:0.95rem; color:var(--text-primary); display:flex; align-items:center; gap:0.5rem;">
              ${a.title}
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono); margin-top:0.2rem;">ID: ${a.id}</div>
          </div>
          <div style="display:flex; gap:0.4rem;">
            <span class="badge badge-${a.severity}">${a.severity}</span>
            <span class="badge" style="background:rgba(99,102,241,0.15); color:var(--accent-indigo);">${a.category.replace('_', ' ')}</span>
          </div>
        </div>

        <div style="margin-bottom:0.6rem;">
          <div style="font-size:0.72rem; font-weight:600; color:var(--text-muted); text-transform:uppercase;">Adversarial Prompt Payload:</div>
          <div style="font-size:0.82rem; color:#fca5a5; background:rgba(244,63,94,0.06); padding:0.6rem; border-radius:4px; border-left:3px solid var(--accent-rose); font-family:var(--font-mono); margin-top:0.25rem;">
            ${a.prompt}
          </div>
        </div>

        ${a.context ? `
          <div style="margin-bottom:0.6rem;">
            <div style="font-size:0.72rem; font-weight:600; color:var(--text-muted); text-transform:uppercase;">Injected Context Data:</div>
            <div style="font-size:0.8rem; color:var(--text-secondary); background:rgba(0,0,0,0.3); padding:0.5rem; border-radius:4px; font-family:var(--font-mono); margin-top:0.25rem;">${a.context}</div>
          </div>
        ` : ''}

        <div style="margin-bottom:0.85rem;">
          <div style="font-size:0.72rem; font-weight:600; color:var(--accent-emerald); text-transform:uppercase;">Target Safe Defense:</div>
          <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.2rem;">${a.expected_safe_behavior}</div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:0.5rem; border-top:1px solid var(--border-subtle); padding-top:0.75rem;">
          <button class="btn btn-sm" onclick="RedTeamView.testSingle('${a.id}', 'base_slm')">Test vs Base SLM</button>
          <button class="btn btn-sm btn-primary" onclick="RedTeamView.testSingle('${a.id}', 'finetuned_slm')">🛡️ Test vs Fine-Tuned</button>
        </div>
      </div>
    `).join("");
  },

  async testSingle(attackId, modelKey) {
    App.showToast(`Fuzzing ${attackId} against ${modelKey}...`, "info");
    try {
      const res = await API.testSingleAttack(attackId, modelKey, false);
      this.showResultModal(res);
    } catch (e) {
      App.showToast("Test failed: " + e.message, "error");
    }
  },

  async handleRunSuite() {
    const btn = document.getElementById("btn-run-redteam-suite");
    const resultsContainer = document.getElementById("redteam-results-container");

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Fuzzing Adversarial Attacks...`;
    }

    try {
      const res = await API.runRedTeamSuite({
        target_models: ["base_slm", "finetuned_slm", "frontier_llm"],
        include_mutations: false
      });

      this.activeResults = res.results;
      this.renderScorecard(res.scorecard);
      this.renderResultsTable(res.results);
      App.showToast(`Executed ${res.total_tests} adversarial tests! Scorecards generated.`, "success");
    } catch (e) {
      App.showToast("Red-team suite failed: " + e.message, "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `⚔️ Run Full Red-Team Attack Matrix`;
      }
    }
  },

  renderScorecard(scorecard) {
    const container = document.getElementById("redteam-scorecards-grid");
    if (!container || !scorecard) return;

    const getDisplayName = (key) => {
      if (key === "base_slm") return "Base SLM (Pretrained)";
      if (key === "finetuned_slm") return "Fine-Tuned SLM (AlignCraft)";
      return "Frontier Model (Gemini)";
    };

    container.innerHTML = Object.entries(scorecard).map(([modelKey, sc]) => {
      const isBase = modelKey === "base_slm";
      const passRate = sc.safety_pass_rate;
      const pillClass = passRate >= 80 ? "badge-low" : (passRate >= 50 ? "badge-high" : "badge-critical");

      return `
        <div class="card" style="background:var(--bg-secondary); border-top: 3px solid ${isBase ? 'var(--accent-rose)' : 'var(--accent-emerald)'}">
          <div style="font-size:0.8rem; font-weight:700; color:var(--text-muted); text-transform:uppercase;">${getDisplayName(modelKey)}</div>
          <div style="font-size:2rem; font-weight:800; font-family:var(--font-mono); margin:0.35rem 0; color:${passRate >= 80 ? 'var(--accent-emerald)' : (passRate >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)')}">
            ${passRate}% <span style="font-size:0.85rem; font-weight:500; color:var(--text-muted);">Defended</span>
          </div>
          <div style="font-size:0.8rem; color:var(--text-secondary); display:flex; justify-content:space-between; margin-bottom:0.5rem;">
            <span>Blocked: <strong>${sc.attacks_blocked}</strong> / ${sc.total_attacks}</span>
            <span style="color:var(--accent-rose);">Bypassed: <strong>${sc.attacks_bypassed}</strong></span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width:${passRate}%; background:${passRate >= 80 ? 'var(--grad-safe)' : 'var(--grad-danger)'}"></div>
          </div>
        </div>
      `;
    }).join("");
  },

  renderResultsTable(results) {
    const tbody = document.getElementById("redteam-results-tbody");
    if (!tbody) return;

    tbody.innerHTML = results.map(r => `
      <tr>
        <td style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-muted);">${r.attack_id}</td>
        <td>
          <div style="font-weight:600; color:var(--text-primary);">${r.attack_title}</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">${r.category}</div>
        </td>
        <td><span class="badge badge-${r.severity}">${r.severity}</span></td>
        <td style="font-family:var(--font-mono); font-size:0.8rem; font-weight:600; color:${r.model_name === 'finetuned_slm' ? 'var(--accent-emerald)' : (r.model_name === 'base_slm' ? 'var(--accent-rose)' : 'var(--accent-cyan)')}">
          ${r.model_name}
        </td>
        <td>
          ${r.bypassed 
            ? `<span class="badge badge-critical">🚨 EXPLOITED (Bypassed)</span>` 
            : `<span class="badge badge-low">🛡️ DEFENDED (Refused)</span>`}
        </td>
        <td style="font-size:0.78rem; color:var(--text-secondary); max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          ${r.judge_reasoning}
        </td>
        <td>
          <button class="btn btn-sm" onclick="RedTeamView.showResultModalByIndex('${results.indexOf(r)}')">Inspect</button>
        </td>
      </tr>
    `).join("");
  },

  showResultModalByIndex(index) {
    const r = this.activeResults[index];
    if (r) this.showResultModal(r);
  },

  showResultModal(result) {
    const modal = document.getElementById("redteam-inspect-modal");
    if (!modal) return;

    document.getElementById("modal-inspect-title").textContent = `${result.attack_title} (${result.model_name})`;
    document.getElementById("modal-inspect-prompt").textContent = result.prompt_tested;
    document.getElementById("modal-inspect-response").textContent = result.model_response;
    document.getElementById("modal-inspect-verdict").textContent = result.judge_reasoning;
    
    const statusBadge = document.getElementById("modal-inspect-status");
    if (statusBadge) {
      statusBadge.className = result.bypassed ? "badge badge-critical" : "badge badge-low";
      statusBadge.textContent = result.bypassed ? "🚨 VULNERABILITY EXPLOITED" : "🛡️ SAFELY DEFENDED";
    }

    modal.style.display = "flex";
  }
};
