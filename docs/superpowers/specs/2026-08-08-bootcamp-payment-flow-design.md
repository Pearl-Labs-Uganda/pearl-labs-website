# Bootcamp Registration, MTN MoMo Payment & Dev Dashboard — Design

Date: 2026-08-08
Status: Approved for implementation

## 1. Context

The `/bootcamps` page and `/apply` registration form currently follow
`details/Pearl_Labs_Deep_Tech_Bootcamp_Curriculum.docx` (single-track flat fee,
Mon–Fri, "Pearl Labs × KateD Learning"). The site needs to move to the newer
`details/Pearl_AI_Labs_DeepTech_Registration_Form.pdf` framing instead
(multi-module selection with a discount, Mon–Sat, "Pearl AI Labs × Lwera
Electronics & Semi-conductors + National ICT Innovation Hub"), and add a
payment step: parents pay via a published MTN MoMo Pay Bill code and submit
the transaction ID together with their registration. Submissions must persist
server-side (nothing does today — the form only emails) so a password-gated,
dev-only dashboard can show who has registered, who has paid (claimed via a
transaction ID), and who's been manually verified against the MTN MoMo
statement.

The site runs on a private server the owner SSHes into (pm2/systemd,
`git pull` + restart in place — the project directory is not wiped or
rebuilt on deploy), not on serverless hosting. This makes a local SQLite file
a viable, zero-new-accounts persistence layer.

The public registration link is already live, so this is being built and
shipped quickly rather than iterated on at length.

## 2. Content updates

Replace curriculum-doc framing with the registration-PDF framing, site-wide:

- Partnership copy: "Pearl AI Labs, in partnership with Lwera Electronics &
  Semi-conductors and the National ICT Innovation Hub" (replaces "KateD
  Learning" everywhere it appears: `InternshipOpportunities.tsx` hero pill,
  capstone section, and `InternshipApply.tsx` hero sub-copy and photo-consent
  checkbox label).
- Schedule: Monday–Saturday (was Monday–Friday) in the glance section and the
  apply-page stat row.
- Fee: "UGX 500,000/module (UGX 450,000/module for 2+ modules)" replaces
  "UGX 500,000/learner" everywhere it's quoted (hero stats, glance grid, CTA
  section, apply-page stats, apply-page section-3 hint, apply-page payment
  note).
