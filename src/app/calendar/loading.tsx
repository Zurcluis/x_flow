import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 pb-4 border-b border-white/[0.04]">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-72" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <Skeleton className="h-10 w-full max-w-2xl" />
      <Skeleton className="h-[520px] w-full" />
    </div>
  );
}
