import { LedgerEngine } from './LedgerEngine.js';

export const InventoryEngine = {
  // FIFO Queues for each item: { [itemCode]: [ { qty, unitCost, date } ] }
  stock: {},

  recordPurchase(date, itemCode, qty, unitCost, supplier) {
    if (!this.stock[itemCode]) {
      this.stock[itemCode] = [];
    }

    const totalCost = qty * unitCost;

    // Add to FIFO queue
    this.stock[itemCode].push({ qty, unitCost, date });

    // Post to Ledger
    // Dr. Inventory
    // Cr. Accounts Payable
    const ref = `PUR-${new Date(date).getFullYear()}-${Math.floor(Math.random() * 10000)}`;
    LedgerEngine.postTransaction(
      date,
      `Purchase of ${qty} ${itemCode} @ ${unitCost} from ${supplier}`,
      'Inventory',
      'Accounts Payable',
      totalCost,
      'Purchases',
      ref
    );

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

    // Post COGS to Ledger
    if (totalCogs > 0) {
      LedgerEngine.postTransaction(
        date,
        `COGS for sale of ${requiredQty} ${itemCode}`,
        'Cost of Goods Sold',
        'Inventory',
        totalCogs,
        'COGS',
        `COGS-${Date.now()}`
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

  seedPurchases() {
    // Seed purchases to satisfy the sales volume in InvoiceEngine
    for (let month = 4; month <= 15; month++) {
      const year = month > 12 ? 2026 : 2025;
      const m = (month > 12 ? month - 12 : month).toString().padStart(2, '0');
      const isFestive = month === 10 || month === 11;
      
      // Buy slightly more than we sell (Sales: 50 or 80 qty per month)
      const purchaseQty = isFestive ? 90 : 60; 
      
      // Assume unit cost fluctuates to prove FIFO works (Base cost 6000)
      const unitCost = 6000 + (month * 100); 
      
      this.recordPurchase(`${year}-${m}-05`, 'Computers', purchaseQty, unitCost, 'TechWholesale Inc');
    }
  }
};
