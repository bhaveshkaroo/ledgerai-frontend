import { Shield, AlertCircle, CheckCircle, Info, X, Upload, FileText, Download, Play, Search, MessageSquare, Sparkles, Settings } from 'lucide-react';
import { AccountingStandardsDB, ASValidationEngine, COMPLIANCE_MODES } from '../utils/ASComplianceEngine';
import { LedgerEngine } from '../utils/LedgerEngine';
import React, { useState, useEffect } from 'react';

function CompliancePanel({ isOpen, onClose, onRefresh }) {
  const [findings, setFindings] = useState([]);
  const [asDb, setAsDb] = useState(null);
  const [activeTab, setActiveTab] = useState('Active');
  const [complianceMode, setComplianceMode] = useState(() => localStorage.getItem('ledgerai_compliance_mode') || COMPLIANCE_MODES.AS_SME);
  const [query, setQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [isOpen]);

  const loadData = () => {
    const savedFindings = localStorage.getItem('ledgerai-compliance-log');
    if (savedFindings) setFindings(JSON.parse(savedFindings));
    setAsDb(AccountingStandardsDB.load());
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const text = await file.text();
    const db = await AccountingStandardsDB.parseOCR(text);
    setAsDb(db);
    runValidation();
    setLoading(false);
  };

  const runValidation = () => {
    const txs = LedgerEngine.transactions;
    const is = LedgerEngine.calcIncomeStatement('Full Year');
    const cf = LedgerEngine.calcCashFlow('Full Year');
    const bs = LedgerEngine.calcBalanceSheet('Full Year');
    
    const newFindings = ASValidationEngine.runFullValidation(txs, is, cf, bs, complianceMode);
    setFindings(newFindings);
    if (onRefresh) onRefresh();
  };

  const handleModeChange = (newMode) => {
    setComplianceMode(newMode);
    localStorage.setItem('ledgerai_compliance_mode', newMode);
    const txs = LedgerEngine.transactions;
    const is = LedgerEngine.calcIncomeStatement('Full Year');
    const cf = LedgerEngine.calcCashFlow('Full Year');
    const bs = LedgerEngine.calcBalanceSheet('Full Year');
    const newFindings = ASValidationEngine.runFullValidation(txs, is, cf, bs, newMode);
    setFindings(newFindings);
    if (onRefresh) onRefresh();
  };

  const toggleResolved = (id, txId) => {
    const updated = findings.map(f => {
      if (f.id === id && f.txId === txId) {
        return { ...f, status: f.status === 'Resolved' ? 'Unresolved' : 'Resolved' };
      }
      return f;
    });
    setFindings(updated);
    localStorage.setItem('ledgerai-compliance-log', JSON.stringify(updated));
    if (onRefresh) onRefresh();
  };

  const exportReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Standard,Rule,Severity,Message,Suggestion\n"
      + findings.map(f => `${f.standard},${f.id},${f.severity},"${f.message}","${f.suggestion}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AS_Compliance_Report_${complianceMode}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const handleAIQuery = async () => {
    if (!query) return;
    setLoading(true);
    setAiResponse('Consulting Accounting Standards DB...');
    
    setTimeout(() => {
      const response = AccountingStandardsDB.query(query, asDb, complianceMode);
      setAiResponse(response);
      setLoading(false);
    }, 800);
  };

  if (!isOpen) return null;

  const filteredFindings = findings.filter(f => {
    if (activeTab === 'Active' && f.status === 'Resolved') return false;
    if (activeTab === 'Reviewed' && f.status === 'Unresolved') return false;
    return true;
  });

  const stats = {
    errors: findings.filter(f => f.severity === 'ERROR' && f.status === 'Unresolved').length,
    warnings: findings.filter(f => f.severity === 'WARNING' && f.status === 'Unresolved').length,
    info: findings.filter(f => f.severity === 'INFO' && f.status === 'Unresolved').length
  };

  return (
    <div className="compliance-sidepanel">
      <div className="panel-header" style={{ background: 'var(--bg-sidebar)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Shield size={24} style={{ color: stats.errors > 0 ? 'var(--accent-red)' : 'var(--accent-teal)' }} />
          <div>
            <h2 className="heading-serif" style={{ fontSize: 20, color: '#fff' }}>Compliance Audit</h2>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}> Sharma Textiles Pvt Ltd</p>
          </div>
        </div>
        <button className="btn-close" onClick={onClose}><X size={20}/></button>
      </div>

      <div className="panel-content" style={{ background: 'var(--bg-sidebar)' }}>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'block' }}>Compliance Framework</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.values(COMPLIANCE_MODES).map(mode => (
              <button 
                key={mode} 
                className={`mode-btn ${complianceMode === mode ? 'active' : ''}`}
                onClick={() => handleModeChange(mode)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                  background: complianceMode === mode ? 'var(--accent-gold)' : 'transparent',
                  color: complianceMode === mode ? 'var(--bg-sidebar)' : '#fff',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="compliance-summary" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div className="stat-box" style={{ background: 'rgba(239, 68, 68, 0.1)', padding: 16, borderRadius: 12, textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-red)' }}>{stats.errors}</span>
            <label style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--accent-red)', fontWeight: 700, display: 'block', marginTop: 4 }}>Errors</label>
          </div>
          <div className="stat-box" style={{ background: 'rgba(201, 168, 76, 0.1)', padding: 16, borderRadius: 12, textAlign: 'center', border: '1px solid rgba(201, 168, 76, 0.2)' }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-gold)' }}>{stats.warnings}</span>
            <label style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--accent-gold)', fontWeight: 700, display: 'block', marginTop: 4 }}>Warnings</label>
          </div>
          <div className="stat-box" style={{ background: 'rgba(20, 184, 166, 0.1)', padding: 16, borderRadius: 12, textAlign: 'center', border: '1px solid rgba(20, 184, 166, 0.2)' }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-teal)' }}>{stats.info}</span>
            <label style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--accent-teal)', fontWeight: 700, display: 'block', marginTop: 4 }}>Notices</label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button 
            onClick={runValidation}
            style={{ 
              flex: 1, padding: '12px', borderRadius: 8, background: '#fff', color: 'var(--bg-sidebar)',
              border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            <Play size={16} fill="currentColor" /> Run Audit Engine
          </button>
          <button 
            onClick={exportReport}
            style={{ 
              padding: '12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer'
            }}
          >
            <Download size={18} />
          </button>
        </div>

        <div className="pill-nav" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['Active', 'Reviewed'].map(t => (
            <button 
              key={t} 
              onClick={() => setActiveTab(t)}
              style={{
                flex: 1, padding: '8px', borderRadius: 20, border: 'none',
                background: activeTab === t ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeTab === t ? '#fff' : 'rgba(255,255,255,0.4)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer'
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="findings-list">
          {filteredFindings.map((f, i) => (
            <div key={i} style={{ 
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 12, padding: 16, marginBottom: 16, borderLeft: `4px solid ${f.severity === 'ERROR' ? 'var(--accent-red)' : (f.severity === 'WARNING' ? 'var(--accent-gold)' : 'var(--accent-teal)')}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{f.id}</span>
                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: f.severity === 'ERROR' ? 'var(--accent-red)' : 'rgba(255,255,255,0.1)', color: '#fff' }}>{f.severity}</span>
              </div>
              <p style={{ fontSize: 13, color: '#fff', lineHeight: 1.5, marginBottom: 12 }}>{f.message}</p>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 6, fontSize: 12, color: 'rgba(255,255,255,0.7)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <strong>Recommendation:</strong> {f.suggestion}
              </div>
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{f.standard}</span>
                <button 
                  onClick={() => toggleResolved(f.id, f.txId)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-gold)', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                >
                  {f.status === 'Resolved' ? 'Reopen' : 'Dismiss'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40, paddingTop: 30, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Sparkles size={18} color="var(--accent-gold)" />
            <h3 className="heading-serif" style={{ fontSize: 18, color: '#fff' }}>AS Assistant (Senior CA)</h3>
          </div>
          <div style={{ position: 'relative' }}>
            <textarea 
              placeholder="Ask about Ind AS requirements, tax implications..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: '100%', height: 100, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 13, outline: 'none' }}
            />
            <button 
              onClick={handleAIQuery} 
              disabled={loading}
              style={{ position: 'absolute', bottom: 12, right: 12, background: 'var(--accent-gold)', color: 'var(--bg-sidebar)', border: 'none', padding: 8, borderRadius: 8, cursor: 'pointer' }}
            >
              <MessageSquare size={16} />
            </button>
          </div>
          {aiResponse && (
            <div style={{ marginTop: 16, background: 'rgba(201, 168, 76, 0.1)', padding: 16, borderRadius: 12, border: '1px solid rgba(201, 168, 76, 0.2)', fontSize: 13, color: '#fff', lineHeight: 1.6 }}>
              {aiResponse}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .compliance-sidepanel { position: fixed; top: 0; right: 0; width: 450px; height: 100vh; background: var(--bg-sidebar); z-index: 2000; display: flex; flex-direction: column; animation: slideIn 0.3s ease-out; box-shadow: -20px 0 50px rgba(0,0,0,0.5); }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .panel-header { padding: 24px; display: flex; justify-content: space-between; align-items: center; }
        .btn-close { background: transparent; border: none; color: rgba(255,255,255,0.5); cursor: pointer; }
        .panel-content { padding: 24px; overflow-y: auto; flex: 1; }
      `}</style>
    </div>
  );
}

export default CompliancePanel;
