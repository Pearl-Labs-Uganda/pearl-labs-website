import { hmacHex } from "./devAuth";

// The hackathon staff area (/pl-ac) has its own password, separate from the bootcamp dashboard,
// so it can be shared with hackathon partners without opening the bootcamp records.
export const HACKATHON_COOKIE = "pl_ac_session";
export const HACKATHON_BASE = "/pl-ac";

function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export function verifyHackathonPassword(password: string): boolean {
  const expected = process.env.HACKATHON_DASHBOARD_PASSWORD;
  if (!expected) return false;
  return sameText(password, expected);
}

// Changing HACKATHON_DASHBOARD_PASSWORD signs everyone out, because the token includes it.
export async function createHackathonToken(): Promise<string> {
  const secret = process.env.DEV_SESSION_SECRET;
  const password = process.env.HACKATHON_DASHBOARD_PASSWORD;
  if (!secret || !password) throw new Error("DEV_SESSION_SECRET or HACKATHON_DASHBOARD_PASSWORD is not set");
  return hmacHex(secret, `hackathon-dashboard:${password}`);
}

export async function isValidHackathonToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  try {
    return sameText(token, await createHackathonToken());
  } catch {
    return false;
  }
}
