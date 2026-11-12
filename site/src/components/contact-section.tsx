"use client";

import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { FacebookIcon, InstagramIcon } from "@/components/brand-icons";
import { proposalServices, type ProposalErrors, type ProposalService } from "@/lib/proposal";
import { siteConfig } from "@/lib/site-config";

type FormState = "idle" | "submitting" | "success" | "error";

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type ContactSectionProps = {
  defaultService?: ProposalService;
  defaultMessage?: string;
  eyebrow?: string;
  showHeading?: boolean;
};

const orderedFields: Array<keyof ProposalErrors> = [
  "service",
  "vehicle",
  "name",
  "email",
  "phone",
  "message",
  "consent",
];

export function ContactSection({
  defaultService = "Preciso de aconselhamento",
  defaultMessage,
  eyebrow = "07 / O SEU PRÓXIMO PROJETO",
  showHeading = true,
}: ContactSectionProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ProposalErrors>({});
  const [reference, setReference] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);

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
          service: data.get("service"),
          source: "contactos-site",
          vehicle: data.get("vehicle"),
          name: data.get("name"),
          email: data.get("email"),
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
      setIdempotencyKey(createIdempotencyKey());
      setState("success");
    } catch (error) {
      setState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível enviar o pedido.",
      );
    }
  }

  return (
    <section id="proposta" className="contact section-pad">
      <div className="contact-copy">
        {showHeading ? (
          <>
            <span className="eyebrow">{eyebrow}</span>
            <h2>
              Começa
              <br />
              com o
              <br />
              <em>seu carro.</em>
            </h2>
            <p>
              Diga-nos o que tem em mente.
              <br />
              Nós ajudamos a dar-lhe forma.
            </p>
          </>
        ) : null}
        <div className="contact-location">
          <MapPin size={19} aria-hidden="true" />
          <span>
            X-Motion · O Nosso Espaço
            <br />
            <strong>{siteConfig.address.street}</strong>
            <br />
            {siteConfig.address.postalCode} {siteConfig.address.locality}
            <br />
            {siteConfig.address.city}, Portugal
          </span>
        </div>
        <div className="contact-hours">
          <Clock size={19} aria-hidden="true" />
          <span>
            {siteConfig.hours.map((item, index) => (
              <span key={item.days}>
                <strong>{item.days}</strong> {item.time}
                {index < siteConfig.hours.length - 1 ? <br /> : null}
              </span>
            ))}
          </span>
        </div>
        <div className="contact-direct">
          <a className="text-link" href={siteConfig.phoneHref}>
            <Phone size={16} aria-hidden="true" /> {siteConfig.phone}
          </a>
          <a
            className="text-link"
            href={siteConfig.instagram}
            target="_blank"
            rel="noopener noreferrer"
          >
            <InstagramIcon size={16} /> Instagram
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          <a
            className="text-link"
            href={siteConfig.facebook}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FacebookIcon size={16} /> Facebook
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </div>
      </div>
      <div className="contact-form-wrap">
        {state === "success" ? (
          <div className="success-panel" role="status" aria-live="polite">
            <CheckCircle2 size={42} aria-hidden="true" />
            <span className="eyebrow">PEDIDO RECEBIDO</span>
            <h3>Obrigado. Vamos analisar o que nos contou.</h3>
            <p>
              O envio não confirma uma marcação nem um preço. Responderemos para o seu e-mail até
              24h úteis.
            </p>
            {reference ? (
              <p className="form-note">
                Referência do pedido: <strong>{reference}</strong>
              </p>
            ) : null}
            <button className="text-link" type="button" onClick={() => setState("idle")}>
              Enviar outro pedido
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <form ref={formRef} onSubmit={onSubmit}>
            <div className="form-heading">
              <span>Peça um orçamento.</span>
              <small>Sem compromisso.</small>
            </div>
            <label>
              O que pretende fazer?
              <select
                name="service"
                defaultValue={defaultService}
                aria-invalid={Boolean(fieldErrors.service)}
                onChange={() => clearFieldError("service")}
              >
                {proposalServices.map((service) => (
                  <option key={service}>{service}</option>
                ))}
              </select>
              {fieldErrors.service ? (
                <span className="field-error" role="alert">
                  {fieldErrors.service}
                </span>
              ) : null}
            </label>
            <label>
              Qual é o seu carro?
              <input
                placeholder="Ex.: Porsche 911 (2023), BMW M3…"
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
                E-mail
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
              A sua ideia <span className="optional">opcional</span>
              <textarea
                name="message"
                defaultValue={defaultMessage}
                placeholder="Ex.: Cor, acabamento, zonas a proteger ou alguma dúvida…"
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
                Autorizo o uso dos dados para responder a este pedido.{" "}
                <Link href="/privacidade" target="_blank">
                  Informação de privacidade
                </Link>
                .
              </span>
            </label>
            {fieldErrors.consent ? (
              <span className="field-error" role="alert">
                {fieldErrors.consent}
              </span>
            ) : null}
            <button
              type="submit"
              className="button gold submit-button"
              disabled={state === "submitting"}
            >
              {state === "submitting" ? "A enviar…" : "Pedir orçamento para o meu carro"}
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
            <p className="form-note">O envio não confirma uma marcação nem um preço.</p>
          </form>
        )}
      </div>
    </section>
  );
}
