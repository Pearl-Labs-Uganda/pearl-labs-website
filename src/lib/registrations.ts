import { getDb } from "./db";
import { computeAmountDue } from "./fee";
import { normalizeTransactionId } from "./transactionId";
import { hasSiblingDiscount, type SiblingIdentity } from "./siblings";

export type PaymentMethod = "MTN MoMo" | "Cash";

export interface RegistrationInput {
  parentName: string;
  relationship: string;
  profession: string;
  phone: string;
  altPhone?: string;
  email: string;
  address: string;
  studentName: string;
  age: string;
  gender: string;
  school: string;
  classGrade: string;
  cohort: string;
  hasLaptop: string;
  modules: string[];
  hearAbout: string;
  hearAboutOther?: string;
  pickupService: string;
  pickupLocation?: string;
  medicalInfo?: string;
  additionalInfo?: string;
  agreeTerms: boolean;
  photoConsent: string;
  paymentMethod: PaymentMethod;
  transactionId?: string;
}

export interface RegistrationRow extends Omit<RegistrationInput, "transactionId"> {
  id: number;
  amountDue: number;
  transactionId?: string;
  verified: boolean;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowFromDb(raw: any): RegistrationRow {
  return {
    id: raw.id,
    parentName: raw.parent_name,
    relationship: raw.relationship,
    profession: raw.profession,
    phone: raw.phone,
    altPhone: raw.alt_phone ?? undefined,
    email: raw.email,
    address: raw.address,
    studentName: raw.student_name,
    age: raw.age,
    gender: raw.gender,
    school: raw.school,
    classGrade: raw.class_grade,
    cohort: raw.cohort,
    hasLaptop: raw.has_laptop,
    modules: JSON.parse(raw.modules),
    amountDue: raw.amount_due,
    hearAbout: raw.hear_about,
    hearAboutOther: raw.hear_about_other ?? undefined,
    pickupService: raw.pickup_service,
    pickupLocation: raw.pickup_location ?? undefined,
    medicalInfo: raw.medical_info ?? undefined,
    additionalInfo: raw.additional_info ?? undefined,
    agreeTerms: !!raw.agree_terms,
    photoConsent: raw.photo_consent,
    paymentMethod: raw.payment_method as PaymentMethod,
    transactionId: raw.transaction_id ?? undefined,
    verified: !!raw.verified,
    verifiedAt: raw.verified_at ?? null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function paramsFromInput(
  input: RegistrationInput,
  amountDue: number,
  transactionId: string | null,
  sessionId: string | null,
) {
  return {
    session_id: sessionId,
    parent_name: input.parentName,
    relationship: input.relationship,
    profession: input.profession,
    phone: input.phone,
    alt_phone: input.altPhone ?? null,
    email: input.email,
    address: input.address,
    student_name: input.studentName,
    age: input.age,
    gender: input.gender,
    school: input.school,
    class_grade: input.classGrade,
    cohort: input.cohort,
    has_laptop: input.hasLaptop,
    modules: JSON.stringify(input.modules),
    amount_due: amountDue,
    hear_about: input.hearAbout,
    hear_about_other: input.hearAboutOther ?? null,
    pickup_service: input.pickupService,
    pickup_location: input.pickupLocation ?? null,
    medical_info: input.medicalInfo ?? null,
    additional_info: input.additionalInfo ?? null,
    agree_terms: input.agreeTerms ? 1 : 0,
    photo_consent: input.photoConsent,
    payment_method: input.paymentMethod,
    transaction_id: transactionId,
  };
}

export function existingSiblingIdentities(): SiblingIdentity[] {
  const db = getDb();
  return (
    db.prepare("SELECT id, parent_name, phone, student_name FROM registrations").all() as {
      id: number;
      parent_name: string;
      phone: string;
      student_name: string;
    }[]
  ).map((row) => ({
    id: row.id,
    parentName: row.parent_name,
    phone: row.phone,
    studentName: row.student_name,
  }));
}

export function saveRegistration(
  input: RegistrationInput,
  id?: number,
  sessionId?: string,
): RegistrationRow {
  const db = getDb();
  const now = new Date().toISOString();

  // A resubmit of the same in-progress registration (dropped response,
  // double-click, retry after an error) carries the same client-generated
  // sessionId — reuse that row's id instead of inserting a duplicate.
  const targetId =
    id ??
    (sessionId
      ? (db.prepare("SELECT id FROM registrations WHERE session_id = ?").get(sessionId) as
          | { id: number }
          | undefined)?.id
      : undefined);

  // Server-authoritative: always recomputed here from the current DB state,
  // never trusts anything the client sent. Excluding targetId keeps a
  // resubmit of this same row from counting itself as its own sibling.
  const siblingDiscount = hasSiblingDiscount(existingSiblingIdentities(), {
    id: targetId,
    parentName: input.parentName,
    phone: input.phone,
    studentName: input.studentName,
  });
  const amountDue = computeAmountDue(input.modules, siblingDiscount);
  const newTransactionId = normalizeTransactionId(input.transactionId);
  const params = paramsFromInput(input, amountDue, newTransactionId, sessionId ?? null);

  if (targetId != null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = db.prepare("SELECT * FROM registrations WHERE id = ?").get(targetId) as any;
    if (existing) {
      db.prepare(
        `UPDATE registrations SET
          updated_at = @updated_at, session_id = COALESCE(@session_id, session_id),
          parent_name = @parent_name, relationship = @relationship,
          profession = @profession, phone = @phone, alt_phone = @alt_phone, email = @email,
          address = @address, student_name = @student_name, age = @age, gender = @gender,
          school = @school, class_grade = @class_grade, cohort = @cohort, has_laptop = @has_laptop,
          modules = @modules, amount_due = @amount_due, hear_about = @hear_about,
          hear_about_other = @hear_about_other, pickup_service = @pickup_service,
          pickup_location = @pickup_location, medical_info = @medical_info,
          additional_info = @additional_info, agree_terms = @agree_terms,
          photo_consent = @photo_consent, payment_method = @payment_method,
          transaction_id = @transaction_id
        WHERE id = @id`,
      ).run({ id: targetId, updated_at: now, ...params });

      const updated = db.prepare("SELECT * FROM registrations WHERE id = ?").get(targetId);
      return rowFromDb(updated);
    }
  }

  const info = db
    .prepare(
      `INSERT INTO registrations (
        created_at, updated_at, session_id, parent_name, relationship, profession, phone, alt_phone,
        email, address, student_name, age, gender, school, class_grade, cohort, has_laptop,
        modules, amount_due, hear_about, hear_about_other, pickup_service, pickup_location,
        medical_info, additional_info, agree_terms, photo_consent, payment_method,
        transaction_id, verified, verified_at
      ) VALUES (
        @created_at, @updated_at, @session_id, @parent_name, @relationship, @profession, @phone, @alt_phone,
        @email, @address, @student_name, @age, @gender, @school, @class_grade, @cohort, @has_laptop,
        @modules, @amount_due, @hear_about, @hear_about_other, @pickup_service, @pickup_location,
        @medical_info, @additional_info, @agree_terms, @photo_consent, @payment_method,
        @transaction_id, 0, NULL
      )`,
    )
    .run({ created_at: now, updated_at: now, ...params });

  const created = db.prepare("SELECT * FROM registrations WHERE id = ?").get(info.lastInsertRowid);
  return rowFromDb(created);
}

export function listRegistrations(): RegistrationRow[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM registrations ORDER BY created_at DESC").all();
  return rows.map(rowFromDb);
}

export function markVerified(id: number): RegistrationRow | null {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db.prepare("UPDATE registrations SET verified = 1, verified_at = ? WHERE id = ?").run(now, id);
  if (result.changes === 0) return null;
  const updated = db.prepare("SELECT * FROM registrations WHERE id = ?").get(id);
  return rowFromDb(updated);
}
