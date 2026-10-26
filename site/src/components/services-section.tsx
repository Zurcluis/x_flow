"use client";

import { ArrowUpRight, Check, Plus, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { services, type ServiceDetail, type ServiceId } from "@/lib/services";

export function ServicesSection() {
  const [selected, setSelected] = useState<ServiceDetail | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (selected && !dialog.open) dialog.showModal();
    if (!selected && dialog.open) dialog.close();
  }, [selected]);

  function openService(id: ServiceId) {
    const service = services.find((item) => item.id === id) ?? null;
    setSelected(service);
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  return (
    <section id="servicos" className="services light-section section-pad">
      <div className="section-heading">
        <div>
          <span className="eyebrow">01 / O QUE PRETENDE FAZER?</span>
          <h2>
            Preservar a pintura.
            <br />
            <span>Mudar a presença.</span>
          </h2>
        </div>
        <p>
          Começamos pelo que procura.
          <br />
          Encontramos a solução para o seu carro.
        </p>
      </div>
      <div className="intent-grid">
        <button className="intent" type="button" onClick={() => openService("ppf")}>
          <div className="intent-image">
            <Image
              src="/images/services/ppf-process.webp"
              alt="Aplicação de película PPF numa Ferrari 458 Speciale"
              width={1200}
              height={800}
              sizes="(max-width: 800px) 100vw, 50vw"
            />
          </div>
          <div className="intent-copy">
            <span className="micro">01 — PROTEÇÃO</span>
            <h3>Proteger a pintura.</h3>
            <p>Preservar a cor original e cuidar das zonas mais expostas.</p>
            <span className="intent-foot">
              Explorar PPF <ArrowUpRight size={22} aria-hidden="true" />
            </span>
          </div>
        </button>
        <button className="intent" type="button" onClick={() => openService("car-wrap")}>
          <div className="intent-image">
            <Image
              src="/images/hero/m3.webp"
              alt="BMW M3 em tom azul-violeta, trabalho X-Motion"
              width={1600}
              height={1067}
              sizes="(max-width: 800px) 100vw, 50vw"
            />
          </div>
          <div className="intent-copy">
            <span className="micro">02 — PERSONALIZAÇÃO</span>
            <h3>Mudar a imagem.</h3>
            <p>Uma nova cor, acabamento ou detalhe com personalidade.</p>
            <span className="intent-foot">
              Car Wrap &amp; Color PPF <ArrowUpRight size={22} aria-hidden="true" />
            </span>
          </div>
        </button>
      </div>
      <div className="service-rows">
        {services.slice(0, 3).map((service) => (
          <button
            key={service.id}
            className="service-row"
            type="button"
            onClick={() => openService(service.id)}
          >
            <span className="service-number">{service.number}</span>
            <span className="service-name">{service.name}</span>
            <span className="service-desc">{service.short}</span>
            <Plus size={22} aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="small-services">
        <span>Também cuidamos dos detalhes.</span>
        <button type="button" onClick={() => openService("detalhes")}>
          Chrome Delete · Óticas · Aplicações parciais
          <ArrowUpRight size={15} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => openService("detalhes")}>
          Projetos em duas rodas
          <ArrowUpRight size={15} aria-hidden="true" />
        </button>
      </div>
      <dialog
        ref={dialogRef}
        className="detail-dialog"
        aria-labelledby="service-dialog-title"
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <>
            <button
              className="dialog-close"
              type="button"
              aria-label="Fechar detalhes"
              onClick={closeDialog}
            >
              <X size={20} aria-hidden="true" />
            </button>
            <div className="service-detail">
              <span className="eyebrow">{selected.number} / SERVIÇO</span>
              <h2 id="service-dialog-title">{selected.name}</h2>
              <p>{selected.description}</p>
              <ul>
                {selected.bullets.map((bullet) => (
                  <li key={bullet}>
                    <Check size={16} aria-hidden="true" />
                    {bullet}
                  </li>
                ))}
              </ul>
              <a className="button gold" href="#proposta" onClick={() => setSelected(null)}>
                Pedir proposta
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
            </div>
          </>
        ) : null}
      </dialog>
    </section>
  );
}
