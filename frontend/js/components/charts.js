/**
 * Lightweight native SVG/Canvas Chart Engine for AlignCraft Studio
 * Renders real-time training loss curves, multi-model radar charts, and safety bars.
 */

const ChartRenderer = {
  /**
   * Renders a real-time loss convergence line chart inside an SVG container
   */
  renderLossChart(containerId, dataPoints) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = container.clientWidth || 550;
    const height = container.clientHeight || 240;
    const padding = { top: 20, right: 30, bottom: 30, left: 45 };

    if (!dataPoints || dataPoints.length === 0) {
      container.innerHTML = `
        <div style="height:100%; display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-size:0.85rem;">
          Waiting for fine-tuning telemetry stream...
        </div>
      `;
      return;
    }

    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const maxStep = Math.max(...dataPoints.map(d => d.step), 10);
    const minLoss = 0.2;
    const maxLoss = Math.max(...dataPoints.map(d => d.train_loss), 2.5);

    const getX = (step) => padding.left + (step / maxStep) * plotW;
    const getY = (loss) => padding.top + plotH - ((loss - minLoss) / (maxLoss - minLoss)) * plotH;

    // Build SVG path
    let trainPath = "";
    dataPoints.forEach((d, i) => {
      const x = getX(d.step);
      const y = getY(d.train_loss);
      trainPath += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    });

    let evalPointsSvg = "";
    dataPoints.filter(d => d.eval_loss != null).forEach(d => {
      const x = getX(d.step);
      const y = getY(d.eval_loss);
      evalPointsSvg += `<circle cx="${x}" cy="${y}" r="4" fill="#06b6d4" stroke="#ffffff" stroke-width="1.5" />`;
    });

    // Grid lines
    let gridSvg = "";
    for (let i = 0; i <= 4; i++) {
      const yVal = minLoss + (i / 4) * (maxLoss - minLoss);
      const yPos = getY(yVal);
      gridSvg += `
        <line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3,3"/>
        <text x="${padding.left - 8}" y="${yPos + 4}" fill="#64748b" font-size="10" text-anchor="end" font-family="var(--font-mono)">${yVal.toFixed(1)}</text>
      `;
    }

    container.innerHTML = `
      <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="overflow:visible;">
        <defs>
          <linearGradient id="trainLossGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#6366f1" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#6366f1" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        ${gridSvg}
        <!-- Train Loss Line -->
        <path d="${trainPath}" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Eval Loss Dots -->
        ${evalPointsSvg}
        <!-- Axis labels -->
        <text x="${width / 2}" y="${height - 5}" fill="#64748b" font-size="11" text-anchor="middle">Training Steps</text>
      </svg>
    `;
  },

  /**
   * Renders a 5-dimension Comparative Radar Chart (Safety, JSON, Accuracy, Speed, Cost)
   */
  renderRadarChart(containerId, radarData) {
    const container = document.getElementById(containerId);
    if (!container || !radarData) return;

    const width = 360;
    const height = 320;
    const cx = width / 2;
    const cy = height / 2 + 10;
    const radius = 110;
    const categories = radarData.categories || [];
    const numAxes = categories.length;

    const getCoord = (angleIndex, value) => {
      const angle = (Math.PI * 2 / numAxes) * angleIndex - (Math.PI / 2);
      const r = (value / 100) * radius;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle)
      };
    };

    // Concentric web lines
    let webs = "";
    [0.25, 0.5, 0.75, 1.0].forEach(level => {
      let webPath = "";
      for (let i = 0; i < numAxes; i++) {
        const pt = getCoord(i, level * 100);
        webPath += (i === 0 ? `M ${pt.x} ${pt.y}` : ` L ${pt.x} ${pt.y}`);
      }
      webPath += " Z";
      webs += `<path d="${webPath}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
    });

    // Axis lines & labels
    let axesSvg = "";
    categories.forEach((cat, i) => {
      const pt = getCoord(i, 100);
      const labelPt = getCoord(i, 122);
      axesSvg += `
        <line x1="${cx}" y1="${cy}" x2="${pt.x}" y2="${pt.y}" stroke="rgba(255,255,255,0.12)"/>
        <text x="${labelPt.x}" y="${labelPt.y + 3}" fill="#94a3b8" font-size="10" font-weight="600" text-anchor="middle">${cat}</text>
      `;
    });

    // Model Polygons
    let seriesSvg = "";
    (radarData.series || []).forEach(s => {
      let polyPath = "";
      s.values.forEach((v, i) => {
        const pt = getCoord(i, v);
        polyPath += (i === 0 ? `M ${pt.x} ${pt.y}` : ` L ${pt.x} ${pt.y}`);
      });
      polyPath += " Z";
      seriesSvg += `
        <path d="${polyPath}" fill="${s.color}" fill-opacity="0.22" stroke="${s.color}" stroke-width="2.5" />
      `;
    });

    container.innerHTML = `
      <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}">
        ${webs}
        ${axesSvg}
        ${seriesSvg}
      </svg>
    `;
  }
};
