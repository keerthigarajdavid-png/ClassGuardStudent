import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import {
    getDatabase,
    ref,
    update,
    get,
    push,
    set
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";


/* =====================================================
   FIREBASE
===================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyDBysTiwholuqy7deWFodarpDSkPcS7UM8",
    authDomain: "classguardstudent2.firebaseapp.com",
    databaseURL: "https://classguardstudent2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "classguardstudent2",
    storageBucket: "classguardstudent2.appspot.com",
    messagingSenderId: "123310232333",
    appId: "1:123310232333:web:2b5a66246806fe95c71644"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


/* =====================================================
   GLOBAL VARIABLES
===================================================== */

let timerInterval = null;
let timetableInterval = null;
let presenceMonitorInterval = null;

let automaticClass = false;
let currentPeriodKey = null;

const OFFLINE_LIMIT = 2 * 60 * 1000;

const notifiedStudents = {};

let presenceContainer = null;


/* =====================================================
   GET HTML ELEMENTS
===================================================== */

const departmentElement =
    document.getElementById("department");

const yearElement =
    document.getElementById("year");

const sectionElement =
    document.getElementById("section");

const subjectElement =
    document.getElementById("subject");

const facultyElement =
    document.getElementById("faculty");

const timerElement =
    document.getElementById("timer");

const activeStatusElement =
    document.getElementById("activeStatus");

const statusElement =
    document.getElementById("status");


/* =====================================================
   CREATE LIVE STUDENT STATUS UI
===================================================== */

function createPresenceUI() {

    if (presenceContainer) {
        return;
    }

    const existing =
        document.getElementById(
            "liveStudentStatus"
        );

    if (existing) {

        presenceContainer =
            existing;

        return;
    }

    presenceContainer =
        document.createElement("div");

    presenceContainer.id =
        "liveStudentStatus";

    presenceContainer.style.marginTop =
        "20px";

    presenceContainer.style.padding =
        "20px";

    presenceContainer.style.background =
        "#ffffff";

    presenceContainer.style.borderRadius =
        "15px";

    presenceContainer.style.boxShadow =
        "0 4px 15px rgba(0,0,0,0.08)";

    presenceContainer.innerHTML = `

        <h4>
            👥 Live Student Status
        </h4>

        <p style="color:#777;">
            Real-time student connection status
        </p>

        <div
            id="presenceSummary"
            style="margin-bottom:15px;">
        </div>

        <div id="presenceList">
            Loading student status...
        </div>

    `;

    const content =
        document.querySelector(
            ".content"
        );

    if (content) {

        content.appendChild(
            presenceContainer
        );
    }
}


/* =====================================================
   GET CLASS REFERENCE
===================================================== */

function getClassRef() {

    return ref(
        db,
        `ClassControl/${departmentElement.value}/${yearElement.value}/${sectionElement.value}`
    );
}


/* =====================================================
   GET TIMETABLE REFERENCE
===================================================== */

function getTimetableRef() {

    return ref(
        db,
        `Timetable/${departmentElement.value}/${yearElement.value}/${sectionElement.value}`
    );
}


/* =====================================================
   GET TODAY NAME
===================================================== */

function getTodayName() {

    const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];

    return days[
        new Date().getDay()
    ];
}


/* =====================================================
   TIME TO MINUTES
===================================================== */

function timeToMinutes(timeString) {

    if (!timeString) {
        return null;
    }

    const value =
        String(timeString)
            .trim()
            .toUpperCase();

    const match =
        value.match(
            /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/
        );

    if (!match) {
        return null;
    }

    let hour =
        parseInt(
            match[1],
            10
        );

    const minute =
        parseInt(
            match[2],
            10
        );

    const period =
        match[3];

    if (period === "AM") {

        if (hour === 12) {
            hour = 0;
        }

    } else if (period === "PM") {

        if (hour !== 12) {
            hour += 12;
        }
    }

    return (
        hour * 60 +
        minute
    );
}


/* =====================================================
   GET TIME RANGE
===================================================== */

