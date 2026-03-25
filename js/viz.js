// viz.js
let isDark = true;
let currentFormat = 't20';
let charts = {};

function init() {
  console.log('Data loaded:', window.HEALY_DATA);
  renderTimeline('t20');
  renderEraComparison('t20');
  renderScatter();
  renderKeeperComparison('t20');
  renderPowerplay('t20');
  renderPeakInnings();
  renderTable();
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

/* 3 SCATTER */
function renderScatter() {
  const data = window.HEALY_DATA.career_timeline.t20;

  charts.scatter = new Chart(document.getElementById('scatterChart'), {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Seasons',
        data: data.map(d => ({ x: d.runs, y: d.sr })),
        backgroundColor: 'gold'
      }]
    }
  });
}

/* 4 KEEPER */
function renderKeeperComparison(format) {
  const data = window.HEALY_DATA.era_comparison[format];
  const years = Object.keys(data).sort();

  const healy = [];
  const others = [];

  years.forEach(y => {
    const players = data[y];

    const h = players.find(p => p.is_healy);
    const avg = players.reduce((s,p)=>s+p.sr,0)/players.length;

    healy.push(h ? h.sr : null);
    others.push(avg);
  });

  charts.keeper = new Chart(document.getElementById('keeperChart'), {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        { label: 'Healy', data: healy, borderColor: '#FFCD00' },
        { label: 'Others avg', data: others, borderColor: '#888' }
      ]
    }
  });
}

/* 5 POWERPLAY */
function renderPowerplay() {
  const data = window.HEALY_DATA.powerplay_stats.t20;

  charts.pp = new Chart(document.getElementById('ppChart'), {
    type: 'bar',
    data: {
      labels: data.map(d => d.year),
      datasets: [
        { label: 'PP', data: data.map(d => d.pp_sr), backgroundColor: 'gold' },
        { label: 'Non PP', data: data.map(d => d.non_pp_sr), backgroundColor: 'blue' }
      ]
    }
  });
}

/* 6 PEAK */
function renderPeakInnings() {
  const peaks = window.HEALY_DATA.peak_innings.t20;
  const container = document.getElementById('peakContainer');

  container.innerHTML = peaks.map(p => `
    <div class="card">
      <b>${p.runs} (${p.balls})</b>
      <div>SR: ${p.sr}</div>
      <div>${p.opponent}</div>
    </div>
  `).join('');
}

/* 7 TABLE */
function renderTable() {
  const container = document.getElementById('tableContainer');

  if (!window.HEALY_DATA?.career_timeline?.t20) {
    container.innerHTML = "No table data available";
    return;
  }

  const data = window.HEALY_DATA.career_timeline.t20;

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Year</th>
          <th>Runs</th>
          <th>SR</th>
          <th>Avg</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(d => `
          <tr>
            <td>${d.year}</td>
            <td>${d.runs}</td>
            <td>${d.sr}</td>
            <td>${d.avg}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}