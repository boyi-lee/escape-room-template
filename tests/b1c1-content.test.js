"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

function loadChapter() {
  const context = { window: {} };
  const dataPath = path.join(__dirname, "..", "assets", "js", "data.js");
  vm.runInNewContext(fs.readFileSync(dataPath, "utf8"), context, { filename: dataPath });
  return context.window.TETRABIBLOS_V2.chapters.find(chapter => chapter.id === "b1c1");
}

test("deployment-compatible assets define learning levels without a new external script", () => {
  const root = path.join(__dirname, "..");
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const context = { window: {} };
  const dataPath = path.join(root, "assets", "js", "data.js");
  vm.runInNewContext(fs.readFileSync(dataPath, "utf8"), context, { filename: dataPath });

  assert.ok(context.window.TETRABIBLOS_LEVELS, "data.js must define TETRABIBLOS_LEVELS");
  assert.deepEqual(Object.keys(context.window.TETRABIBLOS_LEVELS.profiles).sort(), ["advanced", "beginner", "modern"]);
  assert.ok(context.window.TETRABIBLOS_LEVELS.chapterLenses.b1c1);
  assert.doesNotMatch(index, /<script\s+src=["']assets\/js\/learning-levels\.js["']><\/script>/);
  assert.ok(index.indexOf('src="assets/js/data.js"') < index.indexOf('src="assets/js/app.js"'), "data.js must load before app.js");
});

test("B1C1 exposes only the verified Chapter 1 source boundary", () => {
  const chapter = loadChapter();
  assert.equal(chapter.source.book, "Book I");
  assert.equal(chapter.source.chapters, "Chapter 1");
  assert.equal(chapter.source.pages, "PDF pages 154–156");
  assert.deepEqual([...chapter.source.sourceIds], [
    "TET-B1-C01-S2-154-A",
    "TET-B1-C01-S2-155-A",
    "TET-B1-C01-S2-156-A"
  ]);
  assert.equal(chapter.source.status, "verified");
  assert.match(chapter.summary, /兩種前置研究/);
  const teachingEvidence = {
    source: chapter.source,
    cues: chapter.cues,
    story: chapter.story,
    anna: chapter.anna,
    quick: chapter.quick,
    guide: chapter.guide,
    case: chapter.case,
    misconceptions: chapter.misconceptions,
    summary: chapter.summary,
    takeaways: chapter.takeaways,
    cornell: chapter.cornell,
    excerpts: chapter.excerpts
  };
  assert.doesNotMatch(JSON.stringify(teachingEvidence), /Chapters 1–3|補救|預防|第三章|第二章/);
  const boundaryCheck = chapter.checks.advanced[2];
  assert.equal(boundaryCheck.excludedEvidence, true);
  assert.match(boundaryCheck.options[0], /後續章節.*補救.*預防/);
});

test("B1C1 Cornell notes trace every note to the verified source IDs", () => {
  const chapter = loadChapter();
  assert.ok(chapter.cornell);
  assert.ok(chapter.cornell.cues.length >= 3);
  assert.ok(chapter.cornell.notes.length >= 3);
  for (const note of chapter.cornell.notes) {
    assert.ok(note.sourceIds.length > 0);
    for (const sourceId of note.sourceIds) {
      assert.ok(chapter.source.sourceIds.includes(sourceId));
    }
  }
});

test("B1C1 uses distinct checks for every learning level", () => {
  const chapter = loadChapter();
  const levels = ["advanced", "beginner", "modern"];
  assert.deepEqual(Object.keys(chapter.checks).sort(), [...levels].sort());
  const prompts = levels.map(level => chapter.checks[level].map(item => item.q).join("\n"));
  assert.equal(new Set(prompts).size, levels.length);
  for (const level of levels) {
    assert.equal(chapter.checks[level].length, 3);
    for (const item of chapter.checks[level]) {
      assert.equal(item.options.length, 3);
      assert.ok(Number.isInteger(item.answer));
      assert.ok(item.sourceIds.every(sourceId => chapter.source.sourceIds.includes(sourceId)));
    }
  }
});
