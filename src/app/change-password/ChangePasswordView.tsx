"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/xflow/Logo";
import { changePasswordAction, logoutAction } from "@/app/actions/auth";

export function ChangePasswordView({
  mustChangePassword,
}: {
  mustChangePassword: boolean;
}) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const result = await changePasswordAction({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (result.ok) {
      router.push("/");
      router.refresh();
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
          <div className="flex flex-col gap-2 pb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#d3a548]/15 text-[#f7d46d]">
              <KeyRound className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-[#f1ede5]">Alterar password</h1>
            <p className="text-xs text-[#8a9092]">
              {mustChangePassword
                ? "Por segurança, define uma password pessoal antes de continuares."
                : "Define uma nova password para a tua conta."}
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
              <label htmlFor="current-password" className="text-xs font-medium text-[#a9adae]">
                Password atual
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
                autoFocus
                className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-password" className="text-xs font-medium text-[#a9adae]">
                Nova password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                required
                minLength={12}
                className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5]"
              />
              <span className="text-[11px] text-[#8a9092]">
                Mínimo 12 caracteres, com pelo menos três tipos de caracteres.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm-password" className="text-xs font-medium text-[#a9adae]">
                Confirmar nova password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
                minLength={12}
                className="h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5]"
              />
            </div>

            <Button type="submit" variant="primary" size="md" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>A guardar...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Guardar password</span>
                </>
              )}
            </Button>
          </form>

          <form action={logoutAction} className="pt-5 mt-5 border-t border-white/[0.06]">
            <button
              type="submit"
              className="w-full text-center text-[11px] text-[#8a9092] hover:text-[#f1ede5] transition-colors cursor-pointer"
            >
              Terminar sessão
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
