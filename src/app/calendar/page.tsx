import { CalendarEngine } from "@/components/xflow/calendar/CalendarEngine";
import { listBays, listAppointmentsBetween, listTechnicians } from "@/server/calendar";
import { listVehicles } from "@/server/vehicles";
import {
  civilDateKey,
  civilToday,
  workshopIsoFromWallTime,
} from "@/domains/calendar/datetime";
import { requireRole } from "@/server/auth";
import { hasRole, MANAGEMENT_ROLES, SCHEDULING_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ nova?: string; vehicleId?: string }>;
}) {
  const auth = await requireRole(SCHEDULING_ROLES);
  const organizationId = auth.organizationId;
  const params = await searchParams;
  const initialCreate =
    params.nova === "1"
      ? { vehicleId: typeof params.vehicleId === "string" ? params.vehicleId : undefined }
      : undefined;

  const today = civilToday();
  const rangeStartDate = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 3, 1, 12)
  );
  const rangeEndDate = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 13, 1, 12)
  );
  const rangeStartIso = workshopIsoFromWallTime(civilDateKey(rangeStartDate), "00:00");
  const rangeEndIso = workshopIsoFromWallTime(civilDateKey(rangeEndDate), "00:00");

  const [bays, technicians, vehicles, appointments] = await Promise.all([
    listBays(organizationId),
    listTechnicians(organizationId),
    listVehicles(organizationId),
    listAppointmentsBetween(
      organizationId,
      rangeStartIso ? new Date(rangeStartIso) : rangeStartDate,
      rangeEndIso ? new Date(rangeEndIso) : rangeEndDate
    ),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[#a9adae]">
            Planeamento Operacional & Baias
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Agenda & Capacidade da Oficina
          </h1>
        </div>
        <p className="text-xs text-[#8a9092] max-w-sm">
          Horários em hora de Lisboa. Arrasta marcações para reorganizar o dia.
        </p>
      </div>

      <CalendarEngine
        initialAppointments={appointments}
        bays={bays}
        technicians={technicians}
        initialCreate={initialCreate}
        canManageBays={hasRole(auth.role, MANAGEMENT_ROLES)}
        vehicles={vehicles.map((v) => ({
          id: v.id,
          label: `${v.make} ${v.model} (${v.plateDisplay})`,
          customerId: v.currentOwner?.customerId ?? null,
        }))}
      />
    </div>
  );
}
