import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// If already logged in — redirect to dashboard
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location = "dashboard.html";
  }
});

document.getElementById("loginBtn").addEventListener("click", login);

// Also allow pressing Enter
document.getElementById("password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") login();
});

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const btn = document.getElementById("loginBtn");
  const errorEl = document.getElementById("errorMsg");

  if (!email || !password) {
    errorEl.textContent = "Введіть email та пароль";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Завантаження...";
  errorEl.textContent = "";

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    const adminRef = doc(db, "admins", uid);
    const snap = await getDoc(adminRef);

    if (!snap.exists()) {
      errorEl.textContent = "Доступ заборонено";
      await auth.signOut();
      return;
    }

    localStorage.setItem("uid", uid);
    localStorage.setItem("name", snap.data().name);
    localStorage.setItem("role", snap.data().role);

    window.location = "dashboard.html";

  } catch (err) {
    console.error(err);
    errorEl.textContent = "Невірний email або пароль";
  } finally {
    btn.disabled = false;
    btn.textContent = "Увійти";
  }
}
