// Technoxian Hackathon registration (pearllabs.ug/hackathon → website SQLite).
// Three steps: parent, child, payment. Pure rules shared by the form, the API route and the
// staff page. No imports, so `node --test` can run it directly.

export const FEE_UGX = 150_000;
export const MERCHANT_CODE = "07778381"; // same MTN MoMo merchant code as the bootcamp
export const PAYMENT_METHODS = ["MTN MoMo", "Cash"] as const;
export const GENDERS = ["Male", "Female"] as const;
export const YES_NO = ["Yes", "No"] as const;
// Labels for every week ever offered (old sign-ups may hold dec14). New sign-ups are always HACKATHON_WEEK.
export const WEEKS = { dec7: "7–12 Dec", dec14: "14–19 Dec" } as const;
export const HACKATHON_WEEK = "dec7";
export const HACKATHON_DATES = WEEKS[HACKATHON_WEEK];
export const INTERESTS = {
  drones: "Drones",
  robotics: "Robotics",
  ai_coding: "AI and coding",
  printing_3d: "3D printing",
  aerospace: "Aerospace design",
} as const;
export const RELATIONSHIPS = ["Mother", "Father", "Guardian"] as const;

// The websites the form runs on. Anything else is recorded as the main site.
export const SITES = ["pearllabs.ug", "kate-d.com"] as const;
export type Site = (typeof SITES)[number];
export const readSite = (v: unknown): Site => ((SITES as readonly unknown[]).includes(v) ? (v as Site) : "pearllabs.ug");

export interface HackathonFields {
  // 1 · Parent
  parentName: string;
  relationship: string;
  parentPhone: string;
  parentEmail: string;
  // 2 · Child
  learnerName: string;
  age: string;
  gender: string;
  school: string;
  classGrade: string;
  week: string;
  interests: string[];
  hasLaptop: string;
  trip: string;
  passport: string; // only asked when trip is "Yes"
  photoConsent: string;
  // 3 · Payment
  paymentMethod: string;
  transactionId: string; // MoMo only; may be added later through the family's pay link
  parentConsent: boolean;
}

export type Step = 0 | 1 | 2;
export const STEPS = ["Parent", "Child", "Payment"] as const;

const STEP_KEYS: Record<Step, (keyof HackathonFields)[]> = {
  0: ["parentName", "relationship", "parentPhone", "parentEmail"],
  1: ["learnerName", "age", "gender", "school", "classGrade", "interests", "hasLaptop", "trip", "passport", "photoConsent"],
  2: ["paymentMethod", "transactionId", "parentConsent"],
};
export const CHILD_AND_PAYMENT_KEYS = [...STEP_KEYS[1], ...STEP_KEYS[2]];

export interface HackathonRow extends HackathonFields {
  id: number;
  site: Site;
  payToken: string | null;
  amountDue: number;
  verified: boolean;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const emptyFields = (): HackathonFields => ({
  parentName: "", relationship: "", parentPhone: "", parentEmail: "",
  learnerName: "", age: "", gender: "", school: "", classGrade: "", week: HACKATHON_WEEK, interests: [],
  hasLaptop: "", trip: "", passport: "", photoConsent: "",
  paymentMethod: "", transactionId: "", parentConsent: false,
});

const INTEREST_KEYS = Object.keys(INTERESTS);
const oneOf = (list: readonly string[], v: string) => list.includes(v);

// MTN MoMo references are 8+ letters/digits and always contain digits — which also rules out
// "pending", "not paid yet" and the like.
export function isMomoTransactionId(raw: string): boolean {
  const v = raw.replace(/\s+/g, "");
  return /^[A-Za-z0-9]{8,40}$/.test(v) && /\d/.test(v);
}

export function fieldErrors(f: HackathonFields): Partial<Record<keyof HackathonFields, string>> {
  const e: Partial<Record<keyof HackathonFields, string>> = {};
  const need = (key: keyof HackathonFields, value: string, label: string, max: number) => {
    const v = value.trim();
    if (!v) e[key] = `Enter the ${label}`;
    else if (v.length > max) e[key] = `Keep the ${label} under ${max} characters`;
  };
  need("parentName", f.parentName, "parent or guardian's name", 120);
  if (!oneOf(RELATIONSHIPS, f.relationship)) e.relationship = "Choose one";
  const digits = f.parentPhone.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) e.parentPhone = "Enter a valid phone number";
  if (!/^\S+@\S+\.\S+$/.test(f.parentEmail.trim()) || f.parentEmail.trim().length > 200)
    e.parentEmail = "Enter a valid email address";

