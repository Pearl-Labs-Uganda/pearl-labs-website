import { getDb } from "./db";
import type { HackathonFields, HackathonRow } from "./hackathon";

interface RawRow {
  id: number;
  created_at: string;
  updated_at: string;
  learner_name: string;
  age: string;
  gender: string;
  school: string;
  class_grade: string;
  parent_name: string;
  relationship: string;
  parent_phone: string;
  parent_email: string;
  week: string;
  interests: string;
  has_laptop: string;
  trip: string;
  passport: string;
  hear_about: string;
  parent_consent: number;
  photo_consent: string;
}

function fromRaw(r: RawRow): HackathonRow {
  let interests: string[] = [];
  try {
    interests = JSON.parse(r.interests);
  } catch {}
  return {
    id: r.id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    learnerName: r.learner_name,
    age: r.age,
    gender: r.gender,
    school: r.school,
    classGrade: r.class_grade,
    parentName: r.parent_name,
    relationship: r.relationship,
    parentPhone: r.parent_phone,
    parentEmail: r.parent_email,
    week: r.week,
    interests,
    hasLaptop: r.has_laptop,
    trip: r.trip,
    passport: r.passport,
    hearAbout: r.hear_about,
    parentConsent: !!r.parent_consent,
    photoConsent: r.photo_consent,
  };
}

// The form sends a per-draft session id, so a retry or double-click updates the same row
// instead of adding the learner twice.
export function saveHackathonRegistration(f: HackathonFields, sessionId: string | null): { id: number; isNew: boolean } {
  const db = getDb();
  const now = new Date().toISOString();
  const params = {
    session_id: sessionId,
    now,
    learner_name: f.learnerName,
    age: f.age,
    gender: f.gender,
    school: f.school,
    class_grade: f.classGrade,
    parent_name: f.parentName,
    relationship: f.relationship,
    parent_phone: f.parentPhone,
    parent_email: f.parentEmail,
    week: f.week,
    interests: JSON.stringify(f.interests),
    has_laptop: f.hasLaptop,
    trip: f.trip,
    passport: f.passport,
    hear_about: f.hearAbout,
    parent_consent: f.parentConsent ? 1 : 0,
    photo_consent: f.photoConsent,
  };
  const existing = sessionId
    ? (db.prepare("SELECT id FROM hackathon_registrations WHERE session_id = ?").get(sessionId) as { id: number } | undefined)
    : undefined;
  if (existing) {
    db.prepare(
      `UPDATE hackathon_registrations SET updated_at = @now, learner_name = @learner_name, age = @age,
        gender = @gender, school = @school, class_grade = @class_grade, parent_name = @parent_name,
        relationship = @relationship, parent_phone = @parent_phone, parent_email = @parent_email, week = @week,
        interests = @interests, has_laptop = @has_laptop, trip = @trip, passport = @passport,
        hear_about = @hear_about, parent_consent = @parent_consent, photo_consent = @photo_consent
       WHERE id = @id`,
    ).run({ ...params, id: existing.id });
    return { id: existing.id, isNew: false };
  }
  const result = db
    .prepare(
      `INSERT INTO hackathon_registrations (session_id, created_at, updated_at, learner_name, age, gender, school,
        class_grade, parent_name, relationship, parent_phone, parent_email, week, interests, has_laptop, trip,
        passport, hear_about, parent_consent, photo_consent)
       VALUES (@session_id, @now, @now, @learner_name, @age, @gender, @school, @class_grade, @parent_name,
        @relationship, @parent_phone, @parent_email, @week, @interests, @has_laptop, @trip, @passport,
        @hear_about, @parent_consent, @photo_consent)`,
    )
    .run(params);
  return { id: Number(result.lastInsertRowid), isNew: true };
}

export function listHackathonRegistrations(): HackathonRow[] {
  const db = getDb();
  return (db.prepare("SELECT * FROM hackathon_registrations ORDER BY created_at DESC").all() as RawRow[]).map(fromRaw);
}
