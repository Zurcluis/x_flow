export const proposalServices = [
  "Preciso de aconselhamento",
  "PPF",
  "Car Wrap",
  "Color PPF",
  "Detalhes e óticas",
  "Mota",
] as const;

export type ProposalService = (typeof proposalServices)[number];

export const coverageOptionsByService: Record<ProposalService, readonly string[]> = {
  "Preciso de aconselhamento": [
    "Proteção de pintura",
    "Mudança de cor",
    "Ambos / Quero orientação",
  ],
  PPF: [
    "Frente completa",
    "Carro completo",
    "Zonas de desgaste / A definir",
  ],
  "Car Wrap": [
    "Mudança de cor integral",
    "Tejadilho / Detalhes",
    "A definir",
  ],
  "Color PPF": [
    "Carro completo",
    "Frente / Painéis / A definir",
  ],
  "Detalhes e óticas": [
    "Chrome Delete",
    "Óticas / Pinças",
    "Interior / A definir",
  ],
  Mota: [
    "Proteção PPF",
    "Personalização / Wrap",
    "A definir",
  ],
};

export const serviceDescriptions: Record<ProposalService, string> = {
  PPF: "Película transparente de 200 microns autorregenerativa contra impactos e micro-riscos.",
  "Color PPF": "Mudança de cor com a espessura protetora e acabamento do PPF.",
  "Car Wrap": "Revestimento vinílico integral ou parcial em brilho, acetinado ou mate.",
  "Detalhes e óticas": "Chrome delete, película de proteção de óticas e pormenores exteriores.",
  Mota: "Proteção de depósito e carenagens ou personalização integral.",
  "Preciso de aconselhamento": "Indicamos a melhor solução entre proteção, cor e orçamento.",
};

export function matchProposalService(raw?: string): ProposalService {
  if (!raw) return "PPF";
  const normalized = raw.trim().toLowerCase();
  const exact = proposalServices.find((item) => item.toLowerCase() === normalized);
  if (exact) return exact;

  if (normalized.includes("color")) return "Color PPF";
  if (normalized.includes("wrap")) return "Car Wrap";
  if (normalized.includes("ppf")) return "PPF";
  if (normalized.includes("detalhe") || normalized.includes("otica")) return "Detalhes e óticas";
  if (normalized.includes("mota")) return "Mota";
  if (normalized.includes("aconselha")) return "Preciso de aconselhamento";

  return "PPF";
}

export function resolveBudgetInitialParams(
  params: {
    servico?: string | string[];
    revestimento?: string | string[];
    cor?: string | string[];
    acabamento?: string | string[];
    oticas?: string | string[];
    chrome?: string | string[];
    chromeAcab?: string | string[];
    origem?: string | string[];
  },
  colors: ReadonlyArray<{ name: string }>,
  finishes: ReadonlyArray<{ name: string; value?: string }>,
) {
  const serviceParam = typeof params.servico === "string" ? params.servico : undefined;
  const coatingParam = typeof params.revestimento === "string" ? params.revestimento : undefined;
  const colorName = typeof params.cor === "string" ? params.cor : undefined;
  const finishName = typeof params.acabamento === "string" ? params.acabamento : undefined;
  const headlightsName = typeof params.oticas === "string" ? params.oticas : undefined;
  const chromeParam = typeof params.chrome === "string" ? params.chrome : undefined;
  const chromeFinishParam = typeof params.chromeAcab === "string" ? params.chromeAcab : undefined;
  const sourceParam = typeof params.origem === "string" ? params.origem : undefined;

  const color = colorName ? colors.find((item) => item.name === colorName) : undefined;
  const finish = finishName
    ? finishes.find((item) => item.name === finishName || item.value === finishName)
    : undefined;

  const validHeadlights = ["Transparente", "Fumado leve", "Fumado médio", "Fumado escuro"];
  const headlights =
    headlightsName && validHeadlights.includes(headlightsName) ? headlightsName : undefined;

  const chromeZoneMap = new Map([
    ["frisos", "frisos das portas"],
    ["frente", "frente"],
    ["traseira", "traseira"],
    ["espelhos", "espelhos"],
  ]);
  const chromeZones = chromeParam
    ? chromeParam
        .split(",")
        .map((key) => chromeZoneMap.get(key.trim()))
        .filter((value): value is string => Boolean(value))
    : [];

  let initialService: ProposalService = matchProposalService(serviceParam);
  if (coatingParam === "ppf") {
    initialService = "PPF";
  } else if (coatingParam === "color-ppf") {
    initialService = "Color PPF";
  } else if (coatingParam === "vinil" || color || finish) {
    initialService = "Car Wrap";
  } else if (headlights || chromeZones.length > 0) {
    initialService = "Detalhes e óticas";
  }

  const details: string[] = [];
  if (coatingParam === "ppf") details.push("serviço PPF transparente");
  else if (coatingParam === "color-ppf") details.push("serviço PPF de Cor");
  else if (coatingParam === "vinil") details.push("serviço Vinil (Car Wrap)");
  if (color) details.push(`cor ${color.name}`);
  if (finish) details.push(`acabamento ${finish.name}`);
  if (headlights) details.push(`óticas ${headlights}`);
  if (chromeZones.length > 0) {
    const finishText =
      chromeFinishParam === "Preto mate" ? "Preto mate" : "Preto brilho";
    details.push(`Chrome Delete (${chromeZones.join(", ")} · ${finishText})`);
  }

  const initialMessage =
    details.length > 0
      ? `Interesse no estúdio de cor: ${details.join(", ")}. Gostaria de receber orçamento para o meu carro.`
      : undefined;

  return {
    initialService,
    initialMessage,
    initialSource: sourceParam,
  };
}

