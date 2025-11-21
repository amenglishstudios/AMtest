/* AMtest engine.js — render, grade, and email via Web3Forms */

// ==============================
// CONFIG
// ==============================
const WEB3FORMS_ACCESS_KEY = "001de0f4-2ade-44b4-8915-9ef482cda1da"; // your token
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

// Matching-letter choices for MA sections (now A–H)
const MATCHING_CHOICES = ["A", "B", "C", "D", "E", "F", "G", "H"];

// ==============================
// LOAD TEST DATA
// ==============================
async function loadTest() {
  try {
    const path = window.TEST_PATH;
    const response = await fetch(path, { cache: "no-store" });
    const data = await response.json();
    window.TESTDATA = data;
    renderTest();
  } catch (err) {
    const app = document.getElementById("app");
    if (app) {
      app.innerHTML = `<div style="color:red">Failed to load test data: ${String(
        err
      )}</div>`;
    }
  }
}
document.addEventListener("DOMContentLoaded", loadTest);

// ==============================
// RENDER TEST
// ==============================
function renderTest() {
  const data = window.TESTDATA;
  const app = document.getElementById("app");
  if (!data || !app) return;

  let html = "";
  html += `<h1>${escapeHTML(data.title || "Untitled Test")}</h1>`;

  // Student name box
  html += `
    <div class="student-block" style="margin: 12px 0 24px 0;">
      <label for="student_name" style="font-weight:600; margin-right:8px;">Student Name:</label>
      <input id="student_name" type="text" placeholder="First Last" style="padding:6px; font-size:16px; min-width:260px;">
    </div>
  `;

  // Sections
  (data.sections || []).forEach((section, sIdx) => {
    const heading = section.instructions || section.title || "";
    if (heading) {
      html += `<h2 class="section-title">${escapeHTML(heading)}</h2>`;
    }

    // Passage (string with or without HTML, OR object with A/B/C… labeled parts)
    if (section.passage) {
      html += `<div class="passage">`;
      if (typeof section.passage === "string") {
        const containsHTML = /<\/?[a-z][\s\S]*>/i.test(section.passage);
        html += containsHTML
          ? section.passage
          : escapeHTML(section.passage).replace(/\n/g, "<br>");
      } else {
        // object map like { A: "text", B: "text" }
        Object.entries(section.passage).forEach(([label, text]) => {
          const containsHTML = /<\/?[a-z][\s\S]*>/i.test(text);
          const safe = containsHTML
            ? text
            : escapeHTML(String(text)).replace(/\n/g, "<br>");
          html += `<p><b>${escapeHTML(label)}:</b> ${safe}</p>`;
        });
      }
      html += `</div>`;
    }

    // Items
    const items = section.items || [];
    if (section.type === "tf") {
      items.forEach((item, i) => {
        html += `
          <div class="question">
            <div class="question-number">${i + 1}. ${escapeHTML(
              item.q || ""
            )}</div>
            <select id="q_tf_${sIdx}_${i}">
              <option value="">---</option>
              <option value="T">True</option>
              <option value="F">False</option>
            </select>
          </div>
        `;
      });
    } else if (section.type === "mc") {
      items.forEach((item, i) => {
        const opts = (item.options || [])
          .map((o, idx) => {
            const letter = String.fromCharCode(65 + idx); // A, B, C...
            return `<option value="${letter}">${escapeHTML(String(o))}</option>`;
          })
          .join("");
        html += `
          <div class="question">
            <div class="question-number">${i + 1}. ${escapeHTML(
              item.q || ""
            )}</div>
            <select id="q_mc_${sIdx}_${i}">
              <option value="">---</option>
              ${opts}
            </select>
          </div>
        `;
      });
    } else if (section.type === "sequence") {
      items.forEach((item, i) => {
        html += `
          <div class="question">
            <div class="question-number">${i + 1}. ${escapeHTML(
              item.q || ""
            )}</div>
            <input type="text" id="q_seq_${sIdx}_${i}">
          </div>
        `;
      });
    } else if (section.type === "ma") {
      // Matching / outline (now supports A–H)
      items.forEach((item, i) => {
        const optionsHTML =
          '<option value="">---</option>' +
          MATCHING_CHOICES.map(
            (letter) => `<option value="${letter}">${letter}</option>`
          ).join("");

        html += `
          <div class="question">
            <div class="question-number">${i + 1}. ${escapeHTML(
              item.q || ""
            )}</div>
            <select id="q_ma_${sIdx}_${i}">
              ${optionsHTML}
            </select>
          </div>
        `;
      });
    } else if (section.type === "cloze") {
      items.forEach((item, i) => {
        html += `
          <div class="question">
            <div class="question-number">${i + 1}. ${escapeHTML(
              item.q || ""
            )}</div>
            <input type="text" id="q_cloze_${sIdx}_${i}">
          </div>
        `;
      });
    }
  });

  // Submit / Score
  html += `
    <button class="submit-btn" id="submit_btn">Submit Test</button>
    <div id="scorebox" class="score-box"></div>
    <div id="sendstatus" style="margin-top:12px; font-size:14px;"></div>
  `;

  app.innerHTML = html;

  const btn = document.getElementById("submit_btn");
  if (btn) {
    btn.addEventListener("click", async () => {
      const result = gradeTest();
      showScore(result);
      await sendResults(result);
    });
  }
}