function getTimeRange(timeText) {

    if (!timeText) {
        return null;
    }

    const parts =
        String(timeText)
            .split(/\s*-\s*/);

    if (parts.length !== 2) {
        return null;
    }

    const start =
        timeToMinutes(
            parts[0].trim()
        );

    const end =
        timeToMinutes(
            parts[1].trim()
        );

    if (
        start === null ||
        end === null
    ) {
        return null;
    }

    return {
        start: start,
        end: end
    };
}


/* =====================================================
   CREATE TODAY TIMESTAMP
===================================================== */

function createTodayTimestamp(
    minutes
) {

    const now =
        new Date();

    const date =
        new Date(now);

    const hours =
        Math.floor(
            minutes / 60
        );

    const mins =
        minutes % 60;

    date.setHours(
        hours,
        mins,
        0,
        0
    );

    return date.getTime();
}


/* =====================================================
   FORMAT TIMER
===================================================== */

function formatTime(
    milliseconds
) {

    if (milliseconds < 0) {
        milliseconds = 0;
    }

    const totalSeconds =
        Math.floor(
            milliseconds / 1000
        );

    const hours =
        Math.floor(
            totalSeconds / 3600
        );

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );

    const seconds =
        totalSeconds % 60;

    return (

        String(hours)
            .padStart(2, "0")

        + ":" +

        String(minutes)
            .padStart(2, "0")

        + ":" +

        String(seconds)
            .padStart(2, "0")
    );
}


/* =====================================================
   START TIMER
===================================================== */

function startTimer(
    startTime
) {

    clearInterval(
        timerInterval
    );

    function updateTimer() {

        if (!timerElement) {
            return;
        }

        const difference =
            Date.now() -
            Number(startTime);

        timerElement.innerHTML =
            formatTime(
                difference
            );
    }

    updateTimer();

    timerInterval =
        setInterval(
            updateTimer,
            1000
        );
}


/* =====================================================
   STOP TIMER
===================================================== */

function stopTimer() {

    clearInterval(
        timerInterval
    );

    timerInterval = null;

    if (timerElement) {

        timerElement.innerHTML =
            "00:00:00";
    }
}


/* =====================================================
   REQUEST NOTIFICATION PERMISSION
===================================================== */

async function requestNotificationPermission() {

    if (
        !("Notification" in window)
    ) {
        return;
    }

    if (
        Notification.permission ===
        "default"
    ) {

        try {

            await Notification.requestPermission();

        } catch (error) {

            console.log(
                "Notification permission error:",
                error
            );
        }
    }
}


/* =====================================================
   SHOW ADVISOR NOTIFICATION
===================================================== */

function showAdvisorNotification(
    registerNo,
    offlineTime
) {

    const message =
        `Student ${registerNo} has been offline for ${offlineTime}`;

    console.log(
        "⚠️ ClassGuard Alert:",
        message
    );

    if (
        "Notification" in window &&
        Notification.permission ===
        "granted"
    ) {

        new Notification(
            "⚠️ ClassGuard Alert",
            {
                body: message,
                tag:
                    "offline-" +
                    registerNo
            }
        );
    }

    if (statusElement) {

        statusElement.innerHTML =
            "⚠️ " + message;
    }
}


/* =====================================================
   FORMAT OFFLINE TIME
===================================================== */

function formatOfflineTime(
    milliseconds
) {

    if (
        !milliseconds ||
        milliseconds < 0
    ) {
        return "0s";
    }

    const totalSeconds =
        Math.floor(
            milliseconds / 1000
        );

    const minutes =
        Math.floor(
            totalSeconds / 60
        );

    const seconds =
        totalSeconds % 60;

    if (minutes > 0) {

        return (
            `${minutes}m ${seconds}s`
        );
    }

    return (
        `${seconds}s`
    );
}


/* =====================================================
   CHECK STUDENT PRESENCE
===================================================== */

