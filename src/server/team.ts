import { getDb } from "@/lib/db";
import { getPrimaryOrganizationId } from "@/server/org";
import { TeamMember, WorkshopTool } from "@/lib/demo-data/tools-team-data";





export async function listTeam(organizationId: string): Promise<TeamMember[]> {
  const { rows } = await getDb().query<Record<string, unknown>>(
    `SELECT e.*,
            (SELECT count(*)::int FROM work_orders w
              WHERE w.primary_technician_id = e.profile_id AND w.status = 'completed') AS completed_jobs,
            (SELECT w.work_order_number || ' — ' || w.service_title FROM work_orders w
              WHERE w.primary_technician_id = e.profile_id AND w.status = 'in_progress' LIMIT 1) AS active_wo
     FROM employees e WHERE e.organization_id = $1 ORDER BY e.level, e.name`,
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
    completedJobsCount: Number(r.completed_jobs ?? 0),
    efficiencyRating: "—",
    certifications: Array.isArray(r.certifications) ? (r.certifications as string[]) : [],
  }));
}

export async function listTools(organizationId: string): Promise<WorkshopTool[]> {
  const { rows } = await getDb().query<Record<string, unknown>>(
    `SELECT * FROM tools WHERE organization_id = $1 ORDER BY name`,
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
    lastMaintenance: String(r.last_maintenance ?? "").slice(0, 10),
    nextMaintenance: String(r.next_maintenance ?? "").slice(0, 10),
  }));
}

export interface TeamMemberCreateInput {
  name: string;
  role: string;
  specialty: string;
  level: "Master" | "Sénior" | "Especialista" | "Assistente";
  status?: TeamMember["status"];
  email?: string;
  phone?: string;
  certifications?: string[];
}

export async function createTeamMember(
  organizationId: string,
  input: TeamMemberCreateInput
): Promise<TeamMember> {
  const { rows } = await getDb().query<Record<string, unknown>>(
    `INSERT INTO employees (organization_id, name, role, specialty, level, status, certifications, email, phone)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      organizationId,
      input.name,
      input.role,
      input.specialty,
      input.level,
      input.status ?? "disponivel",
      JSON.stringify(input.certifications ?? []),
      input.email ?? null,
      input.phone ?? null,
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
  await getDb().query(
    `UPDATE employees SET status = $3 WHERE id = $1 AND organization_id = $2`,
    [memberId, organizationId, status]
  );
}

export { getPrimaryOrganizationId };
