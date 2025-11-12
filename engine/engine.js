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

    let html = `<h1>${data.title}</h1>`;

    // Student Name field
    html += `
        <div class="question">
            <div class="question-number"><b>Your Name:</b></div>
            <input type="text" id="student_name" placeholder="Enter your full name">
        </div>
    `;

    data.sections.forEach((section, sectionIndex) => {

        html += `<h2 class="section-title">${section.instructions || section.title || ""}</h2>`;

        // Render passage (supports full HTML or object with A/B/C subsections)
        if (section.passage) {
            html += `<div class="passage">`;

            if (typeof section.passage === "string") {
                const containsHTML = /<\/?[a-z][\s\S]*>/i.test(section.passage);
                html += containsHTML
                    ? section.passage
                    : section.passage.replace(/\n/g, "<br>");
            } else {
                Object.entries(section.passage).forEach(([label, text]) => {
                    const containsHTML = /<\/?[a-z][\s\S]*>/i.test(text);
                    html += `<p><b>${label}:</b> ${
                        containsHTML ? text : text.replace(/\n/g, "<br>")
                    }</p>`;
                });
            }

            html += `</div>`;
        }

        // ---------------------------------------------------------
        // TRUE/FALSE
        // ---------------------------------------------------------
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

        // ---------------------------------------------------------
        // MULTIPLE CHOICE
        // ---------------------------------------------------------
        if (section.type === "mc") {
            section.items.forEach((item, i) => {
                const opts = item.options
                    .map(
                        (o, idx) =>
                            `<option value="${String.fromCharCode(65 + idx)}">${o}</option>`
                    )
                    .join("");

                html += `
                <div class="question">
                    <div class="question-number">${i + 1}. ${item.q}</div>
                    <select id="q_mc_${sectionIndex}_${i}">
                        <option value="">---</option>
                        ${opts}
                    </select>
                </div>`;
            });
        }

        // ---------------------------------------------------------
        // SEQUENCE
        // ---------------------------------------------------------
        if (section.type === "sequence") {
            section.items.forEach((item, i) => {
                html += `
                <div class="question">
                    <div class="question-number">${i + 1}. ${item.q}</div>
                    <input type="text" id="q_seq_${sectionIndex}_${i}">
                </div>`;
            });
        }

        // ---------------------------------------------------------
        // MATCHING
        // ---------------------------------------------------------
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

        // ---------------------------------------------------------
        // CLOZE
        // ---------------------------------------------------------
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
// GRADE + EMAIL SUBMISSION
// -------------------------------------------------------------
async function gradeTest() {
    const data = window.TESTDATA;
    let correct = 0;
    let total = 0;
    let answers = [];

    const studentName =
        document.getElementById("student_name").value.trim() ||
        "No name provided";

    data.sections.forEach((section, sIndex) => {
        section.items.forEach((item, i) => {
            total++;
            let userAnswer = "";
            let correctAnswer = item.answer;

            // T/F
            if (section.type === "tf") {
                userAnswer = document.getElementById(
                    `q_tf_${sIndex}_${i}`
                ).value;
                if (userAnswer === correctAnswer) correct++;
            }

            // Multiple Choice
            if (section.type === "mc") {
                userAnswer = document.getElementById(
                    `q_mc_${sIndex}_${i}`
                ).value;
                if (userAnswer === correctAnswer) correct++;
            }

            // Sequence
            if (section.type === "sequence") {
                userAnswer = document
                    .getElementById(`q_seq_${sIndex}_${i}`)
                    .value.trim()
                    .toLowerCase();
                if (userAnswer === correctAnswer.toLowerCase()) correct++;
            }

            // Matching
            if (section.type === "ma") {
                userAnswer = document.getElementById(
                    `q_ma_${sIndex}_${i}`
                ).value;
                if (userAnswer === correctAnswer) correct++;
            }

            // Cloze
            if (section.type === "cloze") {
                userAnswer = document
                    .getElementById(`q_cloze_${sIndex}_${i}`)
                    .value.trim()
                    .toLowerCase();
                if (userAnswer === correctAnswer.toLowerCase()) correct++;
            }

            answers.push(
                `Q${i + 1}: ${item.q}\nStudent: ${
                    userAnswer || "(blank)"
                }\nCorrect: ${correctAnswer}\n`
        });
    });

    document.getElementById("scorebox").innerHTML = `Score: ${correct} / ${total}`;

    // ---------------------------------------------------------
    // SEND RESULTS TO WEB3FORMS
    // ---------------------------------------------------------
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
