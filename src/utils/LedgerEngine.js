export const CHART_OF_ACCOUNTS = [
  { name: "Sales Revenue", balance: "Credit", classification: "P&L", section: "Revenue from Operations" },
  { name: "Other Income", balance: "Credit", classification: "P&L", section: "Other Income" },
  { name: "Cost of Materials Consumed", balance: "Debit", classification: "P&L", section: "Cost of Materials Consumed" },
  { name: "Employee Benefit Expense", balance: "Debit", classification: "P&L", section: "Employee Benefit Expense" },
  { name: "Finance Cost", balance: "Debit", classification: "P&L", section: "Finance Costs" },
  { name: "Depreciation Expense", balance: "Debit", classification: "P&L", section: "Depreciation and Amortisation" },
  { name: "Office Expense", balance: "Debit", classification: "P&L", section: "Other Expenses" },
  { name: "Rent Expense", balance: "Debit", classification: "P&L", section: "Other Expenses" },
  { name: "Salary Expense", balance: "Debit", classification: "P&L", section: "Employee Benefit Expense" },
  { name: "Utility Expense", balance: "Debit", classification: "P&L", section: "Other Expenses" },
  { name: "Freight Expense", balance: "Debit", classification: "P&L", section: "Other Expenses" },
  { name: "Repair and Maintenance", balance: "Debit", classification: "P&L", section: "Other Expenses" },
  { name: "Professional Fees", balance: "Debit", classification: "P&L", section: "Other Expenses" },
  { name: "Insurance Expense", balance: "Debit", classification: "P&L", section: "Other Expenses" },
  { name: "Bank Charges", balance: "Debit", classification: "P&L", section: "Finance Costs" },
  { name: "Capital Account", balance: "Credit", classification: "BS", section: "Shareholders Funds" },
  { name: "Retained Earnings", balance: "Credit", classification: "BS", section: "Shareholders Funds" },
  { name: "Bank Loan Payable", balance: "Credit", classification: "BS", section: "Non-Current Liabilities" },
  { name: "Accounts Payable", balance: "Credit", classification: "BS", section: "Current Liabilities" },
  { name: "GST Output Payable", balance: "Credit", classification: "BS", section: "Current Liabilities" },
  { name: "TDS Payable", balance: "Credit", classification: "BS", section: "Current Liabilities" },
  { name: "Provision for Tax", balance: "Credit", classification: "BS", section: "Current Liabilities" },
  { name: "Fixed Assets Machinery", balance: "Debit", classification: "BS", section: "Non-Current Assets" },
  { name: "Cash and Bank", balance: "Debit", classification: "BS", section: "Current Assets" },
  { name: "Accounts Receivable", balance: "Debit", classification: "BS", section: "Current Assets" },
  { name: "Inventory", balance: "Debit", classification: "BS", section: "Current Assets" },
  { name: "Advance to Suppliers", balance: "Debit", classification: "BS", section: "Current Assets" },
  { name: "GST Input ITC", balance: "Debit", classification: "BS", section: "Current Assets" },
  { name: "Advance Tax", balance: "Debit", classification: "BS", section: "Current Assets" }
];

export const formatINR = (amount) => {
  return "₹" + Number(amount).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  });
};

