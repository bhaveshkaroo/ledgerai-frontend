import { formatINR } from './LedgerEngine';

export const AS_RULES = [
  {
    id: 'AS1-R001',
    standard: 'AS 1',
    title: 'Accrual Basis Recording',
    severity: 'ERROR',
    category: 'Transaction',
    description: 'All transactions must be recorded on accrual basis.',
    message: (tx) => `Transaction ${tx.ref} is recorded on cash basis. AS 1 requires revenue/expense to be recognised when earned/incurred regardless of cash receipt.`,
    suggestion: 'Convert the transaction to an accrual entry (e.g., use Accounts Receivable/Payable).',
    check: (tx) => tx.narration.toLowerCase().includes('cash basis') || tx.category === 'Cash' // Simplified check for demo
  },
  {
    id: 'AS2-R002',
    standard: 'AS 2',
    title: 'No LIFO Permitted',
    severity: 'ERROR',
    category: 'Transaction',
    description: 'LIFO cost formula is not permitted under Indian Accounting Standards.',
    message: (tx) => `Transaction ${tx.ref} uses LIFO valuation.`,
    suggestion: 'Switch to FIFO or Weighted Average Cost formula.',
    check: (tx) => tx.narration.toLowerCase().includes('lifo')
  },
  {
    id: 'AS9-R002',
    standard: 'AS 9',
    title: 'Revenue Net of GST',
    severity: 'ERROR',
    category: 'Transaction',
    description: 'GST collected is a liability, not revenue.',
    message: (tx) => `Transaction ${tx.ref} appears to include GST in the revenue amount.`,
    suggestion: 'Record revenue net of GST and credit the tax portion to GST Output Payable.',
    check: (tx) => tx.account === 'Sales Revenue' && (tx.narration.toLowerCase().includes('incl gst') || tx.narration.toLowerCase().includes('with gst'))
  },
  {
    id: 'AS9-R003',
    standard: 'AS 9',
    title: 'Advance Payment Recognition',
    severity: 'ERROR',
    category: 'Transaction',
    description: 'Advances from customers are not revenue until goods/services are delivered.',
    message: (tx) => `Advance payment ${tx.ref} is directly credited to Sales Revenue.`,
    suggestion: 'Credit the amount to "Advance from Customers" (Liability) instead of Sales Revenue.',
    check: (tx) => tx.account === 'Sales Revenue' && tx.narration.toLowerCase().includes('advance')
  },
  {
    id: 'AS10-R002',
    standard: 'AS 10',
    title: 'No Repairs Capitalization',
    severity: 'ERROR',
    category: 'Transaction',
    description: 'Routine maintenance must be expensed, not capitalized.',
    message: (tx) => `Repair expense ${tx.ref} is posted to a Fixed Asset account.`,
    suggestion: 'Debit "Repairs and Maintenance" expense instead of the Asset account.',
    check: (tx) => tx.account.toLowerCase().includes('fixed asset') && (tx.narration.toLowerCase().includes('repair') || tx.narration.toLowerCase().includes('maintenance'))
  },
  {
    id: 'AS15-R001',
    standard: 'AS 15',
    title: 'Salary Accrual Requirement',
    severity: 'ERROR',
    category: 'Transaction',
    description: 'Salary must be accrued in the period service is rendered.',
    message: (tx) => `March salary ${tx.ref} is paid in April without a March accrual.`,
    suggestion: 'Create a 31 March journal entry: Dr Salary Expense, Cr Salary Payable.',
    check: (tx) => tx.account === 'Salary Expense' && tx.date.startsWith('2026-04') && tx.narration.toLowerCase().includes('march')
  }
];

