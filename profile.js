import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://classguardstudent2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const advisorRef = ref(db, "Advisors/advisor");

get(advisorRef).then((snapshot) => {

    if (snapshot.exists()) {

        const data = snapshot.val();

        document.getElementById("name").innerHTML =
            "Name : " + data.name;

        document.getElementById("department").innerHTML =
            "Department : " + data.department;

        document.getElementById("designation").innerHTML =
            "Designation : " + data.designation;

        document.getElementById("email").innerHTML =
            "Email : " + data.email;
    }

});