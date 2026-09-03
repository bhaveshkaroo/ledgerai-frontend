-- ==============================================================================
-- MESO PLATFORM - SUPABASE DATABASE MIGRATION (001_initial_schema.sql)
-- Multi-account ready with company_id column on every table.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS uuid-ossp;

-- 1. Companies Table (Tenant Root)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.companies (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Meso Demo Corp')
ON CONFLICT (id) DO NOTHING;

-- 2. Accounts Table (Chart of Accounts)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    classification TEXT NOT NULL,
    section TEXT NOT NULL,
    parent_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_company_account_name UNIQUE (company_id, name)
);
CREATE INDEX IF NOT EXISTS idx_accounts_company ON public.accounts(company_id);

-- 3. Journal Vouchers Table
CREATE TABLE IF NOT EXISTS public.journal_vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    ref TEXT NOT NULL,
    date DATE NOT NULL,
    narration TEXT,
    category TEXT,
    source TEXT DEFAULT 'MANUAL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_company_jv_ref UNIQUE (company_id, ref)
);
CREATE INDEX IF NOT EXISTS idx_jv_company_date ON public.journal_vouchers(company_id, date);

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    journal_voucher_id UUID NOT NULL REFERENCES public.journal_vouchers(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Debit', 'Credit')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tx_company_account ON public.transactions(company_id, account_name);
CREATE INDEX IF NOT EXISTS idx_tx_jv ON public.transactions(journal_voucher_id);

-- 5. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    date DATE NOT NULL,
    party_name TEXT NOT NULL,
    place_of_supply TEXT NOT NULL CHECK (place_of_supply IN ('LOCAL', 'INTERSTATE', 'INTER_STATE')),
    status TEXT NOT NULL CHECK (status IN ('Draft', 'Finalized', 'Void')),
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    cgst_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    sgst_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    igst_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_company_invoice_number UNIQUE (company_id, invoice_number)
);
CREATE INDEX IF NOT EXISTS idx_invoices_company_date ON public.invoices(company_id, date);

-- 6. Invoice Items Table
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    hsn_sac TEXT NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    rate NUMERIC(15, 2) NOT NULL,
    gst_rate NUMERIC(5, 2) NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL,
    cgst NUMERIC(15, 2) NOT NULL DEFAULT 0,
    sgst NUMERIC(15, 2) NOT NULL DEFAULT 0,
    igst NUMERIC(15, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    line_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);

-- 7. Inventory Items Table
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    current_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    fifo_batches JSONB NOT NULL DEFAULT '[]'::jsonb,
    current_valuation NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_company_item_name UNIQUE (company_id, item_name)
);
CREATE INDEX IF NOT EXISTS idx_inventory_company ON public.inventory_items(company_id);

-- 8. Stock Movements Table
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
    quantity NUMERIC(12, 2) NOT NULL,
    unit_cost NUMERIC(15, 2) NOT NULL,
    total_value NUMERIC(15, 2) NOT NULL,
    balance_qty NUMERIC(12, 2) NOT NULL,
    ref TEXT,
    party TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_movements_company_date ON public.stock_movements(company_id, date);

-- 9. Bank Statements Table
CREATE TABLE IF NOT EXISTS public.bank_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    raw_data JSONB NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_bank_statements_company ON public.bank_statements(company_id);

-- 10. Reconciliation Items Table
CREATE TABLE IF NOT EXISTS public.reconciliation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    bank_statement_id UUID REFERENCES public.bank_statements(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    matched_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reconciliation_company ON public.reconciliation_items(company_id);

-- 11. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role TEXT,
    action TEXT,
    message TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON public.audit_logs(company_id);
