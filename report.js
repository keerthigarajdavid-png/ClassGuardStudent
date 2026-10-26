import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import {
    getDatabase,
    ref,
    get
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

const table = document.getElementById("reportTable");

document.getElementById("loadBtn").onclick = loadReport;

async function loadReport() {

    table.innerHTML = "";

    const department = document.getElementById("department").value;
    const year = document.getElementById("year").value;
    const section = document.getElementById("section").value;

    const snapshot = await get(ref(db, "Students"));

    if (!snapshot.exists()) {

        table.innerHTML =
            "<tr><td colspan='3' class='text-center'>No Data Found</td></tr>";

        return;
    }

    snapshot.forEach((student) => {

        const data = student.val();

        if (
            data.department === department &&
            data.year == year &&
            data.section === section
        ) {

            table.innerHTML += `
            <tr>

                <td>${data.registerNo}</td>

                <td>${data.name}</td>

                <td>${data.attendance}</td>

            </tr>
            `;

        }

    });

}

loadReport();