// ==============================
// GRADE TEST
// ==============================
function gradeTest() {
  const data = window.TESTDATA || { sections: [] };
  const studentName =
    (document.getElementById("student_name")?.value || "").trim();

  let correct = 0;
  let total = 0;

  const details = [];

  (data.sections || []).forEach((section, sIdx) => {
    const items = section.items || [];
    items.forEach((item, i) => {
      total += 1;

      let user = "";
      let isCorrect = false;

      if (section.type === "tf") {
        user = getVal(`q_tf_${sIdx}_${i}`);
        const ans = String(item.answer || "").trim().toUpperCase();
        isCorrect = user.toUpperCase() === ans;
      } else if (section.type === "mc") {
        user = getVal(`q_mc_${sIdx}_${i}`);
        const ans = String(item.answer || "").trim().toUpperCase();
        isCorrect = user.toUpperCase() === ans;
      } else if (section.type === "sequence") {
        user = getVal(`q_seq_${sIdx}_${i}`).trim().toLowerCase();
        const ans = String(item.answer || "").trim().toLowerCase();
        isCorrect = user === ans;
      } else if (section.type === "ma") {
        // Matching A–H
        user = getVal(`q_ma_${sIdx}_${i}`);
        const ans = String(item.answer || "").trim().toUpperCase();
        isCorrect = user.toUpperCase() === ans;
      } else if (section.type === "cloze") {
        user = getVal(`q_cloze_${sIdx}_${i}`).trim().toLowerCase();
        const ans = String(item.answer || "").trim().toLowerCase();
        isCorrect = user === ans;
      }

      if (isCorrect) correct += 1;

      details.push({
        section: section.type || "",
        number: i + 1,
        question: item.q || "",
        response: user,
        answer: item.answer || "",
        correct: isCorrect,
      });
    });
  });

  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  return {
    title: window.TESTDATA?.title || "Untitled Test",
    student_name: studentName,
    correct,
    total,
    percent,
    details,
  };
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? String(el.value || "") : "";
}

function showScore(result) {
  const sb = document.getElementById("scorebox");
  if (!sb) return;

  if (!result.student_name) {
    sb.innerHTML = `Score: ${result.correct} / ${result.total} (${result.percent}%). <span style="color:#b00">Please enter your name before submitting so your teacher receives your results.</span>`;
  } else {
    sb.textContent = `Score: ${result.correct} / ${result.total} (${result.percent}%)`;
  }
}

// ==============================
// SEND RESULTS (Web3Forms)
// ==============================
async function sendResults(result) {
  const status = document.getElementById("sendstatus");
  if (status) status.textContent = "";

  // If no name, don't email (avoid anonymous noise)
  if (!result.student_name) {
    if (status) {
      status.textContent =
        "Enter your name and click Submit again to send results to your teacher.";
    }
    return;
  }

  try {
    const fd = new FormData();
    fd.append("access_key", WEB3FORMS_ACCESS_KEY);
    fd.append("subject", `Student Test Submission — ${result.title}`);
    fd.append("from_name", "AM English Test");
    // fd.append("reply_to", "mdmanning@gbaps.org"); // optional

    fd.append("student_name", result.student_name);
    fd.append("test_title", result.title);
    fd.append(
      "score",
      `${result.correct} / ${result.total} (${result.percent}%)`
    );

    fd.append("details_json", JSON.stringify(result.details));

    const lines = result.details
      .map(
        (d) =>
          `${d.section} Q${d.number}: ${
            d.correct ? "✓" : "✗"
          } — resp: "${d.response}" / ans: "${d.answer}"`
      )
      .join("\n");
    fd.append("details_text", lines);

    const res = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    if (data && data.success) {
      if (status) status.textContent = "Results sent to the teacher successfully.";
    } else {
      if (status) {
        status.textContent = `Could not send results (Web3Forms): ${
          data?.message || "Unknown error"
        }`;
      }
    }
  } catch (err) {
    if (status) {
      status.textContent = `Error sending results: ${String(err)}`;
    }
  }
}

// ==============================
// UTILS
// ==============================
function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
