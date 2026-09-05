export interface WorkshopTool {
  id: string;
  name: string;
  category: "corte" | "calor" | "iluminacao" | "limpeza" | "medicao";
  brand: string;
  model: string;
  serialNumber: string;
  qrCode: string;
  status: "disponivel" | "em_uso" | "manutencao";
  assignedTo?: string;
  location: string;
  lastMaintenance: string;
  nextMaintenance: string;
}

export interface TeamMember {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  role: string;
  specialty: string;
  level: "Master" | "Sénior" | "Especialista" | "Assistente";
  status: "disponivel" | "em_trabalho" | "ausente";
  activeWorkOrder?: string;
  activeVehicle?: string;
  completedJobsCount: number;
  efficiencyRating: string;
  certifications: string[];
}

export const initialToolsData: WorkshopTool[] = [
  {
    id: "tool-1",
    name: "Plotter de Corte de Película 160cm",
    category: "corte",
    brand: "Graphtec",
    model: "FC9000-160 Pro",
    serialNumber: "GRP-2024-8891",
    qrCode: "QR-TOOL-01",
    status: "disponivel",
    location: "Sala de Corte & Plotter",
    lastMaintenance: "2026-08-01",
    nextMaintenance: "2026-11-01",
  },
  {
    id: "tool-2",
    name: "Lâmpada de Inspeção Ótica CRI+ 96",
    category: "iluminacao",
    brand: "Scangrip",
    model: "Sunmatch 4 High CRI+",
    serialNumber: "SCN-2025-4412",
    qrCode: "QR-TOOL-02",
    status: "em_uso",
    assignedTo: "João Martins",
    location: "Baia 1 — Sala Limpa PPF",
    lastMaintenance: "2026-07-15",
    nextMaintenance: "2026-10-15",
  },
  {
    id: "tool-3",
    name: "Pistola de Pós-Aquecimento Térmico",
    category: "calor",
    brand: "Leister",
    model: "Triac ST Digital 1600W",
    serialNumber: "LEI-2024-0092",
    qrCode: "QR-TOOL-03",
    status: "em_uso",
    assignedTo: "Rodrigo Santos",
    location: "Baia 2 — Desmontagem e Wrap",
    lastMaintenance: "2026-08-10",
    nextMaintenance: "2026-11-10",
  },
  {
    id: "tool-4",
    name: "Máquina de Vapor Industrial DMF",
    category: "limpeza",
    brand: "Optima Steamer",
    model: "DMF Super Steam",
    serialNumber: "OPT-2023-7721",
    qrCode: "QR-TOOL-04",
    status: "disponivel",
    location: "Baia 3 — Lavagem & Descontaminação",
    lastMaintenance: "2026-06-20",
    nextMaintenance: "2026-09-20",
  },
  {
    id: "tool-5",
    name: "Medidor Digital de Espessura de Filme",
    category: "medicao",
    brand: "Elcometer",
    model: "456 FNF Digital Gauge",
    serialNumber: "ELC-2025-1109",
    qrCode: "QR-TOOL-05",
    status: "disponivel",
    location: "Bancada de QC",
    lastMaintenance: "2026-08-05",
    nextMaintenance: "2027-02-05",
  },
];

export const initialTeamData: TeamMember[] = [
  {
    id: "team-1",
    name: "Luís",
    role: "Master Detailer & Diretor de Produção",
    specialty: "Full PPF, Wrap & Gestão Operacional",
    level: "Master",
    status: "disponivel",
    completedJobsCount: 480,
    efficiencyRating: "165%",
    certifications: ["Stek Master Installer", "3M Preferred Graphics", "Scangrip QC Inspector"],
  },
  {
    id: "team-2",
    name: "João Martins",
    role: "Lead PPF & Precision Installer",
    specialty: "PPF Integral e Controlo de Qualidade",
    level: "Sénior",
    status: "em_trabalho",
    activeWorkOrder: "OT-2026-042",
    activeVehicle: "BMW M4 Competition Coupe",
    completedJobsCount: 320,
    efficiencyRating: "155%",
    certifications: ["Stek Certified Installer", "Avery Dennison Specialist"],
  },
  {
    id: "team-3",
    name: "Rodrigo Santos",
    role: "Técnico de Desmontagem & Vinil Wrap",
    specialty: "Full Wrap, Desmontagem de Painéis & Frisos",
    level: "Especialista",
    status: "em_trabalho",
    activeWorkOrder: "OT-2026-040",
    activeVehicle: "Porsche 911 Carrera 4S",
    completedJobsCount: 210,
    efficiencyRating: "135%",
    certifications: ["3M Wrap Training", "Body Panel Specialist"],
  },
  {
    id: "team-4",
    name: "Ana Ferreira",
    role: "Customer Care & Gestão de Entregas",
    specialty: "Receção, Check-in, Faturação e Passaporte Digital",
    level: "Especialista",
    status: "disponivel",
    completedJobsCount: 560,
    efficiencyRating: "140%",
    certifications: ["X-Flow Certified Administrator", "Automotive CRM Specialist"],
  },
];
