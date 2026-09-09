/**
 * MESO LEDGER AI — Focused Adversarial Gaps Regression Test Suite
 * Closes the 5 specific gaps:
 *   Gap 1: 10,000+ & 100,000+ character string payload truncation & boundary preservation
 *   Gap 2: Unicode, Emoji, RTL text, & surrogate pair truncation safety
 *   Gap 3: Concurrent Invoice Finalization Race (Promise.all with 2 and 5 simultaneous calls)
 *   Gap 4: Concurrent BRS Double-Post Race (Promise.all with 2 and 5 simultaneous calls)
 *   Gap 5: Fiscal Year boundary (2026-03-31 vs 2026-04-01), Leap Day (2024-02-29), & Non-Leap Rejection (2025-02-29)
 * 
 * Run: node --experimental-vm-modules src/tests/adversarial/gap_tests.mjs
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
const { LedgerEngine } = await import('../../utils/LedgerEngine.js');
const { BRSEngine } = await import('../../utils/BRSEngine.js');
const { InvoiceEngine } = await import('../../utils/InvoiceEngine.js');

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
console.log('  MESO LEDGER AI -- FOCUSED ADVERSARIAL GAPS REGRESSION SUITE (GAPS 1-5)');
console.log('  Run at: ' + new Date().toISOString());
console.log('='.repeat(76));

// ==================== GAP 1: 10,000+ & 100,000+ CHAR STRING PAYLOADS ====================
console.log('\n--- GAP 1: 10,000+ & 100,000+ Character Payloads ---\n');

await runTest('GAP1-01', '10,000+ char narration truncation to 1000 in LedgerEngine', async () => {
  LedgerEngine.transactions = [];
  const oversizedNarration = 'A'.repeat(12500);
  try {
    await LedgerEngine.postTransaction('2026-09-01', oversizedNarration, 'Cash and Bank', 'Sales Revenue', 5000, 'Sales', 'REF-OVR-1');
  } catch (e) {}
  
  const tx = LedgerEngine.transactions.find(t => t.ref === 'REF-OVR-1');
  assert(tx, 'Transaction was created in memory');
  assertEqual(oversizedNarration.length, 12500, 'Original string length');
  assertEqual(tx.narration.length, 1000, 'Stored narration truncated length');
  assertEqual(tx.narration, 'A'.repeat(1000), 'Stored content matches first 1000 chars');
  console.log(`    Before: ${oversizedNarration.length} chars -> After: ${tx.narration.length} chars`);
});

await runTest('GAP1-02', '10,000+ char party name truncation to 500 in InvoiceEngine', async () => {
  InvoiceEngine.invoices = [];
  const oversizedParty = 'ClientCorp-'.repeat(1000); // 11,000 chars
  const inv = InvoiceEngine.createInvoice('2026-09-01', oversizedParty, [{ hsnSac: '9983', description: 'Consulting', qty: 1, rate: 2500 }], 'LOCAL');
  
  assertEqual(oversizedParty.length, 11000, 'Original party string length');
  assertEqual(inv.party.length, 500, 'Stored invoice party length');
  assertEqual(inv.party, oversizedParty.slice(0, 500), 'Party string truncated safely');
  console.log(`    Before: ${oversizedParty.length} chars -> After: ${inv.party.length} chars`);
});

await runTest('GAP1-03', '100,000+ char payload performance & stability test (no crash or hang)', async () => {
  LedgerEngine.transactions = [];
  const hugeNarration = 'X'.repeat(150000); // 150,000 chars
  const t0 = Date.now();
  try {
    await LedgerEngine.postTransaction('2026-09-01', hugeNarration, 'Cash and Bank', 'Sales Revenue', 10000, 'Sales', 'REF-HUGE-1');
  } catch (e) {}
  const durationMs = Date.now() - t0;
  
  const tx = LedgerEngine.transactions.find(t => t.ref === 'REF-HUGE-1');
  assert(tx, 'Transaction created successfully');
  assertEqual(tx.narration.length, 1000, 'Narration truncated to 1000');
  assert(durationMs < 500, `Execution completed in ${durationMs}ms without performance cliff`);
  console.log(`    Processed 150,000 char payload in ${durationMs}ms -> Truncated to ${tx.narration.length} chars`);
});

// ==================== GAP 2: UNICODE, EMOJI, RTL, & SURROGATE PAIRS ====================
console.log('\n--- GAP 2: Unicode, Emoji, RTL Text, & Surrogate Boundary ---\n');

await runTest('GAP2-01', 'Unicode, Emoji, and RTL Arabic/Hebrew text stored intact', async () => {
  LedgerEngine.transactions = [];
  const complexNarration = '💰 Payment received 🎉 | شركة ميسو الدولية | תשלום עבור שירותים | 🚀 HSN 9983';
  try {
    await LedgerEngine.postTransaction('2026-09-01', complexNarration, 'Cash and Bank', 'Sales Revenue', 75000, 'Sales', 'REF-UNI-1');
  } catch (e) {}
  
  const tx = LedgerEngine.transactions.find(t => t.ref === 'REF-UNI-1');
  assert(tx, 'Transaction found');
  assertEqual(tx.narration, complexNarration, 'Unicode/Emoji/RTL string byte-for-byte exact match');
  console.log(`    Stored & verified: "${tx.narration}"`);
});

await runTest('GAP2-02', 'Surrogate pair cut exactly at boundary does not produce corrupted character', async () => {
  LedgerEngine.transactions = [];
  // Construct string of exactly 999 'B's followed by a 2-code-unit emoji '💰' (UTF-16 codes 55357, 56480)
  // Total length = 1001. A naive slice(0, 1000) splits the surrogate pair, leaving 55357 (isolated high surrogate)
  const boundaryPayload = 'B'.repeat(999) + '💰' + 'EXTRA_DATA';
  try {
    await LedgerEngine.postTransaction('2026-09-01', boundaryPayload, 'Cash and Bank', 'Sales Revenue', 12000, 'Sales', 'REF-SURR-1');
  } catch (e) {}
  
  const tx = LedgerEngine.transactions.find(t => t.ref === 'REF-SURR-1');
  assert(tx, 'Transaction found');
  const lastCode = tx.narration.charCodeAt(tx.narration.length - 1);
  const isHighSurrogate = lastCode >= 0xD800 && lastCode <= 0xDBFF;
  assert(!isHighSurrogate, `Last code unit (${lastCode}) is NOT an orphaned high surrogate`);
  assertEqual(tx.narration.length, 999, 'Safely backed off to 999 chars rather than keeping lone surrogate');
  console.log(`    Boundary check: Length backed off to ${tx.narration.length} to preserve UTF-16 validity. Lone surrogate prevented.`);
});

// ==================== GAP 3: CONCURRENT INVOICE FINALIZATION RACE ====================
console.log('\n--- GAP 3: Concurrent Invoice Finalization Race ---\n');

await runTest('GAP3-01', '2 concurrent finalizeInvoice() calls via Promise.all(): exactly 1 succeeds, 1 rejects', async () => {
  LedgerEngine.transactions = [];
  InvoiceEngine.invoices = [];
  const inv = InvoiceEngine.createInvoice('2026-09-01', 'Apex Dynamics Ltd', [{ hsnSac: '9983', description: 'Software Services', qty: 1, rate: 50000 }], 'LOCAL');
  
  const results = await Promise.allSettled([
    Promise.resolve().then(() => InvoiceEngine.finalizeInvoice(inv.invoiceNumber)),
    Promise.resolve().then(() => InvoiceEngine.finalizeInvoice(inv.invoiceNumber))
  ]);
  
  const fulfilled = results.filter(r => r.status === 'fulfilled');
  const rejected = results.filter(r => r.status === 'rejected');
  
  assertEqual(fulfilled.length, 1, 'Exactly 1 call succeeded');
  assertEqual(rejected.length, 1, 'Exactly 1 call rejected');
  assert(rejected[0].reason.message.includes('already finalized'), 'Rejection message cites already finalized');
  
  const ledgerTxs = LedgerEngine.transactions.filter(t => t.ref === inv.invoiceNumber);
  assertEqual(ledgerTxs.length, 2, 'Exactly 2 ledger legs created (one debit, one credit)');
  console.log(`    Race result: 1 fulfilled, 1 rejected with "${rejected[0].reason.message}". Ledger legs: ${ledgerTxs.length}`);
});

await runTest('GAP3-02', 'Falsification: 5 simultaneous finalizeInvoice() calls: exactly 1 succeeds, 4 reject', async () => {
  LedgerEngine.transactions = [];
  InvoiceEngine.invoices = [];
  const inv = InvoiceEngine.createInvoice('2026-09-01', 'HighConcurrency Corp', [{ hsnSac: '9983', description: 'Cloud Infra', qty: 1, rate: 80000 }], 'LOCAL');
  
  const calls = Array.from({ length: 5 }, () => Promise.resolve().then(() => InvoiceEngine.finalizeInvoice(inv.invoiceNumber)));
  const results = await Promise.allSettled(calls);
  
  const fulfilled = results.filter(r => r.status === 'fulfilled');
  const rejected = results.filter(r => r.status === 'rejected');
  
  assertEqual(fulfilled.length, 1, 'Exactly 1 call succeeded out of 5');
  assertEqual(rejected.length, 4, 'Exactly 4 calls rejected out of 5');
  const ledgerTxs = LedgerEngine.transactions.filter(t => t.ref === inv.invoiceNumber);
  assertEqual(ledgerTxs.length, 2, 'Exactly 2 ledger legs for primary revenue entry (zero double-posting)');
  console.log(`    5-call race result: ${fulfilled.length} fulfilled, ${rejected.length} rejected. Zero duplicate posts.`);
});

// ==================== GAP 4: CONCURRENT BRS DOUBLE-POST RACE ====================
console.log('\n--- GAP 4: Concurrent BRS Double-Post Race ---\n');

await runTest('GAP4-01', '2 concurrent postBankItem() calls via Promise.all(): posted exactly once', async () => {
  LedgerEngine.transactions = [];
  BRSEngine._postingLocks = new Set();
  
  const bankItem = {
    id: 'RACE-BRS-01',
    date: '2026-09-01',
    description: 'Bank Annual Maintenance Charges',
    amount: 1200,
    type: 'Withdrawal'
  };
  
  const results = await Promise.all([
    Promise.resolve().then(() => BRSEngine.postBankItem(bankItem)),
    Promise.resolve().then(() => BRSEngine.postBankItem(bankItem))
  ]);
  
  const successCount = results.filter(r => r === true).length;
  const skippedCount = results.filter(r => r === false).length;
  
  assertEqual(successCount, 1, 'Exactly 1 postBankItem succeeded');
  assertEqual(skippedCount, 1, 'Exactly 1 postBankItem skipped');
  
  const matchingTxs = LedgerEngine.transactions.filter(t => t.ref === 'BANK-W-RACE-BRS-01');
  assertEqual(matchingTxs.length, 2, 'Exactly 2 legs posted in ledger (no double-posting)');
  console.log(`    2-call race: Successes: ${successCount}, Skipped: ${skippedCount}, Ledger legs: ${matchingTxs.length}`);
});

await runTest('GAP4-02', 'Falsification: 5 simultaneous postBankItem() calls: posted exactly once', async () => {
  LedgerEngine.transactions = [];
  BRSEngine._postingLocks = new Set();
  
  const bankItem = {
    id: 'RACE-BRS-05',
    date: '2026-09-02',
    description: 'Quarterly Interest Received',
    amount: 4500,
    type: 'Deposit'
  };
  
  const calls = Array.from({ length: 5 }, () => Promise.resolve().then(() => BRSEngine.postBankItem(bankItem)));
  const results = await Promise.all(calls);
  
  const successCount = results.filter(r => r === true).length;
  const skippedCount = results.filter(r => r === false).length;
  
  assertEqual(successCount, 1, 'Exactly 1 postBankItem succeeded out of 5');
  assertEqual(skippedCount, 4, 'Exactly 4 postBankItem calls skipped out of 5');
  
  const matchingTxs = LedgerEngine.transactions.filter(t => t.ref === 'BANK-D-RACE-BRS-05');
  assertEqual(matchingTxs.length, 2, 'Exactly 2 legs in ledger');
  console.log(`    5-call race: Successes: ${successCount}, Skipped: ${skippedCount}, Ledger legs: ${matchingTxs.length}`);
});

// ==================== GAP 5: FISCAL YEAR BOUNDARY & LEAP DAY ====================
console.log('\n--- GAP 5: Fiscal Year Boundary & Leap Day Handling ---\n');

await runTest('GAP5-01', 'FY boundary classification: 2026-03-31 is FY 2025-26 and 2026-04-01 is FY 2026-27', async () => {
  const d1 = new Date('2026-03-31T12:00:00');
  const d2 = new Date('2026-04-01T12:00:00');
  
  const fy1 = LedgerEngine.getCurrentFiscalYear(d1);
  const fy2 = LedgerEngine.getCurrentFiscalYear(d2);
  
  assertEqual(fy1, 'FY 2025-26', 'March 31 fiscal year');
  assertEqual(fy2, 'FY 2026-27', 'April 1 fiscal year');
  console.log(`    2026-03-31 -> "${fy1}" | 2026-04-01 -> "${fy2}"`);
});

await runTest('GAP5-02', 'Falsification: Boundary at midnight 2026-03-31T00:00:00 vs 23:59:59', async () => {
  const dMidnightStart = new Date('2026-03-31T00:00:00');
  const dMidnightEnd = new Date('2026-03-31T23:59:59');
  
  const fyStart = LedgerEngine.getCurrentFiscalYear(dMidnightStart);
  const fyEnd = LedgerEngine.getCurrentFiscalYear(dMidnightEnd);
  
  assertEqual(fyStart, 'FY 2025-26', 'Start of March 31');
  assertEqual(fyEnd, 'FY 2025-26', 'End of March 31');
  console.log(`    Midnight boundary check: 00:00:00 -> "${fyStart}" | 23:59:59 -> "${fyEnd}"`);
});

await runTest('GAP5-03', 'Leap Day 2024-02-29 accepted, stored, and filtered correctly', async () => {
  LedgerEngine.transactions = [];
  try {
    await LedgerEngine.postTransaction('2024-02-29', 'Leap Day Capital Addition', 'Cash and Bank', 'Share Capital', 500000, 'Capital', 'LEAP-2024');
  } catch (e) {}
  
  const tx = LedgerEngine.transactions.find(t => t.ref === 'LEAP-2024');
  assert(tx, 'Leap day transaction accepted');
  assertEqual(tx.date, '2024-02-29', 'Date stored as exact leap day');
  
  // Test inclusion in filtered transactions
  const filtered = LedgerEngine.getFilteredTransactions('FY 2024-25');
  const inFiltered = filtered.find(t => t.ref === 'LEAP-2024');
  assert(inFiltered, 'Leap day transaction properly included in FY 2024-25 scoping');
  console.log(`    Leap day 2024-02-29 accepted and verified in FY 2024-25 period range.`);
});

await runTest('GAP5-04', 'Non-Leap Year 2025-02-29 strictly rejected as invalid calendar date', async () => {
  LedgerEngine.transactions = [];
  let thrown = false;
  let errorMsg = '';
  try {
    await LedgerEngine.postTransaction('2025-02-29', 'Invalid date entry', 'Cash and Bank', 'Sales Revenue', 1000, 'Sales', 'INVALID-LEAP');
  } catch (err) {
    thrown = true;
    errorMsg = err.message;
  }
  
  assert(thrown, 'Transaction on 2025-02-29 was rejected');
  assert(errorMsg.includes('does not exist in calendar'), `Error specifically identified calendar invalidity: "${errorMsg}"`);
  assertEqual(LedgerEngine.transactions.length, 0, 'No transactions created for invalid calendar date');
  console.log(`    Rejected 2025-02-29 with: "${errorMsg}"`);
});

// ==================== SUMMARY ====================
console.log('\n' + '='.repeat(76));
console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} tests`);
console.log('='.repeat(76));

console.log('\n  FULL RESULTS TABLE:');
console.log('  ' + '-'.repeat(72));
console.log('  | ID       | Test Description                                 | Verdict |');
console.log('  ' + '-'.repeat(72));
results.forEach(r => {
  const id = r.id.padEnd(8);
  const name = r.name.padEnd(48).slice(0, 48);
  const v = r.verdict.padEnd(7);
  console.log(`  | ${id} | ${name} | ${v} |`);
});
console.log('  ' + '-'.repeat(72));

process.exit(failed > 0 ? 1 : 0);
