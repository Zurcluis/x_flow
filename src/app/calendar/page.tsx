import { CalendarEngine } from "@/components/xflow/calendar/CalendarEngine";
import { listBays, listAppointmentsBetween, listTechnicians } from "@/server/calendar";
import { listVehicles } from "@/server/vehicles";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const organizationId = await getPrimaryOrganizationId();

  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 2, 1);

  const [bays, technicians, vehicles, appointments] = await Promise.all([
    listBays(organizationId),
    listTechnicians(organizationId),
    listVehicles(organizationId),
    listAppointmentsBetween(organizationId, rangeStart, rangeEnd),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[#a9adae]">
            Planeamento Operacional & Baias
          </span>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#f1ede5]">
            Agenda & Capacidade da Oficina
          </h1>
        </div>
      </div>

      <CalendarEngine
        initialAppointments={appointments}
        bays={bays}
        technicians={technicians}
        vehicles={vehicles.map((v) => ({
          id: v.id,
          label: `${v.make} ${v.model} (${v.plateDisplay})`,
          customerId: v.currentOwner?.customerId ?? null,
        }))}
      />
    </div>
  );
}
