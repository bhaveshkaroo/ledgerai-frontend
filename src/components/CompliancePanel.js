import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, AlertTriangle, CheckCircle2, Info, Key, Check } from 'lucide-react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';
import { InventoryEngine } from '../utils/InventoryEngine';
import { InvoiceEngine } from '../utils/InvoiceEngine';

const getGeminiKey = () => localStorage.getItem('MESO_GEMINI_API_KEY') || process.env.REACT_APP_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-3.6-flash';

const SYSTEM_INSTRUCTION = `You are Meso AI Audit Assistant — an expert Indian Chartered Accountant and financial auditor embedded in an Indian MSME accounting platform called "Meso".

Your capabilities:
1. Ledger Review: Analyze ledger transactions for anomalies — duplicates, unusual amounts, missing narrations, or entries that look inconsistent with normal business operations.
2. AS Compliance: Check whether the books reflect proper treatment under Indian Accounting Standards (AS 1 disclosure, AS 2 inventory valuation, AS 3 cash flow, AS 9 revenue recognition, AS 10 fixed assets, AS 15 employee benefits, AS 22 deferred tax, AS 26 intangibles, AS 29 provisions).
3. Financial Q&A: Answer questions about the user's own financial statements — Balance Sheet, P&L, Cash Flow, Trial Balance, GST position — using the actual data provided in the context.
4. Corrective Entries: When asked, suggest corrective journal entries in proper double-entry format. Always present these as SUGGESTIONS requiring user confirmation — NEVER state that an entry has been posted or will be auto-posted.

Constraints:
- Always ground your answers in the actual financial data provided in the context. If the context doesn't contain enough information to answer, say so explicitly rather than guessing.
- If the user asks something outside your scope (weather, sports, general knowledge, coding, etc.), politely decline and redirect: "I'm your accounting audit assistant — I can help with ledger reviews, AS compliance checks, financial statement analysis, and corrective journal entries. How can I help with your books?"
- Use Indian accounting terminology and INR formatting.
- Be concise and professional. Use bullet points for lists.
- When suggesting corrective entries, format them clearly and always end with: "This is a suggestion — please review and confirm before posting."`;

