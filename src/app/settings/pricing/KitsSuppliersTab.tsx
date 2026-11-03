"use client";

import React, { useMemo, useState } from "react";
import { Check, Pencil, Plus, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  ConsumableKit,
  ConsumableKitKind,
  SupplierService,
} from "@/domains/pricing/types";
import type { SupplierRecord } from "@/server/pricing";
import type {
  SaveKitInput,
  SaveSupplierInput,
  SaveSupplierServiceInput,
} from "@/app/actions/pricing";
import { formatCurrency } from "@/lib/formatting";
import {
  CheckboxRow,
  FeedbackBanner,
  Field,
  ModalShell,
  NumberInput,
  SelectInput,
  TextInput,
} from "./controls";

const KIT_KIND_LABELS: Record<ConsumableKitKind, string> = {
  spot: "Pontual",
  ppf_front: "PPF frente",
  wrap_full: "Wrap integral",
  custom: "Personalizado",
};

const KIT_KIND_VARIANTS: Record<ConsumableKitKind, "in_progress" | "gold" | "default" | "outline"> = {
  spot: "in_progress",
  ppf_front: "gold",
  wrap_full: "outline",
  custom: "default",
};

type SaveWithIdResult = {
  ok: true;
  id: string;
} | {
  ok: false;
  error: string;
};

