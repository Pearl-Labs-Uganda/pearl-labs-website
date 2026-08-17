import { getDb } from "./db";
import { computeAmountDue } from "./fee";

export interface IncompleteLeadInput {
  sessionId: string;
  phone: string;
  parentName?: string;
  relationship?: string;
  profession?: string;
  altPhone?: string;
  email?: string;
  address?: string;
  studentName?: string;
  age?: string;
  gender?: string;
  school?: string;
  classGrade?: string;
  cohort?: string;
  hasLaptop?: string;
  modules?: string[];
  hearAbout?: string;
  hearAboutOther?: string;
  transactionId?: string;
  pickupService?: string;
  pickupLocation?: string;
  medicalInfo?: string;
  additionalInfo?: string;
  agreeTerms?: boolean;
  photoConsent?: string;
}

export interface IncompleteLeadRow {
  id: number;
  sessionId: string;
  phone: string;
  parentName: string | null;
  relationship: string | null;
  profession: string | null;
  altPhone: string | null;
  email: string | null;
  address: string | null;
  studentName: string | null;
  age: string | null;
  gender: string | null;
  school: string | null;
  classGrade: string | null;
  cohort: string | null;
  hasLaptop: string | null;
  modules: string[];
  hearAbout: string | null;
  hearAboutOther: string | null;
  transactionId: string | null;
  pickupService: string | null;
  pickupLocation: string | null;
  medicalInfo: string | null;
  additionalInfo: string | null;
  agreeTerms: boolean;
  photoConsent: string | null;
  amountDue: number;
  createdAt: string;
  updatedAt: string;
  submitted: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowFromDb(raw: any): IncompleteLeadRow {
  let modules: string[] = [];
  try {
    if (raw.modules) {
      modules = typeof raw.modules === "string" ? JSON.parse(raw.modules) : raw.modules;
    }
  } catch {
    modules = [];
  }

  return {
    id: raw.id,
    sessionId: raw.session_id,
    phone: raw.phone,
    parentName: raw.parent_name ?? null,
    relationship: raw.relationship ?? null,
    profession: raw.profession ?? null,
    altPhone: raw.alt_phone ?? null,
    email: raw.email ?? null,
    address: raw.address ?? null,
    studentName: raw.student_name ?? null,
    age: raw.age ?? null,
    gender: raw.gender ?? null,
    school: raw.school ?? null,
    classGrade: raw.class_grade ?? null,
    cohort: raw.cohort ?? null,
    hasLaptop: raw.has_laptop ?? null,
    modules: Array.isArray(modules) ? modules : [],
    hearAbout: raw.hear_about ?? null,
    hearAboutOther: raw.hear_about_other ?? null,
    transactionId: raw.transaction_id ?? null,
    pickupService: raw.pickup_service ?? null,
    pickupLocation: raw.pickup_location ?? null,
    medicalInfo: raw.medical_info ?? null,
    additionalInfo: raw.additional_info ?? null,
    agreeTerms: !!raw.agree_terms,
    photoConsent: raw.photo_consent ?? null,
    amountDue: raw.amount_due ?? 0,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    submitted: !!raw.submitted,
  };
}

function textOrNull(value: string | undefined): string | null {
  return value?.trim() || null;
}

export function saveIncompleteLead(input: IncompleteLeadInput): IncompleteLeadRow {
  const db = getDb();
  const now = new Date().toISOString();
  const modulesList = input.modules ?? [];
  const amountDue = computeAmountDue(modulesList);

  const params = {
    session_id: input.sessionId,
    phone: input.phone.trim(),
    parent_name: textOrNull(input.parentName),
    relationship: textOrNull(input.relationship),
    profession: textOrNull(input.profession),
    alt_phone: textOrNull(input.altPhone),
    email: textOrNull(input.email),
    address: textOrNull(input.address),
    student_name: textOrNull(input.studentName),
    age: textOrNull(input.age),
    gender: textOrNull(input.gender),
    school: textOrNull(input.school),
    class_grade: textOrNull(input.classGrade),
    cohort: textOrNull(input.cohort),
    has_laptop: textOrNull(input.hasLaptop),
    modules: JSON.stringify(modulesList),
    hear_about: textOrNull(input.hearAbout),
    hear_about_other: textOrNull(input.hearAboutOther),
    transaction_id: textOrNull(input.transactionId),
    pickup_service: textOrNull(input.pickupService),
    pickup_location: textOrNull(input.pickupLocation),
    medical_info: textOrNull(input.medicalInfo),
    additional_info: textOrNull(input.additionalInfo),
    agree_terms: input.agreeTerms ? 1 : 0,
    photo_consent: textOrNull(input.photoConsent),
    amount_due: amountDue,
    updated_at: now,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = db
    .prepare("SELECT id FROM incomplete_registrations WHERE session_id = ?")
    .get(input.sessionId) as any;

  if (existing) {
    db.prepare(
      `UPDATE incomplete_registrations SET
        phone = @phone,
        parent_name = @parent_name,
        relationship = @relationship,
        profession = @profession,
        alt_phone = @alt_phone,
        email = @email,
        address = @address,
        student_name = @student_name,
        age = @age,
        gender = @gender,
        school = @school,
        class_grade = @class_grade,
        cohort = @cohort,
        has_laptop = @has_laptop,
        modules = @modules,
        hear_about = @hear_about,
        hear_about_other = @hear_about_other,
        transaction_id = @transaction_id,
        pickup_service = @pickup_service,
        pickup_location = @pickup_location,
        medical_info = @medical_info,
        additional_info = @additional_info,
        agree_terms = @agree_terms,
        photo_consent = @photo_consent,
        amount_due = @amount_due,
        updated_at = @updated_at
      WHERE session_id = @session_id`,
    ).run(params);

    const updated = db
      .prepare("SELECT * FROM incomplete_registrations WHERE session_id = ?")
      .get(input.sessionId);
    return rowFromDb(updated);
  }

  const info = db
    .prepare(
      `INSERT INTO incomplete_registrations (
        session_id, phone, parent_name, relationship, profession, alt_phone,
        email, address, student_name, age, gender, school, class_grade,
        cohort, has_laptop, modules, hear_about, hear_about_other,
        transaction_id, pickup_service, pickup_location, medical_info,
        additional_info, agree_terms, photo_consent, amount_due,
        created_at, updated_at, submitted
      ) VALUES (
        @session_id, @phone, @parent_name, @relationship, @profession, @alt_phone,
        @email, @address, @student_name, @age, @gender, @school, @class_grade,
        @cohort, @has_laptop, @modules, @hear_about, @hear_about_other,
        @transaction_id, @pickup_service, @pickup_location, @medical_info,
        @additional_info, @agree_terms, @photo_consent, @amount_due,
        @created_at, @updated_at, 0
      )`,
    )
    .run({ ...params, created_at: now });

  const created = db
    .prepare("SELECT * FROM incomplete_registrations WHERE id = ?")
    .get(info.lastInsertRowid);
  return rowFromDb(created);
}

export function markLeadSubmitted(sessionId: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    "UPDATE incomplete_registrations SET submitted = 1, updated_at = ? WHERE session_id = ?",
  ).run(now, sessionId);
}

export function listIncompleteLeads(): IncompleteLeadRow[] {
  const db = getDb();
  // Filter out any lead already submitted, dismissed by staff, or whose
  // phone number is now in completed registrations
  const rows = db
    .prepare(
      `SELECT * FROM incomplete_registrations
       WHERE submitted = 0
         AND dismissed = 0
         AND phone != ''
         AND phone NOT IN (SELECT phone FROM registrations WHERE phone != '')
       ORDER BY updated_at DESC`,
    )
    .all();

  return rows.map(rowFromDb);
}

export function listDismissedLeads(): IncompleteLeadRow[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM incomplete_registrations
       WHERE dismissed = 1 AND submitted = 0
       ORDER BY updated_at DESC`,
    )
    .all();

  return rows.map(rowFromDb);
}

// Soft delete — staff dismissing a lead from the dashboard shouldn't
// permanently destroy a real person's data on a misclick. The row stays in
// the DB (recoverable by flipping dismissed back to 0) but is filtered out
// of listIncompleteLeads() above.
export function deleteLead(id: number): void {
  const db = getDb();
  db.prepare("UPDATE incomplete_registrations SET dismissed = 1 WHERE id = ?").run(id);
}

export function restoreLead(id: number): void {
  const db = getDb();
  db.prepare("UPDATE incomplete_registrations SET dismissed = 0 WHERE id = ?").run(id);
}
