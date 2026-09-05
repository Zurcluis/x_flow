"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceSummaryCard } from "@/components/xflow/invoices/InvoiceSummaryCard";

import { Invoice } from "@/domains/finance/types";

export function InvoiceDetailView({ invoice }: { invoice: Invoice }) {


  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Back button & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#a9adae] hover:text-[#f7d46d] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar à Faturação</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handlePrint} className="bg-[#15191a]">
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir / PDF</span>
          </Button>

          <Link href={`/passport/${invoice.vehiclePlate}`} target="_blank">
            <Button variant="primary" size="sm">
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Passaporte do Veículo</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Invoice Card */}
      <div className="max-w-4xl mx-auto w-full">
        <InvoiceSummaryCard invoice={invoice} />
      </div>
    </div>
  );
}
