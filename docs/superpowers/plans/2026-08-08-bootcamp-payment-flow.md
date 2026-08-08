# Bootcamp Registration, MTN MoMo Payment & Dev Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let anyone submit the bootcamp registration form (with a multi-module selection), pay via a published MTN MoMo Pay Bill code, optionally attach a transaction ID now or later without re-typing the form, and give the site owner a password-gated dashboard to track who's unpaid, awaiting verification, or verified.

**Architecture:** A new SQLite-backed persistence layer (`src/lib/db.ts`, `src/lib/registrations.ts`) sits behind the existing `/api/internship-apply` route, which becomes upsert-capable and only emails a registration when a transaction ID is newly added or changed. The registration form gains client-side `localStorage` draft persistence keyed to a server-issued row ID. A separate, password-gated `/dev/registrations` dashboard (guarded by `middleware.ts`) reads directly from the same data layer.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, `better-sqlite3` (new), `vitest` (new, for the first test suite this project has had), existing `nodemailer`.

## Global Constraints

- Fee: UGX 500,000 per module; UGX 450,000 per module if 2 or more modules are selected. Modules are exactly: `"AI & Coding"`, `"Robotics"`, `"Aerospace CAD & 3D Printing"` (the site's existing, fuller track names — not the PDF's shorter labels).
- Schedule copy everywhere on the site changes to **Monday–Saturday**.
- Partnership copy everywhere changes to: "Pearl AI Labs, in partnership with Lwera Electronics & Semi-conductors and the National ICT Innovation Hub" — replacing every "KateD Learning" mention.
- The phone number `+256 763 839356` in the `InternshipApply.tsx` bottom payment note must not change — only the fee wording around it changes.
- MTN MoMo payment instructions: Pay Bill / merchant code **07778381**, dialed via `*165*3#`. Do **not** display any recipient/account name next to it.
- Remove the "Parent/Guardian Signature (Full Name)" field entirely (form state, validation, JSX, API payload type, email template) — it duplicated the Section 1 parent name field.
- A registration email to `pearllabsug@gmail.com` fires **only** when the incoming `transactionId` is non-empty and different from what was already stored for that row (covers first submission with an ID, and later corrections) — never on a bare registration.
- New dependencies: `better-sqlite3`, `@types/better-sqlite3`, `vitest` (dev). No new hosted services, no MTN API integration — "Verified" in the dashboard is a manual bookkeeping flag only, never automated.
- SQLite file lives at `data/registrations.db`; `/data` must be added to `.gitignore` (same pattern as the existing `/details` exclusion) and never committed.
- Dev dashboard auth is a single shared password (`DEV_DASHBOARD_PASSWORD` env var) plus an HMAC-signed session cookie (`DEV_SESSION_SECRET` env var) — no per-user accounts, no third-party auth.
- No enrollment-capacity enforcement — the "30 spots per cohort" figure is informational copy only.

---

### Task 1: Add dependencies and test tooling

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/__smoke__.test.ts` (deleted again in this same task once real tests exist — actually keep it out; see steps)

**Interfaces:**
- Produces: a working `npm test` command (`vitest run`) that later tasks' test files can rely on.

- [ ] **Step 1: Install the new dependencies**

Run:
```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3 vitest
```

- [ ] **Step 2: Add the test script**

In `package.json`, add a `test` entry to `"scripts"`:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run"
},
```

- [ ] **Step 3: Create the vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 4: Write a throwaway smoke test to confirm the setup works**

Create `src/lib/__smoke__.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("vitest setup", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: 1 test file, 1 test, PASS.

- [ ] **Step 6: Delete the smoke test**

The setup is confirmed working; delete `src/lib/__smoke__.test.ts` so it doesn't linger as dead weight (real tests start in Task 2).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add better-sqlite3 and vitest test tooling"
```

---

### Task 2: Fee calculation module

**Files:**
- Create: `src/lib/fee.ts`
- Test: `src/lib/fee.test.ts`

**Interfaces:**
- Produces: `MODULE_NAMES: readonly string[]`, `computeAmountDue(modules: string[]): number`, `formatUgx(amount: number): string` — imported by the registration form (client-side, Task 8), the API route (Task 7), and the registrations data layer (Task 4).

- [ ] **Step 1: Write the failing tests**

Create `src/lib/fee.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { computeAmountDue, formatUgx, MODULE_NAMES } from "./fee";

describe("MODULE_NAMES", () => {
  it("lists exactly the three bootcamp modules", () => {
    expect(MODULE_NAMES).toEqual([
      "AI & Coding",
      "Robotics",
      "Aerospace CAD & 3D Printing",
    ]);
  });
});

describe("computeAmountDue", () => {
  it("is 0 for no modules selected", () => {
    expect(computeAmountDue([])).toBe(0);
  });

  it("is 500,000 for exactly one module", () => {
    expect(computeAmountDue(["AI & Coding"])).toBe(500_000);
  });

  it("is 450,000 per module when two modules are selected", () => {
    expect(computeAmountDue(["AI & Coding", "Robotics"])).toBe(900_000);
  });

  it("is 450,000 per module when all three modules are selected", () => {
    expect(
      computeAmountDue(["AI & Coding", "Robotics", "Aerospace CAD & 3D Printing"]),
    ).toBe(1_350_000);
  });
});

describe("formatUgx", () => {
  it("formats with thousands separators and a UGX prefix", () => {
    expect(formatUgx(500_000)).toBe("UGX 500,000");
    expect(formatUgx(1_350_000)).toBe("UGX 1,350,000");
    expect(formatUgx(0)).toBe("UGX 0");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- fee.test.ts`
