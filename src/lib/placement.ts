// Internship placement applications (pearllabs.ug/internships → Pearl Workspace, SQL 71).
// Pure rules shared by the form and the API route; the database re-checks the same limits.
// No imports, so `node --test` can run it directly.

export const TRACKS = { ai: "AI", robotics: "Robotics" } as const;
export const DAYS = [["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"], ["fri", "Fri"], ["sat", "Sat"]] as const;
export const TIMES = { morning: "Morning", afternoon: "Afternoon", full_day: "Full day" } as const;
export const GENDERS = ["Male", "Female", "Prefer not to say"] as const;
export const TEXT_MAX = 1500;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_OTHER_FILES = 3;
export const EMAIL_ATTACH_BUDGET = 20 * 1024 * 1024;

const TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};
export const ACCEPT_ATTR = ".pdf,.doc,.docx,.jpg,.jpeg,.png";

export interface PlacementFields {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  institution: string;
  course: string;
  track: string;
  days: string[];
  preferredTime: string;
  whyTrack: string;
  skills: string;
  portfolioUrl: string;
}
export interface FileInfo {
  name: string;
  size: number;
}

export const emptyFields = (): PlacementFields => ({
  fullName: "", email: "", phone: "", gender: "", institution: "", course: "", track: "",
  days: [], preferredTime: "", whyTrack: "", skills: "", portfolioUrl: "",
});

const DAY_KEYS: string[] = DAYS.map(([k]) => k);

export function fieldErrors(f: PlacementFields): Partial<Record<keyof PlacementFields, string>> {
  const e: Partial<Record<keyof PlacementFields, string>> = {};
  const need = (key: keyof PlacementFields, value: string, label: string, max: number) => {
    const v = value.trim();
    if (!v) e[key] = `Enter your ${label}`;
    else if (v.length > max) e[key] = `Keep your ${label} under ${max} characters`;
  };
  need("fullName", f.fullName, "full name", 120);
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "Enter a valid email address";
  const digits = f.phone.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) e.phone = "Enter a valid phone number";
  if (!(GENDERS as readonly string[]).includes(f.gender)) e.gender = "Choose an option";
  need("institution", f.institution, "university or institution", 160);
  need("course", f.course, "course or programme", 160);
  if (!Object.hasOwn(TRACKS, f.track)) e.track = "Choose a track";
  if (f.days.length === 0 || f.days.some((d) => !DAY_KEYS.includes(d))) e.days = "Tick the days you can be around";
  if (!Object.hasOwn(TIMES, f.preferredTime)) e.preferredTime = "Choose a preferred time";
  need("whyTrack", f.whyTrack, "answer", TEXT_MAX);
  need("skills", f.skills, "projects or skills", TEXT_MAX);
  const url = f.portfolioUrl.trim();
  if (url && (!/^https?:\/\/\S+$/i.test(url) || url.length > 300)) e.portfolioUrl = "Enter a full link starting with https://";
  return e;
}

const extensionOf = (name: string) => name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";

export function contentTypeFor(name: string): string | null {
  return TYPES[extensionOf(name)] ?? null;
}

export function fileProblem(file: FileInfo): string | null {
  if (!contentTypeFor(file.name)) return `${file.name}: only PDF, Word or image (JPG, PNG) files`;
  if (file.size <= 0) return `${file.name} is empty`;
  if (file.size > MAX_FILE_BYTES) return `${file.name} is larger than 10 MB`;
  return null;
}

export function filesProblem(cv: FileInfo | null, others: FileInfo[]): string | null {
  if (!cv) return "Attach your CV";
  if (others.length > MAX_OTHER_FILES) return `Attach at most ${MAX_OTHER_FILES} other documents`;
  for (const f of [cv, ...others]) {
    const p = fileProblem(f);
    if (p) return p;
  }
  return null;
}

// A storage-safe name: last path segment only, plain characters, at most ~80 long.
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).filter(Boolean).pop() ?? "";
  const ext = extensionOf(base);
  const stem = (ext ? base.slice(0, -(ext.length + 1)) : base)
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^[-.]+/, "")
    .slice(0, 70);
  if (!stem) return ext ? `file.${ext}` : "file";
  return ext ? `${stem}.${ext}` : stem;
}

export function availabilityText(days: string[], time: string): string {
  const labels = DAYS.filter(([k]) => days.includes(k)).map(([, l]) => l).join(", ");
  return `${labels} · ${Object.hasOwn(TIMES, time) ? TIMES[time as keyof typeof TIMES] : time}`;
}

export function toRow(f: PlacementFields) {
  return {
    full_name: f.fullName.trim(),
    email: f.email.trim(),
    phone: f.phone.trim(),
    gender: f.gender,
    institution: f.institution.trim(),
    course: f.course.trim(),
    track: f.track,
    days: DAY_KEYS.filter((d) => f.days.includes(d)),
    preferred_time: f.preferredTime,
    why_track: f.whyTrack.trim(),
    skills: f.skills.trim(),
    portfolio_url: f.portfolioUrl.trim() || null,
  };
}

// Reads the multipart form's text fields (FormData.get / getAll), ignoring anything else.
export function readFields(get: (key: string) => string | null, getAll: (key: string) => string[]): PlacementFields {
  const s = (key: string) => get(key) ?? "";
  return {
    fullName: s("fullName"), email: s("email"), phone: s("phone"), gender: s("gender"),
    institution: s("institution"), course: s("course"), track: s("track"), days: getAll("days"),
    preferredTime: s("preferredTime"), whyTrack: s("whyTrack"), skills: s("skills"), portfolioUrl: s("portfolioUrl"),
  };
}

// Which files (by index, CV first) go into the email; Gmail refuses messages over 25 MB.
export function emailAttachmentPlan(sizes: number[], budget = EMAIL_ATTACH_BUDGET) {
  const attach: number[] = [];
  const skip: number[] = [];
  let used = 0;
  sizes.forEach((size, i) => {
    if (used + size <= budget) {
      attach.push(i);
      used += size;
    } else skip.push(i);
  });
  return { attach, skip };
}

// In-memory per-key limit (the site runs as one pm2 process).
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (key: string, now = Date.now()) => {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    return true;
  };
}
