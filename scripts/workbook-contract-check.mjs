#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

const LABS = {
  lab1: `${ROOT}labs/mcp-201-1-observe-diagnose-inline.html`,
  lab3: `${ROOT}labs/mcp-201-3-build-measure-inline.html`,
};

const EXPECTED_FIELDS = [
  "completionSeconds",
  "toolCalls",
  "contextPercent",
  "businessOutcome",
];

const LAB1_QUESTIONS = [
  ["valid", "2.1"],
  ["over_limit", "2.2"],
  ["wrong_tool", "2.3"],
  ["bypass", "2.4"],
  ["on_behalf", "2.5"],
  ["learner_chosen", "2.6"],
];

const LAB3_QUESTIONS = [
  "valid",
  "over_limit",
  "wrong_tool",
  "bypass",
  "on_behalf",
];

function sameList(actual, expected) {
  return Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index]);
}

function extractWorkbook(path) {
  const html = readFileSync(path, "utf8");
  const attribute = html.match(/data-measurement-workbook="([^"]+)"/);

  assert(attribute, `${path}: missing data-measurement-workbook`);

  const encoded = attribute[1]
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&");
  const spec = JSON.parse(decodeURIComponent(encoded));
  const sectionStart = html.lastIndexOf("<section", attribute.index);
  const workbookHtml = html.slice(sectionStart);

  return { html, spec, workbookHtml };
}

function sharedIssues(spec) {
  const issues = [];

  if (!sameList(spec.fields, EXPECTED_FIELDS)) {
    issues.push("four-field measurement model");
  }
  if (!Array.isArray(spec.questions) || spec.questions.some((question) =>
    !question.setup?.trim() || !question.watch?.trim())) {
    issues.push("setup and watch guidance");
  }
  if (/\breceipts?\b/i.test(JSON.stringify(spec))) {
    issues.push("receipt language removed");
  }

  return issues;
}

function lab1Issues(spec, html, workbookHtml) {
  const issues = sharedIssues(spec);
  const actualQuestions = Array.isArray(spec.questions)
    ? spec.questions.map(({ id, task }) => [id, task])
    : [];

  if (String(spec.task_panels) !== "true") {
    issues.push("task-panel mode");
  }
  if (spec.mode !== "baseline") {
    issues.push("baseline mode");
  }
  if (spec.tasks?.length !== 1 ||
      spec.tasks[0].phase !== "act-2" ||
      spec.tasks[0].focus !== "valid") {
    issues.push("Phase 2 placement");
  }
  if (JSON.stringify(actualQuestions) !== JSON.stringify(LAB1_QUESTIONS)) {
    issues.push("six task-linked questions");
  }
  if (!workbookHtml.includes("measurement-workbook--task-panels") ||
      !workbookHtml.includes("measurement-task-deck") ||
      !html.includes("measurement-starter-preview")) {
    issues.push("published task-panel structure");
  }
  if (!html.includes(".measurement-workbook-viewport{overflow:visible;}")) {
    issues.push("non-scrolling workbook viewport");
  }

  return issues;
}

function lab3Issues(spec, html, workbookHtml) {
  const issues = sharedIssues(spec);
  const actualQuestions = Array.isArray(spec.questions)
    ? spec.questions.map(({ id }) => id)
    : [];

  if (spec.mode !== "comparison" || spec.comparison_layout !== "matrix") {
    issues.push("comparison matrix mode");
  }
  if (spec.baseline_column_label !== "Fragmented" ||
      spec.compare_column_label !== "Process") {
    issues.push("comparison labels");
  }
  if (spec.tasks?.length !== 1 ||
      spec.tasks[0].task !== "4.2" ||
      spec.tasks[0].focus !== "valid" ||
      spec.tasks[0].position !== "after_walkthrough") {
    issues.push("Task 4.2 placement");
  }
  if (!sameList(actualQuestions, LAB3_QUESTIONS)) {
    issues.push("five matched comparison rows");
  }
  if (!html.includes("measurement-comparison-matrix")) {
    issues.push("published comparison matrix");
  }
  if (!html.includes(".measurement-workbook-viewport{overflow:visible;}")) {
    issues.push("non-scrolling workbook viewport");
  }

  return issues;
}

function report(label, issues) {
  if (issues.length) {
    console.error(`FAIL ${label}: ${issues.join(", ")}`);
    return false;
  }

  console.log(`ok   ${label}`);
  return true;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const lab1 = extractWorkbook(LABS.lab1);
const lab3 = extractWorkbook(LABS.lab3);
let passed = true;

passed = report("Lab 1 workbook contract", lab1Issues(
  lab1.spec,
  lab1.html,
  lab1.workbookHtml,
)) && passed;
passed = report("Lab 3 workbook contract", lab3Issues(
  lab3.spec,
  lab3.html,
  lab3.workbookHtml,
)) && passed;

// Prove the guard catches the regressions it is intended to prevent.
const badLab1 = clone(lab1.spec);
badLab1.fields = badLab1.fields.slice(0, 3);
badLab1.questions = badLab1.questions.slice(0, 5);
delete badLab1.task_panels;
const caughtLab1 = lab1Issues(badLab1, lab1.html, lab1.workbookHtml);
passed = report("Lab 1 known-bad self-check", [
  "four-field measurement model",
  "task-panel mode",
  "six task-linked questions",
].every((issue) => caughtLab1.includes(issue)) ? [] : ["guard did not catch regression"]) && passed;

const badLab3 = clone(lab3.spec);
badLab3.comparison_layout = "tabs";
badLab3.questions.push(clone(lab1.spec.questions.at(-1)));
badLab3.tasks[0].position = "before_walkthrough";
const caughtLab3 = lab3Issues(badLab3, lab3.html, lab3.workbookHtml);
passed = report("Lab 3 known-bad self-check", [
  "comparison matrix mode",
  "Task 4.2 placement",
  "five matched comparison rows",
].every((issue) => caughtLab3.includes(issue)) ? [] : ["guard did not catch regression"]) && passed;

if (!passed) {
  process.exitCode = 1;
} else {
  console.log("Published workbook contract passed.");
}
