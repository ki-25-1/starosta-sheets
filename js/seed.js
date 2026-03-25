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
  { name: "Дідушко Іван Миколайович ", subgroup: 2 },
  { name: "Завацький Роман Андрійович", subgroup: 1 },
  { name: "Іванишин Артур Петрович", subgroup: 1 },
  { name: "Ковальчук Надія Олександрівна", subgroup: 1 },
  { name: "Лаврів Анастасія", subgroup: 1 },
  { name: "Лукавський Василь Андрійович", subgroup: 1 },
  { name: "Макух Вероніка Віталіївна", subgroup: 1 },
  { name: "Мартищук Денис Васильович", subgroup: 1 },
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
  { name: "Хрін Ярослав Володимирович", subgroup: 1 },
  { name: "Юринець Петро Михайлович", subgroup: 2 },
  { name: "Яцків Денис Русланович ", subgroup: 2 }
];

const SUBJECTS = [
    {
    name: "Вища математика",
    teachers: {
      "lecture":  { "all": "Бандура Андрій Іванович" },
      "practice": { "all": "Казмерчук Анатолій Іванович" }
    }
  },
  {
    name: "Фізика",
    teachers: {
      "lecture":  { "all": "Мокляв Володимир Володимирович" },
      "lab":      { "1": "Мокляв Володимир Володимирович", "2": "Мазур Тетяна Михайлівна" },
      "seminar":  { "all": "Мокляв Володимир Володимирович" }
    }
  },
  {
    name: "Фізичне виховання",
    teachers: {
      "practice": { "all": "Крижанівський Володимир Романович" }
    }
  },
  {
    name: "Іноземна мова (за професійним спрямуванням)",
    teachers: {
      "practice": { "all": "Купчак Наталія Дмитрівна" }
    }
  },
  {
    name: "Web-дизайн та фронтенд-розробка",
    teachers: {
      "lecture":  { "all": "Слабінога Мар`ян Остапович" },
      "lab":      { "all": "Слабінога Мар`ян Остапович" },
    }
  },
  {
    name: "Архітектура та адміністрування комп`ютерів",
    teachers: {
      "lecture":  { "all": "Мойсеєнко Олена Володимирівна" },
      "lab":      { "1": "Гарасимів Віра Михайлівна", "2": "Мойсеєнко Олена Володимирівна" },
    }
  },
  {
    name: "Історія української державності",
    teachers: {
      "lecture":  { "all": "Пуйда Роман Богданович" },
      "seminar":  { "all": "Федорчак Тетяна Петрівна" }
    }
  },
  {
    name: "Теорія алгоритмів та структури даних",
    teachers: {
      "lecture":  { "all": "Кропивницька Віталія Богданівна" },
      "lab":      { "all": "Гарасимів Тарас Григорович" }
    }
  }
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
  for (const s of SUBJECTS) {
    await addDoc(collection(db, "subjects"), { name: s.name, teachers: s.teachers || {} });
  }
  alert("✅ Предмети додано!");
};
