# Regras de Segurança e Dados X-Flow

- Isolamento total por `organization_id` com Row Level Security (RLS) no PostgreSQL.
- RBAC estrito: técnicos não recebem margens, salários ou tesouraria no payload.
- Snapshots de orçamentos aprovados e aprovações são imutáveis.
- Ledger de movimentos de stock e auditoria são append-only.
- Buckets de storage privados com URLs assinadas e visibilidade controlada.
- Nunca commitar segredos ou dados reais de clientes/parceiros.
