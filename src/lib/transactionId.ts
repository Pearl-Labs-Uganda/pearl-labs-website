// Words parents type into the optional Transaction ID field when they mean
// "I don't have one yet" instead of leaving it blank. Treated as no
// transaction ID at all — otherwise they get emailed as "paid" and land in
// the dashboard's Awaiting Verification bucket despite never having paid.
const PLACEHOLDER_TOKENS = new Set([
  "na",
  "none",
  "no",
  "nil",
  "null",
  "nan",
  "notyet",
  "notpaid",
  "notpaidyet",
  "havenotpaid",
  "pending",
  "tbd",
  "unpaid",
  "0",
]);

export function normalizeTransactionId(raw: string | undefined | null): string | null {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return null;

  const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!normalized || PLACEHOLDER_TOKENS.has(normalized)) return null;

  return trimmed;
}

// MTN MoMo confirmation references are always a run of digits/letters with no
// spaces, and real ones we've seen are 8+ characters — short entries that
// survive placeholder normalization (e.g. "abc", "123") are almost always a
// typo or a parent guessing, not a real reference. Reject rather than
// silently accept, so the parent gets a chance to fix it before submitting.
const MIN_TRANSACTION_ID_LENGTH = 8;

export function isValidMomoTransactionId(raw: string | undefined | null): boolean {
  const normalized = normalizeTransactionId(raw);
  if (normalized === null) return true; // blank / placeholder — allowed, just means "not paid yet"
  return /^[A-Za-z0-9]+$/.test(normalized) && normalized.length >= MIN_TRANSACTION_ID_LENGTH;
}
