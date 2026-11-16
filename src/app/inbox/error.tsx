"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InboxError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f05a50]/30 bg-[#f05a50]/10 text-[#f05a50]">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[#f1ede5]">
          Não foi possível abrir a Caixa Unificada
        </h2>
        <p className="text-sm text-[#a9adae]">
          Ocorreu um erro ao carregar as conversas. Tenta atualizar a página.
        </p>
      </div>
      <Button variant="primary" onClick={reset}>
        <RefreshCw className="h-4 w-4" />
        <span>Tentar novamente</span>
      </Button>
    </div>
  );
}
