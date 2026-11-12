"use client";

import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { InstagramIcon } from "@/components/brand-icons";
import {
  coverageOptionsByService,
  proposalServices,
  serviceDescriptions,
  type ProposalErrors,
  type ProposalService,
} from "@/lib/proposal";
import { siteConfig } from "@/lib/site-config";

type FormState = "idle" | "submitting" | "success" | "error";

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type BudgetFunnelProps = {
  variant?: "site" | "instagram";
  initialService?: ProposalService;
  initialMessage?: string;
  initialSource?: string;
};

const stepsSummary = [
  {
    index: "01",
    title: "Analisamos o carro",
    text: "Avaliamos cobertura, material indicado e tempo necessário de aplicação.",
  },
  {
    index: "02",
    title: "Orçamento claro",
    text: "Enviamos valores estimados, o que está incluído e datas disponíveis até 24h úteis.",
  },
  {
    index: "03",
    title: "Agendamento no espaço",
    text: "Sem compromisso: só marca quando aprovar a solução para o seu projeto.",
  },
];

const orderedFields: Array<keyof ProposalErrors> = [
  "vehicle",
  "name",
  "email",
  "phone",
  "message",
  "consent",
];

export function BudgetFunnel({
  variant = "site",
  initialService = "PPF",
  initialMessage,
  initialSource,
}: BudgetFunnelProps) {
  const isInstagram = variant === "instagram";
  const formRef = useRef<HTMLFormElement>(null);
  const [service, setService] = useState<ProposalService>(initialService);
  const [coverage, setCoverage] = useState<string>(
    coverageOptionsByService[initialService]?.[0] ?? "",
  );
  const [state, setState] = useState<FormState>("idle");
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ProposalErrors>({});
  const [reference, setReference] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [submittedVehicle, setSubmittedVehicle] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);

  function selectService(next: ProposalService) {
    setService(next);
    setCoverage(coverageOptionsByService[next]?.[0] ?? "");
  }

  function clearFieldError(field: keyof ProposalErrors) {
    if (!fieldErrors[field]) return;
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const emailValue = String(data.get("email") ?? "").trim();
    const vehicleValue = String(data.get("vehicle") ?? "").trim();

    setState("submitting");
    setErrorMessage("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          service,
          coverage,
          source: initialSource || (isInstagram ? "instagram" : "orcamento-site"),
          vehicle: vehicleValue,
          name: data.get("name"),
          email: emailValue,
          phone: data.get("phone"),
          message: data.get("message"),
          consent: data.get("consent") === "on",
          website: data.get("website"),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; reference?: string; fields?: ProposalErrors }
        | null;

      if (!response.ok) {
        if (payload?.fields) {
          setFieldErrors(payload.fields);
          const firstBad = orderedFields.find((key) => payload.fields?.[key]);
          if (firstBad && formRef.current) {
            const el = formRef.current.elements.namedItem(firstBad);
            if (el instanceof HTMLElement) {
              el.focus();
            }
          }
        }
        throw new Error(payload?.error ?? "Não foi possível enviar o pedido.");
      }

      form.reset();
      setReference(payload?.reference ?? "");
      setSubmittedEmail(emailValue);
      setSubmittedVehicle(vehicleValue);
      setIdempotencyKey(createIdempotencyKey());
      setState("success");
    } catch (error) {
      setState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível enviar o pedido.",
      );
    }
  }

  const coverageOptions = coverageOptionsByService[service] ?? [];

  return (
    <section
      className={
        isInstagram ? "budget-page budget-page-focused section-pad" : "budget-page section-pad"
      }
    >
      {isInstagram ? (
        <div className="ig-topbar">
          <div className="ig-brand" aria-label="X-Motion, PPF e Car Wrap">
            <Image
              src="/logo/logo-completo.png"
              alt="X-Motion"
              width={1024}
              height={537}
              priority
              className="ig-logo"
            />
            <span className="ig-brand-sub">PPF &amp; CAR WRAP · BARCELOS</span>
          </div>
          <span className="ig-badge">PEDIDO DE ORÇAMENTO</span>
        </div>
      ) : null}

      <div className="budget-header">
        <div>
          <span className="eyebrow">ORÇAMENTO RÁPIDO · BARCELOS</span>
          <h1>
            Peça um orçamento
            <br />
            para o seu <em>carro.</em>
          </h1>
        </div>
        <div className="budget-header-copy">
          <p>
            Escolha o serviço e indique o modelo. Avaliamos o projeto e respondemos com valores e
            disponibilidade em até 24h úteis — sem compromisso.
          </p>
          <div className="budget-meta-strip">
            <span>
              <Clock size={14} aria-hidden="true" /> Resposta até 24h úteis
            </span>
            <span>
              <Mail size={14} aria-hidden="true" /> Resposta por e-mail
            </span>
          </div>
        </div>
      </div>

      <div className="budget-grid">
        <div className="budget-form-column">
          {state === "success" ? (
            <div className="success-panel budget-success" role="status" aria-live="polite">
              <CheckCircle2 size={42} aria-hidden="true" />
              <span className="eyebrow">PEDIDO DE ORÇAMENTO RECEBIDO</span>
              <h2>Obrigado. Vamos analisar o seu {submittedVehicle || "projeto"}.</h2>
              <p>
                Enviámos o seu pedido para a equipa X-Motion. Responderemos para{" "}
                <strong>{submittedEmail}</strong> com orientação técnica, estimativa de valor e
                datas disponíveis.
              </p>
              {reference ? (
                <p className="budget-ref">
                  Referência do pedido: <strong>{reference}</strong>
                </p>
              ) : null}
              <div className="budget-success-actions">
                <button className="button gold" type="button" onClick={() => setState("idle")}>
                  {isInstagram ? "Pedir orçamento para outro carro" : "Fazer outro pedido"}
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
                {!isInstagram ? (
                  <Link className="text-link" href="/projetos">
                    Explorar projetos realizados
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <form ref={formRef} onSubmit={onSubmit} className="budget-form">
              <div className="budget-step">
                <div className="budget-step-head">
                  <span>01 / O QUE PROCURA PARA O SEU CARRO?</span>
                  <small>Selecione uma opção</small>
                </div>
                <div className="service-selector" role="radiogroup" aria-label="Serviço pretendido">
                  {proposalServices.map((item) => {
                    const selected = service === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={selected ? "service-chip selected" : "service-chip"}
                        onClick={() => selectService(item)}
                      >
                        <span>{item}</span>
                        {selected ? <Check size={15} aria-hidden="true" /> : null}
                      </button>
                    );
                  })}
                </div>
                <p className="service-hint" aria-live="polite">
                  {serviceDescriptions[service]}
                </p>
              </div>

              {coverageOptions.length > 0 ? (
                <div className="budget-step">
                  <div className="budget-step-head">
                    <span>02 / ÂMBITO PRETENDIDO</span>
                    <small>Opcional</small>
                  </div>
                  <div className="coverage-selector" role="radiogroup" aria-label="Âmbito pretendido">
                    {coverageOptions.map((option) => {
                      const selected = coverage === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          className={selected ? "coverage-chip selected" : "coverage-chip"}
                          onClick={() => setCoverage(option)}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="budget-step">
                <div className="budget-step-head">
                  <span>03 / DADOS DO CARRO E CONTACTO</span>
                  <small>Menos de 1 minuto</small>
                </div>

                <label>
                  Qual é o seu carro?
                  <input
                    placeholder="Ex.: Porsche 911 (2023), BMW M3, Mercedes CLE…"
                    required
                    minLength={2}
                    maxLength={160}
                    autoComplete="off"
                    name="vehicle"
                    aria-invalid={Boolean(fieldErrors.vehicle)}
                    onChange={() => clearFieldError("vehicle")}
                  />
                  {fieldErrors.vehicle ? (
                    <span className="field-error" role="alert">
                      {fieldErrors.vehicle}
                    </span>
                  ) : null}
                </label>

                <div className="form-row">
                  <label>
                    O seu nome
                    <input
                      placeholder="Ex.: João Silva…"
                      required
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                      name="name"
                      aria-invalid={Boolean(fieldErrors.name)}
                      onChange={() => clearFieldError("name")}
                    />
                    {fieldErrors.name ? (
                      <span className="field-error" role="alert">
                        {fieldErrors.name}
                      </span>
                    ) : null}
                  </label>
                  <label>
                    E-mail para receber o orçamento
                    <input
                      placeholder="nome@exemplo.pt"
                      type="email"
                      inputMode="email"
                      spellCheck={false}
                      required
                      maxLength={200}
                      autoComplete="email"
                      name="email"
                      aria-invalid={Boolean(fieldErrors.email)}
                      onChange={() => clearFieldError("email")}
                    />
                    {fieldErrors.email ? (
                      <span className="field-error" role="alert">
                        {fieldErrors.email}
                      </span>
                    ) : null}
                  </label>
                </div>

                <label>
                  Telemóvel <span className="optional">opcional</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="Ex.: 912 345 678…"
                    maxLength={30}
                    autoComplete="tel"
                    name="phone"
                    aria-invalid={Boolean(fieldErrors.phone)}
                    onChange={() => clearFieldError("phone")}
                  />
                  {fieldErrors.phone ? (
                    <span className="field-error" role="alert">
                      {fieldErrors.phone}
                    </span>
                  ) : null}
                </label>

                <label>
                  Objetivo, cor ou zonas a proteger <span className="optional">opcional</span>
                  <textarea
                    name="message"
                    defaultValue={initialMessage}
                    placeholder="Ex.: Frente completa em PPF transparente, mudança de cor para verde escuro mate…"
                    rows={3}
                    maxLength={2000}
                    aria-invalid={Boolean(fieldErrors.message)}
                    onChange={() => clearFieldError("message")}
                  />
                  {fieldErrors.message ? (
                    <span className="field-error" role="alert">
                      {fieldErrors.message}
                    </span>
                  ) : null}
                </label>

                <label className="honeypot" aria-hidden="true">
                  Website
                  <input tabIndex={-1} autoComplete="off" name="website" />
                </label>

                <label className="consent">
                  <input
                    type="checkbox"
                    required
                    name="consent"
                    aria-invalid={Boolean(fieldErrors.consent)}
                    onChange={() => clearFieldError("consent")}
                  />
                  <span>
                    Autorizo o uso dos dados para responder a este pedido de orçamento.{" "}
                    {isInstagram ? (
                      <button
                        type="button"
                        className="consent-inline-btn"
                        aria-expanded={privacyOpen}
                        onClick={() => setPrivacyOpen((open) => !open)}
                      >
                        Informação de privacidade
                      </button>
                    ) : (
                      <Link href="/privacidade" target="_blank">
                        Informação de privacidade
                      </Link>
                    )}
                    .
                  </span>
                </label>
                {fieldErrors.consent ? (
                  <span className="field-error" role="alert">
                    {fieldErrors.consent}
                  </span>
                ) : null}

                {isInstagram && privacyOpen ? (
                  <p className="ig-privacy-box">
                    Os dados indicados são enviados exclusivamente para a equipa X-Motion para
                    analisar o seu veículo e enviar o respetivo orçamento por e-mail. Não são
                    usados para envio comercial automático nem partilhados com terceiros.
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="button gold submit-button"
                  disabled={state === "submitting"}
                >
                  {state === "submitting" ? "A enviar pedido…" : "Pedir orçamento grátis"}
                  {state === "submitting" ? (
                    <Loader2 size={19} className="spin" aria-hidden="true" />
                  ) : (
                    <ArrowUpRight size={19} aria-hidden="true" />
                  )}
                </button>

                {state === "error" ? (
                  <p className="form-error" role="alert" aria-live="polite">
                    <AlertCircle size={14} aria-hidden="true" /> {errorMessage}
                  </p>
                ) : null}

                <p className="form-note">
                  O pedido é gratuito e não implica marcação imediata.
                </p>
              </div>
            </form>
          )}
        </div>

        <aside className="budget-aside" aria-label="Resumo e informação do espaço">
          <div className="budget-summary-card">
            <span className="eyebrow">O SEU PEDIDO</span>
            <dl className="budget-dl">
              <div>
                <dt>Serviço</dt>
                <dd>{service}</dd>
              </div>
              {coverage ? (
                <div>
                  <dt>Âmbito</dt>
                  <dd>{coverage}</dd>
                </div>
              ) : null}
              <div>
                <dt>Resposta</dt>
                <dd>Até 24h úteis por e-mail</dd>
              </div>
              <div>
                <dt>Espaço</dt>
                <dd>Pavilhão 4D · Barcelos</dd>
              </div>
            </dl>
          </div>

          <div className="budget-steps-card">
            <span className="eyebrow">COMO FUNCIONA</span>
            <div className="budget-mini-steps">
              {stepsSummary.map((step) => (
                <div key={step.index} className="budget-mini-step">
                  <span className="step-num">{step.index}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!isInstagram ? (
            <div className="budget-direct-card">
              <span className="eyebrow">CONTACTO DIRETO &amp; FOTOS</span>
              <p>
                Se preferir enviar já fotografias do carro ou esclarecer alguma dúvida antes do pedido:
              </p>
              <div className="budget-direct-links">
                <a className="text-link" href={siteConfig.emailHref}>
                  <Mail size={16} aria-hidden="true" /> {siteConfig.email}
                </a>
                <a
                  className="text-link"
                  href={siteConfig.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <InstagramIcon size={16} /> @x_motion.wrap
                  <ArrowUpRight size={15} aria-hidden="true" />
                </a>
                <a
                  className="text-link"
                  href={siteConfig.maps}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin size={16} aria-hidden="true" /> Barcelos · Ver no mapa
                  <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      {isInstagram ? (
        <div className="ig-footnote">
          <span>© 2026 X-Motion · PPF &amp; Car Wrap</span>
          <span>R. Odete Hermenegildo 1286, Pavilhão 4D · Barcelos</span>
        </div>
      ) : null}
    </section>
  );
}
