import { getDb } from "@/lib/db";
import { Appointment, AppointmentStatus, WorkshopBay } from "@/domains/calendar/types";

type Row = Record<string, unknown>;

export async function listBays(organizationId: string): Promise<WorkshopBay[]> {
  const { rows } = await getDb().query<Row>(
    `SELECT b.*, p.name AS technician_name
     FROM bays b LEFT JOIN profiles p ON p.id = b.default_technician_id
     WHERE b.organization_id = $1 ORDER BY b.code`,
    [organizationId]
  );
  return rows.map((r) => ({
    id: String(r.id),
    organizationId: String(r.organization_id),
    name: String(r.name),
    code: String(r.code),
    serviceType: r.service_type as WorkshopBay["serviceType"],
    defaultTechnicianName: (r.technician_name as string) ?? "Sem técnico",
    status: (r.status as WorkshopBay["status"]) ?? "available",
  }));
}

export async function listAppointmentsForWeek(
  organizationId: string,
  reference = new Date()
): Promise<Appointment[]> {
  const ref = new Date(reference);
  const day = ref.getUTCDay();
  const monday = new Date(ref);
  monday.setUTCDate(ref.getUTCDate() - ((day + 6) % 7));
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 7);

  const { rows } = await getDb().query<Row>(
    `SELECT a.*, v.plate_display, v.make || ' ' || v.model AS vehicle_model,
            c.name AS customer_name, b.name AS bay_name, p.name AS technician_name,
            q.quote_number
     FROM appointments a
     JOIN vehicles v ON v.id = a.vehicle_id
     JOIN customers c ON c.id = a.customer_id
     JOIN bays b ON b.id = a.bay_id
     LEFT JOIN profiles p ON p.id = a.technician_id
     LEFT JOIN quotes q ON q.id = a.quote_id
     WHERE a.organization_id = $1 AND a.start_time >= $2 AND a.start_time < $3
     ORDER BY a.start_time`,
    [organizationId, monday.toISOString(), sunday.toISOString()]
  );

  return rows.map((r) => {
    const start = new Date(r.start_time as string);
    const end = new Date(r.end_time as string);
    const date = start.toISOString().slice(0, 10);
    return {
      id: String(r.id),
      organizationId: String(r.organization_id),
      quoteId: r.quote_id ? String(r.quote_id) : undefined,
      quoteNumber: (r.quote_number as string) ?? undefined,
      vehicleId: String(r.vehicle_id),
      vehiclePlate: String(r.plate_display ?? ""),
      vehicleModel: String(r.vehicle_model ?? ""),
      customerId: String(r.customer_id),
      customerName: String(r.customer_name ?? ""),
      bayId: String(r.bay_id),
      bayName: String(r.bay_name ?? ""),
      technicianName: (r.technician_name as string) ?? "Sem técnico",
      serviceTitle: (r.notes as string) || "Serviço agendado",
      startTime: start.toTimeString().slice(0, 5),
      endTime: end.toTimeString().slice(0, 5),
      date,
      estimatedHours: Number(r.estimated_hours ?? 0),
      status: r.status as AppointmentStatus,
      notes: (r.notes as string) ?? undefined,
    };
  });
}
