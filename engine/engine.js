// -------------------------------------------------------------
// LOAD TEST DATA
// -------------------------------------------------------------
async function loadTest() {
    const path = window.TEST_PATH;
    const response = await fetch(path);
    const data = await response.json();
    window.TESTDATA = data;
    renderTest();
}
document.addEventListener("DOMContentLoaded", loadTest);

// -------------------------------------------------------------
// RENDER TEST
// -------------------------------------------------------------
function renderTest() {
    const data = window.TESTDATA;
    const app = document.getElementById("app");

    // Student Name Field
html += `
    <div class="question">
        <div class="question-number"><b>Your Name:</b></div>
        <input type="text" id="student_name" placeholder="Enter your full name">
    </div>
`;


    data.sections.forEach((section, sectionIndex) => {

        html += `<h2 class="section-title">${section.instructions || section.title || ""}</h2>`;

        // ---- PASSAGE SUPPORTS FULL HTML ----
        if (section.passage) {
            const passageId = `passage_${sectionIndex}`;
            html += `<div class="passage" id="${passageId}"></div>`;

            // Defer DOM insertion to ensure container exists
            Promise.resolve().then(() => {
                const el = document.getElementById(passageId);
                if (!el) return;

                // String passage: may contain HTML
                if (typeof section.passage === "string") {
                    el.innerHTML = section.passage;
                }

                // Object passage with labeled sections (A, B, C…)
                else if (typeof section.passage === "object") {
                    let inner = "";
                    Object.entries(section.passage).forEach(([label, text]) => {
                        inner += `<p><b>${label}:</b> ${text}</p>`;
                    });
                    el.innerHTML = inner;
                }
            });
        }

        // ---- TRUE/FALSE ----
        if (section.type === "tf") {
            section.items.forEach((item, i) => {
                html += `
                <div class="question">
                    <div class="question-number">${i + 1}. ${item.q}</div>
                    <select id="q_tf_${sectionIndex}_${i}">
                        <option value="">---</option>
                        <option value="T">True</option>
                        <option value="F">False</option>
                    </select>
                </div>`;
            });
        }

        // ---- MULTIPLE CHOICE ----
        if (section.type === "mc") {
            section.items.forEach((item, i) => {
                html += `
                <div class="question">
                    <div class="question-number">${i + 1}. ${item.q}</div>
                    <select id="q_mc_${sectionIndex}_${i}">
                        <option value="">---</option>
                        ${item.options
                            .map((o, idx) =>
                                `<option value="${String.fromCharCode(65 + idx)}">${o}</option>`
                            )
                            .join("")}
                    </select>
                </div>`;
            });
        }

        // ---- SEQUENCE ----
        if (section.type === "sequence") {
            section.items.forEach((item, i) => {
                html += `
                <div class="question">
                    <div class="question-number">${i + 1}. ${item.q}</div>
                    <input type="text" id="q_seq_${sectionIndex}_${i}">
                </div>`;
            });
        }

        // ---- MATCHING (MA) ----
        if (section.type === "ma") {
            section.items.forEach((item, i) => {
                html += `
                <div class="question">
                    <div class="question-number">${i + 1}. ${item.q}</div>
                    <select id="q_ma_${sectionIndex}_${i}">
                        <option value="">---</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="E">E</option>
                    </select>
                </div>`;
            });
        }

        // ---- CLOZE ----
        if (section.type === "cloze") {
            section.items.forEach((item, i) => {
                html += `
                <div class="question">
                    <div class="question-number">${i + 1}. ${item.q}</div>
                    <input type="text" id="q_cloze_${sectionIndex}_${i}">
                </div>`;
            });
        }

    });

    html += `<button class="submit-btn" onclick="gradeTest()">Submit Test</button>`;
    html += `<div id="scorebox" class="score-box"></div>`;

    app.innerHTML = html;
}

// -------------------------------------------------------------
// GRADE TEST
// -------------------------------------------------------------
async function gradeTest() {
    const data = window.TESTDATA;

    let correct = 0;
    let total = 0;
    let answers = [];

    // Get student name
    const studentName = document.getElementById("student_name").value.trim() || "No name provided";

    data.sections.forEach((section, sIndex) => {
        section.items.forEach((item, i) => {
            total++;

            let userAnswer = "";
            let correctAnswer = item.answer;

            if (section.type === "tf") {
                userAnswer = document.getElementById(`q_tf_${i}`).value;
                if (userAnswer === correctAnswer) correct++;
            }

            if (section.type === "mc") {
                userAnswer = document.getElementById(`q_mc_${i}`).value;
                if (userAnswer === correctAnswer) correct++;
            }

            if (section.type === "sequence") {
                userAnswer = document.getElementById(`q_seq_${i}`).value.trim().toLowerCase();
                if (userAnswer === correctAnswer.toLowerCase()) correct++;
            }

            if (section.type === "ma") {
                userAnswer = document.getElementById(`q_ma_${i}`).value;
                if (userAnswer === correctAnswer) correct++;
            }

            if (section.type === "cloze") {
                userAnswer = document.getElementById(`q_cloze_${i}`).value.trim().toLowerCase();
                if (userAnswer === correctAnswer.toLowerCase()) correct++;
            }

            answers.push(
                `Q${i + 1}: ${item.q}\nStudent: ${userAnswer || "(blank)"}\nCorrect: ${correctAnswer}\n`
            );
        });
    });

    document.getElementById("scorebox").innerHTML =
        `Score: ${correct} / ${total}`;

    //
    // SEND RESULTS TO WEB3FORMS
    //
    const formData = new FormData();
    formData.append("access_key", "001de0f4-2ade-44b4-8915-9ef482cda1da");
    formData.append("subject", `${data.title} Submission`);
    formData.append("Student Name", studentName);
    formData.append("Score", `${correct} / ${total}`);
    formData.append("Details", answers.join("\n\n"));

    try {
        await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData
        });

        alert("Submission sent. Thank you!");
    } catch (err) {
        alert("Error sending your submission. Please tell your teacher.");
    }
}

            // True/False
            if (section.type === "tf") {
                const user = document.getElementById(`q_tf_${sectionIndex}_${i}`).value;
                if (user === item.answer) correct++;
            }

            // Multiple choice
            if (section.type === "mc") {
                const user = document.getElementById(`q_mc_${sectionIndex}_${i}`).value;
                if (user === item.answer) correct++;
            }

            // Sequence
            if (section.type === "sequence") {
                const user = document
                    .getElementById(`q_seq_${sectionIndex}_${i}`)
                    .value.trim()
                    .toLowerCase();
                if (user === item.answer.toLowerCase()) correct++;
            }

            // Matching
            if (section.type === "ma") {
                const user = document.getElementById(`q_ma_${sectionIndex}_${i}`).value;
                if (user === item.answer) correct++;
            }

            // Cloze
            if (section.type === "cloze") {
                const user = document
                    .getElementById(`q_cloze_${sectionIndex}_${i}`)
                    .value.trim()
                    .toLowerCase();
                if (user === item.answer.toLowerCase()) correct++;
            }
        });
    });

    document.getElementById("scorebox").innerHTML =
        `Score: ${correct} / ${total}`;
}
