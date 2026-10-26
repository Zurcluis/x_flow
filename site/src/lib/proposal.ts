export const proposalServices = [
  "Preciso de aconselhamento",
  "PPF",
  "Car Wrap",
  "Color PPF",
  "Detalhes e óticas",
  "Mota",
] as const;

export type ProposalService = (typeof proposalServices)[number];

export type ProposalData = {
  service: ProposalService;
  vehicle: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
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
      consent,
    },
  };
}
