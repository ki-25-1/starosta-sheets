import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection, getDocs, addDoc, deleteDoc, updateDoc,
  doc, query, where, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let role = null;
let name = null;

// ─── Auth guard + load user from Firestore ─────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location = "index.html"; return; }

  const snap = await getDoc(doc(db, "admins", user.uid));
  if (!snap.exists()) { await signOut(auth); window.location = "index.html"; return; }

  name = snap.data().name;
  role = snap.data().role;

  const roleLabel = role === "starosta" ? "Староста" : role === "deputy" ? "Зам. старости" : "Викладач";
  document.getElementById("userInfo").innerHTML =
    `<span class="role-badge ${role}">${roleLabel}</span> ${name}`;

  if (role !== "starosta") {
    document.getElementById("deleteBtn").style.display = "none";
  }

  loadSubjects();
  loadStudents();
});

// ─── Logout ────────────────────────────────────────────────────────────────────
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  localStorage.clear();
  window.location = "index.html";
});

// ─── Set today's date ──────────────────────────────────────────────────────────
const dateInput = document.getElementById("date");
dateInput.value = new Date().toISOString().split("T")[0];

// ─── Load subjects ─────────────────────────────────────────────────────────────
async function loadSubjects() {
  const snap = await getDocs(collection(db, "subjects"));
  const select = document.getElementById("subject");
  select.innerHTML = "";
  if (snap.empty) {
    select.innerHTML = `<option value="">— немає предметів —</option>`;
    return;
  }
  snap.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.data().name;
    opt.textContent = d.data().name;
    select.appendChild(opt);
  });
}

// ─── State ─────────────────────────────────────────────────────────────────────
let students = [];
let editingDocId = null;

// ─── Load students ─────────────────────────────────────────────────────────────
async function loadStudents() {
  const snap = await getDocs(collection(db, "students"));
  students = [];
  snap.forEach(d => students.push({ id: d.id, ...d.data() }));
  students.sort((a, b) => a.subgroup - b.subgroup || a.name.localeCompare(b.name, "uk"));
  renderTable();
}

function renderTable(existing = null) {
  const table = document.getElementById("studentsTable");
  // Clear rows except header
  while (table.rows.length > 1) table.deleteRow(1);

  students.forEach(st => {
    const row = table.insertRow();
    row.className = st.subgroup == 1 ? "subgroup1" : "subgroup2";
    row.dataset.id = st.id;

    const checked = existing ? existing[st.id] === true : false;

    row.innerHTML = `
      <td>${st.name}</td>
      <td class="center"><span class="sub-badge">Пд ${st.subgroup}</span></td>
      <td class="center">
        <label class="toggle">
          <input type="checkbox" data-student-id="${st.id}" ${checked ? "checked" : ""}>
          <span class="slider"></span>
        </label>
      </td>
    `;
  });
}

// ─── Save attendance ────────────────────────────────────────────────────────────
document.getElementById("saveBtn").addEventListener("click", async () => {
  const date = document.getElementById("date").value;
  const lesson = document.getElementById("lesson").value;
  const subject = document.getElementById("subject").value;
  const type = document.getElementById("type").value;
  const subgroup = document.getElementById("subgroup").value;

  if (!date || !subject) {
    showToast("Вкажіть дату та предмет", "error");
    return;
  }

  const checkboxes = document.querySelectorAll("#studentsTable input[type=checkbox]");
  const studentsList = [];
  checkboxes.forEach(cb => {
    const row = cb.closest("tr");
    studentsList.push({
      id: cb.dataset.studentId,
      name: row.children[0].textContent,
      present: cb.checked
    });
  });

  const btn = document.getElementById("saveBtn");
  btn.disabled = true;
  btn.textContent = "Збереження...";

  try {
    if (editingDocId) {
      // Update existing
      await updateDoc(doc(db, "attendance", editingDocId), {
        date, lesson, subject, type, subgroup,
        students: studentsList, markedBy: name, updatedAt: new Date().toISOString()
      });
      showToast("✅ Запис оновлено");
      editingDocId = null;
      document.getElementById("editBtn").textContent = "Редагувати";
      document.getElementById("saveBtn").textContent = "Зберегти";
    } else {
      await addDoc(collection(db, "attendance"), {
        date, lesson, subject, type, subgroup,
        students: studentsList, markedBy: name, createdAt: new Date().toISOString()
      });
      showToast("✅ Збережено");
    }
    renderTable(); // reset checkboxes
  } catch (err) {
    console.error(err);
    showToast("Помилка збереження", "error");
  } finally {
    btn.disabled = false;
    if (!editingDocId) btn.textContent = "Зберегти";
  }
});

// ─── Edit attendance (load existing record) ─────────────────────────────────────
document.getElementById("editBtn").addEventListener("click", async () => {
  if (editingDocId) {
    // Cancel edit
    editingDocId = null;
    document.getElementById("editBtn").textContent = "Редагувати";
    document.getElementById("saveBtn").textContent = "Зберегти";
    renderTable();
    return;
  }

  const date = document.getElementById("date").value;
  const lesson = document.getElementById("lesson").value;
  const subject = document.getElementById("subject").value;

  if (!date || !subject) {
    showToast("Вкажіть дату та предмет для пошуку", "error");
    return;
  }

  const q = query(
    collection(db, "attendance"),
    where("date", "==", date),
    where("lesson", "==", lesson),
    where("subject", "==", subject)
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    showToast("Запис не знайдено", "error");
    return;
  }

  const docData = snap.docs[0];
  editingDocId = docData.id;

  const data = docData.data();
  document.getElementById("type").value = data.type;
  document.getElementById("subgroup").value = data.subgroup;

  // Build map id→present
  const presentMap = {};
  data.students.forEach(s => { presentMap[s.id] = s.present; });

  renderTable(presentMap);

  document.getElementById("editBtn").textContent = "Скасувати";
  document.getElementById("saveBtn").textContent = "Оновити";
  showToast("📝 Режим редагування");
});

// ─── Delete attendance ──────────────────────────────────────────────────────────
document.getElementById("deleteBtn").addEventListener("click", async () => {
  const date = document.getElementById("date").value;
  const lesson = document.getElementById("lesson").value;
  const subject = document.getElementById("subject").value;

  if (!date || !subject) {
    showToast("Вкажіть дату та предмет", "error");
    return;
  }

  if (!confirm(`Видалити запис: ${date}, пара ${lesson}, ${subject}?`)) return;

  const q = query(
    collection(db, "attendance"),
    where("date", "==", date),
    where("lesson", "==", lesson),
    where("subject", "==", subject)
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    showToast("Запис не знайдено", "error");
    return;
  }

  for (const d of snap.docs) {
    await deleteDoc(doc(db, "attendance", d.id));
  }

  showToast("🗑️ Видалено");
  renderTable();
});

// ─── Toast notification ────────────────────────────────────────────────────────
function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => { toast.className = "toast"; }, 3000);
}
