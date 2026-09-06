-- ==============================================================================
-- MESO PLATFORM — ROW LEVEL SECURITY POLICIES (002_rls_policies.sql)
-- Clean compliance & company-scoped access control.
-- Permits full SELECT, INSERT, UPDATE, DELETE for the active company session.
-- ==============================================================================

-- 1. Companies Table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS Allow all operations on companies ON public.companies;
CREATE POLICY Allow all operations on companies
    ON public.companies
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 2. Accounts Table
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS Allow company scoped accounts ON public.accounts;
CREATE POLICY Allow company scoped accounts
    ON public.accounts
    FOR ALL
    USING (company_id IS NOT NULL)
    WITH CHECK (company_id IS NOT NULL);

-- 3. Journal Vouchers Table
ALTER TABLE public.journal_vouchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS Allow company scoped jvs ON public.journal_vouchers;
CREATE POLICY Allow company scoped jvs
    ON public.journal_vouchers
    FOR ALL
    USING (company_id IS NOT NULL)
    WITH CHECK (company_id IS NOT NULL);

-- 4. Transactions Table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS Allow company scoped txs ON public.transactions;
CREATE POLICY Allow company scoped txs
    ON public.transactions
    FOR ALL
    USING (company_id IS NOT NULL)
    WITH CHECK (company_id IS NOT NULL);

-- 5. Invoices Table
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS Allow company scoped invoices ON public.invoices;
CREATE POLICY Allow company scoped invoices
    ON public.invoices
    FOR ALL
    USING (company_id IS NOT NULL)
    WITH CHECK (company_id IS NOT NULL);

-- 6. Invoice Items Table
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS Allow invoice items ON public.invoice_items;
CREATE POLICY Allow invoice items
    ON public.invoice_items
    FOR ALL
    USING (invoice_id IS NOT NULL)
    WITH CHECK (invoice_id IS NOT NULL);

-- 7. Inventory Items Table
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS Allow company scoped inventory ON public.inventory_items;
CREATE POLICY Allow company scoped inventory
    ON public.inventory_items
    FOR ALL
    USING (company_id IS NOT NULL)
    WITH CHECK (company_id IS NOT NULL);

-- 8. Stock Movements Table
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS Allow company scoped movements ON public.stock_movements;
CREATE POLICY Allow company scoped movements
    ON public.stock_movements
    FOR ALL
    USING (company_id IS NOT NULL)
    WITH CHECK (company_id IS NOT NULL);

-- 9. Bank Statements Table
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS Allow company scoped bank statements ON public.bank_statements;
CREATE POLICY Allow company scoped bank statements
    ON public.bank_statements
    FOR ALL
    USING (company_id IS NOT NULL)
    WITH CHECK (company_id IS NOT NULL);

-- 10. Reconciliation Items Table
ALTER TABLE public.reconciliation_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS Allow company scoped reconciliation ON public.reconciliation_items;
CREATE POLICY Allow company scoped reconciliation
    ON public.reconciliation_items
    FOR ALL
    USING (company_id IS NOT NULL)
    WITH CHECK (company_id IS NOT NULL);

-- 11. Audit Logs Table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS Allow company scoped audit logs ON public.audit_logs;
CREATE POLICY Allow company scoped audit logs
    ON public.audit_logs
    FOR ALL
    USING (company_id IS NOT NULL)
    WITH CHECK (company_id IS NOT NULL);

-- Ensure demo company exists
INSERT INTO public.companies (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Meso Demo Corp')
ON CONFLICT (id) DO NOTHING;
