import { ASValidationEngine } from './ASComplianceEngine';

export const CHART_OF_ACCOUNTS = [
  { name: "Sales Revenue", type: "Revenue", classification: "P&L", section: "Revenue from Operations" },
  { name: "Other Income", type: "Revenue", classification: "P&L", section: "Other Income" },
  { name: "Cost of Goods Sold", type: "Expense", classification: "P&L", section: "Cost of Materials Consumed" },
  { name: "Salary Expense", type: "Expense", classification: "P&L", section: "Employee Benefit Expense" },
  { name: "Rent Expense", type: "Expense", classification: "P&L", section: "Other Expenses" },
  { name: "Depreciation Expense", type: "Expense", classification: "P&L", section: "Depreciation and Amortisation" },
  { name: "Finance Cost", type: "Expense", classification: "P&L", section: "Finance Costs" },
  { name: "Tax Expense", type: "Expense", classification: "P&L", section: "Tax Expense" },
  
  { name: "Share Capital", type: "Equity", classification: "BS", section: "Share Capital" },
  { name: "Retained Earnings", type: "Equity", classification: "BS", section: "Reserves and Surplus" },
  { name: "Bank Loan", type: "Liability", classification: "BS", section: "Long-Term Borrowings" },
  { name: "Accounts Payable", type: "Liability", classification: "BS", section: "Trade Payables" },
  { name: "Tax Payable", type: "Liability", classification: "BS", section: "Short-Term Provisions" },
  
  { name: "Fixed Assets (Gross)", type: "Asset", classification: "BS", section: "Tangible Assets" },
  { name: "Accumulated Depreciation", type: "Contra Asset", classification: "BS", section: "Tangible Assets" },
  { name: "Inventory", type: "Asset", classification: "BS", section: "Inventories" },
  { name: "Accounts Receivable", type: "Asset", classification: "BS", section: "Trade Receivables" },
  { name: "Cash and Bank", type: "Asset", classification: "BS", section: "Cash and Cash Equivalents" },
];

export const formatINR = (amount) => {
  if (amount === null || amount === undefined) return '';
  return "₹" + Number(amount).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  });
};

export const formatCurrency = (amount, currency = 'INR') => {
  if (amount === null || amount === undefined) return '';
  return formatINR(amount); // Stubbed to INR for simplicity
};

