/**
 * BusinessEngine.js
 * Multi-company & multi-user management, profiles, clients, vendors, and clean data isolation for Meso AI.
 */

import { LedgerEngine, generateBalancedTransactions } from './LedgerEngine.js';
import { InvoiceEngine } from './InvoiceEngine.js';
import { InventoryEngine } from './InventoryEngine.js';

const STORAGE_PROFILE_KEY = 'MESO_BUSINESS_PROFILE';
const STORAGE_CLIENTS_KEY = 'MESO_BUSINESS_CLIENTS';
const STORAGE_VENDORS_KEY = 'MESO_BUSINESS_VENDORS';
const STORAGE_COMPANY_LIST_KEY = 'MESO_COMPANY_LIST';
const STORAGE_ACTIVE_COMPANY_KEY = 'MESO_ACTIVE_COMPANY_ID';

export const SAMPLE_COMPANY_ID = 'apex-sample';

export const DEFAULT_PRODUCTION_PROFILE = {
  businessName: 'Apex Innovations Pvt Ltd',
  legalName: 'Apex Innovations Private Limited',
  gstin: '27AABCA1234R1ZM',
  pan: 'AABCA1234R',
  entityType: 'Private Limited Company',
  industry: 'Technology & SaaS Solutions',
  registeredAddress: 'Unit 402, Trade Center, BKC, Bandra East, Mumbai, Maharashtra - 400051',
  financialYear: 'FY 2026-27',
  email: 'founder@mesoai.in',
  phone: '+91 98200 12345',
  bankName: 'HDFC Bank Ltd',
  bankAccountNo: '50200048912345',
  ifscCode: 'HDFC0000060',
  currency: 'INR'
};

export const DEFAULT_CLIENTS = [
  { id: 'cli-1', name: 'Tata Consultancy Systems', gstin: '27AAACT2727Q1ZW', email: 'billing@tcs-enterprises.com', phone: '+91 22 6778 9000', terms: '30 Days', openingBalance: 450000, status: 'Active' },
  { id: 'cli-2', name: 'Infosys BPM Solutions', gstin: '29AABCI1234M1ZX', email: 'accounts@infosys-bpm.com', phone: '+91 80 2852 0361', terms: '45 Days', openingBalance: 320000, status: 'Active' },
  { id: 'cli-3', name: 'Reliance Retail Digital', gstin: '27AABCR1234H1ZV', email: 'vendorpay@ril-digital.com', phone: '+91 22 3555 5000', terms: '15 Days', openingBalance: 185000, status: 'Active' }
];

export const DEFAULT_VENDORS = [
  { id: 'ven-1', name: 'Amazon Web Services (AWS)', category: 'Cloud Infrastructure', pan: 'AAACA1234E', gstin: '9917USA29004OS1', tdsSection: '194J(b)', rate: 2.0, terms: 'Due on Receipt', openingBalance: 147000 },
  { id: 'ven-2', name: 'Khaitan & Co Legal Advisory', category: 'Legal Counsel', pan: 'AABFK5678G', gstin: '27AAAFK5678G1ZU', tdsSection: '194J(a)', rate: 10.0, terms: '30 Days', openingBalance: 180000 },
  { id: 'ven-3', name: 'BlueDart Freight Logistics', category: 'Works Contract & Freight', pan: 'AAACB9012F', gstin: '27AAACB9012F1ZT', tdsSection: '194C', rate: 2.0, terms: '15 Days', openingBalance: 85000 }
];

// ══════════════════════════════════════════════════════════════
//  MULTI-COMPANY & DATA ISOLATION MANAGEMENT
// ══════════════════════════════════════════════════════════════

export function getCompanyList() {
  try {
    const saved = localStorage.getItem(STORAGE_COMPANY_LIST_KEY);
    if (saved) {
      const list = JSON.parse(saved);
      if (Array.isArray(list) && list.length > 0) return list;
    }
  } catch (_) {}
  const defaultList = [{
    id: SAMPLE_COMPANY_ID,
    name: 'Apex Innovations Pvt Ltd',
    gstin: '27AABCA1234R1ZM',
    createdAt: new Date().toISOString(),
    isSample: true
  }];
  localStorage.setItem(STORAGE_COMPANY_LIST_KEY, JSON.stringify(defaultList));
  return defaultList;
}

export function getActiveCompanyId() {
  return localStorage.getItem(STORAGE_ACTIVE_COMPANY_KEY) || SAMPLE_COMPANY_ID;
}

