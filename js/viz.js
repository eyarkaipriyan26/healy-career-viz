// viz.js
let isDark = true;
let currentFormat = 't20';
let charts = {};

function init() {
  console.log('Data loaded:', window.HEALY_DATA);
  renderTimeline('t20');
  renderEraComparison('t20');
}

function toggleTheme() {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.getElementById('toggleIcon').textContent = isDark ? '☀' : '☾';
  document.getElementById('toggleLabel').textContent = isDark ? 'Light mode' : 'Dark mode';
  
  // Rebuild all visible charts
  if (charts.timeline) renderTimeline(currentFormat);
  if (charts.era) renderEraComparison(currentFormat);
}

function chartColors() {
  return isDark
    ? { grid: 'rgba(255,255,255,0.05)', tick: '#6b6b72', bg: '#16171d' }
    : { grid: 'rgba(0,0,0,0.06)', tick: '#888780', bg: '#ffffff' };
}

// SWITCH FUNCTIONS
function switchFormat(format, btn) {
  currentFormat = format;
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTimeline(format);
}

function switchEraFormat(format, btn) {
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderEraComparison(format);
}

// 1. CAREER TIMELINE
function renderTimeline(format) {
  const data = window.HEALY_DATA.career_timeline[format];
  const c = chartColors();
  
  if (charts.timeline) charts.timeline.destroy();
  
  charts.timeline = new Chart(document.getElementById('timelineChart'), {
    type: 'line',
    data: {
      labels: data.map(d => d.year),
      datasets: [
        {
          label: 'Strike Rate',
          data: data.map(d => d.sr),
          borderColor: '#D4A853',
          backgroundColor: 'rgba(212, 168, 83, 0.1)',
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: '#D4A853',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Runs',
          data: data.map(d => d.runs),
          borderColor: '#5B9BD5',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#5B9BD5',
          tension: 0.3,
          yAxisID: 'y1',
          fill: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: c.tick,
            font: { family: "'DM Mono', monospace", size: 12 }
          }
        },
        tooltip: {
          backgroundColor: c.bg,
          titleColor: '#D4A853',
          bodyColor: c.tick,
          borderColor: '#D4A853',
          borderWidth: 1,
          padding: 12,
          titleFont: { family: "'Syne', sans-serif", weight: '700', size: 13 },
          bodyFont: { family: "'DM Mono', monospace", size: 12 },
          callbacks: {
            title: items => `${items[0].label}`,
            afterBody: items => {
              const idx = items[0].dataIndex;
              const d = data[idx];
              return [`Innings: ${d.innings}`, `Average: ${d.avg}`];
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: c.tick, font: { family: "'DM Mono', monospace" } },
          grid: { color: c.grid },
          border: { color: c.grid },
        },
        y: {
          title: { display: true, text: 'Strike Rate', color: c.tick },
          ticks: { color: c.tick, font: { family: "'DM Mono', monospace" } },
          grid: { color: c.grid },
          border: { color: c.grid },
        },
        y1: {
          position: 'right',
          title: { display: true, text: 'Runs', color: c.tick },
          ticks: { color: c.tick, font: { family: "'DM Mono', monospace" } },
          grid: { display: false },
        }
      }
    }
  });
}

// 2. ERA COMPARISON
function renderEraComparison(format) {
  const eraData = window.HEALY_DATA.era_comparison[format];
  const c = chartColors();
  
  // Calculate era average SR per year
  const years = Object.keys(eraData).sort();
  const healySR = [];
  const eraSR = [];
  
  years.forEach(year => {
    const top10 = eraData[year];
    const healyEntry = top10.find(p => p.is_healy);
    const avgSR = top10.reduce((sum, p) => sum + p.sr, 0) / top10.length;
    
    healySR.push(healyEntry ? healyEntry.sr : null);
    eraSR.push(avgSR);
  });
  
  if (charts.era) charts.era.destroy();
  
  charts.era = new Chart(document.getElementById('eraChart'), {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Healy SR',
          data: healySR,
          borderColor: '#D4A853',
          backgroundColor: 'rgba(212, 168, 83, 0.2)',
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: '#D4A853',
          tension: 0.3,
          fill: '+1',
        },
        {
          label: 'Top 10 Avg SR',
          data: eraSR,
          borderColor: '#6b6b72',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 3,
          pointBackgroundColor: '#6b6b72',
          tension: 0.3,
          fill: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: c.tick,
            font: { family: "'DM Mono', monospace", size: 12 }
          }
        },
        tooltip: {
          backgroundColor: c.bg,
          titleColor: '#D4A853',
          bodyColor: c.tick,
          borderColor: '#D4A853',
          borderWidth: 1,
          padding: 12,
        }
      },
      scales: {
        x: {
          ticks: { color: c.tick, font: { family: "'DM Mono', monospace" } },
          grid: { color: c.grid },
        },
        y: {
          title: { display: true, text: 'Strike Rate', color: c.tick },
          ticks: { color: c.tick, font: { family: "'DM Mono', monospace" } },
          grid: { color: c.grid },
        }
      }
    }
  });
}