const CompliancePanel = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hello! I'm your AI Audit Assistant. I can review your ledger entries, flag anomalies, answer questions about your statements, and suggest corrective journal entries. What would you like to know?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(!getGeminiKey());
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiKey());
  const [keySaved, setKeySaved] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Static audit findings (unchanged, runs client-side) ---
  const getAuditFindings = () => {
    const txs = LedgerEngine.transactions;
    const findings = [];

    const refCounts = {};
    txs.forEach(t => {
      refCounts[t.ref] = (refCounts[t.ref] || 0) + 1;
    });
    Object.entries(refCounts).forEach(([ref, count]) => {
      if (count > 2) {
        findings.push({ severity: 'warning', title: 'Possible Duplicate', detail: `Reference ${ref} appears ${count} times (expected 2 for double-entry).` });
      }
    });

    const missingNarration = txs.filter(t => !t.narration || t.narration.trim() === '');
    if (missingNarration.length > 0) {
      findings.push({ severity: 'error', title: 'Missing Narrations', detail: `${missingNarration.length} entries have no narration. AS 1 requires adequate disclosure.` });
    }

    const bs = LedgerEngine.calcBalanceSheet();
    const totalEq = bs.find(r => r.name.toLowerCase().includes('total equity and liabilities'))?.value || 0;
    const totalAssets = bs.find(r => r.name.toLowerCase().includes('total assets'))?.value || 0;
    if (Math.abs(totalEq - totalAssets) > 1) {
      findings.push({ severity: 'error', title: 'Balance Sheet Imbalance', detail: `Assets (${formatINR(totalAssets)}) ≠ Equity+Liabilities (${formatINR(totalEq)}). Difference: ${formatINR(Math.abs(totalEq - totalAssets))}` });
    } else {
      findings.push({ severity: 'ok', title: 'Balance Sheet Balanced', detail: `Assets = Equity + Liabilities = ${formatINR(totalAssets)}` });
    }

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

  // --- Build financial context snapshot ---
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

    const recent = [...txs].slice(-10).map(t =>
      `${t.date} | ${t.type} | ${t.account} | Rs.${t.amount.toLocaleString('en-IN')} | ${t.narration || 'No narration'}`
    ).join('\n');

    let inventoryValue = 0;
    try {
      const items = InventoryEngine.getItemSummary ? InventoryEngine.getItemSummary() : [];
      inventoryValue = items.reduce((s, i) => s + i.totalValue, 0);
    } catch (_) {}

    let invoiceCount = 0;
    try { invoiceCount = InvoiceEngine.invoices.length; } catch (_) {}

    const parts = [];
    parts.push(`Cash & Bank Balance: Rs.${(kpis.cashBalance || 0).toLocaleString('en-IN')}`);
    parts.push(`Total Revenue: Rs.${(kpis.totalRevenue || 0).toLocaleString('en-IN')}`);
    parts.push(`Total Expenses: Rs.${(kpis.totalExpenses || 0).toLocaleString('en-IN')}`);
    parts.push(`Net Profit (PAT): Rs.${(kpis.netProfit || 0).toLocaleString('en-IN')}`);
    parts.push(`Total Assets: Rs.${totalAssets.toLocaleString('en-IN')}`);
    parts.push(`Total Equity & Liabilities: Rs.${totalEq.toLocaleString('en-IN')}`);
    parts.push(`Balance Sheet Status: ${Math.abs(totalEq - totalAssets) <= 1 ? 'Balanced' : 'IMBALANCED'}`);
    parts.push(`Trial Balance - Debits: Rs.${totalDebits.toLocaleString('en-IN')}, Credits: Rs.${totalCredits.toLocaleString('en-IN')}`);
    parts.push(`Total Ledger Entries: ${txs.length}`);
    if (inventoryValue > 0) parts.push(`Inventory Valuation (FIFO): Rs.${inventoryValue.toLocaleString('en-IN')}`);
    if (invoiceCount > 0) parts.push(`Total Invoices: ${invoiceCount}`);
    if (recent) parts.push(`Recent Transactions (last 10):\n${recent}`);

    return parts.join('\n');
  };

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash'];

  // --- Direct Gemini API call from browser with automatic fallback ---
  const callGemini = async (userQuestion) => {
    const key = getGeminiKey();
    if (!key) {
      throw new Error('Please set your Gemini API Key first using the Key button above.');
    }

    const contextSection = buildFinancialContext();
    const prompt = `User question: "${userQuestion}"\n\n--- CURRENT FINANCIAL DATA ---\n${contextSection}\n--- END FINANCIAL DATA ---`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      generationConfig: { temperature: 0.3 }
    };

    let lastError = null;

    for (const model of GEMINI_MODELS) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          const candidates = data.candidates || [];
          if (candidates.length > 0 && candidates[0].content?.parts?.[0]?.text) {
            return candidates[0].content.parts[0].text;
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `Error ${res.status}`;
          lastError = errMsg;
          // If auth error / invalid key, don't keep trying other models
          if (res.status === 400 && errMsg.toLowerCase().includes('key')) {
            throw new Error(errMsg);
          }
        }
      } catch (err) {
        if (err.message && err.message.toLowerCase().includes('key')) {
          throw err;
        }
        lastError = err.message;
      }
    }

    throw new Error(lastError || 'High demand on Gemini models. Please retry in a few seconds.');
  };

  // --- Handle send ---
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    const currentKey = getGeminiKey();
    if (!currentKey) {
      setShowKeyInput(true);
      setMessages(prev => [...prev, { role: 'bot', text: '⚠️ Please enter a valid Gemini API Key above to activate the AI Assistant.' }]);
      setIsTyping(false);
      return;
    }

    try {
      const answer = await callGemini(userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: answer }]);
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('key')) {
        setShowKeyInput(true);
      }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            onClick={() => setShowKeyInput(!showKeyInput)} 
            title="Configure Gemini API Key" 
            style={{ 
              background: showKeyInput ? 'var(--border)' : 'none', 
              border: '1px solid var(--border)', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              padding: '5px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: 'var(--text-secondary)'
            }}
          >
            <Key size={13} color="var(--text-muted)" />
            <span>Key</span>
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={18} color="var(--text-muted)" />
          </button>
        </div>
      </div>

      {/* Key Input Banner */}
      {showKeyInput && (
        <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.06)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Key size={13} color="#3b82f6" />
            <span>Gemini API Key Setup</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => { setApiKeyInput(e.target.value); setKeySaved(false); }}
              placeholder="Paste your Gemini API key (AIza...)"
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                fontSize: '12px',
                background: 'var(--bg-surface)',
                outline: 'none'
              }}
            />
            <button
              onClick={() => {
                if (apiKeyInput.trim()) {
                  localStorage.setItem('MESO_GEMINI_API_KEY', apiKeyInput.trim());
                  setKeySaved(true);
                  setTimeout(() => {
                    setKeySaved(false);
                    setShowKeyInput(false);
                  }, 1200);
                }
              }}
              className="btn-primary"
              style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {keySaved ? <Check size={14} color="#10b981" /> : 'Save'}
            </button>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '5px' }}>
            Saved locally in your browser — never sent to any server or committed to Git.
          </div>
        </div>
      )}

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
