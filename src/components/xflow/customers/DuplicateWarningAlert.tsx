import React from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { DuplicateMatch } from "@/domains/crm/duplicate-detector";

interface DuplicateWarningAlertProps {
  matches: DuplicateMatch[];
}

export function DuplicateWarningAlert({ matches }: DuplicateWarningAlertProps) {
  if (!matches || matches.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-md bg-[#3a2512]/80 border border-[#d3a548]/50 text-[#f7d46d] text-xs">
      <div className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4 text-[#d3a548] shrink-0" />
        <span>Atenção: Foram encontrados possíveis duplicados registados</span>
      </div>

      <div className="flex flex-col gap-1.5 pl-6">
        {matches.map((match, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-[#f1ede5]">
              {match.customer.name} — ({match.matchedField}: {match.matchedValue})
            </span>
            <Link
              href={`/customers/${match.customer.id}`}
              target="_blank"
              className="inline-flex items-center gap-1 font-semibold text-[#d3a548] hover:underline"
            >
              <span>Ver ficha</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        ))}
      </div>
      <p className="text-[12px] text-[#a9adae] pl-6">
        Podes continuar a gravação se se tratar de um registo legítimo (ex: mesmo contacto empresarial para departamentos diferentes).
      </p>
    </div>
  );
}
