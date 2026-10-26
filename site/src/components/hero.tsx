"use client";

import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  {
    src: "/images/hero/m3.webp",
    width: 1600,
    height: 1067,
    title: "BMW M3",
    finish: "Azul-violeta",
    alt: "BMW M3 em tom azul-violeta, trabalho X-Motion",
    position: "55% 50%",
  },
  {
    src: "/images/hero/m4.webp",
    width: 1600,
    height: 1067,
    title: "BMW M4",
    finish: "Areia clara",
    alt: "BMW M4 em tom areia clara, no atelier X-Motion",
    position: "50% 50%",
  },
  {
    src: "/images/hero/ferrari.webp",
    width: 1600,
    height: 1067,
    title: "Ferrari 458 Speciale",
    finish: "Proteção PPF",
    alt: "Ferrari 458 Speciale com proteção PPF, no atelier X-Motion",
    position: "50% 50%",
  },
  {
    src: "/images/hero/lambo.webp",
    width: 1600,
    height: 1067,
    title: "Lamborghini Huracán",
    finish: "Preto profundo",
    alt: "Lamborghini Huracán em preto profundo, no atelier X-Motion",
    position: "50% 50%",
  },
];

const initialIndex = 0;

export function Hero() {
  const [index, setIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % slides.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [paused]);

  function goTo(next: number) {
    setIndex((next + slides.length) % slides.length);
  }

  const current = slides[index];
  const currentNumber = String(index + 1).padStart(2, "0");

  return (
    <section id="inicio" className="hero" aria-label="Trabalhos em destaque">
      <div className="hero-photos" aria-hidden="true">
        {slides.map((slide, slideIndex) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt=""
            fill
            sizes="(max-width: 560px) 100vw, (max-width: 800px) 93vw, 75vw"
            className={slideIndex === index ? "active" : undefined}
            loading="eager"
            unoptimized
            fetchPriority={slideIndex === initialIndex ? "high" : "auto"}
            style={{ objectFit: "cover", objectPosition: slide.position }}
          />
        ))}
      </div>
      <div className="hero-shade" />
      <div className="hero-content">
        <span className="eyebrow">
          BARCELOS, PORTUGAL <i /> PPF &amp; CAR WRAP
        </span>
        <h1>
          O seu carro.
          <br />
          Uma nova
          <br />
          <em>expressão.</em>
        </h1>
        <p>
          Proteção e personalização automóvel.
          <br />
          O cuidado está em cada detalhe.
        </p>
        <div className="hero-actions">
          <a href="#proposta" className="button gold">
            Criar o meu projeto
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <a href="#projetos" className="text-link">
            Explorar trabalhos
            <ArrowRight size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
      <div className="hero-bottom">
        <span className="hero-side-note">TRABALHOS REAIS. IDENTIDADE X-MOTION.</span>
        <div className="hero-caption" aria-live="polite">
          <span className="micro">EM DESTAQUE / {currentNumber}</span>
          <span>{current.title}</span>
          <small>{current.finish}</small>
        </div>
        <div className="hero-controls">
          <button type="button" aria-label="Trabalho anterior" onClick={() => goTo(index - 1)}>
            <ChevronLeft size={19} aria-hidden="true" />
          </button>
          <span>
            {currentNumber} <span className="dim">/ 04</span>
          </span>
          <button type="button" aria-label="Trabalho seguinte" onClick={() => goTo(index + 1)}>
            <ChevronRight size={19} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={paused ? "Retomar apresentação" : "Pausar apresentação"}
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <div className="hero-timeline">
        {slides.map((slide, slideIndex) => (
          <button
            key={slide.src}
            type="button"
            className={slideIndex === index ? "active" : undefined}
            aria-label={`Mostrar ${slide.title}`}
            aria-pressed={slideIndex === index}
            onClick={() => goTo(slideIndex)}
          >
            <span />
          </button>
        ))}
      </div>
    </section>
  );
}
