import { redirect } from "next/navigation";
import { getOptionalAuth } from "@/server/auth";
import { LoginView } from "@/components/xflow/auth/LoginView";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const auth = await getOptionalAuth();
  if (auth) {
    redirect("/");
  }
  const { next } = await searchParams;
  return <LoginView next={next} />;
}
