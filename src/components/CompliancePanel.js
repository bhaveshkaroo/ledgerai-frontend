import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';
import { InventoryEngine } from '../utils/InventoryEngine';
import { InvoiceEngine } from '../utils/InvoiceEngine';

const CompliancePanel = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hello! I'm your AI Audit Assistant. I can review your ledger entries, flag anomalies, answer questions about your statements, and suggest corrective journal entries. What would you like to know?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Static audit findings (unchanged, runs client-side) ---
  const getAuditFindings = () => {
    const txs = LedgerEngine.transactions;
    const findings = [];

    // Check for duplicate refs
    const refCounts = {};
    txs.forEach(t => {
      refCounts[t.ref] = (refCounts[t.ref] || 0) + 1;
    });
    Object.entries(refCounts).forEach(([ref, count]) => {
      if (count > 2) {
        findings.push({ severity: 'warning', title: 'Possible Duplicate', detail: `Reference ${ref} appears ${count} times (expected 2 for double-entry).` });
      }
    });

    // Check for missing narrations
    const missingNarration = txs.filter(t => !t.narration || t.narration.trim() === '');
    if (missingNarration.length > 0) {
      findings.push({ severity: 'error', title: 'Missing Narrations', detail: `${missingNarration.length} entries have no narration. AS 1 requires adequate disclosure.` });
    }

    // Check balance sheet integrity
    const bs = LedgerEngine.calcBalanceSheet();
    const totalEq = bs.find(r => r.name.toLowerCase().includes('total equity and liabilities'))?.value || 0;
    const totalAssets = bs.find(r => r.name.toLowerCase().includes('total assets'))?.value || 0;
    if (Math.abs(totalEq - totalAssets) > 1) {
      findings.push({ severity: 'error', title: 'Balance Sheet Imbalance', detail: `Assets (${formatINR(totalAssets)}) ≠ Equity+Liabilities (${formatINR(totalEq)}). Difference: ${formatINR(Math.abs(totalEq - totalAssets))}` });
    } else {
      findings.push({ severity: 'ok', title: 'Balance Sheet Balanced', detail: `Assets = Equity + Liabilities = ${formatINR(totalAssets)}` });
    }

    // Check trial balance
    let totalDebits = 0, totalCredits = 0;
    txs.forEach(t => {
      if (t.type === 'Debit') totalDebits += t.amount;
      else totalCredits += t.amount;
    });
    if (Math.abs(totalDebits - totalCredits) > 1) {
      findings.push({ severity: 'error', title: 'Trial Balance Mismatch', detail: `Debits (${formatINR(totalDebits)}) ≠ Credits (${formatINR(totalCredits)})` });
    } else {
      findings.push({ severity: 'ok', title: 'Trial Balance Verified', detail: `Total Debits = Total Credits = ${formatINR(totalDebits)}` });
    }

    return findings;
  };

  // --- Build financial context snapshot to send with every query ---
  const buildFinancialContext = () => {
    const kpis = LedgerEngine.calcKPIs();
    const bs = LedgerEngine.calcBalanceSheet();
    const totalEq = bs.find(r => r.name.toLowerCase().includes('total equity and liabilities'))?.value || 0;
    const totalAssets = bs.find(r => r.name.toLowerCase().includes('total assets'))?.value || 0;
    const txs = LedgerEngine.transactions;

    let totalDebits = 0, totalCredits = 0;
    txs.forEach(t => {
      if (t.type === 'Debit') totalDebits += t.amount;
      else totalCredits += t.amount;
    });

    // Recent 10 transactions as readable text
    const recent = [...txs].slice(-10).map(t =>
      `${t.date} | ${t.type} | ${t.account} | ₹${t.amount.toLocaleString('en-IN')} | ${t.narration || 'No narration'}`
    ).join('\n');

    // Inventory summary
    let inventoryValue = 0;
    try {
      const items = InventoryEngine.getItemSummary ? InventoryEngine.getItemSummary() : [];
      inventoryValue = items.reduce((s, i) => s + i.totalValue, 0);
    } catch (_) {}

    // Invoice count
    let invoiceCount = 0;
    try { invoiceCount = InvoiceEngine.invoices.length; } catch (_) {}

    return {
      cashBalance: kpis.cashBalance,
      totalRevenue: kpis.totalRevenue,
      totalExpenses: kpis.totalExpenses,
      netProfit: kpis.netProfit,
      accountsReceivable: kpis.accountsReceivable || 0,
      accountsPayable: kpis.accountsPayable || 0,
      totalAssets,
      totalEquityAndLiabilities: totalEq,
      bsBalanced: Math.abs(totalEq - totalAssets) <= 1,
      totalDebits,
      totalCredits,
      transactionCount: txs.length,
      inventoryValue,
      invoiceCount,
      recentTransactions: recent
    };
  };

  // --- Real Gemini API call via backend ---
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('http://localhost:8000/api/ai/audit-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMsg,
          financial_context: buildFinancialContext()
        })
      });

      if (!res.ok) {
        let errDetail = 'AI Audit Assistant unavailable — please try again.';
        try {
          const errJson = await res.json();
          if (errJson && errJson.detail) errDetail = errJson.detail;
        } catch (_) {}
        throw new Error(errDetail);
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.answer }]);

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `⚠️ ${err.message || 'AI Audit Assistant unavailable — please try again.'}`
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const findings = getAuditFindings();

  return (
    <div className={`chat-drawer ${isOpen ? 'open' : ''}`}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bot size={20} />
          <span style={{ fontWeight: 600, fontSize: '15px' }}>AI Audit Assistant</span>
          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: 600 }}>Live</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <X size={18} color="var(--text-muted)" />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {['chat', 'findings'].map(tab => (
          <div key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            borderBottom: activeTab === tab ? '2px solid var(--text-primary)' : '2px solid transparent',
            color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)'
          }}>
            {tab === 'chat' ? 'AI Advisor' : `Findings (${findings.length})`}
          </div>
        ))}
      </div>

      {activeTab === 'chat' ? (
        <>
          {/* Chat Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.role}`} style={{ whiteSpace: 'pre-line' }}>
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div className="chat-bubble bot" style={{ opacity: 0.6 }}>Analyzing your books...</div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your statements..."
              disabled={isTyping}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border)', fontSize: '13px', outline: 'none',
                background: 'var(--bg-surface)',
                opacity: isTyping ? 0.7 : 1
              }}
            />
            <button
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              className="btn-primary"
              style={{ padding: '10px 14px', borderRadius: 'var(--radius-pill)', opacity: isTyping || !input.trim() ? 0.5 : 1 }}
            >
              <Send size={16} />
            </button>
          </div>
        </>
      ) : (
        /* Findings Tab */
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {findings.map((f, i) => (
            <div key={i} style={{
              padding: '14px', marginBottom: '8px', borderRadius: 'var(--radius-md)',
              background: f.severity === 'error' ? 'rgba(239,68,68,0.06)' : f.severity === 'warning' ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)',
              border: `1px solid ${f.severity === 'error' ? 'rgba(239,68,68,0.15)' : f.severity === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                {f.severity === 'error' ? <AlertTriangle size={14} color="#ef4444" /> : f.severity === 'warning' ? <Info size={14} color="#f59e0b" /> : <CheckCircle2 size={14} color="#10b981" />}
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{f.title}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.detail}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompliancePanel;
