# 1. Monólito Modular Web/PWA

Data: 28 de agosto de 2026

## Contexto
O X-Flow necessita de desenvolvimento rápido, forte consistência de dados relacionais e baixo custo inicial, com capacidade de evolução futura para multi-tenant SaaS.

## Decisão
Adotar um **monólito modular** baseado em Next.js App Router e TypeScript strict, com domínios encapsulados em `src/domains/`.

## Consequências
- Simplicidade operacional, partilha de tipos e regras entre frontend e backend.
- Facilidade de refatoração antes de qualquer separação de serviços.
