-- Migration 000025: rotação obrigatória de password no primeiro acesso
-- O login redireciona para /change-password enquanto a flag estiver ativa.
-- Administradores podem repor a password com scripts/set-password.mjs.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
