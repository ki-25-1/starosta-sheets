import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─── Auth guard ────────────────────────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
  if (!user) window.location = "index.html";
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  localStorage.clear();
  window.location = "index.html";
});

// ─── Load subjects into filter ─────────────────────────────────────────────────
async function loadSubjects() {
  const snap = await getDocs(collection(db, "subjects"));
  const sel = document.getElementById("filterSubject");
  sel.innerHTML = `<option value="">Всі предмети</option>`;
  snap.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.data().name;
    opt.textContent = d.data().name;
    sel.appendChild(opt);
  });
}

// ─── Set default date range (last 30 days) ────────────────────────────────────
const today = new Date().toISOString().split("T")[0];
const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
document.getElementById("dateFrom").value = monthAgo;
document.getElementById("dateTo").value = today;

let chartInstance = null;

// ─── Load stats ────────────────────────────────────────────────────────────────
document.getElementById("loadStats").addEventListener("click", loadStats);

async function loadStats() {
  const dateFrom = document.getElementById("dateFrom").value;
  const dateTo = document.getElementById("dateTo").value;
  const filterSubject = document.getElementById("filterSubject").value;

  if (!dateFrom || !dateTo) {
    alert("Вкажіть обидві дати");
    return;
  }

  const btn = document.getElementById("loadStats");
  btn.disabled = true;
  btn.textContent = "Завантаження...";

  const snap = await getDocs(collection(db, "attendance"));

  // Filter by date range and optional subject
  const records = [];
  snap.forEach(d => {
    const data = d.data();
    if (data.date >= dateFrom && data.date <= dateTo) {
      if (!filterSubject || data.subject === filterSubject) {
        records.push(data);
      }
    }
  });

  btn.disabled = false;
  btn.textContent = "Показати";

  if (records.length === 0) {
    document.getElementById("summaryCards").innerHTML =
      `<p class="no-data">Немає даних за вибраний період</p>`;
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    document.getElementById("studentTable").innerHTML = "";
    return;
  }

  // ─── Per-day attendance chart data ────────────────────────────────────────
  const days = {};
  records.forEach(r => {
    if (!days[r.date]) days[r.date] = { present: 0, total: 0 };
    r.students.forEach(s => {
      days[r.date].total++;
      if (s.present) days[r.date].present++;
    });
  });

  const sortedDates = Object.keys(days).sort();
  const percentages = sortedDates.map(d =>
    Math.round((days[d].present / days[d].total) * 100)
  );

  drawChart(sortedDates, percentages);

  // ─── Per-student stats ────────────────────────────────────────────────────
  const studentStats = {};
  records.forEach(r => {
    r.students.forEach(s => {
      if (!studentStats[s.name]) studentStats[s.name] = { present: 0, total: 0 };
      studentStats[s.name].total++;
      if (s.present) studentStats[s.name].present++;
    });
  });

  renderStudentTable(studentStats);

  // ─── Summary cards ────────────────────────────────────────────────────────
  const totalLessons = records.length;
  const allPresent = records.reduce((sum, r) => sum + r.students.filter(s => s.present).length, 0);
  const allTotal = records.reduce((sum, r) => sum + r.students.length, 0);
  const avgPercent = allTotal ? Math.round(allPresent / allTotal * 100) : 0;

  document.getElementById("summaryCards").innerHTML = `
    <div class="stat-card">
      <div class="stat-number">${totalLessons}</div>
      <div class="stat-label">Занять</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${avgPercent}%</div>
      <div class="stat-label">Середня відвідуваність</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${allPresent}</div>
      <div class="stat-label">Всього відвідувань</div>
    </div>
  `;
}

function drawChart(labels, data) {
  const ctx = document.getElementById("chart").getContext("2d");
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Відвідуваність (%)",
        data,
        borderColor: "#2b5cff",
        backgroundColor: "rgba(43,92,255,0.1)",
        borderWidth: 2,
        pointRadius: 4,
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { min: 0, max: 100, ticks: { callback: v => v + "%" } }
      },
      plugins: {
        tooltip: { callbacks: { label: ctx => ctx.parsed.y + "%" } }
      }
    }
  });
}

function renderStudentTable(stats) {
  const sorted = Object.entries(stats).sort((a, b) => {
    const pA = a[1].present / a[1].total;
    const pB = b[1].present / b[1].total;
    return pB - pA;
  });

  const rows = sorted.map(([name, s]) => {
    const pct = Math.round(s.present / s.total * 100);
    const cls = pct >= 75 ? "good" : pct >= 50 ? "warn" : "bad";
    return `<tr>
      <td>${name}</td>
      <td class="center">${s.present}/${s.total}</td>
      <td class="center"><span class="pct-badge ${cls}">${pct}%</span></td>
    </tr>`;
  }).join("");

  document.getElementById("studentTable").innerHTML = `
    <table>
      <thead><tr><th>Студент</th><th class="center">Занять</th><th class="center">%</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

loadSubjects();