// Generates STRICTLY BALANCED double-entry transactions
const generateBalancedTransactions = () => {
  const txs = [];
  let jvCount = 1000;
  
  const addEntry = (date, narration, debitAccount, creditAccount, amount, category) => {
    const ref = `JV-${++jvCount}`;
    // Debit leg
    txs.push({ id: jvCount + 'A', date, account: debitAccount, amount, type: 'Debit', narration, ref, category });
    // Credit leg
    txs.push({ id: jvCount + 'B', date, account: creditAccount, amount, type: 'Credit', narration, ref, category });
  };

  // 1. Initial Capital & Loan (April 2025)
  addEntry('2025-04-01', 'Initial Capital Injection', 'Cash and Bank', 'Share Capital', 5000000, 'Capital');
  addEntry('2025-04-05', 'Term Loan Received', 'Cash and Bank', 'Bank Loan', 2000000, 'Financing');
  addEntry('2025-04-10', 'Purchase of Factory Equipment', 'Fixed Assets (Gross)', 'Cash and Bank', 1500000, 'Investing');

  // Generate monthly operations
  for (let month = 4; month <= 15; month++) {
    const year = month > 12 ? 2026 : 2025;
    const m = (month > 12 ? month - 12 : month).toString().padStart(2, '0');
    
    const isFestive = month === 10 || month === 11; // Oct, Nov
    const salesVol = isFestive ? 800000 : 500000;
    
    // Sales
    addEntry(`${year}-${m}-15`, 'Sales to Customers', 'Accounts Receivable', 'Sales Revenue', salesVol, 'Sales');
    addEntry(`${year}-${m}-20`, 'Cash Collection from AR', 'Cash and Bank', 'Accounts Receivable', salesVol * 0.9, 'Receipts');
    
    // COGS & Purchases (Accrual AS 2)
    const cogsVol = salesVol * 0.4;
    const inventoryPurchase = cogsVol * 1.1; // Buy slightly more than sold
    addEntry(`${year}-${m}-05`, 'Purchase of Raw Materials', 'Inventory', 'Accounts Payable', inventoryPurchase, 'Purchases');
    addEntry(`${year}-${m}-28`, 'Cost of Goods Sold', 'Cost of Goods Sold', 'Inventory', cogsVol, 'COGS');
    addEntry(`${year}-${m}-25`, 'Payment to Suppliers', 'Accounts Payable', 'Cash and Bank', inventoryPurchase * 0.85, 'Payments');
    
    // Expenses
    addEntry(`${year}-${m}-01`, 'Monthly Rent', 'Rent Expense', 'Cash and Bank', 40000, 'Expense');
    addEntry(`${year}-${m}-07`, 'Staff Salaries', 'Salary Expense', 'Cash and Bank', 120000, 'Expense');
    addEntry(`${year}-${m}-15`, 'Interest on Term Loan', 'Finance Cost', 'Cash and Bank', 15000, 'Finance');
    
    // Depreciation (AS 10)
    addEntry(`${year}-${m}-28`, 'Monthly Depreciation', 'Depreciation Expense', 'Accumulated Depreciation', 12500, 'Depreciation');
  }

  // Year End Tax Provision (AS 22)
  addEntry('2026-03-31', 'Provision for Income Tax', 'Tax Expense', 'Tax Payable', 450000, 'Tax');

  return txs.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const LedgerEngine = {
  transactions: generateBalancedTransactions(),
  
  getFilteredTransactions(period, filters = {}) {
    return this.transactions; // Stubbed for brevity
  },

  getAccountBalance(accountName, asOfDate = '2099-12-31') {
    let balance = 0;
    const accConfig = CHART_OF_ACCOUNTS.find(a => a.name === accountName);
    if (!accConfig) return 0;
    
    const isDebitNormal = ['Asset', 'Expense'].includes(accConfig.type);
    
    this.transactions.forEach(t => {
      if (t.account === accountName && new Date(t.date) <= new Date(asOfDate)) {
        if (isDebitNormal) {
          balance += t.type === 'Debit' ? t.amount : -t.amount;
        } else {
          balance += t.type === 'Credit' ? t.amount : -t.amount;
        }
      }
    });
    return balance;
  },

  calcIncomeStatement(period) {
    // For simplicity, ignores period filtering and calculates full ledger P&L
    const rev = this.getAccountBalance('Sales Revenue');
    const otherInc = this.getAccountBalance('Other Income');
    const totalRev = rev + otherInc;
    
    const cogs = this.getAccountBalance('Cost of Goods Sold');
    const salaries = this.getAccountBalance('Salary Expense');
    const rent = this.getAccountBalance('Rent Expense');
    const dep = this.getAccountBalance('Depreciation Expense');
    const finCost = this.getAccountBalance('Finance Cost');
    
    const totalExp = cogs + salaries + rent + dep + finCost;
    const pbt = totalRev - totalExp;
    const tax = this.getAccountBalance('Tax Expense');
    const pat = pbt - tax;

    return [
      { name: "I. Revenue from Operations", value: rev, level: 0, isSummary: true },
      { name: "II. Other Income", value: otherInc, level: 0, isSummary: true },
      { name: "III. Total Revenue (I + II)", value: totalRev, level: 0, isSummary: true, isTotal: true },
      { name: "IV. Expenses", value: null, level: 0, isSummary: true },
      { name: "Cost of Materials Consumed", value: cogs, level: 1 },
      { name: "Employee Benefit Expense", value: salaries, level: 1 },
      { name: "Finance Costs", value: finCost, level: 1 },
      { name: "Depreciation and Amortisation", value: dep, level: 1 },
      { name: "Other Expenses", value: rent, level: 1 },
      { name: "Total Expenses", value: totalExp, level: 0, isSummary: true, isTotal: true },
      { name: "V. Profit Before Tax (III - IV)", value: pbt, level: 0, isSummary: true, isTotal: true },
      { name: "VI. Tax Expense", value: tax, level: 0, isSummary: true },
      { name: "VII. Profit After Tax (V - VI)", value: pat, level: 0, isSummary: true, isTotal: true },
    ];
  },

  calcBalanceSheet(period) {
    const sc = this.getAccountBalance('Share Capital');
    const pat = this.calcIncomeStatement().find(r => r.name.includes("Profit After Tax")).value;
    const re = this.getAccountBalance('Retained Earnings') + pat; // Roll up net profit
    
    const loan = this.getAccountBalance('Bank Loan');
    const ap = this.getAccountBalance('Accounts Payable');
    const taxPay = this.getAccountBalance('Tax Payable');
    
    const totalEqLiab = sc + re + loan + ap + taxPay;
    
    const faGross = this.getAccountBalance('Fixed Assets (Gross)');
    const accDep = this.getAccountBalance('Accumulated Depreciation');
    const faNet = faGross - accDep; // Contra asset reduction
    
    const inv = this.getAccountBalance('Inventory');
    const ar = this.getAccountBalance('Accounts Receivable');
    const cash = this.getAccountBalance('Cash and Bank');
    
    const totalAssets = faNet + inv + ar + cash;
    
    return [
      { name: "EQUITY AND LIABILITIES", value: null, level: 0, isSummary: true },
      { name: "1. Shareholders' Funds", value: null, level: 1, isSummary: true },
      { name: "Share Capital", value: sc, level: 2 },
      { name: "Reserves and Surplus", value: re, level: 2 },
      { name: "2. Non-Current Liabilities", value: null, level: 1, isSummary: true },
      { name: "Long-Term Borrowings", value: loan, level: 2 },
      { name: "3. Current Liabilities", value: null, level: 1, isSummary: true },
      { name: "Trade Payables", value: ap, level: 2 },
      { name: "Short-Term Provisions", value: taxPay, level: 2 },
      { name: "TOTAL EQUITY & LIABILITIES", value: totalEqLiab, level: 0, isSummary: true, isTotal: true },
      
      { name: "ASSETS", value: null, level: 0, isSummary: true },
      { name: "1. Non-Current Assets", value: null, level: 1, isSummary: true },
      { name: "Property, Plant and Equipment", value: faNet, level: 2 },
      { name: "2. Current Assets", value: null, level: 1, isSummary: true },
      { name: "Inventories", value: inv, level: 2 },
      { name: "Trade Receivables", value: ar, level: 2 },
      { name: "Cash and Cash Equivalents", value: cash, level: 2 },
      { name: "TOTAL ASSETS", value: totalAssets, level: 0, isSummary: true, isTotal: true },
    ];
  },

  calcCashFlow(period) {
    const is = this.calcIncomeStatement();
    const pbt = is.find(r => r.name.includes("Profit Before Tax")).value;
    const dep = this.getAccountBalance('Depreciation Expense');
    const finCost = this.getAccountBalance('Finance Cost');
    const tax = this.getAccountBalance('Tax Expense');
    const taxPay = this.getAccountBalance('Tax Payable');
    const actualTaxPaid = tax - taxPay;
    
    // AS 3 Indirect Method - Working Capital Changes
    const incAR = this.getAccountBalance('Accounts Receivable'); // since year 1
    const incInv = this.getAccountBalance('Inventory');
    const incAP = this.getAccountBalance('Accounts Payable');
    
    const opCF = pbt + dep + finCost - incAR - incInv + incAP - actualTaxPaid;
    
    const faPurchase = -this.getAccountBalance('Fixed Assets (Gross)');
    const invCF = faPurchase;
    
    const eqIssuance = this.getAccountBalance('Share Capital');
    const loanIssuance = this.getAccountBalance('Bank Loan');
    const finCF = eqIssuance + loanIssuance - finCost; // Interest paid
    
    const netCash = opCF + invCF + finCF;
    
    return [
      { name: "A. Cash Flow from Operating Activities", value: null, level: 0, isSummary: true },
      { name: "Net Profit Before Tax", value: pbt, level: 1 },
      { name: "Add: Depreciation", value: dep, level: 1 },
      { name: "Add: Finance Costs", value: finCost, level: 1 },
      { name: "Operating Profit Before WC Changes", value: pbt + dep + finCost, level: 1, isSummary: true },
      { name: "Less: Increase in Trade Receivables", value: -incAR, level: 1 },
      { name: "Less: Increase in Inventories", value: -incInv, level: 1 },
      { name: "Add: Increase in Trade Payables", value: incAP, level: 1 },
      { name: "Less: Income Tax Paid", value: -actualTaxPaid, level: 1 },
      { name: "Net Cash from Operating Activities", value: opCF, level: 0, isSummary: true, isTotal: true },
      
      { name: "B. Cash Flow from Investing Activities", value: null, level: 0, isSummary: true },
      { name: "Purchase of Fixed Assets", value: faPurchase, level: 1 },
      { name: "Net Cash from Investing Activities", value: invCF, level: 0, isSummary: true, isTotal: true },
      
      { name: "C. Cash Flow from Financing Activities", value: null, level: 0, isSummary: true },
      { name: "Proceeds from Share Capital", value: eqIssuance, level: 1 },
      { name: "Proceeds from Long-Term Borrowings", value: loanIssuance, level: 1 },
      { name: "Less: Interest Paid", value: -finCost, level: 1 },
      { name: "Net Cash from Financing Activities", value: finCF, level: 0, isSummary: true, isTotal: true },
      
      { name: "Net Increase in Cash and Cash Equivalents (A+B+C)", value: netCash, level: 0, isSummary: true, isTotal: true },
    ];
  },

  calcKPIs(period) {
    const cash = this.getAccountBalance('Cash and Bank');
    const is = this.calcIncomeStatement();
    const rev = is.find(r => r.name.includes("Total Revenue"))?.value || 0;
    const exp = is.find(r => r.name.includes("Total Expenses"))?.value || 0;
    const pat = is.find(r => r.name.includes("Profit After Tax"))?.value || 0;
    
    return {
      totalRevenue: rev,
      totalExpenses: exp,
      netProfit: pat,
      cashBalance: cash
    };
  }
};
