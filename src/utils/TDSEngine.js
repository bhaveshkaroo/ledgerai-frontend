import { LedgerEngine, formatINR } from './LedgerEngine';

// ── Indian TDS Sections Database (Chapter XVII-B, Income Tax Act 1961) ──
export const TDS_SECTIONS = [
  {
    section: '194J(a)', nature: 'Professional & Legal Fees',
    rateIndividual: 10, rateCompany: 10,
    thresholdSingle: 0, thresholdAggregate: 30000,
    challanCode: '94J',
    keywords: ['legal', 'professional', 'audit', 'lawyer', 'advocate', 'ca ', 'chartered accountant', 'consultant', 'advisory', 'doctor', 'architect', 'valuer', 'company secretary']
  },
  {
    section: '194J(b)', nature: 'Technical / Royalty Fees',
    rateIndividual: 2, rateCompany: 2,
    thresholdSingle: 0, thresholdAggregate: 30000,
    challanCode: '94J',
    keywords: ['technical', 'software', 'royalty', 'technology', 'it services', 'development', 'coding', 'saas', 'api', 'cloud service']
  },
  {
    section: '194C', nature: 'Works Contract / Contractor',
    rateIndividual: 1, rateCompany: 2,
    thresholdSingle: 30000, thresholdAggregate: 100000,
    challanCode: '94C',
    keywords: ['contractor', 'works', 'transport', 'freight', 'courier', 'advertising', 'catering', 'maintenance', 'repair', 'fabrication', 'labour', 'labor', 'subcontract', 'printing', 'housekeeping']
  },
  {
    section: '194I(a)', nature: 'Rent - Plant & Machinery',
    rateIndividual: 2, rateCompany: 2,
    thresholdSingle: 0, thresholdAggregate: 240000,
    challanCode: '94I',
    keywords: ['equipment rent', 'plant rent', 'machinery rent', 'server rent', 'vehicle hire', 'crane hire']
  },
  {
    section: '194I(b)', nature: 'Rent - Land & Building',
    rateIndividual: 10, rateCompany: 10,
    thresholdSingle: 0, thresholdAggregate: 240000,
    challanCode: '94I',
    keywords: ['office rent', 'building rent', 'warehouse rent', 'shop rent', 'premises rent', 'lease', 'rent for office', 'rent paid', 'monthly rent']
  },
  {
    section: '194H', nature: 'Commission & Brokerage',
    rateIndividual: 5, rateCompany: 5,
    thresholdSingle: 0, thresholdAggregate: 15000,
    challanCode: '94H',
    keywords: ['commission', 'brokerage', 'agent', 'distributor', 'referral', 'incentive', 'selling commission']
  },
  {
    section: '194Q', nature: 'Purchase of Goods (High Value)',
    rateIndividual: 0.1, rateCompany: 0.1,
    thresholdSingle: 0, thresholdAggregate: 5000000,
    challanCode: '94Q',
    keywords: ['purchase of goods', 'material purchase', 'stock purchase', 'inventory purchase', 'bulk purchase']
  }
];

