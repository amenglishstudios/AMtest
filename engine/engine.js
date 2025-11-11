/* -------------------------------------------------------------
   LOAD TEST DATA
------------------------------------------------------------- */
async function loadTest() {
    const path = window.TEST_PATH;
    const response = await fetch(path);
    const data = await response.json();
    window.TESTDATA = data;
    renderTest();
}
document.addEventListener("DOMContentLoaded", loadTest);


/* -------------------------------------------------------------
   RENDER TEST
------------------------------------------------------------- */
function renderTest() {
    const data = window.TESTDATA;
    const app = document.getElementById("app");

    let html = `<h1>${data.title}</h1>`;

    data.sections.forEach((section, sectionIndex) => {

        html += `<h2 class="section-title">${section.instructions || section.title || ""}</h2>`;

        /* ---------------------------------------------------------
           SAFE PASSAGE RENDERING (FIXED)
           No HTML from JSON ever enters a template literal.
        --------------------------------------------------------- */
        if (section.passage) {
            const passageId = `passage_${sectionIndex}_${Math.random().toString(36).slice(2)}`;
            html += `<div class="passage" id="${passageId}"></div>`;

            // Defer HTML injection until after template literal is closed
            setTimeout(() => {
                const container = document.getElementById(passageId);

                if (!container) return;

                if (typeof section.passage === "string") {
                    container.innerHTML = section.passage;
                } else {
                    // Passage with labeled paragraphs (A, B, C…)
                    let inner = "";
                    Object.entries(section.passage).forEach(([label, text]) => {
                        inner += `<p><b>${label}:</b> ${text}</p>`;
                    });
                    container.innerHTML = inner;
                }
            });
        }

        /* ---------------------------------------------------------
           TRUE / FALSE
        --------------------------------------------------------- */
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

        /* ---------------------------------------------------------
           MULTIPLE CHOICE
        --------------------------------------------------------- */
        if (section.type === "mc") {
            section.items.forEach((item, i) => {
                html += `
                <div class="question">
                    <div class="question-number">${i + 1}. ${item.q}</div>
                    <select id="q_mc_${sectionIndex}_${i}">
                        <option value="">---</option>
                        ${item.options
                            .map((o, idx) => `<option value="${String.fromCharCode(65 + idx)}">${o}</option>`)
                            .join("")}
                    </select>
                </div>`;
            });
        }

        /* ---------------------------------------------------------
           SEQUENCE
        --------------------------------------------------------- */
        if (section.type === "sequence") {
            section.items.forEach((item, i) => {
                html += `
                <div class="question">
                    <div class="question-number">${i + 1}. ${item.q}</div>
                    <input type="text" id="q_seq_${sectionIndex}_${i}">
                </div>`;
            });
        }

        /* ---------------------------------------------------------
           MATCHING (MA)
        --------------------------------------------------------- */
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

        /* ---------------------------------------------------------
           CLOZE
        --------------------------------------------------------- */
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


/* -------------------------------------------------------------
   GRADE TEST
------------------------------------------------------------- */
function gradeTest() {
    const data = window.TESTDATA;

    let correct = 0;
    let total = 0;

    data.sections.forEach((section, sectionIndex) => {
        section.items.forEach((item, i) => {
            total++;

            // TRUE / FALSE
            if (section.type === "tf") {
                const user = document.getElementById(`q_tf_${sectionIndex}_${i}`).value;
                if (user === item.answer) correct++;
            }

            // MULTIPLE CHOICE
            if (section.type === "mc") {
                const user = document.getElementById(`q_mc_${sectionIndex}_${i}`).value;
                if (user === item.answer) correct++;
            }

            // SEQUENCE
            if (section.type === "sequence") {
                const user = document.getElementById(`q_seq_${sectionIndex}_${i}`).value.trim().toLowerCase();
                if (user === item.answer.toLowerCase()) correct++;
            }

            // MATCHING
            if (section.type === "ma") {
                const user = document.getElementById(`q_ma_${sectionIndex}_${i}`).value;
                if (user === item.answer) correct++;
            }

            // CLOZE
            if (section.type === "cloze") {
                const user = document.getElementById(`q_cloze_${sectionIndex}_${i}`).value.trim().toLowerCase();
                if (user === item.answer.toLowerCase()) correct++;
            }

        });
    });

    document.getElementById("scorebox").innerHTML =
        `Score: ${correct} / ${total}`;
}
