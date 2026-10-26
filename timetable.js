import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    push
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


// ===============================
// HTML ELEMENTS
// ===============================

const department = document.getElementById("department");
const year = document.getElementById("year");
const section = document.getElementById("section");

const excelBtn = document.getElementById("excelBtn");
const excelFile = document.getElementById("excelFile");

const pdfBtn = document.getElementById("pdfBtn");
const pdfFile = document.getElementById("pdfFile");

const status = document.getElementById("status");

console.log("✅ ClassGuard Timetable JS Loaded");


// ===============================
// TIME TABLE PERIODS
// ===============================

const periodTimes = {

    "1": "9:20 AM - 10:10 AM",

    "2": "10:10 AM - 11:00 AM",

    "3": "11:15 AM - 12:05 PM",

    "4": "12:05 PM - 12:50 PM",

    "5": "1:45 PM - 2:40 PM",

    "6": "2:40 PM - 3:35 PM",

    "7": "3:35 PM - 4:30 PM"

};


// ===============================
// SUBJECT → FACULTY
// ===============================

const facultyMap = {

    "ICL": "Mrs.S.Jeevitha",

    "DSM": "Mr.C.ArunKumar",

    "MWAD": "Dr.A.Rajamurugan",

    "CCS": "Ms.P.Jananipriya",

    "AJP": "Ms.K.Monikasri",

    "ISSS": "Dr.P.Sulochana",

    "EH": "Mrs.V.Roopa",

    "IACTS": "Ms.T.Vanitha",

    "MH": "Mrs.S.Jeevitha"

};


// ===============================
// CHECK SELECTION
// ===============================

function checkSelection() {

    if (
        department.value === "" ||
        year.value === "" ||
        section.value === ""
    ) {

        alert(
            "Please select Department, Year and Section"
        );

        return false;
    }

    return true;
}


// ===============================
// EXCEL BUTTON
// ===============================

excelBtn.addEventListener("click", () => {

    if (!checkSelection()) {
        return;
    }

    excelFile.click();

});


// ===============================
// EXCEL FILE
// ===============================

excelFile.addEventListener("change", function (event) {

    const file = event.target.files[0];

    if (!file) {
        return;
    }

    status.innerHTML =
        "⏳ Reading timetable...";

    const reader = new FileReader();

    reader.onload = async function (e) {

        try {

            const data =
                new Uint8Array(
                    e.target.result
                );

            const workbook =
                XLSX.read(
                    data,
                    {
                        type: "array"
                    }
                );

            const sheet =
                workbook.Sheets[
                    workbook.SheetNames[0]
                ];

            const rows =
                XLSX.utils.sheet_to_json(
                    sheet,
                    {
                        header: 1,
                        defval: ""
                    }
                );


            console.log(
                "📊 Excel Rows:",
                rows
            );


            await processTimetable(
                rows,
                "Excel"
            );


        } catch (error) {

            console.error(error);

            status.innerHTML =
                "❌ Timetable import failed";

            alert(
                "Timetable import failed.\nCheck the browser console."
            );

        }

    };


    reader.readAsArrayBuffer(file);

});


// ===============================
// PROCESS TIMETABLE
// ===============================

