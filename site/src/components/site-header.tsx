"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { navItems } from "@/lib/site-config";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link className="brand" href="/" aria-label="X-Motion, início">
          <span>x</span>-motion
          <span className="brand-sub">PPF &amp; CAR WRAP</span>
        </Link>
        <nav aria-label="Navegação principal">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/#proposta" className="nav-cta">
          Pedir proposta
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
        <button
          className="menu-button"
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </div>
      {open ? (
        <div className="mobile-menu" id="mobile-menu">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          ))}
          <Link href="/#proposta" onClick={() => setOpen(false)}>
            Pedir proposta
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </header>
  );
}
