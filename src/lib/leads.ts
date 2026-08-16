import { getDb } from "./db";
import { computeAmountDue } from "./fee";

export interface IncompleteLeadInput {
  sessionId: string;
  phone: string;
  parentName?: string;
  studentName?: string;
  email?: string;
  modules?: string[];
}

export interface IncompleteLeadRow {
  id: number;
  sessionId: string;
  phone: string;
  parentName: string | null;
  studentName: string | null;
  email: string | null;
  modules: string[];
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
    studentName: raw.student_name ?? null,
    email: raw.email ?? null,
    modules: Array.isArray(modules) ? modules : [],
    amountDue: raw.amount_due ?? 0,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    submitted: !!raw.submitted,
  };
}

export function saveIncompleteLead(input: IncompleteLeadInput): IncompleteLeadRow {
  const db = getDb();
  const now = new Date().toISOString();
  const modulesList = input.modules ?? [];
  const amountDue = computeAmountDue(modulesList);
  const modulesJson = JSON.stringify(modulesList);

  const cleanPhone = input.phone.trim();
  const cleanParentName = input.parentName?.trim() || null;
  const cleanStudentName = input.studentName?.trim() || null;
  const cleanEmail = input.email?.trim() || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = db
    .prepare("SELECT * FROM incomplete_registrations WHERE session_id = ?")
    .get(input.sessionId) as any;

  if (existing) {
    db.prepare(
      `UPDATE incomplete_registrations SET
        phone = @phone,
        parent_name = @parent_name,
        student_name = @student_name,
        email = @email,
        modules = @modules,
        amount_due = @amount_due,
        updated_at = @updated_at
      WHERE session_id = @session_id`,
    ).run({
      session_id: input.sessionId,
      phone: cleanPhone,
      parent_name: cleanParentName,
      student_name: cleanStudentName,
      email: cleanEmail,
      modules: modulesJson,
      amount_due: amountDue,
      updated_at: now,
    });

    const updated = db
      .prepare("SELECT * FROM incomplete_registrations WHERE session_id = ?")
      .get(input.sessionId);
    return rowFromDb(updated);
  }

  const info = db
    .prepare(
      `INSERT INTO incomplete_registrations (
        session_id, phone, parent_name, student_name, email,
        modules, amount_due, created_at, updated_at, submitted
      ) VALUES (
        @session_id, @phone, @parent_name, @student_name, @email,
        @modules, @amount_due, @created_at, @updated_at, 0
      )`,
    )
    .run({
      session_id: input.sessionId,
      phone: cleanPhone,
      parent_name: cleanParentName,
      student_name: cleanStudentName,
      email: cleanEmail,
      modules: modulesJson,
      amount_due: amountDue,
      created_at: now,
      updated_at: now,
    });

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
  // Filter out any lead already submitted or whose phone number is now in completed registrations
  const rows = db
    .prepare(
      `SELECT * FROM incomplete_registrations
       WHERE submitted = 0
         AND phone != ''
         AND phone NOT IN (SELECT phone FROM registrations WHERE phone != '')
       ORDER BY updated_at DESC`,
    )
    .all();

  return rows.map(rowFromDb);
}

export function deleteLead(id: number): void {
  const db = getDb();
  db.prepare("DELETE FROM incomplete_registrations WHERE id = ?").run(id);
}