async function checkStudentPresence() {

    const list =
        document.getElementById(
            "presenceList"
        );

    const summary =
        document.getElementById(
            "presenceSummary"
        );

    if (!list) {
        return;
    }

    try {

        const classSnapshot =
            await get(
                getClassRef()
            );

        if (
            !classSnapshot.exists()
        ) {

            list.innerHTML =
                "Class data not found.";

            if (summary) {
                summary.innerHTML = "";
            }

            return;
        }

        const classData =
            classSnapshot.val();

        if (
            classData.ClassStatus !==
            "Started"
        ) {

            list.innerHTML =
                "Class is not active.";

            if (summary) {
                summary.innerHTML = "";
            }

            return;
        }

        const studentsSnapshot =
            await get(
                ref(
                    db,
                    "Students"
                )
            );

        if (
            !studentsSnapshot.exists()
        ) {

            list.innerHTML =
                "No students found.";

            return;
        }

        const presenceSnapshot =
            await get(
                ref(
                    db,
                    "StudentPresence"
                )
            );

        list.innerHTML = "";

        let onlineCount = 0;
        let offlineCount = 0;
        let studentCount = 0;

        studentsSnapshot.forEach(
            (studentSnapshot) => {

                const student =
                    studentSnapshot.val();

                const registerNo =
                    String(
                        student.registerNo ||
                        studentSnapshot.key
                    );

                if (
                    String(
                        student.department
                    ) !==
                    String(
                        departmentElement.value
                    ) ||

                    String(
                        student.year
                    ) !==
                    String(
                        yearElement.value
                    ) ||

                    String(
                        student.section
                    ) !==
                    String(
                        sectionElement.value
                    )
                ) {

                    return;
                }

                studentCount++;

                const presence =
                    presenceSnapshot
                        .child(
                            registerNo
                        )
                        .val();

                let lastSeen = 0;
                let online = false;

                if (presence) {

                    lastSeen =
                        Number(
                            presence.lastSeen ||
                            0
                        );

                    online =
                        lastSeen > 0 &&
                        Date.now() -
                        lastSeen <
                        OFFLINE_LIMIT;
                }

                if (online) {

                    onlineCount++;

                    delete notifiedStudents[
                        registerNo
                    ];

                    const row =
                        document.createElement(
                            "div"
                        );

                    row.style.padding =
                        "12px";

                    row.style.marginBottom =
                        "8px";

                    row.style.borderRadius =
                        "8px";

                    row.style.background =
                        "#e8f7ee";

                    row.innerHTML = `
                        🟢
                        <b>${registerNo}</b>
                        <span style="color:green;">
                            Online
                        </span>
                    `;

                    list.appendChild(
                        row
                    );

                } else {

                    offlineCount++;

                    let offlineText =
                        "No connection";

                    if (lastSeen > 0) {

                        offlineText =
                            formatOfflineTime(
                                Date.now() -
                                lastSeen
                            );
                    }

                    const row =
                        document.createElement(
                            "div"
                        );

                    row.style.padding =
                        "12px";

                    row.style.marginBottom =
                        "8px";

                    row.style.borderRadius =
                        "8px";

                    row.style.background =
                        "#fdeaea";

                    row.innerHTML = `
                        🔴
                        <b>${registerNo}</b>
                        <span style="color:#d00000;">
                            Offline
                        </span>
                        <br>
                        <small>
                            Offline for ${offlineText}
                        </small>
                    `;

                    list.appendChild(
                        row
                    );

                    if (
                        lastSeen > 0 &&
                        Date.now() -
                        lastSeen >=
                        OFFLINE_LIMIT
                    ) {

                        if (
                            !notifiedStudents[
                                registerNo
                            ]
                        ) {

                            showAdvisorNotification(
                                registerNo,
                                offlineText
                            );

                            notifiedStudents[
                                registerNo
                            ] = true;
                        }
                    }
                }
            }
        );

        if (summary) {

            summary.innerHTML = `

                <span style="
                    background:#dff5e8;
                    color:#087f3d;
                    padding:6px 12px;
                    border-radius:20px;
                    margin-right:8px;
                ">
                    🟢 Online: ${onlineCount}
                </span>

                <span style="
                    background:#ffe2e2;
                    color:#c00000;
                    padding:6px 12px;
                    border-radius:20px;
                ">
                    🔴 Offline: ${offlineCount}
                </span>

            `;
        }

        if (studentCount === 0) {

            list.innerHTML =
                "No students found for this class.";
        }

    } catch (error) {

        console.error(
            "Presence monitor error:",
            error
        );

        list.innerHTML =
            "❌ Unable to load student status.";
    }
}
/* =====================================================
   START PRESENCE MONITOR
===================================================== */

