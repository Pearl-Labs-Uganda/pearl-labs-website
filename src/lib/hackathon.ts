// STEM Innovation Hackathon pre-registration (pearllabs.ug/hackathon → website SQLite).
// Record-only for now: no payment step. Pure rules shared by the form, the API route and
// the staff page. No imports, so `node --test` can run it directly.

export const GENDERS = ["Male", "Female"] as const;
export const YES_NO = ["Yes", "No"] as const;
export const WEEKS = { dec7: "7–12 Dec", dec14: "14–19 Dec", either: "Either week" } as const;
export const INTERESTS = {
  drones: "Drones",
  robotics: "Robotics",
  ai_coding: "AI and coding",
  printing_3d: "3D printing",
  aerospace: "Aerospace design",
} as const;
export const RELATIONSHIPS = ["Mother", "Father", "Guardian", "Other"] as const;
export const HEAR_ABOUT = [
  "My school",
  "A demo day",
  "Parents' workshop",
  "Social media",
  "Friend or family",
  "Other",
] as const;

export interface HackathonFields {
  learnerName: string;
  age: string;
  gender: string;
  school: string;
  classGrade: string;
  parentName: string;
  relationship: string;
  parentPhone: string;
  parentEmail: string;
  week: string;
  interests: string[];
  hasLaptop: string;
  trip: string;
  passport: string;
  hearAbout: string;
  parentConsent: boolean;
  photoConsent: string;
}

export interface HackathonRow extends HackathonFields {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export const emptyFields = (): HackathonFields => ({
  learnerName: "", age: "", gender: "", school: "", classGrade: "",
  parentName: "", relationship: "", parentPhone: "", parentEmail: "",
  week: "", interests: [], hasLaptop: "", trip: "", passport: "", hearAbout: "",
  parentConsent: false, photoConsent: "",
});

const INTEREST_KEYS = Object.keys(INTERESTS);
const oneOf = (list: readonly string[], v: string) => list.includes(v);

export function fieldErrors(f: HackathonFields): Partial<Record<keyof HackathonFields, string>> {
  const e: Partial<Record<keyof HackathonFields, string>> = {};
  const need = (key: keyof HackathonFields, value: string, label: string, max: number) => {
    const v = value.trim();
    if (!v) e[key] = `Enter the ${label}`;
    else if (v.length > max) e[key] = `Keep the ${label} under ${max} characters`;
  };
  need("learnerName", f.learnerName, "learner's full name", 120);
  const age = Number(f.age.trim());
  if (!/^\d{1,2}$/.test(f.age.trim()) || age < 6 || age > 25) e.age = "Enter the learner's age in years";
  if (!oneOf(GENDERS, f.gender)) e.gender = "Choose an option";
  need("school", f.school, "school", 160);
  need("classGrade", f.classGrade, "class", 40);
  need("parentName", f.parentName, "parent or guardian's name", 120);
  if (!oneOf(RELATIONSHIPS, f.relationship)) e.relationship = "Choose an option";
  const digits = f.parentPhone.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) e.parentPhone = "Enter a valid phone number";
  if (!/^\S+@\S+\.\S+$/.test(f.parentEmail.trim()) || f.parentEmail.trim().length > 200)
    e.parentEmail = "Enter a valid email address";
  if (!Object.hasOwn(WEEKS, f.week)) e.week = "Choose a week";
  if (f.interests.length === 0 || f.interests.some((i) => !INTEREST_KEYS.includes(i)))
    e.interests = "Tick at least one";
  if (!oneOf(YES_NO, f.hasLaptop)) e.hasLaptop = "Choose an option";
  if (!oneOf(YES_NO, f.trip)) e.trip = "Choose an option";
  if (!oneOf(YES_NO, f.passport)) e.passport = "Choose an option";
  if (!oneOf(HEAR_ABOUT, f.hearAbout)) e.hearAbout = "Choose an option";
  if (f.parentConsent !== true) e.parentConsent = "A parent or guardian must agree before registering";
  if (!oneOf(YES_NO, f.photoConsent)) e.photoConsent = "Choose an option";
  return e;
}

