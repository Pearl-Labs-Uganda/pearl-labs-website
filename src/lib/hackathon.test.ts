import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanFields, emptyFields, fieldErrors, hackathonCsv, readFields, tally, type HackathonFields, type HackathonRow,
} from "./hackathon.ts";

const good = (over: Partial<HackathonFields> = {}): HackathonFields => ({
  ...emptyFields(),
  learnerName: "Amina N", age: "14", gender: "Female", school: "Kampala High", classGrade: "S2",
  parentName: "Grace N", relationship: "Mother", parentPhone: "+256 700 123456", parentEmail: "grace@example.com",
  week: "dec7", interests: ["robotics", "drones"], hasLaptop: "No", trip: "Yes", passport: "No",
  hearAbout: "My school", parentConsent: true, photoConsent: "Yes",
  ...over,
});

test("a complete registration has no errors", () => {
  assert.deepEqual(fieldErrors(good()), {});
});

test("required fields, formats and options", () => {
  assert.ok(fieldErrors(good({ learnerName: " " })).learnerName);
  assert.ok(fieldErrors(good({ age: "4" })).age);
  assert.ok(fieldErrors(good({ age: "fourteen" })).age);
  assert.ok(fieldErrors(good({ gender: "Other" })).gender);
  assert.ok(fieldErrors(good({ relationship: "Uncle" })).relationship);
  assert.ok(fieldErrors(good({ parentPhone: "1234" })).parentPhone);
  assert.ok(fieldErrors(good({ parentEmail: "grace@" })).parentEmail);
  assert.ok(fieldErrors(good({ week: "jan" })).week);
  assert.ok(fieldErrors(good({ week: "constructor" })).week);
  assert.ok(fieldErrors(good({ interests: [] })).interests);
  assert.ok(fieldErrors(good({ interests: ["cooking"] })).interests);
  assert.ok(fieldErrors(good({ trip: "" })).trip);
  assert.ok(fieldErrors(good({ passport: "Maybe" })).passport);
  assert.ok(fieldErrors(good({ hearAbout: "Radio" })).hearAbout);
  assert.ok(fieldErrors(good({ parentConsent: false })).parentConsent);
  assert.ok(fieldErrors(good({ photoConsent: "" })).photoConsent);
});

test("reading the request body keeps only known fields with the right types", () => {
  const f = readFields({ learnerName: "A", interests: ["drones", 5], parentConsent: "true", extra: "x" });
  assert.equal(f.learnerName, "A");
  assert.deepEqual(f.interests, ["drones"]);
  assert.equal(f.parentConsent, false);
  assert.equal("extra" in f, false);
  assert.deepEqual(readFields(null), emptyFields());
});

test("clean: trimmed, interests in fixed order without repeats", () => {
  const f = cleanFields(good({ learnerName: " Amina N ", interests: ["drones", "ai_coding", "drones"] }));
  assert.equal(f.learnerName, "Amina N");
  assert.deepEqual(f.interests, ["drones", "ai_coding"]);
});

test("CSV escapes commas and quotes and shows labels", () => {
  const row: HackathonRow = { ...good({ school: 'St. Mary\'s, "Kisubi"' }), id: 1, createdAt: "2026-11-12T10:30:00.000Z", updatedAt: "" };
  const csv = hackathonCsv([row]);
  assert.ok(csv.startsWith("﻿Registered,"));
  assert.ok(csv.includes('"St. Mary\'s, ""Kisubi"""'));
  assert.ok(csv.includes("7–12 Dec"));
  assert.ok(csv.includes('"Robotics, Drones"'));
});

test("tally groups typed names regardless of case and spacing, most first", () => {
  assert.deepEqual(tally(["Kampala High", "kampala  high ", "Gayaza"]), [
    { name: "Kampala High", count: 2 },
    { name: "Gayaza", count: 1 },
  ]);
});
