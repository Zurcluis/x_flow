import { SearchResultItem, SearchCategory } from "./types";
import { initialVehiclesData } from "@/lib/demo-data/vehicles-data";
import { initialCustomersData } from "@/lib/demo-data/customers-data";
import { initialQuotesData } from "@/lib/demo-data/quotes-data";
import { initialWorkOrdersData } from "@/lib/demo-data/work-orders-data";
import { initialCheckinsData } from "@/lib/demo-data/checkins-data";
import { initialMaterialsData } from "@/lib/demo-data/materials-data";
import { initialToolsData } from "@/lib/demo-data/tools-team-data";
import { initialInvoicesData, initialWarrantiesData } from "@/lib/demo-data/finance-deliveries-data";
import { initialVisionAnalyses } from "@/lib/demo-data/vision-simulation-data";

// Extensible registry for dynamic/new modules
const dynamicRegistry: SearchResultItem[] = [];

export function registerDynamicSearchItems(items: SearchResultItem[]): void {
  for (const item of items) {
    if (!dynamicRegistry.some((r) => r.id === item.id)) {
      dynamicRegistry.push(item);
    }
  }
}

export function getAllSystemPages(): SearchResultItem[] {
  return [
    {
      id: "page-home",
      title: "Centro de Comando (Dashboard)",
      subtitle: "Visão geral da oficina, tarefas ativas e alertas",
      category: "pages",
      categoryLabel: "Página",
      href: "/",
      badge: "Principal",
      badgeVariant: "gold",
      keywords: ["home", "dashboard", "inicio", "comando", "centro"],
    },
    {
      id: "page-my-day",
      title: "O Meu Dia (Área do Técnico)",
      subtitle: "Cronómetro de tarefa ativa, instruções e envio para QC",
      category: "pages",
      categoryLabel: "Página",
      href: "/my-day",
      badge: "Móvel",
      badgeVariant: "outline",
      keywords: ["meu dia", "tecnico", "tarefas", "cronometro", "trabalho"],
    },
    {
      id: "page-customers",
      title: "Clientes & Contactos",
      subtitle: "CRM de clientes particulares e histórico",
      category: "pages",
      categoryLabel: "Página",
      href: "/customers",
      keywords: ["clientes", "crm", "contactos", "proprietarios"],
    },
    {
      id: "page-b2b",
      title: "Portal Corporativo B2B",
      subtitle: "Gestão de stands, frotas e contas-correntes",
      category: "pages",
      categoryLabel: "Página",
      href: "/b2b",
      badge: "B2B",
      badgeVariant: "gold",
      keywords: ["b2b", "stands", "empresas", "frotas", "parceiros"],
    },
    {
      id: "page-vehicles",
      title: "Viaturas & Passaporte Digital",
      subtitle: "Catálogo de viaturas e fichas técnicas",
      category: "pages",
      categoryLabel: "Página",
      href: "/vehicles",
      keywords: ["viaturas", "carros", "veiculos", "matricula", "passaporte"],
    },
    {
      id: "page-quotes",
      title: "Orçamentos",
      subtitle: "Propostas comerciais com 3 opções e margens",
      category: "pages",
      categoryLabel: "Página",
      href: "/quotes",
      keywords: ["orcamentos", "propostas", "precos", "quotes"],
    },
    {
      id: "page-quotes-new",
      title: "Novo Orçamento (Configurador)",
      subtitle: "Criar nova proposta comercial 3-tier",
      category: "actions",
      categoryLabel: "Ação Rápida",
      href: "/quotes/new",
      badge: "Criar",
      badgeVariant: "gold",
      keywords: ["novo orcamento", "criar proposta", "calcular preco"],
    },
    {
      id: "page-calendar",
      title: "Agenda de Oficina",
      subtitle: "Planeamento visual por baias e marcações",
      category: "pages",
      categoryLabel: "Página",
      href: "/calendar",
      keywords: ["agenda", "calendario", "marcacoes", "baias"],
    },
    {
      id: "page-checkins",
      title: "Check-in de Entrada",
      subtitle: "Receção com 5 fotos, odómetro e danos",
      category: "pages",
      categoryLabel: "Página",
      href: "/checkins",
      keywords: ["checkin", "rececao", "fotos", "danos", "entrada"],
    },
    {
      id: "page-checkins-new",
      title: "Novo Check-in de Viatura",
      subtitle: "Iniciar receção fotográfica em 5 passos",
      category: "actions",
      categoryLabel: "Ação Rápida",
      href: "/checkins/new",
      badge: "Receção",
      badgeVariant: "gold",
      keywords: ["novo checkin", "receber carro", "tirar fotos"],
    },
    {
      id: "page-production",
      title: "Produção & Ordens de Trabalho",
      subtitle: "Kanban em 8 fases, tempos e controlo de qualidade",
      category: "pages",
      categoryLabel: "Página",
      href: "/production",
      keywords: ["producao", "ordens", "kanban", "fases", "trabalho"],
    },
    {
      id: "page-time-book",
      title: "X-Motion Time Book",
      subtitle: "Biblioteca técnica de benchmarks e tempos reais por peça",
      category: "pages",
      categoryLabel: "Página",
      href: "/time-book",
      badge: "Benchmarks",
      badgeVariant: "gold",
      keywords: ["time book", "benchmarks", "tempos reais", "produtividade", "mediana"],
    },
    {
      id: "page-vision",
      title: "X-Flow Vision Review",
      subtitle: "Análise inteligente de fotografias, deteção de danos e peças",
      category: "pages",
      categoryLabel: "Página",
      href: "/vision",
      badge: "IA",
      badgeVariant: "gold",
      keywords: ["vision", "ia", "inteligencia", "deteçao danos", "bounding box"],
    },
    {
      id: "page-simulator",
      title: "Simulador 3D de Acabamentos e Cores",
      subtitle: "Estúdio interativo de PPF, vinil, contraste e cobertura",
      category: "pages",
      categoryLabel: "Página",
      href: "/simulator",
      badge: "3D",
      badgeVariant: "gold",
      keywords: ["simulador", "cores", "3d", "acabamentos", "ppf", "wrap", "chrome delete"],
    },
    {
      id: "page-stock",
      title: "Stock & Materiais",
      subtitle: "Rolos, retalhos, lotes e consumíveis",
      category: "pages",
      categoryLabel: "Página",
      href: "/stock",
      keywords: ["stock", "rolos", "materiais", "lotes", "pelicula", "vinil"],
    },
    {
      id: "page-tools",
      title: "Ferramentas & Equipamentos",
      subtitle: "Máquinas, plotters e ferramentas com QR code",
      category: "pages",
      categoryLabel: "Página",
      href: "/tools",
      keywords: ["ferramentas", "equipamentos", "plotter", "scangrip", "qr code"],
    },
    {
      id: "page-team",
      title: "Equipa & Técnicos",
      subtitle: "Instaladores especializados e certificações",
      category: "pages",
      categoryLabel: "Página",
      href: "/team",
      keywords: ["equipa", "tecnicos", "instaladores", "colaboradores"],
    },
    {
      id: "page-deliveries",
      title: "Entregas & Levantamento",
      subtitle: "Assinatura digital de entrega e conferência de pertences",
      category: "pages",
      categoryLabel: "Página",
      href: "/deliveries",
      keywords: ["entregas", "levantamento", "assinatura", "devolucao"],
    },
    {
      id: "page-invoices",
      title: "Faturação Fiscal",
      subtitle: "Faturas, IVA a 23% e liquidações",
      category: "pages",
      categoryLabel: "Página",
      href: "/invoices",
      keywords: ["faturacao", "faturas", "iva", "recibos", "pagamentos"],
    },
    {
      id: "page-warranties",
      title: "Garantias Digitais",
      subtitle: "Certificados de fábrica de 10 anos e guias de manutenção",
      category: "pages",
      categoryLabel: "Página",
      href: "/warranties",
      keywords: ["garantias", "certificados", "cuidados", "revisao"],
    },
    {
      id: "page-reports",
      title: "Relatórios & Rentabilidade",
      subtitle: "Margens reais, eficiência e faturação mensal",
      category: "pages",
      categoryLabel: "Página",
      href: "/reports",
      keywords: ["relatorios", "margens", "kpis", "rentabilidade", "lucro"],
    },
    {
      id: "page-settings",
      title: "Configurações da Oficina",
      subtitle: "Preços de hora, parâmetros fiscais e preferências",
      category: "pages",
      categoryLabel: "Página",
      href: "/settings",
      keywords: ["configuracoes", "definicoes", "taxas", "oficina"],
    },
    {
      id: "page-design-system",
      title: "Design System X-Flow",
      subtitle: "Catálogo de componentes canónicos e paleta de cores",
      category: "pages",
      categoryLabel: "Página",
      href: "/design-system",
      keywords: ["design system", "componentes", "botoes", "mockup"],
    },
  ];
}