// ── TDS Engine ──────────────────────────────────────────────────────────
export const TDSEngine = {

  // Detect applicable TDS section from description/category
  detectTDSSection(description, category, amount) {
    if (!description && !category) return null;
    const text = ((description || '') + ' ' + (category || '')).toLowerCase();
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const sec of TDS_SECTIONS) {
      let score = 0;
      for (const kw of sec.keywords) {
        if (text.includes(kw)) {
          score += kw.length; // longer keyword matches are stronger signals
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = sec;
      }
    }
    
    return bestMatch;
  },

  // Calculate TDS amount and net payable
  calculateTDS(amount, section, deducteeType = 'individual') {
    if (!section || !amount) return null;
    const rate = deducteeType === 'company' ? section.rateCompany : section.rateIndividual;
    const tdsAmount = Math.round(amount * rate / 100);
    return {
      grossAmount: amount,
      tdsRate: rate,
      tdsAmount,
      netPayable: amount - tdsAmount,
      section: section.section,
      nature: section.nature,
      challanCode: section.challanCode
    };
  },

  // Generate a 3-leg split entry
  generateSplitEntry(vendorName, description, amount, section, deducteeType = 'individual') {
    const calc = this.calculateTDS(amount, section, deducteeType);
    if (!calc) return null;

    const expenseAccount = this._guessExpenseAccount(description, section);
    
    return {
      legs: [
        { account: expenseAccount, type: 'debit', amount: calc.grossAmount },
        { account: `TDS Payable u/s ${section.section}`, type: 'credit', amount: calc.tdsAmount },
        { account: `${vendorName} - Payable`, type: 'credit', amount: calc.netPayable }
      ],
      narration: `${description} | TDS u/s ${section.section} @ ${calc.tdsRate}% deducted`,
      tdsSection: section.section,
      challanCode: section.challanCode,
      grossAmount: calc.grossAmount,
      tdsAmount: calc.tdsAmount,
      netPayable: calc.netPayable,
      tdsRate: calc.tdsRate
    };
  },

  // Post TDS entry to ledger (3 legs = 2 JVs: expense+vendor, expense+tds)
  postTDSEntry(vendorName, description, grossAmount, section, deducteeType = 'individual') {
    const split = this.generateSplitEntry(vendorName, description, grossAmount, section, deducteeType);
    if (!split) return { success: false, error: 'Could not generate TDS split' };

    const today = new Date().toISOString().slice(0, 10);
    const expenseAccount = split.legs[0].account;
    const results = [];

    // JV 1: Debit Expense, Credit TDS Payable
    try {
      const r1 = LedgerEngine.postTransaction(
        today,
        `TDS u/s ${section.section} on ${description} - ${vendorName}`,
        expenseAccount,
        `Tax Payable`,
        split.tdsAmount,
        `TDS Deduction - ${section.section}`
      );
      results.push(r1);
    } catch (e) {
      return { success: false, error: e.message };
    }

    // JV 2: Debit Expense, Credit Vendor Payable (net amount)
    try {
      const r2 = LedgerEngine.postTransaction(
        today,
        `${description} - ${vendorName} (Net of TDS u/s ${section.section})`,
        expenseAccount,
        'Accounts Payable',
        split.netPayable,
        `Vendor Payment - ${vendorName}`
      );
      results.push(r2);
    } catch (e) {
      return { success: false, error: e.message };
    }

    window.dispatchEvent(new Event('ledger-updated'));
    return { success: true, results, split };
  },

  // Get TDS Register (all TDS-related transactions)
  getTDSRegister() {
    const txs = LedgerEngine.transactions || [];
    return txs.filter(t => {
      const cat = (t.category || '').toLowerCase();
      const nar = (t.narration || '').toLowerCase();
      return cat.includes('tds') || nar.includes('tds u/s') || nar.includes('tds payable');
    }).map(t => ({
      ...t,
      section: this._extractSection(t.narration || t.category || ''),
    }));
  },

  // Challan 281 Summary for a given month
  getChallan281Summary(month, year) {
    const register = this.getTDSRegister();
    const filtered = register.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year && t.type === 'Credit' && (t.account || '').toLowerCase().includes('tax payable');
    });

    const sectionMap = {};
    for (const t of filtered) {
      const sec = t.section || 'Unknown';
      if (!sectionMap[sec]) sectionMap[sec] = { section: sec, amount: 0, count: 0 };
      sectionMap[sec].amount += t.amount;
      sectionMap[sec].count += 1;
    }

    const sections = Object.values(sectionMap);
    const totalTDS = sections.reduce((s, x) => s + x.amount, 0);
    return { totalTDS, sections, month, year, dueDate: `${year}-${String(month + 2).padStart(2, '0')}-07` };
  },

  // Form 26Q Quarterly Summary
  getForm26QSummary(quarter, financialYear) {
    const months = this.getQuarterMonths(quarter);
    const fyStart = parseInt(financialYear.split('-')[0]);
    const register = this.getTDSRegister();

    const filtered = register.filter(t => {
      const d = new Date(t.date);
      const m = d.getMonth();
      const y = d.getFullYear();
      // Q1=Apr-Jun (months 3,4,5), Q2=Jul-Sep (6,7,8), Q3=Oct-Dec (9,10,11), Q4=Jan-Mar (0,1,2)
      const adjustedYear = quarter === 4 ? fyStart + 1 : fyStart;
      return months.includes(m) && y === adjustedYear;
    });

    const deducteeMap = {};
    for (const t of filtered) {
      if (t.type !== 'Credit' || !(t.account || '').toLowerCase().includes('tax payable')) continue;
      const vendor = this._extractVendor(t.narration);
      if (!deducteeMap[vendor]) {
        deducteeMap[vendor] = { name: vendor, pan: '—', section: t.section || '—', amountPaid: 0, tdsDeducted: 0, entries: [] };
      }
      deducteeMap[vendor].tdsDeducted += t.amount;
      deducteeMap[vendor].entries.push(t);
    }

    return {
      quarter: `Q${quarter}`,
      financialYear,
      deductees: Object.values(deducteeMap),
      totalTDS: Object.values(deducteeMap).reduce((s, d) => s + d.tdsDeducted, 0)
    };
  },

  getQuarterMonths(quarter) {
    switch (quarter) {
      case 1: return [3, 4, 5];   // Apr, May, Jun
      case 2: return [6, 7, 8];   // Jul, Aug, Sep
      case 3: return [9, 10, 11]; // Oct, Nov, Dec
      case 4: return [0, 1, 2];   // Jan, Feb, Mar
      default: return [3, 4, 5];
    }
  },

  // ── Private Helpers ──
  _guessExpenseAccount(description, section) {
    const desc = (description || '').toLowerCase();
    if (section.section.startsWith('194I')) return 'Rent Expense';
    if (section.section === '194H') return 'Commission Expense';
    if (section.section === '194Q') return 'Purchase Expense';
    if (desc.includes('legal') || desc.includes('lawyer')) return 'Legal & Professional Expense';
    if (desc.includes('audit') || desc.includes('ca ')) return 'Audit Fees';
    if (desc.includes('software') || desc.includes('technical')) return 'Software & Technical Expense';
    if (desc.includes('contractor') || desc.includes('labour')) return 'Contract Labour Expense';
    if (desc.includes('transport') || desc.includes('freight')) return 'Transport & Freight Expense';
    if (desc.includes('advertising')) return 'Advertising Expense';
    return 'Professional & Technical Expense';
  },

  _extractSection(text) {
    const match = text.match(/(?:u\/s|section)\s*(194[A-Z()a-z/]+)/i);
    if (match) return match[1].trim();
    for (const sec of TDS_SECTIONS) {
      if (text.toLowerCase().includes(sec.section.toLowerCase())) return sec.section;
    }
    return null;
  },

  _extractVendor(narration) {
    if (!narration) return 'Unknown';
    const parts = narration.split(' - ');
    if (parts.length >= 2) return parts[parts.length - 1].replace(/\(.*\)/, '').trim();
    return 'Unknown Vendor';
  }
};