- Add "30 spots per cohort" to the glance/logistics grid.
- Unchanged (both docs already agree, or it's out of scope): track
  descriptions, cohort names (Explorers/Innovators), programme aims, venue
  (National ICT Hub, Nakawa).

## 3. Registration form changes (`InternshipApply.tsx`)

- **Module selection**: replace the single `track` dropdown with a checkbox
  group for the three modules (AI & Coding, Robotics, Aerospace CAD). At
  least one must be selected. Stored as `modules: string[]`.
- **Live fee calculator**: derived value, not user input —
  `modules.length * (modules.length >= 2 ? 450_000 : 500_000)`, formatted as
  "UGX 500,000" style and displayed prominently right above the payment
  section.
- **Payment section** (new, after Programme Selection, before Drop-off &
  Pick-up): displays the computed amount due, then static instructions —
  "Dial \*165\*3#, select Pay Merchant/Pay Bill, enter code 07778381, enter
  the amount above, confirm with your MTN MoMo PIN." No recipient name is
  shown (deliberately, to avoid confusion). Below that, an optional
  **Transaction ID** text field with helper copy explaining it can be left
  blank now and added later by returning to this page.
- **Remove**: "Parent/Guardian Signature (Full Name)" field (Section 6) —
  duplicates Section 1's Parent/Guardian Full Name. Remove from form state,
  validation, and the API payload/email template.
- **Unchanged**: the phone number `+256 763 839356` in the bottom payment
  note (only its surrounding fee text updates, per the fee change above).
- **"Start a new registration"** link/button (visible whenever a saved draft
  is loaded) that clears the local draft and registration ID, so a parent
  registering a second child from the same device isn't stuck editing the
  first child's data.
- Submit button remains enabled with the transaction ID field empty —
  submitting without one is a valid, expected action.

## 4. Client-side persistence & resubmission

- On every form change (debounced), the full form state is saved to
  `localStorage` under a single key, together with a `registrationId` once
  one has been issued by the server.
- On mount, if a saved draft exists, the form is repopulated from it
  (including whatever `registrationId` was stored).
- On submit, the client sends the whole form; if a `registrationId` is
  present in the draft, it's included in the request body.
- The draft (and `registrationId`) is only cleared from `localStorage` after
  a submission that includes a non-empty transaction ID succeeds. A bare
  registration (no transaction ID) keeps the draft around so the parent can
  return later, have the form auto-filled, add the transaction ID, and
  resubmit.

## 5. Backend data store

A SQLite file at `data/registrations.db` (created automatically on first run
via `better-sqlite3`; git-ignored, never committed — same pattern as the
existing `details/` exclusion). One table:

```
registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT, updated_at TEXT,
  parent_name, relationship, profession, phone, alt_phone, email, address,
  student_name, age, gender, school, class_grade, cohort, has_laptop,
  modules TEXT,            -- JSON array, e.g. ["AI & Coding","Robotics"]
  amount_due INTEGER,      -- computed at submit time, in UGX
  hear_about, hear_about_other,
  pickup_service, pickup_location,
  medical_info, additional_info,
  agree_terms INTEGER, photo_consent,
  transaction_id TEXT,     -- nullable
  verified INTEGER DEFAULT 0,
  verified_at TEXT
)
```

`better-sqlite3` is chosen over Postgres/KV/Sheets because the app runs on a
persistent server the owner controls directly — no new hosted service or
credentials needed. It ships prebuilt binaries for common Linux setups, so
`npm install` typically doesn't require native compilation; if it ever does,
`apt-get install build-essential python3` resolves it.

Out of scope for now: automated backups (can add a daily `cp` cron job
later if wanted), capacity enforcement against the "30 spots per cohort"
figure (informational copy only — the dev dashboard is how the owner tracks
fill rate manually), and any MTN MoMo API integration (payment is entirely
manual/self-reported; "Verified" is a human bookkeeping check, not an
automated one).

## 6. API changes (`/api/internship-apply`)

`POST` becomes upsert-capable:

- No `id` in the payload → validate, insert a new row, return `{ ok: true, id }`.
- `id` present → validate, update that row (including a fresh `amount_due`
  recompute and `updated_at`) if it exists; if it doesn't (e.g. the DB file
  was reset), fall back to inserting a new row and returning the new `id`.
- After the DB write succeeds, send the confirmation email (existing
  nodemailer path) only if the incoming `transactionId` is non-empty **and**
  differs from what was already stored for that row before this write (i.e.
  it's new or has just been corrected). This is the **only** trigger for the
  email. A submission with no transaction ID never emails, and resubmitting
  with the same, unchanged transaction ID (e.g. just editing an unrelated
  field) doesn't send a duplicate.
- Email template gains: selected modules, computed amount due, transaction
  ID. The redundant signature field is removed from the template.

## 7. Dev dashboard

- New route not linked from the nav (e.g. `/dev/registrations`), protected
  by a single shared password (env var) via a login form that sets an
  httpOnly session cookie; a small middleware/guard checks the cookie for
  any `/dev/*` route and redirects to the login form otherwise.
- Page shows three stacked sections with counts: **Unpaid** (no transaction
  ID), **Awaiting Verification** (transaction ID present, not yet verified),
  **Verified**. Each row is collapsed to key fields (student, parent, phone,
  modules, amount due, submitted date) and expands to show every field.
- Rows in "Awaiting Verification" get a "Mark Verified" button/action that
  flips `verified` to true and stamps `verified_at` — no other side effect
  (the email already went out when the transaction ID was submitted).

## 8. Non-goals

- No live MTN MoMo API integration or automatic amount/status verification.
- No enrollment-capacity enforcement or waitlisting.
- No multi-admin accounts/roles — a single shared password is sufficient.
- No automated database backups (documented as a manual follow-up option).
