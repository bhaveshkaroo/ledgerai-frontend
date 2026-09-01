import { ASValidationEngine } from './ASComplianceEngine.js';

export const CHART_OF_ACCOUNTS = [
  { name: "Sales Revenue", type: "Revenue", classification: "P&L", section: "Revenue from Operations" },
  { name: "Other Income", type: "Revenue", classification: "P&L", section: "Other Income" },
  { name: "Cost of Goods Sold", type: "Expense", classification: "P&L", section: "Cost of Materials Consumed" },
  { name: "Salary Expense", type: "Expense", classification: "P&L", section: "Employee Benefit Expense" },
  { name: "Rent Expense", type: "Expense", classification: "P&L", section: "Other Expenses" },
  { name: "Depreciation Expense", type: "Expense", classification: "P&L", section: "Depreciation and Amortisation" },
  { name: "Finance Cost", type: "Expense", classification: "P&L", section: "Finance Costs" },
  { name: "Tax Expense", type: "Expense", classification: "P&L", section: "Tax Expense" },
  { name: "Other Expenses", type: "Expense", classification: "P&L", section: "Other Expenses" },
  { name: "Bank Charges", type: "Expense", classification: "P&L", section: "Other Expenses" },
  
  { name: "Share Capital", type: "Equity", classification: "BS", section: "Share Capital" },
  { name: "Retained Earnings", type: "Equity", classification: "BS", section: "Reserves and Surplus" },
  { name: "Bank Loan", type: "Liability", classification: "BS", section: "Long-Term Borrowings" },
  { name: "Deferred Tax Liability", type: "Liability", classification: "BS", section: "Long-Term Provisions" },
  { name: "Provision for Employee Benefits", type: "Liability", classification: "BS", section: "Long-Term Provisions" },
  { name: "Accounts Payable", type: "Liability", classification: "BS", section: "Trade Payables" },
  { name: "Tax Payable", type: "Liability", classification: "BS", section: "Short-Term Provisions" },
  { name: "Short-Term Provisions", type: "Liability", classification: "BS", section: "Short-Term Provisions" },
  { name: "Output CGST", type: "Liability", classification: "BS", section: "Short-Term Provisions" },
  { name: "Output SGST", type: "Liability", classification: "BS", section: "Short-Term Provisions" },
  { name: "Output IGST", type: "Liability", classification: "BS", section: "Short-Term Provisions" },
  { name: "Input CGST", type: "Asset", classification: "BS", section: "Other current assets" },
  { name: "Input SGST", type: "Asset", classification: "BS", section: "Other current assets" },
  { name: "Input IGST", type: "Asset", classification: "BS", section: "Other current assets" },
  
  { name: "Fixed Assets (Gross)", type: "Asset", classification: "BS", section: "Tangible Assets" },
  { name: "Accumulated Depreciation", type: "Contra Asset", classification: "BS", section: "Tangible Assets" },
  { name: "Intangible Assets (Gross)", type: "Asset", classification: "BS", section: "Intangible Assets" },
  { name: "Accumulated Amortization", type: "Contra Asset", classification: "BS", section: "Intangible Assets" },
  { name: "Deferred Tax Asset", type: "Asset", classification: "BS", section: "Non-current assets" },
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

// Generates STRICTLY BALANCED double-entry transactions across 3 full years (2024 to 2026)
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

  // 1. Initial Capital & Term/Working Capital Loan (January 2024)
  addEntry('2024-01-01', 'Initial Capital Injection', 'Cash and Bank', 'Share Capital', 5000000, 'Capital');
  addEntry('2024-01-05', 'Term & Working Capital Loan Disbursed', 'Cash and Bank', 'Bank Loan', 3000000, 'Financing');
  addEntry('2024-01-10', 'Purchase of Factory Equipment & Weaving Looms', 'Fixed Assets (Gross)', 'Cash and Bank', 1500000, 'Investing');




  // Generate 36 months of operational transactions (2024-01 to 2026-12)
  for (let year = 2024; year <= 2026; year++) {
    for (let month = 1; month <= 12; month++) {
      const m = month.toString().padStart(2, '0');
      const isFestive = month === 10 || month === 11;
      
      // Monthly gross billed sales are ~Rs 4.15L (festive ~Rs 6.22L)
      // Customers settle on 30-day terms (Month M is paid in Month M+1), leaving final month in AR (~Rs 4.15L / ~31 days DSO)
      if (year < 2026 || month < 12) {
        const monthlyGrossSales = isFestive ? 622083 : 414722;
        addEntry(`${year}-${m}-22`, `Customer Invoice Settlements (30-day cycle)`, 'Cash and Bank', 'Accounts Receivable', monthlyGrossSales, 'Receipts');
      }
      
      // Monthly gross purchases are ~Rs 2.71L (festive ~Rs 3.97L)
      // Vendors are paid on 35-day terms (Month M is paid in Month M+1), leaving final month in AP (~Rs 2.71L / ~35-40 days DPO)
      if (year < 2026 || month < 12) {
        const monthlyGrossPurchases = isFestive ? 396800 : 271208;
        addEntry(`${year}-${m}-26`, `Supplier Invoice Payments (35-day credit terms)`, 'Accounts Payable', 'Cash and Bank', monthlyGrossPurchases, 'Payments');
      }


      
      // Operating Expenses
      addEntry(`${year}-${m}-01`, 'Monthly Factory & Office Rent', 'Rent Expense', 'Cash and Bank', 35000, 'Expense');
      addEntry(`${year}-${m}-07`, 'Staff & Worker Salaries', 'Salary Expense', 'Cash and Bank', 110000, 'Expense');
      addEntry(`${year}-${m}-15`, 'Interest on Term Loan', 'Finance Cost', 'Cash and Bank', 15000, 'Finance');
      addEntry(`${year}-${m}-20`, 'Power & Factory Utilities', 'Other Expenses', 'Cash and Bank', 20000, 'Expense');
      
      // Depreciation (AS 10)
      addEntry(`${year}-${m}-28`, 'Monthly Plant & Machinery Depreciation', 'Depreciation Expense', 'Accumulated Depreciation', 12500, 'Depreciation');
    }


    // Year End Adjustments for each fiscal year
    addEntry(`${year}-03-31`, `Annual Income Tax Provision FY ${year-1}-${year.toString().slice(2)}`, 'Tax Expense', 'Tax Payable', 110000, 'Tax');
    addEntry(`${year}-03-31`, 'Deferred Tax Asset Recognition (AS 22)', 'Deferred Tax Asset', 'Tax Expense', 15000, 'Tax');
    addEntry(`${year}-03-31`, 'Gratuity & Employee Benefit Provision (AS 15)', 'Salary Expense', 'Provision for Employee Benefits', 40000, 'Expense');
  }

  // AS 26 Intangible Asset Purchase (ERP System in Oct 2024)
  addEntry('2024-10-01', 'Purchase of ERP Software License', 'Intangible Assets (Gross)', 'Cash and Bank', 300000, 'Investing');
  addEntry('2025-03-31', 'Amortization of Software', 'Depreciation Expense', 'Accumulated Amortization', 50000, 'Depreciation');
  addEntry('2026-03-31', 'Amortization of Software', 'Depreciation Expense', 'Accumulated Amortization', 50000, 'Depreciation');

  return txs.sort((a, b) => new Date(b.date) - new Date(a.date));
};



