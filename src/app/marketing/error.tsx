"use client";

import Link from "next/link";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-4">
      <h2 className="text-xl font-bold text-[#f1ede5]">
        Não foi possível carregar o módulo de Marketing
      </h2>
      <p className="text-sm text-[#a9adae]">{error.message}</p>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-[#d3a548] px-4 py-2 text-xs font-semibold text-[#050606] cursor-pointer"
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="rounded-lg border border-white/[0.12] px-4 py-2 text-xs font-medium text-[#f1ede5]"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
