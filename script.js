// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDBysTiwholuqy7deWFodarpDSkPcS7UM8",
  authDomain: "classguardstudent2.firebaseapp.com",
  databaseURL: "https://classguardstudent2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "classguardstudent2",
  storageBucket: "classguardstudent2.firebasestorage.app",
  messagingSenderId: "123310232333",
  appId: "1:123310232333:web:2b5a66246806fe95c71644"
};

// Initialize
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Login

console.log("Login script loaded");

document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("loginBtn");

    if (!loginBtn) {
        console.error("Login button not found!");
        return;
    }

    loginBtn.addEventListener("click", () => {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const message = document.getElementById("message");

        if (username === "admin" && password === "admin") {
            localStorage.setItem("login", "true");
            window.location.href = "./dashboard.html";
        } else {
            message.textContent = "Invalid Login";
        }
    });
});

