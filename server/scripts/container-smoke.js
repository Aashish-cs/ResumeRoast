// Exercises real HTTP, MongoDB, S3 SDK transport, PDF extraction and forked workers.
// The isolated compose.test stack uses local S3 emulation and explicit demo AI.
const assert = require("node:assert/strict");
const PDFDocument = require("pdfkit");
const base = process.env.E2E_BASE_URL || "http://localhost:5174";
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(base)) throw new Error("Container smoke test requires a local disposable stack");
async function main() {
  const pdf = new PDFDocument(); const chunks = [];
  const ready = new Promise(resolve => {pdf.on("data", c => chunks.push(c)); pdf.on("end", resolve);});
  pdf.text("SYNTHETIC TEST RESUME\nTest Engineer\nSummary: Built JavaScript and Node.js services, developed React interfaces and automated testing pipelines.\nExperience: Implemented reliable queues and secure authentication with MongoDB.\nEducation: Bachelor of Computer Science.\nSkills: JavaScript, React, Node.js, Express, MongoDB, Docker, AWS S3."); pdf.end(); await ready;
  const response = await fetch(`${base}/api/auth/signup`, {method: "POST", headers: {Origin: base, "Content-Type": "application/json"}, body: JSON.stringify({name: "Container Test", email: `container-${Date.now()}@example.test`, password: "ContainerTest123!", securityQuestion: "Test?", securityAnswer: "Synthetic"})});
  assert.equal(response.status, 201, await response.text());
  const cookie = response.headers.get("set-cookie").split(";")[0];
  const form = new FormData(); form.append("resume", new Blob(chunks, {type: "application/pdf"}), "synthetic.pdf");
  const started = performance.now();
  const upload = await fetch(`${base}/api/analyses`, {method: "POST", headers: {Origin: base, Cookie: cookie}, body: form});
  const admissionMs = Math.round(performance.now() - started);
  const payload = await upload.json(); assert.equal(upload.status, 202, JSON.stringify(payload));
  let result;
  for (let i = 0; i < 90; i++) {
    const status = await fetch(`${base}/api/analyses/${payload.analysis.id}`, {headers: {Cookie: cookie}});
    assert.equal(status.status, 200); result = (await status.json()).analysis;
    if (result.status === "completed" || result.status === "failed") break;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.equal(result.status, "completed", JSON.stringify(result));
  assert.equal(typeof result.score, "number"); assert.ok(result.rewrite);
  const download = await fetch(`${base}/api/analyses/${result.id}/download/pdf`, {headers: {Cookie: cookie}});
  assert.equal(download.status, 200); assert.match(download.headers.get("content-type"), /pdf/);
  const bytes = Buffer.from(await download.arrayBuffer()); assert.equal(bytes.subarray(0,5).toString(), "%PDF-");
  console.log(JSON.stringify({scenario: "container end-to-end", storage: "S3 emulator via AWS SDK", ai: "demo", admissionMs, status: result.status, downloadBytes: bytes.length}));
}
main().catch(error => {console.error(error); process.exitCode = 1;});
