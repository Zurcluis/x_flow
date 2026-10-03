-- Migration 000017: RLS em todas as tabelas do schema public + políticas de isolamento
-- Convenções: política FOR ALL com USING (o USING serve também de WITH CHECK);
-- GUCs 'app.current_organization_id' (org ativa), 'app.public_token' (tokens públicos)
-- e 'app.bootstrap_org_slug' (org de bootstrap) definidos pela camada de ligação.
-- current_setting(x, true) devolve NULL quando o GUC não está definido → linha invisível.

-- 1. Habilitar RLS em TODAS as tabelas do schema public (cobertura automática, inclui futuras)
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- 2. Tabelas com organization_id direto
DROP POLICY IF EXISTS org_isolation_appointments ON appointments;
CREATE POLICY org_isolation_appointments ON appointments
    FOR ALL
    USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_bays ON bays;
CREATE POLICY org_isolation_bays ON bays
    FOR ALL
    USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_customers ON customers;
CREATE POLICY org_isolation_customers ON customers
    FOR ALL
    USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_employees ON employees;
CREATE POLICY org_isolation_employees ON employees
    FOR ALL
    USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_absences ON employee_absences;
DROP POLICY IF EXISTS org_isolation_employee_absences ON employee_absences;
CREATE POLICY org_isolation_employee_absences ON employee_absences
    FOR ALL
    USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_films ON films;
CREATE POLICY org_isolation_films ON films
    FOR ALL
    USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_invoices ON invoices;
CREATE POLICY org_isolation_invoices ON invoices
    FOR ALL
    USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_locations ON locations;
CREATE POLICY org_isolation_locations ON locations
    FOR ALL
    USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_batches ON material_batches;
DROP POLICY IF EXISTS org_isolation_material_batches ON material_batches;
CREATE POLICY org_isolation_material_batches ON material_batches
    FOR ALL
    USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_materials ON materials;
CREATE POLICY org_isolation_materials ON materials
    FOR ALL
    USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_categories ON service_categories;
DROP POLICY IF EXISTS org_isolation_service_categories ON service_categories;
CREATE POLICY org_isolation_service_categories ON service_categories
    FOR ALL
    USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_services ON services;
CREATE POLICY org_isolation_services ON services
    FOR ALL
    USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_tools ON tools;
CREATE POLICY org_isolation_tools ON tools
    FOR ALL
    USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_vehicle_links ON vehicle_customer_links;
DROP POLICY IF EXISTS org_isolation_vehicle_customer_links ON vehicle_customer_links;
CREATE POLICY org_isolation_vehicle_links ON vehicle_customer_links
    FOR ALL
    USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_vehicles ON vehicles;
CREATE POLICY org_isolation_vehicles ON vehicles
    FOR ALL
    USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_work_orders ON work_orders;
CREATE POLICY org_isolation_work_orders ON work_orders
    FOR ALL
    USING (organization_id = current_organization_id());

-- 3. Tabelas filhas por FK ao pai (subquery no pai)

DROP POLICY IF EXISTS org_isolation_b2b ON b2b_accounts;
CREATE POLICY org_isolation_b2b ON b2b_accounts
    FOR ALL
    USING (customer_id IN (SELECT id FROM customers WHERE organization_id = current_organization_id()));

DROP POLICY IF EXISTS org_isolation_contacts ON customer_contacts;
CREATE POLICY org_isolation_contacts ON customer_contacts
    FOR ALL
    USING (customer_id IN (SELECT id FROM customers WHERE organization_id = current_organization_id()));

DROP POLICY IF EXISTS org_isolation_customer_communications ON customer_communications;
CREATE POLICY org_isolation_customer_communications ON customer_communications
    FOR ALL
    USING (customer_id IN (SELECT id FROM customers WHERE organization_id = current_organization_id()));

DROP POLICY IF EXISTS org_isolation_invoice_lines ON invoice_lines;
CREATE POLICY org_isolation_invoice_lines ON invoice_lines
    FOR ALL
    USING (invoice_id IN (SELECT id FROM invoices WHERE organization_id = current_organization_id()));

DROP POLICY IF EXISTS org_isolation_vehicle_notes ON vehicle_notes;
CREATE POLICY org_isolation_vehicle_notes ON vehicle_notes
    FOR ALL
    USING (vehicle_id IN (SELECT id FROM vehicles WHERE organization_id = current_organization_id()));

DROP POLICY IF EXISTS org_isolation_phases ON work_order_phases;
DROP POLICY IF EXISTS org_isolation_work_order_phases ON work_order_phases;
CREATE POLICY org_isolation_work_order_phases ON work_order_phases
    FOR ALL
    USING (work_order_id IN (SELECT id FROM work_orders WHERE organization_id = current_organization_id()));

DROP POLICY IF EXISTS org_isolation_work_order_checklist_items ON work_order_checklist_items;
CREATE POLICY org_isolation_work_order_checklist_items ON work_order_checklist_items
    FOR ALL
    USING (phase_id IN (
        SELECT p.id FROM work_order_phases p
        JOIN work_orders w ON w.id = p.work_order_id
        WHERE w.organization_id = current_organization_id()
    ));

