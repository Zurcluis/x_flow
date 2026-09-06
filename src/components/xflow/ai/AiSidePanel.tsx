"use client";

import React, { useState } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AiSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  linkHref?: string;
  linkLabel?: string;
  timestamp: string;
}

let msgIdCounter = 100;

export function AiSidePanel({ isOpen, onClose }: AiSidePanelProps) {
  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-1",
      sender: "ai",
      text: "Olá, Luís! Sou o X-Flow AI Assistant. Posso analisar dados de faturação, produtividade no Time Book, disponibilidade de stock e estado das viaturas na oficina. Em que te posso ajudar?",
      timestamp: "Agora",
    },
  ]);

  if (!isOpen) return null;

  const quickQuestions = [
    {
      label: "Faturação do Mês",
      query: "Quanto faturámos este mês?",
      response: "Neste mês de Agosto de 2026, a faturação acumulada totaliza €11 070,00 (€9 000,00 de incidência + €2 070,00 de IVA a 23%). Todas as 3 faturas emitidas foram 100% liquidadas (FT 2026/042, FT 2026/040, FT 2026/039).",
      linkHref: "/invoices",
      linkLabel: "Ver Faturação",
    },
    {
      label: "Margem Real dos PPF",
      query: "Qual é a margem real dos trabalhos de PPF?",
      response: "A margem bruta média dos serviços de Full PPF é de 64,3% (faturação de €49 000,00 com custo direto de €17 500,00 a €33/h base). Nos PPFs frontais a margem atinge os 70,0%.",
      linkHref: "/reports",
      linkLabel: "Ver Relatório de Margens",
    },
    {
      label: "Stock de Stek DYNOshield",
      query: "Qual é a disponibilidade de película Stek?",
      response: "Temos o Lote STEK-DS-2026-04 com 18,0 m disponíveis na Sala de Corte (15,0 m restantes no rolo ativo após conclusão do BMW M4). Sem ruturas previstas para a próxima semana.",
      linkHref: "/stock",
      linkLabel: "Consultar Stock",
    },
  ];

  const handleSend = (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${++msgIdCounter}`,
      sender: "user",
      text: q,
      timestamp: "Agora",
    };

    let aiAnswer = "Analisei a base operacional do X-Flow: Todas as ordens de trabalho estão dentro dos prazos prometidos e as viaturas têm 100% de conformidade técnica.";
    let linkHref: string | undefined;
    let linkLabel: string | undefined;

    const lower = q.toLowerCase();
    if (lower.includes("fatur") || lower.includes("dinheiro") || lower.includes("receita")) {
      aiAnswer = "A faturação mensal atingiu €11 070,00 com taxa de cobrança de 100%. A margem líquida calculada é de 65,8%.";
      linkHref = "/invoices";
      linkLabel = "Abrir Faturação";
    } else if (lower.includes("margem") || lower.includes("lucro")) {
      aiAnswer = "A margem real média da oficina é de 65,8% (€33,00/h de custo de mão de obra base). O serviço mais rentável é o Chrome Delete (74% de margem), seguido do PPF (64,3%).";
      linkHref = "/reports";
      linkLabel = "Ver Relatório";
    } else if (lower.includes("stock") || lower.includes("pelicula") || lower.includes("rolo") || lower.includes("stek")) {
      aiAnswer = "O stock de película Stek DYNOshield Gloss está saudável com o lote STEK-DS-2026-04 em stock ativo. Temos também vinil 3M 2080 Satin Dark Grey disponível.";
      linkHref = "/stock";
      linkLabel = "Ver Stock";
    } else if (lower.includes("time") || lower.includes("tempo") || lower.includes("hora") || lower.includes("rs6")) {
      aiAnswer = "No X-Motion Time Book, o Audi RS6 tem estimativa inicial de 34,5h baseada na amostra de 8h. O BMW M4 tem um benchmark fiável com 18 amostras e mediana de 33,0h de aplicação.";
      linkHref = "/time-book";
      linkLabel = "Consultar Time Book";
    }

    const aiMsg: ChatMessage = {
      id: `ai-${++msgIdCounter}`,
      sender: "ai",
      text: aiAnswer,
      linkHref,
      linkLabel,
      timestamp: "Agora",
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInputQuery("");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0a0d0e] border-l border-white/[0.08] shadow-2xl flex flex-col justify-between h-full text-xs text-[#f1ede5]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-[#101314]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-gradient-to-br from-[#d3a548] to-[#f7d46d] text-[#050606] shadow">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-[#f1ede5]">X-Flow AI</span>
                <span className="text-[11px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#d3a548]/15 text-[#f7d46d] font-bold">
                  Consultor
                </span>
              </div>
              <span className="text-[11px] text-[#8a9092]">
                Inteligência Operacional Determinística
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-sm text-[#8a9092] hover:text-[#f1ede5] hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Queries Bar */}
        <div className="p-3 bg-[#0c1012] border-b border-white/[0.04] flex flex-col gap-1.5">
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#8a9092]">
            Perguntas Rápidas Sugeridas:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q.query)}
                className="px-2.5 py-1 rounded-sm bg-[#15191a] border border-white/[0.06] hover:border-[#d3a548]/50 text-[12px] text-[#a9adae] hover:text-[#f7d46d] transition-all text-left cursor-pointer"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "ai" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#15191a] border border-white/[0.08] text-[#d3a548]">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] p-3.5 rounded-md leading-relaxed text-xs ${
                  msg.sender === "user"
                    ? "bg-[#d3a548] text-[#050606] font-medium rounded-br-none"
                    : "bg-[#15191a] border border-white/[0.06] text-[#f1ede5] rounded-bl-none shadow"
                }`}
              >
                <p>{msg.text}</p>

                {msg.linkHref && (
                  <Link
                    href={msg.linkHref}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 mt-2.5 pt-2 border-t border-white/[0.08] text-[12px] font-bold text-[#f7d46d] hover:underline"
                  >
                    <span>{msg.linkLabel}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Footer */}
        <div className="p-3 border-t border-white/[0.08] bg-[#101314]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Pergunta sobre orçamentos, viaturas, stock..."
              className="flex-1 h-10 px-3.5 rounded-md bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] placeholder-[#8a9092] outline-none"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="h-10 px-3.5 bg-[#d3a548] text-[#050606]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
