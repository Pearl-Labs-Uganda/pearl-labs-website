// Server-only access to Pearl Workspace (Supabase) with the service key. Never import this from
// a client component: the key bypasses every access rule.

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.");
  return { url, key };
}

async function call(path: string, init: RequestInit & { headers?: Record<string, string> }) {
  const { url, key } = config();
  const res = await fetch(`${url}${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} failed: ${res.status} ${await res.text()}`);
  return res;
}

const objectPath = (path: string) => path.split("/").map(encodeURIComponent).join("/");

export async function uploadApplicationFile(path: string, bytes: Uint8Array, contentType: string) {
  await call(`/storage/v1/object/applications/${objectPath(path)}`, {
    method: "POST",
    headers: { "Content-Type": contentType, "x-upsert": "false" },
    body: bytes as BodyInit,
  });
}

export async function removeApplicationFiles(paths: string[]) {
  if (paths.length === 0) return;
  await call(`/storage/v1/object/applications`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: paths }),
  });
}

export async function insertApplication(row: Record<string, unknown>) {
  await call(`/rest/v1/placement_applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(row),
  });
}
