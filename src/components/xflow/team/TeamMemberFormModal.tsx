"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeamMember } from "@/lib/demo-data/tools-team-data";
import { createTeamMemberAction } from "@/app/actions/team";

interface TeamMemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: TeamMember) => void;
}

export function TeamMemberFormModal({
  isOpen,
  onClose,
  onSave,
}: TeamMemberFormModalProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [level, setLevel] = useState<TeamMember["level"]>("Assistente");
  const [status, setStatus] = useState<TeamMember["status"]>("disponivel");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [certifications, setCertifications] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("O nome do colaborador é obrigatório.");
      return;
    }
    if (!role.trim()) {
      setError("A função é obrigatória.");
      return;
    }
    setSaving(true);
    setError(null);

    const result = await createTeamMemberAction({
      name,
      role,
      specialty: specialty || "Geral",
      level,
      status,
      email: email || undefined,
      phone: phone || undefined,
      certifications: certifications
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    });

    if (result.ok) {
      onSave(result.member);
      onClose();
    } else {
      setError(result.error);
    }
    setSaving(false);
  };

  const inputClass =
    "h-10 px-3 rounded-sm bg-[#15191a] border border-white/[0.08] text-sm text-[#f1ede5] w-full";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050606]/85 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-lg rounded-[18px] bg-[#101314] border border-white/[0.12] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.6)] text-[#f1ede5] my-8"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <h2 className="text-lg font-bold">Novo Colaborador</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-5 w-5 text-[#a9adae]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
            Nome Completo *
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="ex: Bernardo Silva"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
              Função *
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={inputClass}
                placeholder="ex: Instalador PPF"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
              Especialidade
              <input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className={inputClass}
                placeholder="ex: PPF Integral e Detalhes"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
              Nível
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as TeamMember["level"])}
                className={inputClass + " cursor-pointer"}
              >
                <option value="Master">Master</option>
                <option value="Sénior">Sénior</option>
                <option value="Especialista">Especialista</option>
                <option value="Assistente">Assistente</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
              Estado
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TeamMember["status"])}
                className={inputClass + " cursor-pointer"}
              >
                <option value="disponivel">Disponível</option>
                <option value="em_trabalho">Em Trabalho</option>
                <option value="ausente">Ausente</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="colaborador@xmotion.pt"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
              Telefone
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="912 345 678"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs font-semibold text-[#a9adae]">
            Certificações (separadas por vírgula)
            <input
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
              className={inputClass}
              placeholder="ex: STEK Certified Installer, 3M Preferred Installer"
            />
          </label>

          {error && <p className="text-xs font-semibold text-[#f05a50]">{error}</p>}

          <div className="flex items-center justify-end gap-2 mt-2 pt-4 border-t border-white/[0.06]">
            <Button variant="outline" size="sm" onClick={onClose} type="button" disabled={saving}>
              <span>Cancelar</span>
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={saving}>
              <span>{saving ? "A guardar..." : "Adicionar Colaborador"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
