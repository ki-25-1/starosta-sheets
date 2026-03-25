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

// ─── Subjects data cache ───────────────────────────────────────────────────────
let subjectsData = {}; // name → { teachers: { "1": "...", "2": "...", "all": "..." } }

// ─── Load subjects ─────────────────────────────────────────────────────────────
async function loadSubjects() {
  try {
    const snap = await getDocs(collection(db, "subjects"));
    const select = document.getElementById("subject");
    select.innerHTML = "";
    subjectsData = {};

    if (snap.empty) {
      select.innerHTML = `<option value="">— немає предметів —</option>`;
      return;
    }

    snap.forEach(d => {
      const data = d.data();
      // Guard: skip documents where name is not a plain string
      if (!data.name || typeof data.name !== "string") return;
      subjectsData[data.name] = data;
      const opt = document.createElement("option");
      opt.value = data.name;
      opt.textContent = data.name;
      select.appendChild(opt);
    });

    updateTypeOptions();
  } catch (err) {
    console.error("loadSubjects error:", err);
  }
}

// ─── Auto-fill teacher based on subject + type + subgroup ────────────────────
function updateTeacherField() {
  const subject = document.getElementById("subject").value;
  const subgroup = document.getElementById("subgroup").value;
  const type = document.getElementById("type").value;
  const teacherInput = document.getElementById("teacher");

  if (!subject || !subjectsData[subject]) {
    teacherInput.value = "";
    return;
  }

  const teachers = subjectsData[subject].teachers || {};

  // Try: teachers[type][subgroup] → teachers[type]["all"] → teachers[subgroup] → teachers["all"]
  let teacher = "";
  if (teachers[type]) {
    teacher = teachers[type][subgroup] || teachers[type]["all"] || "";
  }
  if (!teacher) {
    teacher = teachers[subgroup] || teachers["all"] || "";
  }

  teacherInput.value = teacher;
}

// ─── Filter lesson types based on subject ────────────────────────────────────
function updateTypeOptions() {
  const subject = document.getElementById("subject").value;
  const typeSelect = document.getElementById("type");
  const currentType = typeSelect.value;

  const allTypes = [
    { value: "lecture",  label: "Лекція" },
    { value: "lab",      label: "Лабораторна" },
    { value: "seminar",  label: "Семінар" },
    { value: "practice", label: "Практика" }
  ];

  if (!subject || !subjectsData[subject]) {
    // Show all if no subject selected
    typeSelect.innerHTML = allTypes.map(t =>
      `<option value="${t.value}">${t.label}</option>`
    ).join("");
    return;
  }

  const teachers = subjectsData[subject].teachers || {};
  const availableTypes = allTypes.filter(t => teachers[t.value]);

  // If no type restrictions defined — show all
  const typesToShow = availableTypes.length > 0 ? availableTypes : allTypes;

  typeSelect.innerHTML = typesToShow.map(t =>
    `<option value="${t.value}" ${t.value === currentType ? "selected" : ""}>${t.label}</option>`
  ).join("");

  // If current selection no longer available — reset to first
  const values = typesToShow.map(t => t.value);
  if (!values.includes(typeSelect.value)) {
    typeSelect.value = values[0];
  }

  updateTeacherField();
}

document.getElementById("subject").addEventListener("change", () => {
  updateTypeOptions();
});
document.getElementById("subgroup").addEventListener("change", () => {
  updateTeacherField();
  renderTable(); // оновлюємо список студентів при зміні підгрупи
});
document.getElementById("type").addEventListener("change", updateTeacherField);

// ─── State ─────────────────────────────────────────────────────────────────────
let students = [];
let editingDocId = null;

// ─── Load students ─────────────────────────────────────────────────────────────
async function loadStudents() {
  const snap = await getDocs(collection(db, "students"));
  students = [];
  snap.forEach(d => students.push({ id: d.id, ...d.data() }));
  // Сортуємо за полем order (твій порядок), якщо є — інакше за алфавітом
  students.sort((a, b) => {
    if (a.order != null && b.order != null) return a.order - b.order;
    return a.name.localeCompare(b.name, "uk");
  });
  renderTable();
}

function renderTable(existing = null) {
  const table = document.getElementById("studentsTable");
  // Clear rows except header
  while (table.rows.length > 1) table.deleteRow(1);

  // Фільтруємо за обраною підгрупою
  const selectedSubgroup = document.getElementById("subgroup").value;
  const filtered = selectedSubgroup === "all"
    ? students
    : students.filter(st => String(st.subgroup) === selectedSubgroup);

  filtered.forEach(st => {
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
  const teacher = document.getElementById("teacher").value;

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
      await updateDoc(doc(db, "attendance", editingDocId), {
        date, lesson, subject, type, subgroup, teacher,
        students: studentsList, markedBy: name, updatedAt: new Date().toISOString()
      });
      showToast("✅ Запис оновлено");
      editingDocId = null;
      document.getElementById("editBtn").textContent = "✏️ Редагувати";
      document.getElementById("saveBtn").textContent = "💾 Зберегти";
    } else {
      await addDoc(collection(db, "attendance"), {
        date, lesson, subject, type, subgroup, teacher,
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