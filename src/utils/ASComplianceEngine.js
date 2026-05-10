import { formatINR } from './LedgerEngine';

export const COMPLIANCE_MODES = {
  AS_SME: 'AS (SME/Non-Corporate)',
  IND_AS: 'Ind AS (Large/Corporate)'
};

export const IND_AS_RULES = [
  {
    id: 'IAS115-R001',
    standard: 'Ind AS 115',
    title: 'Revenue 5-Step Model',
    severity: 'ERROR',
    category: 'Transaction',
    description: 'Revenue must be recognized based on performance obligations.',
    message: (tx) => `Revenue entry ${tx.ref} for Ind AS entity must confirm to 5-step model. Recognition before performance completion is prohibited.`,
    suggestion: 'Verify if the performance obligation has been fully satisfied before recognizing revenue.',
    check: (tx) => tx.account === 'Sales Revenue' && tx.narration.toLowerCase().includes('partial')
  },
  {
    id: 'IAS116-R001',
    standard: 'Ind AS 116',
    title: 'Lease ROU Recognition',
    severity: 'ERROR',
    category: 'Transaction',
    description: 'Leases must recognize a Right-of-Use (ROU) asset and a lease liability.',
    message: (tx) => `Rent payment ${tx.ref} is being expensed directly. Ind AS 116 requires ROU asset recognition for leases > 12 months.`,
    suggestion: 'Capitalize the lease by debiting "ROU Asset" and crediting "Lease Liability".',
    check: (tx) => tx.account.toLowerCase().includes('rent') && tx.amount > 500000 // Simplified threshold
  },
  {
    id: 'IAS109-R001',
    standard: 'Ind AS 109',
    title: 'Financial Assets Measurement',
    severity: 'WARNING',
    category: 'Transaction',
    description: 'Financial assets must be measured at Fair Value or Amortized Cost.',
    message: (tx) => `Investment entry ${tx.ref} does not specify measurement category (FVTPL/FVOCI/Amortized Cost).`,
    suggestion: 'Specify the classification of the financial asset as per Ind AS 109.',
    check: (tx) => tx.account.toLowerCase().includes('investment') && !tx.narration.toLowerCase().includes('fair value')
  }
];

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
    check: (tx) => tx.narration.toLowerCase().includes('cash basis') || tx.category === 'Cash'
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
  validateTransaction(tx, mode = COMPLIANCE_MODES.AS_SME) {
    const findings = [];
    const rules = mode === COMPLIANCE_MODES.IND_AS ? [...AS_RULES, ...IND_AS_RULES] : AS_RULES;
    
    rules.filter(r => r.category === 'Transaction').forEach(rule => {
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

  validateStatements(is, cf, bs, mode = COMPLIANCE_MODES.AS_SME) {
    const findings = [];

    // Statement Level Checks
    const netChange = cf.operating.netCashFromOperating + cf.investing.netCashFromInvesting + cf.financing.netCashFromFinancing;
    const actualChange = cf.closingBalance - cf.openingBalance;
    
    if (Math.abs(netChange - actualChange) > 1) {
      findings.push({
        id: 'AS3-R001',
        standard: mode === COMPLIANCE_MODES.IND_AS ? 'Ind AS 7' : 'AS 3',
        severity: 'ERROR',
        title: 'CF Statement Imbalance',
        message: `Cash Flow sections do not sum to net change. Discrepancy: ${formatINR(Math.abs(netChange - actualChange))}`,
        suggestion: 'Verify classification of operating, investing, and financing activities.',
        timestamp: new Date().toISOString(),
        status: 'Unresolved'
      });
    }

    if (!bs.isBalanced) {
      findings.push({
        id: 'GEN-R001',
        standard: 'General',
        severity: 'ERROR',
        title: 'Balance Sheet Out of Balance',
        message: `Total Assets (${formatINR(bs.totalAssets)}) does not equal Liabilities + Equity (${formatINR(bs.totalEquityLiabilities)}).`,
        suggestion: 'Verify all journal entries are balanced.',
        timestamp: new Date().toISOString(),
        status: 'Unresolved'
      });
    }

    // Ind AS specific statement check
    if (mode === COMPLIANCE_MODES.IND_AS) {
      if (!is.otherComprehensiveIncome) {
        findings.push({
          id: 'IAS1-R001',
          standard: 'Ind AS 1',
          severity: 'WARNING',
          title: 'Missing OCI Section',
          message: 'Ind AS 1 requires the presentation of Other Comprehensive Income (OCI).',
          suggestion: 'Add an OCI section to the Statement of Profit and Loss for items like revaluation surplus or actuarial gains.',
          timestamp: new Date().toISOString(),
          status: 'Unresolved'
        });
      }
    }

    return findings;
  },

  runFullValidation(transactions, is, cf, bs, mode) {
    let allFindings = [];
    transactions.forEach(tx => {
      allFindings = [...allFindings, ...this.validateTransaction(tx, mode)];
    });
    allFindings = [...allFindings, ...this.validateStatements(is, cf, bs, mode)];
    
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
      version: 'Ind AS 2024-25 Extended'
    }));
  },

  async parseOCR(text) {
    const standards = [];
    const segments = text.split(/INDIAN ACCOUNTING STANDARD\s+(\d+)/gi);
    
    for (let i = 1; i < segments.length; i += 2) {
      const code = `Ind AS ${segments[i]}`;
      const content = segments[i+1];
      const lines = content.split('\n').filter(l => l.trim());
      
      standards.push({
        code,
        title: lines[0] ? lines[0].trim() : `${code}`,
        rawText: content.substring(0, 10000), // Cap size for storage
        keyPrinciples: lines.slice(1, 15).map(l => l.trim()),
        validationRules: []
      });
    }
    
    const db = { standards };
    this.save(db);
    return db;
  }
};
