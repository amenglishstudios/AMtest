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
        html += `<h2 class="section-title">${section.title}</h2>`;
        if (section.passage) {
            html += `<div class="passage">${section.passage}</div>`;
        }

        section.questions.forEach(q => {
            html += `<div class="question">
                <div class="question-number">${q.number}. ${q.text}</div>`;

            if (q.type === "mc" || q.type === "tf") {
                html += `<select id="q${q.number}">
                    <option value="">---</option>`;
                q.choices.forEach((c, i) => {
                    html += `<option value="${i}">${c}</option>`;
                });
                html += `</select>`;
            }

            if (q.type === "cloze") {
                html += `<input type="text" id="q${q.number}" />`;
            }

            if (q.type === "ma") {
                html += `<select id="q${q.number}">
                    <option value="">---</option>`;
                q.options.forEach(opt => {
                    html += `<option value="${opt}">${opt}</option>`;
                });
                html += `</select>`;
            }

            html += `</div>`;
        });

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
        section.questions.forEach(q => {
            total++;

            let response = document.getElementById("q" + q.number).value;
            if (q.type === "mc" || q.type === "tf") {
                if (parseInt(response) === q.answerIndex) correct++;
            }

            if (q.type === "cloze") {
                let ans = response.trim().toLowerCase();
                if (q.accepted.map(a => a.toLowerCase()).includes(ans)) correct++;
            }

            if (q.type === "ma") {
                if (response === q.correct) correct++;
            }
        });
    });

    document.getElementById("scorebox").innerHTML =
        `Score: ${correct} / ${total}`;
}
