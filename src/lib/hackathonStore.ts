import { randomBytes } from "node:crypto";
import { getDb } from "./db";
import {
  FEE_UGX,
  emptyFields,
  samePhone,
  type HackathonFields,
  type HackathonLead,
  type HackathonRow,
  type Step,
} from "./hackathon";

interface RawRow {
  id: number;
  created_at: string;
  updated_at: string;
  parent_name: string;
  relationship: string;
  parent_phone: string;
  parent_email: string;
  learner_name: string;
  age: string;
  gender: string;
  school: string;
  class_grade: string;
  week: string;
  interests: string;
  has_laptop: string;
  trip: string;
  passport: string;
  photo_consent: string;
  parent_consent: number;
  payment_method: string;
  transaction_id: string | null;
  amount_due: number;
  verified: number;
  verified_at: string | null;
  pay_token: string | null;
}

function fromRaw(r: RawRow): HackathonRow {
  let interests: string[] = [];
  try {
    interests = JSON.parse(r.interests);
  } catch {}
  return {
    id: r.id,
    payToken: r.pay_token,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    parentName: r.parent_name,
    relationship: r.relationship,
    parentPhone: r.parent_phone,
    parentEmail: r.parent_email,
    learnerName: r.learner_name,
    age: r.age,
    gender: r.gender,
    school: r.school,
    classGrade: r.class_grade,
    week: r.week,
    interests,
    hasLaptop: r.has_laptop,
    trip: r.trip,
    passport: r.passport,
    photoConsent: r.photo_consent,
    parentConsent: !!r.parent_consent,
    paymentMethod: r.payment_method,
    transactionId: r.transaction_id ?? "",
    amountDue: r.amount_due,
    verified: !!r.verified,
    verifiedAt: r.verified_at,
  };
}

// The form sends a per-draft session id, so a retry or double-click updates the same row
// instead of adding the child twice. Once staff have verified a payment, a resubmit can't
// change the payment details.
export function saveHackathonSignup(
  f: HackathonFields,
  sessionId: string | null,
): { id: number; isNew: boolean; payToken: string } {
  const db = getDb();
  const params = {
    session_id: sessionId,
    now: new Date().toISOString(),
    parent_name: f.parentName,
    relationship: f.relationship,
    parent_phone: f.parentPhone,
    parent_email: f.parentEmail,
    learner_name: f.learnerName,
    age: f.age,
    gender: f.gender,
    school: f.school,
    class_grade: f.classGrade,
    week: f.week,
    interests: JSON.stringify(f.interests),
    has_laptop: f.hasLaptop,
    trip: f.trip,
    passport: f.passport,
    photo_consent: f.photoConsent,
    parent_consent: f.parentConsent ? 1 : 0,
    payment_method: f.paymentMethod,
    transaction_id: f.transactionId || null,
    amount_due: FEE_UGX,
    pay_token: randomBytes(24).toString("hex"),
  };
  const existing = sessionId
    ? (db.prepare("SELECT id, pay_token FROM hackathon_signups WHERE session_id = ?").get(sessionId) as
        | { id: number; pay_token: string | null }
        | undefined)
    : undefined;
  if (existing) {
    db.prepare(
      `UPDATE hackathon_signups SET updated_at = @now, parent_name = @parent_name, relationship = @relationship,
        parent_phone = @parent_phone, parent_email = @parent_email, learner_name = @learner_name, age = @age,
        gender = @gender, school = @school, class_grade = @class_grade, week = @week, interests = @interests,
        has_laptop = @has_laptop, trip = @trip, passport = @passport, photo_consent = @photo_consent,
        parent_consent = @parent_consent,
        payment_method = CASE WHEN verified = 1 THEN payment_method ELSE @payment_method END,
        transaction_id = CASE WHEN verified = 1 THEN transaction_id ELSE COALESCE(@transaction_id, transaction_id) END,
        pay_token = COALESCE(pay_token, @pay_token)
       WHERE id = @id`,
    ).run({ ...params, id: existing.id });
    return { id: existing.id, isNew: false, payToken: existing.pay_token ?? params.pay_token };
  }
  const result = db
    .prepare(
      `INSERT INTO hackathon_signups (session_id, created_at, updated_at, parent_name, relationship, parent_phone,
        parent_email, learner_name, age, gender, school, class_grade, week, interests, has_laptop, trip, passport,
        photo_consent, parent_consent, payment_method, transaction_id, amount_due, pay_token)
       VALUES (@session_id, @now, @now, @parent_name, @relationship, @parent_phone, @parent_email, @learner_name,
        @age, @gender, @school, @class_grade, @week, @interests, @has_laptop, @trip, @passport, @photo_consent,
        @parent_consent, @payment_method, @transaction_id, @amount_due, @pay_token)`,
    )
    .run(params);
  return { id: Number(result.lastInsertRowid), isNew: true, payToken: params.pay_token };
}