Expected: FAIL with "Cannot find module './fee'" (the file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/lib/fee.ts`:

```ts
export const MODULE_NAMES = [
  "AI & Coding",
  "Robotics",
  "Aerospace CAD & 3D Printing",
] as const;

const SINGLE_MODULE_FEE = 500_000;
const MULTI_MODULE_FEE_PER_MODULE = 450_000;

export function computeAmountDue(modules: string[]): number {
  const count = modules.length;
  if (count === 0) return 0;
  const perModule = count >= 2 ? MULTI_MODULE_FEE_PER_MODULE : SINGLE_MODULE_FEE;
  return count * perModule;
}

export function formatUgx(amount: number): string {
  return `UGX ${amount.toLocaleString("en-US")}`;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- fee.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/fee.ts src/lib/fee.test.ts
git commit -m "feat: add bootcamp module fee calculation"
```

---

### Task 3: SQLite connection and schema

**Files:**
- Create: `src/lib/db.ts`
- Test: `src/lib/db.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `getDb(): Database.Database` (a `better-sqlite3` instance with the `registrations` table already created) and `resetDbForTests(): void` — both consumed by `src/lib/registrations.ts` (Task 4).

- [ ] **Step 1: Add the data directory to .gitignore**

In `.gitignore`, next to the existing `/details` exclusion, add:

```
# local sqlite database, not for version control
/data
```

- [ ] **Step 2: Write the failing test**

Create `src/lib/db.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDb, resetDbForTests } from "./db";

describe("getDb", () => {
  beforeEach(() => {
    process.env.REGISTRATIONS_DB_PATH = ":memory:";
    resetDbForTests();
  });

  afterEach(() => {
    resetDbForTests();
    delete process.env.REGISTRATIONS_DB_PATH;
  });

  it("creates the registrations table", () => {
    const db = getDb();
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'registrations'")
      .all();
    expect(tables).toHaveLength(1);
  });

  it("returns the same connection on repeated calls", () => {
    expect(getDb()).toBe(getDb());
  });

  it("allows inserting and reading a row", () => {
    const db = getDb();
    db.prepare(
      `INSERT INTO registrations (
        created_at, updated_at, parent_name, relationship, profession, phone, alt_phone,
        email, address, student_name, age, gender, school, class_grade, cohort, has_laptop,
        modules, amount_due, hear_about, hear_about_other, pickup_service, pickup_location,
        medical_info, additional_info, agree_terms, photo_consent, transaction_id, verified, verified_at
      ) VALUES (
        '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', 'Jane', 'Mother', 'Teacher', '0700000000', NULL,
        'jane@example.com', 'Kampala', 'Joy', '10', 'Female', 'Test School', 'P5', 'Cohort 1: Ages 9-13', 'Yes',
        '["AI & Coding"]', 500000, 'Social Media', NULL, 'No', NULL,
        NULL, NULL, 1, 'Yes', NULL, 0, NULL
      )`,
    ).run();

    const row = db.prepare("SELECT * FROM registrations WHERE student_name = ?").get("Joy") as
      | { student_name: string }
      | undefined;
    expect(row?.student_name).toBe("Joy");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- db.test.ts`
Expected: FAIL with "Cannot find module './db'".

- [ ] **Step 4: Write the implementation**

Create `src/lib/db.ts`:

```ts
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

let instance: Database.Database | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  profession TEXT NOT NULL,
  phone TEXT NOT NULL,
  alt_phone TEXT,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  student_name TEXT NOT NULL,
  age TEXT NOT NULL,
  gender TEXT NOT NULL,
  school TEXT NOT NULL,
  class_grade TEXT NOT NULL,
  cohort TEXT NOT NULL,
  has_laptop TEXT NOT NULL,
  modules TEXT NOT NULL,
  amount_due INTEGER NOT NULL,
  hear_about TEXT NOT NULL,
  hear_about_other TEXT,
  pickup_service TEXT NOT NULL,
  pickup_location TEXT,
  medical_info TEXT,
  additional_info TEXT,
  agree_terms INTEGER NOT NULL,
  photo_consent TEXT NOT NULL,
  transaction_id TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT
);
`;

export function getDb(): Database.Database {
  if (instance) return instance;

  const dbPath = process.env.REGISTRATIONS_DB_PATH ?? path.join(process.cwd(), "data", "registrations.db");

  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  instance = new Database(dbPath);
  instance.pragma("journal_mode = WAL");
  instance.exec(SCHEMA);
  return instance;
}

export function resetDbForTests(): void {
  if (instance) {
    instance.close();
  }
  instance = null;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- db.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/db.ts src/lib/db.test.ts .gitignore
git commit -m "feat: add sqlite connection and registrations schema"
```

---

### Task 4: Registrations data-access layer

**Files:**
- Create: `src/lib/registrations.ts`
- Test: `src/lib/registrations.test.ts`

**Interfaces:**
- Consumes: `getDb()`, `resetDbForTests()` from `src/lib/db.ts` (Task 3); `computeAmountDue()` from `src/lib/fee.ts` (Task 2).
- Produces: `RegistrationInput` type, `RegistrationRow` type, `saveRegistration(input: RegistrationInput, id?: number): { row: RegistrationRow; shouldSendEmail: boolean }`, `listRegistrations(): RegistrationRow[]`, `markVerified(id: number): RegistrationRow | null` — consumed by the API route (Task 7) and the dev dashboard (Task 10).

- [ ] **Step 1: Write the failing tests**

Create `src/lib/registrations.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { resetDbForTests } from "./db";
import { listRegistrations, markVerified, saveRegistration, type RegistrationInput } from "./registrations";

const baseInput: RegistrationInput = {
  parentName: "Jane Namubiru",
  relationship: "Mother",
  profession: "Teacher",
  phone: "0700000000",
  email: "jane@example.com",
  address: "Kampala",
  studentName: "Joy Namubiru",
  age: "10",
  gender: "Female",
  school: "Test School",
  classGrade: "P5",
  cohort: "Cohort 1: Ages 9 – 13",
  hasLaptop: "Yes",
  modules: ["AI & Coding"],
  hearAbout: "Social Media",
  pickupService: "No",
  agreeTerms: true,
  photoConsent: "Yes",
};

beforeEach(() => {
  process.env.REGISTRATIONS_DB_PATH = ":memory:";
  resetDbForTests();
});

describe("saveRegistration", () => {
  it("inserts a new row and computes the amount due", () => {
    const { row, shouldSendEmail } = saveRegistration(baseInput);
    expect(row.id).toBeGreaterThan(0);
    expect(row.amountDue).toBe(500_000);
    expect(row.transactionId).toBeUndefined();
    expect(shouldSendEmail).toBe(false);
  });

  it("does not request an email for a bare registration with no transaction id", () => {
    const { shouldSendEmail } = saveRegistration(baseInput);
    expect(shouldSendEmail).toBe(false);
  });

  it("requests an email when a transaction id is present on insert", () => {
    const { row, shouldSendEmail } = saveRegistration({ ...baseInput, transactionId: "TXN123" });
    expect(row.transactionId).toBe("TXN123");
    expect(shouldSendEmail).toBe(true);
  });

  it("updates an existing row by id instead of creating a duplicate", () => {
    const { row: created } = saveRegistration(baseInput);
    const { row: updated } = saveRegistration(
      { ...baseInput, modules: ["AI & Coding", "Robotics"] },
      created.id,
    );
    expect(updated.id).toBe(created.id);
    expect(updated.modules).toEqual(["AI & Coding", "Robotics"]);
    expect(updated.amountDue).toBe(900_000);
    expect(listRegistrations()).toHaveLength(1);
  });

  it("requests an email only the first time a transaction id appears, not on unrelated resubmits", () => {
    const { row: created } = saveRegistration(baseInput);
    const first = saveRegistration({ ...baseInput, transactionId: "TXN123" }, created.id);
    expect(first.shouldSendEmail).toBe(true);

    const second = saveRegistration({ ...baseInput, transactionId: "TXN123" }, created.id);
    expect(second.shouldSendEmail).toBe(false);
  });

  it("requests an email again if the transaction id is corrected to a different value", () => {
    const { row: created } = saveRegistration({ ...baseInput, transactionId: "TXN123" });
    const corrected = saveRegistration({ ...baseInput, transactionId: "TXN456" }, created.id);
    expect(corrected.shouldSendEmail).toBe(true);
  });

  it("falls back to inserting when the given id does not exist", () => {
    const { row, shouldSendEmail } = saveRegistration(baseInput, 999);
    expect(row.id).not.toBe(999);
    expect(shouldSendEmail).toBe(false);
  });
});

describe("listRegistrations", () => {
  it("returns all rows, most recently created first", () => {
    saveRegistration({ ...baseInput, studentName: "First" });
    saveRegistration({ ...baseInput, studentName: "Second" });
    const rows = listRegistrations();
    expect(rows.map((r) => r.studentName)).toEqual(["Second", "First"]);
  });
});

describe("markVerified", () => {
  it("flips verified to true and stamps verifiedAt", () => {
    const { row } = saveRegistration({ ...baseInput, transactionId: "TXN123" });
    const updated = markVerified(row.id);
    expect(updated?.verified).toBe(true);
    expect(updated?.verifiedAt).toBeTruthy();
  });

  it("returns null for an unknown id", () => {
    expect(markVerified(999)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- registrations.test.ts`
Expected: FAIL with "Cannot find module './registrations'".

- [ ] **Step 3: Write the implementation**

Create `src/lib/registrations.ts`:

```ts
import { getDb } from "./db";
import { computeAmountDue } from "./fee";

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

interface SaveResult {
  row: RegistrationRow;
  shouldSendEmail: boolean;
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
    transactionId: raw.transaction_id ?? undefined,
    verified: !!raw.verified,
    verifiedAt: raw.verified_at ?? null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function paramsFromInput(input: RegistrationInput, amountDue: number, transactionId: string | null) {
  return {
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
    transaction_id: transactionId,
  };
}

export function saveRegistration(input: RegistrationInput, id?: number): SaveResult {
  const db = getDb();
  const now = new Date().toISOString();
  const amountDue = computeAmountDue(input.modules);
  const newTransactionId = input.transactionId?.trim() || null;

  if (id != null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = db.prepare("SELECT * FROM registrations WHERE id = ?").get(id) as any;
    if (existing) {
      const previousTransactionId: string | null = existing.transaction_id ?? null;
      db.prepare(
        `UPDATE registrations SET
          updated_at = @updated_at, parent_name = @parent_name, relationship = @relationship,
          profession = @profession, phone = @phone, alt_phone = @alt_phone, email = @email,
          address = @address, student_name = @student_name, age = @age, gender = @gender,
          school = @school, class_grade = @class_grade, cohort = @cohort, has_laptop = @has_laptop,
          modules = @modules, amount_due = @amount_due, hear_about = @hear_about,
          hear_about_other = @hear_about_other, pickup_service = @pickup_service,
          pickup_location = @pickup_location, medical_info = @medical_info,
          additional_info = @additional_info, agree_terms = @agree_terms,
          photo_consent = @photo_consent, transaction_id = @transaction_id
        WHERE id = @id`,
      ).run({ id, updated_at: now, ...paramsFromInput(input, amountDue, newTransactionId) });

      const updated = db.prepare("SELECT * FROM registrations WHERE id = ?").get(id);
      return {
        row: rowFromDb(updated),
        shouldSendEmail: newTransactionId !== null && newTransactionId !== previousTransactionId,
      };
    }
  }

  const info = db
    .prepare(
      `INSERT INTO registrations (
        created_at, updated_at, parent_name, relationship, profession, phone, alt_phone,
        email, address, student_name, age, gender, school, class_grade, cohort, has_laptop,
        modules, amount_due, hear_about, hear_about_other, pickup_service, pickup_location,
        medical_info, additional_info, agree_terms, photo_consent, transaction_id, verified, verified_at
      ) VALUES (
        @created_at, @updated_at, @parent_name, @relationship, @profession, @phone, @alt_phone,
        @email, @address, @student_name, @age, @gender, @school, @class_grade, @cohort, @has_laptop,
        @modules, @amount_due, @hear_about, @hear_about_other, @pickup_service, @pickup_location,
        @medical_info, @additional_info, @agree_terms, @photo_consent, @transaction_id, 0, NULL
      )`,
    )
    .run({ created_at: now, updated_at: now, ...paramsFromInput(input, amountDue, newTransactionId) });

  const created = db.prepare("SELECT * FROM registrations WHERE id = ?").get(info.lastInsertRowid);
  return {
    row: rowFromDb(created),
    shouldSendEmail: newTransactionId !== null,
  };
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- registrations.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/registrations.ts src/lib/registrations.test.ts
git commit -m "feat: add registrations data layer with upsert and email-trigger logic"
```

---

### Task 5: Dev dashboard auth helpers

**Files:**
- Create: `src/lib/devAuth.ts`
- Test: `src/lib/devAuth.test.ts`

**Interfaces:**
- Produces: `COOKIE_NAME: string`, `verifyDevPassword(password: string): boolean`, `createSessionToken(): Promise<string>`, `isValidSessionToken(token: string | undefined | null): Promise<boolean>` — consumed by `/api/dev/login` (Task 6) and `src/middleware.ts` (Task 6).

Uses the Web Crypto API (`crypto.subtle`), not `node:crypto`, so it works identically whether middleware runs under the Edge runtime or Node.js.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/devAuth.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSessionToken, isValidSessionToken, verifyDevPassword } from "./devAuth";

describe("verifyDevPassword", () => {
  afterEach(() => {
    delete process.env.DEV_DASHBOARD_PASSWORD;
  });

  it("returns false when no password is configured", () => {
    delete process.env.DEV_DASHBOARD_PASSWORD;
    expect(verifyDevPassword("anything")).toBe(false);
  });

  it("returns true only for the exact configured password", () => {
    process.env.DEV_DASHBOARD_PASSWORD = "correct-horse";
    expect(verifyDevPassword("correct-horse")).toBe(true);
    expect(verifyDevPassword("wrong")).toBe(false);
  });
});

describe("session tokens", () => {
  beforeEach(() => {
    process.env.DEV_SESSION_SECRET = "test-secret";
  });

  afterEach(() => {
    delete process.env.DEV_SESSION_SECRET;
  });

  it("produces a token that isValidSessionToken accepts", async () => {
    const token = await createSessionToken();
    expect(await isValidSessionToken(token)).toBe(true);
  });

  it("rejects a missing token", async () => {
    expect(await isValidSessionToken(undefined)).toBe(false);
    expect(await isValidSessionToken(null)).toBe(false);
  });

  it("rejects a tampered token", async () => {
    const token = await createSessionToken();
    expect(await isValidSessionToken(token.slice(0, -1) + "0")).toBe(false);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await createSessionToken();
    process.env.DEV_SESSION_SECRET = "different-secret";
    expect(await isValidSessionToken(token)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- devAuth.test.ts`
Expected: FAIL with "Cannot find module './devAuth'".

- [ ] **Step 3: Write the implementation**

Create `src/lib/devAuth.ts`:

```ts
export const COOKIE_NAME = "pl_dev_session";

function getSecret(): string {
  const secret = process.env.DEV_SESSION_SECRET;
  if (!secret) {
    throw new Error("DEV_SESSION_SECRET is not set");
  }
  return secret;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function verifyDevPassword(password: string): boolean {
  const expected = process.env.DEV_DASHBOARD_PASSWORD;
  if (!expected) return false;
  return password === expected;
}

export async function createSessionToken(): Promise<string> {
  return hmacHex(getSecret(), "dev-dashboard");
}

export async function isValidSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const expected = await createSessionToken();
  if (token.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < token.length; i++) {
    mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- devAuth.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/devAuth.ts src/lib/devAuth.test.ts
git commit -m "feat: add dev dashboard password and session token verification"
```

---

### Task 6: Dev login route, login page, and route guard

**Files:**
- Create: `src/app/api/dev/login/route.ts`
- Create: `src/app/dev/login/page.tsx`
- Create: `src/middleware.ts`

**Interfaces:**
- Consumes: `COOKIE_NAME`, `verifyDevPassword`, `createSessionToken`, `isValidSessionToken` from `src/lib/devAuth.ts` (Task 5).
- Produces: a working login flow that Task 10's dashboard page relies on being in place.

This task has no pure-logic unit to TDD (it's routing/cookie wiring) — the underlying logic is already tested in Task 5. Verify it manually with the dev server.

- [ ] **Step 1: Add the required env vars locally**

Add two lines to `.env.local` (pick your own values; these are not committed):

```
DEV_DASHBOARD_PASSWORD=choose-a-password
DEV_SESSION_SECRET=choose-a-long-random-string
```

- [ ] **Step 2: Create the login API route**

Create `src/app/api/dev/login/route.ts`:

```ts
import { NextResponse } from "next/server";
import { COOKIE_NAME, createSessionToken, verifyDevPassword } from "@/lib/devAuth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const password = body?.password;

  if (!password || !verifyDevPassword(password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
```

- [ ] **Step 3: Create the login page**

Create `src/app/dev/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DevLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/dev/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      setError("Incorrect password");
      setLoading(false);
      return;
    }

    router.push("/dev/registrations");
    router.refresh();
  };

  return (
    <div
      style={{
        maxWidth: 360,
        margin: "120px auto",
        padding: "0 24px",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: "#002D5B" }}>
        Dev Dashboard Login
      </h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          style={{
            width: "100%",
            padding: 12,
            fontSize: 14,
            border: "1px solid rgba(0,45,91,0.2)",
            borderRadius: 6,
            boxSizing: "border-box",
          }}
        />
        {error && <p style={{ color: "#C0392B", fontSize: 13, marginTop: 8 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 12,
            padding: 12,
            background: "#002D5B",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Checking…" : "Log In"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Create the middleware guard**

Create `src/middleware.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, isValidSessionToken } from "@/lib/devAuth";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/dev/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!(await isValidSessionToken(token))) {
    return NextResponse.redirect(new URL("/dev/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dev/:path*"],
};
```

- [ ] **Step 5: Manually verify the guard and login flow**

Run: `npm run dev`, then in a browser:
1. Visit `http://localhost:3000/dev/registrations` directly → expect a redirect to `/dev/login` (the page doesn't exist until Task 10, so a 404 after landing on `/dev/login` itself is fine for now — what matters is the redirect happens).
2. Visit `http://localhost:3000/dev/login`, submit the wrong password → expect an inline "Incorrect password" message, no redirect.
3. Submit the correct password (matching `DEV_DASHBOARD_PASSWORD` from `.env.local`) → expect it to attempt navigating to `/dev/registrations` (404 is expected until Task 10).

- [ ] **Step 6: Commit**

```bash
git add src/app/api/dev/login/route.ts src/app/dev/login/page.tsx src/middleware.ts
git commit -m "feat: add dev dashboard login flow and route guard"
```

---

### Task 7: Update the registration API route (upsert, modules, conditional email)

**Files:**
- Modify: `src/app/api/internship-apply/route.ts` (full replacement)
- Test: `src/app/api/internship-apply/route.test.ts`

**Interfaces:**
- Consumes: `saveRegistration` from `src/lib/registrations.ts` (Task 4); `formatUgx` from `src/lib/fee.ts` (Task 2).
- Produces: `POST` handler accepting `{ ...RegistrationPayload, id?: number }`, returning `{ ok: true, id: number }` on success.

- [ ] **Step 1: Write the failing tests**

Create `src/app/api/internship-apply/route.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDbForTests } from "@/lib/db";
import { listRegistrations } from "@/lib/registrations";

const sendMail = vi.fn().mockResolvedValue({});

vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn(() => ({ sendMail })) },
}));

const validPayload = {
  parentName: "Jane Namubiru",
  relationship: "Mother",
  profession: "Teacher",
  phone: "0700000000",
  email: "jane@example.com",
  address: "Kampala",
  studentName: "Joy Namubiru",
  age: "10",
  gender: "Female",
  school: "Test School",
  classGrade: "P5",
  cohort: "Cohort 1: Ages 9 – 13",
  hasLaptop: "Yes",
  modules: ["AI & Coding"],
  hearAbout: "Social Media",
  pickupService: "No",
  agreeTerms: true,
  photoConsent: "Yes",
};

function post(body: unknown) {
  return new Request("http://localhost/api/internship-apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  process.env.REGISTRATIONS_DB_PATH = ":memory:";
  process.env.SMTP_USER = "smtp-user@example.com";
  process.env.SMTP_PASS = "app-password";
  process.env.INTERNSHIP_TO_EMAIL = "pearllabsug@gmail.com";
  resetDbForTests();
  sendMail.mockClear();
});

describe("POST /api/internship-apply", () => {
  it("rejects a payload with no modules selected", async () => {
    const { POST } = await import("./route");
    const response = await POST(post({ ...validPayload, modules: [] }));
    expect(response.status).toBe(400);
  });

  it("saves a bare registration (no transaction id) and does not send an email", async () => {
    const { POST } = await import("./route");
    const response = await POST(post(validPayload));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean; id: number };
    expect(body.ok).toBe(true);
    expect(sendMail).not.toHaveBeenCalled();
    expect(listRegistrations()).toHaveLength(1);
  });

  it("sends an email when a transaction id is included", async () => {
    const { POST } = await import("./route");
    const response = await POST(post({ ...validPayload, transactionId: "TXN123" }));
    expect(response.status).toBe(200);
    expect(sendMail).toHaveBeenCalledTimes(1);
    const [[mailOptions]] = sendMail.mock.calls;
    expect(mailOptions.html).toContain("TXN123");
    expect(mailOptions.html).toContain("UGX 500,000");
  });

  it("updates the same row instead of creating a duplicate when an id is sent", async () => {
    const { POST } = await import("./route");
    const first = await POST(post(validPayload));
    const { id } = (await first.json()) as { id: number };

    await POST(post({ ...validPayload, id, transactionId: "TXN123" }));

    expect(listRegistrations()).toHaveLength(1);
    expect(sendMail).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- route.test.ts`
Expected: FAIL — the current route still expects `track`/`signature` fields and always emails, so the "no modules" validation and "no email without a transaction id" assertions fail.

- [ ] **Step 3: Replace the implementation**

Replace the full contents of `src/app/api/internship-apply/route.ts`:

```ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { formatUgx } from "@/lib/fee";
import { saveRegistration, type RegistrationInput } from "@/lib/registrations";

interface RegistrationPayload extends RegistrationInput {
  id?: number;
}

const requiredFields: Array<keyof RegistrationInput> = [
  "parentName",
  "relationship",
  "profession",
  "phone",
  "email",
  "address",
  "studentName",
  "age",
  "gender",
  "school",
  "classGrade",
  "cohort",
  "hasLaptop",
  "modules",
  "hearAbout",
  "pickupService",
  "photoConsent",
];

function isValidEmail(value: string): boolean {
  return /\S+@\S+\.\S+/.test(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Unknown error";
}

function getMailErrorResponse(error: unknown): { error: string; status: number } {
  const message = getErrorMessage(error);
  const lower = message.toLowerCase();

  if (
    lower.includes("invalid login") ||
    lower.includes("badcredentials") ||
    lower.includes("535-5.7.8")
  ) {
    return {
      error:
        "Email authentication failed. For Gmail SMTP, use a Google App Password (not your regular Gmail password) in SMTP_PASS.",
      status: 500,
    };
  }

  return {
    error: `Could not send registration: ${message}`,
    status: 500,
  };
}

function validatePayload(payload: Partial<RegistrationPayload>): string | null {
  for (const field of requiredFields) {
    const value = payload[field];
    if (!value || !String(value).trim()) {
      return `${field} is required`;
    }
  }

  if (!Array.isArray(payload.modules) || payload.modules.length === 0) {
    return "Select at least one module";
  }

  if (!isValidEmail(payload.email as string)) {
    return "Invalid email address";
  }

  if (payload.agreeTerms !== true) {
    return "You must confirm the information is accurate and agree to enrol the student";
  }

  if (payload.pickupService === "Yes" && !(payload.pickupLocation ?? "").trim()) {
    return "Please share the pick-up location";
  }

  if (payload.hearAbout === "Other" && !(payload.hearAboutOther ?? "").trim()) {
    return "Please tell us how you heard about us";
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<RegistrationPayload>;
    const validationError = validatePayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const reg = payload as RegistrationPayload;
    const { row, shouldSendEmail } = saveRegistration(
      {
        parentName: reg.parentName,
        relationship: reg.relationship,
        profession: reg.profession,
        phone: reg.phone,
        altPhone: reg.altPhone,
        email: reg.email,
        address: reg.address,
        studentName: reg.studentName,
        age: reg.age,
        gender: reg.gender,
        school: reg.school,
        classGrade: reg.classGrade,
        cohort: reg.cohort,
        hasLaptop: reg.hasLaptop,
        modules: reg.modules,
        hearAbout: reg.hearAbout,
        hearAboutOther: reg.hearAboutOther,
        pickupService: reg.pickupService,
        pickupLocation: reg.pickupLocation,
        medicalInfo: reg.medicalInfo,
        additionalInfo: reg.additionalInfo,
        agreeTerms: reg.agreeTerms,
        photoConsent: reg.photoConsent,
        transactionId: reg.transactionId,
      },
      reg.id,
    );

    if (!shouldSendEmail) {
      return NextResponse.json({ ok: true, id: row.id });
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const toEmail = process.env.INTERNSHIP_TO_EMAIL ?? smtpUser;

    if (!smtpUser || !smtpPass || !toEmail) {
      return NextResponse.json(
        {
          error:
            "Email server is not configured. Set SMTP_USER, SMTP_PASS, and INTERNSHIP_TO_EMAIL in your environment.",
        },
        { status: 500 },
      );
    }

    if (!isValidEmail(toEmail)) {
      return NextResponse.json(
        {
          error:
            "INTERNSHIP_TO_EMAIL is invalid. Please provide a full email address like hello@pearllabs.ug.",
        },
        { status: 500 },
      );
    }

    const smtpHost = process.env.SMTP_HOST ?? "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT ?? 587);
    const smtpSecure = String(process.env.SMTP_SECURE ?? "false") === "true";

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const modulesList = row.modules.join(", ");
    const amountText = formatUgx(row.amountDue);

    const text = [
      "Pearl AI Labs Deep Tech Bootcamp — Registration",
      "",
      "PARENT / GUARDIAN",
      `Name: ${row.parentName}`,
      `Relationship to Student: ${row.relationship}`,
      `Profession: ${row.profession}`,
      `Phone: ${row.phone}`,
      `Alternative Phone: ${row.altPhone?.trim() || "Not provided"}`,
      `Email: ${row.email}`,
      `Address: ${row.address}`,
      "",
      "STUDENT",
      `Name: ${row.studentName}`,
      `Age: ${row.age}`,
      `Gender: ${row.gender}`,
      `School: ${row.school}`,
      `Class / Grade: ${row.classGrade}`,
      `Cohort: ${row.cohort}`,
      `Has a laptop: ${row.hasLaptop}`,
      "",
      "PROGRAMME SELECTION",
      `Modules: ${modulesList}`,
      `Amount Due: ${amountText}`,
      `How they heard about us: ${row.hearAbout}${row.hearAbout === "Other" ? ` (${row.hearAboutOther})` : ""}`,
      "",
      "DROP-OFF & PICK-UP",
      `Wants drop-off/pick-up service: ${row.pickupService}`,
      `Pick-up location: ${row.pickupService === "Yes" ? row.pickupLocation : "N/A"}`,
      "",
      "MEDICAL / ADDITIONAL INFO",
      `Allergies / medical conditions / special needs: ${row.medicalInfo?.trim() || "Not provided"}`,
      `Additional info: ${row.additionalInfo?.trim() || "Not provided"}`,
      "",
      "CONSENT",
      `Agreed to enrol: ${row.agreeTerms ? "Yes" : "No"}`,
      `Photo/recording consent: ${row.photoConsent}`,
      "",
      "PAYMENT",
      `Transaction ID: ${row.transactionId ?? "Not provided"}`,
    ].join("\n");

    const html = `
      <h2>Pearl AI Labs Deep Tech Bootcamp — Registration</h2>
      <h3>Parent / Guardian</h3>
      <p><strong>Name:</strong> ${escapeHtml(row.parentName)}</p>
      <p><strong>Relationship to Student:</strong> ${escapeHtml(row.relationship)}</p>
      <p><strong>Profession:</strong> ${escapeHtml(row.profession)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(row.phone)}</p>
      <p><strong>Alternative Phone:</strong> ${escapeHtml(row.altPhone?.trim() || "Not provided")}</p>
      <p><strong>Email:</strong> ${escapeHtml(row.email)}</p>
      <p><strong>Address:</strong> ${escapeHtml(row.address)}</p>
      <h3>Student</h3>
      <p><strong>Name:</strong> ${escapeHtml(row.studentName)}</p>
      <p><strong>Age:</strong> ${escapeHtml(row.age)}</p>
      <p><strong>Gender:</strong> ${escapeHtml(row.gender)}</p>
      <p><strong>School:</strong> ${escapeHtml(row.school)}</p>
      <p><strong>Class / Grade:</strong> ${escapeHtml(row.classGrade)}</p>
      <p><strong>Cohort:</strong> ${escapeHtml(row.cohort)}</p>
      <p><strong>Has a laptop:</strong> ${escapeHtml(row.hasLaptop)}</p>
      <h3>Programme Selection</h3>
      <p><strong>Modules:</strong> ${escapeHtml(modulesList)}</p>
      <p><strong>Amount Due:</strong> ${escapeHtml(amountText)}</p>
      <p><strong>How they heard about us:</strong> ${escapeHtml(row.hearAbout)}${row.hearAbout === "Other" ? ` (${escapeHtml(row.hearAboutOther ?? "")})` : ""}</p>
      <h3>Drop-off &amp; Pick-up</h3>
      <p><strong>Wants service:</strong> ${escapeHtml(row.pickupService)}</p>
      <p><strong>Pick-up location:</strong> ${escapeHtml(row.pickupService === "Yes" ? row.pickupLocation ?? "" : "N/A")}</p>
      <h3>Medical / Additional Info</h3>
      <p><strong>Allergies / medical conditions / special needs:</strong> ${escapeHtml(row.medicalInfo?.trim() || "Not provided")}</p>
      <p><strong>Additional info:</strong> ${escapeHtml(row.additionalInfo?.trim() || "Not provided")}</p>
      <h3>Consent</h3>
      <p><strong>Agreed to enrol:</strong> ${row.agreeTerms ? "Yes" : "No"}</p>
      <p><strong>Photo/recording consent:</strong> ${escapeHtml(row.photoConsent)}</p>
      <h3>Payment</h3>
      <p><strong>Transaction ID:</strong> ${escapeHtml(row.transactionId ?? "Not provided")}</p>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `Pearl Labs Website <${smtpUser}>`,
      to: toEmail,
      replyTo: row.email,
      subject: `Bootcamp Registration - ${row.studentName} (${row.parentName})`,
      text,
      html,
    });

    return NextResponse.json({ ok: true, id: row.id });
  } catch (error) {
    console.error("Failed to submit bootcamp registration:", error);
    const isProduction = process.env.NODE_ENV === "production";
    const detailed = getMailErrorResponse(error);

    return NextResponse.json(
      { error: isProduction ? "Could not send registration" : detailed.error },
      { status: detailed.status },
    );
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- route.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Run the full test suite to check nothing else broke**

Run: `npm test`
Expected: all suites PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/internship-apply/route.ts src/app/api/internship-apply/route.test.ts
git commit -m "feat: make registration API upsert-capable with conditional payment email"
```

---

### Task 8: Update the registration form (modules, payment section, persistence)

**Files:**
- Modify: `src/components/InternshipApply.tsx` (full replacement)

**Interfaces:**
- Consumes: `MODULE_NAMES`, `computeAmountDue`, `formatUgx` from `src/lib/fee.ts` (Task 2); posts to `/api/internship-apply` (Task 7) with `{ ...formFields, modules: string[], transactionId: string, id?: number }`.

No pure logic to unit test here (it's a client component with `localStorage` and DOM interaction, and this codebase has no component-testing setup) — verify manually with the dev server in Step 2.

- [ ] **Step 1: Replace the implementation**

Replace the full contents of `src/components/InternshipApply.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { computeAmountDue, formatUgx, MODULE_NAMES } from "@/lib/fee";

// ── Brand tokens (Pearl Labs) ─────────────────────────────────
const GREEN      = "#002D5B";
const ORANGE     = "#EF8633";
const CREAM      = "#F4FAFF";
const TEXT_MUTED = "#4C616C";
const TEXT_LIGHT = "#4C616C";
const BORDER     = "rgba(0,45,91,0.12)";

const COHORTS = [
  "Cohort 1: Ages 9 – 13",
  "Cohort 2: Ages 13 – 19",
];

const HEAR_ABOUT_OPTIONS = [
  "Social Media",
  "Friend / Family Referral",
  "School",
  "Flyer / Poster",
  "Other",
];

const DRAFT_KEY = "pearlLabsBootcampDraft";

interface FormState {
  // Section 1: Parent / Guardian
  parentName: string;
  relationship: string;
  profession: string;
  phone: string;
  altPhone: string;
  email: string;
  address: string;
  // Section 2: Student
  studentName: string;
  age: string;
  gender: string;
  school: string;
  classGrade: string;
  cohort: string;
  hasLaptop: string;
  // Section 3: Programme selection
  modules: string[];
  hearAbout: string;
  hearAboutOther: string;
  // Section 4: Payment
  transactionId: string;
  // Section 5: Drop-off & pick-up
  pickupService: string;
  pickupLocation: string;
  // Section 6: Medical
  medicalInfo: string;
  additionalInfo: string;
  // Section 7: Consent
  agreeTerms: boolean;
  photoConsent: string;
}

const INITIAL: FormState = {
  parentName: "", relationship: "", profession: "", phone: "", altPhone: "",
  email: "", address: "",
  studentName: "", age: "", gender: "", school: "", classGrade: "",
  cohort: "", hasLaptop: "",
  modules: [], hearAbout: "", hearAboutOther: "",
  transactionId: "",
  pickupService: "", pickupLocation: "",
  medicalInfo: "", additionalInfo: "",
  agreeTerms: false, photoConsent: "",
};

type Status = "idle" | "sending" | "saved" | "sent" | "error";
type FieldErrors = Partial<Record<keyof FormState, string>>;

interface Draft {
  form: FormState;
  registrationId: number | null;
}

export default function InternshipApply() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [registrationId, setRegistrationId] = useState<number | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [submitError, setSubmitError] = useState<string>("");
  const [focused, setFocused] = useState<string | null>(null);
  const loadedDraft = useRef(false);

  // ── Load any saved draft on mount ────────────────────────────
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Draft;
        setForm({ ...INITIAL, ...draft.form });
        setRegistrationId(draft.registrationId ?? null);
      }
    } catch {
      // Ignore a corrupted or inaccessible draft — start fresh.
    } finally {
      loadedDraft.current = true;
    }
  }, []);

  // ── Persist the draft on every change, once the initial load has run ──
  useEffect(() => {
    if (!loadedDraft.current) return;
    const draft: Draft = { form, registrationId };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [form, registrationId]);

  // ── Validation ──────────────────────────────────────────────
  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (!form.parentName.trim())   e.parentName = "Required";
    if (!form.relationship.trim()) e.relationship = "Required";
    if (!form.profession.trim())   e.profession = "Required";
    if (!form.phone.trim())        e.phone = "Required";
    if (!form.email.trim())        e.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.address.trim())      e.address = "Required";

    if (!form.studentName.trim())  e.studentName = "Required";
    if (!form.age.trim())          e.age = "Required";
    if (!form.gender)              e.gender = "Required";
    if (!form.school.trim())       e.school = "Required";
    if (!form.classGrade.trim())   e.classGrade = "Required";
    if (!form.cohort)              e.cohort = "Required";
    if (!form.hasLaptop)           e.hasLaptop = "Required";

    if (form.modules.length === 0) e.modules = "Select at least one module";
    if (!form.hearAbout)           e.hearAbout = "Required";
    if (form.hearAbout === "Other" && !form.hearAboutOther.trim())
      e.hearAboutOther = "Please tell us how you heard about us";

    if (!form.pickupService)       e.pickupService = "Required";
    if (form.pickupService === "Yes" && !form.pickupLocation.trim())
      e.pickupLocation = "Required";

    if (!form.agreeTerms)          e.agreeTerms = "You must agree to continue";
    if (!form.photoConsent)        e.photoConsent = "Required";

    return e;
  };

  const change = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };

  const toggleModule = (name: string) => {
    setForm(prev => ({
      ...prev,
      modules: prev.modules.includes(name)
        ? prev.modules.filter(m => m !== name)
        : [...prev.modules, name],
    }));
    if (errors.modules) setErrors(prev => ({ ...prev, modules: undefined }));
  };

  const startNewRegistration = () => {
    window.localStorage.removeItem(DRAFT_KEY);
    setForm(INITIAL);
    setRegistrationId(null);
    setErrors({});
    setStatus("idle");
    setSubmitError("");
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setStatus("sending");
    setSubmitError("");

    const hasTransactionId = Boolean(form.transactionId.trim());

    try {
      const response = await fetch("/api/internship-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          id: registrationId ?? undefined,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Failed to submit registration");
      }

      const data = (await response.json()) as { ok: boolean; id: number };

      if (hasTransactionId) {
        window.localStorage.removeItem(DRAFT_KEY);
        setForm(INITIAL);
        setRegistrationId(null);
        setStatus("sent");
      } else {
        setRegistrationId(data.id);
        setStatus("saved");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit registration";
      setSubmitError(message);
      setStatus("error");
    }
  };

  const amountDue = computeAmountDue(form.modules);

  // ── Field style helpers ─────────────────────────────────────
  const fieldStyle = (name: string, extra: React.CSSProperties = {}): React.CSSProperties => ({
    width: "100%",
    padding: "13px 16px",
    fontSize: 14,
    fontFamily: "inherit",
    color: GREEN,
    background: focused === name ? "#fff" : CREAM,
    border: `1.5px solid ${errors[name as keyof FormState] ? "#C0392B" : focused === name ? ORANGE : BORDER}`,
    borderRadius: 8,
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
    boxSizing: "border-box",
    ...extra,
  });

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: TEXT_MUTED,
    marginBottom: 7,
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 11,
    color: "#C0392B",
    marginTop: 4,
  };

  // Small helper to render a labelled <select>
  const renderSelect = (
    field: keyof FormState,
    label: string,
    options: string[],
    placeholder = "Select…",
  ) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <select
        style={fieldStyle(field)}
        value={form[field] as string}
        onChange={change(field)}
        onFocus={() => setFocused(field)}
        onBlur={() => setFocused(null)}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {errors[field] && <p style={errorStyle}>{errors[field]}</p>}
    </div>
  );

  // ── Success screen (fully paid submission) ───────────────────
  if (status === "sent") {
    return (
      <div style={s.page}>
        <div style={s.successWrap}>
          <div style={s.successIcon}>✓</div>
          <h2 style={s.successTitle}>Registration Sent!</h2>
          <p style={s.successText}>
            Your bootcamp registration and payment details have been submitted
            successfully. Our team will review it and reach out using your
            provided contact details to confirm the spot.
            For urgent questions, email us at{" "}
            <a href="mailto:pearllabsug@gmail.com" style={{ color: ORANGE }}>
              pearllabsug@gmail.com
            </a>.
          </p>
          <Link href="/" style={s.backLink}>← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={s.header}>
        <Link href="/" style={s.navBack}>← pearllabs.ug</Link>
        <div style={s.pill}>
          <span style={s.pillDot} />
          24 Aug – 4 Sep 2026 · National ICT Hub, Nakawa
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={s.hero}>
        <p style={s.eyebrow}>Deep Tech Bootcamp · Register a Student</p>
        <h1 style={s.heroTitle}>
          Secure Your<br />
          <em style={s.heroItalic}>Child&apos;s Spot</em>
        </h1>
        <p style={s.heroSub}>
          Pearl AI Labs, in partnership with Lwera Electronics &amp; Semi-conductors
          and the National ICT Innovation Hub, is opening registration for the
          Deep Tech Bootcamp — AI &amp; Coding, Robotics, and Aerospace CAD
          &amp; 3D Printing. Held at National ICT Hub, Nakawa.
        </p>

        <div style={s.statsRow}>
          {[
            { v: "UGX 500K", l: "Per Module" },
            { v: "Mon–Sat",  l: "Schedule" },
            { v: "Nakawa",   l: "ICT Hub" },
            { v: "9–19",     l: "Ages" },
          ].map(stat => (
            <div key={stat.l} style={s.stat}>
              <div style={s.statVal}>{stat.v}</div>
              <div style={s.statLbl}>{stat.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Form card ────────────────────────────────────────── */}
      <div style={s.formWrap}>
        <div style={s.formCard}>

          <div style={s.formHeader}>
            <h2 style={s.formTitle}>Registration Form</h2>
            <p style={s.formSub}>Fields marked with an asterisk (*) are required.</p>
          </div>

          {registrationId !== null && status !== "sent" && (
            <div style={s.draftBanner}>
              <span>Your progress is saved.</span>
              <button type="button" onClick={startNewRegistration} style={s.draftBannerLink}>
                Start a new registration
              </button>
            </div>
          )}

          {status === "saved" && (
            <div style={s.savedBanner}>
              Registration saved — once you&apos;ve paid via MTN MoMo, come back to
              this page (your details will still be here) and add your
              Transaction ID below, then submit again to complete your spot.
            </div>
          )}

          <div style={s.divider} />

          {/* Section 1: Parent / Guardian */}
          <p style={s.sectionLabel}>1. Parent / Guardian Information</p>
          <div style={s.row2}>
            <div>
              <label style={labelStyle}>Parent/Guardian Full Name *</label>
              <input
                style={fieldStyle("parentName")}
                value={form.parentName}
                onChange={change("parentName")}
                onFocus={() => setFocused("parentName")}
                onBlur={() => setFocused(null)}
                placeholder="e.g. Jane Namubiru"
              />
              {errors.parentName && <p style={errorStyle}>{errors.parentName}</p>}
            </div>
            <div>
              <label style={labelStyle}>Relationship to Student *</label>
              <input
                style={fieldStyle("relationship")}
                value={form.relationship}
                onChange={change("relationship")}
                onFocus={() => setFocused("relationship")}
                onBlur={() => setFocused(null)}
                placeholder="e.g. Mother, Father, Guardian"
              />
              {errors.relationship && <p style={errorStyle}>{errors.relationship}</p>}
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Profession *</label>
            <input
              style={fieldStyle("profession")}
              value={form.profession}
              onChange={change("profession")}
              onFocus={() => setFocused("profession")}
              onBlur={() => setFocused(null)}
            />
            {errors.profession && <p style={errorStyle}>{errors.profession}</p>}
          </div>

          <div style={{ ...s.row2, marginTop: 20 }}>
            <div>
              <label style={labelStyle}>Primary Phone Number *</label>
              <input
                style={fieldStyle("phone")}
                value={form.phone}
                onChange={change("phone")}
                onFocus={() => setFocused("phone")}
                onBlur={() => setFocused(null)}
                placeholder="+256 7XX XXX XXX"
              />
              {errors.phone && <p style={errorStyle}>{errors.phone}</p>}
            </div>
            <div>
              <label style={labelStyle}>Alternative Phone Number</label>
              <input
                style={fieldStyle("altPhone")}
                value={form.altPhone}
                onChange={change("altPhone")}
                onFocus={() => setFocused("altPhone")}
                onBlur={() => setFocused(null)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div style={{ ...s.row2, marginTop: 20 }}>
            <div>
              <label style={labelStyle}>Email Address *</label>
              <input
                style={fieldStyle("email")}
                type="email"
                value={form.email}
                onChange={change("email")}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                placeholder="you@example.com"
              />
              {errors.email && <p style={errorStyle}>{errors.email}</p>}
            </div>
            <div>
              <label style={labelStyle}>Home Address *</label>
              <input
                style={fieldStyle("address")}
                value={form.address}
                onChange={change("address")}
                onFocus={() => setFocused("address")}
                onBlur={() => setFocused(null)}
              />
              {errors.address && <p style={errorStyle}>{errors.address}</p>}
            </div>
          </div>

          <div style={s.divider} />

          {/* Section 2: Student */}
          <p style={s.sectionLabel}>2. Student Information</p>
          <div style={s.row2}>
            <div>
              <label style={labelStyle}>Student Full Name *</label>
              <input
                style={fieldStyle("studentName")}
                value={form.studentName}
                onChange={change("studentName")}
                onFocus={() => setFocused("studentName")}
                onBlur={() => setFocused(null)}
              />
              {errors.studentName && <p style={errorStyle}>{errors.studentName}</p>}
            </div>
            <div>
              <label style={labelStyle}>Age *</label>
              <input
                style={fieldStyle("age")}
                value={form.age}
                onChange={change("age")}
                onFocus={() => setFocused("age")}
                onBlur={() => setFocused(null)}
                placeholder="e.g. 10, 14"
              />
              {errors.age && <p style={errorStyle}>{errors.age}</p>}
            </div>
          </div>

          <div style={{ ...s.row2, marginTop: 20 }}>
            {renderSelect("gender", "Gender *", ["Male", "Female"])}
            <div>
              <label style={labelStyle}>School Name *</label>
              <input
                style={fieldStyle("school")}
                value={form.school}
                onChange={change("school")}
                onFocus={() => setFocused("school")}
                onBlur={() => setFocused(null)}
              />
              {errors.school && <p style={errorStyle}>{errors.school}</p>}
            </div>
          </div>

          <div style={{ ...s.row2, marginTop: 20 }}>
            <div>
              <label style={labelStyle}>Class / Grade *</label>
              <input
                style={fieldStyle("classGrade")}
                value={form.classGrade}
                onChange={change("classGrade")}
                onFocus={() => setFocused("classGrade")}
                onBlur={() => setFocused(null)}
              />
              {errors.classGrade && <p style={errorStyle}>{errors.classGrade}</p>}
            </div>
            {renderSelect("cohort", "Which cohort does the student fall under? *", COHORTS)}
          </div>

          <div style={{ marginTop: 20 }}>
            {renderSelect(
              "hasLaptop",
              "Does the student have a laptop? *",
              ["Yes", "No — Pearl AI Labs will provide a computer"],
            )}
          </div>

          <div style={s.divider} />

          {/* Section 3: Programme selection */}
          <p style={s.sectionLabel}>3. Programme Selection</p>
          <p style={s.sectionHint}>
            Select one or more modules. Fee: UGX 500,000 per module, discounted
            to UGX 450,000 per module when enrolling in two or more.
          </p>

          <label style={labelStyle}>Which module(s) would you like the student to join? *</label>
          <div style={s.moduleGroup}>
            {MODULE_NAMES.map((name) => (
              <label key={name} style={s.moduleRow}>
                <input
                  type="checkbox"
                  checked={form.modules.includes(name)}
                  onChange={() => toggleModule(name)}
                  style={s.checkbox}
                />
                <span>{name}</span>
              </label>
            ))}
          </div>
          {errors.modules && <p style={errorStyle}>{errors.modules}</p>}

          <div style={{ marginTop: 20 }}>
            {renderSelect("hearAbout", "How did you hear about us? *", HEAR_ABOUT_OPTIONS)}
          </div>

          {form.hearAbout === "Other" && (
            <div style={{ marginTop: 20 }}>
              <label style={labelStyle}>Please specify</label>
              <input
                style={fieldStyle("hearAboutOther")}
                value={form.hearAboutOther}
                onChange={change("hearAboutOther")}
                onFocus={() => setFocused("hearAboutOther")}
                onBlur={() => setFocused(null)}
              />
              {errors.hearAboutOther && <p style={errorStyle}>{errors.hearAboutOther}</p>}
            </div>
          )}

          <div style={s.divider} />

          {/* Section 4: Payment */}
          <p style={s.sectionLabel}>4. Payment</p>

          <div style={s.amountBox}>
            <span style={s.amountLabel}>Amount Due</span>
            <span style={s.amountValue}>{formatUgx(amountDue)}</span>
          </div>

          <p style={s.paymentInstructions}>
            Dial <strong>*165*3#</strong> on the parent/guardian&apos;s MTN line,
            select <strong>Pay Merchant / Pay Bill</strong>, enter code{" "}
            <strong>07778381</strong>, enter the amount above, then confirm
            with your MTN MoMo PIN.
          </p>

          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Transaction ID</label>
            <input
              style={fieldStyle("transactionId")}
              value={form.transactionId}
              onChange={change("transactionId")}
              onFocus={() => setFocused("transactionId")}
              onBlur={() => setFocused(null)}
              placeholder="e.g. from your MTN MoMo confirmation SMS"
            />
            <p style={s.fieldHint}>
              Don&apos;t have it yet? Leave this blank and submit — your
              details are saved, so you can come back and add it once you&apos;ve paid.
            </p>
          </div>

          <div style={s.divider} />

          {/* Section 5: Drop-off & pick-up */}
          <p style={s.sectionLabel}>5. Drop-off &amp; Pick-up Service</p>
          <p style={s.sectionHint}>
            We offer drop-off and pick-up services for students attending the training.
          </p>
          {renderSelect(
            "pickupService",
            "Would you like to use our drop-off and pick-up service? *",
            ["Yes", "No"],
          )}

          {form.pickupService === "Yes" && (
            <div style={{ marginTop: 20 }}>
              <label style={labelStyle}>Pick-up Location</label>
              <input
                style={fieldStyle("pickupLocation")}
                value={form.pickupLocation}
                onChange={change("pickupLocation")}
                onFocus={() => setFocused("pickupLocation")}
                onBlur={() => setFocused(null)}
                placeholder="Share your child's pick-up location"
              />
              {errors.pickupLocation && <p style={errorStyle}>{errors.pickupLocation}</p>}
            </div>
          )}

          <div style={s.divider} />

          {/* Section 6: Medical */}
          <p style={s.sectionLabel}>6. Medical Information</p>
          <div>
            <label style={labelStyle}>
              Does your child have any allergies, medical conditions, or special needs we should be aware of?
            </label>
            <textarea
              style={fieldStyle("medicalInfo", { minHeight: 90, resize: "vertical" })}
              value={form.medicalInfo}
              onChange={change("medicalInfo")}
              onFocus={() => setFocused("medicalInfo")}
              onBlur={() => setFocused(null)}
            />
          </div>
          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Any additional information you&apos;d like us to know?</label>
            <textarea
              style={fieldStyle("additionalInfo", { minHeight: 90, resize: "vertical" })}
              value={form.additionalInfo}
              onChange={change("additionalInfo")}
              onFocus={() => setFocused("additionalInfo")}
              onBlur={() => setFocused(null)}
            />
          </div>

          <div style={s.divider} />

          {/* Section 7: Consent */}
          <p style={s.sectionLabel}>7. Consent &amp; Confirmation</p>

          <label style={s.checkboxRow}>
            <input
              type="checkbox"
              checked={form.agreeTerms}
              onChange={(e) => {
                setForm(prev => ({ ...prev, agreeTerms: e.target.checked }));
                if (errors.agreeTerms) setErrors(prev => ({ ...prev, agreeTerms: undefined }));
              }}
              style={s.checkbox}
            />
            <span>
              I confirm the information provided above is accurate and I agree to enrol
              my child in the Pearl AI Labs Deep Tech Bootcamp. *
            </span>
          </label>
          {errors.agreeTerms && <p style={errorStyle}>{errors.agreeTerms}</p>}

          <div style={{ marginTop: 18 }}>
            {renderSelect(
              "photoConsent",
              "I consent to my child being photographed / recorded during the program for promotional use by Pearl AI Labs / Lwera Electronics & Semi-conductors. *",
              ["Yes", "No"],
            )}
          </div>

          <p style={s.paymentNote}>
            Payment of UGX 500,000/module (UGX 450,000/module for 2+ modules)
            confirms your child&apos;s spot.
            Contact: <strong>pearllabsug@gmail.com</strong> · <strong>+256 763 839356</strong>
          </p>

          {status === "error" && (
            <p style={s.submitErrorText}>{submitError}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={status === "sending"}
            style={{
              ...s.submitBtn,
              opacity: status === "sending" ? 0.7 : 1,
              cursor: status === "sending" ? "wait" : "pointer",
            }}
          >
            {status === "sending" ? "Submitting…" : "Submit Registration →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  page: { fontFamily: "'Inter', system-ui, sans-serif", background: CREAM, color: "#111D23", minHeight: "100vh" },
  header: { maxWidth: 760, margin: "0 auto", padding: "32px 32px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 },
  navBack: { fontSize: 13, fontWeight: 600, color: GREEN, textDecoration: "none" },
  pill: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_MUTED, border: `1px solid ${BORDER}`, borderRadius: 999, padding: "5px 14px" },
  pillDot: { width: 6, height: 6, borderRadius: "50%", background: ORANGE, display: "inline-block" },
  hero: { maxWidth: 760, margin: "0 auto", padding: "40px 32px 56px" },
  eyebrow: { fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: ORANGE, marginBottom: 14, fontWeight: 600 },
  heroTitle: { fontSize: "clamp(40px, 7vw, 68px)", fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.03em", color: GREEN, marginBottom: 20 },
  heroItalic: { fontStyle: "italic", color: ORANGE },
  heroSub: { fontSize: 15, lineHeight: 1.75, color: TEXT_MUTED, maxWidth: 560, marginBottom: 36 },
  statsRow: { display: "flex", gap: 40, flexWrap: "wrap" },
  stat: { display: "flex", flexDirection: "column", gap: 4 },
  statVal: { fontSize: 22, fontWeight: 800, color: ORANGE, lineHeight: 1, letterSpacing: "-0.01em" },
  statLbl: { fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_LIGHT },
  formWrap: { maxWidth: 760, margin: "0 auto", padding: "0 32px 96px" },
  formCard: { background: "#fff", borderRadius: 16, padding: "40px", border: `1px solid ${BORDER}`, boxShadow: "0 8px 44px rgba(0,45,91,0.07)" },
  formHeader: { marginBottom: 24 },
  formTitle: { fontSize: 24, fontWeight: 800, color: GREEN, letterSpacing: "-0.01em" },
  formSub: { fontSize: 13, color: TEXT_MUTED, marginTop: 6 },
  draftBanner: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, fontSize: 12.5, color: TEXT_MUTED, background: CREAM, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", marginTop: 16 },
  draftBannerLink: { background: "none", border: "none", color: ORANGE, fontWeight: 600, fontSize: 12.5, cursor: "pointer", padding: 0, textDecoration: "underline" },
  savedBanner: { fontSize: 13, color: GREEN, lineHeight: 1.6, background: "#FFF6EC", border: `1px solid ${ORANGE}`, borderRadius: 8, padding: "14px 16px", marginTop: 16 },
  divider: { height: 1, background: BORDER, margin: "28px 0" },
  sectionLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GREEN, marginBottom: 6 },
  sectionHint: { fontSize: 13, color: TEXT_MUTED, marginBottom: 18, lineHeight: 1.6 },
  row2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 },
  checkboxRow: { display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6, cursor: "pointer" },
  checkbox: { marginTop: 3, width: 16, height: 16, accentColor: ORANGE, flexShrink: 0, cursor: "pointer" },
  moduleGroup: { display: "flex", flexDirection: "column", gap: 10, marginTop: 4 },
  moduleRow: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: GREEN, fontWeight: 500, cursor: "pointer", padding: "12px 16px", background: CREAM, border: `1.5px solid ${BORDER}`, borderRadius: 8 },
  amountBox: { display: "flex", justifyContent: "space-between", alignItems: "center", background: GREEN, borderRadius: 10, padding: "18px 22px", marginBottom: 18 },
  amountLabel: { fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(244,250,255,0.7)", fontWeight: 700 },
  amountValue: { fontSize: 22, fontWeight: 800, color: "#fff" },
  paymentInstructions: { fontSize: 13.5, color: TEXT_MUTED, lineHeight: 1.8, background: CREAM, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "14px 16px" },
  fieldHint: { fontSize: 11.5, color: TEXT_MUTED, marginTop: 6, lineHeight: 1.6 },
  paymentNote: { fontSize: 12.5, color: TEXT_MUTED, lineHeight: 1.7, marginTop: 28, padding: "14px 16px", background: CREAM, borderRadius: 8, border: `1px solid ${BORDER}` },
  submitErrorText: { fontSize: 13, color: "#C0392B", marginTop: 16 },
  submitBtn: { width: "100%", marginTop: 20, padding: "15px", background: ORANGE, color: "#fff", fontSize: 14, fontWeight: 700, letterSpacing: "0.01em", border: "none", borderRadius: 8, textAlign: "center" },
  successWrap: { maxWidth: 480, margin: "0 auto", padding: "120px 32px", textAlign: "center" },
  successIcon: { width: 64, height: 64, borderRadius: "50%", background: "#E9F6EE", color: "#1E7B45", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" },
  successTitle: { fontSize: 26, fontWeight: 800, color: GREEN, marginBottom: 14 },
  successText: { fontSize: 14, lineHeight: 1.75, color: TEXT_MUTED, marginBottom: 28 },
  backLink: { fontSize: 13, fontWeight: 600, color: ORANGE, textDecoration: "none" },
};
```

- [ ] **Step 2: Manually verify in the browser**

Run: `npm run dev`, open `http://localhost:3000/apply`, then:
1. Check at least one module checkbox — confirm the Amount Due box updates live (500,000 for one, 900,000 for two, 1,350,000 for three).
2. Fill in the rest of the required fields, leave Transaction ID blank, submit → expect the "saved" banner text to appear and the form to remain visible (not the full-page thank-you screen).
3. Refresh the page → expect all your entered data to still be there (loaded from the draft).
4. Type a transaction ID and submit again → expect the full-page "Registration Sent!" screen, and confirm (via `sqlite3 data/registrations.db "SELECT student_name, transaction_id FROM registrations;"` or the dev dashboard once Task 10 is done) that it updated the same row rather than creating a second one.
5. Click "Start a new registration" (visible when a draft is loaded) → confirm the form clears completely.
6. Confirm the phone number `+256 763 839356` still appears unchanged in the bottom payment note.

- [ ] **Step 3: Commit**

```bash
git add src/components/InternshipApply.tsx
git commit -m "feat: add module selection, MoMo payment section, and draft persistence to registration form"
```

---

### Task 9: Update bootcamps page copy

**Files:**
- Modify: `src/components/InternshipOpportunities.tsx`

**Interfaces:** None — content-only changes.

- [ ] **Step 1: Update the glance/logistics data**

In `src/components/InternshipOpportunities.tsx`, replace the `glance` array (originally at lines 63–70):

```ts
const glance = [
  { label: "Dates", value: "24th Aug – 4th Sept 2026" },
  { label: "Schedule", value: "Monday – Saturday, 9:00am – 12:00pm" },
  { label: "Duration", value: "2 Weeks" },
  { label: "Venue", value: "National ICT Hub, Nakawa" },
  { label: "Ages", value: "9 – 19 (Cohort 1: 9–13, Cohort 2: 13–19)" },
  { label: "Fee", value: "UGX 500,000/module — UGX 450,000/module for 2+ modules" },
  { label: "Spots", value: "30 per cohort" },
];
```

- [ ] **Step 2: Update the hero pill and stat row**

Replace the pill text (originally line 99):

```tsx
Pearl AI Labs × Lwera Electronics · National ICT Hub, Nakawa
```

Replace the stats array (originally lines 124–129), changing only the fee entry's label:

```tsx
{[
  { value: "3",       label: "Tracks" },
  { value: "10",      label: "Sessions" },
  { value: "9–19",    label: "Ages" },
  { value: "UGX 500K", label: "Per Module" },
].map((stat) => (
```

- [ ] **Step 3: Update the tracks section intro copy**

Replace the section title and sub-copy (originally lines 143–148):

```tsx
<h2 style={s.sectionTitle}>Choose Your Track(s). Two Weeks. Real Skills.</h2>
<p style={s.sectionSub}>
  Each learner can enrol in one or more deep-tech tracks — UGX 500,000 per
  module, discounted to UGX 450,000 per module when enrolling in two or
  more. Content is levelled for two age cohorts, from first principles to a
  working, showcase-ready project.
</p>
```

- [ ] **Step 4: Update the partnership/capstone paragraph**

Replace the capstone description (originally lines 212–216):

```tsx
<p style={s.capstoneDesc}>
  The Pearl AI Labs Deep Tech Bootcamp, in partnership with Lwera
  Electronics &amp; Semi-conductors and the National ICT Innovation Hub, is
  designed and sequenced around clear, project-based outcomes — every
  learner leaves with a working artefact, not just notes.
</p>
```

- [ ] **Step 5: Update the closing CTA copy**

Replace the CTA sub-copy (originally line 232–236):

```tsx
<p style={s.ctaSub}>
  24th August – 4th September 2026 at National ICT Hub, Nakawa.
  UGX 500,000 per module (UGX 450,000/module for 2+ modules). Email{" "}
  <strong>pearllabsug@gmail.com</strong> or
  call <strong>+256 763 839356</strong> with any questions.
</p>
```

- [ ] **Step 6: Manually verify in the browser**

Run: `npm run dev`, open `http://localhost:3000/bootcamps`, and confirm: the glance grid shows Mon–Sat, the per-module fee, and 30 spots; the hero pill and stat row read correctly; the tracks section and capstone paragraph mention the new partnership wording; nothing overflows or looks broken at mobile width.

- [ ] **Step 7: Commit**

```bash
git add src/components/InternshipOpportunities.tsx
git commit -m "content: update bootcamps page to match registration-PDF framing"
```

---

### Task 10: Dev dashboard page

**Files:**
- Create: `src/app/dev/registrations/actions.ts`
- Create: `src/components/dev/RegistrationsDashboard.tsx`
- Create: `src/app/dev/registrations/page.tsx`

**Interfaces:**
- Consumes: `listRegistrations`, `markVerified`, `RegistrationRow` from `src/lib/registrations.ts` (Task 4); the login/guard flow from Task 6.

- [ ] **Step 1: Create the server action**

Create `src/app/dev/registrations/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { markVerified } from "@/lib/registrations";

export async function markVerifiedAction(id: number): Promise<void> {
  markVerified(id);
  revalidatePath("/dev/registrations");
}
```

- [ ] **Step 2: Create the dashboard client component**

Create `src/components/dev/RegistrationsDashboard.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { RegistrationRow } from "@/lib/registrations";
import { formatUgx } from "@/lib/fee";

const GREEN = "#002D5B";
const ORANGE = "#EF8633";
const BORDER = "rgba(0,45,91,0.15)";
const CREAM = "#F4FAFF";

interface Props {
  registrations: RegistrationRow[];
  onMarkVerified: (id: number) => Promise<void>;
}

function Row({
  row,
  showVerifyButton,
  onMarkVerified,
}: {
  row: RegistrationRow;
  showVerifyButton: boolean;
  onMarkVerified: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    setVerifying(true);
    await onMarkVerified(row.id);
    setVerifying(false);
  };

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          padding: "14px 16px",
          background: "#fff",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "inherit",
        }}
      >
        <span style={{ fontWeight: 700, color: GREEN, fontSize: 14 }}>{row.studentName}</span>
        <span style={{ fontSize: 12.5, color: "#4C616C" }}>{row.parentName} · {row.phone}</span>
        <span style={{ fontSize: 12.5, color: "#4C616C" }}>{row.modules.join(", ")}</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: ORANGE }}>{formatUgx(row.amountDue)}</span>
        <span style={{ fontSize: 11, color: "#4C616C" }}>{new Date(row.createdAt).toLocaleString()}</span>
      </button>

      {open && (
        <div style={{ padding: "14px 16px", borderTop: `1px solid ${BORDER}`, background: CREAM, fontSize: 13, lineHeight: 1.8, color: "#111D23" }}>
          <p><strong>Email:</strong> {row.email}</p>
          <p><strong>Alt phone:</strong> {row.altPhone || "Not provided"}</p>
          <p><strong>Address:</strong> {row.address}</p>
          <p><strong>Student age / gender:</strong> {row.age} / {row.gender}</p>
          <p><strong>School / Class:</strong> {row.school} / {row.classGrade}</p>
          <p><strong>Cohort:</strong> {row.cohort}</p>
          <p><strong>Has laptop:</strong> {row.hasLaptop}</p>
          <p><strong>Heard about us:</strong> {row.hearAbout}{row.hearAboutOther ? ` (${row.hearAboutOther})` : ""}</p>
          <p><strong>Pick-up service:</strong> {row.pickupService}{row.pickupLocation ? ` — ${row.pickupLocation}` : ""}</p>
          <p><strong>Medical info:</strong> {row.medicalInfo || "Not provided"}</p>
          <p><strong>Additional info:</strong> {row.additionalInfo || "Not provided"}</p>
          <p><strong>Photo consent:</strong> {row.photoConsent}</p>
          <p><strong>Transaction ID:</strong> {row.transactionId || "Not provided"}</p>
          {row.verifiedAt && <p><strong>Verified at:</strong> {new Date(row.verifiedAt).toLocaleString()}</p>}

          {showVerifyButton && (
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              style={{
                marginTop: 10,
                padding: "9px 18px",
                background: GREEN,
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: verifying ? "wait" : "pointer",
              }}
            >
              {verifying ? "Marking…" : "Mark Verified"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  rows,
  showVerifyButton,
  onMarkVerified,
  emptyText,
}: {
  title: string;
  rows: RegistrationRow[];
  showVerifyButton: boolean;
  onMarkVerified: (id: number) => Promise<void>;
  emptyText: string;
}) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: GREEN, marginBottom: 14 }}>
        {title} <span style={{ color: "#4C616C", fontWeight: 600 }}>({rows.length})</span>
      </h2>
      {rows.length === 0 ? (
        <p style={{ fontSize: 13, color: "#4C616C" }}>{emptyText}</p>
      ) : (
        rows.map((row) => (
          <Row key={row.id} row={row} showVerifyButton={showVerifyButton} onMarkVerified={onMarkVerified} />
        ))
      )}
    </section>
  );
}

export default function RegistrationsDashboard({ registrations, onMarkVerified }: Props) {
  const unpaid = registrations.filter((r) => !r.transactionId);
  const awaiting = registrations.filter((r) => r.transactionId && !r.verified);
  const verified = registrations.filter((r) => r.transactionId && r.verified);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px 96px", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: GREEN, marginBottom: 32 }}>
        Bootcamp Registrations
      </h1>

      <Section
        title="Unpaid"
        rows={unpaid}
        showVerifyButton={false}
        onMarkVerified={onMarkVerified}
        emptyText="No registrations without a transaction ID."
      />
      <Section
        title="Awaiting Verification"
        rows={awaiting}
        showVerifyButton
        onMarkVerified={onMarkVerified}
        emptyText="Nothing waiting on verification."
      />
      <Section
        title="Verified"
        rows={verified}
        showVerifyButton={false}
        onMarkVerified={onMarkVerified}
        emptyText="No verified registrations yet."
      />
    </div>
  );
}
```

- [ ] **Step 3: Create the page**

Create `src/app/dev/registrations/page.tsx`:

```tsx
import { listRegistrations } from "@/lib/registrations";
import RegistrationsDashboard from "@/components/dev/RegistrationsDashboard";
import { markVerifiedAction } from "./actions";

export default function DevRegistrationsPage() {
  const registrations = listRegistrations();
  return <RegistrationsDashboard registrations={registrations} onMarkVerified={markVerifiedAction} />;
}
```

- [ ] **Step 4: Manually verify in the browser**

Run: `npm run dev`, log in at `http://localhost:3000/dev/login` with the password from `.env.local`, then:
1. Confirm you land on `/dev/registrations` and see the three sections with correct counts (matching whatever test registrations you created in Task 8).
2. Expand a row and confirm every field shows correctly, including Transaction ID.
3. On an "Awaiting Verification" row, click "Mark Verified" → confirm it disappears from that section and reappears under "Verified" without a full page reload looking broken (a brief refresh via `revalidatePath` is expected).
4. Log out (clear the `pl_dev_session` cookie via devtools) and confirm visiting `/dev/registrations` redirects back to `/dev/login`.

- [ ] **Step 5: Commit**

```bash
git add src/app/dev/registrations src/components/dev/RegistrationsDashboard.tsx
git commit -m "feat: add dev-only registrations dashboard with verification workflow"
```

---

### Task 11: Final documentation and end-to-end walkthrough

**Files:**
- Modify: `README.md`

**Interfaces:** None — documentation and a manual full-flow check.

- [ ] **Step 1: Document the new environment variables**

Append a section to `README.md`:

```markdown
## Environment variables

In addition to the SMTP variables used for the registration email, this
project needs:

- `DEV_DASHBOARD_PASSWORD` — shared password for `/dev/login`.
- `DEV_SESSION_SECRET` — long random string used to sign the dev dashboard
  session cookie. Changing it logs everyone out.

Registrations are stored in a local SQLite file at `data/registrations.db`,
created automatically on first run. This file is git-ignored — back it up
periodically (e.g. `cp data/registrations.db backups/registrations-$(date +%F).db`)
since it's the only copy of registrant data.
```

- [ ] **Step 2: Run the full automated test suite one more time**

Run: `npm test`
Expected: every suite from Tasks 2, 3, 4, 5, and 7 passes.

- [ ] **Step 3: Run a full manual end-to-end walkthrough**

Using `npm run dev`:
1. Submit a registration at `/apply` with 2 modules selected and no transaction ID → confirm the amount shown is UGX 900,000 and the "saved" banner appears.
2. Log into `/dev/registrations` → confirm the new entry appears under "Unpaid".
3. Return to `/apply` (same browser) → confirm the form is still filled in from the draft.
4. Add a transaction ID and submit → confirm it moves to "Awaiting Verification" in the dashboard (open a second tab or refresh) and check your email inbox / server logs for the outgoing mail attempt.
5. Click "Mark Verified" on that entry → confirm it moves to "Verified".
6. Confirm the bootcamps page (`/bootcamps`) and apply page reflect the Mon–Sat schedule, per-module fee, and Lwera Electronics/ICT Hub partnership wording throughout.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: document dev dashboard env vars and sqlite backup"
```
