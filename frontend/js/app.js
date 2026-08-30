/**
 * AlignCraft Studio Main App Controller & Router
 */

const App = {
  currentTab: "overview",

  async init() {
    this.bindNavigation();
    this.bindModals();
    await this.checkStatus();

    // Initialize all sub-views
    DatasetView.init();
    FineTuneView.init();
    RedTeamView.init();
    EvalsView.init();
    PlaygroundView.init();

    console.log("AlignCraft Studio initialized successfully.");
  },

  bindNavigation() {
    const tabs = document.querySelectorAll(".nav-tab-btn");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const targetView = tab.getAttribute("data-view");
        this.switchTab(targetView);
      });
    });
  },

  switchTab(tabId) {
    this.currentTab = tabId;

    // Update Nav Buttons
    document.querySelectorAll(".nav-tab-btn").forEach(btn => {
      if (btn.getAttribute("data-view") === tabId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update Views
    document.querySelectorAll(".view-section").forEach(sec => {
      if (sec.id === `view-${tabId}`) {
        sec.classList.add("active");
      } else {
        sec.classList.remove("active");
      }
    });

    // View-specific refreshes
    if (tabId === "evals" && EvalsView.currentReport) {
      setTimeout(() => {
        ChartRenderer.renderRadarChart("radar-chart-container", EvalsView.currentReport.radar_chart_data);
      }, 50);
    }
    if (tabId === "finetune" && FineTuneView.lossHistory.length > 0) {
      setTimeout(() => {
        ChartRenderer.renderLossChart("loss-chart-container", FineTuneView.lossHistory);
      }, 50);
    }
  },

  bindModals() {
    // Close modal on click close button or backdrop
    document.querySelectorAll(".modal-close-btn, .modal-backdrop").forEach(el => {
      el.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal-backdrop") || e.target.classList.contains("modal-close-btn")) {
          document.querySelectorAll(".modal-container").forEach(m => m.style.display = "none");
        }
      });
    });
  },

  async checkStatus() {
    try {
      const status = await API.getStatus();
      const modePill = document.getElementById("status-mode-pill");
      if (modePill) {
        if (status.has_gemini_key) {
          modePill.innerHTML = `<span class="status-dot"></span> Live Gemini Mode`;
        } else {
          modePill.innerHTML = `<span class="status-dot"></span> High-Fidelity Simulation Mode`;
        }
      }
    } catch (e) {
      console.warn("Status check warning:", e);
    }
  },

  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const icon = type === "success" ? "✅" : (type === "error" ? "❌" : "ℹ️");
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};

window.addEventListener("DOMContentLoaded", () => {
  App.init();
});
