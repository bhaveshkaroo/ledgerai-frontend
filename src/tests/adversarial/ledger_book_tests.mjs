/**
 * MESO LEDGER AI — General Ledger Book & 3-Year Bifurcation Test Suite
 * Verifies getAccountLedger() and getThreeYearLedger() correctness.
 * Run: node --experimental-vm-modules src/tests/adversarial/ledger_book_tests.mjs
 */

// ==================== MINIMAL MOCK SETUP ====================
globalThis.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] ?? null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};
globalThis.window = { dispatchEvent: () => {} };
globalThis.fetch = async () => { throw new Error('Network disabled in isolated test harness'); };

// ==================== IMPORTS ====================
const { LedgerEngine, CHART_OF_ACCOUNTS } = await import('../../utils/LedgerEngine.js');

let passed = 0;
let failed = 0;
const results = [];

async function runTest(id, name, fn) {
  try {
    await fn();
    passed++;
    results.push({ id, name, verdict: 'PASS' });
    console.log(`  [PASS] [${id}] ${name}`);
  } catch (err) {
    failed++;
    results.push({ id, name, verdict: 'FAIL', error: err.message });
    console.log(`  [FAIL] [${id}] ${name} -- ${err.message}`);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
  }
}

function assert(condition, label) {
  if (!condition) {
    throw new Error(`Assertion failed: ${label}`);
  }
}

console.log('\n' + '='.repeat(76));
console.log('  MESO LEDGER AI -- GENERAL LEDGER BOOK & 3-YEAR BIFURCATION TEST SUITE');
console.log('  Run at: ' + new Date().toISOString());
console.log('='.repeat(76));

// ==================== SECTION 1: getAccountLedger() ====================
console.log('\n--- SECTION 1: getAccountLedger() Validation ---\n');

await runTest('LDG-01', 'getAccountLedger("Cash and Bank", "FY 2025-26") returns valid structure', async () => {
  const ledger = LedgerEngine.getAccountLedger('Cash and Bank', 'FY 2025-26');
  assertEqual(ledger.accountName, 'Cash and Bank', 'Account name matches');
  assert(Array.isArray(ledger.entries), 'entries is an array');
  assert(ledger.entries.length > 0, `entries has ${ledger.entries.length} items (> 0)`);
  assert(!isNaN(ledger.openingBalance), `openingBalance is a number: ${ledger.openingBalance}`);
  assert(!isNaN(ledger.closingBalance), `closingBalance is a number: ${ledger.closingBalance}`);
  assert(ledger.totalDebits >= 0, `totalDebits >= 0: ${ledger.totalDebits}`);
  assert(ledger.totalCredits >= 0, `totalCredits >= 0: ${ledger.totalCredits}`);
  console.log(`    entries: ${ledger.entries.length}, OB: ${ledger.openingBalance}, CB: ${ledger.closingBalance}, Dr: ${ledger.totalDebits}, Cr: ${ledger.totalCredits}`);
});

await runTest('LDG-02', 'getAccountLedger("Rent Expense", "FY 2025-26") entries have valid fields', async () => {
  const ledger = LedgerEngine.getAccountLedger('Rent Expense', 'FY 2025-26');
  assert(ledger.entries.length > 0, `Has entries (found ${ledger.entries.length})`);
  ledger.entries.forEach((e, idx) => {
    assert(e.date && typeof e.date === 'string', `Entry ${idx} has date: ${e.date}`);
    assert(e.ref && typeof e.ref === 'string', `Entry ${idx} has ref: ${e.ref}`);
    assert(e.particulars && typeof e.particulars === 'string', `Entry ${idx} has particulars: ${e.particulars}`);
    assert(e.debit >= 0, `Entry ${idx} debit >= 0: ${e.debit}`);
    assert(e.credit >= 0, `Entry ${idx} credit >= 0: ${e.credit}`);
    assert(!isNaN(e.runningBalance), `Entry ${idx} runningBalance is a number: ${e.runningBalance}`);
    assert(e.balanceType === 'Dr.' || e.balanceType === 'Cr.', `Entry ${idx} balanceType is Dr. or Cr.: ${e.balanceType}`);
  });
  console.log(`    All ${ledger.entries.length} entries validated: date, ref, particulars, debit, credit, runningBalance, balanceType`);
});

