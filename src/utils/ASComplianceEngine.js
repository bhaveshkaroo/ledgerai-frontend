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
    check: (tx) => tx.account.toLowerCase().includes('rent') && tx.amount > 500000 
  },
  {
    id: 'IAS2-R001',
    standard: 'Ind AS 2',
    title: 'Inventory Valuation',
    severity: 'ERROR',
    category: 'Transaction',
    description: 'Inventory must be valued at lower of cost and net realizable value (NRV).',
    message: (tx) => `Inventory adjustment ${tx.ref} uses LIFO which is prohibited under Ind AS 2.`,
    suggestion: 'Value inventory using FIFO or Weighted Average method only.',
    check: (tx) => tx.account.toLowerCase().includes('inventory') && tx.narration.toLowerCase().includes('lifo')
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
  
  save(db) {
    localStorage.setItem('ledgerai-as-database', JSON.stringify(db));
  },

  async parseOCR(text) {
    const standards = [];
    // Enhanced splitting to capture standard titles
    const sections = text.split(/INDIAN ACCOUNTING STANDARD\s+(\d+)/gi);
    
    for (let i = 1; i < sections.length; i += 2) {
      const codeNum = sections[i];
      const content = sections[i+1] || '';
      const code = `Ind AS ${codeNum}`;
      
      // Determine title from first few lines
      const lines = content.split('\n').map(l => l.trim()).filter(l => l);
      const title = lines[0] || code;
      
      standards.push({
        code,
        title,
        content: content.substring(0, 5000), // Cap content size
        keywords: [code.toLowerCase(), title.toLowerCase()]
      });
    }

    // Also handle traditional AS if found (mocking some common ones if text is missing them)
    if (standards.length === 0) {
       // Fallback for demo if OCR fails
       standards.push({ code: 'AS 2', title: 'Valuation of Inventories', content: 'Inventories should be valued at the lower of cost and net realisable value. FIFO and Weighted Average cost formulas are permitted. LIFO is prohibited.', keywords: ['inventory', 'valuation', 'cost', 'lifo'] });
       standards.push({ code: 'AS 9', title: 'Revenue Recognition', content: 'Revenue from sale of goods is recognized when significant risks and rewards of ownership are transferred.', keywords: ['revenue', 'sale', 'income'] });
    }

    const db = {
      version: 'v1.0 (Parsed ' + new Date().toLocaleDateString() + ')',
      standards
    };
    this.save(db);
    return db;
  },

  query(text, db, mode) {
    if (!db || !db.standards) return "No standards database loaded. Please upload the AS/Ind AS OCR file first.";
    
    const queryTerm = text.toLowerCase();
    
    // Search for matching standard
    const match = db.standards.find(s => 
      s.code.toLowerCase().includes(queryTerm) || 
      s.title.toLowerCase().includes(queryTerm) ||
      s.keywords.some(k => queryTerm.includes(k)) ||
      (s.content && s.content.toLowerCase().includes(queryTerm))
    );

    if (match) {
      const modeText = mode === COMPLIANCE_MODES.IND_AS ? "Ind AS (Corporate)" : "AS (SME)";
      return `### ${match.code}: ${match.title}
**Framework:** ${modeText}

**Summary of Standard:**
${match.content.substring(0, 500)}...

**Key Compliance Requirement:**
${match.content.includes('lower of cost') ? '- Inventories must be valued at the lower of cost and Net Realizable Value (NRV).' : ''}
${match.content.includes('LIFO') ? '- LIFO method is strictly prohibited; use FIFO or Weighted Average.' : ''}
${match.content.includes('transferred') ? '- Revenue is recognized only when risks and rewards are transferred to the buyer.' : ''}

*Source: Indian Accounting Standards (Official OCR Data)*`;
    }

    return "I couldn't find a specific rule for that in the current database. Try searching for 'Inventory', 'Revenue', 'Lease', or a specific Standard number like 'Ind AS 115'.";
  }
};