function startPresenceMonitor() {

    createPresenceUI();

    checkStudentPresence();

    clearInterval(
        presenceMonitorInterval
    );

    presenceMonitorInterval =
        setInterval(
            checkStudentPresence,
            10000
        );
}


/* =====================================================
   TURN CLASS ON
===================================================== */

async function turnClassOn(
    period,
    startMinutes
) {

    const subject =
        period.subject || "";

    const faculty =
        period.faculty || "";

    const startTime =
        createTodayTimestamp(
            startMinutes
        );

    const classData = {

        ClassStatus: "Started",

        isActive: true,

        attendance: "Present",

        subject: subject,

        faculty: faculty,

        period:
            String(
                period.period || ""
            ),

        startTime: startTime,

        updatedAt:
            new Date().toISOString(),

        automatic: true
    };

    await update(
        getClassRef(),
        classData
    );

    if (subjectElement) {

        subjectElement.value =
            subject;
    }

    if (facultyElement) {

        facultyElement.value =
            faculty;
    }

    if (activeStatusElement) {

        activeStatusElement.innerHTML =
            "🟢 Active Class";
    }

    if (statusElement) {

        statusElement.innerHTML =
            "✅ Automatic Class Started";
    }

    startTimer(startTime);

    automaticClass = true;

    await updateStudentsAttendance(
        "Present"
    );

    checkStudentPresence();
}


/* =====================================================
   TURN CLASS OFF
===================================================== */

async function turnClassOff(
    reason = "Break"
) {

    await update(
        getClassRef(),
        {

            ClassStatus:
                "Not Started",

            isActive: false,

            subject: "",

            faculty: "",

            period: "",

            startTime: 0,

            updatedAt:
                new Date().toISOString(),

            automatic: true,

            reason: reason
        }
    );

    if (subjectElement) {

        subjectElement.value = "";
    }

    if (facultyElement) {

        facultyElement.value = "";
    }

    stopTimer();

    if (activeStatusElement) {

        activeStatusElement.innerHTML =
            "🔴 No Active Class";
    }

    if (statusElement) {

        statusElement.innerHTML =
            "⏸️ Class OFF - " + reason;
    }

    automaticClass = false;

    currentPeriodKey = null;

    checkStudentPresence();
}


/* =====================================================
   FIND CURRENT PERIOD
===================================================== */

function findCurrentPeriod(
    timetable
) {

    const today =
        getTodayName();

    if (
        today === "Saturday" ||
        today === "Sunday"
    ) {

        return null;
    }

    const dayData =
        timetable[today];

    if (!dayData) {

        return null;
    }

    let periods = [];

    if (
        Array.isArray(dayData)
    ) {

        periods = dayData;

    } else {

        periods =
            Object.values(dayData);
    }

    const now =
        new Date();

    const currentMinutes =
        now.getHours() * 60 +
        now.getMinutes();

    for (
        let i = 0;
        i < periods.length;
        i++
    ) {

        const period =
            periods[i];

        if (!period) {

            continue;
        }

        const range =
            getTimeRange(
                period.time
            );

        if (!range) {

            continue;
        }

        if (
            currentMinutes >=
                range.start &&

            currentMinutes <
                range.end
        ) {

            return {

                period: period,

                startMinutes:
                    range.start,

                endMinutes:
                    range.end,

                key:
                    String(
                        period.period ||
                        i + 1
                    )
            };
        }
    }

    return null;
}


/* =====================================================
   AUTOMATIC TIMETABLE CHECK
===================================================== */

