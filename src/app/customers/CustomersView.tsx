"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Building2, User, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerCard } from "@/components/xflow/customers/CustomerCard";
import {
  CustomerFormModal,
  CustomerSaveResult,
} from "@/components/xflow/customers/CustomerFormModal";
import { createCustomerAction } from "@/app/actions/customers";
import { Customer, CustomerDraft } from "@/domains/crm/types";

interface CustomersViewProps {
  initialCustomers: Customer[];
  showFinancials: boolean;
}

export function CustomersView({ initialCustomers, showFinancials }: CustomersViewProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [lastSynced, setLastSynced] = useState(initialCustomers);
  const [activeTab, setActiveTab] = useState<"all" | "individual" | "business" | "lead">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(
    null
  );

  if (lastSynced !== initialCustomers) {
    setLastSynced(initialCustomers);
    setCustomers(initialCustomers);
  }

  const filteredCustomers = customers.filter((customer) => {
    if (activeTab === "individual" && customer.type !== "individual") return false;
    if (activeTab === "business" && customer.type !== "business") return false;
    if (activeTab === "lead" && customer.status !== "lead") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = customer.name.toLowerCase().includes(q);
      const matchLegal = customer.legalName?.toLowerCase().includes(q);
      const matchNif = customer.nif?.toLowerCase().includes(q);
      const matchEmail = customer.email.toLowerCase().includes(q);
      const matchPhone = customer.phoneNormalized.includes(q) || customer.phone.includes(q);

      return matchName || matchLegal || matchNif || matchEmail || matchPhone;
    }

    return true;
  });

  const handleSaveCustomer = async (
    newCustomerData: CustomerDraft
  ): Promise<CustomerSaveResult> => {
    setFeedback(null);
    const result = await createCustomerAction(newCustomerData);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    setCustomers((prev) => [result.customer, ...prev]);
    setFeedback({
      tone: "success",
      message: `Cliente ${result.customer.name} criado com sucesso.`,
    });
    router.refresh();
    return { ok: true };
  };

  const individualCount = customers.filter((c) => c.type === "individual").length;
  const businessCount = customers.filter((c) => c.type === "business").length;
  const leadCount = customers.filter((c) => c.status === "lead").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[#a9adae]">CRM Automóvel</span>
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Clientes & Empresas
          </h1>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          <span>Novo Cliente</span>
        </Button>
      </div>

      {feedback && (
        <div
          role={feedback.tone === "error" ? "alert" : "status"}
          className={`flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-xs ${
            feedback.tone === "error"
              ? "border-[#f05a50]/30 bg-[#f05a50]/10 text-[#f8a19b]"
              : "border-[#68a46b]/30 bg-[#68a46b]/10 text-[#9ed3a0]"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="cursor-pointer font-bold uppercase tracking-wide opacity-70 hover:opacity-100"
          >
            Fechar
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9092]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome, empresa, telefone, email ou NIF..."
            className="w-full h-10 pl-10 pr-4 rounded-md bg-[#101314] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] placeholder-[#8a9092] transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-md bg-[#101314] border border-white/[0.06] overflow-x-auto select-none">
          <button
            onClick={() => setActiveTab("all")}
            aria-pressed={activeTab === "all"}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "all"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            Todos ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab("individual")}
            aria-pressed={activeTab === "individual"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "individual"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Particulares ({individualCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("business")}
            aria-pressed={activeTab === "business"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "business"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Empresas B2B ({businessCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("lead")}
            aria-pressed={activeTab === "lead"}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "lead"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                : "text-[#a9adae] hover:text-[#f1ede5]"
            }`}
          >
            Leads ({leadCount})
          </button>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-lg bg-[#101314] border border-white/[0.06] text-center">
          <Users className="h-10 w-10 text-[#8a9092] mb-3" />
          <h3 className="text-base font-semibold text-[#f1ede5]">Ainda não há clientes</h3>
          <p className="text-xs text-[#a9adae] mt-1 max-w-sm">
            Cria o primeiro cliente para começares a associar viaturas e histórico de serviço.
          </p>
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)} className="mt-4">
            <UserPlus className="h-4 w-4" />
            <span>Criar Cliente</span>
          </Button>
        </div>
      ) : filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              showFinancials={showFinancials}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-lg bg-[#101314] border border-white/[0.06] text-center">
          <Users className="h-10 w-10 text-[#8a9092] mb-3" />
          <h3 className="text-base font-semibold text-[#f1ede5]">Nenhum cliente encontrado</h3>
          <p className="text-xs text-[#a9adae] mt-1 max-w-sm">
            Não foram encontrados clientes correspondentes aos filtros selecionados. Tenta ajustar o
            termo de pesquisa.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setActiveTab("all");
            }}
            className="mt-4"
          >
            Limpar Filtros
          </Button>
        </div>
      )}

      <CustomerFormModal
        key={isModalOpen ? "customer-open" : "customer-closed"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCustomer}
        existingCustomers={customers}
      />
    </div>
  );
}
