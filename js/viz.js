// viz.js - Complete Healy Birthday Viz
let isDark = true;
let charts = {};

function init() {
  console.log('Data loaded:', window.HEALY_DATA);
  renderTimeline('t20');
  renderEraComparison('t20');
  renderScatter('t20');
  renderKeeperComparison('t20');
  renderPowerplay('t20');
  renderPeakInnings('t20');
  renderTable('t20');
}

function toggleTheme() {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.getElementById('toggleIcon').textContent = isDark ? '☀' : '☾';
  document.getElementById('toggleLabel').textContent = isDark ? 'Light mode' : 'Dark mode';
  
  // Rebuild all charts
  Object.keys(charts).forEach(key => {
    if (charts[key] && typeof charts[key].destroy === 'function') {
      charts[key].destroy();
    }
  });
  
  // Re-render with appropriate formats
  renderTimeline(document.querySelector('#timelineSection .toggle-btn.active')?.dataset.format || 't20');
  renderEraComparison(document.querySelector('#eraSection .toggle-btn.active')?.dataset.format || 't20');
  renderScatter(document.querySelector('#scatterSection .toggle-btn.active')?.dataset.format || 't20');
  renderKeeperComparison(document.querySelector('#keeperSection .toggle-btn.active')?.dataset.format || 't20');
  renderPowerplay(document.querySelector('#ppSection .toggle-btn.active')?.dataset.format || 't20');
  renderPeakInnings(document.querySelector('#peakSection .toggle-btn.active')?.dataset.format || 't20');
  renderTable(document.querySelector('#tableSection .toggle-btn.active')?.dataset.format || 't20');
}

function chartColors() {
  return isDark
    ? { grid: 'rgba(255,255,255,0.05)', tick: '#6b6b72', bg: '#16171d' }
    : { grid: 'rgba(0,0,0,0.06)', tick: '#888780', bg: '#ffffff' };
}

// SWITCH FUNCTIONS
function switchFormat(format, btn, section) {
  document.querySelectorAll(`#${section} .toggle-btn`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  if (section === 'timelineSection') renderTimeline(format);
  else if (section === 'eraSection') renderEraComparison(format);
  else if (section === 'scatterSection') renderScatter(format);
  else if (section === 'keeperSection') renderKeeperComparison(format);
  else if (section === 'ppSection') renderPowerplay(format);
  else if (section === 'peakSection') renderPeakInnings(format);
  else if (section === 'tableSection') renderTable(format);
}

// 1. CAREER TIMELINE
function renderTimeline(format) {
  const data = window.HEALY_DATA.career_timeline[format];
  if (!data || data.length === 0) return;
  
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
          borderColor: '#FFCD00',
          backgroundColor: 'rgba(255, 205, 0, 0.15)',
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: '#FFCD00',
          pointBorderColor: '#D4A853',
          pointBorderWidth: 2,
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
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: c.tick,
            font: { family: "'DM Mono', monospace", size: 12 },
            usePointStyle: true,
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: c.bg,
          titleColor: '#FFCD00',
          bodyColor: c.tick,
          borderColor: '#FFCD00',
          borderWidth: 1,
          padding: 12,
          titleFont: { family: "'Syne', sans-serif", weight: '700', size: 13 },
          bodyFont: { family: "'DM Mono', monospace", size: 12 },
          callbacks: {
            title: items => `${items[0].label}`,
            afterBody: items => {
              const idx = items[0].dataIndex;
              const d = data[idx];
              return [`Innings: ${d.innings}`, `Average: ${d.avg.toFixed(1)}`];
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: c.tick, font: { family: "'DM Mono', monospace", size: 11 } },
          grid: { color: c.grid },
          border: { color: c.grid },
        },
        y: {
          title: { display: true, text: 'Strike Rate', color: c.tick, font: { size: 12 } },
          ticks: { color: c.tick, font: { family: "'DM Mono', monospace", size: 11 } },
          grid: { color: c.grid },
          border: { color: c.grid },
        },
        y1: {
          position: 'right',
          title: { display: true, text: 'Runs', color: c.tick, font: { size: 12 } },
          ticks: { color: c.tick, font: { family: "'DM Mono', monospace", size: 11 } },
          grid: { display: false },
        }
      }
    }
  });
}

