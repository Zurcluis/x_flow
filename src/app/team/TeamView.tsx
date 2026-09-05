"use client";

import React, { useState } from "react";
import {
  Users,
  Award,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamMemberFormModal } from "@/components/xflow/team/TeamMemberFormModal";

import { TeamMember } from "@/lib/demo-data/tools-team-data";

export function TeamView({ initialTeam }: { initialTeam: TeamMember[] }) {
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveMember = (member: TeamMember) => {
    setTeam([member, ...team]);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Equipa & Especialistas Técnicos
          </h1>
          <p className="text-xs text-[#a9adae]">
            Quadro operacional, instaladores certificados Stek/3M, atribuições em tempo real e eficiência técnica.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)} className="self-start sm:self-auto">
          <UserPlus className="h-4 w-4" />
          <span>Adicionar Colaborador</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Técnicos Ativos</span>
            <Users className="h-4 w-4 text-[#d3a548]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f1ede5]">
              {team.length} Especialistas
            </span>
            <span className="block text-[12px] text-[#68a46b] mt-0.5">
              100% com certificação oficial de fábrica
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Eficiência Média da Oficina</span>
            <TrendingUp className="h-4 w-4 text-[#68a46b]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#68a46b]">
              148%
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              Tempo real vs tempo previsto no Time Book
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Total de Trabalhos Concluídos</span>
            <Award className="h-4 w-4 text-[#f7d46d]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f7d46d]">
              1 570 OTs
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              Histórico acumulado de excelência
            </span>
          </div>
        </Card>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {team.map((member) => (
          <Card
            key={member.id}
            className="flex flex-col justify-between p-6 bg-[#101314] border border-white/[0.06] hover:border-[#d3a548]/40 transition-all duration-200"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#d3a548]/15 border border-[#d3a548]/30 font-bold text-base text-[#f7d46d]">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-[#f1ede5]">{member.name}</h3>
                      <Badge variant="gold" className="text-[11px]">
                        {member.level}
                      </Badge>
                    </div>
                    <span className="text-xs text-[#d3a548] font-medium mt-0.5">
                      {member.role}
                    </span>
                  </div>
                </div>

                <Badge
                  variant={member.status === "disponivel" ? "success" : "in_progress"}
                  className="text-[11px]"
                >
                  {member.status === "disponivel" ? "Disponível" : "Em Trabalho"}
                </Badge>
              </div>

              <div className="flex flex-col gap-2 p-3.5 rounded-[12px] bg-[#15191a] border border-white/[0.03] text-xs">
                <div className="flex items-center justify-between text-[#a9adae]">
                  <span>Especialidade:</span>
                  <strong className="text-[#f1ede5]">{member.specialty}</strong>
                </div>

                <div className="flex items-center justify-between text-[#a9adae]">
                  <span>Eficiência Técnica:</span>
                  <strong className="text-[#68a46b] font-mono">{member.efficiencyRating}</strong>
                </div>

                {member.activeWorkOrder && (
                  <div className="flex items-center justify-between text-[#d3a548] pt-1.5 border-t border-white/[0.04]">
                    <span>Trabalho Ativo:</span>
                    <strong className="font-mono">{member.activeWorkOrder} · {member.activeVehicle}</strong>
                  </div>
                )}
              </div>

              {/* Certifications */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#8a9092]">
                  Certificações Oficiais:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {member.certifications.map((cert, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-[6px] bg-[#0c0f10] border border-white/[0.06] text-[12px] text-[#a9adae] font-medium"
                    >
                      ✓ {cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Team Member Modal */}
      <TeamMemberFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMember}
      />
    </div>
  );
}