// Trimmed, with interests in a fixed order and no repeats.
export function cleanFields(f: HackathonFields): HackathonFields {
  return {
    ...f,
    learnerName: f.learnerName.trim(),
    age: f.age.trim(),
    school: f.school.trim(),
    classGrade: f.classGrade.trim(),
    parentName: f.parentName.trim(),
    parentPhone: f.parentPhone.trim(),
    parentEmail: f.parentEmail.trim(),
    interests: INTEREST_KEYS.filter((k) => f.interests.includes(k)),
  };
}

// Reads a JSON body, keeping only the known fields with the right types.
export function readFields(body: unknown): HackathonFields {
  const o = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const s = (k: string) => (typeof o[k] === "string" ? (o[k] as string) : "");
  const list = Array.isArray(o.interests) ? o.interests.filter((v): v is string => typeof v === "string") : [];
  return {
    learnerName: s("learnerName"), age: s("age"), gender: s("gender"), school: s("school"),
    classGrade: s("classGrade"), parentName: s("parentName"), relationship: s("relationship"),
    parentPhone: s("parentPhone"), parentEmail: s("parentEmail"), week: s("week"), interests: list,
    hasLaptop: s("hasLaptop"), trip: s("trip"), passport: s("passport"), hearAbout: s("hearAbout"),
    parentConsent: o.parentConsent === true, photoConsent: s("photoConsent"),
  };
}

export const weekLabel = (k: string) => (Object.hasOwn(WEEKS, k) ? WEEKS[k as keyof typeof WEEKS] : k);
export const interestsText = (keys: string[]) =>
  keys.map((k) => (Object.hasOwn(INTERESTS, k) ? INTERESTS[k as keyof typeof INTERESTS] : k)).join(", ");

// The answers as label/value pairs, in form order — for emails.
export function summaryRows(f: HackathonFields): [string, string][] {
  return [
    ["Learner", f.learnerName],
    ["Age", f.age],
    ["Gender", f.gender],
    ["School", f.school],
    ["Class", f.classGrade],
    ["Parent / guardian", `${f.parentName} (${f.relationship})`],
    ["Phone", f.parentPhone],
    ["Email", f.parentEmail],
    ["Preferred week", weekLabel(f.week)],
    ["Interests", interestsText(f.interests)],
    ["Has a laptop", f.hasLaptop],
    ["Also applying for the trip", f.trip],
    ["Has a passport", f.passport],
    ["Heard about it from", f.hearAbout],
    ["Photo consent", f.photoConsent],
  ];
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// Spreadsheet-ready; the BOM makes Excel read the dashes and apostrophes correctly.
export function hackathonCsv(rows: HackathonRow[]): string {
  const headers = [
    "Registered", "Learner", "Age", "Gender", "School", "Class", "Parent / guardian", "Relationship",
    "Phone", "Email", "Preferred week", "Interests", "Has laptop", "Trip", "Passport", "Heard from",
    "Photo consent",
  ];
  const lines = rows.map((r) =>
    [
      r.createdAt.slice(0, 16).replace("T", " "), r.learnerName, r.age, r.gender, r.school, r.classGrade,
      r.parentName, r.relationship, r.parentPhone, r.parentEmail, weekLabel(r.week), interestsText(r.interests),
      r.hasLaptop, r.trip, r.passport, r.hearAbout, r.photoConsent,
    ].map(csvCell).join(","),
  );
  return "﻿" + [headers.map(csvCell).join(","), ...lines].join("\r\n");
}

// "count per value", most first, for the staff page's breakdowns. Typed values (school names)
// group regardless of case and spacing, shown as first typed.
export function tally(values: string[]): { name: string; count: number }[] {
  const m = new Map<string, { name: string; count: number }>();
  for (const v of values) {
    const key = v.trim().replace(/\s+/g, " ").toLowerCase();
    const hit = m.get(key);
    if (hit) hit.count += 1;
    else m.set(key, { name: v.trim().replace(/\s+/g, " "), count: 1 });
  }
  return Array.from(m.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
