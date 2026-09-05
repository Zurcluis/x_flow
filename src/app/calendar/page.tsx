import { CalendarView } from "./CalendarView";
import { listAppointmentsForWeek, listBays } from "@/server/calendar";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default async function CalendarPage() {
  const organizationId = await getPrimaryOrganizationId();
  const [bays, appointments] = await Promise.all([
    listBays(organizationId),
    listAppointmentsForWeek(organizationId),
  ]);

  const now = new Date();
  const selectedDate = now.toISOString().slice(0, 10);
  const dayLabel = `${WEEKDAYS[now.getDay()]}, ${now.getDate()} de ${MONTHS[now.getMonth()]} de ${now.getFullYear()}`;

  return (
    <CalendarView
      bays={bays}
      appointments={appointments}
      selectedDate={selectedDate}
      dayLabel={dayLabel}
    />
  );
}
