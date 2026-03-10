import { db } from "./firebase.js";

import {

collection,
getDocs

} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document
.getElementById("loadStats")
.addEventListener("click",loadStats);

async function loadStats(){

const snap =
await getDocs(collection(db,"attendance"));

let days={};

snap.forEach(docu=>{

let data = docu.data();

if(!days[data.date])
days[data.date]=0;

let present =
data.students
.filter(s=>s.present).length;

days[data.date]+=present;

});

drawChart(days);

}

function drawChart(days){

const ctx =
document.getElementById("chart");

new Chart(ctx,{

type:"bar",

data:{

labels:Object.keys(days),

datasets:[{

label:"Відвідуваність",

data:Object.values(days)

}]

}

});

}
