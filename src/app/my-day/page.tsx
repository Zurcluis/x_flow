import { MyDayView } from "./MyDayView";
import { getMyDayData } from "@/server/myday";
import { requireAuth } from "@/server/auth";

export const dynamic = "force-dynamic";

// MVP interno: técnico autenticado será resolvido por auth numa fase posterior
const CURRENT_TECHNICIAN = "João Martins";

export default async function MyDayPage() {
  await requireAuth();
  const data = await getMyDayData(CURRENT_TECHNICIAN);

  return <MyDayView data={data} />;
}
