# 2. Supabase PostgreSQL com Row Level Security (RLS)

Data: 28 de agosto de 2026

## Contexto
O isolamento de dados entre organizações e perfis (técnicos, gestores, clientes) deve ser garantido na camada de dados e não apenas por filtros na interface.

## Decisão
Utilizar Supabase PostgreSQL com políticas RLS em todas as tabelas contendo `organization_id`.

## Consequências
- Proteção nativa contra acesso indevido mesmo em chamadas de API direta.
- Testes automatizados obrigatórios de RLS em cada domínio.
