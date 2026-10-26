import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
    getDatabase,
    ref,
    get,
    update
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDBysTiwholuqy7deWFodarpDSkPcS7UM8",
    authDomain: "classguardstudent2.firebaseapp.com",
    databaseURL: "https://classguardstudent2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "classguardstudent2",
    storageBucket: "classguardstudent2.firebasestorage.app",
    messagingSenderId: "123310232333",
    appId: "1:123310232333:web:2b5a66246806fe95c71644"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.getElementById("changeBtn").onclick = async () => {

    const username = document.getElementById("username").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (username === "" || newPassword === "" || confirmPassword === "") {
        document.getElementById("status").innerHTML = "⚠ Fill all fields";
        return;
    }

    if (newPassword !== confirmPassword) {
        document.getElementById("status").innerHTML = "❌ Passwords do not match";
        return;
    }

    const advisorRef = ref(db, "Advisors/" + username);

    const snapshot = await get(advisorRef);

    if (!snapshot.exists()) {
        document.getElementById("status").innerHTML = "❌ Advisor not found";
        return;
    }

    await update(advisorRef, {
        password: newPassword
    });

    document.getElementById("status").innerHTML =
        "✅ Password Changed Successfully";
};