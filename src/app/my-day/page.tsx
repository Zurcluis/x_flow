import { MyDayView } from "./MyDayView";
import { getMyDayData } from "@/server/myday";

export const dynamic = "force-dynamic";

// MVP interno: técnico autenticado será resolvido por auth numa fase posterior
const CURRENT_TECHNICIAN = "João Martins";

export default async function MyDayPage() {
  const data = await getMyDayData(CURRENT_TECHNICIAN);

  return <MyDayView data={data} />;
}
