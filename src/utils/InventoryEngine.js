import { LedgerEngine } from './LedgerEngine.js';

export const InventoryEngine = {
  // FIFO Queues for each item: { [itemCode]: [ { qty, unitCost, date } ] }
  stock: {},
  // Audit log of all stock movements: [ { id, date, itemCode, type: 'IN' | 'OUT', qty, unitCost, totalValue, balanceQty, ref } ]
  movements: [],

  recordPurchase(date, itemCode, qty, unitCost, supplier, gstRate = 0.18) {
    if (!this.stock[itemCode]) {
      this.stock[itemCode] = [];
    }

    const baseCost = qty * unitCost;
    const cgst = Math.round(baseCost * (gstRate / 2));
    const sgst = Math.round(baseCost * (gstRate / 2));
    const totalInvoicePayable = baseCost + cgst + sgst;

    // Add to FIFO queue at pure cost basis (excl GST per AS 2)
    this.stock[itemCode].push({ qty, unitCost, date });

    const currentBalanceQty = this.stock[itemCode].reduce((sum, b) => sum + b.qty, 0);

    const ref = `PUR-${new Date(date).getFullYear()}-${Math.floor(Math.random() * 10000)}`;

    // Track movement
    this.movements.unshift({
      id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date,
      itemCode,
      type: 'IN',
      qty,
      unitCost,
      totalValue: baseCost,
      balanceQty: currentBalanceQty,
      ref,
      party: supplier
    });

    // Post Double-Entry to Ledger:
    // Dr. Inventory (Base cost)
    // Dr. Input CGST (9%)
    // Dr. Input SGST (9%)
    // Cr. Accounts Payable (Gross invoice amount)
    const idNum = LedgerEngine.transactions.length > 0 ? parseInt(LedgerEngine.transactions[0].id) + 1 : 1000;
    
    LedgerEngine.transactions.push({ id: `${idNum}A`, date, account: 'Inventory', amount: baseCost, type: 'Debit', narration: `Purchase of ${qty} ${itemCode} @ ${unitCost} from ${supplier}`, ref, category: 'Purchases' });
    LedgerEngine.transactions.push({ id: `${idNum}B`, date, account: 'Input CGST', amount: cgst, type: 'Debit', narration: `Input CGST on Purchase of ${itemCode} (${ref})`, ref, category: 'Purchases' });
    LedgerEngine.transactions.push({ id: `${idNum}C`, date, account: 'Input SGST', amount: sgst, type: 'Debit', narration: `Input SGST on Purchase of ${itemCode} (${ref})`, ref, category: 'Purchases' });
    LedgerEngine.transactions.push({ id: `${idNum}D`, date, account: 'Accounts Payable', amount: totalInvoicePayable, type: 'Credit', narration: `Invoice Payable to ${supplier} for ${qty} ${itemCode} (${ref})`, ref, category: 'Purchases' });

    LedgerEngine.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    return ref;
  },

  issueGoods(date, itemCode, requiredQty) {
    if (!this.stock[itemCode]) {
      this.stock[itemCode] = [];
    }

    let remainingQty = requiredQty;
    let totalCogs = 0;
    const batches = this.stock[itemCode];

    // Calculate available stock
    const available = batches.reduce((sum, b) => sum + b.qty, 0);
    if (available < requiredQty) {
      throw new Error(`Insufficient stock for ${itemCode}. Required: ${requiredQty}, Available: ${available}`);
    }

    // Process FIFO
    while (remainingQty > 0 && batches.length > 0) {
      const batch = batches[0];
      if (batch.qty <= remainingQty) {
        // Consume entire batch
        totalCogs += batch.qty * batch.unitCost;
        remainingQty -= batch.qty;
        batches.shift(); // Remove empty batch
      } else {
        // Consume partial batch
        totalCogs += remainingQty * batch.unitCost;
        batch.qty -= remainingQty;
        remainingQty = 0;
      }
    }

    const newBalanceQty = this.stock[itemCode].reduce((sum, b) => sum + b.qty, 0);
    const avgUnitCost = requiredQty > 0 ? (totalCogs / requiredQty) : 0;
    const ref = `COGS-${Date.now()}`;

    // Track movement
    this.movements.unshift({
      id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date,
      itemCode,
      type: 'OUT',
      qty: requiredQty,
      unitCost: avgUnitCost,
      totalValue: totalCogs,
      balanceQty: newBalanceQty,
      ref,
      party: 'Sales Fulfillment'
    });

    // Post COGS to Ledger
    if (totalCogs > 0) {
      LedgerEngine.postTransaction(
        date,
        `COGS for sale of ${requiredQty} ${itemCode}`,
        'Cost of Goods Sold',
        'Inventory',
        totalCogs,
        'COGS',
        ref
      );
    }

    return totalCogs;
  },

  getStockValuation() {
    let totalValue = 0;
    Object.keys(this.stock).forEach(itemCode => {
      this.stock[itemCode].forEach(batch => {
        totalValue += batch.qty * batch.unitCost;
      });
    });
    return totalValue;
  },

  getItemSummary() {
    return Object.keys(this.stock).map(itemCode => {
      const batches = this.stock[itemCode] || [];
      const totalQty = batches.reduce((sum, b) => sum + b.qty, 0);
      const totalValue = batches.reduce((sum, b) => sum + (b.qty * b.unitCost), 0);
      const unitCostBasis = totalQty > 0 ? (totalValue / totalQty) : 0;
      
      return {
        itemCode,
        totalQty,
        totalValue,
        unitCostBasis,
        batchesCount: batches.length
      };
    });
  },

  seedPurchases() {
    this.movements = [];
    this.stock = {};

    const suppliers = [
      { name: 'Gujarat Cotton Mills', item: 'Cotton Fabric 60s', baseCost: 140, gst: 0.05, baseQty: 450 },
      { name: 'Surat Silk Suppliers', item: 'Silk Crepe Fabric', baseCost: 380, gst: 0.12, baseQty: 260 },
      { name: 'Vardhman Textiles', item: 'Denim Weave 12oz', baseCost: 190, gst: 0.05, baseQty: 360 },
      { name: 'Tirupur Yarn Ltd', item: 'Linen Yarn 40s', baseCost: 220, gst: 0.05, baseQty: 300 },
      { name: 'Arvind Weaves', item: 'Organic Dyed Rayon', baseCost: 230, gst: 0.12, baseQty: 320 }
    ];

    // Seed purchases across 3 full years (2024 to 2026 = 36 months)
    for (let year = 2024; year <= 2026; year++) {
      for (let month = 1; month <= 12; month++) {
        const m = month.toString().padStart(2, '0');
        const isFestive = month === 10 || month === 11;

        suppliers.forEach((s) => {
          const qty = isFestive ? Math.round(s.baseQty * 1.4) : s.baseQty;
          const unitCost = s.baseCost + (month * 1.5);
          this.recordPurchase(`${year}-${m}-05`, s.item, qty, unitCost, s.name, s.gst);
        });
      }
    }
  }
};