export function buildGlobalSearchIndex(): SearchResultItem[] {
  const items: SearchResultItem[] = [];

  // 1. Pages & Quick Actions
  items.push(...getAllSystemPages());

  // 2. Vehicles
  for (const v of initialVehiclesData) {
    items.push({
      id: `v-${v.id}`,
      title: `${v.make} ${v.model} (${v.plateDisplay})`,
      subtitle: `Cor: ${v.originalColorName} • Ano: ${v.generationYear} • VIN: ${v.vin || "N/D"}`,
      category: "vehicles",
      categoryLabel: "Viatura",
      href: `/vehicles/${v.id}`,
      badge: v.plateDisplay,
      badgeVariant: "gold",
      keywords: [
        v.plateDisplay,
        v.plateNormalized,
        v.make,
        v.model,
        v.originalColorName,
        v.vin || "",
      ],
    });
  }

  // 3. Customers
  for (const c of initialCustomersData) {
    const isCompany = c.type === "business";
    items.push({
      id: `c-${c.id}`,
      title: c.name,
      subtitle: `Tel: ${c.phone} • Email: ${c.email || "N/D"} • NIF: ${c.nif || "N/D"}`,
      category: "customers",
      categoryLabel: isCompany ? "Parceiro B2B" : "Cliente",
      href: isCompany ? `/b2b` : `/customers/${c.id}`,
      badge: isCompany ? "B2B" : "Particular",
      badgeVariant: isCompany ? "gold" : "outline",
      keywords: [c.name, c.phone, c.email || "", c.nif || "", c.legalName || ""],
    });
  }

  // 4. Quotes
  for (const q of initialQuotesData) {
    items.push({
      id: `q-${q.id}`,
      title: `Orçamento ${q.quoteNumber} — ${q.vehiclePlate}`,
      subtitle: `Cliente: ${q.customerName} • ${q.vehicleModel} • Estado: ${q.status}`,
      category: "quotes",
      categoryLabel: "Orçamento",
      href: `/quotes/${q.id}`,
      badge: q.quoteNumber,
      badgeVariant: q.status === "approved" ? "success" : "gold",
      keywords: [q.quoteNumber, q.vehiclePlate, q.customerName, q.vehicleModel, q.status],
    });
  }

  // 5. Work Orders (Production)
  for (const wo of initialWorkOrdersData) {
    items.push({
      id: `wo-${wo.id}`,
      title: `Ordem de Trabalho ${wo.workOrderNumber} — ${wo.vehiclePlate}`,
      subtitle: `${wo.vehicleModel} • Serviço: ${wo.serviceTitle} • Técnico: ${wo.primaryTechnicianName}`,
      category: "production",
      categoryLabel: "Produção",
      href: `/production/${wo.id}`,
      badge: wo.workOrderNumber,
      badgeVariant: "in_progress",
      keywords: [wo.workOrderNumber, wo.vehiclePlate, wo.vehicleModel, wo.serviceTitle, wo.primaryTechnicianName],
    });
  }

  // 6. Check-ins
  for (const chk of initialCheckinsData) {
    items.push({
      id: `chk-${chk.id}`,
      title: `Check-in ${chk.vehiclePlate} (${chk.vehicleModel})`,
      subtitle: `Quilometragem: ${chk.mileage.toLocaleString()} km • Data: ${chk.createdAt}`,
      category: "checkins",
      categoryLabel: "Check-in",
      href: `/checkins/${chk.id}`,
      badge: "Check-in",
      badgeVariant: "outline",
      keywords: [chk.vehiclePlate, chk.vehicleModel, chk.customerName, chk.token || ""],
    });
  }

  // 7. Stock Materials
  for (const m of initialMaterialsData) {
    const firstBatch = m.batches?.[0]?.batchNumber || "Lote-Geral";
    items.push({
      id: `mat-${m.id}`,
      title: `${m.name} (Lote: ${firstBatch})`,
      subtitle: `Disponível: ${m.currentStockMeters}m • Largura: ${m.rollWidthMeters}m • Tipo: ${m.type}`,
      category: "stock",
      categoryLabel: "Material",
      href: `/stock`,
      badge: firstBatch,
      badgeVariant: m.currentStockMeters < 20 ? "danger" : "outline",
      keywords: [m.name, firstBatch, m.type, m.brand, m.supplierName || ""],
    });
  }

  // 8. Invoices
  for (const inv of initialInvoicesData) {
    items.push({
      id: `inv-${inv.id}`,
      title: `Fatura ${inv.invoiceNumber} — ${inv.totalAmount.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}`,
      subtitle: `Cliente: ${inv.customerName} • NIF: ${inv.customerNif} • Estado: ${inv.paymentStatus}`,
      category: "invoices",
      categoryLabel: "Fatura",
      href: `/invoices/${inv.id}`,
      badge: inv.invoiceNumber,
      badgeVariant: inv.paymentStatus === "paid" ? "success" : "gold",
      keywords: [inv.invoiceNumber, inv.customerName, inv.customerNif, inv.paymentStatus],
    });
  }

  // 9. Warranties
  for (const w of initialWarrantiesData) {
    items.push({
      id: `w-${w.id}`,
      title: `Garantia ${w.certificateNumber} — ${w.vehiclePlate}`,
      subtitle: `Material: ${w.materialName} (Lote: ${w.batchNumber}) • Cobertura: ${w.warrantyYears} Anos`,
      category: "warranties",
      categoryLabel: "Garantia",
      href: `/warranties/${w.id}`,
      badge: w.certificateNumber,
      badgeVariant: "success",
      keywords: [w.certificateNumber, w.vehiclePlate, w.materialName, w.batchNumber, w.customerName],
    });
  }

  // 10. Vision Analyses
  for (const vis of initialVisionAnalyses) {
    items.push({
      id: `vis-${vis.id}`,
      title: `Análise Vision — ${vis.vehiclePlate} (${vis.vehicleMake} ${vis.vehicleModel})`,
      subtitle: `Cor: ${vis.originalColorName} • Danos: ${vis.damageSuggestions.length} • Confiança: ${Math.round(vis.vehicleConfidence * 100)}%`,
      category: "vision",
      categoryLabel: "Vision IA",
      href: `/vision/${vis.id}`,
      badge: "Vision",
      badgeVariant: "gold",
      keywords: [vis.vehiclePlate, vis.vehicleMake, vis.vehicleModel, vis.originalColorName, "vision"],
    });
  }

  // 11. Tools
  for (const t of initialToolsData) {
    items.push({
      id: `tool-${t.id}`,
      title: `${t.name} (QR: ${t.qrCode})`,
      subtitle: `Categoria: ${t.category} • Estado: ${t.status} • Local: ${t.location}`,
      category: "tools",
      categoryLabel: "Ferramenta",
      href: `/tools`,
      badge: t.qrCode,
      badgeVariant: "outline",
      keywords: [t.name, t.qrCode, t.category, t.location],
    });
  }

  // 12. Dynamic registered items
  items.push(...dynamicRegistry);

  return items;
}

