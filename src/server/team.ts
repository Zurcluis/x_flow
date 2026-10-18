import { getDb } from "@/lib/db";
import { TeamMember, WorkshopTool } from "@/lib/demo-data/tools-team-data";
import {
  parseTeamMemberInput,
  parseTeamMemberStatus,
  parseToolStatus,
} from "@/domains/identity/team";

type Row = Record<string, unknown>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertUuid(value: string, label: string): void {
  if (typeof value !== "string" || !UUID_RE.test(value)) {
    throw new Error(`${label} inválido.`);
  }
}

export async function listTeam(organizationId: string): Promise<TeamMember[]> {
  assertUuid(organizationId, "Organização");
  const { rows } = await getDb().query<Row>(
    `SELECT e.*,
            (SELECT count(*)::int FROM work_orders w
              WHERE w.organization_id = e.organization_id
                AND w.primary_technician_id = e.profile_id
                AND w.status = 'completed') AS completed_jobs,
            (SELECT w.work_order_number || ' - ' || w.service_title FROM work_orders w
              WHERE w.organization_id = e.organization_id
                AND w.primary_technician_id = e.profile_id
                AND w.status = 'in_progress'
              ORDER BY w.started_at DESC NULLS LAST
              LIMIT 1) AS active_wo,
            (SELECT v.make || ' ' || v.model FROM work_orders w
              JOIN vehicles v ON v.id = w.vehicle_id AND v.organization_id = w.organization_id
              WHERE w.organization_id = e.organization_id
                AND w.primary_technician_id = e.profile_id
                AND w.status = 'in_progress'
              ORDER BY w.started_at DESC NULLS LAST
              LIMIT 1) AS active_vehicle
     FROM employees e
     WHERE e.organization_id = $1
     ORDER BY e.level, e.name`,
    [organizationId]
  );
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    role: String(r.role),
    specialty: String(r.specialty),
    level: String(r.level) as TeamMember["level"],
    status: String(r.status) as TeamMember["status"],
    email: (r.email as string) ?? undefined,
    phone: (r.phone as string) ?? undefined,
    activeWorkOrder: (r.active_wo as string) ?? undefined,
    activeVehicle: (r.active_vehicle as string) ?? undefined,
    completedJobsCount: Number(r.completed_jobs ?? 0),
    efficiencyRating: "—",
    certifications: Array.isArray(r.certifications) ? (r.certifications as string[]) : [],
  }));
}

export async function listTools(organizationId: string): Promise<WorkshopTool[]> {
  assertUuid(organizationId, "Organização");
  const { rows } = await getDb().query<Row>(
    `SELECT t.*,
            to_char(t.last_maintenance, 'YYYY-MM-DD') AS last_maintenance_key,
            to_char(t.next_maintenance, 'YYYY-MM-DD') AS next_maintenance_key
     FROM tools t
     WHERE t.organization_id = $1
     ORDER BY t.name`,
    [organizationId]
  );
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    category: String(r.category) as WorkshopTool["category"],
    brand: String(r.brand),
    model: String(r.model),
    serialNumber: String(r.serial_number),
    qrCode: String(r.qr_code),
    status: String(r.status) as WorkshopTool["status"],
    assignedTo: (r.assigned_to_name as string) ?? undefined,
    location: String(r.location),
    lastMaintenance: String(r.last_maintenance_key ?? ""),
    nextMaintenance: String(r.next_maintenance_key ?? ""),
  }));
}

export async function setToolStatus(
  organizationId: string,
  toolId: string,
  status: WorkshopTool["status"]
): Promise<void> {
  assertUuid(organizationId, "Organização");
  assertUuid(toolId, "Ferramenta");
  const parsedStatus = parseToolStatus(status);
  await getDb().query(
    `UPDATE tools
     SET status = $3,
         assigned_to_name = CASE WHEN $3 = 'disponivel' THEN NULL ELSE assigned_to_name END
     WHERE id = $1 AND organization_id = $2`,
    [toolId, organizationId, parsedStatus]
  );
}

export interface TeamMemberCreateInput {
  name: string;
  role: string;
  specialty: string;
  level: TeamMember["level"];
  status?: TeamMember["status"];
  email?: string;
  phone?: string;
  certifications?: string[];
}

export async function createTeamMember(
  organizationId: string,
  input: TeamMemberCreateInput
): Promise<TeamMember> {
  assertUuid(organizationId, "Organização");
  const parsed = parseTeamMemberInput(input);

  const { rows } = await getDb().query<Row>(
    `INSERT INTO employees (organization_id, name, role, specialty, level, status, certifications, email, phone)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9)
     RETURNING *`,
    [
      organizationId,
      parsed.name,
      parsed.role,
      parsed.specialty,
      parsed.level,
      parsed.status,
      JSON.stringify(parsed.certifications),
      parsed.email ?? null,
      parsed.phone ?? null,
    ]
  );
  const r = rows[0];
  return {
    id: String(r.id),
    name: String(r.name),
    role: String(r.role),
    specialty: String(r.specialty),
    level: String(r.level) as TeamMember["level"],
    status: String(r.status) as TeamMember["status"],
    email: (r.email as string) ?? undefined,
    phone: (r.phone as string) ?? undefined,
    completedJobsCount: 0,
    efficiencyRating: "—",
    certifications: Array.isArray(r.certifications) ? (r.certifications as string[]) : [],
  };
}

export async function setTeamMemberStatus(
  organizationId: string,
  memberId: string,
  status: TeamMember["status"]
): Promise<void> {
  assertUuid(organizationId, "Organização");
  assertUuid(memberId, "Colaborador");
  const parsedStatus = parseTeamMemberStatus(status);
  await getDb().query(
    `UPDATE employees SET status = $3 WHERE id = $1 AND organization_id = $2`,
    [memberId, organizationId, parsedStatus]
  );
}
