"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const appPath = path.join(__dirname, "..", "assets", "js", "app.js");
const app = fs.readFileSync(appPath, "utf8");

function functionBody(name, nextName) {
  const start = app.indexOf(`function ${name}`);
  const end = app.indexOf(`function ${nextName}`, start);
  assert.notEqual(start, -1, `${name} should exist`);
  assert.notEqual(end, -1, `${nextName} should follow ${name}`);
  return app.slice(start, end);
}

function correctForAt(level) {
  const source = functionBody("correctFor", "loopStatus");
  const context = { state: { level } };
  vm.runInNewContext(`${source}; result = correctFor`, context);
  return context.result;
}

function b1c1() {
  const context = { window: {} };
  const dataPath = path.join(__dirname, "..", "assets", "js", "data.js");
  vm.runInNewContext(fs.readFileSync(dataPath, "utf8"), context, { filename: dataPath });
  return context.window.TETRABIBLOS_V2.chapters.find(chapter => chapter.id === "b1c1");
}

test("source renderer reads progress using the chapter id", () => {
  const source = functionBody("sourceHtml", "quizHtml");
  assert.match(source, /chapterProgress\(c\.id\)/);
  assert.doesNotMatch(source, /chapterProgress\(c\)(?!\.)/);
});

test("B1C1 keeps each level's check set independent", () => {
  const checks = b1c1().checks;
  assert.deepEqual(Object.keys(checks).sort(), ["advanced", "beginner", "modern"]);
  assert.notStrictEqual(checks.beginner, checks.modern);
  assert.notStrictEqual(checks.beginner, checks.advanced);
  assert.notStrictEqual(checks.modern, checks.advanced);
  assert.notDeepEqual(checks.beginner, checks.modern);
  assert.notDeepEqual(checks.beginner, checks.advanced);
  assert.notDeepEqual(checks.modern, checks.advanced);
});

test("level-specific checks use correctFor in quiz rendering, answering, pass gate, and sealing", () => {
  assert.match(app, /function chapterProgress\(id\)\{if\(!state\.progress\[id\]\)/);
  const quiz = functionBody("quizHtml", "renderReader");
  const reader = functionBody("renderReader", "bind");
  const answer = reader.slice(reader.indexOf("$$('[data-q]')"), reader.indexOf('$("#sealLoop")'));
  const seal = reader.slice(reader.indexOf('$("#sealLoop")'));

  const correctFor = correctForAt("modern");
  const legacyProgress = { correct: [0] };
  const levelProgress = { correct: [0], correctByLevel: {} };
  const legacyCorrect = correctFor({}, legacyProgress);
  const levelCorrect = correctFor({ checks: { modern: [] } }, levelProgress);

  assert.strictEqual(legacyCorrect, legacyProgress.correct);
  assert.strictEqual(levelCorrect, levelProgress.correctByLevel.modern);
  assert.equal(levelCorrect.length, 0);
  assert.match(quiz, /correct\s*=\s*correctFor\(c,p\)/);
  assert.match(quiz, /const passed\s*=\s*correct\.length\s*>=\s*requiredScore\(\)/);
  assert.doesNotMatch(quiz, /p\.correct/);
  assert.match(answer, /correct\s*=\s*correctFor\(c,cp\)/);
  assert.match(answer, /correct\.includes\(qi\)/);
  assert.match(answer, /correct\.push\(qi\)/);
  assert.match(answer, /correct\.length\s*>=\s*requiredScore\(\)/);
  assert.doesNotMatch(answer, /cp\.correct/);
  assert.match(seal, /correctFor\(c,cp\)\.length\s*=\s*0/);
  assert.doesNotMatch(seal, /cp\.correct\s*=\s*\[\]/);
});

test("feedback returns to Cornell using the button destination", () => {
  const reader = functionBody("renderReader", "bind");
  const answer = reader.slice(reader.indexOf("$$('[data-q]')"), reader.indexOf('$("#sealLoop")'));
  const returnListener = reader.slice(reader.indexOf("return-note"));

  assert.match(answer, /class="return-note"\s+data-tab="cornell"/);
  assert.match(returnListener, /\$\$\((?:'|")\.return-note(?:'|")\)/);
  assert.match(returnListener, /state\.tab\s*=\s*b\.dataset\.tab/);
  assert.match(reader, /\["cornell","康乃爾筆記"\]/);
  assert.match(reader, /state\.tab==="cornell"\?cornellHtml\(c\)/);
  assert.doesNotMatch(returnListener, /\[data-tab="storybook"\]\.return-note/);
  assert.doesNotMatch(returnListener, /state\.tab\s*=\s*"cornell"/);
});
