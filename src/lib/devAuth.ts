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