export function isSampleCompanyActive() {
  return getActiveCompanyId() === SAMPLE_COMPANY_ID;
}

export function setActiveCompanyId(id) {
  localStorage.setItem(STORAGE_ACTIVE_COMPANY_KEY, id);
}

/** Save current in-memory state to a company-specific localStorage snapshot */
export function saveCompanySnapshot(companyId) {
  const id = companyId || getActiveCompanyId();
  try {
    localStorage.setItem(`MESO_CO_${id}_TX`, JSON.stringify(LedgerEngine.transactions));
    localStorage.setItem(`MESO_CO_${id}_INVOICES`, JSON.stringify(InvoiceEngine.invoices || []));
    localStorage.setItem(`MESO_CO_${id}_INVENTORY`, JSON.stringify({
      stock: InventoryEngine.stock || {},
      movements: InventoryEngine.movements || []
    }));
    const profile = localStorage.getItem(STORAGE_PROFILE_KEY);
    if (profile) localStorage.setItem(`MESO_CO_${id}_PROFILE`, profile);
    const clients = localStorage.getItem(STORAGE_CLIENTS_KEY);
    if (clients) localStorage.setItem(`MESO_CO_${id}_CLIENTS`, clients);
    const vendors = localStorage.getItem(STORAGE_VENDORS_KEY);
    if (vendors) localStorage.setItem(`MESO_CO_${id}_VENDORS`, vendors);
  } catch (e) {
    console.warn('[BusinessEngine] saveCompanySnapshot error:', e.message);
  }
}

/** Load a company snapshot from localStorage into active state */
export function loadCompanySnapshot(companyId) {
  try {
    // 1. Transactions
    const txData = localStorage.getItem(`MESO_CO_${companyId}_TX`);
    if (txData) {
      LedgerEngine.transactions = JSON.parse(txData);
    } else if (companyId === SAMPLE_COMPANY_ID) {
      LedgerEngine.transactions = generateBalancedTransactions();
    } else {
      LedgerEngine.transactions = [];
    }

    // 2. Invoices
    const invData = localStorage.getItem(`MESO_CO_${companyId}_INVOICES`);
    if (invData) {
      InvoiceEngine.invoices = JSON.parse(invData);
    } else if (companyId === SAMPLE_COMPANY_ID) {
      InvoiceEngine.seedInvoices();
    } else {
      InvoiceEngine.invoices = [];
    }

    // 3. Inventory
    const invtData = localStorage.getItem(`MESO_CO_${companyId}_INVENTORY`);
    if (invtData) {
      const parsedInvt = JSON.parse(invtData);
      InventoryEngine.stock = parsedInvt.stock || {};
      InventoryEngine.movements = parsedInvt.movements || [];
    } else if (companyId === SAMPLE_COMPANY_ID) {
      InventoryEngine.seedPurchases();
    } else {
      InventoryEngine.stock = {};
      InventoryEngine.movements = [];
    }

    // 4. Profile
    const profileData = localStorage.getItem(`MESO_CO_${companyId}_PROFILE`);
    if (profileData) {
      localStorage.setItem(STORAGE_PROFILE_KEY, profileData);
    } else if (companyId === SAMPLE_COMPANY_ID) {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(DEFAULT_PRODUCTION_PROFILE));
    } else {
      localStorage.removeItem(STORAGE_PROFILE_KEY);
    }

    // 5. Clients
    const clientsData = localStorage.getItem(`MESO_CO_${companyId}_CLIENTS`);
    if (clientsData) localStorage.setItem(STORAGE_CLIENTS_KEY, clientsData);
    else if (companyId === SAMPLE_COMPANY_ID) localStorage.setItem(STORAGE_CLIENTS_KEY, JSON.stringify(DEFAULT_CLIENTS));
    else localStorage.setItem(STORAGE_CLIENTS_KEY, '[]');

    // 6. Vendors
    const vendorsData = localStorage.getItem(`MESO_CO_${companyId}_VENDORS`);
    if (vendorsData) localStorage.setItem(STORAGE_VENDORS_KEY, vendorsData);
    else if (companyId === SAMPLE_COMPANY_ID) localStorage.setItem(STORAGE_VENDORS_KEY, JSON.stringify(DEFAULT_VENDORS));
    else localStorage.setItem(STORAGE_VENDORS_KEY, '[]');

  } catch (e) {
    console.warn('[BusinessEngine] loadCompanySnapshot error:', e.message);
  }
}

