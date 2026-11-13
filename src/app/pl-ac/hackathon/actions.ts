"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { HACKATHON_COOKIE, isValidHackathonToken } from "@/lib/hackathonAuth";
import { setHackathonLeadFlag, setHackathonVerified } from "@/lib/hackathonStore";

// Checked here as well as in middleware: a server action is a plain POST anyone can send.
async function requireStaff() {
  const jar = await cookies();
  if (!(await isValidHackathonToken(jar.get(HACKATHON_COOKIE)?.value))) throw new Error("Not signed in");
}

export async function setVerifiedAction(id: number, verified: boolean): Promise<void> {
  await requireStaff();
  if (!Number.isInteger(id)) throw new Error("Bad id");
  setHackathonVerified(id, verified);
  revalidatePath("/pl-ac/hackathon");
}

export async function setLeadFlagAction(id: number, flag: "contacted" | "dismissed", value: boolean): Promise<void> {
  await requireStaff();
  if (!Number.isInteger(id) || (flag !== "contacted" && flag !== "dismissed")) throw new Error("Bad request");
  setHackathonLeadFlag(id, flag, value);
  revalidatePath("/pl-ac/hackathon");
}