export const LedgerEngine = {
  transactions: generateBalancedTransactions(),
  
  postTransaction(date, narration, debitAccount, creditAccount, amount, category, ref = null) {
    const idNum = this.transactions.length > 0 ? parseInt(this.transactions[0].id) + 1 : 1000;
    const txRef = ref || `MNL-${idNum}`;
    
    this.transactions.push({ id: idNum + 'A', date, account: debitAccount, amount, type: 'Debit', narration, ref: txRef, category });
    this.transactions.push({ id: idNum + 'B', date, account: creditAccount, amount, type: 'Credit', narration, ref: txRef, category });
    
    // Maintain descending sort
    this.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  reverseTransaction(targetRef, reason = 'Correction of error') {
    const legsToReverse = this.transactions.filter(t => t.ref === targetRef);
    if (legsToReverse.length === 0) return false;

    const date = new Date().toISOString().split('T')[0];
    const idNum = this.transactions.length > 0 ? parseInt(this.transactions[0].id) + 1 : 1000;
    const revRef = `REV-${targetRef}`;

    legsToReverse.forEach((leg, idx) => {
      const oppositeType = leg.type === 'Debit' ? 'Credit' : 'Debit';
      this.transactions.push({
        id: `${idNum}${String.fromCharCode(65 + idx)}`,
        date,
        account: leg.account,
        amount: leg.amount,
        type: oppositeType,
        narration: `Contra Reversal of ${targetRef}: ${reason}`,
        ref: revRef,
        category: leg.category || 'Adjustment'
      });
    });

    this.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    return revRef;
  },

  updateNarration(targetRef, newNarration) {
    let updated = false;
    this.transactions.forEach(t => {
      if (t.ref === targetRef) {
        t.narration = newNarration;
        updated = true;
      }
    });
    return updated;
  },

  batchFixMissingNarrations() {
    let count = 0;
    this.transactions.forEach(t => {
      if (!t.narration || t.narration.trim() === '') {
        t.narration = `Standard entry for ${t.account} (${t.category || 'General'})`;
        count++;
      }
    });
    return count;
  },

  reclassifyTransaction(targetRef, oldAccount, newAccount) {
    let updated = false;
    this.transactions.forEach(t => {
      if (t.ref === targetRef && t.account === oldAccount) {
        t.account = newAccount;
        updated = true;
      }
    });
    return updated;
  },
  
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

  calcTradingAccount(period) {
    const rev = this.getAccountBalance('Sales Revenue');
    
    // Purchases and Inventory
    const cogs = this.getAccountBalance('Cost of Goods Sold');
    const closingInventory = this.getAccountBalance('Inventory');
    const purchasesOfStock = cogs + closingInventory; // Under AS 2, purchases = consumed + closing
    const openingInventory = 0; // Simplified for Year 1
    
    const grossProfit = rev - (openingInventory + purchasesOfStock - closingInventory);
    
    return [
      { name: "Particulars", value: null, level: 0, isSummary: true, isHeader: true },
      { name: "Opening Stock", value: openingInventory, level: 1 },
      { name: "Add: Purchases", value: purchasesOfStock, level: 1 },
      { name: "Less: Closing Stock", value: -closingInventory, level: 1 },
      { name: "Cost of Goods Sold", value: openingInventory + purchasesOfStock - closingInventory, level: 0, isSummary: true, isTotal: true },
      { name: "Sales Revenue", value: rev, level: 1 },
      { name: "Gross Profit / (Loss) carried to P&L", value: grossProfit, level: 0, isSummary: true, isTotal: true }
    ];
  },

  calcIncomeStatement(period) {
    const rev = this.getAccountBalance('Sales Revenue');
    const otherInc = this.getAccountBalance('Other Income');
    const totalRev = rev + otherInc;
    
    const cogs = this.getAccountBalance('Cost of Goods Sold');
    
    // For presentation per Schedule III
    const closingInventory = this.getAccountBalance('Inventory');
    const purchasesOfStock = cogs + closingInventory; // Since opening is 0 in year 1
    const changesInInventory = -closingInventory; // Increase in inventory is a negative expense

    const salaries = this.getAccountBalance('Salary Expense');
    const rent = this.getAccountBalance('Rent Expense');
    const otherExp = this.getAccountBalance('Other Expenses');
    const bankChg = this.getAccountBalance('Bank Charges');
    const dep = this.getAccountBalance('Depreciation Expense');
    const finCost = this.getAccountBalance('Finance Cost');
    
    const totalExp = purchasesOfStock + changesInInventory + salaries + rent + otherExp + bankChg + dep + finCost;
    const pbt = totalRev - totalExp;
    const currentTax = this.getAccountBalance('Tax Payable'); // Actual provision for the year
    const defTaxAsset = this.getAccountBalance('Deferred Tax Asset');
    const defTaxLiab = this.getAccountBalance('Deferred Tax Liability');
    const deferredTaxExpense = defTaxLiab - defTaxAsset; // Net deferred tax expense
    const totalTax = currentTax + deferredTaxExpense;
    const pat = pbt - totalTax;

    return [
      { name: "I. Revenue from operations", value: rev, level: 0, isSummary: true },
      { name: "II. Other income", value: otherInc, level: 0, isSummary: true },
      { name: "III. Total Revenue (I + II)", value: totalRev, level: 0, isSummary: true, isTotal: true },
      { name: "IV. Expenses", value: null, level: 0, isSummary: true },
      { name: "Cost of materials consumed", value: 0, level: 1 },
      { name: "Purchases of Stock-in-Trade", value: purchasesOfStock, level: 1 },
      { name: "Changes in inventories", value: changesInInventory, level: 1 },
      { name: "Employee benefits expense", value: salaries, level: 1 },
      { name: "Finance costs", value: finCost, level: 1 },
      { name: "Depreciation and amortization expense", value: dep, level: 1 },
      { name: "Other expenses", value: rent + otherExp + bankChg, level: 1 },
      { name: "IV. Total expenses", value: totalExp, level: 0, isSummary: true, isTotal: true },
      { name: "V. Profit before exceptional and extraordinary items and tax (III-IV)", value: pbt, level: 0, isSummary: true, isTotal: true },
      { name: "VI. Exceptional items", value: 0, level: 0, isSummary: true },
      { name: "VII. Profit before extraordinary items and tax (V-VI)", value: pbt, level: 0, isSummary: true, isTotal: true },
      { name: "VIII. Extraordinary items", value: 0, level: 0, isSummary: true },
      { name: "IX. Profit before tax (VII-VIII)", value: pbt, level: 0, isSummary: true, isTotal: true },
      { name: "X. Tax expense:", value: null, level: 0, isSummary: true },
      { name: "(1) Current tax", value: currentTax, level: 1 },
      { name: "(2) Deferred tax", value: deferredTaxExpense, level: 1 },
      { name: "XI. Profit (Loss) for the period from continuing operations (IX-X)", value: pat, level: 0, isSummary: true, isTotal: true },
    ];
  },

  calcBalanceSheet(period) {
    const sc = this.getAccountBalance('Share Capital');
    const pat = this.calcIncomeStatement().find(r => r.name.includes("Profit (Loss) for the period")).value;
    const re = this.getAccountBalance('Retained Earnings') + pat; // Roll up net profit
    
    const loan = this.getAccountBalance('Bank Loan');
    const defTaxLiab = this.getAccountBalance('Deferred Tax Liability');
    const provEmployee = this.getAccountBalance('Provision for Employee Benefits');
    
    const ap = this.getAccountBalance('Accounts Payable');
    const taxPay = this.getAccountBalance('Tax Payable');
    const stProv = this.getAccountBalance('Short-Term Provisions');
    
    const outCGST = this.getAccountBalance('Output CGST');
    const outSGST = this.getAccountBalance('Output SGST');
    const outIGST = this.getAccountBalance('Output IGST');
    const totalCurrentLiabProv = taxPay + stProv + outCGST + outSGST + outIGST;
    
    const totalEqLiab = sc + re + loan + defTaxLiab + provEmployee + ap + totalCurrentLiabProv;
    
    const faGross = this.getAccountBalance('Fixed Assets (Gross)');
    const accDep = this.getAccountBalance('Accumulated Depreciation');
    const faNet = faGross - accDep; // Tangible Net
    
    const intGross = this.getAccountBalance('Intangible Assets (Gross)');
    const accAmort = this.getAccountBalance('Accumulated Amortization');
    const intNet = intGross - accAmort; // Intangible Net
    
    const defTaxAsset = this.getAccountBalance('Deferred Tax Asset');
    
    // AS 22 states Deferred Tax Asset/Liability should be presented net if legally enforceable
    let netDTA = 0;
    let netDTL = 0;
    if (defTaxAsset > defTaxLiab) {
        netDTA = defTaxAsset - defTaxLiab;
    } else {
        netDTL = defTaxLiab - defTaxAsset;
    }
    
    const inv = this.getAccountBalance('Inventory');
    const ar = this.getAccountBalance('Accounts Receivable');
    const cash = this.getAccountBalance('Cash and Bank');
    
    const inCGST = this.getAccountBalance('Input CGST');
    const inSGST = this.getAccountBalance('Input SGST');
    const inIGST = this.getAccountBalance('Input IGST');
    const otherCurrentAssets = inCGST + inSGST + inIGST;
    
    const totalAssets = faNet + intNet + netDTA + inv + ar + cash + otherCurrentAssets;
    
    return [
      { name: "I. EQUITY AND LIABILITIES", value: null, level: 0, isSummary: true },
      { name: "1. Shareholders' funds", value: null, level: 1, isSummary: true },
      { name: "(a) Share capital", value: sc, level: 2 },
      { name: "(b) Reserves and surplus", value: re, level: 2 },
      { name: "(c) Money received against share warrants", value: 0, level: 2 },
      { name: "2. Share application money pending allotment", value: 0, level: 1, isSummary: true },
      { name: "3. Non-current liabilities", value: null, level: 1, isSummary: true },
      { name: "(a) Long-term borrowings", value: loan, level: 2 },
      { name: "(b) Deferred tax liabilities (Net)", value: netDTL, level: 2 },
      { name: "(c) Other Long term liabilities", value: 0, level: 2 },
      { name: "(d) Long-term provisions", value: provEmployee, level: 2 },
      { name: "4. Current liabilities", value: null, level: 1, isSummary: true },
      { name: "(a) Short-term borrowings", value: 0, level: 2 },
      { name: "(b) Trade payables", value: ap, level: 2 },
      { name: "(c) Other current liabilities", value: 0, level: 2 },
      { name: "(d) Short-term provisions (incl GST)", value: totalCurrentLiabProv, level: 2 },
      { name: "TOTAL EQUITY AND LIABILITIES", value: totalEqLiab, level: 0, isSummary: true, isTotal: true },
      
      { name: "II. ASSETS", value: null, level: 0, isSummary: true },
      { name: "1. Non-current assets", value: null, level: 1, isSummary: true },
      { name: "(a) Property, Plant and Equipment and Intangible assets", value: null, level: 2, isSummary: true },
      { name: "(i) Property, Plant and Equipment", value: faNet, level: 3 },
      { name: "(ii) Intangible assets", value: intNet, level: 3 },
      { name: "(iii) Capital work-in-progress", value: 0, level: 3 },
      { name: "(iv) Intangible assets under development", value: 0, level: 3 },
      { name: "(b) Non-current investments", value: 0, level: 2 },
      { name: "(c) Deferred tax assets (net)", value: netDTA, level: 2 },
      { name: "(d) Long-term loans and advances", value: 0, level: 2 },
      { name: "(e) Other non-current assets", value: 0, level: 2 },
      { name: "2. Current assets", value: null, level: 1, isSummary: true },
      { name: "(a) Current investments", value: 0, level: 2 },
      { name: "(b) Inventories", value: inv, level: 2 },
      { name: "(c) Trade receivables", value: ar, level: 2 },
      { name: "(d) Cash and cash equivalents", value: cash, level: 2 },
      { name: "(e) Short-term loans and advances", value: 0, level: 2 },
      { name: "(f) Other current assets (incl ITC)", value: otherCurrentAssets, level: 2 },
      { name: "TOTAL ASSETS", value: totalAssets, level: 0, isSummary: true, isTotal: true },
    ];
  },

  calcCashFlow(period) {
    const is = this.calcIncomeStatement();
    const pbt = is.find(r => r.name.toLowerCase().includes("profit before tax")).value;
    const dep = this.getAccountBalance('Depreciation Expense');
    const finCost = this.getAccountBalance('Finance Cost');
    const taxPayable = this.getAccountBalance('Tax Payable');
    const currentTax = this.getAccountBalance('Tax Payable'); // from P&L logic
    // Add back non-cash provisions
    const provEmployee = this.getAccountBalance('Provision for Employee Benefits');
    const stProv = this.getAccountBalance('Short-Term Provisions');
    
    // In a real system, actual tax paid = Opening Tax Payable + Current Tax Provision - Closing Tax Payable.
    // For this mock, assume half is paid, half is payable, or just use difference
    const actualTaxPaid = currentTax - taxPayable; // Since it's year 1, this will be 0 for now.
    
    // AS 3 Indirect Method - Working Capital Changes
    // For Year 1, change is equal to ending balance.
    const incAR = this.getAccountBalance('Accounts Receivable');
    const incInv = this.getAccountBalance('Inventory');
    const incAP = this.getAccountBalance('Accounts Payable');
    
    // Add provisions to operating cash flow before WC changes
    const opCFBeforeWC = pbt + dep + finCost + provEmployee + stProv;
    const opCF = opCFBeforeWC - incAR - incInv + incAP - actualTaxPaid;
    
    const faPurchase = -this.getAccountBalance('Fixed Assets (Gross)');
    const intPurchase = -this.getAccountBalance('Intangible Assets (Gross)');
    const invCF = faPurchase + intPurchase;
    
    const eqIssuance = this.getAccountBalance('Share Capital');
    const loanIssuance = this.getAccountBalance('Bank Loan');
    const finCF = eqIssuance + loanIssuance - finCost; // Interest paid
    
    const netCash = opCF + invCF + finCF;
    
    return [
      { name: "A. Cash Flow from Operating Activities", value: null, level: 0, isSummary: true },
      { name: "Net Profit Before Tax", value: pbt, level: 1 },
      { name: "Add: Depreciation & Amortization", value: dep, level: 1 },
      { name: "Add: Finance Costs", value: finCost, level: 1 },
      { name: "Add: Provisions (Non-Cash)", value: provEmployee + stProv, level: 1 },
      { name: "Operating Profit Before WC Changes", value: opCFBeforeWC, level: 1, isSummary: true },
      { name: "Less: Increase in Trade Receivables", value: -incAR, level: 1 },
      { name: "Less: Increase in Inventories", value: -incInv, level: 1 },
      { name: "Add: Increase in Trade Payables", value: incAP, level: 1 },
      { name: "Less: Income Tax Paid", value: -actualTaxPaid, level: 1 },
      { name: "Net Cash from Operating Activities", value: opCF, level: 0, isSummary: true, isTotal: true },
      
      { name: "B. Cash Flow from Investing Activities", value: null, level: 0, isSummary: true },
      { name: "Purchase of Fixed & Intangible Assets", value: invCF, level: 1 },
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
    const rev = is.find(r => r.name.toLowerCase().includes("total revenue"))?.value || 0;
    const opExp = is.find(r => r.name.toLowerCase().includes("total expenses"))?.value || 0;
    const pbt = is.find(r => r.name.toLowerCase().includes("profit before tax"))?.value || 0;
    const pat = is.find(r => r.name.toLowerCase().includes("profit (loss) for the period"))?.value || 0;
    const tax = pbt - pat;
    const totalExpIncTax = opExp + tax;
    
    return {
      totalRevenue: rev,
      operatingExpenses: opExp,
      taxExpense: tax,
      totalExpenses: totalExpIncTax,
      pbt: pbt,
      netProfit: pat,
      cashBalance: cash
    };
  }
};

