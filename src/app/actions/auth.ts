"use server";

import { redirect } from "next/navigation";
import { loginAndCreateSession, logoutCurrentSession } from "@/server/auth";

export async function loginAction(
  input: { email: string; password: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await loginAndCreateSession(input.email, input.password);
  if ("error" in result) {
    return { ok: false, error: result.error };
  }
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await logoutCurrentSession();
  redirect("/login");
}
