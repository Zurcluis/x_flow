-- Migration 000026: Backfill dos templates de checklist por fase de produção.
-- A tabela work_order_checklist_items nunca era alimentada na criação de fases;
-- sem itens, o painel da obra não permitia concluir nenhuma fase.

WITH templates(phase_key, label) AS (
  VALUES
    ('prep_decontamination', 'Pré-lavagem com foam neutro e limpeza de cavas de roda'),
    ('prep_decontamination', 'Descontaminação férrica química e clay bar suave'),
    ('prep_decontamination', 'Secagem com ar comprimido e desengorduramento com álcool isopropílico (IPA)'),
    ('disassembly', 'Desmontagem cuidada dos puxadores de porta e capas de espelhos'),
    ('disassembly', 'Remoção de emblemas com fio de corte e limpeza de resíduos'),
    ('film_cutting', 'Carregamento dos padrões digitais de corte (Plotter Software)'),
    ('film_cutting', 'Corte do rolo com folgas de remate de 8 mm'),
    ('application', 'Aplicação do capô com solução de gel slip e tack'),
    ('application', 'Aplicação do para-choques frontal e grelhas'),
    ('application', 'Aplicação das portas e guarda-lamas laterais'),
    ('assembly', 'Remontagem de puxadores e espelhos com verificação de aperto'),
    ('thermal_cure', 'Pós-aquecimento dos bordos e remates a 90 °C com pirómetro digital'),
    ('detailing_finish', 'Limpeza de vidros, aspiração interior e selante cerâmico sobre a película'),
    ('quality_control', 'Inspeção final com lâmpada Scangrip e emissão do Certificado QC'),
    ('subcontracted', 'Confirmar receção do serviço subcontratado'),
    ('subcontracted', 'Validar acabamento e conformidade com o fornecedor')
)
INSERT INTO work_order_checklist_items (phase_id, label, is_completed)
SELECT ph.id, t.label, false
FROM work_order_phases ph
JOIN templates t ON t.phase_key = ph.phase_key
WHERE NOT EXISTS (
  SELECT 1 FROM work_order_checklist_items ci WHERE ci.phase_id = ph.id
);
