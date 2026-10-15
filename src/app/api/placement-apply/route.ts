import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  contentTypeFor,
  createRateLimiter,
  fieldErrors,
  filesProblem,
  readFields,
  safeFileName,
  toRow,
  type PlacementFields,
} from "@/lib/placement";
import { insertApplication, removeApplicationFiles, uploadApplicationFile } from "@/lib/supabaseAdmin";
import { sendApplicantEmail, sendPearlEmail, type LoadedFile } from "@/lib/placementEmail";

export const runtime = "nodejs";

const allow = createRateLimiter(5, 60 * 60 * 1000);

const isFile = (v: FormDataEntryValue | null): v is File => typeof v === "object" && v !== null && "arrayBuffer" in v;

// Files go up first and the row last, so the Workspace alert only fires for a complete
// application. If anything fails, the uploaded files are removed again.
async function saveToWorkspace(fields: PlacementFields, files: LoadedFile[]): Promise<string> {
  const id = randomUUID();
  const uploaded: { path: string; name: string; size: number; mime: string; kind: string }[] = [];
  try {
    for (const [i, f] of files.entries()) {
      const path = `${id}/${i}-${safeFileName(f.name)}`;
      await uploadApplicationFile(path, f.bytes, f.mime);
      uploaded.push({ path, name: f.name, size: f.size, mime: f.mime, kind: f.kind });
    }
    await insertApplication({ id, ...toRow(fields), files: uploaded });
    return id;
  } catch (error) {
    await removeApplicationFiles(uploaded.map((u) => u.path)).catch((e) =>
      console.error("Cleanup of uploaded application files failed:", e),
    );
    throw error;
  }
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "We couldn't read the form — please try again." }, { status: 400 });
  }

  // Bots fill the hidden field; tell them it worked and keep nothing.
  if (String(form.get("website") ?? "").trim()) return NextResponse.json({ ok: true });

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (!allow(ip)) {
    return NextResponse.json(
      { error: "Too many applications from this connection — please try again later." },
      { status: 429 },
    );
  }

  const fields = readFields(
    (k) => {
      const v = form.get(k);
      return typeof v === "string" ? v : null;
    },
    (k) => form.getAll(k).filter((v): v is string => typeof v === "string"),
  );
  const firstError = Object.values(fieldErrors(fields))[0];
  if (firstError) return NextResponse.json({ error: firstError }, { status: 400 });

  const cvEntry = form.get("cv");
  const cv = isFile(cvEntry) && cvEntry.size > 0 ? cvEntry : null;
  const others = form
    .getAll("other")
    .filter(isFile)
    .filter((f) => f.size > 0);
  const fileError = filesProblem(cv, others);
  if (fileError || !cv) return NextResponse.json({ error: fileError ?? "Attach your CV" }, { status: 400 });

  const files: LoadedFile[] = await Promise.all(
    [{ kind: "cv" as const, file: cv }, ...others.map((file) => ({ kind: "other" as const, file }))].map(
      async ({ kind, file }) => ({
        kind,
        name: file.name,
        size: file.size,
        mime: contentTypeFor(file.name) as string,
        bytes: new Uint8Array(await file.arrayBuffer()),
      }),
    ),
  );

  let applicationId: string | null = null;
  try {
    applicationId = await saveToWorkspace(fields, files);
  } catch (error) {
    console.error("Placement application NOT saved to the Workspace:", error);
  }

  let pearlEmailed = false;
  try {
    await sendPearlEmail(fields, files, applicationId);
    pearlEmailed = true;
  } catch (error) {
    console.error("Placement application email to Pearl failed:", error);
  }

  if (!applicationId && !pearlEmailed) {
    return NextResponse.json(
      { error: "We couldn't send your application — please try again in a few minutes." },
      { status: 500 },
    );
  }

  try {
    await sendApplicantEmail(fields);
  } catch (error) {
    console.error("Placement 'received' email to the applicant failed:", error);
  }

  return NextResponse.json({ ok: true });
}
