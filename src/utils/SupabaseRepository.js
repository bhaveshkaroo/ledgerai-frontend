import { supabase } from '../supabaseClient';
import { CHART_OF_ACCOUNTS } from './LedgerEngine';

export const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

export const SupabaseRepository = {
  /**
   * Check whether tables have already been seeded for this company in Supabase.
   * Returns true if journal_vouchers has records, false if empty or error (e.g. table not created yet).
   */
  async isSeeded() {
    try {
      const { count, error } = await supabase
        .from('journal_vouchers')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', DEMO_COMPANY_ID);

      if (error) {
        console.warn('[Meso Persistence] isSeeded check error (table may not exist yet):', error.message);
        return false;
      }
      return count > 0;
    } catch (e) {
      console.warn('[Meso Persistence] isSeeded exception:', e.message);
      return false;
    }
  },

  /**
   * Seed Chart of Accounts master records
   */
  async seedAccounts() {
    try {
      const accountsPayload = CHART_OF_ACCOUNTS.map(a => ({
        company_id: DEMO_COMPANY_ID,
        name: a.name,
        type: a.type,
        classification: a.classification,
        section: a.section
      }));

      const { error } = await supabase
        .from('accounts')
        .upsert(accountsPayload, { onConflict: 'company_id,name' });

      if (error) {
        console.warn('[Meso Persistence] seedAccounts warning:', error.message);
      }
    } catch (e) {
      console.warn('[Meso Persistence] seedAccounts exception:', e.message);
    }
  },

  /**
   * Hydrate in-memory LedgerEngine transactions from Supabase
   */
  async loadTransactions() {
    try {
      const { data: jvs, error: jvError } = await supabase
        .from('journal_vouchers')
        .select(
          id,
          ref,
          date,
          narration,
          category,
          source,
          transactions (
            id,
            account_name,
            amount,
            type
          )
        )
        .eq('company_id', DEMO_COMPANY_ID)
        .order('date', { ascending: false });

      if (jvError || !jvs) {
        console.warn('[Meso Persistence] loadTransactions warning:', jvError?.message);
        return null;
      }

      const flatTransactions = [];
      jvs.forEach(jv => {
        if (jv.transactions && Array.isArray(jv.transactions)) {
          jv.transactions.forEach(t => {
            flatTransactions.push({
              id: t.id,
              date: jv.date,
              account: t.account_name,
              amount: Number(t.amount),
              type: t.type,
              narration: jv.narration,
              ref: jv.ref,
              category: jv.category
            });
          });
        }
      });

      flatTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      return flatTransactions;
    } catch (e) {
      console.warn('[Meso Persistence] loadTransactions exception:', e.message);
      return null;
    }
  },

  /**
   * Post a single 2-legged or multi-legged double-entry transaction to Supabase
   */
  async saveTransaction(date, narration, debitAccount, creditAccount, amount, category, ref) {
    try {
      // 1. Insert Journal Voucher header
      const { data: jv, error: jvError } = await supabase
        .from('journal_vouchers')
        .insert([{
          company_id: DEMO_COMPANY_ID,
          ref,
          date,
          narration,
          category,
          source: 'MANUAL'
        }])
        .select('id')
        .single();

      if (jvError || !jv) {
        console.warn('[Meso Persistence] saveTransaction JV error:', jvError?.message);
        return;
      }

      // 2. Insert debit and credit legs
      const { error: txError } = await supabase
        .from('transactions')
        .insert([
          {
            company_id: DEMO_COMPANY_ID,
            journal_voucher_id: jv.id,
            account_name: debitAccount,
            amount,
            type: 'Debit'
          },
          {
            company_id: DEMO_COMPANY_ID,
            journal_voucher_id: jv.id,
            account_name: creditAccount,
            amount,
            type: 'Credit'
          }
        ]);

      if (txError) {
        console.warn('[Meso Persistence] saveTransaction legs error:', txError.message);
      }
    } catch (e) {
      console.warn('[Meso Persistence] saveTransaction exception:', e.message);
    }
  },

  /**
   * Batch insert transactions on initial seed
   */
  async seedTransactionsBatch(transactions) {
    try {
      // Group flat transactions by ref
      const jvMap = new Map();
      transactions.forEach(t => {
        if (!jvMap.has(t.ref)) {
          jvMap.set(t.ref, {
            ref: t.ref,
            date: t.date,
            narration: t.narration,
            category: t.category,
            legs: []
          });
        }
        jvMap.get(t.ref).legs.push({
          account_name: t.account,
          amount: t.amount,
          type: t.type
        });
      });

      // Insert in chunks of 50 to avoid network payload limits
      const jvList = Array.from(jvMap.values());
      const CHUNK_SIZE = 50;
      for (let i = 0; i < jvList.length; i += CHUNK_SIZE) {
        const chunk = jvList.slice(i, i + CHUNK_SIZE);
        
        // Insert JVs
        const jvInserts = chunk.map(j => ({
          company_id: DEMO_COMPANY_ID,
          ref: j.ref,
          date: j.date,
          narration: j.narration,
          category: j.category,
          source: 'SEED'
        }));

        const { data: createdJvs, error: jvErr } = await supabase
          .from('journal_vouchers')
          .insert(jvInserts)
          .select('id, ref');

        if (jvErr || !createdJvs) {
          console.warn('[Meso Persistence] seed chunk error:', jvErr?.message);
          continue;
        }

        const jvIdLookup = new Map(createdJvs.map(j => [j.ref, j.id]));

        const allLegs = [];
        chunk.forEach(j => {
          const jvId = jvIdLookup.get(j.ref);
          if (jvId) {
            j.legs.forEach(leg => {
              allLegs.push({
                company_id: DEMO_COMPANY_ID,
                journal_voucher_id: jvId,
                account_name: leg.account_name,
                amount: leg.amount,
                type: leg.type
              });
            });
          }
        });

        if (allLegs.length > 0) {
          await supabase.from('transactions').insert(allLegs);
        }
      }
    } catch (e) {
      console.warn('[Meso Persistence] seedTransactionsBatch exception:', e.message);
    }
  },

  /**
   * Load invoices from Supabase
   */
  async loadInvoices() {
    try {
      const { data: invs, error } = await supabase
        .from('invoices')
        .select(
          id,
          invoice_number,
          date,
          party_name,
          place_of_supply,
          status,
          subtotal,
          cgst_total,
          sgst_total,
          igst_total,
          tax_amount,
          total,
          invoice_items (
            id,
            description,
            hsn_sac,
            quantity,
            rate,
            gst_rate,
            subtotal,
            cgst,
            sgst,
            igst,
            tax_amount,
            line_total
          )
        )
        .eq('company_id', DEMO_COMPANY_ID)
        .order('date', { ascending: false });

      if (error || !invs) {
        console.warn('[Meso Persistence] loadInvoices error:', error?.message);
        return null;
      }

      return invs.map(i => ({
        id: i.id,
        invoiceNumber: i.invoice_number,
        date: i.date,
        party: i.party_name,
        placeOfSupply: i.place_of_supply,
        status: i.status,
        subtotal: Number(i.subtotal),
        cgstTotal: Number(i.cgst_total),
        sgstTotal: Number(i.sgst_total),
        igstTotal: Number(i.igst_total),
        taxAmount: Number(i.tax_amount),
        total: Number(i.total),
        lineItems: (i.invoice_items || []).map(li => ({
          description: li.description,
          hsnSac: li.hsn_sac,
          qty: Number(li.quantity),
          rate: Number(li.rate),
          gstRate: Number(li.gst_rate),
          subtotal: Number(li.subtotal),
          cgst: Number(li.cgst),
          sgst: Number(li.sgst),
          igst: Number(li.igst),
          taxAmount: Number(li.tax_amount),
          total: Number(li.line_total)
        }))
      }));
    } catch (e) {
      console.warn('[Meso Persistence] loadInvoices exception:', e.message);
      return null;
    }
  },

  /**
   * Save a single invoice and its line items
   */
  async saveInvoice(invoice) {
    try {
      const { data: inv, error: invError } = await supabase
        .from('invoices')
        .insert([{
          company_id: DEMO_COMPANY_ID,
          invoice_number: invoice.invoiceNumber,
          date: invoice.date,
          party_name: invoice.party,
          place_of_supply: invoice.placeOfSupply,
          status: invoice.status,
          subtotal: invoice.subtotal,
          cgst_total: invoice.cgstTotal,
          sgst_total: invoice.sgstTotal,
          igst_total: invoice.igstTotal,
          tax_amount: invoice.taxAmount,
          total: invoice.total
        }])
        .select('id')
        .single();

      if (invError || !inv) {
        console.warn('[Meso Persistence] saveInvoice error:', invError?.message);
        return;
      }

      const itemsPayload = invoice.lineItems.map(item => ({
        invoice_id: inv.id,
        description: item.description,
        hsn_sac: item.hsnSac || item.hsn || '',
        quantity: item.qty,
        rate: item.rate,
        gst_rate: item.gstRate || 0,
        subtotal: item.subtotal || (item.qty * item.rate),
        cgst: item.cgst || 0,
        sgst: item.sgst || 0,
        igst: item.igst || 0,
        tax_amount: item.taxAmount || 0,
        line_total: item.total || (item.qty * item.rate)
      }));

      await supabase.from('invoice_items').insert(itemsPayload);
    } catch (e) {
      console.warn('[Meso Persistence] saveInvoice exception:', e.message);
    }
  },

  /**
   * Update invoice status (e.g. Finalized, Void)
   */
  async updateInvoiceStatus(invoiceNumber, status) {
    try {
      await supabase
        .from('invoices')
        .update({ status })
        .eq('company_id', DEMO_COMPANY_ID)
        .eq('invoice_number', invoiceNumber);
    } catch (e) {
      console.warn('[Meso Persistence] updateInvoiceStatus exception:', e.message);
    }
  },

  /**
   * Load Inventory items and movement logs
   */
  async loadInventory() {
    try {
      const { data: items, error: itemError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('company_id', DEMO_COMPANY_ID);

      const { data: movements, error: movError } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('company_id', DEMO_COMPANY_ID)
        .order('date', { ascending: false });

      if (itemError || !items) {
        console.warn('[Meso Persistence] loadInventory items error:', itemError?.message);
        return null;
      }

      const stock = {};
      items.forEach(i => {
        stock[i.item_name] = Array.isArray(i.fifo_batches) ? i.fifo_batches : [];
      });

      const parsedMovements = (movements || []).map(m => ({
        id: m.id,
        date: m.date,
        itemCode: m.ref || '',
        type: m.type,
        qty: Number(m.quantity),
        unitCost: Number(m.unit_cost),
        totalValue: Number(m.total_value),
        balanceQty: Number(m.balance_qty),
        ref: m.ref,
        party: m.party
      }));

      return { stock, movements: parsedMovements };
    } catch (e) {
      console.warn('[Meso Persistence] loadInventory exception:', e.message);
      return null;
    }
  },

  /**
   * Save or update inventory stock and log a stock movement
   */
  async saveStockRecord(itemCode, batches, movement) {
    try {
      const currentQty = batches.reduce((sum, b) => sum + b.qty, 0);
      const currentVal = batches.reduce((sum, b) => sum + (b.qty * b.unitCost), 0);

      const { data: savedItem } = await supabase
        .from('inventory_items')
        .upsert({
          company_id: DEMO_COMPANY_ID,
          item_name: itemCode,
          current_quantity: currentQty,
          fifo_batches: batches,
          current_valuation: currentVal
        }, { onConflict: 'company_id,item_name' })
        .select('id')
        .single();

      if (movement) {
        await supabase.from('stock_movements').insert([{
          company_id: DEMO_COMPANY_ID,
          inventory_item_id: savedItem?.id || null,
          date: movement.date,
          type: movement.type,
          quantity: movement.qty,
          unit_cost: movement.unitCost,
          total_value: movement.totalValue,
          balance_qty: movement.balanceQty,
          ref: movement.ref,
          party: movement.party
        }]);
      }
    } catch (e) {
      console.warn('[Meso Persistence] saveStockRecord exception:', e.message);
    }
  },

  /**
   * Save AI Audit Log
   */
  async saveAuditLog(role, action, message, details = null) {
    try {
      await supabase.from('audit_logs').insert([{
        company_id: DEMO_COMPANY_ID,
        role,
        action,
        message,
        details
      }]);
    } catch (e) {
      console.warn('[Meso Persistence] saveAuditLog exception:', e.message);
    }
  }
};
