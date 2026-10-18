"use server";

import { redirect } from "next/navigation";
import {
  changeOwnPassword,
  loginAndCreateSession,
  logoutCurrentSession,
} from "@/server/auth";

export async function loginAction(
  input: { email: string; password: string }
): Promise<{ ok: true; mustChangePassword: boolean } | { ok: false; error: string }> {
  const result = await loginAndCreateSession(input.email, input.password);
  if ("error" in result) {
    return { ok: false, error: result.error };
  }
  return { ok: true, mustChangePassword: result.mustChangePassword };
}

export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return changeOwnPassword(input.currentPassword, input.newPassword, input.confirmPassword);
}

export async function logoutAction(): Promise<void> {
  await logoutCurrentSession();
  redirect("/login");
}