async function checkAutomaticTimetable() {

    try {

        if (
            !departmentElement.value ||
            !yearElement.value ||
            !sectionElement.value
        ) {

            return;
        }

        const snapshot =
            await get(
                getTimetableRef()
            );

        if (
            !snapshot.exists()
        ) {

            return;
        }

        const timetable =
            snapshot.val();

        const today =
            getTodayName();

        if (
            today === "Saturday" ||
            today === "Sunday"
        ) {

            if (automaticClass) {

                await turnClassOff(
                    "Weekend"
                );
            }

            return;
        }

        const current =
            findCurrentPeriod(
                timetable
            );

        if (!current) {

            if (automaticClass) {

                await turnClassOff(
                    "Break / Lunch"
                );
            }

            return;
        }

        if (
            automaticClass &&
            currentPeriodKey ===
            current.key
        ) {

            return;
        }

        currentPeriodKey =
            current.key;

        await turnClassOn(
            current.period,
            current.startMinutes
        );

    } catch (error) {

        console.error(
            "Automatic timetable error:",
            error
        );

        if (statusElement) {

            statusElement.innerHTML =
                "❌ Timetable error";
        }
    }
}


/* =====================================================
   START AUTOMATIC SYSTEM
===================================================== */

function startAutomaticSystem() {

    checkAutomaticTimetable();

    clearInterval(
        timetableInterval
    );

    timetableInterval =
        setInterval(
            checkAutomaticTimetable,
            10000
        );
}


/* =====================================================
   MANUAL START CLASS
===================================================== */

const startBtn =
    document.getElementById(
        "startBtn"
    );

if (startBtn) {

    startBtn.onclick =
        async () => {

            try {

                await requestNotificationPermission();

                const startTime =
                    Date.now();

                await update(
                    getClassRef(),
                    {

                        ClassStatus:
                            "Started",

                        isActive:
                            true,

                        attendance:
                            "Present",

                        subject:
                            subjectElement.value,

                        faculty:
                            facultyElement.value,

                        startTime:
                            startTime,

                        updatedAt:
                            new Date()
                                .toISOString(),

                        automatic:
                            false
                    }
                );

                startTimer(
                    startTime
                );

                if (
                    activeStatusElement
                ) {

                    activeStatusElement.innerHTML =
                        "🟢 Active Class";
                }

                if (
                    statusElement
                ) {

                    statusElement.innerHTML =
                        "✅ Class Started Manually";
                }

                automaticClass =
                    false;

                await updateStudentsAttendance(
                    "Present"
                );

                checkStudentPresence();

            } catch (error) {

                console.error(
                    error
                );

                if (
                    statusElement
                ) {

                    statusElement.innerHTML =
                        "❌ Failed to start class";
                }
            }
        };
}


/* =====================================================
   MANUAL STOP CLASS
===================================================== */

const stopBtn =
    document.getElementById(
        "stopBtn"
    );

if (stopBtn) {

    stopBtn.onclick =
        async () => {

            try {

                await update(
                    getClassRef(),
                    {

                        ClassStatus:
                            "Not Started",

                        isActive:
                            false,

                        startTime:
                            0,

                        subject:
                            "",

                        faculty:
                            "",

                        period:
                            "",

                        updatedAt:
                            new Date()
                                .toISOString(),

                        automatic:
                            false
                    }
                );

                stopTimer();

                if (
                    activeStatusElement
                ) {

                    activeStatusElement.innerHTML =
                        "🔴 No Active Class";
                }

                if (
                    statusElement
                ) {

                    statusElement.innerHTML =
                        "🛑 Class Stopped";
                }

                automaticClass =
                    false;

                currentPeriodKey =
                    null;

                checkStudentPresence();

            } catch (error) {

                console.error(
                    error
                );

                if (
                    statusElement
                ) {

                    statusElement.innerHTML =
                        "❌ Failed to stop class";
                }
            }
        };
}


/* =====================================================
   MARK ATTENDANCE
===================================================== */

const attendanceBtn =
    document.getElementById(
        "attendanceBtn"
    );

if (attendanceBtn) {

    attendanceBtn.onclick =
        async () => {

            try {

                await update(
                    getClassRef(),
                    {
                        attendance:
                            "Present"
                    }
                );

                if (
                    statusElement
                ) {

                    statusElement.innerHTML =
                        "✅ Attendance Marked";
                }

                await updateStudentsAttendance(
                    "Present"
                );

                checkStudentPresence();

            } catch (error) {

                console.error(
                    error
                );

                if (
                    statusElement
                ) {

                    statusElement.innerHTML =
                        "❌ Attendance failed";
                }
            }
        };
}


