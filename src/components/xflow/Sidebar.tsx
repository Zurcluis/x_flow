"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Car,
  FileText,
  Calendar,
  Layers,
  ClipboardCheck,
  Package,
  Wrench,
  UserCheck,
  ShieldCheck,
  BarChart2,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Key,
  CreditCard,
  Building2,
  Clock,
  CheckSquare,
  ScanSearch,
  Box,
  Palette,
  Monitor,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/xflow/Logo";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const MAIN_NAV: NavItem[] = [
  { label: "Centro de Comando", href: "/", icon: LayoutDashboard },
  { label: "O Meu Dia", href: "/my-day", icon: CheckSquare },
];

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Operação",
    items: [
      { label: "Agenda", href: "/calendar", icon: Calendar },
      { label: "Produção", href: "/production", icon: Layers },
      { label: "Time Book", href: "/time-book", icon: Clock },
      { label: "Check-in", href: "/checkins", icon: ClipboardCheck },
      { label: "X-Flow Vision", href: "/vision", icon: ScanSearch },
      { label: "Simulador 3D", href: "/simulator", icon: Box },
      { label: "Stock e Materiais", href: "/stock", icon: Package },
      { label: "Ferramentas", href: "/tools", icon: Wrench },
    ],
  },
  {
    label: "Negócio",
    items: [
      { label: "Clientes", href: "/customers", icon: Users },
      { label: "Viaturas", href: "/vehicles", icon: Car },
      { label: "Orçamentos", href: "/quotes", icon: FileText },
      { label: "Portal B2B", href: "/b2b", icon: Building2 },
      { label: "Entregas", href: "/deliveries", icon: Key },
    ],
  },
  {
    label: "Gestão",
    items: [
      { label: "Equipa", href: "/team", icon: UserCheck },
      { label: "Faturação", href: "/invoices", icon: CreditCard },
      { label: "Garantias", href: "/warranties", icon: ShieldCheck },
      { label: "Relatórios", href: "/reports", icon: BarChart2 },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Configurações", href: "/settings", icon: Settings },
      { label: "Painel Oficina", href: "/shop-floor", icon: Monitor },
      { label: "Design System", href: "/design-system", icon: Palette },
    ],
  },
];

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive =
    pathname === item.href ||
    (item.href !== "/" && (pathname?.startsWith(item.href + "/") || false));

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-[0_2px_12px_rgba(211,165,72,0.12)] font-semibold"
          : "text-[#a9adae] hover:text-[#f1ede5] hover:bg-white/[0.04] border border-transparent"
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 stroke-[1.75]",
          isActive ? "text-[#d3a548]" : "text-[#8a9092] group-hover:text-[#f1ede5]"
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r border-white/[0.08] bg-[#080a0b] py-5 transition-all duration-300 select-none z-30 shrink-0",
        collapsed ? "w-[80px] px-2.5" : "w-[240px] px-4"
      )}
      aria-label="Navegação Principal"
    >
      {/* Logo Container */}
      <div className={cn("flex items-center pb-2 px-1 shrink-0", collapsed && "justify-center")}>
        <Link href="/" aria-label="X-Flow Centro de Comando">
          <Logo variant={collapsed ? "symbol" : "full"} size="md" />
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto mt-4 pr-1">
        {MAIN_NAV.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} />
        ))}

        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="flex flex-col gap-1 pt-4 mt-1 border-t border-white/[0.04]">
            {collapsed ? null : (
              <span className="px-3 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#8a9092]">
                {section.label}
              </span>
            )}
            {section.items.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse Action */}
      <div className="pt-4 border-t border-white/[0.04] shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex w-full items-center gap-3 rounded-sm px-3 py-2 text-xs font-medium text-[#8a9092] hover:bg-white/[0.04] hover:text-[#f1ede5] transition-colors cursor-pointer",
            collapsed && "justify-center"
          )}
          aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </aside>
  );
}