async function processTimetable(
    rows,
    fileType
) {

    const dept =
        department.value;

    const yr =
        year.value;

    const sec =
        section.value;


    // ===============================
    // MAIN TIMETABLE OBJECT
    // ===============================

    const timetableData = {

        department: dept,

        year: yr,

        section: sec,

        importedAt:
            new Date().toISOString(),

        fileType: fileType,

        Monday: {},

        Tuesday: {},

        Wednesday: {},

        Thursday: {},

        Friday: {}

    };


    const days = [

        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"

    ];


    // ===============================
    // READ GRID
    // ===============================

    for (
        let i = 0;
        i < rows.length;
        i++
    ) {

        const row =
            rows[i];

        if (!row) {
            continue;
        }


        let day = "";


        // Find day inside row

        for (
            let j = 0;
            j < row.length;
            j++
        ) {

            const value =
                String(
                    row[j] || ""
                )
                .trim();

            if (
                days.includes(value)
            ) {

                day = value;

                break;

            }

        }


        if (day === "") {
            continue;
        }


        console.log(
            "📅 Found Day:",
            day
        );


        // ===============================
        // READ PERIODS
        // ===============================

        let periodNumber = 1;


        for (
            let j = 0;
            j < row.length &&
            periodNumber <= 7;
            j++
        ) {

            const value =
                String(
                    row[j] || ""
                )
                .trim();


            if (
                value === "" ||
                days.includes(value)
            ) {

                continue;

            }


            // Ignore common timetable text

            if (
                value === "Period" ||
                value === "Time" ||
                value === "Day"
            ) {

                continue;

            }


            // ===============================
            // CHECK SUBJECT
            // ===============================

            if (
                facultyMap[value]
            ) {

                timetableData[day][
                    periodNumber
                ] = {

                    period:
                        String(
                            periodNumber
                        ),

                    time:
                        periodTimes[
                            periodNumber
                        ],

                    subject:
                        value,

                    faculty:
                        facultyMap[value]

                };


                console.log(
                    day,
                    periodNumber,
                    value,
                    facultyMap[value]
                );


                periodNumber++;

            }

        }

    }


    // ===============================
    // SAVE TIMETABLE
    // ===============================

    const timetableRef =
        ref(
            db,
            `Timetable/${dept}/${yr}/${sec}`
        );


    await set(
        timetableRef,
        timetableData
    );


    // ===============================
    // IMPORT HISTORY
    // ===============================

    const historyRef =
        push(
            ref(
                db,
                "TimetableImports"
            )
        );


    await set(
        historyRef,
        {

            department: dept,

            year: yr,

            section: sec,

            fileType: fileType,

            importedAt:
                new Date().toISOString()

        }
    );


    // ===============================
    // SUCCESS
    // ===============================

    status.innerHTML =
        "✅ Timetable saved successfully";


    alert(
        "✅ Timetable saved to Firebase"
    );


    console.log(
        "🔥 FINAL TIMETABLE:",
        timetableData
    );

}


// ===============================
// PDF BUTTON
// ===============================

pdfBtn.addEventListener(
    "click",
    () => {

        if (!checkSelection()) {
            return;
        }

        pdfFile.click();

    }
);


// ===============================
// PDF FILE
// ===============================

pdfFile.addEventListener(
    "change",
    async function (event) {

        const file =
            event.target.files[0];

        if (!file) {
            return;
        }


        status.innerHTML =
            "⏳ Reading PDF...";


        try {

            const arrayBuffer =
                await file.arrayBuffer();


            const pdf =
                await pdfjsLib
                    .getDocument({
                        data: arrayBuffer
                    })
                    .promise;


            let fullText = "";


            for (
                let pageNumber = 1;
                pageNumber <= pdf.numPages;
                pageNumber++
            ) {

                const page =
                    await pdf.getPage(
                        pageNumber
                    );


                const textContent =
                    await page.getTextContent();


                const pageText =
                    textContent.items
                        .map(
                            item => item.str
                        )
                        .join(" ");


                fullText +=
                    pageText + "\n";

            }


            console.log(
                "📄 PDF TEXT:",
                fullText
            );


            // Save PDF import separately

            const pdfRef =
                push(
                    ref(
                        db,
                        "TimetableImports"
                    )
                );


            await set(
                pdfRef,
                {

                    department:
                        department.value,

                    year:
                        year.value,

                    section:
                        section.value,

                    fileType:
                        "PDF",

                    importedAt:
                        new Date().toISOString(),

                    extractedText:
                        fullText

                }
            );


            status.innerHTML =
                "✅ PDF imported successfully";


            alert(
                "✅ PDF saved to Firebase"
            );


        } catch (error) {

            console.error(error);

            status.innerHTML =
                "❌ PDF import failed";

            alert(
                "PDF reading failed."
            );

        }

    }
);