/* =====================================================
   NAVIGATION
===================================================== */

const studentListBtn =
    document.getElementById(
        "studentListBtn"
    );

if (studentListBtn) {

    studentListBtn.onclick =
        () => {

            window.location.href =
                "student-list.html";
        };
}


const reportBtn =
    document.getElementById(
        "reportBtn"
    );

if (reportBtn) {

    reportBtn.onclick =
        () => {

            window.location.href =
                "report.html";
        };
}


const profileBtn =
    document.getElementById(
        "profileBtn"
    );

if (profileBtn) {

    profileBtn.onclick =
        () => {

            window.location.href =
                "profile.html";
        };
}


const forgotBtn =
    document.getElementById(
        "forgotBtn"
    );

if (forgotBtn) {

    forgotBtn.onclick =
        () => {

            window.location.href =
                "forgot.html";
        };
}


/* =====================================================
   IMPORT STUDENTS
===================================================== */

const importBtn =
    document.getElementById(
        "importBtn"
    );

const excelFile =
    document.getElementById(
        "excelFile"
    );

if (
    importBtn &&
    excelFile
) {

    importBtn.onclick =
        () => {

            excelFile.click();
        };

    excelFile.addEventListener(
        "change",
        async (event) => {

            const file =
                event.target.files[0];

            if (!file) {

                return;
            }

            try {

                const reader =
                    new FileReader();

                reader.onload =
                    async function (e) {

                        const data =
                            new Uint8Array(
                                e.target.result
                            );

                        const workbook =
                            XLSX.read(
                                data,
                                {
                                    type:
                                        "array"
                                }
                            );

                        const sheet =
                            workbook.Sheets[
                                workbook.SheetNames[0]
                            ];

                        const students =
                            XLSX.utils.sheet_to_json(
                                sheet
                            );

                        for (
                            const student
                            of students
                        ) {

                            if (
                                !student.registerNo
                            ) {

                                continue;
                            }

                            await set(
                                ref(
                                    db,
                                    "Students/" +
                                    student.registerNo
                                ),
                                {

                                    registerNo:
                                        student.registerNo,

                                    name:
                                        student.name ||
                                        "",

                                    department:
                                        student.department ||
                                        "",

                                    year:
                                        student.year ||
                                        "",

                                    section:
                                        student.section ||
                                        "",

                                    password:
                                        "class123",

                                    attendance:
                                        "Absent",

                                    classStatus:
                                        "Not Started"
                                }
                            );
                        }

                        alert(
                            "✅ Students Imported Successfully"
                        );

                        loadAttendanceCount();

                        checkStudentPresence();
                    };

                reader.readAsArrayBuffer(
                    file
                );

            } catch (error) {

                console.error(
                    error
                );

                alert(
                    "❌ Student import failed"
                );
            }
        }
    );
}


/* =====================================================
   SEARCH STUDENT
===================================================== */

const searchStudentBtn =
    document.getElementById("searchStudentBtn");

