export const websiteLeadServices = [
  "advice",
  "ppf",
  "car_wrap",
  "color_ppf",
  "details",
  "motorcycle",
] as const;

export type WebsiteLeadService = (typeof websiteLeadServices)[number];

export type WebsiteLeadPayload = {
  service: WebsiteLeadService;
  vehicle: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  consent: true;
};

export type WebsiteLeadErrors = Partial<
  Record<keyof WebsiteLeadPayload | "website", string>
>;

export type WebsiteLeadValidation =
  | { ok: true; data: WebsiteLeadPayload }
  | { ok: false; errors: WebsiteLeadErrors };

const SERVICE_BY_LABEL: Record<string, WebsiteLeadService> = {
  "preciso de aconselhamento": "advice",
  ppf: "ppf",
  "car wrap": "car_wrap",
  "color ppf": "color_ppf",
  "detalhes e óticas": "details",
  mota: "motorcycle",
};

const SERVICE_BY_CODE = new Set<string>(websiteLeadServices);

const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:-]{1,100}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function isWebsiteLeadService(value: string): value is WebsiteLeadService {
  return SERVICE_BY_CODE.has(value);
}

export function isValidIdempotencyKey(value: unknown): value is string {
  return typeof value === "string" && IDEMPOTENCY_PATTERN.test(value);
}

export function normalizeWebsiteLeadService(
  value: string
): WebsiteLeadService | null {
  const normalized = value.trim().toLowerCase();
  if (isWebsiteLeadService(normalized)) return normalized;
  return SERVICE_BY_LABEL[normalized] ?? null;
}

export function validateWebsiteLeadPayload(input: unknown): WebsiteLeadValidation {
  if (!isRecord(input)) {
    return { ok: false, errors: { name: "Não foi possível ler o pedido." } };
  }

  const service = normalizeWebsiteLeadService(readString(input.service));
  const vehicle = readString(input.vehicle);
  const name = readString(input.name);
  const email = readString(input.email);
  const phone = readString(input.phone);
  const message = readString(input.message);
  const honeypot = readString(input.website);
  const consent = input.consent === true;
  const errors: WebsiteLeadErrors = {};

  if (!service) {
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

  if (honeypot) {
    errors.website = "Pedido inválido.";
  }

  if (Object.keys(errors).length > 0 || !service) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      service,
      vehicle,
      name,
      email,
      phone: phone || undefined,
      message: message || undefined,
      consent: true,
    },
  };
}