await runTest('LDG-08', 'Contra account convention: entries start with "To " or "By "', async () => {
  const ledger = LedgerEngine.getAccountLedger('Rent Expense', 'FY 2025-26');
  assert(ledger.entries.length > 0, 'Has entries');
  let allCorrect = true;
  ledger.entries.forEach((e, idx) => {
    if (!e.particulars.startsWith('To ') && !e.particulars.startsWith('By ')) {
      allCorrect = false;
    }
  });
  assert(allCorrect, 'All particulars start with "To " or "By " (contra convention)');
  console.log(`    All ${ledger.entries.length} entries follow "To/By" contra convention`);
});

// ==================== SECTION 2: getThreeYearLedger() ====================
console.log('\n--- SECTION 2: getThreeYearLedger() Validation ---\n');

await runTest('LDG-03', 'getThreeYearLedger("Cash and Bank") returns 3 years with correct period names', async () => {
  const data = LedgerEngine.getThreeYearLedger('Cash and Bank');
  assert(Array.isArray(data.years), 'years is an array');
  assertEqual(data.years.length, 3, 'years has 3 entries');
  assert(data.years[0].periodName.includes('2024-25'), `Year 0 periodName includes "2024-25": ${data.years[0].periodName}`);
  assert(data.years[1].periodName.includes('2025-26'), `Year 1 periodName includes "2025-26": ${data.years[1].periodName}`);
  assert(data.years[2].periodName.includes('2026-27'), `Year 2 periodName includes "2026-27": ${data.years[2].periodName}`);
  console.log(`    Period names: ${data.years.map(y => y.periodName).join(', ')}`);
});

await runTest('LDG-04', '3-Year carry-forward: Closing Balance of Year N = Opening Balance of Year N+1', async () => {
  const data = LedgerEngine.getThreeYearLedger('Cash and Bank');
  const y0 = data.years[0];
  const y1 = data.years[1];
  const y2 = data.years[2];
  
  assertEqual(y0.closingBalance, y1.openingBalance, `FY24-25 Closing (${y0.closingBalance}) == FY25-26 Opening (${y1.openingBalance})`);
  assertEqual(y1.closingBalance, y2.openingBalance, `FY25-26 Closing (${y1.closingBalance}) == FY26-27 Opening (${y2.openingBalance})`);
  console.log(`    FY24-25 CB: ${y0.closingBalance} -> FY25-26 OB: ${y1.openingBalance} ✓`);
  console.log(`    FY25-26 CB: ${y1.closingBalance} -> FY26-27 OB: ${y2.openingBalance} ✓`);
});

// ==================== SECTION 3: Balance Equation Verification ====================
console.log('\n--- SECTION 3: Balance Equation Verification ---\n');

await runTest('LDG-05', 'Debit-normal account (Cash and Bank): CB = OB + TotalDebits - TotalCredits', async () => {
  const data = LedgerEngine.getThreeYearLedger('Cash and Bank');
  data.years.forEach((fy, idx) => {
    const computed = fy.openingBalance + fy.totalDebits - fy.totalCredits;
    assertEqual(fy.closingBalance, computed, `${fy.periodName}: CB (${fy.closingBalance}) == OB (${fy.openingBalance}) + Dr (${fy.totalDebits}) - Cr (${fy.totalCredits}) = ${computed}`);
  });
  console.log(`    Balance equation verified for all 3 FYs of Cash and Bank (debit-normal)`);
});

await runTest('LDG-06', 'Credit-normal account (Sales Revenue): CB = OB + TotalCredits - TotalDebits', async () => {
  const data = LedgerEngine.getThreeYearLedger('Sales Revenue');
  data.years.forEach((fy, idx) => {
    const computed = fy.openingBalance + fy.totalCredits - fy.totalDebits;
    assertEqual(fy.closingBalance, computed, `${fy.periodName}: CB (${fy.closingBalance}) == OB (${fy.openingBalance}) + Cr (${fy.totalCredits}) - Dr (${fy.totalDebits}) = ${computed}`);
  });
  console.log(`    Balance equation verified for all 3 FYs of Sales Revenue (credit-normal)`);
});