  need("learnerName", f.learnerName, "child's full name", 120);
  const age = Number(f.age.trim());
  if (!/^\d{1,2}$/.test(f.age.trim()) || age < 6 || age > 25) e.age = "Enter the age in years";
  if (!oneOf(GENDERS, f.gender)) e.gender = "Choose one";
  need("school", f.school, "school", 160);
  need("classGrade", f.classGrade, "class", 40);
  if (f.week !== HACKATHON_WEEK) e.week = "The hackathon runs " + HACKATHON_DATES;
  if (f.interests.length === 0 || f.interests.some((i) => !INTEREST_KEYS.includes(i)))
    e.interests = "Tick at least one";
  if (!oneOf(YES_NO, f.hasLaptop)) e.hasLaptop = "Choose one";
  if (!oneOf(YES_NO, f.trip)) e.trip = "Choose one";
  if (f.trip === "Yes" && !oneOf(YES_NO, f.passport)) e.passport = "Choose one";
  if (!oneOf(YES_NO, f.photoConsent)) e.photoConsent = "Choose one";

  if (!oneOf(PAYMENT_METHODS, f.paymentMethod)) e.paymentMethod = "Choose how you'll pay";
  // A parent who has paid by MoMo can finish without the ID to hand; we ask for it afterwards.
  else if (f.paymentMethod === "MTN MoMo" && f.transactionId.trim() && !isMomoTransactionId(f.transactionId))
    e.transactionId = "That doesn't look like a MoMo transaction ID — check the SMS, or leave it blank for now";
  if (f.parentConsent !== true) e.parentConsent = "Tick to agree before registering";
  return e;
}

export function stepErrors(step: Step, f: HackathonFields): Partial<Record<keyof HackathonFields, string>> {
  const all = fieldErrors(f);
  const out: Partial<Record<keyof HackathonFields, string>> = {};
  for (const k of STEP_KEYS[step]) if (all[k]) out[k] = all[k];
  return out;
}

export function firstStepWithErrors(errors: Partial<Record<keyof HackathonFields, string>>): Step | null {
  for (const step of [0, 1, 2] as Step[]) if (STEP_KEYS[step].some((k) => errors[k])) return step;
  return null;
}

// Trimmed; interests in a fixed order; no passport answer without the trip; no MoMo ID for cash.
export function cleanFields(f: HackathonFields): HackathonFields {
  return {
    ...f,
    parentName: f.parentName.trim(),
    parentPhone: f.parentPhone.trim(),
    parentEmail: f.parentEmail.trim(),
    learnerName: f.learnerName.trim(),
    age: f.age.trim(),
    school: f.school.trim(),
    classGrade: f.classGrade.trim(),
    interests: INTEREST_KEYS.filter((k) => f.interests.includes(k)),
    passport: f.trip === "Yes" ? f.passport : "",
    transactionId: f.paymentMethod === "MTN MoMo" ? f.transactionId.replace(/\s+/g, "") : "",
  };
}

// Reads a JSON body, keeping only the known fields with the right types.
export function readFields(body: unknown): HackathonFields {
  const o = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const s = (k: string) => (typeof o[k] === "string" ? (o[k] as string) : "");
  const list = Array.isArray(o.interests) ? o.interests.filter((v): v is string => typeof v === "string") : [];
  return {
    parentName: s("parentName"), relationship: s("relationship"), parentPhone: s("parentPhone"),
    parentEmail: s("parentEmail"), learnerName: s("learnerName"), age: s("age"), gender: s("gender"),
    school: s("school"), classGrade: s("classGrade"), week: HACKATHON_WEEK, interests: list,
    hasLaptop: s("hasLaptop"), trip: s("trip"), passport: s("passport"), photoConsent: s("photoConsent"),
    paymentMethod: s("paymentMethod"), transactionId: s("transactionId"), parentConsent: o.parentConsent === true,
  };
}

