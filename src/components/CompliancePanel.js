import { Shield, AlertCircle, CheckCircle, Info, X, Upload, FileText, Download, Play, Search, MessageSquare, Sparkles, Settings, Send, User } from 'lucide-react';
import { AccountingStandardsDB, ASValidationEngine, COMPLIANCE_MODES } from '../utils/ASComplianceEngine';
import { LedgerEngine } from '../utils/LedgerEngine';
import { supabase } from '../supabaseClient';
import React, { useState, useEffect, useRef } from 'react';

function CompliancePanel({ isOpen, onClose, onRefresh }) {
  const [findings, setFindings] = useState([]);
  const [activeTab, setActiveTab] = useState('Audit'); // Audit or Assistant
  const [complianceMode, setComplianceMode] = useState(() => localStorage.getItem('ledgerai_compliance_mode') || COMPLIANCE_MODES.AS_SME);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your Senior CA Advisor. How can I help you with Indian accounting standards or tax compliance today?', tag: 'Advisor' }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    "What is the GST rate on textile fabric?",
    "How to account for depreciation under Companies Act 2013?",
    "What is the due date for filing GSTR-3B?",
    "How to record a journal entry for salary payable?",
    "What are the Ind AS provisions for revenue recognition?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen]);

  const loadData = () => {
    const savedFindings = localStorage.getItem('ledgerai-compliance-log');
    if (savedFindings) setFindings(JSON.parse(savedFindings));
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
    runValidation();
  };

  const handleAIQuery = async (text) => {
    const question = text || query;
    if (!question.trim()) return;

    const newMessages = [...messages, { role: 'user', content: question }];
    setMessages(newMessages);
    setQuery('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/compliance/ask`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ question })
      });

      const data = await response.json();
      
      // Extract standard tag (e.g., "Standard: Ind AS 115")
      let tag = 'Compliance';
      const tagMatch = data.answer.match(/Standard: ([^.]+)/);
      if (tagMatch) tag = tagMatch[1];

      setMessages([...newMessages, { role: 'assistant', content: data.answer, tag }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error connecting to the compliance engine.', tag: 'Error' }]);
    } finally {
      setLoading(false);
    }
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

  if (!isOpen) return null;

  const stats = {
    errors: findings.filter(f => f.severity === 'ERROR' && f.status === 'Unresolved').length,
    warnings: findings.filter(f => f.severity === 'WARNING' && f.status === 'Unresolved').length
  };

  return (
    <div className="compliance-sidepanel">
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Shield size={24} style={{ color: stats.errors > 0 ? 'var(--accent-red)' : 'var(--accent-gold)' }} />
          <div>
            <h2 className="heading-serif" style={{ fontSize: 20, color: '#fff' }}>Compliance Center</h2>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>LedgerAI AI-Powered Auditing</p>
          </div>
        </div>
        <button className="btn-close" onClick={onClose}><X size={20}/></button>
      </div>

      <div className="panel-tabs">
        <button className={`panel-tab ${activeTab === 'Audit' ? 'active' : ''}`} onClick={() => setActiveTab('Audit')}>
          Audit Reports
        </button>
        <button className={`panel-tab ${activeTab === 'Assistant' ? 'active' : ''}`} onClick={() => setActiveTab('Assistant')}>
          AI Assistant
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'Audit' ? (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {Object.values(COMPLIANCE_MODES).map(mode => (
                  <button 
                    key={mode} 
                    className={`mode-btn ${complianceMode === mode ? 'active' : ''}`}
                    onClick={() => handleModeChange(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="findings-list">
              {findings.filter(f => f.status === 'Unresolved').map((f, i) => (
                <div key={i} className="finding-card" style={{ borderLeft: `4px solid ${f.severity === 'ERROR' ? 'var(--accent-red)' : 'var(--accent-gold)'}` }}>
                  <div className="finding-header">
                    <span className="finding-id">{f.id}</span>
                    <span className={`finding-severity ${f.severity.toLowerCase()}`}>{f.severity}</span>
                  </div>
                  <p className="finding-msg">{f.message}</p>
                  <div className="finding-suggestion">
                    <strong>Fix:</strong> {f.suggestion}
                  </div>
                  <div className="finding-footer">
                    <span className="finding-std">{f.standard}</span>
                    <button onClick={() => toggleResolved(f.id, f.txId)} className="btn-dismiss">Dismiss</button>
                  </div>
                </div>
              ))}
              {findings.filter(f => f.status === 'Unresolved').length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>
                  <CheckCircle size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                  <p>All clear! No pending compliance issues.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="chat-container">
            <div className="chat-history">
              {messages.map((m, i) => (
                <div key={i} className={`chat-bubble ${m.role}`}>
                  <div className="bubble-content">{m.content}</div>
                  {m.tag && <div className="bubble-tag">{m.tag}</div>}
                </div>
              ))}
              {loading && (
                <div className="chat-bubble assistant">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-footer">
              <div className="suggested-chips">
                {suggestedQuestions.map((q, i) => (
                  <button key={i} className="suggestion-chip" onClick={() => handleAIQuery(q)}>
                    {q}
                  </button>
                ))}
              </div>
              <div className="chat-input-wrap">
                <input 
                  type="text" 
                  className="chat-input"
                  placeholder="Ask your CA advisor..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAIQuery()}
                />
                <button className="btn-send" onClick={() => handleAIQuery()} disabled={loading}>
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .compliance-sidepanel { position: fixed; top: 0; right: 0; width: 480px; height: 100vh; background: #0B1426; z-index: 2000; display: flex; flex-direction: column; animation: slideIn 0.3s ease-out; box-shadow: -20px 0 50px rgba(0,0,0,0.5); }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .panel-header { padding: 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .btn-close { background: transparent; border: none; color: rgba(255,255,255,0.5); cursor: pointer; }
        .panel-content { padding: 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; }
        .panel-tabs { display: flex; padding: 0 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .panel-tab { flex: 1; padding: 16px; border: none; background: transparent; color: rgba(255,255,255,0.4); font-size: 13px; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; }
        .panel-tab.active { color: var(--accent-gold); border-bottom-color: var(--accent-gold); }
        
        .mode-btn { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #fff; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .mode-btn.active { background: var(--accent-gold); color: #0B1426; border-color: var(--accent-gold); }
        
        .finding-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; marginBottom: 16px; }
        .finding-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .finding-id { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.4); }
        .finding-severity { font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
        .finding-severity.error { background: var(--accent-red); color: #fff; }
        .finding-severity.warning { background: var(--accent-gold); color: #0B1426; }
        .finding-msg { font-size: 13px; color: #fff; line-height: 1.5; margin-bottom: 12px; }
        .finding-suggestion { background: rgba(0,0,0,0.2); padding: 12px; border-radius: 6px; font-size: 12px; color: rgba(255,255,255,0.7); border: 1px dashed rgba(255,255,255,0.1); }
        .finding-footer { margin-top: 12px; display: flex; justify-content: space-between; align-items: center; }
        .finding-std { font-size: 11px; color: rgba(255,255,255,0.3); }
        .btn-dismiss { background: transparent; border: none; color: var(--accent-gold); font-weight: 700; font-size: 11px; cursor: pointer; }

        .chat-container { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .chat-history { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; padding-bottom: 20px; padding-right: 4px; }
        .chat-bubble { max-width: 85%; padding: 12px 16px; border-radius: 14px; font-size: 13px; line-height: 1.5; position: relative; }
        .chat-bubble.user { align-self: flex-end; background: var(--accent-navy); color: #fff; border-bottom-right-radius: 2px; border: 1px solid rgba(255,255,255,0.1); }
        .chat-bubble.assistant { align-self: flex-start; background: rgba(255,255,255,0.05); color: #fff; border-bottom-left-radius: 2px; border: 1px solid rgba(255,255,255,0.1); }
        .bubble-tag { font-size: 9px; font-weight: 800; text-transform: uppercase; margin-top: 6px; opacity: 0.6; color: var(--accent-gold); }
        
        .chat-footer { padding-top: 16px; background: #0B1426; border-top: 1px solid rgba(255,255,255,0.05); }
        .suggested-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .suggestion-chip { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); padding: 6px 12px; border-radius: 16px; font-size: 11px; cursor: pointer; transition: all 0.2s; }
        .suggestion-chip:hover { background: rgba(255,255,255,0.1); color: #fff; }
        
        .chat-input-wrap { display: flex; gap: 10px; background: rgba(255,255,255,0.05); border-radius: 12px; padding: 8px 12px; border: 1px solid rgba(255,255,255,0.1); }
        .chat-input { flex: 1; background: transparent; border: none; color: #fff; font-size: 14px; outline: none; }
        .btn-send { background: var(--accent-gold); color: #0B1426; border: none; padding: 8px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .btn-send:disabled { opacity: 0.5; cursor: not-allowed; }

        .typing-indicator { display: flex; gap: 4px; padding: 4px 0; }
        .typing-indicator span { width: 6px; height: 6px; background: rgba(255,255,255,0.4); border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1.0); } }
      `}</style>
    </div>
  );
}

export default CompliancePanel;
