import { formatINR } from './LedgerEngine';

export const COMPLIANCE_MODES = {
  AS_SME: 'AS (SME/Non-Corporate)',
  IND_AS: 'Ind AS (Large/Corporate)'
};

// Pre-seeded database for common standards to ensure Assistant works out-of-box
const PRESEEDED_STANDARDS = [
  { 
    code: 'Ind AS 2', 
    title: 'Valuation of Inventories', 
    content: 'Inventories shall be measured at the lower of cost and net realisable value. Cost of inventories shall comprise all costs of purchase, costs of conversion and other costs incurred in bringing the inventories to their present location and condition. Cost formulas permitted: FIFO or Weighted Average. LIFO is strictly prohibited.',
    keywords: ['inventory', 'valuation', 'cost', 'lifo', 'stock']
  },
  {
    code: 'Ind AS 115',
    title: 'Revenue from Contracts with Customers',
    content: 'The core principle is that an entity shall recognise revenue to depict the transfer of promised goods or services to customers in an amount that reflects the consideration to which the entity expects to be entitled in exchange for those goods or services. Follows a 5-step model: 1. Identify contract, 2. Identify performance obligations, 3. Determine price, 4. Allocate price, 5. Recognise revenue as obligations are satisfied.',
    keywords: ['revenue', 'sale', 'income', 'contract', 'customer']
  },
  {
    code: 'Ind AS 116',
    title: 'Leases',
    content: 'A lessee is required to recognise a right-of-use asset representing its right to use the underlying leased asset and a lease liability representing its obligation to make lease payments. Exceptions for short-term leases (12 months or less) and leases of low-value assets.',
    keywords: ['lease', 'rent', 'rou', 'asset', 'liability']
  },
  {
    code: 'Ind AS 101',
    title: 'First-time Adoption',
    content: 'Requires an entity to prepare an opening Ind AS Balance Sheet at the date of transition. This is the starting point for accounting in accordance with Ind AS.',
    keywords: ['adoption', 'transition', 'first-time', 'opening']
  }
];

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
    check: (tx) => tx.account.toLowerCase().includes('rent') && tx.amount > 500000 
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
    const netChange = cf.operating.netCashFromOperating + cf.investing.netCashFromInvesting + cf.financing.netCashFromFinancing;
    const actualChange = cf.closingBalance - cf.openingBalance;
    if (Math.abs(netChange - actualChange) > 1) {
      findings.push({ id: 'AS3-R001', standard: mode === COMPLIANCE_MODES.IND_AS ? 'Ind AS 7' : 'AS 3', severity: 'ERROR', title: 'CF Statement Imbalance', message: `Cash Flow sections do not sum to net change.`, suggestion: 'Verify classification.', timestamp: new Date().toISOString(), status: 'Unresolved' });
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
    return saved ? JSON.parse(saved) : { version: 'Pre-seeded (Ind AS 2, 115, 116)', standards: PRESEEDED_STANDARDS };
  },
  
  save(db) {
    localStorage.setItem('ledgerai-as-database', JSON.stringify(db));
  },

  async parseOCR(text) {
    const standards = [...PRESEEDED_STANDARDS];
    const sections = text.split(/INDIAN ACCOUNTING STANDARD\s+(\d+)/gi);
    for (let i = 1; i < sections.length; i += 2) {
      const codeNum = sections[i];
      const content = sections[i+1] || '';
      const code = `Ind AS ${codeNum}`;
      const lines = content.split('\n').map(l => l.trim()).filter(l => l);
      const title = lines[0] || code;
      if (!standards.find(s => s.code === code)) {
        standards.push({ code, title, content: content.substring(0, 5000), keywords: [code.toLowerCase(), title.toLowerCase()] });
      }
    }
    const db = { version: 'v1.1 (Custom + Pre-seeded)', standards };
    this.save(db);
    return db;
  },

  query(text, db, mode) {
    const activeDb = db || { standards: PRESEEDED_STANDARDS };
    const queryTerm = text.toLowerCase();
    const match = activeDb.standards.find(s => 
      s.code.toLowerCase().includes(queryTerm) || 
      s.title.toLowerCase().includes(queryTerm) ||
      s.keywords.some(k => queryTerm.includes(k)) ||
      (s.content && s.content.toLowerCase().includes(queryTerm))
    );

    if (match) {
      return `### ${match.code}: ${match.title}
**Framework:** ${mode}

**Core Requirement:**
${match.content.substring(0, 800)}...

*Source: Indian Accounting Standards Knowledge Base*`;
    }
    return "I couldn't find a specific rule for that. Try 'Inventory', 'Revenue', or 'Lease'.";
  }
};
