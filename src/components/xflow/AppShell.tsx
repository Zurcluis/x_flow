"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  Camera,
  Layers,
  Menu,
  X,
} from "lucide-react";
import { Sidebar, MAIN_NAV, NAV_SECTIONS, type NavItem } from "@/components/xflow/Sidebar";
import { Topbar } from "@/components/xflow/Topbar";
import { Logo } from "@/components/xflow/Logo";
import { cn } from "@/lib/utils";

function DrawerLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-xl text-base font-medium transition-colors",
        isActive
          ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40"
          : "text-[#a9adae] hover:bg-white/[0.04] hover:text-[#f1ede5]"
      )}
    >
      <Icon className="h-5 w-5 text-[#d3a548]" />
      <span>{item.label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If public standalone route (like client portal, quote approval, reception report, QC certificate, warranty certificate, or passport), don't render workshop shell
  if (
    pathname.startsWith("/portal/") ||
    pathname.startsWith("/quotes/public/") ||
    pathname.startsWith("/checkins/report/") ||
    pathname.startsWith("/qc/certificate/") ||
    pathname.startsWith("/warranties/certificate/") ||
    pathname.startsWith("/passport/") ||
    pathname === "/shop-floor" ||
    pathname === "/login"
  ) {
    return <main className="min-h-screen bg-[#050606] text-[#f1ede5]">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-[#050606] text-[#f1ede5] antialiased">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-x-hidden">
        {/* Mobile Header (< 1024px) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#080a0b] sticky top-0 z-40">
          <Link href="/" aria-label="X-Flow Início">
            <Logo variant="full" size="sm" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#a9adae] hover:text-[#f1ede5] hover:bg-white/[0.05] cursor-pointer"
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile Fullscreen Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-[#050606]/95 backdrop-blur-md flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
              <Logo variant="full" size="md" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-[#a9adae] hover:text-[#f1ede5] cursor-pointer"
                aria-label="Fechar menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-col py-6 overflow-y-auto">
              {MAIN_NAV.map((item) => (
                <DrawerLink key={item.href} item={item} onNavigate={() => setMobileMenuOpen(false)} />
              ))}
              {NAV_SECTIONS.map((section) => (
                <div key={section.label} className="flex flex-col gap-1 pt-5 mt-1 border-t border-white/[0.08]">
                  <span className="px-4 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#8a9092]">
                    {section.label}
                  </span>
                  {section.items.map((item) => (
                    <DrawerLink key={item.href} item={item} onNavigate={() => setMobileMenuOpen(false)} />
                  ))}
                </div>
              ))}
            </nav>
          </div>
        )}

        {/* Global Topbar — pesquisa, IA, ações rápidas e perfil (desktop) */}
        <div className="hidden lg:block px-4 sm:px-6 lg:px-8 max-w-[1680px] w-full mx-auto">
          <Topbar />
        </div>

        {/* Page Inner Container */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-[1680px] w-full mx-auto pb-20 lg:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation (< 768px) */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080a0b]/95 backdrop-blur-md border-t border-white/[0.08] px-2 py-1.5 flex items-center justify-around"
          aria-label="Navegação Rápida Móvel"
        >
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg text-[11px] font-medium min-w-[56px]",
              pathname === "/" ? "text-[#f7d46d]" : "text-[#8a9092] hover:text-[#f1ede5]"
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Início</span>
          </Link>
          <Link
            href="/vehicles"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg text-[11px] font-medium min-w-[56px]",
              pathname === "/vehicles" ? "text-[#f7d46d]" : "text-[#8a9092] hover:text-[#f1ede5]"
            )}
          >
            <Car className="h-5 w-5" />
            <span>Viaturas</span>
          </Link>
          <Link
            href="/checkins/new"
            className="flex flex-col items-center gap-1 p-1 -mt-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-[#d3a548] to-[#a77c2e] text-[#050606] shadow-[0_4px_16px_rgba(211,165,72,0.4)] border-2 border-[#050606]">
              <Camera className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-bold text-[#f7d46d]">Check-in</span>
          </Link>
          <Link
            href="/production"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg text-[11px] font-medium min-w-[56px]",
              pathname === "/production" ? "text-[#f7d46d]" : "text-[#8a9092] hover:text-[#f1ede5]"
            )}
          >
            <Layers className="h-5 w-5" />
            <span>Produção</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-[11px] font-medium text-[#8a9092] hover:text-[#f1ede5] min-w-[56px] cursor-pointer"
          >
            <Menu className="h-5 w-5" />
            <span>Mais</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