// 2. ERA COMPARISON
function renderEraComparison(format) {
  const eraData = window.HEALY_DATA.era_comparison[format];
  const timeline = window.HEALY_DATA.career_timeline[format];
  if (!eraData || !timeline) return;
  
  const c = chartColors();
  
  const years = Object.keys(eraData).map(Number).sort((a,b) => a-b);
  const healySR = [];
  const eraSR = [];
  
  years.forEach(year => {
    const top10 = eraData[year];
    const healyYear = timeline.find(d => d.year === year);
    const avgSR = top10.reduce((sum, p) => sum + p.sr, 0) / top10.length;
    
    healySR.push(healyYear ? healyYear.sr : null);
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
          borderColor: '#FFCD00',
          backgroundColor: 'rgba(255, 205, 0, 0.2)',
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: '#FFCD00',
          pointBorderColor: '#D4A853',
          pointBorderWidth: 2,
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
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: c.tick,
            font: { family: "'DM Mono', monospace", size: 12 },
            usePointStyle: true,
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: c.bg,
          titleColor: '#FFCD00',
          bodyColor: c.tick,
          borderColor: '#FFCD00',
          borderWidth: 1,
          padding: 12,
        }
      },
      scales: {
        x: {
          ticks: { color: c.tick, font: { family: "'DM Mono', monospace", size: 11 } },
          grid: { color: c.grid },
        },
        y: {
          title: { display: true, text: 'Strike Rate', color: c.tick, font: { size: 12 } },
          ticks: { color: c.tick, font: { family: "'DM Mono', monospace", size: 11 } },
          grid: { color: c.grid },
        }
      }
    }
  });
}

// 3. SCATTER PLOT
function renderScatter(format) {
  const eraData = window.HEALY_DATA.era_comparison[format];
  if (!eraData) return;
  
  const c = chartColors();
  
  const allPlayers = [];
  const healyPoints = [];
  
  Object.keys(eraData).forEach(year => {
    eraData[year].forEach(player => {
      const point = {
        x: player.runs,
        y: player.sr,
        year: year,
        player: player.player,
        innings: player.innings,
        avg: player.avg
      };
      
      if (player.is_healy) {
        healyPoints.push(point);
      } else {
        allPlayers.push(point);
      }
    });
  });
  
  if (charts.scatter) charts.scatter.destroy();
  
  charts.scatter = new Chart(document.getElementById('scatterChart'), {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Other Top 10',
          data: allPlayers,
          backgroundColor: 'rgba(107, 107, 114, 0.3)',
          borderColor: 'rgba(107, 107, 114, 0.5)',
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Healy',
          data: healyPoints,
          backgroundColor: '#FFCD00',
          borderColor: '#D4A853',
          borderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
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
            font: { family: "'DM Mono', monospace", size: 12 },
            usePointStyle: true,
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: c.bg,
          titleColor: '#FFCD00',
          bodyColor: c.tick,
          borderColor: '#FFCD00',
          borderWidth: 1,
          padding: 12,
          titleFont: { family: "'Syne', sans-serif", weight: '700', size: 13 },
          bodyFont: { family: "'DM Mono', monospace", size: 12 },
          callbacks: {
            title: items => items[0].raw.player,
            label: item => [
              `Year: ${item.raw.year}`,
              `Runs: ${item.raw.x}`,
              `SR: ${item.raw.y.toFixed(1)}`,
              `Avg: ${item.raw.avg ? item.raw.avg.toFixed(1) : 'N/A'}`
            ]
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Runs', color: c.tick, font: { size: 12 } },
          ticks: { color: c.tick, font: { family: "'DM Mono', monospace", size: 11 } },
          grid: { color: c.grid },
        },
        y: {
          title: { display: true, text: 'Strike Rate', color: c.tick, font: { size: 12 } },
          ticks: { color: c.tick, font: { family: "'DM Mono', monospace", size: 11 } },
          grid: { color: c.grid },
        }
      }
    }
  });
}

