"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Layers,
  Mail,
  MapPin,
  MessageSquare,
  PackageCheck,
  Plus,
  Ruler,
  Scissors,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { MaterialCard } from "@/components/xflow/stock/MaterialCard";
import { StockAlertBanner } from "@/components/xflow/stock/StockAlertBanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  buildSupplierOrderMessage,
  calculateRemnantAreaM2,
  type Material,
  type MaterialRemnant,
  type MaterialType,
  type MaterialUnit,
  type PurchaseOrder,
} from "@/domains/materials/types";
import { isCriticalStock, resolveStockStatus } from "@/domains/materials/stock";
import { formatCurrency } from "@/lib/formatting";
import {
  addMaterialBatchAction,
  createMaterialRemnantAction,
  createOrUpdateMaterialAction,
  createPurchaseOrderAction,
  markPurchaseOrderSentAction,
  receivePurchaseOrderAction,
  registerMaterialCutAction,
  consumeMaterialRemnantAction,
} from "@/app/actions/materials";

interface StockViewProps {
  initialMaterials: Material[];
  initialRemnants?: MaterialRemnant[];
  initialPurchaseOrders?: PurchaseOrder[];
}

type MainTab = "rolls" | "remnants" | "orders";

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "ppf", label: "Películas PPF" },
  { key: "wrap", label: "Vinil Wrap" },
  { key: "ceramic", label: "Cerâmicas" },
  { key: "tint", label: "Tint" },
  { key: "low_stock", label: "Crítico" },
] as const;

type StockFilter = (typeof FILTERS)[number]["key"];

function matchesFilter(material: Material, filter: StockFilter): boolean {
  switch (filter) {
    case "low_stock":
      return isCriticalStock(material.status);
    case "ppf":
      return (
        material.type === "ppf_gloss" ||
        material.type === "ppf_matte" ||
        material.type === "color_ppf"
      );
    case "wrap":
      return material.type === "cast_vinyl";
    case "ceramic":
      return material.type === "ceramic";
    case "tint":
      return material.type === "tint";
    default:
      return true;
  }
}

