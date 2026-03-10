import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDjc"+"K4lwgkZHHzjk20"+"-X7HDxVgDUkkpR7E",
  authDomain: "starosta-sheets.firebaseapp.com",
  projectId: "starosta-sheets",
  storageBucket: "starosta-sheets.firebasestorage.app",
  messagingSenderId: "553"+"49252"+"5089",
  appId: "1:5534"+"92525089:"+"web:aaf5cf"+"48427fc06"+"27a7360",
  measurementId: "G-X15"+"2Y6Q419"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);