// 4. KEEPER COMPARISON
function renderKeeperComparison(format) {
  const eraData = window.HEALY_DATA.era_comparison[format];
  const timeline = window.HEALY_DATA.career_timeline[format];
  if (!eraData || !timeline) return;
  
  const c = chartColors();
  
  const years = Object.keys(eraData).map(Number).sort((a,b) => a-b);
  const healy = [];
  const keepersAvg = [];
  
  years.forEach(year => {
    const players = eraData[year];
    const healyYear = timeline.find(d => d.year === year);
    const keepers = players.filter(p => p.is_keeper && !p.is_healy);
    
    const avg = keepers.length > 0
      ? keepers.reduce((s, p) => s + p.sr, 0) / keepers.length
      : null;
    
    healy.push(healyYear ? healyYear.sr : null);
    keepersAvg.push(avg);
  });
  
  if (charts.keeper) charts.keeper.destroy();
  
  charts.keeper = new Chart(document.getElementById('keeperChart'), {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Healy SR',
          data: healy,
          borderColor: '#FFCD00',
          backgroundColor: 'rgba(255, 205, 0, 0.2)',
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: '#FFCD00',
          pointBorderColor: '#D4A853',
          pointBorderWidth: 2,
          tension: 0.3,
          fill: '+1',
        },
        {
          label: 'Other Keepers Avg SR',
          data: keepersAvg,
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
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: c.tick,
            font: { family: "'DM Mono', monospace", size: 12 },
            usePointStyle: true,
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: c.bg,
          titleColor: '#FFCD00',
          bodyColor: c.tick,
          borderColor: '#FFCD00',
          borderWidth: 1,
          padding: 12,
        }
      },
      scales: {
        x: {
          ticks: { color: c.tick, font: { family: "'DM Mono', monospace", size: 11 } },
          grid: { color: c.grid },
        },
        y: {
          title: { display: true, text: 'Strike Rate', color: c.tick, font: { size: 12 } },
          ticks: { color: c.tick, font: { family: "'DM Mono', monospace", size: 11 } },
          grid: { color: c.grid },
        }
      }
    }
  });
}

// 5. POWERPLAY
function renderPowerplay(format) {
  const data = window.HEALY_DATA.powerplay_stats[format];
  if (!data || data.length === 0) return;
  
  const c = chartColors();
  
  if (charts.pp) charts.pp.destroy();
  
  charts.pp = new Chart(document.getElementById('ppChart'), {
    type: 'bar',
    data: {
      labels: data.map(d => d.year),
      datasets: [
        {
          label: 'Powerplay SR',
          data: data.map(d => d.pp_sr),
          backgroundColor: '#FFCD00',
          borderColor: '#D4A853',
          borderWidth: 1,
        },
        {
          label: 'Non-Powerplay SR',
          data: data.map(d => d.non_pp_sr),
          backgroundColor: '#5B9BD5',
          borderColor: '#4A8BC2',
          borderWidth: 1,
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
            font: { family: "'DM Mono', monospace", size: 12 },
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: c.bg,
          titleColor: '#FFCD00',
          bodyColor: c.tick,
          borderColor: '#FFCD00',
          borderWidth: 1,
          padding: 12,
        }
      },
      scales: {
        x: {
          ticks: { color: c.tick, font: { family: "'DM Mono', monospace", size: 11 } },
          grid: { display: false },
        },
        y: {
          title: { display: true, text: 'Strike Rate', color: c.tick, font: { size: 12 } },
          ticks: { color: c.tick, font: { family: "'DM Mono', monospace", size: 11 } },
          grid: { color: c.grid },
        }
      }
    }
  });
}

// 6. PEAK INNINGS
function renderPeakInnings(format) {
  const peaks = window.HEALY_DATA.peak_innings[format];
  if (!peaks || peaks.length === 0) return;
  
  const container = document.getElementById('peakContainer');
  
  container.innerHTML = peaks.map((p, idx) => `
    <div class="peak-card">
      <div class="peak-rank">#${idx + 1}</div>
      <div class="peak-score">${p.runs} (${p.balls})</div>
      <div class="peak-sr">SR: ${p.sr.toFixed(1)}</div>
      <div class="peak-details">
        <div class="peak-opponent">${p.opponent}</div>
        <div class="peak-meta">${p.venue} • ${p.date}</div>
      </div>
    </div>
  `).join('');
}

// 7. TABLE
function renderTable(format) {
  const data = window.HEALY_DATA.career_timeline[format];
  if (!data || data.length === 0) return;
  
  const container = document.getElementById('tableContainer');
  
  container.innerHTML = `
    <table class="stats-table">
      <thead>
        <tr>
          <th>Year</th>
          <th>Innings</th>
          <th>Runs</th>
          <th>Balls</th>
          <th>SR</th>
          <th>Average</th>
          <th>Dismissals</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(d => `
          <tr>
            <td><strong>${d.year}</strong></td>
            <td>${d.innings}</td>
            <td>${d.runs}</td>
            <td>${d.balls}</td>
            <td class="highlight">${d.sr.toFixed(1)}</td>
            <td>${d.avg.toFixed(1)}</td>
            <td>${d.dismissals}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}