import { db } from "./firebase.js";
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ⚠️ Цей файл більше не запускається автоматично.
// Щоб додати студентів, відкрийте консоль браузера і викличте: seedStudents()

const STUDENTS = [
  { name: "Амєлькін Дмитро Олександрович", subgroup: 1 },
  { name: "Білас Миколай Васильович", subgroup: 1 },
  { name: "Войтановський Станіслав Іванович", subgroup: 1 },
  { name: "Гой Василь Михайлович", subgroup: 1 },
  { name: "Девдюк Іван Іванович", subgroup: 1 },
  { name: "Джабар Тімур Алійович", subgroup: 1 },
  { name: "Завацький Роман Андрійович", subgroup: 1 },
  { name: "Іванишин Артур Петрович", subgroup: 1 },
  { name: "Ковальчук Надія Олександрівна", subgroup: 1 },
  { name: "Лаврів Анастасія", subgroup: 1 },
  { name: "Лукавський Василь Андрійович", subgroup: 1 },
  { name: "Макух Вероніка Віталіївна", subgroup: 1 },
  { name: "Мартищук Денис Васильович", subgroup: 1 },
  { name: "Хрін Ярослав Володимирович", subgroup: 1 },
  { name: "Дідушко Іван Миколайович ", subgroup: 2 },
  { name: "Михайлов Владислав Віталійович", subgroup: 2 },
  { name: "Пасічняк Іван Васильович", subgroup: 2 },
  { name: "Пирин Микола Васильович", subgroup: 2 },
  { name: "Семків Сергій Валерійович", subgroup: 2 },
  { name: "Сеньків Владислав - Марко Романович", subgroup: 2 },
  { name: "Сидоряк Юрій Петрович", subgroup: 2 },
  { name: "Срібняк Андрій Романович", subgroup: 2 },
  { name: "Стадник Андрій Михайлович", subgroup: 2 },
  { name: "Ткачук Анна Тарасівна ", subgroup: 2 },
  { name: "Федорів Іван Захарович", subgroup: 2 },
  { name: "Федорків Мар`ян Богданович", subgroup: 2 },
  { name: "Харишин Олег Русланович", subgroup: 2 },
  { name: "Юринець Петро Михайлович", subgroup: 2 },
  { name: "Яцків Денис Русланович ", subgroup: 2 }
];

const SUBJECTS = [
  "Вища математика", "Фізика", "Фізичне виховання", "Іноземна мова (за професійним спрямуванням)",
  "Web-дизайн та фронтенд-розробка", "Архітектура та адміністрування комп`ютерів", "Історія української державності", "Теорія алгоритмів та структури даних"
];

window.seedStudents = async function () {
  const snap = await getDocs(collection(db, "students"));
  if (!snap.empty) {
    const confirmed = confirm(`В базі вже є ${snap.size} студентів. Додати ще раз?`);
    if (!confirmed) return;
  }
  for (const s of STUDENTS) {
    await addDoc(collection(db, "students"), { name: s.name, subgroup: s.subgroup, group: "КІ-25-1" });
  }
  alert("✅ Студентів додано!");
};

window.seedSubjects = async function () {
  const snap = await getDocs(collection(db, "subjects"));
  if (!snap.empty) {
    const confirmed = confirm(`Предмети вже є. Додати ще раз?`);
    if (!confirmed) return;
  }
  for (const name of SUBJECTS) {
    await addDoc(collection(db, "subjects"), { name });
  }
  alert("✅ Предмети додано!");
};