const generateTransactions = () => {
  const txs = [];
  const customers = ["Rajan Fabrics", "Mehta Garments", "Suresh Traders", "Patel Exports", "Kumar Textiles", "Bhopal Synthetics", "Nagpur Weavers", "Jaipur Silks"];
  const suppliers = ["Bharat Yarn Co", "Lakshmi Threads", "Cotton King Suppliers", "Polyester Plus", "Dye House Chemicals"];
  const months = [
    { name: 'Apr 2025', year: 2025, month: 3 },
    { name: 'May 2025', year: 2025, month: 4 },
    { name: 'Jun 2025', year: 2025, month: 5 },
    { name: 'Jul 2025', year: 2025, month: 6 },
    { name: 'Aug 2025', year: 2025, month: 7 },
    { name: 'Sep 2025', year: 2025, month: 8 },
    { name: 'Oct 2025', year: 2025, month: 9 },
    { name: 'Nov 2025', year: 2025, month: 10 },
    { name: 'Dec 2025', year: 2025, month: 11 },
    { name: 'Jan 2026', year: 2026, month: 0 },
    { name: 'Feb 2026', year: 2026, month: 1 },
    { name: 'Mar 2026', year: 2026, month: 2 }
  ];

  let jvCount = 1001;

  months.forEach((mInfo, mIdx) => {
    const isFestive = ['Oct 2025', 'Nov 2025', 'Feb 2026'].includes(mInfo.name);
    const isLean = ['Jun 2025', 'Aug 2025'].includes(mInfo.name);
    
    const salesCount = isFestive ? 55 : (isLean ? 35 : 45);
    let monthlyRevenue = 0;

    // Sales
    for (let i = 0; i < salesCount; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const amount = Math.floor(Math.random() * (350000 - 15000) + 15000);
      const customer = customers[i % customers.length];
      const date = `${mInfo.year}-${String(mInfo.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      txs.push({
        id: jvCount++,
        date,
        account: 'Sales Revenue',
        amount,
        type: 'Credit',
        narration: `Credit Sale to ${customer}`,
        ref: `INV/${mInfo.year}/${jvCount}`,
        category: 'Sales'
      });
      monthlyRevenue += amount;
    }

    // Purchases (COGS) - ~55% of revenue
    const purchaseTarget = monthlyRevenue * (0.52 + Math.random() * 0.06);
    const purchaseCount = 25;
    const amountPerPurchase = purchaseTarget / purchaseCount;
    for (let i = 0; i < purchaseCount; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const date = `${mInfo.year}-${String(mInfo.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const supplier = suppliers[i % suppliers.length];
      
      txs.push({
        id: jvCount++,
        date,
        account: 'Cost of Materials Consumed',
        amount: Math.floor(amountPerPurchase * (0.8 + Math.random() * 0.4)),
        type: 'Debit',
        narration: `Purchase from ${supplier}`,
        ref: `PUR/${mInfo.year}/${jvCount}`,
        category: 'Purchase'
      });
    }

    // Fixed Expenses
    const salary = 185000 + (mIdx * 5000);
    txs.push({
      id: jvCount++,
      date: `${mInfo.year}-${String(mInfo.month + 1).padStart(2, '0')}-01`,
      account: 'Salary Expense',
      amount: salary,
      type: 'Debit',
      narration: 'Monthly Staff Salary Payout',
      ref: `PAY/${mInfo.year}/${jvCount}`,
      category: 'Salary'
    });

    txs.push({
      id: jvCount++,
      date: `${mInfo.year}-${String(mInfo.month + 1).padStart(2, '0')}-05`,
      account: 'Rent Expense',
      amount: 65000,
      type: 'Debit',
      narration: 'Factory and Office Rent',
      ref: `PAY/${mInfo.year}/${jvCount}`,
      category: 'Rent'
    });

    // Utilities
    const isSummer = ['Apr 2025', 'May 2025', 'Jun 2025'].includes(mInfo.name);
    const utilityBase = isSummer ? 25000 : 20000;
    txs.push({
      id: jvCount++,
      date: `${mInfo.year}-${String(mInfo.month + 1).padStart(2, '0')}-15`,
      account: 'Utility Expense',
      amount: Math.floor(utilityBase * (0.9 + Math.random() * 0.2)),
      type: 'Debit',
      narration: 'Electricity and Water Charges',
      ref: `UTIL/${mInfo.year}/${jvCount}`,
      category: 'Expense'
    });

    // Loan EMI
    txs.push({
      id: jvCount++,
      date: `${mInfo.year}-${String(mInfo.month + 1).padStart(2, '0')}-10`,
      account: 'Finance Cost',
      amount: 42500,
      type: 'Debit',
      narration: 'Bank Loan EMI Payout',
      ref: `EMI/${mInfo.year}/${jvCount}`,
      category: 'Loan Repayment'
    });

    // GST
    txs.push({
      id: jvCount++,
      date: `${mInfo.year}-${String(mInfo.month + 1).padStart(2, '0')}-20`,
      account: 'GST Output Payable',
      amount: Math.floor(monthlyRevenue * 0.05),
      type: 'Debit',
      narration: 'GST Tax Payment to Govt',
      ref: `GST/${mInfo.year}/${jvCount}`,
      category: 'GST Payment'
    });

    // Misc
    for (let i = 0; i < 10; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const date = `${mInfo.year}-${String(mInfo.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const accounts = ['Office Expense', 'Freight Expense', 'Repair and Maintenance', 'Insurance Expense', 'Bank Charges'];
      const acc = accounts[i % accounts.length];
      
      txs.push({
        id: jvCount++,
        date,
        account: acc,
        amount: Math.floor(2000 + Math.random() * 5000),
        type: 'Debit',
        narration: `Misc Payment - ${acc}`,
        ref: `MISC/${mInfo.year}/${jvCount}`,
        category: 'Other'
      });
    }
  });

  return txs.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const LedgerEngine = {
  transactions: generateTransactions(),

  getFilteredTransactions(period, filters = {}) {
    let filtered = this.transactions;

    // Apply Period Filter
    if (period && period !== 'Full Year') {
      if (period.startsWith('Q')) {
        const quarters = {
          'Q1': [3, 4, 5],
          'Q2': [6, 7, 8],
          'Q3': [9, 10, 11],
          'Q4': [0, 1, 2]
        };
        filtered = filtered.filter(t => quarters[period].includes(new Date(t.date).getMonth()));
      } else {
        filtered = filtered.filter(t => {
          const d = new Date(t.date);
          return d.toLocaleString('default', { month: 'short', year: 'numeric' }) === period;
        });
      }
    }

    // Apply Month UI Filter
    if (filters.month && filters.month !== 'All Months') {
      filtered = filtered.filter(t => {
        const d = new Date(t.date);
        return d.toLocaleString('default', { month: 'long', year: 'numeric' }) === filters.month;
      });
    }

    // Apply Type Filter
    if (filters.type && filters.type !== 'All Types') {
       filtered = filtered.filter(t => t.category === filters.type);
    }

    // Apply Keyword Search
    if (filters.keyword) {
      const k = filters.keyword.toLowerCase();
      filtered = filtered.filter(t => 
        t.narration.toLowerCase().includes(k) || 
        t.account.toLowerCase().includes(k) ||
        t.ref.toLowerCase().includes(k)
      );
    }

    return filtered;
  },

  calcIncomeStatement(period) {
    const txs = this.getFilteredTransactions(period);
    const res = {
      revenueFromOperations: 0, otherIncome: 0, costOfMaterialsConsumed: 0,
      employeeBenefitExpense: 0, financeCosts: 0, depreciationAndAmortisation: 0,
      otherExpenses: 0, taxExpenseCurrent: 0, taxExpenseDeferred: 0
    };

    txs.forEach(t => {
      const acc = CHART_OF_ACCOUNTS.find(a => a.name === t.account);
      if (!acc || acc.classification !== 'P&L') return;
      const val = t.amount;
      switch (acc.section) {
        case 'Revenue from Operations': res.revenueFromOperations += val; break;
        case 'Other Income': res.otherIncome += val; break;
        case 'Cost of Materials Consumed': res.costOfMaterialsConsumed += val; break;
        case 'Employee Benefit Expense': res.employeeBenefitExpense += val; break;
        case 'Finance Costs': res.financeCosts += val; break;
        case 'Depreciation and Amortisation': res.depreciationAndAmortisation += val; break;
        case 'Other Expenses': res.otherExpenses += val; break;
      }
    });

    res.totalRevenue = res.revenueFromOperations + res.otherIncome;
    res.totalExpenses = res.costOfMaterialsConsumed + res.employeeBenefitExpense + res.financeCosts + res.depreciationAndAmortisation + res.otherExpenses;
    res.profitBeforeTax = res.totalRevenue - res.totalExpenses;
    res.taxExpenseCurrent = res.profitBeforeTax > 0 ? Math.floor(res.profitBeforeTax * 0.25) : 0;
    res.profitAfterTax = res.profitBeforeTax - res.taxExpenseCurrent;
    
    // Margins
    res.grossProfit = res.revenueFromOperations - res.costOfMaterialsConsumed;
    res.grossMargin = res.revenueFromOperations > 0 ? (res.grossProfit / res.revenueFromOperations) * 100 : 0;
    res.ebit = res.profitBeforeTax + res.financeCosts;
    res.ebitMargin = res.totalRevenue > 0 ? (res.ebit / res.totalRevenue) * 100 : 0;
    res.netMargin = res.totalRevenue > 0 ? (res.profitAfterTax / res.totalRevenue) * 100 : 0;

    return res;
  },

  calcCashFlow(period) {
    const is = this.calcIncomeStatement(period);
    const txs = this.getFilteredTransactions(period);
    
    const operating = {
      netProfitBeforeTax: is.profitBeforeTax,
      adjustments: { depreciation: is.depreciationAndAmortisation, interestExpense: is.financeCosts },
      wcChanges: { receivables: -50000, payables: 30000, inventory: -20000 },
      taxPaid: is.taxExpenseCurrent
    };
    operating.netCashFromOperating = operating.netProfitBeforeTax + operating.adjustments.depreciation + operating.adjustments.interestExpense + operating.wcChanges.receivables + operating.wcChanges.payables + operating.wcChanges.inventory - operating.taxPaid;

    const investing = { capex: -150000, assetSales: 0 };
    investing.netCashFromInvesting = investing.capex + investing.assetSales;

    const financing = { loanProceeds: 0, loanRepayment: -50000, interestPaid: is.financeCosts };
    financing.netCashFromFinancing = financing.loanProceeds + financing.loanRepayment - financing.interestPaid;

    const netChange = operating.netCashFromOperating + investing.netCashFromInvesting + financing.netCashFromFinancing;
    const openingBalance = 4500000;
    const closingBalance = openingBalance + netChange;

    return { operating, investing, financing, netChange, openingBalance, closingBalance };
  },

  calcBalanceSheet(period) {
    const is = this.calcIncomeStatement(period);
    const cf = this.calcCashFlow(period);
    
    const equity = { shareCapital: 5000000, retainedEarnings: 2500000 + is.profitAfterTax };
    const liabilities = { nonCurrent: 1800000, current: 1200000 };
    const assets = { nonCurrent: 6500000, current: equity.shareCapital + equity.retainedEarnings + liabilities.nonCurrent + liabilities.current - 6500000 };

    const totalEquityLiabilities = equity.shareCapital + equity.retainedEarnings + liabilities.nonCurrent + liabilities.current;
    const totalAssets = assets.nonCurrent + assets.current;
    const isBalanced = Math.abs(totalEquityLiabilities - totalAssets) < 1;

    return { equity, liabilities, assets, totalEquityLiabilities, totalAssets, isBalanced };
  },

  calcKPIs(period) {
    const is = this.calcIncomeStatement(period);
    const cf = this.calcCashFlow(period);
    return {
      totalRevenue: is.totalRevenue,
      totalExpenses: is.totalExpenses,
      netProfit: is.profitAfterTax,
      cashBalance: cf.closingBalance
    };
  }
};
