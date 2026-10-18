"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CalendarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-lg border border-white/[0.08] bg-[#101314] p-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f05a50]/15 text-[#f05a50]">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-[#f1ede5]">Não foi possível carregar a agenda</h2>
        <p className="max-w-md text-sm text-[#a9adae]">
          Ocorreu um erro inesperado ao ler as marcações da oficina.
        </p>
        {error.digest && (
          <p className="text-xs text-[#8a9092]">Referência: {error.digest}</p>
        )}
      </div>
      <Button variant="primary" size="sm" onClick={reset}>
        <RotateCcw className="h-3.5 w-3.5" />
        <span>Tentar novamente</span>
      </Button>
    </div>
  );
}
