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
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
};

export const LedgerEngine = {
  transactions: [
    // Mock data for FY 2025-26 (Apr 2025 - Mar 2026)
    // April 2025
    { date: '2025-04-10', account: 'Sales Revenue', amount: 1200000, type: 'Credit', narration: 'Monthly sales' },
    { date: '2025-04-15', account: 'Cost of Materials Consumed', amount: 400000, type: 'Debit', narration: 'Raw material purchase' },
    { date: '2025-04-20', account: 'Salary Expense', amount: 200000, type: 'Debit', narration: 'Staff salaries' },
    { date: '2025-04-25', account: 'Rent Expense', amount: 50000, type: 'Debit', narration: 'Office rent' },
    { date: '2025-04-28', account: 'Finance Cost', amount: 10000, type: 'Debit', narration: 'Bank interest' },
    // May 2025
    { date: '2025-05-12', account: 'Sales Revenue', amount: 1100000, type: 'Credit', narration: 'Monthly sales' },
    { date: '2025-05-18', account: 'Cost of Materials Consumed', amount: 450000, type: 'Debit', narration: 'Raw material purchase' },
    { date: '2025-05-25', account: 'Salary Expense', amount: 200000, type: 'Debit', narration: 'Staff salaries' },
    // June 2025
    { date: '2025-06-10', account: 'Sales Revenue', amount: 1300000, type: 'Credit', narration: 'Monthly sales' },
    { date: '2025-06-15', account: 'Cost of Materials Consumed', amount: 500000, type: 'Debit', narration: 'Raw material purchase' },
    // July 2025
    { date: '2025-07-10', account: 'Sales Revenue', amount: 1400000, type: 'Credit', narration: 'Monthly sales' },
    // Aug 2025
    { date: '2025-08-10', account: 'Sales Revenue', amount: 1500000, type: 'Credit', narration: 'Monthly sales' },
    // Sep 2025
    { date: '2025-09-10', account: 'Sales Revenue', amount: 1250000, type: 'Credit', narration: 'Monthly sales' },
    // Oct 2025
    { date: '2025-10-10', account: 'Sales Revenue', amount: 1600000, type: 'Credit', narration: 'Monthly sales' },
    // Nov 2025
    { date: '2025-11-10', account: 'Sales Revenue', amount: 1700000, type: 'Credit', narration: 'Monthly sales' },
    // Dec 2025
    { date: '2025-12-10', account: 'Sales Revenue', amount: 1800000, type: 'Credit', narration: 'Monthly sales' },
    // Jan 2026
    { date: '2026-01-10', account: 'Sales Revenue', amount: 1500000, type: 'Credit', narration: 'Monthly sales' },
    // Feb 2026
    { date: '2026-02-10', account: 'Sales Revenue', amount: 1400000, type: 'Credit', narration: 'Monthly sales' },
    // Mar 2026
    { date: '2026-03-10', account: 'Sales Revenue', amount: 1900000, type: 'Credit', narration: 'Monthly sales' }
  ],

  getFilteredTransactions(period) {
    if (period === 'Full Year') return this.transactions;
    if (period.startsWith('Q')) {
      const quarters = {
        'Q1': [3, 4, 5], // Apr, May, Jun (months are 0-indexed in Date, but here we'll use 1-12)
        'Q2': [6, 7, 8], // Jul, Aug, Sep
        'Q3': [9, 10, 11], // Oct, Nov, Dec
        'Q4': [0, 1, 2] // Jan, Feb, Mar 2026
      };
      return this.transactions.filter(t => {
        const date = new Date(t.date);
        const month = date.getMonth();
        return quarters[period].includes(month);
      });
    }
    // Monthly format like 'Apr 2025'
    return this.transactions.filter(t => {
      const date = new Date(t.date);
      const monthStr = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear();
      return monthStr === period;
    });
  },

  calcIncomeStatement(period) {
    const txs = this.getFilteredTransactions(period);
    const result = {
      revenueFromOperations: 0,
      otherIncome: 0,
      costOfMaterialsConsumed: 0,
      employeeBenefitExpense: 0,
      financeCosts: 0,
      depreciationAndAmortisation: 0,
      otherExpenses: 0,
      taxExpenseCurrent: 0,
      taxExpenseDeferred: 0
    };

    txs.forEach(t => {
      const account = CHART_OF_ACCOUNTS.find(a => a.name === t.account);
      if (!account || account.classification !== 'P&L') return;
      
      const val = t.amount;
      switch (account.section) {
        case 'Revenue from Operations': result.revenueFromOperations += val; break;
        case 'Other Income': result.otherIncome += val; break;
        case 'Cost of Materials Consumed': result.costOfMaterialsConsumed += val; break;
        case 'Employee Benefit Expense': result.employeeBenefitExpense += val; break;
        case 'Finance Costs': result.financeCosts += val; break;
        case 'Depreciation and Amortisation': result.depreciationAndAmortisation += val; break;
        case 'Other Expenses': result.otherExpenses += val; break;
      }
    });

    result.totalRevenue = result.revenueFromOperations + result.otherIncome;
    result.totalExpenses = result.costOfMaterialsConsumed + result.employeeBenefitExpense + result.financeCosts + result.depreciationAndAmortisation + result.otherExpenses;
    result.profitBeforeTax = result.totalRevenue - result.totalExpenses;
    
    // Simple tax calc 25%
    result.taxExpenseCurrent = result.profitBeforeTax > 0 ? result.profitBeforeTax * 0.25 : 0;
    result.profitAfterTax = result.profitBeforeTax - result.taxExpenseCurrent - result.taxExpenseDeferred;

    // Margins
    result.grossProfit = result.revenueFromOperations - result.costOfMaterialsConsumed;
    result.grossMargin = result.revenueFromOperations > 0 ? (result.grossProfit / result.revenueFromOperations) * 100 : 0;
    result.ebit = result.profitBeforeTax + result.financeCosts;
    result.ebitMargin = result.totalRevenue > 0 ? (result.ebit / result.totalRevenue) * 100 : 0;
    result.netMargin = result.totalRevenue > 0 ? (result.profitAfterTax / result.totalRevenue) * 100 : 0;

    return result;
  },

  calcCashFlow(period) {
    const is = this.calcIncomeStatement(period);
    // Simplified AS-3 Indirect method
    const operating = {
      netProfitBeforeTax: is.profitBeforeTax,
      adjustments: {
        depreciation: is.depreciationAndAmortisation,
        interestExpense: is.financeCosts
      },
      wcChanges: {
        receivables: -50000,
        payables: 30000,
        inventory: -20000
      },
      taxPaid: is.taxExpenseCurrent
    };
    operating.netCashFromOperating = operating.netProfitBeforeTax + operating.adjustments.depreciation + operating.adjustments.interestExpense + operating.wcChanges.receivables + operating.wcChanges.payables + operating.wcChanges.inventory - operating.taxPaid;

    const investing = {
      capex: -100000,
      assetSales: 0
    };
    investing.netCashFromInvesting = investing.capex + investing.assetSales;

    const financing = {
      loanProceeds: 0,
      loanRepayment: -50000,
      interestPaid: is.financeCosts
    };
    financing.netCashFromFinancing = financing.loanProceeds + financing.loanRepayment - financing.interestPaid;

    const netChange = operating.netCashFromOperating + investing.netCashFromInvesting + financing.netCashFromFinancing;
    const openingBalance = 2500000;
    const closingBalance = openingBalance + netChange;

    // Validate
    if (Math.abs((closingBalance - openingBalance) - netChange) > 0.01) {
      console.error("Cash Flow Statement does not balance!");
    }

    return { operating, investing, financing, netChange, openingBalance, closingBalance };
  },

  calcBalanceSheet(period) {
    // Mock snapshot for BS
    const equity = { shareCapital: 5000000, retainedEarnings: 3000000 };
    const liabilities = { nonCurrent: 2000000, current: 2000000 };
    const assets = { nonCurrent: 8000000, current: 4000000 };

    const totalEquityLiabilities = equity.shareCapital + equity.retainedEarnings + liabilities.nonCurrent + liabilities.current;
    const totalAssets = assets.nonCurrent + assets.current;

    const isBalanced = Math.abs(totalEquityLiabilities - totalAssets) < 0.01;

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
  },

  getLedgerEntries(accountName, period) {
    const txs = this.getFilteredTransactions(period);
    let runningBalance = accountName === 'Cash and Bank' ? 2500000 : 0; // Opening balance mock
    const entries = [];
    
    // Add opening balance entry
    entries.push({
      date: '2025-04-01',
      particulars: 'Opening Balance',
      ref: 'OB',
      debit: runningBalance > 0 ? runningBalance : 0,
      credit: runningBalance < 0 ? Math.abs(runningBalance) : 0,
      balance: Math.abs(runningBalance),
      type: runningBalance >= 0 ? 'Dr' : 'Cr'
    });

    txs.filter(t => t.account === accountName).forEach(t => {
      if (t.type === 'Debit') runningBalance += t.amount;
      else runningBalance -= t.amount;

      entries.push({
        date: t.date,
        particulars: t.narration,
        ref: 'JV',
        debit: t.type === 'Debit' ? t.amount : 0,
        credit: t.type === 'Credit' ? t.amount : 0,
        balance: Math.abs(runningBalance),
        type: runningBalance >= 0 ? 'Dr' : 'Cr'
      });
    });

    return entries;
  }
};