function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function searchGlobalIndex(
  query: string,
  categoryFilter: SearchCategory | "all" = "all"
): SearchResultItem[] {
  if (!query || query.trim().length === 0) {
    // Return recommended quick actions and key pages when search is empty
    return getAllSystemPages().slice(0, 8);
  }

  const rawQuery = query.toLowerCase().trim();
  const normalizedQuery = normalizeSearchText(query);
  const allItems = buildGlobalSearchIndex();

  const results = allItems.filter((item) => {
    // Category filter
    if (categoryFilter !== "all" && item.category !== categoryFilter) {
      return false;
    }

    // Direct title/subtitle search
    if (
      item.title.toLowerCase().includes(rawQuery) ||
      item.subtitle.toLowerCase().includes(rawQuery)
    ) {
      return true;
    }

    // Normalized search (matches license plates like 44TX88, phone numbers, etc.)
    const normalizedTitle = normalizeSearchText(item.title);
    const normalizedSubtitle = normalizeSearchText(item.subtitle);

    if (
      normalizedTitle.includes(normalizedQuery) ||
      normalizedSubtitle.includes(normalizedQuery)
    ) {
      return true;
    }

    // Keyword search
    const hasKeywordMatch = item.keywords.some((kw) => {
      const kwLower = kw.toLowerCase();
      const kwNorm = normalizeSearchText(kw);
      return (
        kwLower.includes(rawQuery) ||
        (normalizedQuery.length >= 2 && kwNorm.includes(normalizedQuery))
      );
    });

    return hasKeywordMatch;
  });

  return results.slice(0, 15);
}
