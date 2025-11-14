// exam-loader.js
// Sets window.TEST_PATH based on ?test=XYZ in the URL
// and updates the page title. engine.js will then load that JSON.

(function () {
  const params = new URLSearchParams(window.location.search);
  const testName = params.get("test") || "RL1T5"; // default test if none specified

  // JSON files are expected at tests/<TEST_NAME>.json
  // e.g. tests/RL1T5.json, tests/RL1T6.json
  window.TEST_NAME = testName;
  window.TEST_PATH = "tests/" + testName + ".json";

  // Optional: set browser tab title to include the test code
  document.title = "AM English – " + testName;
})();