export type ProposalData = {
  service: ProposalService;
  vehicle: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  coverage?: string;
  source?: string;
  consent: boolean;
};

export type ProposalErrors = Partial<Record<keyof ProposalData | "website", string>>;

export type ProposalValidation =
  | { ok: true; data: ProposalData }
  | { ok: false; errors: ProposalErrors };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function buildEnrichedMessage(data: ProposalData): string | undefined {
  const parts: string[] = [];

  if (data.coverage) {
    parts.push(`Âmbito: ${data.coverage}`);
  }
  if (data.source) {
    parts.push(`Origem: ${data.source}`);
  }
  if (data.message) {
    parts.push(data.message);
  }

  const combined = parts.join("\n").trim();
  return combined ? combined.slice(0, 2000) : undefined;
}

export function validateProposal(input: unknown): ProposalValidation {
  if (!isRecord(input)) {
    return { ok: false, errors: { name: "Não foi possível ler o pedido." } };
  }

  const service = readString(input.service);
  const vehicle = readString(input.vehicle);
  const name = readString(input.name);
  const email = readString(input.email);
  const phone = readString(input.phone);
  const message = readString(input.message);
  const coverage = readString(input.coverage);
  const source = readString(input.source);
  const website = readString(input.website);
  const consent = input.consent === true;
  const errors: ProposalErrors = {};

  if (!proposalServices.includes(service as ProposalService)) {
    errors.service = "Escolha o tipo de projeto.";
  }

  if (vehicle.length < 2 || vehicle.length > 160) {
    errors.vehicle = "Indique a marca, o modelo e o ano.";
  }

  if (name.length < 2 || name.length > 100) {
    errors.name = "Indique o seu nome.";
  }

  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = "Indique um e-mail válido.";
  }

  if (phone.length > 30) {
    errors.phone = "O telefone é demasiado longo.";
  }

  if (message.length > 2000) {
    errors.message = "A mensagem não pode exceder 2000 caracteres.";
  }

  if (coverage.length > 80) {
    errors.coverage = "Âmbito inválido.";
  }

  if (source.length > 60) {
    errors.source = "Origem inválida.";
  }

  if (!consent) {
    errors.consent = "É necessário autorizar o uso dos dados.";
  }

  if (website) {
    errors.website = "Pedido inválido.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      service: service as ProposalService,
      vehicle,
      name,
      email,
      phone: phone || undefined,
      message: message || undefined,
      coverage: coverage || undefined,
      source: source || undefined,
      consent,
    },
  };
}
