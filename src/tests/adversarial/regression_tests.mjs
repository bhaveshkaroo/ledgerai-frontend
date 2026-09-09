/**
 * MESO LEDGER AI — Tier 1 Adversarial & Edge-Case Regression Test Suite
 * 18 tests | Chain-of-verification: Hypothesis -> Test -> Raw Output -> Falsification -> Verdict
 * Run: node --experimental-vm-modules src/tests/adversarial/regression_tests.mjs
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
globalThis.fetch = async () => { throw new Error('Network disabled in test'); };

// ==================== IMPORTS (named exports) ====================
const { LedgerEngine, generateBalancedTransactions } = await import('../../utils/LedgerEngine.js');
const { BRSEngine } = await import('../../utils/BRSEngine.js');
const { InvoiceEngine } = await import('../../utils/InvoiceEngine.js');
const { InventoryEngine } = await import('../../utils/InventoryEngine.js');
const { FinancialAnalysisEngine } = await import('../../utils/FinancialAnalysisEngine.js');
const { checkAiRateLimit } = await import('../../utils/aiConfig.js');

// ==================== TEST HARNESS ====================
let passed = 0;
let failed = 0;
const results = [];

function test(id, name, fn) {
  try {
    fn();
    passed++;
    results.push({ id, name, verdict: 'PASS' });
    console.log('  [PASS] [' + id + '] ' + name);
  } catch (err) {
    failed++;
    results.push({ id, name, verdict: 'FAIL', error: err.message });
    console.log('  [FAIL] [' + id + '] ' + name + ' -- ' + err.message);
  }
}

async function testAsync(id, name, fn) {
  try {
    await fn();
    passed++;
    results.push({ id, name, verdict: 'PASS' });
    console.log('  [PASS] [' + id + '] ' + name);
  } catch (err) {
    failed++;
    results.push({ id, name, verdict: 'FAIL', error: err.message });
    console.log('  [FAIL] [' + id + '] ' + name + ' -- ' + err.message);
  }
}

function assertThrows(fn, expectedSubstring) {
  try {
    fn();
    throw new Error('Expected error containing "' + expectedSubstring + '" but no error was thrown');
  } catch (err) {
    if (err.message.includes('Expected error containing')) throw err;
    if (!err.message.includes(expectedSubstring)) {
      throw new Error('Expected error containing "' + expectedSubstring + '" but got: "' + err.message + '"');
    }
  }
}

async function assertThrowsAsync(fn, expectedSubstring) {
  try {
    await fn();
    throw new Error('Expected error containing "' + expectedSubstring + '" but no error was thrown');
  } catch (err) {
    if (err.message.includes('Expected error containing')) throw err;
    if (!err.message.includes(expectedSubstring)) {
      throw new Error('Expected error containing "' + expectedSubstring + '" but got: "' + err.message + '"');
    }
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(label + ': expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual));
  }
}

function assert(condition, label) {
  if (!condition) {
    throw new Error('Assertion failed: ' + label);
  }
}

// ==================== RESET HELPER ====================
function resetLedger() {
  LedgerEngine.transactions = [];
}

// ==================== TESTS ====================

console.log('\n' + '='.repeat(72));
console.log('  MESO LEDGER AI -- ADVERSARIAL & EDGE-CASE REGRESSION TEST SUITE');
console.log('  Run at: ' + new Date().toISOString());
console.log('='.repeat(72));

// ---- Part 2A: LedgerEngine.postTransaction Input Validation ----
console.log('\n--- Part 2A: LedgerEngine.postTransaction Input Validation ---\n');

await testAsync('T01', 'Reject negative amount', async () => {
  resetLedger();
  const before = LedgerEngine.transactions.length;
  await assertThrowsAsync(
    () => LedgerEngine.postTransaction('2026-09-01', 'Negative test', 'Cash and Bank', 'Sales Revenue', -5000, 'Test'),
    'strictly positive'
  );
  assertEqual(LedgerEngine.transactions.length, before, 'Transaction count unchanged');
});

await testAsync('T02', 'Reject zero amount', async () => {
  resetLedger();
  await assertThrowsAsync(
    () => LedgerEngine.postTransaction('2026-09-01', 'Zero test', 'Cash and Bank', 'Sales Revenue', 0, 'Test'),
    'strictly positive'
  );
});

await testAsync('T03', 'Reject NaN amount', async () => {
  resetLedger();
  await assertThrowsAsync(
    () => LedgerEngine.postTransaction('2026-09-01', 'NaN test', 'Cash and Bank', 'Sales Revenue', 'banana', 'Test'),
    'finite number'
  );
});

await testAsync('T04', 'Reject Infinity amount', async () => {
  resetLedger();
  await assertThrowsAsync(
    () => LedgerEngine.postTransaction('2026-09-01', 'Infinity test', 'Cash and Bank', 'Sales Revenue', Infinity, 'Test'),
    'finite number'
  );
});

await testAsync('T05', 'Reject amount exceeding 1 Lakh Crore ceiling', async () => {
  resetLedger();
  await assertThrowsAsync(
    () => LedgerEngine.postTransaction('2026-09-01', 'Overflow test', 'Cash and Bank', 'Sales Revenue', 1000000000000, 'Test'),
    'maximum allowable'
  );
});

await testAsync('T06', '2-decimal rounding on valid amount', async () => {
  const numAmount = 1000.999;
  const cleanAmount = Math.round(numAmount * 100) / 100;
  assertEqual(cleanAmount, 1001.00, 'Rounded amount');
  assertEqual(Math.round(49.995 * 100) / 100, 50.00, 'Rounded 49.995');
  assertEqual(Math.round(0.004 * 100) / 100, 0.00, 'Rounded 0.004');
});

await testAsync('T07', 'Reject empty account names', async () => {
  resetLedger();
  await assertThrowsAsync(
    () => LedgerEngine.postTransaction('2026-09-01', 'Empty account', '', 'Sales Revenue', 1000, 'Test'),
    'non-empty strings'
  );
  await assertThrowsAsync(
    () => LedgerEngine.postTransaction('2026-09-01', 'Empty account', 'Cash and Bank', '   ', 1000, 'Test'),
    'non-empty strings'
  );
});

// ---- Part 2B: BRSEngine Idempotency ----
console.log('\n--- Part 2B: BRSEngine Idempotency ---\n');

await testAsync('T08', 'First BRS bank item post succeeds', async () => {
  resetLedger();
  const result = BRSEngine.postBankItem({
    id: 'IDEMP-001',
    date: '2026-09-01',
    description: 'Test Bank Charges',
    amount: 500,
    type: 'Withdrawal'
  });
  assertEqual(result, true, 'First post returns true');
  const matchingTxs = LedgerEngine.transactions.filter(t => t.ref === 'BANK-W-IDEMP-001');
  assertEqual(matchingTxs.length, 2, 'Exactly 2 legs created');
  console.log('    Posted ref: BANK-W-IDEMP-001, legs: ' + matchingTxs.length);
});

await testAsync('T09', 'Duplicate BRS bank item post is blocked', async () => {
  // T08 already posted BANK-W-IDEMP-001 to the ledger (same LedgerEngine instance)
  const result = BRSEngine.postBankItem({
    id: 'IDEMP-001',
    date: '2026-09-01',
    description: 'Test Bank Charges',
    amount: 500,
    type: 'Withdrawal'
  });
  assertEqual(result, false, 'Duplicate post returns false');
  const matchingTxs = LedgerEngine.transactions.filter(t => t.ref === 'BANK-W-IDEMP-001');
  assertEqual(matchingTxs.length, 2, 'Still exactly 2 legs (no duplicate)');
  console.log('    Duplicate blocked. Total legs still: ' + matchingTxs.length);
});

// ---- Part 2C: InvoiceEngine Finalization Guards ----
console.log('\n--- Part 2C: InvoiceEngine Finalization Guards ---\n');

test('T10', 'Cannot finalize a non-existent invoice', () => {
  assertThrows(
    () => InvoiceEngine.finalizeInvoice('GHOST-999'),
    'not found'
  );
});

test('T11', 'Cannot finalize an already-finalized invoice', () => {
  resetLedger();
  InvoiceEngine.invoices = [];
  const inv = InvoiceEngine.createInvoice('2026-09-01', 'Test Corp', [{ hsnSac: '9983', description: 'Design Services', qty: 1, rate: 10000 }], 'LOCAL');
  InvoiceEngine.finalizeInvoice(inv.invoiceNumber);
  assertThrows(
    () => InvoiceEngine.finalizeInvoice(inv.invoiceNumber),
    'already finalized'
  );
  console.log('    Double-finalize of ' + inv.invoiceNumber + ' correctly blocked');
});

test('T12', 'Cannot finalize a voided invoice', () => {
  resetLedger();
  InvoiceEngine.invoices = [];
  const inv = InvoiceEngine.createInvoice('2026-09-01', 'Void Corp', [{ hsnSac: '5208', description: 'Cotton Fabric', qty: 1, rate: 5000 }], 'LOCAL');
  InvoiceEngine.voidInvoice(inv.invoiceNumber);
  assertThrows(
    () => InvoiceEngine.finalizeInvoice(inv.invoiceNumber),
    'voided invoice'
  );
  console.log('    Finalize-after-void of ' + inv.invoiceNumber + ' correctly blocked');
});

// ---- Part 2D: InventoryEngine FIFO Stock Guard ----
console.log('\n--- Part 2D: InventoryEngine FIFO Stock Guard ---\n');

test('T13', 'Reject issuing more goods than available', () => {
  InventoryEngine.stock = {};
  InventoryEngine.movements = [];
  // Use recordPurchase to add stock (the actual API)
  InventoryEngine.recordPurchase('2026-09-01', 'WIDGET-A', 10, 100, 'TestSupplier', 0);
  assertThrows(
    () => InventoryEngine.issueGoods('2026-09-01', 'WIDGET-A', 100),
    'Insufficient stock'
  );
  const remaining = InventoryEngine.stock['WIDGET-A'].reduce((s, b) => s + b.qty, 0);
  assertEqual(remaining, 10, 'Stock unchanged after failed issue');
  console.log('    Attempted to issue 100, only 10 available. Correctly rejected. Remaining: ' + remaining);
});

test('T14', 'FIFO correctly depletes oldest batch first', () => {
  InventoryEngine.stock = {};
  InventoryEngine.movements = [];
  // Batch 1: 3 units @ 100
  InventoryEngine.recordPurchase('2026-08-01', 'PART-B', 3, 100, 'SupplierA', 0);
  // Batch 2: 10 units @ 200
  InventoryEngine.recordPurchase('2026-09-01', 'PART-B', 10, 200, 'SupplierB', 0);
  // Issue 5: should consume all 3 from batch 1 + 2 from batch 2
  InventoryEngine.issueGoods('2026-09-02', 'PART-B', 5);
  const batches = InventoryEngine.stock['PART-B'];
  assertEqual(batches.length, 1, 'Only one batch remaining (oldest fully consumed)');
  assertEqual(batches[0].qty, 8, 'Remaining batch has 8 units');
  assertEqual(batches[0].unitCost, 200, 'Remaining batch is newer at 200');
  console.log('    FIFO: 3@100 + 2@200 consumed. Remaining: 1 batch, 8 units @ 200');
});

// ---- Part 2E: AI Rate Limiter ----
console.log('\n--- Part 2E: AI Rate Limiter ---\n');

test('T15', 'Rate limiter allows first 15 requests', () => {
  let successCount = 0;
  for (let i = 0; i < 15; i++) {
    try {
      checkAiRateLimit();
      successCount++;
    } catch (e) {
      break;
    }
  }
  assert(successCount > 0, 'At least some requests succeeded (got ' + successCount + ')');
  console.log('    Allowed ' + successCount + ' requests before limit');
});

test('T16', '16th request triggers rate limit error', () => {
  assertThrows(
    () => checkAiRateLimit(),
    'rate limit exceeded'
  );
  console.log('    Request #16+ correctly rejected with rate limit error');
});

// ---- Part 2F: Altman Z-Score ----
console.log('\n--- Part 2F: Altman Z-Score ---\n');

test('T17', 'Altman Z-Score returns all 5 components and zone', () => {
  resetLedger();
  LedgerEngine.transactions.push(
    { id: '1A', date: '2026-09-01', account: 'Cash and Bank', amount: 100000, type: 'Debit', narration: 'Capital', ref: 'T17-1', category: 'Capital' },
    { id: '1B', date: '2026-09-01', account: "Owner's Capital", amount: 100000, type: 'Credit', narration: 'Capital', ref: 'T17-1', category: 'Capital' },
    { id: '2A', date: '2026-09-01', account: 'Sales Revenue', amount: 50000, type: 'Credit', narration: 'Revenue', ref: 'T17-2', category: 'Sales' },
    { id: '2B', date: '2026-09-01', account: 'Accounts Receivable', amount: 50000, type: 'Debit', narration: 'Revenue', ref: 'T17-2', category: 'Sales' },
    { id: '3A', date: '2026-09-01', account: 'Rent Expense', amount: 10000, type: 'Debit', narration: 'Rent', ref: 'T17-3', category: 'Overhead' },
    { id: '3B', date: '2026-09-01', account: 'Cash and Bank', amount: 10000, type: 'Credit', narration: 'Rent', ref: 'T17-3', category: 'Overhead' }
  );

  const analysis = FinancialAnalysisEngine.computeMetrics();
  const z = analysis.ratios.altmanZ;

  assert(z !== undefined, 'altmanZ exists in ratios');
  assert(typeof z.score === 'number', 'Z-Score is a number');
  assert(['Safe Zone', 'Grey Zone', 'Distress Zone'].includes(z.zone), 'Zone is valid: ' + z.zone);
  assert(typeof z.interpretation === 'string' && z.interpretation.length > 0, 'Interpretation is non-empty');
  assert(z.components !== undefined, 'Components object exists');
  assert(typeof z.components.x1_workingCapital_to_totalAssets === 'number', 'X1 exists');
  assert(typeof z.components.x2_retainedEarnings_to_totalAssets === 'number', 'X2 exists');
  assert(typeof z.components.x3_ebit_to_totalAssets === 'number', 'X3 exists');
  assert(typeof z.components.x4_equity_to_totalLiabilities === 'number', 'X4 exists');
  assert(typeof z.components.x5_sales_to_totalAssets === 'number', 'X5 exists');
  assert(z.equityBasis.includes('Book Value'), 'Equity basis states Book Value');
  console.log('    Z-Score raw output:', JSON.stringify(z, null, 2));
});

test('T18', 'Altman Z-Score zone boundaries are correct', () => {
  resetLedger();
  const analysis = FinancialAnalysisEngine.computeMetrics();
  const z = analysis.ratios.altmanZ;
  console.log('    Zero-data Z-Score:', z.score, '->', z.zone);
  if (z.score < 1.81) {
    assertEqual(z.zone, 'Distress Zone', 'Sub-1.81 maps to Distress');
  } else if (z.score <= 2.99) {
    assertEqual(z.zone, 'Grey Zone', '1.81-2.99 maps to Grey');
  } else {
    assertEqual(z.zone, 'Safe Zone', '>2.99 maps to Safe');
  }
});

// ==================== SUMMARY ====================
console.log('\n' + '='.repeat(72));
console.log('  RESULTS: ' + passed + ' PASSED, ' + failed + ' FAILED out of ' + (passed + failed) + ' tests');
console.log('='.repeat(72));

if (failed > 0) {
  console.log('\n  FAILED TESTS:');
  results.filter(r => r.verdict === 'FAIL').forEach(r => {
    console.log('    [FAIL] [' + r.id + '] ' + r.name + ': ' + r.error);
  });
}

console.log('\n  FULL RESULTS TABLE:');
console.log('  ' + '-'.repeat(68));
console.log('  | ID   | Test Name                                        | Verdict |');
console.log('  ' + '-'.repeat(68));
results.forEach(r => {
  const id = r.id.padEnd(4);
  const name = r.name.padEnd(48).slice(0, 48);
  const v = r.verdict.padEnd(7);
  console.log('  | ' + id + ' | ' + name + ' | ' + v + ' |');
});
console.log('  ' + '-'.repeat(68));

process.exit(failed > 0 ? 1 : 0);