await runTest('LDG-07', 'getThreeYearLedger("Accounts Receivable") - grand totals are valid', async () => {
  const data = LedgerEngine.getThreeYearLedger('Accounts Receivable');
  assert(data.grandTotalDebits >= 0, `grandTotalDebits >= 0: ${data.grandTotalDebits}`);
  assert(data.grandTotalCredits >= 0, `grandTotalCredits >= 0: ${data.grandTotalCredits}`);
  assert(!isNaN(data.finalClosingBalance), `finalClosingBalance is a number: ${data.finalClosingBalance}`);
  
  // Cross-check: grand totals = sum of individual year totals
  const sumDr = data.years.reduce((s, y) => s + y.totalDebits, 0);
  const sumCr = data.years.reduce((s, y) => s + y.totalCredits, 0);
  assertEqual(data.grandTotalDebits, sumDr, `grandTotalDebits (${data.grandTotalDebits}) == sum of yearly debits (${sumDr})`);
  assertEqual(data.grandTotalCredits, sumCr, `grandTotalCredits (${data.grandTotalCredits}) == sum of yearly credits (${sumCr})`);
  console.log(`    AR Grand Totals: Dr ${data.grandTotalDebits}, Cr ${data.grandTotalCredits}, Final CB: ${data.finalClosingBalance} ${data.finalClosingBalanceType}`);
});

// ==================== SECTION 4: Cross-Account Carry-Forward Verification ====================
console.log('\n--- SECTION 4: Cross-Account Carry-Forward (Multiple Accounts) ---\n');

const testAccounts = ['Accounts Receivable', 'Accounts Payable', 'Bank Loan', 'Share Capital', 'Fixed Assets (Gross)'];

for (const accName of testAccounts) {
  await runTest(`LDG-CF-${accName.replace(/[^a-zA-Z]/g, '').slice(0, 10)}`, `3-Year carry-forward for ${accName}`, async () => {
    const data = LedgerEngine.getThreeYearLedger(accName);
    assertEqual(data.years.length, 3, `${accName}: 3 FYs present`);
    
    for (let i = 0; i < data.years.length - 1; i++) {
      assertEqual(
        data.years[i].closingBalance,
        data.years[i + 1].openingBalance,
        `${accName}: ${data.years[i].periodName} CB (${data.years[i].closingBalance}) == ${data.years[i + 1].periodName} OB (${data.years[i + 1].openingBalance})`
      );
    }
    console.log(`    ${accName}: Carry-forward verified across all 3 FYs`);
  });
}

// ==================== SECTION 5: Future Date Boundary Validation ====================
console.log('\n--- SECTION 5: Future Date Boundary Validation ---\n');

await runTest('LDG-FUT-01', 'Transactions dated beyond statutory boundary (e.g. 2027-04-01) are strictly rejected', async () => {
  let thrown = false;
  let errMsg = '';
  try {
    await LedgerEngine.postTransaction('2027-04-01', 'Future-dated beyond statutory scope', 'Cash and Bank', 'Sales Revenue', 10000, 'Sales', 'FUT-ERR-1');
  } catch (err) {
    thrown = true;
    errMsg = err.message;
  }
  assert(thrown, 'Transaction beyond 2027-03-31 was rejected');
  assert(errMsg.includes('unreasonably far in the future'), `Error mentions future boundary: ${errMsg}`);
  console.log(`    Rejected 2027-04-01 as expected: "${errMsg}"`);
});

await runTest('LDG-FUT-02', 'Transactions dated within statutory boundary (e.g. 2027-03-31) are accepted', async () => {
  await LedgerEngine.postTransaction('2027-03-31', 'Valid future boundary entry', 'Rent Expense', 'Cash and Bank', 5000, 'Expense', 'FUT-OK-1');
  const tx = LedgerEngine.transactions.find(t => t.ref === 'FUT-OK-1');
  assert(tx, 'Transaction at boundary 2027-03-31 accepted successfully');
  console.log(`    Boundary transaction 2027-03-31 posted and verified`);
});

// ==================== SUMMARY ====================
console.log('\n' + '='.repeat(76));
console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} tests`);
console.log('='.repeat(76));

console.log('\n  FULL RESULTS TABLE:');
console.log('  ' + '-'.repeat(72));
console.log('  | ID         | Test Description                                 | Verdict |');
console.log('  ' + '-'.repeat(72));
results.forEach(r => {
  const id = r.id.padEnd(10);
  const name = r.name.padEnd(48).slice(0, 48);
  const v = r.verdict.padEnd(7);
  console.log(`  | ${id} | ${name} | ${v} |`);
});
console.log('  ' + '-'.repeat(72));

process.exit(failed > 0 ? 1 : 0);
