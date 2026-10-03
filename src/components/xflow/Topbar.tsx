"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Camera,
  FileText,
  Calendar,
  Bell,
  ChevronDown,
  Sparkles,
  Search,
  LogOut,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiSidePanel } from "@/components/xflow/ai/AiSidePanel";
import { CommandPaletteModal } from "@/components/xflow/search/CommandPaletteModal";
import { initialDashboardData } from "@/lib/demo-data/dashboard-data";
import { logoutAction } from "@/app/actions/auth";
import type { OrganizationRole } from "@/server/auth";
import { cn } from "@/lib/utils";

export interface ShellUser {
  name: string;
  email: string;
  role: OrganizationRole;
}

const ROLE_LABELS: Record<OrganizationRole, string> = {
  admin: "Administrador",
  workshop_manager: "Gestor de Oficina",
  technician: "Técnico",
  customer: "Cliente",
  b2b_user: "Utilizador B2B",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "X";
}

interface TopbarProps {
  unreadCount?: number;
  user?: ShellUser | null;
}

export function Topbar({
  unreadCount = initialDashboardData.user.unreadNotifications,
  user = null,
}: TopbarProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="flex items-center justify-between gap-4 pt-6 pb-4 border-b border-white/[0.04]">
        {/* Search Omnibox Trigger */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-md bg-[#101314] border border-white/[0.08] hover:border-[#d3a548]/50 text-xs text-[#8a9092] hover:text-[#f1ede5] transition-all cursor-pointer w-full max-w-72 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-[#8a9092]" />
            <span>Pesquisar...</span>
          </div>
          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.06] text-[11px] text-[#a9adae] font-mono border border-white/[0.06]">
            <span>⌘</span>
            <span>K</span>
          </kbd>
        </button>

        {/* Actions & Profile */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Ask AI Button */}
          <button
            type="button"
            onClick={() => setAiPanelOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-gradient-to-r from-[#d3a548]/20 to-[#f7d46d]/20 border border-[#d3a548]/40 hover:border-[#d3a548] text-xs font-bold text-[#f7d46d] hover:bg-[#d3a548]/30 transition-all cursor-pointer shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Pergunta ao X-Flow AI</span>
          </button>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <Link href="/checkins/new">
              <Button
                variant="outline"
                size="sm"
                className="bg-[#101314]/80 border-white/10 hover:border-[#d3a548]/60 text-xs text-[#f1ede5] font-medium h-9 px-3.5 rounded-sm"
              >
                <Camera className="h-3.5 w-3.5 text-[#a9adae]" />
                <span>Novo Check-in</span>
              </Button>
            </Link>

            <Link href="/quotes/new">
              <Button
                variant="outline"
                size="sm"
                className="bg-[#101314]/80 border-white/10 hover:border-[#d3a548]/60 text-xs text-[#f1ede5] font-medium h-9 px-3.5 rounded-sm"
              >
                <FileText className="h-3.5 w-3.5 text-[#a9adae]" />
                <span>Novo Orçamento</span>
              </Button>
            </Link>

            <Link href="/calendar">
              <Button
                variant="outline"
                size="sm"
                className="bg-[#101314]/80 border-white/10 hover:border-[#d3a548]/60 text-xs text-[#f1ede5] font-medium h-9 px-3.5 rounded-sm"
              >
                <Calendar className="h-3.5 w-3.5 text-[#a9adae]" />
                <span>Nova Marcação</span>
              </Button>
            </Link>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-6 w-px bg-white/10 mx-1" />

          {/* Notifications & User Pill */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button
              className="relative p-2 rounded-full text-[#a9adae] hover:text-[#f1ede5] hover:bg-white/[0.04] transition-colors cursor-pointer"
              aria-label={`Notificações: ${unreadCount} não lidas`}
            >
              <Bell className="h-5 w-5 stroke-[1.75]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#d3a548] text-[11px] font-bold text-[#050606]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Pill */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className={cn(
                    "flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-full bg-[#15191a] border transition-all cursor-pointer select-none",
                    profileOpen ? "border-[#d3a548]/50" : "border-white/[0.08] hover:border-white/20"
                  )}
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e7c77c]/20 text-xs font-bold text-[#f7d46d] border border-[#d3a548]/40">
                    {getInitials(user.name)}
                  </div>
                  <div className="flex flex-col text-left pr-1">
                    <span className="text-xs font-semibold text-[#f1ede5] leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[11px] text-[#8a9092] leading-tight">
                      {ROLE_LABELS[user.role]}
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-[#8a9092] transition-transform",
                      profileOpen && "rotate-180"
                    )}
                  />
                </button>

                {profileOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-60 rounded-md bg-[#101314] border border-white/[0.12] p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.55)] z-50 flex flex-col gap-0.5"
                  >
                    <div className="px-3 py-2.5 border-b border-white/[0.06] flex flex-col">
                      <span className="text-xs font-semibold text-[#f1ede5] leading-tight">
                        {user.name}
                      </span>
                      <span className="text-[11px] text-[#8a9092] leading-tight mt-0.5">
                        {user.email}
                      </span>
                    </div>
                    <form action={logoutAction}>
                      <button
                        type="submit"
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-xs text-[#a9adae] hover:text-[#f05a50] hover:bg-white/[0.04] transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Terminar sessão</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <div className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-[#15191a] border border-white/[0.08] hover:border-[#d3a548]/50 transition-all cursor-pointer select-none">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e7c77c]/20 text-[#f7d46d] border border-[#d3a548]/40">
                    <LogIn className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-[#f1ede5]">Entrar</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Interactive AI Drawer */}
      <AiSidePanel isOpen={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />

      {/* Global Command Palette Modal */}
      <CommandPaletteModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
