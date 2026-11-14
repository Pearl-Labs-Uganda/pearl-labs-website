import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanFields, emptyFields, leadFields, leadPhoneReady, samePhone, fieldErrors, firstStepWithErrors, hackathonCsv, isMomoTransactionId, paymentStatus,
  readFields, stepErrors, tally, type HackathonFields, type HackathonRow,
} from "./hackathon.ts";

const good = (over: Partial<HackathonFields> = {}): HackathonFields => ({
  ...emptyFields(),
  parentName: "Grace N", relationship: "Mother", parentPhone: "+256 700 123456", parentEmail: "grace@example.com",
  learnerName: "Amina N", age: "14", gender: "Female", school: "Kampala High", classGrade: "S2",
  week: "dec7", interests: ["robotics", "drones"], hasLaptop: "No", trip: "Yes", passport: "No", photoConsent: "Yes",
  paymentMethod: "MTN MoMo", transactionId: "12345678901", parentConsent: true,
  ...over,
});

test("a complete registration has no errors", () => {
  assert.deepEqual(fieldErrors(good()), {});
  assert.deepEqual(fieldErrors(good({ paymentMethod: "Cash", transactionId: "" })), {});
});

test("required fields, formats and options", () => {
  assert.ok(fieldErrors(good({ learnerName: " " })).learnerName);
  assert.ok(fieldErrors(good({ age: "4" })).age);
  assert.ok(fieldErrors(good({ gender: "Other" })).gender);
  assert.ok(fieldErrors(good({ relationship: "Uncle" })).relationship);
  assert.ok(fieldErrors(good({ parentPhone: "1234" })).parentPhone);
  assert.ok(fieldErrors(good({ parentEmail: "grace@" })).parentEmail);
  assert.ok(fieldErrors(good({ week: "either" })).week);
  assert.ok(fieldErrors(good({ week: "constructor" })).week);
  assert.ok(fieldErrors(good({ week: "dec14" })).week, "only the 7–12 Dec week is open");
  assert.ok(fieldErrors(good({ interests: [] })).interests);
  assert.ok(fieldErrors(good({ interests: ["cooking"] })).interests);
  assert.ok(fieldErrors(good({ parentConsent: false })).parentConsent);
  assert.ok(fieldErrors(good({ paymentMethod: "" })).paymentMethod);
});

test("passport is only asked with the trip", () => {
  assert.ok(fieldErrors(good({ trip: "Yes", passport: "" })).passport);
  assert.equal(fieldErrors(good({ trip: "No", passport: "" })).passport, undefined);
  assert.equal(cleanFields(good({ trip: "No", passport: "Yes" })).passport, "");
});

test("MoMo: the ID can come later, but if given it must look real; cash needs none", () => {
  assert.equal(fieldErrors(good({ transactionId: "" })).transactionId, undefined);
  assert.ok(fieldErrors(good({ transactionId: "pending" })).transactionId);
  assert.ok(fieldErrors(good({ transactionId: "notpaidyet" })).transactionId);
  assert.ok(fieldErrors(good({ transactionId: "1234" })).transactionId);
  assert.equal(isMomoTransactionId("1234 5678 901"), true);
  assert.equal(cleanFields(good({ transactionId: "1234 5678 901" })).transactionId, "12345678901");
  assert.equal(cleanFields(good({ paymentMethod: "Cash", transactionId: "999999999" })).transactionId, "");
});

test("errors per step, and the first step that has one", () => {
  const f = good({ parentEmail: "x", transactionId: "pending" });
  assert.deepEqual(Object.keys(stepErrors(0, f)), ["parentEmail"]);
  assert.deepEqual(stepErrors(1, f), {});
  assert.deepEqual(Object.keys(stepErrors(2, f)), ["transactionId"]);
  assert.equal(firstStepWithErrors(fieldErrors(f)), 0);
  assert.equal(firstStepWithErrors(fieldErrors(good({ age: "" }))), 1);
  assert.equal(firstStepWithErrors({}), null);
});

test("reading the request body keeps only known fields with the right types", () => {
  const f = readFields({ learnerName: "A", interests: ["drones", 5], parentConsent: "true", extra: "x" });
  assert.equal(f.learnerName, "A");
  assert.deepEqual(f.interests, ["drones"]);
  assert.equal(f.parentConsent, false);
  assert.equal("extra" in f, false);
  assert.deepEqual(readFields(null), emptyFields());
});

test("lead helpers: ready at 10 digits, phones match across 0 / +256", () => {
  assert.equal(leadPhoneReady("070012345"), false);
  assert.equal(leadPhoneReady("0700123456"), true);
  assert.equal(samePhone("0700 123 456", "+256700123456"), true);
  assert.equal(samePhone("0700123456", "0700123457"), false);
  assert.equal(samePhone("", ""), false);
  assert.equal(leadFields({ parentName: "x".repeat(500) }).parentName.length, 200);
});

test("payment status", () => {
  assert.equal(paymentStatus({ verified: false, paymentMethod: "MTN MoMo", transactionId: "" }), "Needs MoMo ID");
  assert.equal(paymentStatus({ verified: true, paymentMethod: "Cash", transactionId: "" }), "Verified");
  assert.equal(paymentStatus({ verified: false, paymentMethod: "Cash", transactionId: "" }), "Paying cash");
  assert.equal(paymentStatus({ verified: false, paymentMethod: "MTN MoMo", transactionId: "123456789" }), "Awaiting check");
});

test("CSV escapes commas and quotes and shows labels", () => {
  const row: HackathonRow = {
    ...good({ school: 'St. Mary\'s, "Kisubi"' }), id: 1, amountDue: 150000, verified: false, verifiedAt: null,
    createdAt: "2026-11-12T10:30:00.000Z", updatedAt: "",
  };
  const csv = hackathonCsv([row]);
  assert.ok(csv.startsWith("﻿Registered,"));
  assert.ok(csv.includes('"St. Mary\'s, ""Kisubi"""'));
  assert.ok(csv.includes("7–12 Dec"));
  assert.ok(csv.includes("Awaiting check"));
});

test("tally groups typed names regardless of case and spacing, most first", () => {
  assert.deepEqual(tally(["Kampala High", "kampala  high ", "Gayaza", " "]), [
    { name: "Kampala High", count: 2 },
    { name: "Gayaza", count: 1 },
  ]);
});

test("readFields always books the 7–12 Dec week, whatever the client sends", () => {
  assert.equal(readFields({ week: "dec14" }).week, "dec7");
  assert.equal(readFields({}).week, "dec7");
  assert.equal(emptyFields().week, "dec7");
});
