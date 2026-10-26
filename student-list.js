import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import {
    getDatabase,
    ref,
    get,
    remove,
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

const table = document.getElementById("studentTable");

async function loadStudents() {

    table.innerHTML = "";

    const snapshot = await get(ref(db, "Students"));

    if (!snapshot.exists()) {

        table.innerHTML =
            "<tr><td colspan='7' class='text-center'>No Students Found</td></tr>";

        return;
    }

    snapshot.forEach((student) => {

        const data = student.val();

        table.innerHTML += `
        <tr>

            <td>${data.registerNo}</td>

            <td>${data.name}</td>

            <td>${data.department}</td>

            <td>${data.year}</td>

            <td>${data.section}</td>

            <td>${data.attendance}</td>

            <td>

                <button
                    class="btn btn-warning btn-sm editBtn"
                    data-id="${student.key}">
                    ✏️ Edit
                </button>

                <button
                    class="btn btn-danger btn-sm deleteBtn"
                    data-id="${student.key}">
                    🗑 Delete
                </button>

            </td>

        </tr>
        `;

    });

}

loadStudents();

const searchBox = document.getElementById("searchBox");

if (searchBox) {

    searchBox.addEventListener("keyup", function () {

        const value = this.value.toLowerCase();

        const rows = document.querySelectorAll("#studentTable tr");

        rows.forEach((row) => {

            if (row.innerText.toLowerCase().includes(value)) {

                row.style.display = "";

            } else {

                row.style.display = "none";

            }

        });

    });
    document.addEventListener("click", async (e) => {

    if (e.target.classList.contains("deleteBtn")) {

        const id = e.target.dataset.id;

        const ok = confirm("Delete this student?");

        if (!ok) return;

        await remove(ref(db, "Students/" + id));

        alert("✅ Student Deleted Successfully");

        loadStudents();

    }

});
let currentStudent = "";

document.addEventListener("click", async (e) => {

    if (e.target.classList.contains("editBtn")) {

        currentStudent = e.target.dataset.id;

        const snapshot = await get(ref(db, "Students/" + currentStudent));

        const data = snapshot.val();

        editName.value = data.name;
        editDepartment.value = data.department;
        editYear.value = data.year;
        editSection.value = data.section;

        new bootstrap.Modal(document.getElementById("editModal")).show();

    }

});

document.getElementById("saveStudent").onclick = async () => {

    await update(ref(db, "Students/" + currentStudent), {

        name: editName.value,
        department: editDepartment.value,
        year: editYear.value,
        section: editSection.value

    });

    alert("✅ Student Updated");

    location.reload();

};

}