export const formatUgx = (n: number) => `UGX ${n.toLocaleString("en-US")}`;
export const weekLabel = (k: string) => (Object.hasOwn(WEEKS, k) ? WEEKS[k as keyof typeof WEEKS] : k);
export const interestsText = (keys: string[]) =>
  keys.map((k) => (Object.hasOwn(INTERESTS, k) ? INTERESTS[k as keyof typeof INTERESTS] : k)).join(", ");

export type PaymentStatus = "Verified" | "Awaiting check" | "Needs MoMo ID" | "Paying cash";
export function paymentStatus(r: Pick<HackathonRow, "verified" | "paymentMethod" | "transactionId">): PaymentStatus {
  if (r.verified) return "Verified";
  if (r.paymentMethod === "Cash") return "Paying cash";
  return r.transactionId ? "Awaiting check" : "Needs MoMo ID";
}

// ---- Unfinished forms (leads) ----
// Saved from the moment the parent's phone has 10+ digits, so nobody who started is lost.
export const leadPhoneReady = (phone: string) => phone.replace(/\D/g, "").length >= 10;
export const samePhone = (a: string, b: string) => {
  const tail = (p: string) => p.replace(/\D/g, "").slice(-9); // ignores 0 / +256 prefixes
  return tail(a).length === 9 && tail(a) === tail(b);
};

export interface HackathonLead {
  id: number;
  site: Site;
  step: Step; // furthest step reached
  fields: HackathonFields;
  contacted: boolean;
  dismissed: boolean;
  createdAt: string;
  updatedAt: string;
}

// What a lead save may store: known fields only, strings capped, so a draft can't bloat the database.
export function leadFields(body: unknown): HackathonFields {
  const f = readFields(body);
  const cap = (v: string) => v.slice(0, 200);
  return {
    ...f,
    parentName: cap(f.parentName), relationship: cap(f.relationship), parentPhone: cap(f.parentPhone),
    parentEmail: cap(f.parentEmail), learnerName: cap(f.learnerName), age: cap(f.age), gender: cap(f.gender),
    school: cap(f.school), classGrade: cap(f.classGrade), week: cap(f.week), interests: f.interests.slice(0, 10).map(cap),
    hasLaptop: cap(f.hasLaptop), trip: cap(f.trip), passport: cap(f.passport), photoConsent: cap(f.photoConsent),
    paymentMethod: cap(f.paymentMethod), transactionId: cap(f.transactionId),
  };
}

// The answers as label/value pairs, in form order — for emails.
export function summaryRows(f: HackathonFields): [string, string][] {
  return [
    ["Parent / guardian", `${f.parentName} (${f.relationship})`],
    ["Phone", f.parentPhone],
    ["Email", f.parentEmail],
    ["Child", f.learnerName],
    ["Age", f.age],
    ["Gender", f.gender],
    ["School", f.school],
    ["Class", f.classGrade],
    ["Week", weekLabel(f.week)],
    ["Interests", interestsText(f.interests)],
    ["Has a laptop", f.hasLaptop],
    ["Applying for the trip", f.trip === "Yes" ? `Yes (passport: ${f.passport})` : "No"],
    ["Photo consent", f.photoConsent],
    ["Fee", formatUgx(FEE_UGX)],
    [
      "Payment",
      f.paymentMethod === "Cash"
        ? "Cash"
        : f.transactionId
          ? `MTN MoMo — transaction ID ${f.transactionId}`
          : "MTN MoMo — says they've paid; transaction ID not given yet",
    ],
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
    "Registered", "Child", "Age", "Gender", "School", "Class", "Week", "Interests", "Has laptop", "Trip",
    "Passport", "Photo consent", "Parent / guardian", "Relationship", "Phone", "Email", "Amount (UGX)",
    "Payment method", "Transaction ID", "Status", "Site",
  ];
  const lines = rows.map((r) =>
    [
      r.createdAt.slice(0, 16).replace("T", " "), r.learnerName, r.age, r.gender, r.school, r.classGrade,
      weekLabel(r.week), interestsText(r.interests), r.hasLaptop, r.trip, r.passport, r.photoConsent,
      r.parentName, r.relationship, r.parentPhone, r.parentEmail, r.amountDue, r.paymentMethod,
      r.transactionId, paymentStatus(r), r.site,
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
    if (!key) continue;
    const hit = m.get(key);
    if (hit) hit.count += 1;
    else m.set(key, { name: v.trim().replace(/\s+/g, " "), count: 1 });
  }
  return Array.from(m.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
