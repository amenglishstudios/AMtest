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

    data.sections.forEach(section => {

        html += `<h2 class="section-title">${section.instructions || section.title || ""}</h2>`;

       // Render passage — supports full HTML formatting
if (section.passage) {
    html += `<div class="passage">`;

    if (typeof section.passage === "string") {
        // Detect if passage contains HTML tags
        const containsHTML = /<\/?[a-z][\s\S]*>/i.test(section.passage);

        if (containsHTML) {
            html += section.passage;  // raw HTML allowed
        } else {
            html += section.passage.replace(/\n/g, "<br>");
        }
    } else {
        // Passage with labeled subsections (A, B, C…)
        Object.entries(section.passage).forEach(([label, text]) => {
            const containsHTML = /<\/?[a-z][\s\S]*>/i.test(text);
            html += `<p><b>${label}:</b> ${containsHTML ? text : text.replace(/\n/g, "<br>")}</p>`;
        });
    }

    html += `</div>`;
}

        // True/False
        if (section.type === "tf") {
            section.items.forEach((item, i) => {
                html += `
                <div class="question">
                    <div class="question-number">${i + 1}. ${item.q}</div>
                    <select id="q_tf_${i}">
                        <option value="">---</option>
                        <option value="T">True</option>
                        <option value="F">False</option>
                    </select>
                </div>`;
            });
        }

        // Multiple Choice
        if (section.type === "mc") {
            section.items.forEach((item, i) => {
                html += `
                <div class="question">
                    <div class="question-number">${i + 1}. ${item.q}</div>
                    <select id="q_mc_${i}">
                        <option value="">---</option>
                        ${item.options.map((o, idx) => `<option value="${String.fromCharCode(65+idx)}">${o}</option>`).join("")}
                    </select>
                </div>`;
            });
        }

        // Sequence
        if (section.type === "sequence") {
            section.items.forEach((item, i) => {
                html += `
                <div class="question">
                    <div class="question-number">${i + 1}. ${item.q}</div>
                    <input type="text" id="q_seq_${i}">
                </div>`;
            });
        }

        // Matching (MA)
        if (section.type === "ma") {
            section.items.forEach((item, i) => {
                html += `
                <div class="question">
                    <div class="question-number">${i + 1}. ${item.q}</div>
                    <select id="q_ma_${i}">
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

        // Cloze
        if (section.type === "cloze") {
            section.items.forEach((item, i) => {
                html += `
                <div class="question">
                    <div class="question-number">${i + 1}. ${item.q}</div>
                    <input type="text" id="q_cloze_${i}">
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
function gradeTest() {
    const data = window.TESTDATA;

    let correct = 0;
    let total = 0;

    data.sections.forEach(section => {
        section.items.forEach((item, i) => {
            total++;

            // True/False
            if (section.type === "tf") {
                const user = document.getElementById(`q_tf_${i}`).value;
                if (user === item.answer) correct++;
            }

            // MC
            if (section.type === "mc") {
                const user = document.getElementById(`q_mc_${i}`).value;
                if (user === item.answer) correct++;
            }

            // Sequence
            if (section.type === "sequence") {
                const user = document.getElementById(`q_seq_${i}`).value.trim().toLowerCase();
                if (user === item.answer.toLowerCase()) correct++;
            }

            // Matching
            if (section.type === "ma") {
                const user = document.getElementById(`q_ma_${i}`).value;
                if (user === item.answer) correct++;
            }

            // Cloze
            if (section.type === "cloze") {
                const user = document.getElementById(`q_cloze_${i}`).value.trim().toLowerCase();
                if (user === item.answer.toLowerCase()) correct++;
            }

        });
    });

    document.getElementById("scorebox").innerHTML =
        `Score: ${correct} / ${total}`;
}
