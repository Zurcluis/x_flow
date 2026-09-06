import React from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  Car,
  Building2,
  User,
  ArrowRight,
  Percent,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Customer } from "@/domains/crm/types";
import { formatCurrency } from "@/lib/formatting";

interface CustomerCardProps {
  customer: Customer;
}

export function CustomerCard({ customer }: CustomerCardProps) {
  const isBusiness = customer.type === "business";

  return (
    <Card className="flex flex-col justify-between p-5 bg-[#101314] border border-white/[0.08] hover:border-white/20 transition-all duration-150 group">
      <div>
        {/* Header: Type icon, Name & Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-white/[0.04] border border-white/[0.08] text-[#d3a548]">
              {isBusiness ? (
                <Building2 className="h-5 w-5 stroke-[1.75]" />
              ) : (
                <User className="h-5 w-5 stroke-[1.75]" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <Link
                href={`/customers/${customer.id}`}
                className="font-semibold text-base text-[#f1ede5] hover:text-[#f7d46d] transition-colors truncate"
              >
                {customer.name}
              </Link>
              {customer.legalName && (
                <span className="text-xs text-[#8a9092] truncate">
                  {customer.legalName} {customer.nif ? `· NIF ${customer.nif}` : ""}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant={isBusiness ? "gold" : "outline"} className="text-[11px] uppercase tracking-wider">
              {isBusiness ? "B2B" : "Particular"}
            </Badge>
            {customer.status === "lead" && (
              <Badge variant="in_progress" className="text-[11px]">
                Lead
              </Badge>
            )}
          </div>
        </div>

        {/* Contact info */}
        <div className="flex flex-col gap-1.5 mt-4 pt-3 border-t border-white/[0.04] text-xs text-[#a9adae]">
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-[#8a9092] shrink-0" />
            <a
              href={`tel:${customer.phoneNormalized}`}
              className="hover:text-[#f1ede5] transition-colors"
            >
              {customer.phone}
            </a>
            {customer.preferredChannel === "whatsapp" && (
              <span className="text-[11px] text-[#68a46b] bg-[#68a46b]/10 px-1.5 py-0.2 rounded font-medium">
                WhatsApp
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-[#8a9092] shrink-0" />
            <a
              href={`mailto:${customer.email}`}
              className="hover:text-[#f1ede5] transition-colors truncate"
            >
              {customer.email}
            </a>
          </div>
        </div>

        {/* B2B perks if applicable */}
        {customer.b2bDetails && (
          <div className="flex items-center gap-2 mt-3 p-2 rounded-sm bg-[#15191a] border border-white/[0.04] text-xs text-[#f7d46d]">
            <Percent className="h-3.5 w-3.5 text-[#d3a548]" />
            <span className="text-[12px] font-medium">
              Desconto acordado: <strong>{customer.b2bDetails.discountRate}%</strong> ({customer.b2bDetails.paymentTermsDays} dias)
            </span>
          </div>
        )}

        {/* Notes preview */}
        {customer.notes && (
          <p className="text-xs text-[#8a9092] mt-3 line-clamp-2 italic">
            &ldquo;{customer.notes}&rdquo;
          </p>
        )}
      </div>

      {/* Footer: Vehicles count, Total spent & Link */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/[0.04] text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-[#f1ede5]">
            <Car className="h-4 w-4 text-[#d3a548]" />
            <span>{customer.vehicleCount ?? 0} {customer.vehicleCount === 1 ? "Viatura" : "Viaturas"}</span>
          </div>
          {customer.totalSpent !== undefined && customer.totalSpent > 0 && (
            <span className="text-[#8a9092] tabular-nums">
              · {formatCurrency(customer.totalSpent)}
            </span>
          )}
        </div>

        <Link
          href={`/customers/${customer.id}`}
          className="inline-flex items-center gap-1 font-semibold text-[#d3a548] hover:text-[#f7d46d] transition-colors group-hover:translate-x-0.5"
        >
          <span>Abrir</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}
