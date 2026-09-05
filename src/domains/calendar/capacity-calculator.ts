import { Appointment } from "./types";

export interface CapacityMetrics {
  totalCapacityHours: number;
  allocatedHours: number;
  remainingHours: number;
  occupancyPercentage: number;
  isOverCapacity: boolean;
}

export function calculateWeeklyCapacity(
  appointments: Appointment[],
  totalTechnicians: number = 4,
  hoursPerTechnician: number = 40
): CapacityMetrics {
  const totalCapacityHours = totalTechnicians * hoursPerTechnician; // ex: 160h

  const allocatedHours = appointments
    .filter((app) => app.status !== "cancelled" && app.status !== "no_show")
    .reduce((acc, app) => acc + app.estimatedHours, 0);

  const roundedAllocated = Math.round(allocatedHours * 10) / 10;
  const remainingHours = Math.max(0, Math.round((totalCapacityHours - roundedAllocated) * 10) / 10);
  const occupancyPercentage = Math.min(
    100,
    Math.round((roundedAllocated / totalCapacityHours) * 100)
  );

  return {
    totalCapacityHours,
    allocatedHours: roundedAllocated,
    remainingHours,
    occupancyPercentage,
    isOverCapacity: roundedAllocated > totalCapacityHours,
  };
}
