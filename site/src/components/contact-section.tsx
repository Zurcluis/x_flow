"use client";

import { AlertCircle, ArrowRight, ArrowUpRight, Camera, CheckCircle2, MapPin } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { proposalServices } from "@/lib/proposal";
import { siteConfig } from "@/lib/site-config";

type FormState = "idle" | "submitting" | "success" | "error";

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type ContactSectionProps = {
  standalone?: boolean;
};

export function ContactSection({ standalone = false }: ContactSectionProps) {
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [reference, setReference] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setState("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          service: data.get("service"),
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
        | { error?: string; reference?: string }
        | null;

      if (!response.ok) {
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
    <section
      id="proposta"
      className={`contact section-pad${standalone ? " contact-standalone" : ""}`}
    >
      <div className="contact-copy">
        <span className="eyebrow">07 / O SEU PRÓXIMO PROJETO</span>
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
        <div className="contact-location">
          <MapPin size={19} aria-hidden="true" />
          <span>
            Atelier X-Motion
            <br />
            <strong>Barcelos, Portugal</strong>
          </span>
        </div>
        <a
          className="text-link"
          href={siteConfig.instagram}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Camera size={17} aria-hidden="true" /> Falar pelo Instagram
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </div>
      <div className="contact-form-wrap">
        {state === "success" ? (
          <div className="success-panel" role="status">
            <CheckCircle2 size={42} aria-hidden="true" />
            <span className="eyebrow">PEDIDO RECEBIDO</span>
            <h3>Obrigado. Vamos analisar o que nos contou.</h3>
            <p>
              O envio não confirma uma marcação nem um preço. Se preferir, fale connosco pelo
              Instagram.
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
          <form onSubmit={onSubmit}>
            <div className="form-heading">
              <span>Peça uma proposta.</span>
              <small>Sem compromisso.</small>
            </div>
            <label>
              O que pretende fazer?
              <select name="service" defaultValue="Preciso de aconselhamento">
                {proposalServices.map((service) => (
                  <option key={service}>{service}</option>
                ))}
              </select>
            </label>
            <label>
              Qual é o seu carro?
              <input
                placeholder="Marca, modelo e ano"
                required
                minLength={2}
                maxLength={160}
                autoComplete="off"
                name="vehicle"
              />
            </label>
            <div className="form-row">
              <label>
                O seu nome
                <input
                  placeholder="Nome"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  name="name"
                />
              </label>
              <label>
                E-mail
                <input
                  placeholder="nome@exemplo.pt"
                  type="email"
                  required
                  maxLength={200}
                  autoComplete="email"
                  name="email"
                />
              </label>
            </div>
            <label>
              Telefone <span className="optional">opcional</span>
              <input
                type="tel"
                placeholder="O seu contacto telefónico"
                maxLength={30}
                autoComplete="tel"
                name="phone"
              />
            </label>
            <label>
              A sua ideia <span className="optional">opcional</span>
              <textarea
                name="message"
                placeholder="Cor, acabamento, zonas a proteger ou alguma dúvida…"
                rows={3}
                maxLength={2000}
              />
            </label>
            <label className="honeypot" aria-hidden="true">
              Website
              <input tabIndex={-1} autoComplete="off" name="website" />
            </label>
            <label className="consent">
              <input type="checkbox" required name="consent" />
              <span>
                Autorizo o uso dos dados para responder a este pedido.{" "}
                <Link href="/privacidade" target="_blank">
                  Informação de privacidade
                </Link>
                .
              </span>
            </label>
            <button type="submit" className="button gold submit-button" disabled={state === "submitting"}>
              {state === "submitting" ? "A enviar…" : "Pedir proposta para o meu carro"}
              <ArrowUpRight size={19} aria-hidden="true" />
            </button>
            {state === "error" ? (
              <p className="form-error" role="alert">
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
