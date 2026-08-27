import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';

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
    const totalEq = bs.find(r => r.name === 'TOTAL EQUITY & LIABILITIES')?.value || 0;
    const totalAssets = bs.find(r => r.name === 'TOTAL ASSETS')?.value || 0;
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

  const handleMockResponse = (userMsg) => {
    const msg = userMsg.toLowerCase();
    const kpis = LedgerEngine.calcKPIs();

    if (msg.includes('cash') && (msg.includes('drop') || msg.includes('decrease') || msg.includes('low'))) {
      return `Your current cash balance is ${formatINR(kpis.cashBalance)}. The main cash outflows are:\n• Monthly rent: ₹40,000/month\n• Salaries: ₹1,20,000/month\n• Supplier payments (85% of purchases)\n• Loan interest: ₹15,000/month\n\nCash collections from customers cover only 90% of sales (10% remains as receivables). Consider tightening collection cycles.`;
    }
    if (msg.includes('profit') || msg.includes('loss') || msg.includes('revenue')) {
      return `Your P&L summary:\n• Total Revenue: ${formatINR(kpis.totalRevenue)}\n• Total Expenses: ${formatINR(kpis.totalExpenses)}\n• Net Profit: ${formatINR(kpis.netProfit)}\n\nThe largest expense category is Cost of Goods Sold (40% of revenue), followed by salaries.`;
    }
    if (msg.includes('anomal') || msg.includes('flag') || msg.includes('issue')) {
      const findings = getAuditFindings();
      const issues = findings.filter(f => f.severity !== 'ok');
      if (issues.length === 0) return 'No anomalies detected. All entries are balanced and compliant.';
      return `I found ${issues.length} issue(s):\n${issues.map(f => `• [${f.severity.toUpperCase()}] ${f.title}: ${f.detail}`).join('\n')}`;
    }
    if (msg.includes('correct') || msg.includes('fix') || msg.includes('journal entry')) {
      return "I can suggest a corrective journal entry. Please describe the issue (e.g., 'reverse the duplicate salary entry for March') and I'll prepare the entry for your confirmation.";
    }
    return `I analyzed your ledger. Here's a quick summary:\n• Revenue: ${formatINR(kpis.totalRevenue)}\n• Cash: ${formatINR(kpis.cashBalance)}\n• Net Profit: ${formatINR(kpis.netProfit)}\n\nAsk me about specific anomalies, cash flow trends, or compliance issues.`;
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = handleMockResponse(userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
      setIsTyping(false);
    }, 800);
  };

  const findings = getAuditFindings();

  return (
    <div className={`chat-drawer ${isOpen ? 'open' : ''}`}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bot size={20} />
          <span style={{ fontWeight: 600, fontSize: '15px' }}>AI Audit Assistant</span>
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
              <div className="chat-bubble bot" style={{ opacity: 0.6 }}>Analyzing...</div>
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
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border)', fontSize: '13px', outline: 'none',
                background: 'var(--bg-surface)'
              }}
            />
            <button onClick={handleSend} className="btn-primary" style={{ padding: '10px 14px', borderRadius: 'var(--radius-pill)' }}>
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
