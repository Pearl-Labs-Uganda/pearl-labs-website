import type { Site } from "./hackathon";

// Our other websites that may post to the hackathon API (the same form runs there).
const PARTNER_ORIGINS: Record<string, Site> = {
  "https://kate-d.com": "kate-d.com",
  "https://www.kate-d.com": "kate-d.com",
};

const allowedOrigin = (request: Request): string | null => {
  const origin = request.headers.get("origin") ?? "";
  if (Object.hasOwn(PARTNER_ORIGINS, origin)) return origin;
  // Local development of the partner site.
  if (process.env.NODE_ENV !== "production" && /^http:\/\/localhost:\d+$/.test(origin)) return origin;
  return null;
};

function corsHeaders(request: Request): Record<string, string> {
  const origin = allowedOrigin(request);
  if (!origin) return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function withCors<T extends Response>(request: Request, response: T): T {
  for (const [k, v] of Object.entries(corsHeaders(request))) response.headers.set(k, v);
  return response;
}

export const preflight = (request: Request) => new Response(null, { status: 204, headers: corsHeaders(request) });

// Which website the family is on, from the browser's Origin header (not anything the page sends).
export function siteFromRequest(request: Request): Site {
  const origin = request.headers.get("origin") ?? "";
  if (Object.hasOwn(PARTNER_ORIGINS, origin)) return PARTNER_ORIGINS[origin];
  if (process.env.NODE_ENV !== "production" && /^http:\/\/localhost:\d+$/.test(origin)) {
    // Local testing: the partner site's dev server isn't on this site's port.
    return origin.endsWith(`:${process.env.PORT ?? "3000"}`) ? "pearllabs.ug" : "kate-d.com";
  }
  return "pearllabs.ug";
}
