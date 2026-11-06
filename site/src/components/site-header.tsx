"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FacebookIcon, InstagramIcon } from "@/components/brand-icons";
import { navItems, proposalHref, siteConfig } from "@/lib/site-config";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

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
          <Image
            src="/logo/logo.webp"
            alt="X-Motion"
            width={2044}
            height={362}
            priority
            className="brand-logo"
          />
          <span className="brand-sub">PPF &amp; car wrap</span>
        </Link>
        <nav aria-label="Navegação principal">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href={proposalHref} className="nav-cta">
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
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          ))}
          <Link href={proposalHref} onClick={() => setOpen(false)}>
            Pedir proposta
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
          <div className="mobile-menu-social">
            <a
              href={siteConfig.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram da X-Motion"
            >
              <InstagramIcon size={18} />
              <span>Instagram</span>
            </a>
            <a
              href={siteConfig.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook da X-Motion"
            >
              <FacebookIcon size={18} />
              <span>Facebook</span>
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
