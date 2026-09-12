/**
 * BusinessEngine.js
 * Manages the real business profile, clients (debtors), vendors (creditors),
 * and existing ledger upload/import engine for Meso AI.
 */

import { LedgerEngine } from './LedgerEngine.js';

const STORAGE_PROFILE_KEY = 'MESO_BUSINESS_PROFILE';
const STORAGE_CLIENTS_KEY = 'MESO_BUSINESS_CLIENTS';
const STORAGE_VENDORS_KEY = 'MESO_BUSINESS_VENDORS';
const STORAGE_WORKSPACE_MODE_KEY = 'MESO_WORKSPACE_MODE'; // 'production' or 'demo'

const DEFAULT_PRODUCTION_PROFILE = {
  businessName: 'Apex Innovations Pvt Ltd',
  legalName: 'Apex Innovations Private Limited',
  gstin: '27AABCA1234R1ZM',
  pan: 'AABCA1234R',
  entityType: 'Private Limited Company',
  industry: 'Technology & SaaS Solutions',
  registeredAddress: 'Unit 402, Trade Center, BKC, Bandra East, Mumbai, Maharashtra - 400051',
  financialYear: 'FY 2026-27',
  email: 'user@mesoai.in',
  phone: '+91 98200 12345',
  bankName: 'HDFC Bank Ltd',
  bankAccountNo: '50200048912345',
  ifscCode: 'HDFC0000060',
  currency: 'INR'
};

const DEFAULT_CLIENTS = [
  { id: 'cli-1', name: 'Tata Consultancy Systems', gstin: '27AAACT2727Q1ZW', email: 'billing@tcs-enterprises.com', phone: '+91 22 6778 9000', terms: '30 Days', openingBalance: 450000, status: 'Active' },
  { id: 'cli-2', name: 'Infosys BPM Solutions', gstin: '29AABCI1234M1ZX', email: 'accounts@infosys-bpm.com', phone: '+91 80 2852 0361', terms: '45 Days', openingBalance: 320000, status: 'Active' },
  { id: 'cli-3', name: 'Reliance Retail Digital', gstin: '27AABCR1234H1ZV', email: 'vendorpay@ril-digital.com', phone: '+91 22 3555 5000', terms: '15 Days', openingBalance: 185000, status: 'Active' }
];

const DEFAULT_VENDORS = [
  { id: 'ven-1', name: 'Amazon Web Services (AWS)', category: 'Cloud Infrastructure', pan: 'AAACA1234E', gstin: '9917USA29004OS1', tdsSection: '194J(b)', rate: 2.0, terms: 'Due on Receipt', openingBalance: 147000 },
  { id: 'ven-2', name: 'Khaitan & Co Legal Advisory', category: 'Legal Counsel', pan: 'AABFK5678G', gstin: '27AAAFK5678G1ZU', tdsSection: '194J(a)', rate: 10.0, terms: '30 Days', openingBalance: 180000 },
  { id: 'ven-3', name: 'BlueDart Freight Logistics', category: 'Works Contract & Freight', pan: 'AAACB9012F', gstin: '27AAACB9012F1ZT', tdsSection: '194C', rate: 2.0, terms: '15 Days', openingBalance: 85000 }
];

export function getWorkspaceMode() {
  return localStorage.getItem(STORAGE_WORKSPACE_MODE_KEY) || 'production';
}

export function setWorkspaceMode(mode) {
  localStorage.setItem(STORAGE_WORKSPACE_MODE_KEY, mode);
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
  return [...DEFAULT_CLIENTS];
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
  return [...DEFAULT_VENDORS];
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

/**
 * Parses and validates ledger rows imported from CSV or Excel.
 * Format: Account Name, Type (Asset, Liability, Equity, Revenue, Expense), Debit, Credit, Narration
 */
export function validateAndParseLedgerData(rows) {
  const parsed = [];
  let totalDebit = 0;
  let totalCredit = 0;
  const errors = [];

  rows.forEach((row, index) => {
    // Expected row: [accountName, accountType, debit, credit, narration]
    if (!row || row.length < 2) return;
    const accountName = (row[0] || '').trim();
    if (!accountName || accountName.toLowerCase() === 'account name') return; // Skip headers

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

  return {
    parsed,
    totalDebit,
    totalCredit,
    difference: diff,
    isBalanced,
    errors
  };
}

/**
 * Imports validated ledger accounts and opening balances directly into LedgerEngine.
 */
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

/**
 * Clears demo transactions to start completely fresh with real books.
 */
export function clearToFreshBooks() {
  LedgerEngine.transactions = [];
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
  setWorkspaceMode
};

export default BusinessEngine;
