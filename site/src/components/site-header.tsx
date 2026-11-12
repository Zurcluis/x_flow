"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FacebookIcon, InstagramIcon } from "@/components/brand-icons";
import { navItems, proposalHref, siteConfig } from "@/lib/site-config";

export function SiteHeader() {
  const [openPath, setOpenPath] = useState<string | null>(null);
  const pathname = usePathname();
  const open = openPath === pathname;
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);
  const prevOpenRef = useRef(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  useEffect(() => {
    if (open) {
      firstMenuLinkRef.current?.focus();
    } else if (prevOpenRef.current) {
      menuButtonRef.current?.focus();
    }
    prevOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenPath(null);
    }

    function onPointerDown(event: PointerEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setOpenPath(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <header ref={headerRef} className="site-header">
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
          Pedir orçamento
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
        <button
          ref={menuButtonRef}
          className="menu-button"
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpenPath((current) => (current === pathname ? null : pathname))}
        >
          {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </div>
      {open ? (
        <nav className="mobile-menu" id="mobile-menu" aria-label="Navegação móvel">
          {navItems.map((item, idx) => (
            <Link
              key={item.href}
              ref={idx === 0 ? firstMenuLinkRef : undefined}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              onClick={() => setOpenPath(null)}
            >
              {item.label}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          ))}
          <Link href={proposalHref} onClick={() => setOpenPath(null)}>
            Pedir orçamento
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
        </nav>
      ) : null}
    </header>
  );
}
