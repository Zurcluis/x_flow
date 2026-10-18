import { redirect } from "next/navigation";
import { getOptionalAuth } from "@/server/auth";
import { ChangePasswordView } from "./ChangePasswordView";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const auth = await getOptionalAuth();
  if (!auth) {
    redirect("/login");
  }

  return <ChangePasswordView mustChangePassword={auth.mustChangePassword} />;
}