/** Switch active company: saves current → loads target → fires events */
export function switchCompany(targetId) {
  const currentId = getActiveCompanyId();
  if (currentId === targetId) return false;

  // Save current company state
  saveCompanySnapshot(currentId);

  // Load target company
  loadCompanySnapshot(targetId);
  setActiveCompanyId(targetId);

  // Fire global events so all components re-render cleanly
  const profile = getBusinessProfile();
  window.dispatchEvent(new CustomEvent('business-profile-updated', { detail: { profile } }));
  window.dispatchEvent(new Event('ledger-updated'));
  window.dispatchEvent(new CustomEvent('company-switched', { detail: { companyId: targetId, profile } }));
  return true;
}

/** Create a brand-new company and switch to it from zero */
export function createNewCompany(profile, openingTransactions = []) {
  const companyId = `co-${Date.now()}`;

  // Save current company first
  saveCompanySnapshot(getActiveCompanyId());

  // Add to company list
  const list = getCompanyList();
  list.push({
    id: companyId,
    name: profile.businessName || 'Unnamed Business',
    gstin: profile.gstin || '',
    createdAt: new Date().toISOString(),
    isSample: false
  });
  localStorage.setItem(STORAGE_COMPANY_LIST_KEY, JSON.stringify(list));

  // Store this company's clean starting data
  localStorage.setItem(`MESO_CO_${companyId}_PROFILE`, JSON.stringify(profile));
  localStorage.setItem(`MESO_CO_${companyId}_TX`, JSON.stringify(openingTransactions));
  localStorage.setItem(`MESO_CO_${companyId}_INVOICES`, JSON.stringify([]));
  localStorage.setItem(`MESO_CO_${companyId}_INVENTORY`, JSON.stringify({ stock: {}, movements: [] }));
  localStorage.setItem(`MESO_CO_${companyId}_CLIENTS`, '[]');
  localStorage.setItem(`MESO_CO_${companyId}_VENDORS`, '[]');

  // Apply to active state: Clean slate
  LedgerEngine.transactions = openingTransactions;
  InvoiceEngine.invoices = [];
  InventoryEngine.stock = {};
  InventoryEngine.movements = [];

  localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
  localStorage.setItem(STORAGE_CLIENTS_KEY, '[]');
  localStorage.setItem(STORAGE_VENDORS_KEY, '[]');
  setActiveCompanyId(companyId);

  // Fire events
  window.dispatchEvent(new CustomEvent('business-profile-updated', { detail: { profile } }));
  window.dispatchEvent(new Event('ledger-updated'));
  window.dispatchEvent(new CustomEvent('company-switched', { detail: { companyId, profile } }));

  return companyId;
}

/** Delete a company (cannot delete active company or sample company) */
export function deleteCompany(companyId) {
  if (companyId === getActiveCompanyId() || companyId === SAMPLE_COMPANY_ID) return false;
  const list = getCompanyList().filter(c => c.id !== companyId);
  localStorage.setItem(STORAGE_COMPANY_LIST_KEY, JSON.stringify(list));
  localStorage.removeItem(`MESO_CO_${companyId}_TX`);
  localStorage.removeItem(`MESO_CO_${companyId}_INVOICES`);
  localStorage.removeItem(`MESO_CO_${companyId}_INVENTORY`);
  localStorage.removeItem(`MESO_CO_${companyId}_PROFILE`);
  localStorage.removeItem(`MESO_CO_${companyId}_CLIENTS`);
  localStorage.removeItem(`MESO_CO_${companyId}_VENDORS`);
  return true;
}

// ══════════════════════════════════════════════════════════════
//  PROFILE / CLIENTS / VENDORS APIS
// ══════════════════════════════════════════════════════════════

export function getWorkspaceMode() {
  return isSampleCompanyActive() ? 'demo' : 'production';
}

export function setWorkspaceMode(mode) {
  localStorage.setItem('MESO_WORKSPACE_MODE', mode);
  window.dispatchEvent(new CustomEvent('workspace-changed', { detail: { mode } }));
  window.dispatchEvent(new Event('ledger-updated'));
}

export function getBusinessProfile() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_PROFILE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
  }
  return { ...DEFAULT_PRODUCTION_PROFILE };
}

export function setBusinessProfile(profile) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
    saveCompanySnapshot(getActiveCompanyId());
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('business-profile-updated', { detail: { profile } }));
  }
  return profile;
}

