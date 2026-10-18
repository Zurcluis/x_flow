import type { PhaseKey } from "@/domains/production/types";

export const CHECKLIST_TEMPLATES: Record<PhaseKey, string[]> = {
  prep_decontamination: [
    "Pré-lavagem com foam neutro e limpeza de cavas de roda",
    "Descontaminação férrica química e clay bar suave",
    "Secagem com ar comprimido e desengorduramento com álcool isopropílico (IPA)",
  ],
  disassembly: [
    "Desmontagem cuidada dos puxadores de porta e capas de espelhos",
    "Remoção de emblemas com fio de corte e limpeza de resíduos",
  ],
  film_cutting: [
    "Carregamento dos padrões digitais de corte (Plotter Software)",
    "Corte do rolo com folgas de remate de 8 mm",
  ],
  application: [
    "Aplicação do capô com solução de gel slip e tack",
    "Aplicação do para-choques frontal e grelhas",
    "Aplicação das portas e guarda-lamas laterais",
  ],
  assembly: [
    "Remontagem de puxadores e espelhos com verificação de aperto",
  ],
  thermal_cure: [
    "Pós-aquecimento dos bordos e remates a 90 °C com pirómetro digital",
  ],
  detailing_finish: [
    "Limpeza de vidros, aspiração interior e selante cerâmico sobre a película",
  ],
  quality_control: [
    "Inspeção final com lâmpada Scangrip e emissão do Certificado QC",
  ],
  subcontracted: [
    "Confirmar receção do serviço subcontratado",
    "Validar acabamento e conformidade com o fornecedor",
  ],
};
