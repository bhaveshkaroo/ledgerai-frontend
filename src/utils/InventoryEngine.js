import { LedgerEngine } from './LedgerEngine.js';

export const InventoryEngine = {
  // FIFO Queues for each item: { [itemCode]: [ { qty, unitCost, date } ] }
  stock: {},
  // Audit log of all stock movements: [ { id, date, itemCode, type: 'IN' | 'OUT', qty, unitCost, totalValue, balanceQty, ref } ]
  movements: [],

  recordPurchase(date, itemCode, qty, unitCost, supplier) {
    if (!this.stock[itemCode]) {
      this.stock[itemCode] = [];
    }

    const totalCost = qty * unitCost;

    // Add to FIFO queue
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
      totalValue: totalCost,
      balanceQty: currentBalanceQty,
      ref,
      party: supplier
    });

    // Post to Ledger
    // Dr. Inventory
    // Cr. Accounts Payable
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
    // Clear movements on re-seed to avoid duplicates
    this.movements = [];
    this.stock = {};

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