if (searchStudentBtn) {

    // Create the search panel
    const searchPanel = document.createElement("div");

    searchPanel.id = "studentSearchPanel";
    searchPanel.style.cssText = `
        display: none;
        margin-top: 20px;
        padding: 20px;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    `;

    searchPanel.innerHTML = `
        <h3>🔍 Search Student</h3>

        <label for="searchRegisterNo">
            Enter Register Number
        </label>

        <div style="
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 10px;
        ">
            <input
                type="text"
                id="searchRegisterNo"
                placeholder="Enter register number"
                style="
                    padding: 10px;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    flex: 1;
                    min-width: 180px;
                "
            >

            <button
                type="button"
                id="findStudentBtn"
                class="menu-btn"
            >
                Search
            </button>
        </div>

        <div id="studentSearchResult"
             style="margin-top: 20px;">
        </div>
    `;

    const content = document.querySelector(".content");

    if (content) {
        content.appendChild(searchPanel);
    }

    // Open or close the search panel
    searchStudentBtn.addEventListener("click", () => {

        const isHidden = searchPanel.style.display === "none";

        searchPanel.style.display = isHidden ? "block" : "none";

        if (isHidden) {
            document.getElementById("searchRegisterNo").focus();
        }
    });

    const findStudentBtn =
        document.getElementById("findStudentBtn");

    const registerInput =
        document.getElementById("searchRegisterNo");

    const resultBox =
        document.getElementById("studentSearchResult");

    async function searchStudent() {

        const registerNo = registerInput.value.trim();

        if (!registerNo) {
            resultBox.textContent =
                "Please enter a register number.";
            return;
        }

        resultBox.textContent = "Searching student...";

        findStudentBtn.disabled = true;

        try {

            // Students are stored using register number as the key
            const studentRef = ref(
                db,
                "Students/" + registerNo
            );

            const snapshot = await get(studentRef);

            if (!snapshot.exists()) {

                resultBox.textContent =
                    "Student not found. Check the register number.";

                return;
            }

            const student = snapshot.val();

            // Build the result safely using textContent
            resultBox.replaceChildren();

            const heading = document.createElement("h4");
            heading.textContent = "Student Details";
            resultBox.appendChild(heading);

            const fields = [
                ["Register Number",
                    student.registerNo || registerNo],
                ["Name", student.name || "Not available"],
                ["Department", student.department || "Not available"],
                ["Year", student.year || "Not available"],
                ["Section", student.section || "Not available"],
                ["Attendance", student.attendance || "Not available"]
            ];

            fields.forEach(([label, value]) => {

                const row = document.createElement("p");
                const strong = document.createElement("strong");

                strong.textContent = label + ": ";

                row.appendChild(strong);
                row.appendChild(
                    document.createTextNode(String(value))
                );

                resultBox.appendChild(row);
            });

        } catch (error) {

            console.error("Student search error:", error);

            resultBox.textContent =
                "Unable to search student. Check the database connection and permissions.";

        } finally {

            findStudentBtn.disabled = false;
        }
    }

    findStudentBtn.addEventListener("click", searchStudent);

    registerInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            searchStudent();
        }
    });
}

/* =====================================================
   UPDATE STUDENTS ATTENDANCE
===================================================== */

async function updateStudentsAttendance(
    attendanceStatus
) {

    try {

        const snapshot =
            await get(
                ref(
                    db,
                    "Students"
                )
            );

        if (
            !snapshot.exists()
        ) {

            return;
        }

        const department =
            departmentElement.value;

        const year =
            yearElement.value;

        const section =
            sectionElement.value;
            
const classSnapshot = await get(getClassRef());

const classStartTime = Number(
    classSnapshot.val()?.startTime || 0
);


        const promises = [];

        snapshot.forEach(
            (student) => {

                const data =
                    student.val();

                if (
                    data.department ===
                        department &&

                    String(data.year) ===
                        String(year) &&

                    data.section ===
                        section
                ) {

                    promises.push(
                        update(
                            ref(
                                db,
                                "Students/" +
                                student.key
                            ),
                            {

                                attendance:
                                    attendanceStatus,

                                classStatus:
                                    attendanceStatus ===
                                    "Present"
                                        ? "Started"
                                        : "Not Started"
                            }
                        )
                    );

                    
if (attendanceStatus === "Present" && classStartTime > 0) {

    const historyRef = ref(
        db,
        `AttendanceHistory/${student.key}/${classStartTime}`
    );

    promises.push(
        set(historyRef, {
            Subject: subjectElement.value,
            Status: "Present",
            Time: new Date().toLocaleString(),
            SessionStartTime: classStartTime
        })
    );
}

                }
            }
        );

        await Promise.all(
            promises
        );

        await loadAttendanceCount();

    } catch (error) {

        console.error(
            "Attendance update error:",
            error
        );
    }
}
/* =====================================================
   ATTENDANCE COUNT
===================================================== */

