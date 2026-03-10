import { auth, db } from "./firebase.js";

import {

signInWithEmailAndPassword

} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {

doc,
getDoc

} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document
.getElementById("loginBtn")
.addEventListener("click",login);

async function login(){

let email =
document.getElementById("email").value;

let password =
document.getElementById("password").value;

try{

const cred =
await signInWithEmailAndPassword(
auth,
email,
password
);

const uid = cred.user.uid;

const adminRef = doc(db,"admins",uid);

const snap = await getDoc(adminRef);

if(!snap.exists()){

alert("Доступ заборонено");
return;

}

localStorage.setItem(
"name",
snap.data().name
);

localStorage.setItem(
"role",
snap.data().role
);

window.location="dashboard.html";

}

catch{

alert("Помилка входу");

}

}
