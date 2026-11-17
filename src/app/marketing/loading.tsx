export default function MarketingLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-8 space-y-6 animate-pulse">
      <div className="h-8 w-72 rounded-lg bg-white/[0.06]" />
      <div className="h-10 w-96 rounded-lg bg-white/[0.04]" />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 h-[620px] rounded-3xl bg-white/[0.04]" />
        <div className="xl:col-span-5 h-[420px] rounded-2xl bg-white/[0.04]" />
      </div>
    </div>
  );
}
