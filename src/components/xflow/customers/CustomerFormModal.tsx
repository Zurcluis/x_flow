"use client";

import React, { useState } from "react";
import { X, Building2, User, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DuplicateWarningAlert } from "./DuplicateWarningAlert";
import { Customer, CustomerDraft, CustomerType, PreferredChannel } from "@/domains/crm/types";
import { detectDuplicateCustomer, DuplicateMatch } from "@/domains/crm/duplicate-detector";

export type CustomerSaveResult = { ok: true } | { ok: false; error: string };

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: CustomerDraft) => Promise<CustomerSaveResult>;
  existingCustomers: Customer[];
  initialData?: Customer;
}

export function CustomerFormModal({
  isOpen,
  onClose,
  onSave,
  existingCustomers,
  initialData,
}: CustomerFormModalProps) {
  const [type, setType] = useState<CustomerType>(initialData?.type || "individual");
  const [name, setName] = useState(initialData?.name || "");
  const [legalName, setLegalName] = useState(initialData?.legalName || "");
  const [nif, setNif] = useState(initialData?.nif || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [preferredChannel, setPreferredChannel] = useState<PreferredChannel>(
    initialData?.preferredChannel || "whatsapp"
  );
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [discountRate, setDiscountRate] = useState(
    initialData?.b2bDetails?.discountRate?.toString() || "10"
  );
  const [paymentTerms, setPaymentTerms] = useState(
    initialData?.b2bDetails?.paymentTermsDays?.toString() || "30"
  );

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const duplicateMatches: DuplicateMatch[] = detectDuplicateCustomer(
    { email, phone, nif, excludeId: initialData?.id },
    existingCustomers
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    if (!name.trim()) {
      setError("O nome do cliente é obrigatório.");
      return;
    }
    if (!phone.trim() && !email.trim()) {
      setError("Introduz pelo menos um contacto (telefone ou email).");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const result = await onSave({
        type,
        name: name.trim(),
        legalName: type === "business" ? legalName.trim() || undefined : undefined,
        nif: nif.trim() || undefined,
        email: email.trim(),
        phone: phone.trim(),
        phoneNormalized: phone.replace(/\D/g, ""),
        preferredChannel,
        notes: notes.trim() || undefined,
        status: initialData?.status || "active",
        b2bDetails:
          type === "business"
            ? {
                discountRate: Number(discountRate) || 0,
                paymentTermsDays: Number(paymentTerms) || 30,
                priorityLevel: "standard",
              }
            : undefined,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    } catch {
      setError("Não foi possível guardar o cliente. Tenta novamente.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050606]/85 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-xl rounded-[18px] bg-[#101314] border border-white/[0.12] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.6)] text-[#f1ede5] my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <h2 id="modal-title" className="text-lg font-bold text-[#f1ede5]">
            {initialData ? "Editar Cliente" : "Novo Cliente"}
          </h2>
          <button
            onClick={onClose}
            disabled={pending}
            className="p-1.5 rounded-lg text-[#8a9092] hover:text-[#f1ede5] hover:bg-white/[0.05] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-5">
          <div className="flex rounded-sm p-1 bg-[#080a0b] border border-white/[0.06]">
            <button
              type="button"
              onClick={() => setType("individual")}
              aria-pressed={type === "individual"}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-sm text-xs font-semibold transition-all cursor-pointer ${
                type === "individual"
                  ? "bg-[#1b2021] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                  : "text-[#a9adae] hover:text-[#f1ede5]"
              }`}
            >
              <User className="h-4 w-4" />
              <span>Cliente Particular</span>
            </button>
            <button
              type="button"
              onClick={() => setType("business")}
              aria-pressed={type === "business"}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-sm text-xs font-semibold transition-all cursor-pointer ${
                type === "business"
                  ? "bg-[#1b2021] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                  : "text-[#a9adae] hover:text-[#f1ede5]"
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Empresa / B2B</span>
            </button>
          </div>

          <DuplicateWarningAlert matches={duplicateMatches} />

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 p-3 rounded-sm bg-[#f05a50]/15 border border-[#f05a50]/30 text-xs text-[#f05a50]"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-[#a9adae]">
                {type === "business" ? "Nome Comercial *" : "Nome Completo *"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === "business" ? "ex: AutoStand Prime" : "ex: Bernardo Silva"}
                className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] placeholder-[#8a9092]"
                required
              />
            </div>

            {type === "business" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#a9adae]">Razão Social</label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="ex: Prime Automotive Lda"
                    className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#a9adae]">NIF / NIPC</label>
                  <input
                    type="text"
                    value={nif}
                    onChange={(e) => setNif(e.target.value)}
                    placeholder="ex: 509123456"
                    className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5]"
                  />
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">Telefone / Telemóvel</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ex: 912 345 678"
                className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#a9adae]">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex: cliente@email.pt"
                className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#a9adae]">Canal de Contacto Preferido</label>
            <div className="flex gap-4 text-xs text-[#f1ede5]">
              {(["whatsapp", "phone", "email"] as PreferredChannel[]).map((ch) => (
                <label key={ch} className="flex items-center gap-2 cursor-pointer capitalize">
                  <input
                    type="radio"
                    name="preferredChannel"
                    value={ch}
                    checked={preferredChannel === ch}
                    onChange={() => setPreferredChannel(ch)}
                    className="accent-[#d3a548]"
                  />
                  <span>{ch === "phone" ? "Chamada" : ch}</span>
                </label>
              ))}
            </div>
          </div>

          {type === "business" && (
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-md bg-[#080a0b] border border-white/[0.06]">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#d3a548]">Desconto Acordado (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(e.target.value)}
                  className="h-9 px-3 rounded-sm bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#d3a548]">Prazo de Pagamento (Dias)</label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="h-9 px-3 rounded-sm bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5]"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#a9adae]">Notas Internas</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruções especiais, preferências de serviço ou histórico..."
              className="p-3 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <Button variant="ghost" type="button" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={pending}>
              <Check className="h-4 w-4" />
              <span>{pending ? "A guardar..." : initialData ? "Atualizar Cliente" : "Criar Cliente"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