export function StockView({
  initialMaterials,
  initialRemnants = [],
  initialPurchaseOrders = [],
}: StockViewProps) {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [remnants, setRemnants] = useState<MaterialRemnant[]>(initialRemnants);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(
    initialPurchaseOrders
  );
  const [lastSynced, setLastSynced] = useState({
    materials: initialMaterials,
    remnants: initialRemnants,
    purchaseOrders: initialPurchaseOrders,
  });

  if (
    lastSynced.materials !== initialMaterials ||
    lastSynced.remnants !== initialRemnants ||
    lastSynced.purchaseOrders !== initialPurchaseOrders
  ) {
    setLastSynced({
      materials: initialMaterials,
      remnants: initialRemnants,
      purchaseOrders: initialPurchaseOrders,
    });
    setMaterials(initialMaterials);
    setRemnants(initialRemnants);
    setPurchaseOrders(initialPurchaseOrders);
  }

  const [activeTab, setActiveTab] = useState<MainTab>("rolls");
  const [activeTypeFilter, setActiveTypeFilter] = useState<StockFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  // Modal states
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [materialModalMode, setMaterialModalMode] = useState<"new_material" | "add_roll">(
    "new_material"
  );
  const [rollTargetMaterialId, setRollTargetMaterialId] = useState<string>(
    initialMaterials[0]?.id ?? ""
  );
  const [newMatForm, setNewMatForm] = useState({
    brand: "XPEL",
    name: "",
    type: "ppf_gloss" as MaterialType,
    finish: "Gloss",
    thicknessMicrons: "200",
    rollWidthMeters: "1.52",
    costPerMeter: "45",
    pricePerMeter: "95",
    minimumStockAlertMeters: "15",
    unit: "meter" as MaterialUnit,
    supplierName: "",
    initialBatchNumber: "",
    initialMeters: "15",
  });

  const [showCutModal, setShowCutModal] = useState(false);
  const [cutForm, setCutForm] = useState({
    materialId: initialMaterials[0]?.id ?? "",
    batchId: "",
    metersCut: "3.5",
    notes: "",
    saveRemnant: false,
    remnantWidthCm: "60",
    remnantLengthCm: "120",
    remnantLocation: "Estante A · Tubo 2",
  });

  const [showRemnantModal, setShowRemnantModal] = useState(false);
  const [remnantForm, setRemnantForm] = useState({
    materialId: initialMaterials[0]?.id ?? "",
    batchNumber: "",
    widthCm: "75",
    lengthCm: "150",
    location: "Estante A · Tubo 2",
    notes: "",
  });

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    materialId: initialMaterials[0]?.id ?? "",
    materialName: initialMaterials[0]
      ? `${initialMaterials[0].brand} ${initialMaterials[0].name}`
      : "",
    supplierName: initialMaterials[0]?.supplierName ?? "Fornecedor Oficial",
    supplierPhone: "",
    supplierEmail: "",
    quantityRolls: "1",
    metersPerRoll: "15",
    estimatedCost: "",
    notes: "",
  });

  const [receiveModalOrder, setReceiveModalOrder] = useState<PurchaseOrder | null>(
    null
  );
  const [receiveBatchNumber, setReceiveBatchNumber] = useState("");

  const criticalMaterials = materials.filter((m) => isCriticalStock(m.status));
  const availableRemnants = remnants.filter((r) => r.status === "available");

  const filteredMaterials = materials.filter((material) => {
    if (!matchesFilter(material, activeTypeFilter)) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      material.brand.toLowerCase().includes(query) ||
      material.name.toLowerCase().includes(query) ||
      material.finish.toLowerCase().includes(query)
    );
  });

  const totalStockMeters = materials
    .filter((m) => m.unit === "meter")
    .reduce((acc, m) => acc + m.currentStockMeters, 0);

  const totalStockValue = materials.reduce(
    (acc, m) => acc + m.currentStockMeters * m.costPerMeter,
    0
  );

  const countFor = (filter: StockFilter) =>
    filter === "low_stock"
      ? criticalMaterials.length
      : filter === "all"
        ? materials.length
        : materials.filter((material) => matchesFilter(material, filter)).length;

  const openAddRollModal = (material?: Material) => {
    const target = material ?? materials[0];
    setMaterialModalMode(material ? "add_roll" : "new_material");
    if (target) {
      setRollTargetMaterialId(target.id);
      setNewMatForm((prev) => ({
        ...prev,
        supplierName: target.supplierName ?? target.brand,
        costPerMeter: String(target.costPerMeter),
      }));
    }
    setShowMaterialModal(true);
  };

  const openCutModal = (material?: Material) => {
    const target = material ?? materials.find((m) => m.currentStockMeters > 0) ?? materials[0];
    setCutForm({
      materialId: target?.id ?? "",
      batchId: target?.batches?.[0]?.id ?? "",
      metersCut: "2.5",
      notes: "",
      saveRemnant: false,
      remnantWidthCm: "60",
      remnantLengthCm: "120",
      remnantLocation: "Estante A · Tubo 2",
    });
    setShowCutModal(true);
  };

  const openOrderModal = (material?: Material) => {
    const target = material ?? materials[0];
    const defaultMeters = 15;
    const estCost = target ? Math.round(target.costPerMeter * defaultMeters * 100) / 100 : 0;
    setOrderForm({
      materialId: target?.id ?? "",
      materialName: target ? `${target.brand} ${target.name}` : "",
      supplierName: target?.supplierName || target?.brand || "Distribuidor Oficial",
      supplierPhone: "",
      supplierEmail: "",
      quantityRolls: "1",
      metersPerRoll: String(defaultMeters),
      estimatedCost: estCost > 0 ? String(estCost) : "",
      notes: "",
    });
    setShowOrderModal(true);
  };

  const handleSaveMaterialOrRoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setFeedback(null);

    try {
      if (materialModalMode === "add_roll") {
        const meters = Number(newMatForm.initialMeters);
        const result = await addMaterialBatchAction({
          materialId: rollTargetMaterialId,
          batchNumber: newMatForm.initialBatchNumber,
          supplierName: newMatForm.supplierName,
          meters,
          costPerMeter: Number(newMatForm.costPerMeter) || undefined,
        });
        if (!result.ok) {
          setFeedback({
            tone: "error",
            message: result.error || "Não foi possível registar o rolo.",
          });
          return;
        }
        setMaterials((prev) =>
          prev.map((m) => {
            if (m.id !== rollTargetMaterialId) return m;
            const nextMeters = Math.round((m.currentStockMeters + meters) * 100) / 100;
            return {
              ...m,
              currentStockMeters: nextMeters,
              status: resolveStockStatus(nextMeters, m.minimumStockAlertMeters),
            };
          })
        );
        setFeedback({
          tone: "success",
          message: `Entrada de rolo (${meters} m) registada em stock.`,
        });
      } else {
        const result = await createOrUpdateMaterialAction({
          brand: newMatForm.brand,
          name: newMatForm.name,
          type: newMatForm.type,
          finish: newMatForm.finish,
          thicknessMicrons: Number(newMatForm.thicknessMicrons) || undefined,
          rollWidthMeters: Number(newMatForm.rollWidthMeters) || 1.52,
          costPerMeter: Number(newMatForm.costPerMeter) || 0,
          pricePerMeter: Number(newMatForm.pricePerMeter) || 0,
          minimumStockAlertMeters: Number(newMatForm.minimumStockAlertMeters) || 15,
          unit: newMatForm.unit,
          supplierName: newMatForm.supplierName || undefined,
          initialBatchNumber: newMatForm.initialBatchNumber || undefined,
          initialMeters: Number(newMatForm.initialMeters) || 0,
        });
        if (!result.ok) {
          setFeedback({
            tone: "error",
            message: result.error || "Não foi possível criar o material.",
          });
          return;
        }
        setFeedback({
          tone: "success",
          message: "Novo material e stock inicial registados com sucesso.",
        });
      }
      setShowMaterialModal(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  const handleRegisterCut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setFeedback(null);

    const metersCut = Number(cutForm.metersCut);
    try {
      const result = await registerMaterialCutAction({
        materialId: cutForm.materialId,
        batchId: cutForm.batchId || undefined,
        metersCut,
        notes: cutForm.notes || undefined,
        createRemnant: cutForm.saveRemnant
          ? {
              widthCm: Number(cutForm.remnantWidthCm),
              lengthCm: Number(cutForm.remnantLengthCm),
              location: cutForm.remnantLocation,
              notes: cutForm.notes || undefined,
            }
          : undefined,
      });

      if (!result.ok) {
        setFeedback({
          tone: "error",
          message: result.error || "Não foi possível registar o corte.",
        });
        return;
      }

      setMaterials((prev) =>
        prev.map((m) => {
          if (m.id !== cutForm.materialId) return m;
          const nextMeters = Math.max(
            0,
            Math.round((m.currentStockMeters - metersCut) * 100) / 100
          );
          return {
            ...m,
            currentStockMeters: nextMeters,
            status: resolveStockStatus(nextMeters, m.minimumStockAlertMeters),
          };
        })
      );

      setFeedback({
        tone: "success",
        message: cutForm.saveRemnant
          ? `Corte de ${metersCut} m registado e sobra guardada nos Retalhos Aproveitáveis.`
          : `Corte de ${metersCut} m descontado do stock.`,
      });
      setShowCutModal(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  const handleCreateRemnant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setFeedback(null);

    try {
      const result = await createMaterialRemnantAction({
        materialId: remnantForm.materialId,
        batchNumber: remnantForm.batchNumber || undefined,
        widthCm: Number(remnantForm.widthCm),
        lengthCm: Number(remnantForm.lengthCm),
        location: remnantForm.location,
        notes: remnantForm.notes || undefined,
      });
      if (!result.ok) {
        setFeedback({
          tone: "error",
          message: result.error || "Não foi possível registar o retalho.",
        });
        return;
      }
      setFeedback({
        tone: "success",
        message: "Retalho aproveitável registado no inventário.",
      });
      setShowRemnantModal(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  const handleUseRemnant = async (remnantId: string) => {
    if (pending) return;
    setPending(true);
    setFeedback(null);
    try {
      const result = await consumeMaterialRemnantAction(remnantId);
      if (!result.ok) {
        setFeedback({
          tone: "error",
          message: result.error || "Não foi possível marcar o retalho como usado.",
        });
        return;
      }
      setRemnants((prev) =>
        prev.map((r) => (r.id === remnantId ? { ...r, status: "used" } : r))
      );
      setFeedback({
        tone: "success",
        message: "Retalho marcado como utilizado.",
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  const triggerExternalOrderChannel = async (
    order: PurchaseOrder,
    via: "whatsapp" | "email"
  ) => {
    const msg = buildSupplierOrderMessage(order);
    if (via === "whatsapp") {
      const cleanPhone = (order.supplierPhone || "").replace(/[^0-9]/g, "");
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        msg.whatsappText
      )}`;
      if (typeof window !== "undefined") {
        window.open(waUrl, "_blank", "noopener,noreferrer");
      }
    } else {
      const mailtoUrl = `mailto:${encodeURIComponent(
        order.supplierEmail || ""
      )}?subject=${encodeURIComponent(msg.emailSubject)}&body=${encodeURIComponent(
        msg.emailBody
      )}`;
      if (typeof window !== "undefined") {
        window.open(mailtoUrl, "_self");
      }
    }
    await markPurchaseOrderSentAction(order.id, via);
    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.id === order.id
          ? {
              ...po,
              status: po.status === "received" ? "received" : "sent",
              sentVia: via,
            }
          : po
      )
    );
    router.refresh();
  };

  const handleCreateOrder = async (
    e: React.FormEvent,
    sendImmediatelyVia?: "whatsapp" | "email"
  ) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setFeedback(null);

    try {
      const result = await createPurchaseOrderAction({
        materialId: orderForm.materialId || undefined,
        materialName: orderForm.materialName,
        supplierName: orderForm.supplierName,
        supplierPhone: orderForm.supplierPhone || undefined,
        supplierEmail: orderForm.supplierEmail || undefined,
        quantityRolls: Number(orderForm.quantityRolls) || 1,
        metersPerRoll: Number(orderForm.metersPerRoll) || 15,
        estimatedCost: orderForm.estimatedCost
          ? Number(orderForm.estimatedCost)
          : undefined,
        notes: orderForm.notes || undefined,
      });

      if (!result.ok || !result.order) {
        setFeedback({
          tone: "error",
          message: result.error || "Não foi possível criar a encomenda.",
        });
        return;
      }

      const createdOrder = result.order;
      setPurchaseOrders((prev) => [createdOrder, ...prev]);
      setShowOrderModal(false);
      setActiveTab("orders");

      if (sendImmediatelyVia) {
        await triggerExternalOrderChannel(createdOrder, sendImmediatelyVia);
        setFeedback({
          tone: "success",
          message: `Encomenda ${createdOrder.orderNumber} criada e aberta para envio por ${
            sendImmediatelyVia === "whatsapp" ? "WhatsApp" : "Email"
          }.`,
        });
      } else {
        setFeedback({
          tone: "success",
          message: `Encomenda ${createdOrder.orderNumber} registada.`,
        });
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  };

  const handleReceiveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveModalOrder || pending) return;
    setPending(true);
    setFeedback(null);

    try {
      const result = await receivePurchaseOrderAction(
        receiveModalOrder.id,
        receiveBatchNumber
      );
      if (!result.ok) {
        setFeedback({
          tone: "error",
          message: result.error || "Não foi possível receber a encomenda.",
        });
        return;
      }
      setPurchaseOrders((prev) =>
        prev.map((po) =>
          po.id === receiveModalOrder.id ? { ...po, status: "received" } : po
        )
      );
      setFeedback({
        tone: "success",
        message: `Encomenda ${receiveModalOrder.orderNumber} recebida! +${receiveModalOrder.totalMeters} m adicionados automaticamente ao stock.`,
      });
      setReceiveModalOrder(null);
      setReceiveBatchNumber("");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[#a9adae]">
            Inventário de Oficina, Retalhos & Encomendas
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Materiais & Rolos
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => openAddRollModal()}
          >
            <Plus className="h-4 w-4 text-[#d3a548]" />
            <span>Novo Material / Rolo</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openCutModal()}
          >
            <Scissors className="h-4 w-4 text-[#f7d46d]" />
            <span>Registar Corte (m)</span>
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => openOrderModal()}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Encomendar ao Fornecedor</span>
          </Button>
        </div>
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

      <StockAlertBanner lowStockMaterials={criticalMaterials} />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <span className="text-xs text-[#a9adae]">Total em Stock Físico</span>
          <span className="text-2xl font-black text-[#f1ede5] tabular-nums">
            {Math.round(totalStockMeters)} metros lineares
          </span>
          <span className="text-[12px] text-[#8a9092]">
            {materials.length} referências registadas
          </span>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <span className="text-xs text-[#a9adae]">Valor Imobilizado em Stock</span>
          <span className="text-2xl font-black text-[#f7d46d] tabular-nums">
            {formatCurrency(totalStockValue)}
          </span>
          <span className="text-[12px] text-[#8a9092]">Preço de custo registado</span>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
          <span className="text-xs text-[#a9adae]">Retalhos Aproveitáveis</span>
          <span className="text-2xl font-black text-[#68a46b] tabular-nums">
            {availableRemnants.length} disponíveis
          </span>
          <span className="text-[12px] text-[#8a9092]">
            {availableRemnants
              .reduce((acc, r) => acc + r.areaM2, 0)
              .toFixed(2)}{" "}
            m² prontos a usar
          </span>
        </div>

        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#1f1b14] border border-[#d3a548]/30">
          <span className="text-xs text-[#d3a548]">Alertas de Stock Crítico</span>
          <span className="text-2xl font-black text-[#f05a50] tabular-nums">
            {criticalMaterials.length} Itens
          </span>
          <span className="text-[12px] text-[#a9adae]">
            No mínimo de segurança ou esgotados
          </span>
        </div>
      </div>

      {/* Separadores principais */}
      <div className="flex flex-wrap items-center gap-2 p-1 rounded-lg bg-[#101314] border border-white/[0.08] w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("rolls")}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === "rolls"
              ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40"
              : "text-[#a9adae] hover:text-[#f1ede5]"
          }`}
        >
          Rolos e Películas ({materials.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("remnants")}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === "remnants"
              ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40"
              : "text-[#a9adae] hover:text-[#f1ede5]"
          }`}
        >
          Retalhos Aproveitáveis ({availableRemnants.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === "orders"
              ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40"
              : "text-[#a9adae] hover:text-[#f1ede5]"
          }`}
        >
          Encomendas a Fornecedores ({purchaseOrders.length})
        </button>
      </div>

      {/* TAB 1: ROLOS E PELÍCULAS */}
      {activeTab === "rolls" && (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9092]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por marca, referência ou acabamento..."
                className="w-full h-10 pl-10 pr-4 rounded-md bg-[#101314] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] placeholder-[#8a9092] transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-md bg-[#101314] border border-white/[0.06] overflow-x-auto select-none">
              {FILTERS.map((filter) => {
                const isActive = activeTypeFilter === filter.key;
                const isCriticalFilter = filter.key === "low_stock";
                return (
                  <button
                    key={filter.key}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveTypeFilter(filter.key)}
                    className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? isCriticalFilter
                          ? "bg-[#3a1515] text-[#f05a50] border border-[#f05a50]/40 shadow-sm"
                          : "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                        : isCriticalFilter
                          ? "text-[#f05a50] hover:bg-[#3a1515]/30"
                          : "text-[#a9adae] hover:text-[#f1ede5]"
                    }`}
                  >
                    {isCriticalFilter && (
                      <AlertTriangle className="inline h-3 w-3 mr-1.5 -mt-0.5" />
                    )}
                    {filter.label} ({countFor(filter.key)})
                  </button>
                );
              })}
            </div>
          </div>

          <div role="status" className="sr-only">
            {filteredMaterials.length} materiais visíveis de {materials.length}.
          </div>

          {filteredMaterials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  onAddRoll={(mat) => openAddRollModal(mat)}
                  onRegisterCut={(mat) => openCutModal(mat)}
                  onOrderSupplier={(mat) => openOrderModal(mat)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 rounded-lg bg-[#101314] border border-white/[0.06] text-center">
              <Layers className="h-10 w-10 text-[#8a9092] mb-3" />
              <h3 className="text-base font-semibold text-[#f1ede5]">
                Nenhum material encontrado
              </h3>
              <p className="text-xs text-[#a9adae] mt-1 max-w-sm">
                Tenta ajustar os termos de pesquisa ou filtros de categoria.
              </p>
            </div>
          )}
        </>
      )}

      {/* TAB 2: RETALHOS APROVEITÁVEIS */}
      {activeTab === "remnants" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#f1ede5]">
                Inventário de Retalhos Aproveitáveis ({availableRemnants.length}{" "}
                disponíveis)
              </span>
              <span className="text-xs text-[#a9adae]">
                Sobras catalogadas com dimensões (L × C cm), área em m² e localização na
                oficina para pilares, espelhos, faróis e detalhes.
              </span>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setRemnantForm({
                  materialId: materials[0]?.id ?? "",
                  batchNumber: materials[0]?.batches?.[0]?.batchNumber ?? "",
                  widthCm: "60",
                  lengthCm: "120",
                  location: "Estante A · Tubo 2",
                  notes: "",
                });
                setShowRemnantModal(true);
              }}
            >
              <Plus className="h-4 w-4" />
              <span>Novo Retalho</span>
            </Button>
          </div>

          {remnants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {remnants.map((remnant) => {
                const isAvailable = remnant.status === "available";
                return (
                  <div
                    key={remnant.id}
                    className="flex flex-col justify-between gap-3 p-5 rounded-lg bg-[#101314] border border-white/[0.08]"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
                            {remnant.brand}
                          </span>
                          <h3 className="text-sm font-bold text-[#f1ede5]">
                            {remnant.materialName}
                          </h3>
                        </div>
                        <Badge variant={isAvailable ? "success" : "default"}>
                          {isAvailable ? "Disponível" : "Utilizado"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#f1ede5] mt-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#15191a] border border-white/[0.06] font-mono font-bold text-[#f7d46d]">
                          <Ruler className="h-3.5 w-3.5 text-[#d3a548]" />
                          {remnant.widthCm} × {remnant.lengthCm} cm
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-[#15191a] border border-white/[0.06] font-mono text-xs text-[#a9adae]">
                          {remnant.areaM2} m²
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[#a9adae] mt-1">
                        <MapPin className="h-3.5 w-3.5 text-[#d3a548]" />
                        <span>{remnant.location}</span>
                      </div>

                      {remnant.batchNumber && (
                        <span className="text-[11px] text-[#8a9092] font-mono">
                          Lote: {remnant.batchNumber}
                        </span>
                      )}
                      {remnant.notes && (
                        <p className="text-xs text-[#8a9092] italic">{remnant.notes}</p>
                      )}
                    </div>

                    {isAvailable && (
                      <div className="pt-3 border-t border-white/[0.06]">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={pending}
                          onClick={() => handleUseRemnant(remnant.id)}
                          className="w-full text-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#68a46b]" />
                          <span>Usar Retalho</span>
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 px-4 rounded-lg bg-[#101314] border border-white/[0.06] text-center">
              <Scissors className="h-9 w-9 text-[#8a9092] mb-2" />
              <h3 className="text-sm font-bold text-[#f1ede5]">
                Sem retalhos registados
              </h3>
              <p className="text-xs text-[#a9adae] mt-1 max-w-md">
                Regista retalhos ao cortar película ou clica em &ldquo;Novo Retalho&rdquo;
                para catalogar sobras aproveitáveis na oficina.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ENCOMENDAS A FORNECEDORES */}
      {activeTab === "orders" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-[#101314] border border-white/[0.08]">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#f1ede5]">
                Encomendas a Fornecedores (WhatsApp / Email & Receção de Lotes)
              </span>
              <span className="text-xs text-[#a9adae]">
                Envia pedidos de rolos diretamente por WhatsApp ou Email e dá entrada
                automática em stock na receção.
              </span>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => openOrderModal()}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Encomendar ao Fornecedor</span>
            </Button>
          </div>

          {purchaseOrders.length > 0 ? (
            <div className="flex flex-col gap-3">
              {purchaseOrders.map((order) => {
                const isReceived = order.status === "received";
                const isSent = order.status === "sent";
                return (
                  <div
                    key={order.id}
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-lg bg-[#101314] border border-white/[0.08]"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono font-bold text-sm text-[#f7d46d]">
                          {order.orderNumber}
                        </span>
                        <span className="font-bold text-sm text-[#f1ede5]">
                          {order.materialName}
                        </span>
                        <Badge
                          variant={
                            isReceived
                              ? "success"
                              : isSent
                                ? "in_progress"
                                : "outline"
                          }
                        >
                          {isReceived
                            ? "Recebida em Stock"
                            : isSent
                              ? `Enviada (${order.sentVia === "whatsapp" ? "WhatsApp" : "Email"})`
                              : "Rascunho"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#a9adae]">
                        <span>
                          Fornecedor:{" "}
                          <strong className="text-[#f1ede5]">
                            {order.supplierName}
                          </strong>
                        </span>
                        <span>·</span>
                        <span>
                          Quantidade:{" "}
                          <strong className="text-[#f1ede5]">
                            {order.quantityRolls} rolo(s) × {order.metersPerRoll} m (
                            {order.totalMeters} m)
                          </strong>
                        </span>
                        {order.estimatedCost !== undefined && (
                          <>
                            <span>·</span>
                            <span>
                              Custo est.:{" "}
                              <strong className="text-[#f7d46d]">
                                {formatCurrency(order.estimatedCost)}
                              </strong>
                            </span>
                          </>
                        )}
                      </div>
                      {order.notes && (
                        <span className="text-xs text-[#8a9092]">{order.notes}</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={pending}
                        onClick={() => triggerExternalOrderChannel(order, "whatsapp")}
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-[#68a46b]" />
                        <span>Enviar WhatsApp</span>
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={pending}
                        onClick={() => triggerExternalOrderChannel(order, "email")}
                      >
                        <Mail className="h-3.5 w-3.5 text-[#d3a548]" />
                        <span>Enviar Email</span>
                      </Button>

                      {!isReceived && order.status !== "cancelled" && (
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          disabled={pending}
                          onClick={() => {
                            setReceiveModalOrder(order);
                            setReceiveBatchNumber(`LOTE-${order.orderNumber}`);
                          }}
                        >
                          <PackageCheck className="h-3.5 w-3.5" />
                          <span>Receber Rolo em Stock</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 px-4 rounded-lg bg-[#101314] border border-white/[0.06] text-center">
              <ShoppingCart className="h-9 w-9 text-[#8a9092] mb-2" />
              <h3 className="text-sm font-bold text-[#f1ede5]">
                Nenhuma encomenda a fornecedor registada
              </h3>
              <p className="text-xs text-[#a9adae] mt-1 max-w-md">
                Clica em &ldquo;Encomendar ao Fornecedor&rdquo; em qualquer película para
                preparar e enviar o pedido por WhatsApp ou Email.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: NOVO MATERIAL / ENTRADA DE ROLO */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-xl bg-[#101314] border border-white/15 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-[#f1ede5]">
                Novo Material / Entrada de Rolo
              </h2>
              <button
                type="button"
                onClick={() => setShowMaterialModal(false)}
                className="text-[#8a9092] hover:text-[#f1ede5] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setMaterialModalMode("add_roll")}
                className={`flex-1 py-2 rounded-md text-xs font-bold border cursor-pointer ${
                  materialModalMode === "add_roll"
                    ? "bg-[#1f1b14] text-[#f7d46d] border-[#d3a548]/40"
                    : "bg-[#15191a] text-[#a9adae] border-white/10"
                }`}
              >
                Adicionar Rolo a Material Existente
              </button>
              <button
                type="button"
                onClick={() => setMaterialModalMode("new_material")}
                className={`flex-1 py-2 rounded-md text-xs font-bold border cursor-pointer ${
                  materialModalMode === "new_material"
                    ? "bg-[#1f1b14] text-[#f7d46d] border-[#d3a548]/40"
                    : "bg-[#15191a] text-[#a9adae] border-white/10"
                }`}
              >
                Criar Nova Referência de Material
              </button>
            </div>

            <form onSubmit={handleSaveMaterialOrRoll} className="flex flex-col gap-3 mt-4 text-xs">
              {materialModalMode === "add_roll" ? (
                <>
                  <label className="flex flex-col gap-1">
                    <span className="text-[#a9adae]">Material / Película</span>
                    <select
                      value={rollTargetMaterialId}
                      onChange={(e) => setRollTargetMaterialId(e.target.value)}
                      className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                      required
                    >
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.brand} {m.name} ({m.currentStockMeters} m atual)
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-[#a9adae]">N.º de Lote do Rolo</span>
                      <input
                        type="text"
                        value={newMatForm.initialBatchNumber}
                        onChange={(e) =>
                          setNewMatForm({ ...newMatForm, initialBatchNumber: e.target.value })
                        }
                        placeholder="Ex: XP-2026-8841"
                        className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[#a9adae]">Metros do Rolo (m)</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        value={newMatForm.initialMeters}
                        onChange={(e) =>
                          setNewMatForm({ ...newMatForm, initialMeters: e.target.value })
                        }
                        className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                        required
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-[#a9adae]">Fornecedor</span>
                      <input
                        type="text"
                        value={newMatForm.supplierName}
                        onChange={(e) =>
                          setNewMatForm({ ...newMatForm, supplierName: e.target.value })
                        }
                        placeholder="Ex: XPEL Ibéria"
                        className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[#a9adae]">Custo / Metro (€)</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newMatForm.costPerMeter}
                        onChange={(e) =>
                          setNewMatForm({ ...newMatForm, costPerMeter: e.target.value })
                        }
                        className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                      />
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-[#a9adae]">Marca</span>
                      <input
                        type="text"
                        value={newMatForm.brand}
                        onChange={(e) =>
                          setNewMatForm({ ...newMatForm, brand: e.target.value })
                        }
                        placeholder="XPEL, STEK, 3M..."
                        className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[#a9adae]">Nome / Modelo</span>
                      <input
                        type="text"
                        value={newMatForm.name}
                        onChange={(e) =>
                          setNewMatForm({ ...newMatForm, name: e.target.value })
                        }
                        placeholder="Ultimate Plus 60"
                        className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                        required
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-[#a9adae]">Categoria</span>
                      <select
                        value={newMatForm.type}
                        onChange={(e) =>
                          setNewMatForm({
                            ...newMatForm,
                            type: e.target.value as MaterialType,
                          })
                        }
                        className="h-9 px-2 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                      >
                        <option value="ppf_gloss">PPF Gloss</option>
                        <option value="ppf_matte">PPF Matte / Stealth</option>
                        <option value="color_ppf">Color PPF</option>
                        <option value="cast_vinyl">Vinil Wrap</option>
                        <option value="ceramic">Cerâmica</option>
                        <option value="tint">Tint / Solar</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[#a9adae]">Acabamento</span>
                      <input
                        type="text"
                        value={newMatForm.finish}
                        onChange={(e) =>
                          setNewMatForm({ ...newMatForm, finish: e.target.value })
                        }
                        className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[#a9adae]">Largura Rolo (m)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={newMatForm.rollWidthMeters}
                        onChange={(e) =>
                          setNewMatForm({
                            ...newMatForm,
                            rollWidthMeters: e.target.value,
                          })
                        }
                        className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-[#a9adae]">Custo / m (€)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={newMatForm.costPerMeter}
                        onChange={(e) =>
                          setNewMatForm({ ...newMatForm, costPerMeter: e.target.value })
                        }
                        className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[#a9adae]">Venda / m (€)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={newMatForm.pricePerMeter}
                        onChange={(e) =>
                          setNewMatForm({ ...newMatForm, pricePerMeter: e.target.value })
                        }
                        className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[#a9adae]">Alerta Mínimo (m)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={newMatForm.minimumStockAlertMeters}
                        onChange={(e) =>
                          setNewMatForm({
                            ...newMatForm,
                            minimumStockAlertMeters: e.target.value,
                          })
                        }
                        className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
                    <label className="flex flex-col gap-1">
                      <span className="text-[#a9adae]">Lote Inicial (opcional)</span>
                      <input
                        type="text"
                        value={newMatForm.initialBatchNumber}
                        onChange={(e) =>
                          setNewMatForm({
                            ...newMatForm,
                            initialBatchNumber: e.target.value,
                          })
                        }
                        placeholder="Ex: LOTE-2026-01"
                        className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[#a9adae]">Metros Iniciais</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={newMatForm.initialMeters}
                        onChange={(e) =>
                          setNewMatForm({ ...newMatForm, initialMeters: e.target.value })
                        }
                        className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                      />
                    </label>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMaterialModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={pending}>
                  Guardar em Stock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTAR CORTE POR METRO + RETALHO OPCIONAL */}
      {showCutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-xl bg-[#101314] border border-white/15 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-[#f1ede5]">
                Registar Corte de Película (m)
              </h2>
              <button
                type="button"
                onClick={() => setShowCutModal(false)}
                className="text-[#8a9092] hover:text-[#f1ede5] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterCut} className="flex flex-col gap-3 mt-4 text-xs">
              <label className="flex flex-col gap-1">
                <span className="text-[#a9adae]">Material / Rolo</span>
                <select
                  value={cutForm.materialId}
                  onChange={(e) => {
                    const mat = materials.find((m) => m.id === e.target.value);
                    setCutForm({
                      ...cutForm,
                      materialId: e.target.value,
                      batchId: mat?.batches?.[0]?.id ?? "",
                    });
                  }}
                  className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                  required
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brand} {m.name} — {m.currentStockMeters} m disponíveis
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[#a9adae]">Metros a Cortar (m)</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={cutForm.metersCut}
                    onChange={(e) =>
                      setCutForm({ ...cutForm, metersCut: e.target.value })
                    }
                    className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[#a9adae]">Notas / Peça</span>
                  <input
                    type="text"
                    value={cutForm.notes}
                    onChange={(e) => setCutForm({ ...cutForm, notes: e.target.value })}
                    placeholder="Ex: Capot + Guarda-lamas"
                    className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cutForm.saveRemnant}
                  onChange={(e) =>
                    setCutForm({ ...cutForm, saveRemnant: e.target.checked })
                  }
                  className="h-4 w-4 accent-[#d3a548]"
                />
                <span className="font-semibold text-[#f7d46d]">
                  Guardar sobra aproveitável como Retalho
                </span>
              </label>

              {cutForm.saveRemnant && (
                <div className="flex flex-col gap-3 p-3 rounded-lg bg-[#15191a] border border-[#d3a548]/30">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-[#a9adae]">Largura Sobra (cm)</span>
                      <input
                        type="number"
                        min="5"
                        value={cutForm.remnantWidthCm}
                        onChange={(e) =>
                          setCutForm({ ...cutForm, remnantWidthCm: e.target.value })
                        }
                        className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[#a9adae]">Comprimento Sobra (cm)</span>
                      <input
                        type="number"
                        min="5"
                        value={cutForm.remnantLengthCm}
                        onChange={(e) =>
                          setCutForm({ ...cutForm, remnantLengthCm: e.target.value })
                        }
                        className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                        required
                      />
                    </label>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#a9adae]">
                    <span>Área calculada da sobra:</span>
                    <strong className="font-mono text-[#f7d46d]">
                      {calculateRemnantAreaM2(
                        Number(cutForm.remnantWidthCm),
                        Number(cutForm.remnantLengthCm)
                      )}{" "}
                      m²
                    </strong>
                  </div>
                  <label className="flex flex-col gap-1">
                    <span className="text-[#a9adae]">Localização na Oficina</span>
                    <input
                      type="text"
                      value={cutForm.remnantLocation}
                      onChange={(e) =>
                        setCutForm({ ...cutForm, remnantLocation: e.target.value })
                      }
                      placeholder="Estante A · Tubo 2"
                      className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                      required
                    />
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCutModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={pending}>
                  Confirmar Corte
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: NOVO RETALHO DIRETO */}
      {showRemnantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-xl bg-[#101314] border border-white/15 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-[#f1ede5]">
                Catalogar Novo Retalho Aproveitável
              </h2>
              <button
                type="button"
                onClick={() => setShowRemnantModal(false)}
                className="text-[#8a9092] hover:text-[#f1ede5] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRemnant} className="flex flex-col gap-3 mt-4 text-xs">
              <label className="flex flex-col gap-1">
                <span className="text-[#a9adae]">Película / Material</span>
                <select
                  value={remnantForm.materialId}
                  onChange={(e) =>
                    setRemnantForm({ ...remnantForm, materialId: e.target.value })
                  }
                  className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                  required
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brand} {m.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[#a9adae]">Largura (cm)</span>
                  <input
                    type="number"
                    min="5"
                    value={remnantForm.widthCm}
                    onChange={(e) =>
                      setRemnantForm({ ...remnantForm, widthCm: e.target.value })
                    }
                    className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[#a9adae]">Comprimento (cm)</span>
                  <input
                    type="number"
                    min="5"
                    value={remnantForm.lengthCm}
                    onChange={(e) =>
                      setRemnantForm({ ...remnantForm, lengthCm: e.target.value })
                    }
                    className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                    required
                  />
                </label>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#a9adae]">
                <span>Área aproveitável:</span>
                <strong className="font-mono text-[#f7d46d]">
                  {calculateRemnantAreaM2(
                    Number(remnantForm.widthCm),
                    Number(remnantForm.lengthCm)
                  )}{" "}
                  m²
                </strong>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-[#a9adae]">Localização Física</span>
                <input
                  type="text"
                  value={remnantForm.location}
                  onChange={(e) =>
                    setRemnantForm({ ...remnantForm, location: e.target.value })
                  }
                  placeholder="Estante A · Tubo 2"
                  className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                  required
                />
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRemnantModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={pending}>
                  Guardar Retalho
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ENCOMENDAR AO FORNECEDOR (WHATSAPP / EMAIL) */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-xl bg-[#101314] border border-white/15 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-[#f1ede5]">
                Encomendar Rolo ao Fornecedor
              </h2>
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="text-[#8a9092] hover:text-[#f1ede5] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => handleCreateOrder(e)}
              className="flex flex-col gap-3 mt-4 text-xs"
            >
              <label className="flex flex-col gap-1">
                <span className="text-[#a9adae]">Material do Catálogo</span>
                <select
                  value={orderForm.materialId}
                  onChange={(e) => {
                    const mat = materials.find((m) => m.id === e.target.value);
                    setOrderForm({
                      ...orderForm,
                      materialId: e.target.value,
                      materialName: mat
                        ? `${mat.brand} ${mat.name}`
                        : orderForm.materialName,
                      supplierName:
                        mat?.supplierName || mat?.brand || orderForm.supplierName,
                    });
                  }}
                  className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brand} {m.name} ({m.currentStockMeters} m em stock)
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[#a9adae]">Fornecedor</span>
                  <input
                    type="text"
                    value={orderForm.supplierName}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, supplierName: e.target.value })
                    }
                    className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[#a9adae]">WhatsApp Fornecedor (opcional)</span>
                  <input
                    type="text"
                    value={orderForm.supplierPhone}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, supplierPhone: e.target.value })
                    }
                    placeholder="351910000000"
                    className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[#a9adae]">Qtd. Rolos</span>
                  <input
                    type="number"
                    min="1"
                    value={orderForm.quantityRolls}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, quantityRolls: e.target.value })
                    }
                    className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[#a9adae]">Metros / Rolo</span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={orderForm.metersPerRoll}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, metersPerRoll: e.target.value })
                    }
                    className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[#a9adae]">Email Fornecedor</span>
                  <input
                    type="email"
                    value={orderForm.supplierEmail}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, supplierEmail: e.target.value })
                    }
                    placeholder="encomendas@fornecedor.pt"
                    className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-[#a9adae]">Observações da Encomenda</span>
                <input
                  type="text"
                  value={orderForm.notes}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, notes: e.target.value })
                  }
                  placeholder="Ex: Urgente para obra Porsche 911 GT3"
                  className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5]"
                />
              </label>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOrderModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={pending}
                  onClick={(e) => handleCreateOrder(e, "whatsapp")}
                >
                  <MessageSquare className="h-3.5 w-3.5 text-[#68a46b]" />
                  <span>Guardar & Enviar WhatsApp</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={pending}
                  onClick={(e) => handleCreateOrder(e, "email")}
                >
                  <Mail className="h-3.5 w-3.5 text-[#d3a548]" />
                  <span>Guardar & Enviar Email</span>
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={pending}>
                  Registar Encomenda
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: RECEBER ENCOMENDA EM STOCK */}
      {receiveModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-xl bg-[#101314] border border-white/15 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-[#f1ede5]">
                Receber Rolo em Stock ({receiveModalOrder.orderNumber})
              </h2>
              <button
                type="button"
                onClick={() => setReceiveModalOrder(null)}
                className="text-[#8a9092] hover:text-[#f1ede5] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleReceiveOrder} className="flex flex-col gap-3 mt-4 text-xs">
              <p className="text-[#a9adae]">
                Confirma o número de lote impresso na caixa para somar automaticamente{" "}
                <strong className="text-[#f7d46d]">
                  {receiveModalOrder.totalMeters} metros lineares
                </strong>{" "}
                de <strong className="text-[#f1ede5]">{receiveModalOrder.materialName}</strong>{" "}
                ao stock disponível.
              </p>

              <label className="flex flex-col gap-1">
                <span className="text-[#a9adae]">N.º de Lote de Fábrica</span>
                <input
                  type="text"
                  value={receiveBatchNumber}
                  onChange={(e) => setReceiveBatchNumber(e.target.value)}
                  className="h-9 px-3 rounded-md bg-[#0c0f10] border border-white/10 text-[#f1ede5] font-mono"
                  required
                />
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReceiveModalOrder(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={pending}>
                  <PackageCheck className="h-3.5 w-3.5" />
                  <span>Confirmar Entrada em Stock</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