export function listHackathonSignups(): HackathonRow[] {
  const db = getDb();
  return (db.prepare("SELECT * FROM hackathon_signups ORDER BY created_at DESC").all() as RawRow[]).map(fromRaw);
}

// Verified = staff checked the MoMo statement, or received the cash.
export function setHackathonVerified(id: number, verified: boolean): void {
  getDb()
    .prepare("UPDATE hackathon_signups SET verified = ?, verified_at = ? WHERE id = ?")
    .run(verified ? 1 : 0, verified ? new Date().toISOString() : null, id);
}

// ---- The family's pay link (/hackathon/pay/<token>) ----

export const isPayToken = (t: string) => /^[a-f0-9]{48}$/.test(t);

export function getSignupByPayToken(token: string): HackathonRow | null {
  if (!isPayToken(token)) return null;
  const raw = getDb().prepare("SELECT * FROM hackathon_signups WHERE pay_token = ?").get(token) as RawRow | undefined;
  return raw ? fromRaw(raw) : null;
}

// Adds or corrects the MoMo transaction ID, unless staff have already verified the payment.
export function setTransactionIdByPayToken(token: string, transactionId: string): HackathonRow | null {
  if (!isPayToken(token)) return null;
  const db = getDb();
  const changed = db
    .prepare(
      `UPDATE hackathon_signups SET transaction_id = ?, payment_method = 'MTN MoMo', updated_at = ?
       WHERE pay_token = ? AND verified = 0`,
    )
    .run(transactionId, new Date().toISOString(), token).changes;
  return changed ? getSignupByPayToken(token) : null;
}

// ---- Unfinished forms ----

interface RawLead {
  id: number;
  session_id: string;
  phone: string;
  data: string;
  step: number;
  created_at: string;
  updated_at: string;
  contacted: number;
  dismissed: number;
}

function leadFromRaw(r: RawLead): HackathonLead {
  let fields = emptyFields();
  try {
    fields = { ...fields, ...JSON.parse(r.data) };
  } catch {}
  return {
    id: r.id,
    step: (r.step === 1 || r.step === 2 ? r.step : 0) as Step,
    fields,
    contacted: !!r.contacted,
    dismissed: !!r.dismissed,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// Upserts the draft by session; a lead that already became a registration is left alone.
export function saveHackathonLead(sessionId: string, f: HackathonFields, step: Step): void {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO hackathon_leads (session_id, phone, data, step, created_at, updated_at)
       VALUES (@session_id, @phone, @data, @step, @now, @now)
       ON CONFLICT(session_id) DO UPDATE SET phone = @phone, data = @data,
         step = MAX(step, @step), updated_at = @now
       WHERE submitted = 0`,
    )
    .run({ session_id: sessionId, phone: f.parentPhone, data: JSON.stringify(f), step, now });
}

export function markHackathonLeadSubmitted(sessionId: string): void {
  getDb().prepare("UPDATE hackathon_leads SET submitted = 1 WHERE session_id = ?").run(sessionId);
}

// Unsubmitted leads, minus any whose phone already has a registration (finished on another
// device or another visit). Newest first; dismissed ones listed separately.
export function listHackathonLeads(): { open: HackathonLead[]; dismissed: HackathonLead[] } {
  const db = getDb();
  const phones = (db.prepare("SELECT parent_phone FROM hackathon_signups").all() as { parent_phone: string }[]).map(
    (r) => r.parent_phone,
  );
  const leads = (
    db.prepare("SELECT * FROM hackathon_leads WHERE submitted = 0 ORDER BY updated_at DESC").all() as RawLead[]
  )
    .filter((r) => !phones.some((p) => samePhone(p, r.phone)))
    .map(leadFromRaw);
  return { open: leads.filter((l) => !l.dismissed), dismissed: leads.filter((l) => l.dismissed) };
}

export function setHackathonLeadFlag(id: number, flag: "contacted" | "dismissed", value: boolean): void {
  const column = flag === "contacted" ? "contacted" : "dismissed";
  getDb().prepare(`UPDATE hackathon_leads SET ${column} = ? WHERE id = ?`).run(value ? 1 : 0, id);
}
