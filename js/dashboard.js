import { auth, db } from "./firebase.js";

import {

collection,
getDocs,
addDoc,
deleteDoc,
doc

} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let role = localStorage.getItem("role");
let name = localStorage.getItem("name");

document.getElementById("userInfo").innerText =
`Авторизовано: ${role} ${name}`;

if(role !== "starosta"){

document
.getElementById("deleteBtn")
.style.display="none";

}

loadStudents();

async function loadStudents(){

const snap =
await getDocs(collection(db,"students"));

const table =
document.getElementById("studentsTable");

snap.forEach(st=>{

let data = st.data();

let row =
document.createElement("tr");

row.className =
data.subgroup==1
? "subgroup1"
: "subgroup2";

row.innerHTML=`

<td>${data.name}</td>
<td><input type="checkbox"></td>

`;

table.appendChild(row);

});

}

document
.getElementById("saveBtn")
.addEventListener("click",saveAttendance);

async function saveAttendance(){

let rows =
document.querySelectorAll("#studentsTable tr");

let students=[];

rows.forEach((row,i)=>{

if(i===0) return;

students.push({

name:row.children[0].innerText,

present:row.children[1]
.querySelector("input").checked

});

});

await addDoc(collection(db,"attendance"),{

date:
document.getElementById("date").value,

lesson:
document.getElementById("lesson").value,

subject:
document.getElementById("subject").value,

type:
document.getElementById("type").value,

subgroup:
document.getElementById("subgroup").value,

students:students,

markedBy:name

});

alert("Збережено");

}
