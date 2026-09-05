"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Car,
  Users,
  FileText,
  Layers,
  ClipboardCheck,
  Package,
  Wrench,
  CreditCard,
  ShieldCheck,
  Eye,
  ArrowRight,
  Command,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  searchGlobalIndex,
} from "@/domains/search/global-search-engine";
import { SearchResultItem, SearchCategory } from "@/domains/search/types";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_TABS: { id: SearchCategory | "all"; label: string }[] = [
  { id: "all", label: "Tudo" },
  { id: "vehicles", label: "Viaturas" },
  { id: "customers", label: "Clientes" },
  { id: "quotes", label: "Orçamentos" },
  { id: "production", label: "Produção" },
  { id: "stock", label: "Stock" },
  { id: "pages", label: "Páginas" },
];

function CommandPaletteDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SearchCategory | "all">("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = searchGlobalIndex(query, activeCategory);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSelectResult = React.useCallback(
    (item: SearchResultItem) => {
      onClose();
      router.push(item.href);
    },
    [onClose, router]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        handleSelectResult(results[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [results, selectedIndex, handleSelectResult, onClose]);

  const getCategoryIcon = (category: SearchCategory) => {
    switch (category) {
      case "vehicles":
        return <Car className="h-4 w-4 text-[#d3a548]" />;
      case "customers":
        return <Users className="h-4 w-4 text-[#f7d46d]" />;
      case "quotes":
        return <FileText className="h-4 w-4 text-[#d3a548]" />;
      case "production":
        return <Layers className="h-4 w-4 text-[#d3a548]" />;
      case "checkins":
        return <ClipboardCheck className="h-4 w-4 text-[#68a46b]" />;
      case "stock":
        return <Package className="h-4 w-4 text-[#d3a548]" />;
      case "tools":
        return <Wrench className="h-4 w-4 text-[#a9adae]" />;
      case "invoices":
        return <CreditCard className="h-4 w-4 text-[#68a46b]" />;
      case "warranties":
        return <ShieldCheck className="h-4 w-4 text-[#68a46b]" />;
      case "vision":
        return <Eye className="h-4 w-4 text-[#d3a548]" />;
      case "actions":
      case "pages":
      default:
        return <Command className="h-4 w-4 text-[#a9adae]" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[#050606]/80 backdrop-blur-md transition-all animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0c0f10] border border-white/[0.12] rounded-[20px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-white/[0.08]">
          <Search className="h-5 w-5 text-[#d3a548] shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Pesquisar por cliente, matrícula, orçamento, lote, ferramenta ou página..."
            className="w-full bg-transparent text-sm sm:text-base text-[#f1ede5] placeholder-[#8a9092] outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-full text-[#8a9092] hover:text-[#f1ede5] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.06] text-[11px] text-[#a9adae] font-mono">
              <span>ESC</span>
            </div>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-[#080a0b] border-b border-white/[0.04] overflow-x-auto">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveCategory(tab.id);
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === tab.id
                  ? "bg-[#d3a548] text-[#050606]"
                  : "bg-white/[0.03] text-[#a9adae] hover:bg-white/[0.06] hover:text-[#f1ede5]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 flex flex-col gap-1 max-h-[50vh]">
          {results.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-[#8a9092]">
              <Search className="h-8 w-8 text-[#8a9092]/60" />
              <span className="text-xs">
                Nenhum resultado encontrado para &quot;{query}&quot;
              </span>
            </div>
          ) : (
            results.map((item, index) => {
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectResult(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3 rounded-[12px] flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#1f1b14] border border-[#d3a548]/40 text-[#f1ede5]"
                      : "bg-transparent hover:bg-white/[0.03] text-[#a9adae]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] ${
                        isSelected ? "bg-[#d3a548]/20" : "bg-white/[0.04]"
                      }`}
                    >
                      {getCategoryIcon(item.category)}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold text-xs sm:text-sm truncate ${
                            isSelected ? "text-[#f7d46d]" : "text-[#f1ede5]"
                          }`}
                        >
                          {item.title}
                        </span>
                        {item.badge && (
                          <Badge
                            variant={item.badgeVariant || "outline"}
                            className="text-[11px] px-1.5 py-0 uppercase font-mono shrink-0"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>

                      <span className="text-[12px] text-[#a9adae] truncate mt-0.5">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] uppercase tracking-wider text-[#8a9092] font-mono hidden sm:inline">
                      {item.categoryLabel}
                    </span>
                    <ArrowRight
                      className={`h-4 w-4 transition-transform ${
                        isSelected ? "translate-x-0.5 text-[#d3a548]" : "text-[#8a9092]"
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-[#080a0b] border-t border-white/[0.04] flex items-center justify-between text-[12px] text-[#8a9092]">
          <div className="flex items-center gap-3">
            <span>↑↓ para navegar</span>
            <span>↵ para abrir</span>
            <span>ESC para fechar</span>
          </div>
          <span>X-Flow Global Search Engine</span>
        </div>
      </div>
    </div>
  );
}

export function CommandPaletteModal({ isOpen, onClose }: CommandPaletteModalProps) {
  if (!isOpen) return null;
  return <CommandPaletteDialog onClose={onClose} />;
}
