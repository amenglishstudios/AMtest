//-----------------------------------------------------------
// LOAD TEST
//-----------------------------------------------------------

async function loadTest() {
    const res = await fetch(window.TEST_PATH);
    const data = await res.json();
    window.TESTDATA = data;
    renderTest(data);
}

window.onload = loadTest;


//-----------------------------------------------------------
// RENDER TEST
//-----------------------------------------------------------

function renderTest(data) {
    const app = document.getElementById("app");
    let html = "";

    data.sections.forEach((sec, secIndex) => {
        html += `<div class="card">
            <h2>${sec.title}</h2>`;

        // Reading passage
        if (sec.passage) {
            html += `<div class="passage-box"><p>${sec.passage}</p></div>`;
        }

        // Questions
        sec.questions.forEach((q, qIndex) => {
            const qid = `${secIndex}_${qIndex}`;

            html += `<div class="question-block">
                        <p><strong>${q.number}. </strong>${q.text}</p>`;

            // Multiple Choice / True False
            if (q.type === "mc" || q.type === "tf") {
                q.choices.forEach((choice, index) => {
                    html += `
                    <div class="choice" onclick="selectChoice('${qid}', ${index}, this)">
                        ${choice}
                    </div>`;
                });
            }

            // Matching
            if (q.type === "ma") {
                html += `<select id="${qid}_ma">
                            <option value="">---</option>`;
                q.options.forEach(opt => {
                    html += `<option value="${opt}">${opt}</option>`;
                });
                html += `</select>`;
            }

            // Cloze
            if (q.type === "cloze") {
                html += `<input id="${qid}_cloze" class="cloze-input" type="text" placeholder="Type answer...">`;
            }

            html += `</div>`; // close question block
        });

        html += `</div>`; // close section card
    });

    // Submit Button
    html += `
        <div class="card">
            <button class="submit-btn" onclick="submitTest()">Submit Test</button>
        </div>`;

    app.innerHTML = html;
}


//-----------------------------------------------------------
// ANSWER SELECTION (MC + TF)
//-----------------------------------------------------------

let ANSWERS = {};

function selectChoice(qid, index, element) {
    ANSWERS[qid] = index;

    // Remove highlight from siblings
    const siblings = element.parentNode.querySelectorAll(".choice");
    siblings.forEach(s => s.classList.remove("selected"));

    // Highlight this one
    element.classList.add("selected");
}



//-----------------------------------------------------------
// SCORING LOGIC
//-----------------------------------------------------------

function scoreTest() {
    const data = window.TESTDATA;
    let score = 0;
    let total = 0;
    let studentAnswers = [];

    data.sections.forEach((sec, secIndex) => {
        sec.questions.forEach((q, qIndex) => {
            const qid = `${secIndex}_${qIndex}`;
            total += 1;

            let correct = false;
            let studentAnswer = "";

            // MC / TF
            if (q.type === "mc" || q.type === "tf") {
                studentAnswer = ANSWERS[qid];
                correct = (studentAnswer == q.answerIndex);
            }

            // Matching
            if (q.type === "ma") {
                const val = document.getElementById(`${qid}_ma`).value;
                studentAnswer = val;
                correct = (val === q.correct);
            }

            // Cloze
            if (q.type === "cloze") {
                const val = document.getElementById(`${qid}_cloze`).value.trim();
                studentAnswer = val;

                // D = multiple allowed answers
                const allowed = q.accepted.map(a => a.toLowerCase().trim());
                correct = allowed.includes(val.toLowerCase().trim());
            }

            if (correct) score += 1;

            studentAnswers.push({
                number: q.number,
                question: q.text,
                answer: studentAnswer,
                correct: correct
            });
        });
    });

    return { score, total, studentAnswers };
}



//-----------------------------------------------------------
// SUBMIT TEST
//-----------------------------------------------------------

function submitTest() {
    const result = scoreTest();
    showScore(result);
    sendResults(result);
}



//-----------------------------------------------------------
// SHOW SCORE TO STUDENT
//-----------------------------------------------------------

function showScore(result) {
    const app = document.getElementById("app");

    const html = `
    <div class="card">
        <div class="score-box">
            <strong>Your Score:</strong> ${result.score} / ${result.total}
        </div>
    </div>

    <div class="card">
        <p>Your results have been sent.</p>
    </div>
    `;

    app.innerHTML = html;
}



//-----------------------------------------------------------
// SEND TO EMAIL (Web3Forms)
//-----------------------------------------------------------

function sendResults(result) {
    const payload = {
        access_key: "001de0f4-2ade-44b4-8915-9ef482cda1da",
        email: "mdmanning@gbaps.org",
        subject: "RL1T5 Test Submission",
        score: `${result.score} / ${result.total}`,
        answers: JSON.stringify(result.studentAnswers, null, 2)
    };

    fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
    });
}
