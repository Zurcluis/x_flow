import { notFound } from "next/navigation";
import { canSeeFinancials, requireAuth } from "@/server/auth";
import { getPassportByPlate } from "@/server/finance";
import { isValidPlate } from "@/domains/vehicles/plate-normalizer";
import { VehiclePassportStandaloneView } from "./VehiclePassportStandaloneView";

export const dynamic = "force-dynamic";

function formatEventDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Lisbon",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export default async function VehiclePassportPage({
  params,
}: {
  params: Promise<{ plate: string }>;
}) {
  const auth = await requireAuth();
  const { plate } = await params;

  if (!isValidPlate(plate)) {
    notFound();
  }

  const passport = await getPassportByPlate(auth.organizationId, plate);
  if (!passport) {
    notFound();
  }

  const canSeeMoney = canSeeFinancials(auth.role);
  const visibleEvents = canSeeMoney
    ? passport.events
    : passport.events.filter((event) => event.type !== "invoice");

  const events = [...visibleEvents]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((event) => ({ ...event, date: formatEventDate(event.date) }));

  return <VehiclePassportStandaloneView passport={{ ...passport, events }} />;
}
