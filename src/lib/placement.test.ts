import { test } from "node:test";
import assert from "node:assert/strict";
import {
  availabilityText, clientKey, createRateLimiter, emailAttachmentPlan, emptyFields, fieldErrors, fileProblem, filesProblem,
  safeFileName, toRow, type PlacementFields,
} from "./placement.ts";

const MB = 1024 * 1024;
const good = (over: Partial<PlacementFields> = {}): PlacementFields => ({
  ...emptyFields(),
  fullName: "Jane Doe", email: "jane@example.com", phone: "+256 700 123456", gender: "Female",
  institution: "Makerere University", course: "Computer Science", track: "ai", days: ["wed", "mon"],
  preferredTime: "morning", whyTrack: "I love ML", skills: "Python", portfolioUrl: "",
  ...over,
});

test("a complete application has no errors", () => {
  assert.deepEqual(fieldErrors(good()), {});
});

test("required fields, formats and limits", () => {
  assert.ok(fieldErrors(good({ fullName: "  " })).fullName);
  assert.ok(fieldErrors(good({ email: "jane@" })).email);
  assert.ok(fieldErrors(good({ phone: "12345" })).phone);
  assert.ok(fieldErrors(good({ gender: "Other" })).gender);
  assert.ok(fieldErrors(good({ gender: "Prefer not to say" })).gender);
  assert.ok(fieldErrors(good({ track: "aerospace" })).track);
  assert.ok(fieldErrors(good({ days: [] })).days);
  assert.ok(fieldErrors(good({ days: ["sun"] })).days);
  assert.ok(fieldErrors(good({ preferredTime: "night" })).preferredTime);
  assert.ok(fieldErrors(good({ whyTrack: "x".repeat(1501) })).whyTrack);
  assert.ok(fieldErrors(good({ portfolioUrl: "javascript:alert(1)" })).portfolioUrl);
  assert.equal(fieldErrors(good({ portfolioUrl: "https://github.com/jane" })).portfolioUrl, undefined);
});

test("track and time must be real options, not object built-ins", () => {
  assert.ok(fieldErrors(good({ track: "constructor" })).track);
  assert.ok(fieldErrors(good({ preferredTime: "toString" })).preferredTime);
});

test("file checks: type by extension, empty, size", () => {
  assert.equal(fileProblem({ name: "CV.PDF", size: 2 * MB }), null);
  assert.equal(fileProblem({ name: "letter.docx", size: 1 }), null);
  assert.ok(fileProblem({ name: "cv.exe", size: 10 }));
  assert.ok(fileProblem({ name: "cv.pdf.exe", size: 10 }));
  assert.ok(fileProblem({ name: "cv.pdf", size: 0 }));
  assert.ok(fileProblem({ name: "cv.pdf", size: 10 * MB + 1 }));
});

test("CV is required; at most 3 other files", () => {
  assert.ok(filesProblem(null, []));
  assert.equal(filesProblem({ name: "cv.pdf", size: 10 }, []), null);
  const f = { name: "a.png", size: 10 };
  assert.ok(filesProblem({ name: "cv.pdf", size: 10 }, [f, f, f, f]));
  assert.ok(filesProblem({ name: "cv.pdf", size: 10 }, [{ name: "a.zip", size: 10 }]));
});

test("safe storage names", () => {
  assert.equal(safeFileName("My CV (final).pdf"), "My-CV-final-.pdf");
  assert.equal(safeFileName("../../etc/passwd"), "passwd");
  assert.equal(safeFileName("???"), "file");
  assert.ok(safeFileName("a".repeat(200) + ".pdf").length <= 80);
});

test("availability reads in week order", () => {
  assert.equal(availabilityText(["fri", "mon", "wed"], "full_day"), "Mon, Wed, Fri · Full day");
});

test("row for the database: trimmed, week-ordered unique days, empty link → null", () => {
  const row = toRow(good({ fullName: " Jane Doe ", days: ["wed", "mon", "wed"] }));
  assert.equal(row.full_name, "Jane Doe");
  assert.deepEqual(row.days, ["mon", "wed"]);
  assert.equal(row.portfolio_url, null);
  assert.equal(row.preferred_time, "morning");
});

test("email attachments fit the budget, CV first, the rest listed", () => {
  assert.deepEqual(emailAttachmentPlan([9 * MB, 9 * MB, 9 * MB, 1 * MB], 20 * MB), { attach: [0, 1, 3], skip: [2] });
  assert.deepEqual(emailAttachmentPlan([1, 2], 20 * MB), { attach: [0, 1], skip: [] });
});

test("rate limit: 5 an hour per key", () => {
  const allow = createRateLimiter(5, 3600_000);
  for (let i = 0; i < 5; i++) assert.equal(allow("ip", 1000 + i), true);
  assert.equal(allow("ip", 2000), false);
  assert.equal(allow("other", 2000), true);
  assert.equal(allow("ip", 1005 + 3600_000), true);
});

test("rate-limit key is the hop nginx added, not one the sender typed", () => {
  assert.equal(clientKey("6.6.6.6, 41.210.1.2", null), "41.210.1.2");
  assert.equal(clientKey("41.210.1.2", null), "41.210.1.2");
  assert.equal(clientKey(null, "41.210.1.3"), "41.210.1.3");
  assert.equal(clientKey(null, null), "unknown");
});
