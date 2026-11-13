// Lets anyone (staff, mentors, testers — no dashboard password needed) permanently
// opt a browser out of GA4 by visiting <site>/?nostats=1 once. The flag is a plain
// year-long cookie, not tied to the dev dashboard session, so it works from any
// device without requiring dashboard access.
const OPT_OUT_COOKIE = "pl_no_stats";
const OPT_OUT_PARAM = "nostats";

export function hasAnalyticsOptOut(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c === `${OPT_OUT_COOKIE}=1`);
}

export function isOptingOutNow(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get(OPT_OUT_PARAM) === "1";
}

// Reads ?nostats=1 off the current URL, sets the opt-out cookie if present, and
// strips the param so it doesn't linger in the address bar or get re-shared.
export function applyOptOutFromUrl(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (params.get(OPT_OUT_PARAM) !== "1") return;

  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${OPT_OUT_COOKIE}=1; path=/; max-age=${oneYear}; SameSite=Lax`;

  params.delete(OPT_OUT_PARAM);
  const query = params.toString();
  const clean = window.location.pathname + (query ? `?${query}` : "") + window.location.hash;
  window.history.replaceState({}, "", clean);
}

export function shouldTrack(): boolean {
  return !hasAnalyticsOptOut() && !isOptingOutNow();
}

// An anonymous random id kept in this browser, so dashboards can count unique visitors
// instead of page loads. Not tied to any name, phone or email.
const VISITOR_KEY = "pl_vid";
export function visitorId(): string {
  try {
    let id = window.localStorage.getItem(VISITOR_KEY);
    if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
      id = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
      window.localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !shouldTrack()) return;

  const w = window as unknown as { gtag?: (...args: unknown[]) => void; clarity?: (...args: unknown[]) => void };
  w.gtag?.("event", name, params);
  // Clarity custom event, so its recordings can be filtered by step (e.g. hackathon_child_done).
  w.clarity?.("event", name);

  // Mirrors apply_view / form_started / form_submitted into our own SQLite table
  // (see src/lib/analyticsEvents.ts) so they show up on the dev dashboard without
  // needing GA4 API credentials. Fire-and-forget; a dropped beacon isn't worth
  // surfacing to the visitor.
  fetch("/api/analytics-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: name, visitorId: visitorId() }),
    keepalive: true,
  }).catch(() => {});
}