export function getClients() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_CLIENTS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
  }
  return isSampleCompanyActive() ? [...DEFAULT_CLIENTS] : [];
}

export function saveClients(clients) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_CLIENTS_KEY, JSON.stringify(clients));
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('clients-updated'));
  }
}

export function addClient(client) {
  const list = getClients();
  const newClient = {
    ...client,
    id: `cli-${Date.now()}`,
    status: client.status || 'Active'
  };
  list.unshift(newClient);
  saveClients(list);
  return newClient;
}

export function deleteClient(id) {
  const list = getClients().filter(c => c.id !== id);
  saveClients(list);
}

export function getVendors() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_VENDORS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
  }
  return isSampleCompanyActive() ? [...DEFAULT_VENDORS] : [];
}

export function saveVendors(vendors) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_VENDORS_KEY, JSON.stringify(vendors));
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('vendors-updated'));
  }
}

export function addVendor(vendor) {
  const list = getVendors();
  const newVendor = {
    ...vendor,
    id: `ven-${Date.now()}`
  };
  list.unshift(newVendor);
  saveVendors(list);
  return newVendor;
}

export function deleteVendor(id) {
  const list = getVendors().filter(v => v.id !== id);
  saveVendors(list);
}

export function validateAndParseLedgerData(rows) {
  const parsed = [];
  let totalDebit = 0;
  let totalCredit = 0;
  const errors = [];

  rows.forEach((row, index) => {
    if (!row || row.length < 2) return;
    const accountName = (row[0] || '').trim();
    if (!accountName || accountName.toLowerCase() === 'account name') return;

    const accountType = (row[1] || 'Asset').trim();
    const debit = parseFloat(row[2]) || 0;
    const credit = parseFloat(row[3]) || 0;
    const narration = (row[4] || `Opening balance for ${accountName}`).trim();

    if (debit > 0 && credit > 0) {
      errors.push(`Row ${index + 1}: Account "${accountName}" cannot have both Debit and Credit amounts.`);
    }

    totalDebit += debit;
    totalCredit += credit;

    parsed.push({
      id: `imp-${Date.now()}-${index}`,
      accountName,
      accountType,
      debit,
      credit,
      narration
    });
  });

  const diff = Math.abs(totalDebit - totalCredit);
  const isBalanced = diff < 0.01;

  return { parsed, totalDebit, totalCredit, difference: diff, isBalanced, errors };
}

export function importLedgersToBooks(parsedEntries) {
  if (!parsedEntries || parsedEntries.length === 0) return false;

  const today = new Date().toISOString().slice(0, 10);
  const batchRef = `OB-${Date.now().toString().slice(-4)}`;

  parsedEntries.forEach(entry => {
    if (entry.debit > 0) {
      LedgerEngine.transactions.unshift({
        id: `OB-${Date.now()}-D`,
        date: today,
        account: entry.accountName,
        amount: entry.debit,
        type: 'Debit',
        narration: entry.narration || `Opening Balance - ${entry.accountName}`,
        ref: batchRef,
        category: 'Opening Balance',
        createdAt: new Date().toISOString()
      });
    } else if (entry.credit > 0) {
      LedgerEngine.transactions.unshift({
        id: `OB-${Date.now()}-C`,
        date: today,
        account: entry.accountName,
        amount: entry.credit,
        type: 'Credit',
        narration: entry.narration || `Opening Balance - ${entry.accountName}`,
        ref: batchRef,
        category: 'Opening Balance',
        createdAt: new Date().toISOString()
      });
    }
  });

  window.dispatchEvent(new Event('ledger-updated'));
  return true;
}

export function clearToFreshBooks() {
  LedgerEngine.transactions = [];
  InvoiceEngine.invoices = [];
  InventoryEngine.stock = {};
  InventoryEngine.movements = [];
  window.dispatchEvent(new Event('ledger-updated'));
  return true;
}

export const BusinessEngine = {
  getBusinessProfile,
  setBusinessProfile,
  getClients,
  addClient,
  deleteClient,
  getVendors,
  addVendor,
  deleteVendor,
  validateAndParseLedgerData,
  importLedgersToBooks,
  clearToFreshBooks,
  getWorkspaceMode,
  setWorkspaceMode,
  getCompanyList,
  getActiveCompanyId,
  isSampleCompanyActive,
  switchCompany,
  createNewCompany,
  deleteCompany,
  saveCompanySnapshot,
  loadCompanySnapshot
};

export default BusinessEngine;
