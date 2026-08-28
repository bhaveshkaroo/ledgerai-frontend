import { LedgerEngine } from './LedgerEngine.js';

// HSN/SAC to GST Rate Master Data (Simulating what would back a real system)
export const HSN_MASTER = {
  '9983': { description: 'IT Services', rate: 18, type: 'services' },
  '8471': { description: 'Computers', rate: 18, type: 'goods' },
  '8517': { description: 'Phones', rate: 12, type: 'goods' },
  '0401': { description: 'Milk', rate: 0, type: 'goods' }
};

let invoiceCounter = 1;

export const InvoiceEngine = {
  invoices: [],

  createInvoice(date, party, lineItems, placeOfSupply = 'LOCAL') {
    let subtotal = 0;
    let totalTax = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    const enrichedLineItems = lineItems.map(item => {
      const master = HSN_MASTER[item.hsnSac] || { rate: 18 }; // Default 18% if unknown
      const itemSubtotal = item.qty * item.rate;
      const itemTax = itemSubtotal * (master.rate / 100);
      
      subtotal += itemSubtotal;
      totalTax += itemTax;

      let cgst = 0, sgst = 0, igst = 0;
      if (placeOfSupply === 'LOCAL') {
        cgst = itemTax / 2;
        sgst = itemTax / 2;
        cgstTotal += cgst;
        sgstTotal += sgst;
      } else {
        igst = itemTax;
        igstTotal += igst;
      }

      return {
        ...item,
        gstRate: master.rate,
        subtotal: itemSubtotal,
        cgst,
        sgst,
        igst,
        taxAmount: itemTax,
        total: itemSubtotal + itemTax
      };
    });

    const total = subtotal + totalTax;
    
    // Sequential, non-reusable invoice number
    const invoiceNumber = `INV-${new Date(date).getFullYear()}-${String(invoiceCounter++).padStart(3, '0')}`;

    const invoice = {
      invoiceNumber,
      date,
      party,
      placeOfSupply,
      lineItems: enrichedLineItems,
      subtotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      taxAmount: totalTax,
      total,
      status: 'Draft'
    };

    this.invoices.push(invoice);
    return invoice;
  },

  finalizeInvoice(invoiceNumber) {
    const invoice = this.invoices.find(inv => inv.invoiceNumber === invoiceNumber);
    if (!invoice) throw new Error("Invoice not found");
    if (invoice.status === 'Finalized') throw new Error("Invoice is already finalized");
    if (invoice.status === 'Void') throw new Error("Cannot finalize a voided invoice");

    // Post to Ledger
    // 1. Dr. Accounts Receivable (Total)
    // 2. Cr. Sales Revenue (Subtotal)
    // 3. Cr. Output CGST/SGST/IGST (Taxes)
    
    LedgerEngine.postTransaction(
      invoice.date, 
      `Sales Invoice ${invoice.invoiceNumber} to ${invoice.party}`, 
      'Accounts Receivable', 
      'Sales Revenue', 
      invoice.subtotal, 
      'Sales', 
      invoice.invoiceNumber
    );
    
    // Only post tax if there is tax
    if (invoice.cgstTotal > 0) {
      LedgerEngine.postTransaction(invoice.date, `CGST on ${invoice.invoiceNumber}`, 'Accounts Receivable', 'Output CGST', invoice.cgstTotal, 'Tax', `${invoice.invoiceNumber}-C`);
    }
    if (invoice.sgstTotal > 0) {
      LedgerEngine.postTransaction(invoice.date, `SGST on ${invoice.invoiceNumber}`, 'Accounts Receivable', 'Output SGST', invoice.sgstTotal, 'Tax', `${invoice.invoiceNumber}-S`);
    }
    if (invoice.igstTotal > 0) {
      LedgerEngine.postTransaction(invoice.date, `IGST on ${invoice.invoiceNumber}`, 'Accounts Receivable', 'Output IGST', invoice.igstTotal, 'Tax', `${invoice.invoiceNumber}-I`);
    }

    invoice.status = 'Finalized';
    return invoice;
  },

  voidInvoice(invoiceNumber) {
    const invoice = this.invoices.find(inv => inv.invoiceNumber === invoiceNumber);
    if (!invoice) throw new Error("Invoice not found");
    if (invoice.status === 'Void') throw new Error("Invoice already voided");

    if (invoice.status === 'Finalized') {
      // Reverse entries
      // Cr. Accounts Receivable
      // Dr. Sales Revenue
      LedgerEngine.postTransaction(
        new Date().toISOString().split('T')[0], // Voiding date is today
        `Reversal of Voided Invoice ${invoice.invoiceNumber}`, 
        'Sales Revenue', // Reverse is Dr Revenue
        'Accounts Receivable', // Cr AR
        invoice.subtotal, 
        'Sales', 
        `${invoice.invoiceNumber}-REV`
      );
      
      if (invoice.cgstTotal > 0) {
        LedgerEngine.postTransaction(new Date().toISOString().split('T')[0], `Reversal CGST ${invoice.invoiceNumber}`, 'Output CGST', 'Accounts Receivable', invoice.cgstTotal, 'Tax', `${invoice.invoiceNumber}-REV-C`);
      }
      if (invoice.sgstTotal > 0) {
        LedgerEngine.postTransaction(new Date().toISOString().split('T')[0], `Reversal SGST ${invoice.invoiceNumber}`, 'Output SGST', 'Accounts Receivable', invoice.sgstTotal, 'Tax', `${invoice.invoiceNumber}-REV-S`);
      }
      if (invoice.igstTotal > 0) {
        LedgerEngine.postTransaction(new Date().toISOString().split('T')[0], `Reversal IGST ${invoice.invoiceNumber}`, 'Output IGST', 'Accounts Receivable', invoice.igstTotal, 'Tax', `${invoice.invoiceNumber}-REV-I`);
      }
    }

    invoice.status = 'Void';
    return invoice;
  },

  getInvoice(invoiceNumber) {
    return this.invoices.find(inv => inv.invoiceNumber === invoiceNumber);
  },

  seedInvoices() {
    for (let month = 4; month <= 15; month++) {
      const year = month > 12 ? 2026 : 2025;
      const m = (month > 12 ? month - 12 : month).toString().padStart(2, '0');
      const isFestive = month === 10 || month === 11;
      
      const qty = isFestive ? 80 : 50;
      
      // We create an invoice matching the old 500k/800k sales volume roughly, 
      // but let's use actual item rates.
      // 50 * 10,000 = 500,000
      const inv = this.createInvoice(`${year}-${m}-15`, 'Acme Corp', [
        { description: 'Consulting Services', hsnSac: '9983', qty: qty, rate: 10000 }
      ], 'LOCAL');
      
      this.finalizeInvoice(inv.invoiceNumber);
    }
  }
};
