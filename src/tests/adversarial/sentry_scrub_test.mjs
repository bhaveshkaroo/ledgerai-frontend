/**
 * Sentry Scrubbing Verification Test
 * Proves that sensitive fields are redacted before any event leaves the client.
 */

// Mock browser globals
globalThis.localStorage = { _store: {}, getItem(k) { return this._store[k] ?? null; }, setItem(k, v) { this._store[k] = String(v); }, removeItem(k) { delete this._store[k]; } };
globalThis.window = { dispatchEvent: () => {} };

const { scrubSensitiveData } = await import('../../utils/sentryConfig.js');

console.log('\n=== SENTRY SCRUBBING VERIFICATION ===\n');

// Test 1: API key field scrubbing
const event1 = {
  apiKey: 'AIzaSyBvery-secret-key-12345678901234',
  authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
  password: 'super-secret-password-123',
  normalField: 'This is fine',
  nested: {
    SUPABASE_KEY: 'sb-live-key-abc123',
    data: 'normal data here'
  }
};

const scrubbed1 = scrubSensitiveData(event1);
console.log('Test 1: Field-level scrubbing');
console.log('  apiKey:', scrubbed1.apiKey === '[REDACTED]' ? 'SCRUBBED' : 'LEAKED: ' + scrubbed1.apiKey);
console.log('  authorization:', scrubbed1.authorization === '[REDACTED]' ? 'SCRUBBED' : 'LEAKED: ' + scrubbed1.authorization);
console.log('  password:', scrubbed1.password === '[REDACTED]' ? 'SCRUBBED' : 'LEAKED: ' + scrubbed1.password);
console.log('  normalField:', scrubbed1.normalField === 'This is fine' ? 'PRESERVED' : 'WRONGLY MODIFIED');
console.log('  nested.SUPABASE_KEY:', scrubbed1.nested.SUPABASE_KEY === '[REDACTED]' ? 'SCRUBBED' : 'LEAKED: ' + scrubbed1.nested.SUPABASE_KEY);
console.log('  nested.data:', scrubbed1.nested.data === 'normal data here' ? 'PRESERVED' : 'WRONGLY MODIFIED');

// Test 2: Inline pattern scrubbing (API keys and JWTs embedded in strings)
const event2 = {
  message: 'Failed to call API with key AIzaSyBtest1234567890123456789012345 at endpoint',
  url: 'https://api.example.com?token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'
};

const scrubbed2 = scrubSensitiveData(event2);
console.log('\nTest 2: Inline pattern scrubbing');
console.log('  API key in message:', scrubbed2.message.includes('AIza') ? 'LEAKED' : 'SCRUBBED');
console.log('  JWT in url:', scrubbed2.url.includes('eyJ') ? 'LEAKED' : 'SCRUBBED');
console.log('  Scrubbed message:', scrubbed2.message);

// Test 3: Falsification attempt — does scrubbing break normal data?
const event3 = {
  transactionId: 'TXN-2026-001',
  amount: 50000,
  account: 'Sales Revenue',
  narration: 'Payment received from client'
};

const scrubbed3 = scrubSensitiveData(event3);
console.log('\nTest 3: Falsification - normal data preserved');
console.log('  transactionId:', scrubbed3.transactionId === 'TXN-2026-001' ? 'PRESERVED' : 'BROKEN');
console.log('  amount:', scrubbed3.amount === 50000 ? 'PRESERVED' : 'BROKEN');
console.log('  account:', scrubbed3.account === 'Sales Revenue' ? 'PRESERVED' : 'BROKEN');

// Summary
const allPassed = 
  scrubbed1.apiKey === '[REDACTED]' &&
  scrubbed1.authorization === '[REDACTED]' &&
  scrubbed1.password === '[REDACTED]' &&
  scrubbed1.normalField === 'This is fine' &&
  scrubbed1.nested.SUPABASE_KEY === '[REDACTED]' &&
  !scrubbed2.message.includes('AIza') &&
  !scrubbed2.url.includes('eyJ') &&
  scrubbed3.transactionId === 'TXN-2026-001' &&
  scrubbed3.amount === 50000;

console.log('\n=== VERDICT:', allPassed ? 'ALL SCRUBBING TESTS PASSED' : 'SOME TESTS FAILED', '===\n');
process.exit(allPassed ? 0 : 1);