export function KitsSuppliersTab({
  kits,
  supplierServices,
  suppliers: suppliersProp,
  saveKit,
  saveSupplier,
  saveSupplierService,
}: {
  kits: ConsumableKit[];
  supplierServices: SupplierService[];
  suppliers?: SupplierRecord[];
  saveKit: (input: SaveKitInput) => Promise<SaveWithIdResult>;
  saveSupplier: (input: SaveSupplierInput) => Promise<SaveWithIdResult>;
  saveSupplierService: (
    input: SaveSupplierServiceInput,
    supplierName: string
  ) => Promise<SaveWithIdResult>;
}) {
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const [kitModalOpen, setKitModalOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<ConsumableKit | null>(null);

  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierRecord | null>(
    null
  );

  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<SupplierService | null>(
    null
  );

  const [savedSuppliers, setSavedSuppliers] = useState<SupplierRecord[]>([]);

  const suppliers = useMemo(() => {
    const embedded =
      suppliersProp ??
      (kits[0] as (ConsumableKit & { _suppliers?: SupplierRecord[] }) | undefined)
        ?._suppliers ??
      (
        supplierServices[0] as
          | (SupplierService & { _suppliers?: SupplierRecord[] })
          | undefined
      )?._suppliers ??
      [];

    const map = new Map<string, SupplierRecord>();
    for (const s of embedded) {
      map.set(s.id, s);
    }
    for (const service of supplierServices) {
      if (!map.has(service.supplierId)) {
        map.set(service.supplierId, {
          id: service.supplierId,
          name: service.supplierName,
          phone: null,
          email: null,
          notes: null,
        });
      }
    }
    for (const saved of savedSuppliers) {
      map.set(saved.id, saved);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-PT")
    );
  }, [suppliersProp, kits, supplierServices, savedSuppliers]);

  const supplierGroups = useMemo(() => {
    const servicesBySupplier = new Map<string, SupplierService[]>();
    for (const service of supplierServices) {
      const list = servicesBySupplier.get(service.supplierId);
      if (list) {
        list.push(service);
      } else {
        servicesBySupplier.set(service.supplierId, [service]);
      }
    }
    return suppliers.map((supplier) => ({
      supplier,
      services: servicesBySupplier.get(supplier.id) ?? [],
    }));
  }, [suppliers, supplierServices]);

  return (
    <div className="flex flex-col gap-4">
      {feedback && (
        <FeedbackBanner
          tone={feedback.tone}
          text={feedback.text}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Kits */}
        <Card className="bg-[#101314] border border-white/[0.06] flex flex-col">
          <div className="flex items-center justify-between gap-3 p-5 pb-4 border-b border-white/[0.06]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d3a548]">
              Kits de consumíveis
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditingKit(null);
                setKitModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              <span>Novo kit</span>
            </Button>
          </div>

          {kits.length === 0 ? (
            <div className="p-8 flex flex-col items-center gap-2 text-center">
              <span className="text-sm font-semibold text-[#f1ede5]">
                Sem kits registados
              </span>
              <span className="text-xs text-[#8a9092] max-w-xs">
                Cria kits de consumíveis para usar nas linhas de custo dos
                orçamentos.
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/[0.08] text-[12px] uppercase tracking-wider text-[#8a9092]">
                  <tr>
                    <th className="pb-3 pt-4 px-5 font-semibold">Kit</th>
                    <th className="pb-3 pt-4 px-3 font-semibold">Tipo</th>
                    <th className="pb-3 pt-4 px-3 font-semibold text-right">
                      Preço
                    </th>
                    <th className="pb-3 pt-4 px-3 font-semibold text-center">
                      Estado
                    </th>
                    <th className="pb-3 pt-4 px-5 font-semibold text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {kits.map((kit) => (
                    <tr
                      key={kit.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-5 font-bold text-[#f1ede5]">
                        {kit.name}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={KIT_KIND_VARIANTS[kit.kind]}
                          className="text-[11px] px-2 py-0.5 whitespace-nowrap"
                        >
                          {KIT_KIND_LABELS[kit.kind]}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#f7d46d] whitespace-nowrap">
                        {formatCurrency(kit.price)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant={kit.active ? "success" : "default"}
                          className="text-[11px] px-2 py-0.5"
                        >
                          {kit.active ? "Ativa" : "Inativa"}
                        </Badge>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingKit(kit);
                            setKitModalOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Fornecedores */}
        <Card className="bg-[#101314] border border-white/[0.06] flex flex-col">
          <div className="flex items-center justify-between gap-3 p-5 pb-4 border-b border-white/[0.06]">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#d3a548]">
              <Truck className="h-4 w-4" />
              Fornecedores e serviços
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditingSupplier(null);
                  setSupplierModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                <span>Novo fornecedor</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditingService(null);
                  setServiceModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                <span>Novo serviço</span>
              </Button>
            </div>
          </div>

          {supplierGroups.length === 0 ? (
            <div className="p-8 flex flex-col items-center gap-2 text-center">
              <span className="text-sm font-semibold text-[#f1ede5]">
                Sem fornecedores registados
              </span>
              <span className="text-xs text-[#8a9092] max-w-xs">
                Regista fornecedores e os serviços que substituem fases
                internas (ex.: desmontagem) para usar em subcontratações.
              </span>
            </div>
          ) : (
            <div className="p-5 flex flex-col gap-4">
              {supplierGroups.map(({ supplier, services }) => (
                <div
                  key={supplier.id}
                  className="flex flex-col gap-2.5 p-4 rounded-lg bg-[#15191a] border border-white/[0.06]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-bold text-[#f1ede5]">
                        {supplier.name}
                      </span>
                      {(supplier.phone || supplier.email) && (
                        <span className="text-[11px] text-[#a9adae]">
                          {[supplier.phone, supplier.email]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                      {supplier.notes && (
                        <span className="text-[11px] text-[#8a9092]">
                          {supplier.notes}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingSupplier(supplier);
                        setSupplierModalOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Editar fornecedor</span>
                    </Button>
                  </div>
                  {services.length === 0 ? (
                    <span className="text-[11px] text-[#8a9092]">
                      Sem serviços subcontratados associados.
                    </span>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {services.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-sm bg-[#080a0b] border border-white/[0.04]"
                        >
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-xs font-semibold text-[#f1ede5] truncate">
                              {service.serviceName}
                            </span>
                            <span className="text-[11px] text-[#8a9092]">
                              Fase substituída:{" "}
                              {service.replacedPhaseKey
                                ? service.replacedPhaseKey
                                : "—"}
                              {service.phaseHours
                                ? ` · ${service.phaseHours} h`
                                : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-mono font-bold text-[#f7d46d] whitespace-nowrap">
                              {formatCurrency(service.basePrice)}
                            </span>
                            <Badge
                              variant={service.active ? "success" : "default"}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {service.active ? "Ativo" : "Inativo"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-2"
                              onClick={() => {
                                setEditingService(service);
                                setServiceModalOpen(true);
                              }}
                              aria-label={`Editar serviço ${service.serviceName}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {kitModalOpen && (
        <KitFormModal
          key={editingKit?.id ?? "new-kit"}
          initial={editingKit}
          onSubmit={async (input) => {
            const result = await saveKit(input);
            if (result.ok) {
              setKitModalOpen(false);
              setEditingKit(null);
              setFeedback({
                tone: "success",
                text: input.id
                  ? "Kit atualizado."
                  : "Kit criado.",
              });
            } else {
              setFeedback({ tone: "error", text: result.error });
            }
            return result;
          }}
          onClose={() => {
            setKitModalOpen(false);
            setEditingKit(null);
          }}
        />
      )}

      {supplierModalOpen && (
        <SupplierFormModal
          key={editingSupplier?.id ?? "new-supplier"}
          initial={editingSupplier}
          onSubmit={async (input) => {
            const result = await saveSupplier(input);
            if (result.ok) {
              setSupplierModalOpen(false);
              setEditingSupplier(null);
              setSavedSuppliers((prev) => {
                const updated: SupplierRecord = {
                  id: result.id,
                  name: input.name,
                  phone: input.phone ?? null,
                  email: input.email ?? null,
                  notes: input.notes ?? null,
                };
                const filtered = prev.filter((item) => item.id !== result.id);
                return [...filtered, updated];
              });
              setFeedback({
                tone: "success",
                text: input.id
                  ? "Fornecedor atualizado."
                  : "Fornecedor criado.",
              });
            } else {
              setFeedback({ tone: "error", text: result.error });
            }
            return result;
          }}
          onClose={() => {
            setSupplierModalOpen(false);
            setEditingSupplier(null);
          }}
        />
      )}

      {serviceModalOpen && (
        <SupplierServiceFormModal
          key={editingService?.id ?? "new-service"}
          initial={editingService}
          suppliers={suppliers}
          onSubmit={async (input, supplierName) => {
            const result = await saveSupplierService(input, supplierName);
            if (result.ok) {
              setServiceModalOpen(false);
              setEditingService(null);
              setFeedback({
                tone: "success",
                text: input.id
                  ? "Serviço de fornecedor atualizado."
                  : "Serviço de fornecedor criado.",
              });
            } else {
              setFeedback({ tone: "error", text: result.error });
            }
            return result;
          }}
          onClose={() => {
            setServiceModalOpen(false);
            setEditingService(null);
          }}
        />
      )}
    </div>
  );
}

function KitFormModal({
  initial,
  onSubmit,
  onClose,
}: {
  initial: ConsumableKit | null;
  onSubmit: (input: SaveKitInput) => Promise<SaveWithIdResult>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<ConsumableKitKind>(
    initial?.kind ?? "custom"
  );
  const [price, setPrice] = useState<number>(initial?.price ?? 0);
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Indica o nome do kit.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("O preço tem de ser igual ou superior a zero.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await onSubmit({
      id: initial?.id,
      name: name.trim(),
      kind,
      price,
      active,
    });
    setSaving(false);
    if (!result.ok) setError(result.error);
  };

  return (
    <ModalShell
      title={initial ? "Editar kit" : "Novo kit"}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 mt-5">
        <Field label="Nome do kit" required>
          <TextInput
            value={name}
            onChange={setName}
            placeholder="Ex.: Kit de aplicação frontal"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tipo">
            <SelectInput
              value={kind}
              onChange={(value) => setKind(value as ConsumableKitKind)}
            >
              <option value="spot">Pontual</option>
              <option value="ppf_front">PPF frente</option>
              <option value="wrap_full">Wrap integral</option>
              <option value="custom">Personalizado</option>
            </SelectInput>
          </Field>
          <Field label="Preço (€)">
            <NumberInput
              value={price}
              onChange={(value) => setPrice(value ?? 0)}
              step={0.01}
              min={0}
            />
          </Field>
        </div>
        <CheckboxRow
          label="Kit ativo"
          description="Disponível para seleção nos orçamentos"
          checked={active}
          onChange={setActive}
        />
        {error && (
          <p className="text-xs font-semibold text-[#f05a50]">{error}</p>
        )}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            <Check className="h-4 w-4" />
            <span>{saving ? "A guardar…" : "Guardar kit"}</span>
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

function SupplierFormModal({
  initial,
  onSubmit,
  onClose,
}: {
  initial: SupplierRecord | null;
  onSubmit: (input: SaveSupplierInput) => Promise<SaveWithIdResult>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Indica o nome do fornecedor.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await onSubmit({
      id: initial?.id,
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (!result.ok) setError(result.error);
  };

  return (
    <ModalShell
      title={initial ? "Editar fornecedor" : "Novo fornecedor"}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 mt-5">
        <Field label="Nome do fornecedor" required>
          <TextInput
            value={name}
            onChange={setName}
            placeholder="Ex.: FilmsPro Lda."
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Telefone">
            <TextInput
              value={phone}
              onChange={setPhone}
              type="tel"
              placeholder="Ex.: +351 912 345 678"
            />
          </Field>
          <Field label="Email">
            <TextInput
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="Ex.: geral@fornecedor.pt"
            />
          </Field>
        </div>
        <Field label="Notas">
          <TextInput
            value={notes}
            onChange={setNotes}
            placeholder="Observações internas"
          />
        </Field>
        {error && (
          <p className="text-xs font-semibold text-[#f05a50]">{error}</p>
        )}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            <Check className="h-4 w-4" />
            <span>
              {saving
                ? "A guardar…"
                : initial
                  ? "Guardar fornecedor"
                  : "Criar fornecedor"}
            </span>
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

function SupplierServiceFormModal({
  initial,
  suppliers,
  onSubmit,
  onClose,
}: {
  initial: SupplierService | null;
  suppliers: { id: string; name: string }[];
  onSubmit: (
    input: SaveSupplierServiceInput,
    supplierName: string
  ) => Promise<SaveWithIdResult>;
  onClose: () => void;
}) {
  const [supplierId, setSupplierId] = useState(
    initial?.supplierId ?? suppliers[0]?.id ?? ""
  );
  const [serviceName, setServiceName] = useState(initial?.serviceName ?? "");
  const [basePrice, setBasePrice] = useState<number>(initial?.basePrice ?? 0);
  const [replacedPhaseKey, setReplacedPhaseKey] = useState(
    initial?.replacedPhaseKey ?? ""
  );
  const [phaseHours, setPhaseHours] = useState<number | null>(
    initial?.phaseHours ?? null
  );
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSupplier = suppliers.find(
    (supplier) => supplier.id === supplierId
  );

  const handleSubmit = async () => {
    if (!supplierId) {
      setError("Seleciona o fornecedor.");
      return;
    }
    if (!serviceName.trim()) {
      setError("Indica o nome do serviço.");
      return;
    }
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      setError("O preço base tem de ser igual ou superior a zero.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await onSubmit(
      {
        id: initial?.id,
        supplierId,
        serviceName: serviceName.trim(),
        basePrice,
        replacedPhaseKey: replacedPhaseKey.trim() || null,
        phaseHours: phaseHours ?? null,
        active,
      },
      selectedSupplier?.name ?? ""
    );
    setSaving(false);
    if (!result.ok) setError(result.error);
  };

  return (
    <ModalShell
      title={initial ? "Editar serviço de fornecedor" : "Novo serviço de fornecedor"}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 mt-5">
        {suppliers.length === 0 ? (
          <p className="text-xs font-semibold text-[#f05a50]">
            Cria primeiro um fornecedor.
          </p>
        ) : (
          <Field label="Fornecedor" required>
            <SelectInput value={supplierId} onChange={setSupplierId}>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome do serviço" required>
            <TextInput
              value={serviceName}
              onChange={setServiceName}
              placeholder="Ex.: Desmontagem de para-choques"
            />
          </Field>
          <Field label="Preço base (€)">
            <NumberInput
              value={basePrice}
              onChange={(value) => setBasePrice(value ?? 0)}
              step={0.01}
              min={0}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Fase interna substituída"
            hint="Chave da fase interna, ex.: desassembly"
          >
            <TextInput
              value={replacedPhaseKey}
              onChange={setReplacedPhaseKey}
              placeholder="desassembly"
            />
          </Field>
          <Field label="Horas da fase" hint="Opcional">
            <NumberInput
              value={phaseHours}
              onChange={(value) => setPhaseHours(value)}
              allowEmpty
              step={0.5}
              min={0}
            />
          </Field>
        </div>
        <CheckboxRow
          label="Serviço ativo"
          description="Disponível para seleção nas subcontratações"
          checked={active}
          onChange={setActive}
        />
        {error && (
          <p className="text-xs font-semibold text-[#f05a50]">{error}</p>
        )}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={saving || suppliers.length === 0}
          >
            <Check className="h-4 w-4" />
            <span>{saving ? "A guardar…" : "Guardar serviço"}</span>
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
