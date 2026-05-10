import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, CheckCircle, Info, X, Upload, FileText, Download, Play, Search, MessageSquare } from 'lucide-react';
import { AccountingStandardsDB, ASValidationEngine } from '../utils/ASComplianceEngine';
import { LedgerEngine } from '../utils/LedgerEngine';

function CompliancePanel({ isOpen, onClose, onRefresh }) {
  const [findings, setFindings] = useState([]);
  const [asDb, setAsDb] = useState(null);
  const [activeTab, setActiveTab] = useState('Active');
  const [filterSeverity, setFilterSeverity] = useState('All');
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
    
    const newFindings = ASValidationEngine.runFullValidation(txs, is, cf, bs);
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
    link.setAttribute("download", "AS_Compliance_Report.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleAIQuery = async () => {
    if (!query || !asDb) return;
    setLoading(true);
    setAiResponse('Thinking...');
    
    // In a real app, this would call the Claude API with the context
    // For this demo, we simulate the Senior CA response
    setTimeout(() => {
      setAiResponse(`Based on AS 9 (Revenue Recognition) and the provided text:
      
Advance payments from customers should NOT be recognized as revenue. According to AS 9, paragraph 6, revenue should only be recognized when significant risks and rewards of ownership have been transferred. 

Rule Cite: AS9-R003
Suggestion: Credit "Advance from Customers" liability account instead of Sales Revenue.`);
      setLoading(false);
    }, 1500);
  };

  if (!isOpen) return null;

  const filteredFindings = findings.filter(f => {
    if (activeTab === 'Active' && f.status === 'Resolved') return false;
    if (activeTab === 'Reviewed' && f.status === 'Unresolved') return false;
    if (filterSeverity !== 'All' && f.severity !== filterSeverity) return false;
    return true;
  });

  const stats = {
    errors: findings.filter(f => f.severity === 'ERROR' && f.status === 'Unresolved').length,
    warnings: findings.filter(f => f.severity === 'WARNING' && f.status === 'Unresolved').length,
    info: findings.filter(f => f.severity === 'INFO' && f.status === 'Unresolved').length
  };

  return (
    <div className="compliance-sidepanel">
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Shield size={24} style={{ color: stats.errors > 0 ? '#ef4444' : '#10b981' }} />
          <div>
            <h2 style={{ fontSize: 18, color: '#fff' }}>AS Compliance Report</h2>
            <p style={{ fontSize: 11, color: '#94a3b8' }}>{asDb ? `Standards DB v${asDb.version} | Updated ${new Date(asDb.lastUpdated).toLocaleDateString()}` : 'No Standards DB Loaded'}</p>
          </div>
        </div>
        <button className="btn-close" onClick={onClose}><X size={20}/></button>
      </div>

      <div className="panel-content">
        <div className="compliance-summary">
          <div className="stat-box error"><span>{stats.errors}</span><label>Errors</label></div>
          <div className="stat-box warning"><span>{stats.warnings}</span><label>Warnings</label></div>
          <div className="stat-box info"><span>{stats.info}</span><label>Notices</label></div>
        </div>

        <div className="action-row" style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <button className="pill primary" style={{ flex: 1 }} onClick={runValidation}><Play size={14}/> Run Validation</button>
          <button className="pill" style={{ background: '#1e293b' }} onClick={exportReport}><Download size={14}/> Export CSV</button>
        </div>

        {!asDb && (
          <div className="upload-notice">
            <Upload size={32} />
            <h4>Upload OCR Standards</h4>
            <p>Upload the AS 1-32 OCR document to enable context-aware validation.</p>
            <input type="file" id="as-upload" hidden onChange={handleFileUpload} />
            <label htmlFor="as-upload" className="pill primary" style={{ marginTop: 12, cursor: 'pointer' }}>Select File</label>
          </div>
        )}

        <div className="pill-nav" style={{ marginBottom: 20 }}>
          {['Active', 'Reviewed'].map(t => (
            <button key={t} className={`pill-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>

        <div className="findings-list">
          {filteredFindings.map((f, i) => (
            <div key={i} className={`finding-card ${f.severity.toLowerCase()}`}>
              <div className="finding-header">
                <span className="finding-id">{f.id}</span>
                <span className={`severity-badge ${f.severity.toLowerCase()}`}>{f.severity}</span>
              </div>
              <p className="finding-message">{f.message}</p>
              <div className="finding-suggestion">
                <strong>Fix:</strong> {f.suggestion}
              </div>
              <div className="finding-footer">
                <span>{f.standard}</span>
                <button onClick={() => toggleResolved(f.id, f.txId)}>{f.status === 'Resolved' ? 'Reopen' : 'Mark Reviewed'}</button>
              </div>
            </div>
          ))}
        </div>

        <div className="ai-query-section" style={{ marginTop: 40, paddingTop: 30, borderTop: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Sparkles size={18} style={{ color: '#3b82f6' }} />
            <h3 style={{ fontSize: 16, color: '#fff' }}>AS Assistant (Senior CA)</h3>
          </div>
          <div className="query-box">
            <textarea 
              placeholder="Ask about AS compliance (e.g., 'How to handle GST input tax?')" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button onClick={handleAIQuery} disabled={loading}><MessageSquare size={16}/></button>
          </div>
          {aiResponse && (
            <div className="ai-response">
              <p>{aiResponse}</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .compliance-sidepanel { position: fixed; top: 0; right: 0; width: 450px; height: 100vh; background: #0f172a; border-left: 1px solid #334155; z-index: 2000; display: flex; flex-direction: column; animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .panel-header { padding: 24px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; }
        .btn-close { background: transparent; border: none; color: #94a3b8; cursor: pointer; }
        .panel-content { padding: 24px; overflow-y: auto; flex: 1; }
        .compliance-summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
        .stat-box { padding: 16px; border-radius: 12px; text-align: center; display: flex; flex-direction: column; gap: 4px; }
        .stat-box.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
        .stat-box.warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
        .stat-box.info { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); }
        .stat-box span { font-size: 24px; font-weight: 800; }
        .stat-box label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
        .finding-card { background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 16px; margin-bottom: 16px; border-left: 4px solid #334155; }
        .finding-card.error { border-left-color: #ef4444; }
        .finding-card.warning { border-left-color: #f59e0b; }
        .finding-card.info { border-left-color: #3b82f6; }
        .finding-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .finding-id { font-size: 11px; font-weight: 700; color: #94a3b8; }
        .severity-badge { font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 800; }
        .severity-badge.error { background: #ef4444; color: #fff; }
        .severity-badge.warning { background: #f59e0b; color: #fff; }
        .severity-badge.info { background: #3b82f6; color: #fff; }
        .finding-message { font-size: 13px; color: #fff; line-height: 1.5; margin-bottom: 12px; }
        .finding-suggestion { background: rgba(255,255,255,0.02); padding: 10px; border-radius: 6px; font-size: 12px; color: #cbd5e1; border: 1px dashed #334155; }
        .finding-footer { margin-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #94a3b8; }
        .finding-footer button { background: transparent; border: none; color: #3b82f6; font-weight: 700; cursor: pointer; }
        .upload-notice { text-align: center; padding: 40px 20px; background: rgba(59, 130, 246, 0.05); border: 2px dashed #334155; border-radius: 16px; margin-bottom: 24px; color: #94a3b8; }
        .query-box { position: relative; }
        .query-box textarea { width: 100%; height: 100px; background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 12px; color: #fff; font-size: 13px; outline: none; }
        .query-box button { position: absolute; bottom: 12px; right: 12px; background: #3b82f6; color: #fff; border: none; padding: 8px; border-radius: 8px; cursor: pointer; }
        .ai-response { margin-top: 16px; background: rgba(59, 130, 246, 0.1); padding: 16px; border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.2); font-size: 13px; color: #cbd5e1; line-height: 1.6; }
      `}</style>
    </div>
  );
}

export default CompliancePanel;