DROP POLICY IF EXISTS org_isolation_work_order_material_usages ON work_order_material_usages;
CREATE POLICY org_isolation_work_order_material_usages ON work_order_material_usages
    FOR ALL
    USING (work_order_id IN (SELECT id FROM work_orders WHERE organization_id = current_organization_id()));

DROP POLICY IF EXISTS org_isolation_work_order_time_entries ON work_order_time_entries;
CREATE POLICY org_isolation_work_order_time_entries ON work_order_time_entries
    FOR ALL
    USING (work_order_id IN (SELECT id FROM work_orders WHERE organization_id = current_organization_id()));

-- 4. Orçamentos: isolamento por organização OU token público (página pública do cliente)
DROP POLICY IF EXISTS org_isolation_quotes ON quotes;
CREATE POLICY org_isolation_quotes ON quotes
    FOR ALL
    USING (
        organization_id = current_organization_id()
        OR public_token = current_setting('app.public_token', true)
    );

DROP POLICY IF EXISTS org_isolation_quote_options ON quote_options;
CREATE POLICY org_isolation_quote_options ON quote_options
    FOR ALL
    USING (quote_id IN (
        SELECT id FROM quotes
        WHERE organization_id = current_organization_id()
           OR public_token = current_setting('app.public_token', true)
    ));

DROP POLICY IF EXISTS org_isolation_quote_items ON quote_option_items;
DROP POLICY IF EXISTS org_isolation_quote_option_items ON quote_option_items;
CREATE POLICY org_isolation_quote_option_items ON quote_option_items
    FOR ALL
    USING (quote_option_id IN (
        SELECT qo.id FROM quote_options qo
        JOIN quotes q ON q.id = qo.quote_id
        WHERE q.organization_id = current_organization_id()
           OR q.public_token = current_setting('app.public_token', true)
    ));

DROP POLICY IF EXISTS org_isolation_quote_events ON quote_events;
CREATE POLICY org_isolation_quote_events ON quote_events
    FOR ALL
    USING (quote_id IN (
        SELECT id FROM quotes
        WHERE organization_id = current_organization_id()
           OR public_token = current_setting('app.public_token', true)
    ));

-- 5. Check-ins: isolamento por organização OU token público
DROP POLICY IF EXISTS org_isolation_checkins ON checkins;
CREATE POLICY org_isolation_checkins ON checkins
    FOR ALL
    USING (
        organization_id = current_organization_id()
        OR token = current_setting('app.public_token', true)
    );

DROP POLICY IF EXISTS org_isolation_checkin_photos ON checkin_photos;
CREATE POLICY org_isolation_checkin_photos ON checkin_photos
    FOR ALL
    USING (checkin_id IN (
        SELECT id FROM checkins
        WHERE organization_id = current_organization_id()
           OR token = current_setting('app.public_token', true)
    ));

DROP POLICY IF EXISTS org_isolation_checkin_damages ON checkin_damages;
CREATE POLICY org_isolation_checkin_damages ON checkin_damages
    FOR ALL
    USING (checkin_id IN (
        SELECT id FROM checkins
        WHERE organization_id = current_organization_id()
           OR token = current_setting('app.public_token', true)
    ));

-- 6. Entregas: isolamento por organização OU token público
DROP POLICY IF EXISTS org_isolation_deliveries ON deliveries;
CREATE POLICY org_isolation_deliveries ON deliveries
    FOR ALL
    USING (
        organization_id = current_organization_id()
        OR token = current_setting('app.public_token', true)
    );

-- 7. Garantias: isolamento por organização OU token público
DROP POLICY IF EXISTS org_isolation_warranties ON warranties;
CREATE POLICY org_isolation_warranties ON warranties
    FOR ALL
    USING (
        organization_id = current_organization_id()
        OR token = current_setting('app.public_token', true)
    );

-- 8. QC: por work_order da organização OU número de certificado (semi-público)
DROP POLICY IF EXISTS org_isolation_qc_inspections ON qc_inspections;
CREATE POLICY org_isolation_qc_inspections ON qc_inspections
    FOR ALL
    USING (
        work_order_id IN (SELECT id FROM work_orders WHERE organization_id = current_organization_id())
        OR certificate_number = current_setting('app.public_token', true)
    );

DROP POLICY IF EXISTS org_isolation_qc_items ON qc_items;
CREATE POLICY org_isolation_qc_items ON qc_items
    FOR ALL
    USING (inspection_id IN (
        SELECT id FROM qc_inspections
        WHERE work_order_id IN (SELECT id FROM work_orders WHERE organization_id = current_organization_id())
           OR certificate_number = current_setting('app.public_token', true)
    ));

-- 9. Organizações: a organização ativa OU a organização de bootstrap (definida no pool)
DROP POLICY IF EXISTS org_isolation_organizations ON organizations;
CREATE POLICY org_isolation_organizations ON organizations
    FOR ALL
    USING (
        id = current_organization_id()
        OR slug = current_setting('app.bootstrap_org_slug', true)
    );
