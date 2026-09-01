import { LedgerEngine } from './LedgerEngine.js';
import { InventoryEngine } from './InventoryEngine.js';

// HSN/SAC to GST Rate Master Data (Textiles, Apparels & Services)
export const HSN_MASTER = {
  '5208': { description: 'Cotton Fabric 60s', rate: 5, type: 'goods' },
  '5007': { description: 'Silk Crepe Fabric', rate: 12, type: 'goods' },
  '5209': { description: 'Denim Weave 12oz', rate: 5, type: 'goods' },
  '5403': { description: 'Organic Dyed Rayon', rate: 12, type: 'goods' },
  '5302': { description: 'Linen Yarn 40s', rate: 5, type: 'goods' },
  '9983': { description: 'Design & Dyeing Services', rate: 18, type: 'services' },
  '8471': { description: 'Computers & IT Hardware', rate: 18, type: 'goods' }
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
      const master = HSN_MASTER[item.hsnSac] || { rate: 5, type: 'goods' };
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
        type: master.type,
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

    // Pre-check inventory if there are goods
    invoice.lineItems.forEach(item => {
      if (item.type === 'goods') {
        InventoryEngine.issueGoods(invoice.date, item.description, item.qty);
      }
    });

    // Post to Ledger
    LedgerEngine.postTransaction(
      invoice.date, 
      `Sales Invoice ${invoice.invoiceNumber} to ${invoice.party}`, 
      'Accounts Receivable', 
      'Sales Revenue', 
      invoice.subtotal, 
      'Sales', 
      invoice.invoiceNumber
    );
    
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
      LedgerEngine.postTransaction(
        new Date().toISOString().split('T')[0],
        `Reversal of Voided Invoice ${invoice.invoiceNumber}`, 
        'Sales Revenue',
        'Accounts Receivable',
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
    this.invoices = [];
    invoiceCounter = 1;

    const customers = [
      { name: 'Rajan Fabrics', item: 'Cotton Fabric 60s', hsn: '5208', rate: 260, baseQty: 400 },
      { name: 'Bombay Fashion House', item: 'Silk Crepe Fabric', hsn: '5007', rate: 680, baseQty: 250 },
      { name: 'Lucky Hosiery', item: 'Denim Weave 12oz', hsn: '5209', rate: 340, baseQty: 350 },
      { name: 'Mehta Garments', item: 'Organic Dyed Rayon', hsn: '5403', rate: 410, baseQty: 300 }
    ];

    // Seed sales invoices across 3 full years (2024 to 2026 = 36 months)
    for (let year = 2024; year <= 2026; year++) {
      for (let month = 1; month <= 12; month++) {
        const m = month.toString().padStart(2, '0');
        const isFestive = month === 10 || month === 11;

        customers.forEach((c, cIdx) => {
          const qty = isFestive ? Math.round(c.baseQty * 1.5) : c.baseQty;
          const inv = this.createInvoice(`${year}-${m}-${10 + cIdx * 4}`, c.name, [
            { description: c.item, hsnSac: c.hsn, qty, rate: c.rate }
          ], cIdx % 2 === 0 ? 'LOCAL' : 'INTERSTATE');

          this.finalizeInvoice(inv.invoiceNumber);
        });
      }
    }
  }
};

