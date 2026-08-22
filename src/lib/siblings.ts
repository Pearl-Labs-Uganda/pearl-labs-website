import { computeAmountDue } from "./fee";

// Pure matching logic, no DB access — safe to import from both server code
// (registrations.ts/leads.ts, which fetch the rows) and client components
// (the dev dashboard, which already has the full registrations array).

export interface SiblingIdentity {
  id?: number;
  parentName: string;
  phone: string;
  studentName: string;
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

function sameParent(a: SiblingIdentity, b: SiblingIdentity): boolean {
  return (
    normalizeName(a.parentName) === normalizeName(b.parentName) &&
    normalizePhone(a.phone) === normalizePhone(b.phone)
  );
}

// Counts other distinct kids this parent has registered, excluding the
// registration being saved right now (matched by id when updating, and
// always by student name — a resubmission of the same kid under the same
// parent must never be counted as a second sibling).
export function countOtherSiblings(
  existing: SiblingIdentity[],
  current: SiblingIdentity,
): number {
  const currentStudent = normalizeName(current.studentName);
  const siblingStudentNames = new Set<string>();

  for (const row of existing) {
    if (current.id != null && row.id === current.id) continue;
    if (!sameParent(row, current)) continue;
    const studentName = normalizeName(row.studentName);
    if (!studentName || studentName === currentStudent) continue;
    siblingStudentNames.add(studentName);
  }

  return siblingStudentNames.size;
}

export function hasSiblingDiscount(
  existing: SiblingIdentity[],
  current: SiblingIdentity,
): boolean {
  return countOtherSiblings(existing, current) >= 1;
}

// For the dashboard: flags registrations that belong to a parent with 2+
// distinct kids but whose stored amountDue doesn't reflect the sibling
// discount yet — i.e. the ones staff should look at, per the "flag, don't
// silently rewrite past amounts" decision.
export function computeSiblingReviewFlags<
  T extends SiblingIdentity & { modules: string[]; amountDue: number },
>(registrations: T[]): Set<number> {
  const flagged = new Set<number>();

  for (const row of registrations) {
    if (row.id == null) continue;
    const siblingCount = countOtherSiblings(registrations, row);
    if (siblingCount < 1) continue;
    const discountedAmount = computeAmountDue(row.modules, true);
    if (row.amountDue !== discountedAmount) {
      flagged.add(row.id);
    }
  }

  return flagged;
}
