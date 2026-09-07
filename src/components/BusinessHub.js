import React, { useState } from 'react';
import { 
  Building2, Users, Truck, Upload, FileSpreadsheet, Plus, 
  Trash2, CheckCircle2, AlertCircle, Download, Check, RefreshCw 
} from 'lucide-react';
import { 
  getBusinessProfile, setBusinessProfile, 
  getClients, addClient, deleteClient, 
  getVendors, addVendor, deleteVendor,
  validateAndParseLedgerData, importLedgersToBooks, clearToFreshBooks 
} from '../utils/BusinessEngine';
import { formatINR } from '../utils/LedgerEngine';

function BusinessHub() {
  const [activeTab, setActiveTab] = useState('profile');

  // Profile State
  const [profile, setProfileState] = useState(getBusinessProfile());
  const [profileSaved, setProfileSaved] = useState(false);

  // Clients State
  const [clients, setClientsState] = useState(getClients());
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '', gstin: '', email: '', phone: '', terms: '30 Days', openingBalance: ''
  });

  // Vendors State
  const [vendors, setVendorsState] = useState(getVendors());
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '', category: 'Cloud Infrastructure', pan: '', gstin: '', tdsSection: '194J(b)', rate: 2.0, terms: '30 Days', openingBalance: ''
  });

  // Ledger Import State
  const [importRows, setImportRows] = useState([]);
  const [importStats, setImportStats] = useState(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [rawText, setRawText] = useState('');

  // Save Profile Handler
  const handleSaveProfile = (e) => {
    e.preventDefault();
    setBusinessProfile(profile);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // Add Client Handler
  const handleAddClient = (e) => {
    e.preventDefault();
    if (!newClient.name.trim()) return;
    const created = addClient({
      ...newClient,
      openingBalance: parseFloat(newClient.openingBalance) || 0
    });
    setClientsState([created, ...clients]);
    setNewClient({ name: '', gstin: '', email: '', phone: '', terms: '30 Days', openingBalance: '' });
    setIsClientModalOpen(false);
  };

  const handleDeleteClient = (id) => {
    deleteClient(id);
    setClientsState(clients.filter(c => c.id !== id));
  };

  // Add Vendor Handler
  const handleAddVendor = (e) => {
    e.preventDefault();
    if (!newVendor.name.trim()) return;
    const created = addVendor({
      ...newVendor,
      rate: parseFloat(newVendor.rate) || 2.0,
      openingBalance: parseFloat(newVendor.openingBalance) || 0
    });
    setVendorsState([created, ...vendors]);
    setNewVendor({ name: '', category: 'Cloud Infrastructure', pan: '', gstin: '', tdsSection: '194J(b)', rate: 2.0, terms: '30 Days', openingBalance: '' });
    setIsVendorModalOpen(false);
  };

  const handleDeleteVendor = (id) => {
    deleteVendor(id);
    setVendorsState(vendors.filter(v => v.id !== id));
  };

  // Sample CSV Template Download
  const handleDownloadTemplate = () => {
    const csvContent = 
`Account Name,Type,Debit,Credit,Narration
HDFC Current Account,Asset,500000,0,Bank opening balance
Share Capital,Equity,0,1000000,Initial founder equity
Term Loan Payable,Liability,0,500000,Bank machinery loan
Tata Consultancy Systems,Asset,450000,0,Client debtor opening
Amazon Web Services (AWS),Liability,0,147000,Vendor payable balance
Office Furniture & Equipment,Asset,697000,0,Capitalized assets`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'meso_ledger_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process CSV File or Pasted Text
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setRawText(content);
      parseCSVText(content);
    };
    reader.readAsText(file);
  };

  const parseCSVText = (text) => {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const rows = lines.map(l => l.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, '')));
    const stats = validateAndParseLedgerData(rows);
    setImportRows(stats.parsed);
    setImportStats(stats);
  };

  const handleExecuteImport = () => {
    if (!importStats || !importStats.isBalanced) return;
    const success = importLedgersToBooks(importRows);
    if (success) {
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 4000);
    }
  };

  const handleClearToFresh = () => {
    if (window.confirm('Are you sure you want to clear all demo data and start with 100% clean books?')) {
      clearToFreshBooks();
      alert('Ledgers cleared! You are now on a fresh production slate.');
    }
  };

  return (
    <div className="tab-content animate-fade" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={24} color="#10b981" />
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Business Hub &amp; Onboarding</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
            Manage your company profile, onboard corporate clients, configure vendors, and import existing ledgers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleClearToFresh}
            className="settings-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
          >
            <RefreshCw size={14} />
            <span>Clear to Fresh Books</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border)',
        marginBottom: '24px',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: activeTab === 'profile' ? '#10b981' : 'var(--text-muted)',
            borderBottom: activeTab === 'profile' ? '2px solid #10b981' : '2px solid transparent'
          }}
        >
          <Building2 size={16} />
          <span>Business Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: activeTab === 'clients' ? '#10b981' : 'var(--text-muted)',
            borderBottom: activeTab === 'clients' ? '2px solid #10b981' : '2px solid transparent'
          }}
        >
          <Users size={16} />
          <span>Clients &amp; Debtors ({clients.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('vendors')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: activeTab === 'vendors' ? '#10b981' : 'var(--text-muted)',
            borderBottom: activeTab === 'vendors' ? '2px solid #10b981' : '2px solid transparent'
          }}
        >
          <Truck size={16} />
          <span>Vendors &amp; Creditors ({vendors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('import')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: activeTab === 'import' ? '#10b981' : 'var(--text-muted)',
            borderBottom: activeTab === 'import' ? '2px solid #10b981' : '2px solid transparent'
          }}
        >
          <Upload size={16} />
          <span>Import Existing Ledgers</span>
        </button>
      </div>

      {/* ─── TAB 1: BUSINESS PROFILE ────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Statutory Business Profile</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '4px 0 0 0' }}>
                Used on all tax invoices, GST filings, Challan 281, and statutory financial statements.
              </p>
            </div>
            <button
              type="submit"
              className="btn-primary"
              style={{
                background: '#06402b',
                color: 'white',
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {profileSaved ? <><Check size={16} /> Saved Successfully!</> : 'Save Business Profile'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Business Display Name</label>
              <input
                type="text"
                value={profile.businessName}
                onChange={e => setProfileState({ ...profile, businessName: e.target.value })}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Legal Entity Name (MCA Registered)</label>
              <input
                type="text"
                value={profile.legalName}
                onChange={e => setProfileState({ ...profile, legalName: e.target.value })}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>GSTIN (15-digit GST Identification Number)</label>
              <input
                type="text"
                value={profile.gstin}
                onChange={e => setProfileState({ ...profile, gstin: e.target.value.toUpperCase() })}
                placeholder="27AABCA1234R1ZM"
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Income Tax PAN (10-digit)</label>
              <input
                type="text"
                value={profile.pan}
                onChange={e => setProfileState({ ...profile, pan: e.target.value.toUpperCase() })}
                placeholder="AABCA1234R"
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Entity Type</label>
              <select
                value={profile.entityType}
                onChange={e => setProfileState({ ...profile, entityType: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px' }}
              >
                <option>Private Limited Company</option>
                <option>Public Limited Company</option>
                <option>Limited Liability Partnership (LLP)</option>
                <option>Partnership Firm</option>
                <option>Sole Proprietorship</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Industry / Line of Business</label>
              <input
                type="text"
                value={profile.industry}
                onChange={e => setProfileState({ ...profile, industry: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Registered Office Address</label>
            <textarea
              rows={2}
              value={profile.registeredAddress}
              onChange={e => setProfileState({ ...profile, registeredAddress: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Primary Bank</label>
              <input
                type="text"
                value={profile.bankName}
                onChange={e => setProfileState({ ...profile, bankName: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Bank Account No</label>
              <input
                type="text"
                value={profile.bankAccountNo}
                onChange={e => setProfileState({ ...profile, bankAccountNo: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'monospace' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>IFSC Code</label>
              <input
                type="text"
                value={profile.ifscCode}
                onChange={e => setProfileState({ ...profile, ifscCode: e.target.value.toUpperCase() })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'monospace' }}
              />
            </div>
          </div>
        </form>
      )}

      {/* ─── TAB 2: CLIENTS & DEBTORS ───────────────────────────────────────── */}
      {activeTab === 'clients' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Corporate Clients &amp; Debtors</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '4px 0 0 0' }}>
                Accounts Receivable customer directory with credit terms and opening balances.
              </p>
            </div>
            <button
              onClick={() => setIsClientModalOpen(true)}
              style={{
                background: '#06402b', color: 'white', border: 'none',
                padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Plus size={16} />
              <span>Add New Client</span>
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-surface)' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Client Name</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>GSTIN</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Terms</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Receivable Balance</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px', fontSize: '13px', fontWeight: 600 }}>
                    <div>{c.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>{c.email}</div>
                  </td>
                  <td style={{ padding: '14px', fontSize: '12px', fontFamily: 'monospace' }}>{c.gstin || '—'}</td>
                  <td style={{ padding: '14px', fontSize: '12px' }}>{c.terms}</td>
                  <td style={{ padding: '14px', fontSize: '13px', fontWeight: 700, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {formatINR(c.openingBalance)}
                  </td>
                  <td style={{ padding: '14px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDeleteClient(c.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                      title="Delete Client"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 3: VENDORS & CREDITORS ─────────────────────────────────────── */}
      {activeTab === 'vendors' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Vendors &amp; Service Providers</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '4px 0 0 0' }}>
                Accounts Payable suppliers with statutory TDS withholding classifications.
              </p>
            </div>
            <button
              onClick={() => setIsVendorModalOpen(true)}
              style={{
                background: '#06402b', color: 'white', border: 'none',
                padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Plus size={16} />
              <span>Add New Vendor</span>
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-surface)' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Vendor Name</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Category</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>TDS Section</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Payable Balance</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px', fontSize: '13px', fontWeight: 600 }}>
                    <div>{v.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 400 }}>PAN: {v.pan || '—'}</div>
                  </td>
                  <td style={{ padding: '14px', fontSize: '12px' }}>{v.category}</td>
                  <td style={{ padding: '14px', fontSize: '12px' }}>
                    <span style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      Sec {v.tdsSection} ({v.rate}%)
                    </span>
                  </td>
                  <td style={{ padding: '14px', fontSize: '13px', fontWeight: 700, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {formatINR(v.openingBalance)}
                  </td>
                  <td style={{ padding: '14px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDeleteVendor(v.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                      title="Delete Vendor"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 4: IMPORT EXISTING LEDGERS ─────────────────────────────────── */}
      {activeTab === 'import' && (
        <div className="card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Import Existing Ledgers &amp; Trial Balance</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '4px 0 0 0' }}>
                Upload your existing opening balances from Tally, QuickBooks, Zoho Books, or Excel via CSV.
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="settings-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
            >
              <Download size={15} />
              <span>Download CSV Template</span>
            </button>
          </div>

          {/* Upload Drop Zone */}
          <div style={{
            border: '2px dashed var(--border)',
            borderRadius: '12px',
            padding: '36px',
            textAlign: 'center',
            background: 'var(--bg-surface)',
            marginBottom: '24px'
          }}>
            <FileSpreadsheet size={36} color="#10b981" style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
              Select a CSV file containing your Chart of Accounts &amp; Opening Balances
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Columns: <code>Account Name, Type, Debit, Credit, Narration</code>
            </div>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              id="ledger-file-input"
              style={{ display: 'none' }}
            />
            <label
              htmlFor="ledger-file-input"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                background: '#06402b',
                color: 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              <Upload size={16} />
              <span>Choose CSV File to Upload</span>
            </label>
          </div>

          {/* Verification & Preview */}
          {importStats && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                borderRadius: '10px',
                background: importStats.isBalanced ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${importStats.isBalanced ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {importStats.isBalanced ? (
                    <CheckCircle2 size={22} color="#10b981" />
                  ) : (
                    <AlertCircle size={22} color="#ef4444" />
                  )}
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: importStats.isBalanced ? '#059669' : '#dc2626' }}>
                      {importStats.isBalanced ? 'Double-Entry Balanced: Ready to Post' : 'Trial Balance Out of Equilibrium'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Total Debits: {formatINR(importStats.totalDebit)} | Total Credits: {formatINR(importStats.totalCredit)} 
                      {!importStats.isBalanced && ` (Difference: ${formatINR(importStats.difference)})`}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleExecuteImport}
                  disabled={!importStats.isBalanced}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: importStats.isBalanced ? '#06402b' : 'var(--text-muted)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: importStats.isBalanced ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Check size={16} />
                  <span>Import &amp; Post to Books</span>
                </button>
              </div>

              {importSuccess && (
                <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.15)', color: '#059669', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, fontSize: '13px' }}>
                  ✓ Successfully posted opening balances to General Ledger! All statements updated.
                </div>
              )}

              {/* Table Preview */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface)', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Account Name</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Classification</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Debit (Dr)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Credit (Cr)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Narration</th>
                  </tr>
                </thead>
                <tbody>
                  {importRows.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.accountName}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{r.accountType}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {r.debit > 0 ? formatINR(r.debit) : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {r.credit > 0 ? formatINR(r.credit) : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '12px' }}>{r.narration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Client Modal */}
      {isClientModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <form onSubmit={handleAddClient} className="card" style={{ width: '100%', maxWidth: '480px', padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0' }}>Add Corporate Client</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Client Name *</label>
                <input
                  type="text"
                  value={newClient.name}
                  onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="e.g. Tata Consultancy Systems"
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>GSTIN</label>
                <input
                  type="text"
                  value={newClient.gstin}
                  onChange={e => setNewClient({ ...newClient, gstin: e.target.value.toUpperCase() })}
                  placeholder="27AABCU9603R1ZM"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Payment Terms</label>
                  <select
                    value={newClient.terms}
                    onChange={e => setNewClient({ ...newClient, terms: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  >
                    <option>Due on Receipt</option>
                    <option>15 Days</option>
                    <option>30 Days</option>
                    <option>45 Days</option>
                    <option>60 Days</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Opening Balance</label>
                  <input
                    type="number"
                    value={newClient.openingBalance}
                    onChange={e => setNewClient({ ...newClient, openingBalance: e.target.value })}
                    placeholder="0"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => setIsClientModalOpen(false)} className="settings-btn">Cancel</button>
              <button type="submit" className="btn-primary" style={{ background: '#06402b', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 600 }}>
                Save Client
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vendor Modal */}
      {isVendorModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <form onSubmit={handleAddVendor} className="card" style={{ width: '100%', maxWidth: '480px', padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0' }}>Add Vendor &amp; Supplier</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Vendor / Supplier Name *</label>
                <input
                  type="text"
                  value={newVendor.name}
                  onChange={e => setNewVendor({ ...newVendor, name: e.target.value })}
                  placeholder="e.g. Amazon Web Services"
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Category</label>
                  <select
                    value={newVendor.category}
                    onChange={e => setNewVendor({ ...newVendor, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  >
                    <option>Cloud Infrastructure</option>
                    <option>Legal Counsel</option>
                    <option>Works Contract & Freight</option>
                    <option>Office Rent</option>
                    <option>Audit & Accounting</option>
                    <option>Contract Labour</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>TDS Section</label>
                  <select
                    value={newVendor.tdsSection}
                    onChange={e => {
                      const sec = e.target.value;
                      const rate = sec === '194J(a)' ? 10.0 : sec === '194J(b)' ? 2.0 : sec === '194C' ? 2.0 : sec === '194I(b)' ? 10.0 : 2.0;
                      setNewVendor({ ...newVendor, tdsSection: sec, rate });
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  >
                    <option value="194J(b)">194J(b) - Technical (2%)</option>
                    <option value="194J(a)">194J(a) - Professional (10%)</option>
                    <option value="194C">194C - Contractor (2%)</option>
                    <option value="194I(b)">194I(b) - Rent Land/Bldg (10%)</option>
                    <option value="194H">194H - Brokerage (5%)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>PAN Number</label>
                  <input
                    type="text"
                    value={newVendor.pan}
                    onChange={e => setNewVendor({ ...newVendor, pan: e.target.value.toUpperCase() })}
                    placeholder="AAACA1234E"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Opening Payable</label>
                  <input
                    type="number"
                    value={newVendor.openingBalance}
                    onChange={e => setNewVendor({ ...newVendor, openingBalance: e.target.value })}
                    placeholder="0"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => setIsVendorModalOpen(false)} className="settings-btn">Cancel</button>
              <button type="submit" className="btn-primary" style={{ background: '#06402b', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 600 }}>
                Save Vendor
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default BusinessHub;
