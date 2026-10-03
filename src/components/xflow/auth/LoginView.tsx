"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/xflow/Logo";
import { loginAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

interface LoginViewProps {
  next?: string;
}

const DEMO_PROFILES = [
  { name: "Luís Gonçalves", role: "Administrador", email: "luis@xmotion.pt" },
  { name: "Patrícia Sousa", role: "Gestora de Oficina", email: "patricia@xmotion.pt" },
  { name: "João Martins", role: "Técnico", email: "joao@xmotion.pt" },
  { name: "Ricardo Almeida", role: "Técnico", email: "ricardo@xmotion.pt" },
  { name: "Miguel Costa", role: "Técnico", email: "miguel@xmotion.pt" },
];

export function LoginView({ next }: LoginViewProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await loginAction({ email: email.trim(), password });
    if (result.ok) {
      router.push(safeNext);
      return;
    }
    setError(result.error);
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-[#050606] text-[#f1ede5] flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <Logo variant="full" size="lg" />

        <div className="w-full mt-8 rounded-[18px] bg-[#101314] border border-white/[0.12] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
          <div className="flex flex-col gap-1.5 pb-6">
            <h1 className="text-xl font-bold text-[#f1ede5]">Entrar no X-Flow</h1>
            <p className="text-xs text-[#8a9092]">
              Acede ao sistema operativo da tua oficina.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-sm bg-[#f05a50]/15 border border-[#f05a50]/30 text-xs text-[#f05a50]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-xs font-medium text-[#a9adae]">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex: luis@xmotion.pt"
                autoComplete="email"
                autoFocus
                required
                className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] placeholder-[#8a9092]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-xs font-medium text-[#a9adae]">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Introduz a tua password"
                autoComplete="current-password"
                required
                className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] placeholder-[#8a9092]"
              />
            </div>

            <Button type="submit" variant="primary" size="md" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>A entrar...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </Button>
          </form>

          <div className="flex flex-col gap-2 pt-6 mt-6 border-t border-white/[0.08]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8a9092]">
              Entrar como
            </span>
            <div className="flex flex-wrap gap-2">
              {DEMO_PROFILES.map((profile) => (
                <button
                  key={profile.email}
                  type="button"
                  onClick={() => {
                    setEmail(profile.email);
                    setError(null);
                  }}
                  className={cn(
                    "px-2.5 py-1.5 rounded-sm bg-[#15191a] border border-white/[0.08] text-[11px] transition-colors cursor-pointer",
                    email === profile.email
                      ? "border-[#d3a548]/50 text-[#f7d46d]"
                      : "text-[#a9adae] hover:border-[#d3a548]/40 hover:text-[#f1ede5]"
                  )}
                >
                  {profile.name}
                  <span className="text-[#8a9092]"> · {profile.role}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-[#8a9092] text-center pt-5 mt-5 border-t border-white/[0.06]">
            Demo: restantes perfis com a password xflow-demo-2026
          </p>
        </div>
      </div>
    </main>
  );
}
