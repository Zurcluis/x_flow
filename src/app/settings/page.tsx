import { requireAuth } from "@/server/auth";
import { SettingsView } from "./SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAuth();

  return <SettingsView />;
}