async function loadAttendanceCount() {

    try {

        const department =
            departmentElement.value;

        const year =
            yearElement.value;

        const section =
            sectionElement.value;

        if (
            !department ||
            !year ||
            !section
        ) {
            return;
        }

        const snapshot =
            await get(
                ref(
                    db,
                    "Students"
                )
            );

        let total = 0;
        let present = 0;
        let absent = 0;

        if (snapshot.exists()) {

            snapshot.forEach(
                (student) => {

                    const data =
                        student.val();

                    if (
                        String(data.department) ===
                            String(department) &&

                        String(data.year) ===
                            String(year) &&

                        String(data.section) ===
                            String(section)
                    ) {

                        total++;

                        if (
                            data.attendance ===
                            "Present"
                        ) {

                            present++;

                        } else {

                            absent++;
                        }
                    }
                }
            );
        }

        const totalElement =
            document.getElementById(
                "totalCount"
            );

        const presentElement =
            document.getElementById(
                "presentCount"
            );

        const absentElement =
            document.getElementById(
                "absentCount"
            );

        if (totalElement) {

            totalElement.innerHTML =
                total;
        }

        if (presentElement) {

            presentElement.innerHTML =
                present;
        }

        if (absentElement) {

            absentElement.innerHTML =
                absent;
        }

    } catch (error) {

        console.error(
            "Attendance count error:",
            error
        );
    }
}


/* =====================================================
   SELECTION CHANGE
===================================================== */

departmentElement.addEventListener(
    "change",
    () => {

        currentPeriodKey = null;

        automaticClass = false;

        loadAttendanceCount();

        checkAutomaticTimetable();

        checkStudentPresence();
    }
);


yearElement.addEventListener(
    "change",
    () => {

        currentPeriodKey = null;

        automaticClass = false;

        loadAttendanceCount();

        checkAutomaticTimetable();

        checkStudentPresence();
    }
);


sectionElement.addEventListener(
    "change",
    () => {

        currentPeriodKey = null;

        automaticClass = false;

        loadAttendanceCount();

        checkAutomaticTimetable();

        checkStudentPresence();
    }
);


/* =====================================================
   CHECK EXISTING CLASS
===================================================== */

async function checkCurrentClass() {

    try {

        const snapshot =
            await get(
                getClassRef()
            );

        if (
            !snapshot.exists()
        ) {

            return;
        }

        const data =
            snapshot.val();

        if (
            data.ClassStatus ===
                "Started" &&

            data.startTime
        ) {

            if (
                activeStatusElement
            ) {

                activeStatusElement.innerHTML =
                    "🟢 Active Class";
            }

            if (
                subjectElement
            ) {

                subjectElement.value =
                    data.subject || "";
            }

            if (
                facultyElement
            ) {

                facultyElement.value =
                    data.faculty || "";
            }

            startTimer(
                data.startTime
            );

            checkStudentPresence();

        } else {

            if (
                activeStatusElement
            ) {

                activeStatusElement.innerHTML =
                    "🔴 No Active Class";
            }

            stopTimer();
        }

    } catch (error) {

        console.error(
            "Current class error:",
            error
        );
    }
}


/* =====================================================
   LOGOUT
===================================================== */

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

if (logoutBtn) {

    logoutBtn.onclick =
        () => {

            const confirmLogout =
                confirm(
                    "Are you sure you want to logout?"
                );

            if (!confirmLogout) {

                return;
            }

            window.location.href =
                "login.html";
        };
}


/* =====================================================
   INITIALIZE PRESENCE UI
===================================================== */

createPresenceUI();


/* =====================================================
   INITIAL LOAD
===================================================== */

loadAttendanceCount();

checkCurrentClass();

startAutomaticSystem();

startPresenceMonitor();


/* =====================================================
   PAGE CLEANUP
===================================================== */

window.addEventListener(
    "beforeunload",
    () => {

        clearInterval(
            timerInterval
        );

        clearInterval(
            timetableInterval
        );

        clearInterval(
            presenceMonitorInterval
        );
    }
);


/* =====================================================
   FINAL LOG
===================================================== */

console.log(
    "===================================="
);

console.log(
    "✅ ClassGuard Dashboard Loaded"
);

console.log(
    "✅ Automatic Timetable Enabled"
);

console.log(
    "✅ Student Presence Monitor Enabled"
);

console.log(
    "✅ 2-Minute Offline Alert Enabled"
);

console.log(
    "===================================="
);