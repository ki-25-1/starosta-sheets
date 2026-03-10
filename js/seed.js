import { db } from "./firebase.js";

import {

collection,
addDoc

} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const students = [

{name:"Андрій Коваленко",subgroup:1},
{name:"Богдан Петренко",subgroup:1},
{name:"Владислав Романюк",subgroup:1},
{name:"Дмитро Бондар",subgroup:1},
{name:"Єгор Савчук",subgroup:1},
{name:"Ілля Ткаченко",subgroup:1},
{name:"Кирило Дорошенко",subgroup:1},
{name:"Максим Олійник",subgroup:1},
{name:"Олег Мельник",subgroup:1},
{name:"Павло Кравець",subgroup:1},
{name:"Роман Бойко",subgroup:1},
{name:"Сергій Гнатюк",subgroup:1},
{name:"Тарас Литвин",subgroup:1},
{name:"Юрій Кулик",subgroup:1},

{name:"Артем Шевчук",subgroup:2},
{name:"Віталій Сидоренко",subgroup:2},
{name:"Гліб Поліщук",subgroup:2},
{name:"Данило Марченко",subgroup:2},
{name:"Іван Левченко",subgroup:2},
{name:"Костянтин Дяченко",subgroup:2},
{name:"Леонід Соловей",subgroup:2},
{name:"Микита Панасюк",subgroup:2},
{name:"Назар Чорний",subgroup:2},
{name:"Олексій Бабенко",subgroup:2},
{name:"Петро Бондаренко",subgroup:2},
{name:"Руслан Тимченко",subgroup:2},
{name:"Степан Гуменюк",subgroup:2},
{name:"Федір Власенко",subgroup:2},
{name:"Ярослав Кравченко",subgroup:2}

];

async function seedStudents(){

for(let s of students){

await addDoc(
collection(db,"students"),
{
name:s.name,
subgroup:s.subgroup,
group:"КІ-25-1"
});

}

alert("Студенти додані");

}

seedStudents();
