-- 000022 — Corretiva: completa as rubricas e kits de referência
-- A migração 000021 guardava cada seed por "a organização não tem nenhuma rubrica",
-- pelo que apenas a primeira rubrica e o primeiro kit foram inseridos nas bases
-- que já tinham corrido a versão anterior. Esta corretiva insere o que falta,
-- sempre idempotente (guarda por nome/código).

-- Rubricas em falta
INSERT INTO pricing_expense_items (organization_id, version, name, description, category, kind, amount, periodicity, monthly_equivalent, included_in_pricing, includes_personnel, source, validation_state, effective_from)
SELECT o.id, 1, 'Renda do pavilhão', 'Contrato Renda_Proporcional: área exclusiva 238,69 m² (441,20 €) + 50% das zonas partilhadas 205,09 m² (189,54 €)', 'operational', 'expense', 630.74, 'monthly', 630.74, TRUE, FALSE, 'Orçamento inicial — valores fornecidos pelo Luís', 'estimated', CURRENT_DATE
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_expense_items pei WHERE pei.organization_id = o.id AND pei.name = 'Renda do pavilhão');

INSERT INTO pricing_expense_items (organization_id, version, name, description, category, kind, amount, periodicity, monthly_equivalent, included_in_pricing, includes_personnel, source, validation_state, effective_from)
SELECT o.id, 1, 'Água e eletricidade', NULL, 'operational', 'expense', 200.00, 'monthly', 200.00, TRUE, FALSE, 'Orçamento inicial — valores fornecidos pelo Luís', 'estimated', CURRENT_DATE
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_expense_items pei WHERE pei.organization_id = o.id AND pei.name = 'Água e eletricidade');

INSERT INTO pricing_expense_items (organization_id, version, name, description, category, kind, amount, periodicity, monthly_equivalent, included_in_pricing, includes_personnel, source, validation_state, effective_from)
SELECT o.id, 1, 'Contabilidade', NULL, 'operational', 'expense', 75.00, 'monthly', 75.00, TRUE, FALSE, 'Orçamento inicial — valores fornecidos pelo Luís', 'estimated', CURRENT_DATE
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_expense_items pei WHERE pei.organization_id = o.id AND pei.name = 'Contabilidade');

INSERT INTO pricing_expense_items (organization_id, version, name, description, category, kind, amount, periodicity, monthly_equivalent, included_in_pricing, includes_personnel, source, validation_state, effective_from)
SELECT o.id, 1, 'Telefone, internet e software', NULL, 'operational', 'expense', 60.00, 'monthly', 60.00, TRUE, FALSE, 'Orçamento inicial — valores fornecidos pelo Luís', 'estimated', CURRENT_DATE
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_expense_items pei WHERE pei.organization_id = o.id AND pei.name = 'Telefone, internet e software');

INSERT INTO pricing_expense_items (organization_id, version, name, description, category, kind, amount, periodicity, monthly_equivalent, included_in_pricing, includes_personnel, source, validation_state, effective_from)
SELECT o.id, 1, 'Seguros e saúde no trabalho', NULL, 'operational', 'expense', 120.00, 'monthly', 120.00, TRUE, FALSE, 'Orçamento inicial — valores fornecidos pelo Luís', 'estimated', CURRENT_DATE
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_expense_items pei WHERE pei.organization_id = o.id AND pei.name = 'Seguros e saúde no trabalho');

INSERT INTO pricing_expense_items (organization_id, version, name, description, category, kind, amount, periodicity, monthly_equivalent, included_in_pricing, includes_personnel, source, validation_state, effective_from)
SELECT o.id, 1, 'Manutenção e ferramentas', 'Reserva para reparações e substituição de equipamento', 'operational', 'reserve', 200.00, 'monthly', 200.00, TRUE, FALSE, 'Orçamento inicial — valores fornecidos pelo Luís', 'estimated', CURRENT_DATE
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_expense_items pei WHERE pei.organization_id = o.id AND pei.name = 'Manutenção e ferramentas');

INSERT INTO pricing_expense_items (organization_id, version, name, description, category, kind, amount, periodicity, monthly_equivalent, included_in_pricing, includes_personnel, source, validation_state, effective_from)
SELECT o.id, 1, 'Marketing e divulgação', NULL, 'operational', 'expense', 150.00, 'monthly', 150.00, TRUE, FALSE, 'Orçamento inicial — valores fornecidos pelo Luís', 'estimated', CURRENT_DATE
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_expense_items pei WHERE pei.organization_id = o.id AND pei.name = 'Marketing e divulgação');

INSERT INTO pricing_expense_items (organization_id, version, name, description, category, kind, amount, periodicity, monthly_equivalent, included_in_pricing, includes_personnel, source, validation_state, effective_from)
SELECT o.id, 1, 'Alimentação e pequenas despesas', NULL, 'operational', 'provision', 250.00, 'monthly', 250.00, TRUE, FALSE, 'Orçamento inicial — valores fornecidos pelo Luís', 'needs_breakdown', CURRENT_DATE
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_expense_items pei WHERE pei.organization_id = o.id AND pei.name = 'Alimentação e pequenas despesas');

INSERT INTO pricing_expense_items (organization_id, version, name, description, category, kind, amount, periodicity, monthly_equivalent, included_in_pricing, includes_personnel, source, validation_state, effective_from)
SELECT o.id, 1, 'Prestação ao Fábio (aquisição)', 'Acordo de transição societária: 20.000 € em 24 prestações mensais (24 × 833,33 € = 19.999,92 €; última prestação ajustada em 841,41 € ou compensação acordada)', 'acquisition', 'cash_recovery', 833.33, 'monthly', 833.33, TRUE, FALSE, 'Orçamento inicial — valores fornecidos pelo Luís', 'estimated', CURRENT_DATE
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_expense_items pei WHERE pei.organization_id = o.id AND pei.name = 'Prestação ao Fábio (aquisição)');

-- Kits em falta
INSERT INTO consumable_kits (organization_id, code, name, kind, price)
SELECT o.id, 'kit-ppf-front', 'Kit de consumíveis — PPF frente', 'ppf_front', 20.00
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM consumable_kits ck WHERE ck.organization_id = o.id AND ck.code = 'kit-ppf-front');

INSERT INTO consumable_kits (organization_id, code, name, kind, price)
SELECT o.id, 'kit-wrap', 'Kit de consumíveis — wrap integral', 'wrap_full', 40.00
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM consumable_kits ck WHERE ck.organization_id = o.id AND ck.code = 'kit-wrap');