export const ASValidationEngine = {
  validateTransaction(tx) {
    const findings = [];
    AS_RULES.filter(r => r.category === 'Transaction').forEach(rule => {
      if (rule.check(tx)) {
        findings.push({
          id: rule.id,
          standard: rule.standard,
          severity: rule.severity,
          txId: tx.id,
          txRef: tx.ref,
          message: typeof rule.message === 'function' ? rule.message(tx) : rule.message,
          suggestion: rule.suggestion,
          timestamp: new Date().toISOString(),
          status: 'Unresolved'
        });
      }
    });
    return findings;
  },

  validateStatements(is, cf, bs) {
    const findings = [];

    // AS 3: Cash Flow Balancing
    const netChange = cf.operating.netCashFromOperating + cf.investing.netCashFromInvesting + cf.financing.netCashFromFinancing;
    const actualChange = cf.closingBalance - cf.openingBalance;
    if (Math.abs(netChange - actualChange) > 1) {
      findings.push({
        id: 'AS3-R001',
        standard: 'AS 3',
        severity: 'ERROR',
        title: 'CF Statement Imbalance',
        message: `Cash Flow sections do not sum to net change. Discrepancy: ${formatINR(Math.abs(netChange - actualChange))}`,
        suggestion: 'Verify classification of operating, investing, and financing activities.',
        timestamp: new Date().toISOString(),
        status: 'Unresolved'
      });
    }

    // AS 3: Depreciation Add-back
    if (cf.operating.adjustments.depreciation === 0 && is.depreciationAndAmortisation > 0) {
      findings.push({
        id: 'AS3-R002',
        standard: 'AS 3',
        severity: 'WARNING',
        title: 'Missing Depreciation Add-back',
        message: 'Depreciation must be added back in Operating Activities under the indirect method.',
        suggestion: 'Add Depreciation to non-cash adjustments in the Operating section.',
        timestamp: new Date().toISOString(),
        status: 'Unresolved'
      });
    }

    // AS 22: Tax Provision Check
    if (is.profitBeforeTax > 0 && is.taxExpenseCurrent === 0) {
      findings.push({
        id: 'AS22-R001',
        standard: 'AS 22',
        severity: 'ERROR',
        title: 'Missing Tax Provision',
        message: 'No provision for tax entry exists despite the company having a profit.',
        suggestion: 'Calculate and record Current Tax liability at applicable rates.',
        timestamp: new Date().toISOString(),
        status: 'Unresolved'
      });
    }

    // BS Balance Check
    if (!bs.isBalanced) {
      findings.push({
        id: 'GEN-R001',
        standard: 'General',
        severity: 'ERROR',
        title: 'Balance Sheet Out of Balance',
        message: `Total Assets (${formatINR(bs.totalAssets)}) does not equal Liabilities + Equity (${formatINR(bs.totalEquityLiabilities)}).`,
        suggestion: 'Verify all journal entries are balanced and closing balances are carried forward correctly.',
        timestamp: new Date().toISOString(),
        status: 'Unresolved'
      });
    }

    return findings;
  },

  runFullValidation(transactions, is, cf, bs) {
    let allFindings = [];
    transactions.forEach(tx => {
      allFindings = [...allFindings, ...this.validateTransaction(tx)];
    });
    allFindings = [...allFindings, ...this.validateStatements(is, cf, bs)];
    
    // Persist
    localStorage.setItem('ledgerai-compliance-log', JSON.stringify(allFindings));
    return allFindings;
  }
};

export const AccountingStandardsDB = {
  load() {
    const saved = localStorage.getItem('ledgerai-as-database');
    return saved ? JSON.parse(saved) : null;
  },
  
  save(data) {
    localStorage.setItem('ledgerai-as-database', JSON.stringify({
      ...data,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    }));
  },

  async parseOCR(text) {
    // Basic logic to split text into standards based on "AS X" pattern
    const standards = [];
    const segments = text.split(/AS\s+(\d+)/g);
    
    for (let i = 1; i < segments.length; i += 2) {
      const code = `AS-${segments[i]}`;
      const content = segments[i+1];
      const lines = content.split('\n').filter(l => l.trim());
      
      standards.push({
        code,
        title: lines[0] ? lines[0].trim() : `Accounting Standard ${segments[i]}`,
        rawText: content,
        keyPrinciples: lines.slice(1, 10).map(l => l.trim()), // Simplified extraction
        validationRules: [] // In a real app, AI would map these to programmatic rules
      });
    }
    
    const db = { standards };
    this.save(db);
    return db;
  }
};
