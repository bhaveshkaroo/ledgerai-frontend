import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, AlertTriangle, CheckCircle2, Info, Key, Check, Paperclip, FileText, CheckCheck, Sparkles } from 'lucide-react';
import { LedgerEngine, formatINR, CHART_OF_ACCOUNTS } from '../utils/LedgerEngine';
import { InventoryEngine } from '../utils/InventoryEngine';
import { InvoiceEngine } from '../utils/InvoiceEngine';
import { supabase } from '../supabaseClient';

const getGeminiKey = () => localStorage.getItem('MESO_GEMINI_API_KEY') || process.env.REACT_APP_GEMINI_API_KEY || '';
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash'];

const COA_NAMES = CHART_OF_ACCOUNTS.map(a => a.name).join(', ');

const SYSTEM_INSTRUCTION = `You are Meso AI Audit & Accounting Assistant — an expert Indian Chartered Accountant embedded in the Indian MSME accounting software "Meso".

Your core capabilities:
1. Document & Photo OCR: When the user uploads an invoice, bill, receipt, or document image/PDF, analyze it, extract all details (Vendor/Customer, Date, Invoice No, GSTIN, Line items, Tax amounts, Total), and formulate the balanced double-entry journal entry.
2. Natural Language Journal Entry: When the user asks to record, add, create, or post ANY transaction (e.g. "Record rent payment of 25000", "Bought office laptop for 50000 with 18% GST via bank", "Received payment from client"), formulate the proper balanced Indian double-entry journal voucher.
3. Audit Finding Review & Remediation: When asked to review an audit finding or ledger discrepancy (e.g. missing narration, duplicate reference, imbalance, compliance breach), analyze the root cause under Indian AS standards, and propose the exact corrective journal voucher in the proposal format so the user can resolve it with one click.
4. Financial Q&A & Audit Review: Answer questions about Balance Sheet, P&L, Cash Flow, ratios, and AS compliance using the provided financial context.

Chart of Accounts in Meso:
${COA_NAMES}

MANDATORY JOURNAL VOUCHER FORMAT:
Whenever you propose, formulate, or suggest a journal entry (from an uploaded photo/document, user chat, or audit finding correction), you MUST include the structured JSON block inside [JOURNAL_ENTRY_PROPOSAL]...[/JOURNAL_ENTRY_PROPOSAL] tags like this:

[JOURNAL_ENTRY_PROPOSAL]
{
  "date": "YYYY-MM-DD",
  "narration": "Brief description of the transaction and party",
  "category": "Expense" | "Revenue" | "Capital" | "Investing" | "Financing" | "Tax",
  "legs": [
    { "account": "Debit Account Name", "type": "Debit", "amount": 10000 },
    { "account": "Credit Account Name", "type": "Credit", "amount": 10000 }
  ]
}
[/JOURNAL_ENTRY_PROPOSAL]

Rules for Journal Proposals:
- Total Debits MUST equal Total Credits.
- Use only valid accounts from the Chart of Accounts provided above.
- If GST applies, split into Input CGST & Input SGST (intra-state) or Input IGST (inter-state), and Output CGST & Output SGST or Output IGST for sales.
- Outside the JSON block, explain your reasoning and invite the user to click the "Confirm & Post to Ledger" button below to record it.

Formatting Rules:
- NEVER use LaTeX math tags or delimiters ($$, $, \\frac, \\text, \\mathbf).
- Format all equations and ratios in clean human text: (Rs. 20,000 ÷ Rs. 40,000) = 0.50 : 1.
- Use Indian accounting terminology and INR formatting (Rs. or ₹).`;

const cleanTextFormatting = (text) => {
  if (!text) return '';
  return text
    .replace(/\\frac\s*\{([^}]+)\}\s*\{([^}]+)\}/g, '($1 ÷ $2)')
    .replace(/\\(text|mathbf|textbf|mathit|mathrm)\s*\{([^}]+)\}/g, '$2')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\approx/g, '≈')
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([^\$]+)\$/g, '$1')
    .replace(/\\([a-zA-Z]+)/g, '$1');
};

const parseJournalProposals = (text) => {
  if (!text) return { cleanText: text, proposals: [] };
  const regex = /\[JOURNAL_ENTRY_PROPOSAL\]([\s\S]*?)\[\/JOURNAL_ENTRY_PROPOSAL\]/g;
  const proposals = [];
  let match;
  let cleanText = text;

  while ((match = regex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      proposals.push(parsed);
    } catch (e) {
      console.warn('Could not parse journal proposal JSON', e);
    }
  }

  cleanText = cleanText.replace(regex, '').trim();
  return { cleanText, proposals };
};

const CompliancePanel = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Hello! I'm your AI Audit & Accounting Assistant.\n\n• 📎 **Upload bills, receipts, or invoices** — I'll scan them and draft the journal voucher.\n• ✍️ **Type any transaction** — e.g. *\"Paid Rs. 15,000 for office stationery with 18% GST via bank\"*.\n• 🔍 **Review Audit Findings** — Click 'Audit Findings' to scan for anomalies and auto-generate corrective entries.\n• 📊 **Ask financial questions** about your Balance Sheet, P&L, and AS compliance.",
      proposals: [],
      postedState: {}
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(!getGeminiKey());
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiKey());
  const [keySaved, setKeySaved] = useState(false);
  const [attachment, setAttachment] = useState(null); // { name, type, base64, previewUrl }
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result.split(',')[1];
      setAttachment({
        name: file.name,
        type: file.type,
        base64: base64Data,
        previewUrl: file.type.startsWith('image/') ? reader.result : null
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const getAuditFindings = () => {
    const txs = LedgerEngine.transactions;
    const findings = [];

    const refCounts = {};
    txs.forEach(t => {
      refCounts[t.ref] = (refCounts[t.ref] || 0) + 1;
    });
    Object.entries(refCounts).forEach(([ref, count]) => {
      if (count > 2) {
        findings.push({
          id: `dup-${ref}`,
          severity: 'warning',
          title: 'Possible Duplicate Reference',
          detail: `Reference ${ref} appears ${count} times (expected 2 for double-entry balanced pair).`,
          context: { ref, count }
        });
      }
    });

    const missingNarration = txs.filter(t => !t.narration || t.narration.trim() === '');
    if (missingNarration.length > 0) {
      findings.push({
        id: 'missing-narration',
        severity: 'error',
        title: 'Missing Transaction Narrations (AS 1)',
        detail: `${missingNarration.length} journal entries have no narration. AS 1 requires adequate disclosure and proper documentation for all ledger postings.`,
        context: { count: missingNarration.length }
      });
    }

    const bs = LedgerEngine.calcBalanceSheet();
    const totalEq = bs.find(r => r.name.toLowerCase().includes('total equity and liabilities'))?.value || 0;
    const totalAssets = bs.find(r => r.name.toLowerCase().includes('total assets'))?.value || 0;
    if (Math.abs(totalEq - totalAssets) > 1) {
      findings.push({
        id: 'bs-imbalance',
        severity: 'error',
        title: 'Balance Sheet Imbalance',
        detail: `Assets (${formatINR(totalAssets)}) ≠ Equity+Liabilities (${formatINR(totalEq)}). Discrepancy: ${formatINR(Math.abs(totalEq - totalAssets))}.`,
        context: { totalAssets, totalEq }
      });
    } else {
      findings.push({
        id: 'bs-balanced',
        severity: 'ok',
        title: 'Balance Sheet Balanced',
        detail: `Assets = Equity + Liabilities = ${formatINR(totalAssets)}. Accounting equation holds true.`
      });
    }

    let totalDebits = 0, totalCredits = 0;
    txs.forEach(t => {
      if (t.type === 'Debit') totalDebits += t.amount;
      else totalCredits += t.amount;
    });
    if (Math.abs(totalDebits - totalCredits) > 1) {
      findings.push({
        id: 'tb-mismatch',
        severity: 'error',
        title: 'Trial Balance Mismatch',
        detail: `Total Debits (${formatINR(totalDebits)}) ≠ Total Credits (${formatINR(totalCredits)}).`,
        context: { totalDebits, totalCredits }
      });
    } else {
      findings.push({
        id: 'tb-verified',
        severity: 'ok',
        title: 'Trial Balance Verified',
        detail: `Total Debits = Total Credits = ${formatINR(totalDebits)}.`
      });
    }

    return findings;
  };

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

  const callGemini = async (userQuestion, fileAttachment = null) => {
    const key = getGeminiKey();
    if (!key) {
      throw new Error('Please set your Gemini API Key first using the Key button above.');
    }

    const contextSection = buildFinancialContext();
    const promptText = userQuestion ? `User message: "${userQuestion}"\n\n--- CURRENT FINANCIAL DATA ---\n${contextSection}\n--- END FINANCIAL DATA ---` : `Please analyze this uploaded document/invoice, extract all relevant line items and taxes, and formulate the appropriate double-entry journal voucher in the specified [JOURNAL_ENTRY_PROPOSAL] JSON format.\n\n--- CURRENT FINANCIAL DATA ---\n${contextSection}\n--- END FINANCIAL DATA ---`;

    const parts = [];
    if (fileAttachment && fileAttachment.base64) {
      parts.push({
        inlineData: {
          mimeType: fileAttachment.type || 'image/jpeg',
          data: fileAttachment.base64
        }
      });
    }
    parts.push({ text: promptText });

    const payload = {
      contents: [{ parts }],
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      generationConfig: { temperature: 0.2 }
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

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || isTyping) return;
    const userMsg = input.trim();
    const sentAttachment = attachment;
    
    setMessages(prev => [...prev, {
      role: 'user',
      text: userMsg || (sentAttachment ? `Uploaded: ${sentAttachment.name}` : ''),
      attachment: sentAttachment
    }]);
    
    setInput('');
    setAttachment(null);
    setIsTyping(true);

    const currentKey = getGeminiKey();
    if (!currentKey) {
      setShowKeyInput(true);
      setMessages(prev => [...prev, { role: 'bot', text: '⚠️ Please enter a valid Gemini API Key above to activate the AI Assistant.' }]);
      setIsTyping(false);
      return;
    }

    try {
      const rawAnswer = await callGemini(userMsg, sentAttachment);
      const { cleanText, proposals } = parseJournalProposals(rawAnswer);
      
      setMessages(prev => [...prev, {
        role: 'bot',
        text: cleanTextFormatting(cleanText),
        proposals: proposals,
        postedState: {}
      }]);
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

  // Triggered when user clicks "AI Review & Solve" on an audit finding card
  const handleReviewFinding = async (finding) => {
    setActiveTab('chat');
    const prompt = `Review this audit finding: "${finding.title} — ${finding.detail}". Explain the AS compliance impact and formulate the exact corrective journal entry or rectification in the [JOURNAL_ENTRY_PROPOSAL] format so I can fix it.`;
    
    setMessages(prev => [...prev, {
      role: 'user',
      text: `🔍 Please review this audit finding: "${finding.title}"\n${finding.detail}`
    }]);
    
    setIsTyping(true);
    const currentKey = getGeminiKey();
    if (!currentKey) {
      setShowKeyInput(true);
      setMessages(prev => [...prev, { role: 'bot', text: '⚠️ Please enter a valid Gemini API Key above to activate the AI Assistant.' }]);
      setIsTyping(false);
      return;
    }

    try {
      const rawAnswer = await callGemini(prompt);
      const { cleanText, proposals } = parseJournalProposals(rawAnswer);
      
      setMessages(prev => [...prev, {
        role: 'bot',
        text: cleanTextFormatting(cleanText),
        proposals: proposals,
        postedState: {}
      }]);
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

  const handlePostProposal = async (msgIndex, propIndex, proposal) => {
    const date = proposal.date || new Date().toISOString().split('T')[0];
    const narration = proposal.narration || 'AI Posted Journal Entry';
    const category = proposal.category || 'Expense';
    const idNum = LedgerEngine.transactions.length > 0 ? parseInt(LedgerEngine.transactions[0].id) + 1 : 1000;
    const ref = `AI-${idNum}`;

    if (proposal.legs && Array.isArray(proposal.legs)) {
      proposal.legs.forEach((leg, idx) => {
        LedgerEngine.transactions.push({
          id: `${idNum}${String.fromCharCode(65 + idx)}`,
          date,
          account: leg.account,
          amount: Number(leg.amount),
          type: leg.type,
          narration,
          ref,
          category
        });
      });
    } else if (proposal.debitAccount && proposal.creditAccount && proposal.amount) {
      LedgerEngine.postTransaction(date, narration, proposal.debitAccount, proposal.creditAccount, Number(proposal.amount), category, ref);
    }

    LedgerEngine.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    try {
      await supabase.from('transactions').insert([{
        ref,
        date,
        narration,
        category,
        data: proposal
      }]);
    } catch (_) {}

    window.dispatchEvent(new Event('ledger-updated'));

    setMessages(prev => {
      const next = [...prev];
      const targetMsg = { ...next[msgIndex] };
      targetMsg.postedState = { ...targetMsg.postedState, [propIndex]: true };
      next[msgIndex] = targetMsg;
      return next;
    });
  };

  const findings = getAuditFindings();

  return (
    <div className={`chat-drawer ${isOpen ? 'open' : ''}`}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bot size={20} color="#10b981" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Meso AI Assistant</span>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: 600 }}>OCR & Entry</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Audit • Bill Scanner • Auto-Journal</div>
          </div>
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
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: 'var(--text-secondary)'
            }}
          >
            <Key size={12} color="var(--text-muted)" />
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
            flex: 1, padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            borderBottom: activeTab === tab ? '2px solid var(--text-primary)' : '2px solid transparent',
            color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)'
          }}>
            {tab === 'chat' ? 'Conversational Ledger' : `Audit Findings (${findings.length})`}
          </div>
        ))}
      </div>

      {activeTab === 'chat' ? (
        <>
          {/* Chat Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((msg, msgIndex) => (
              <div key={msgIndex} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                
                {/* User Attachment Preview */}
                {msg.attachment && (
                  <div style={{
                    marginBottom: '6px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {msg.attachment.previewUrl ? (
                      <img src={msg.attachment.previewUrl} alt="Upload preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <FileText size={16} color="#3b82f6" />
                    )}
                    <span>{msg.attachment.name}</span>
                  </div>
                )}

                {/* Text Bubble */}
                {msg.text && (
                  <div className={`chat-bubble ${msg.role}`} style={{ whiteSpace: 'pre-line', maxWidth: '85%' }}>
                    {msg.text}
                  </div>
                )}

                {/* Proposed Journal Entry Cards */}
                {msg.proposals && msg.proposals.map((prop, propIndex) => {
                  const isPosted = msg.postedState && msg.postedState[propIndex];
                  return (
                    <div key={propIndex} style={{
                      marginTop: '8px',
                      padding: '14px',
                      background: 'var(--bg-surface)',
                      border: '1px solid #10b981',
                      borderRadius: '10px',
                      maxWidth: '92%',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={15} color="#10b981" />
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>Proposed Journal Voucher</span>
                        </div>
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 600 }}>
                          {prop.category || 'Journal Entry'}
                        </span>
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        Date: <strong>{prop.date || new Date().toISOString().split('T')[0]}</strong>
                      </div>

                      {/* Line Table */}
                      <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginBottom: '10px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '10px', textAlign: 'left' }}>
                            <th style={{ padding: '4px' }}>Account Head</th>
                            <th style={{ padding: '4px', textAlign: 'right' }}>Type</th>
                            <th style={{ padding: '4px', textAlign: 'right' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prop.legs ? prop.legs.map((leg, li) => (
                            <tr key={li} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                              <td style={{ padding: '4px', fontWeight: 500 }}>{leg.account}</td>
                              <td style={{ padding: '4px', textAlign: 'right', color: leg.type === 'Debit' ? '#3b82f6' : '#8b5cf6', fontWeight: 600 }}>{leg.type}</td>
                              <td style={{ padding: '4px', textAlign: 'right', fontWeight: 600 }}>₹{Number(leg.amount).toLocaleString('en-IN')}</td>
                            </tr>
                          )) : (
                            <>
                              <tr>
                                <td style={{ padding: '4px', fontWeight: 500 }}>{prop.debitAccount}</td>
                                <td style={{ padding: '4px', textAlign: 'right', color: '#3b82f6', fontWeight: 600 }}>Debit</td>
                                <td style={{ padding: '4px', textAlign: 'right', fontWeight: 600 }}>₹{Number(prop.amount).toLocaleString('en-IN')}</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '4px', fontWeight: 500 }}>{prop.creditAccount}</td>
                                <td style={{ padding: '4px', textAlign: 'right', color: '#8b5cf6', fontWeight: 600 }}>Credit</td>
                                <td style={{ padding: '4px', textAlign: 'right', fontWeight: 600 }}>₹{Number(prop.amount).toLocaleString('en-IN')}</td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>

                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px', fontStyle: 'italic' }}>
                        Narration: {prop.narration}
                      </div>

                      {/* Action Button */}
                      {isPosted ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px', fontWeight: 600, padding: '6px' }}>
                          <CheckCheck size={16} color="#10b981" />
                          <span>Posted to Ledger & Books Updated ✅</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handlePostProposal(msgIndex, propIndex, prop)}
                            className="btn-primary"
                            style={{
                              flex: 1,
                              padding: '7px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <Check size={14} />
                            <span>Confirm & Post to Ledger</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            {isTyping && (
              <div className="chat-bubble bot" style={{ opacity: 0.6 }}>
                Analyzing document & financial books...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Attachment Preview above input */}
          {attachment && (
            <div style={{
              margin: '0 16px',
              padding: '8px 12px',
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {attachment.previewUrl ? (
                  <img src={attachment.previewUrl} alt="Preview" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px' }} />
                ) : (
                  <FileText size={18} color="#3b82f6" />
                )}
                <div>
                  <div style={{ fontWeight: 500 }}>{attachment.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Ready for OCR & Journal Entry</div>
                </div>
              </div>
              <button onClick={() => setAttachment(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                <X size={15} color="var(--text-muted)" />
              </button>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,.pdf"
            style={{ display: 'none' }}
          />

          {/* Input Bar */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload Invoice / Receipt Photo or PDF"
              style={{
                background: attachment ? 'rgba(59,130,246,0.1)' : 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Paperclip size={16} color={attachment ? '#3b82f6' : 'var(--text-muted)'} />
            </button>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={attachment ? "Add instructions or press send..." : "Type transaction (e.g. Paid Rs 20000 rent via bank)..."}
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
              disabled={isTyping || (!input.trim() && !attachment)}
              className="btn-primary"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isTyping || (!input.trim() && !attachment) ? 0.5 : 1
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </>
      ) : (
        /* Findings Tab */
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Click <strong>"AI Review & Fix"</strong> on any anomaly to have the AI diagnose the compliance risk and draft a corrective journal voucher.
          </div>
          {findings.map((f, i) => (
            <div key={i} style={{
              padding: '14px', marginBottom: '10px', borderRadius: 'var(--radius-md)',
              background: f.severity === 'error' ? 'rgba(239,68,68,0.06)' : f.severity === 'warning' ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)',
              border: `1px solid ${f.severity === 'error' ? 'rgba(239,68,68,0.15)' : f.severity === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                {f.severity === 'error' ? <AlertTriangle size={14} color="#ef4444" /> : f.severity === 'warning' ? <Info size={14} color="#f59e0b" /> : <CheckCircle2 size={14} color="#10b981" />}
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{f.title}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.detail}</div>
              
              {/* AI Review & Fix Button */}
              {f.severity !== 'ok' && (
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleReviewFinding(f)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'var(--bg-surface)',
                      border: '1px solid rgba(139,92,246,0.3)',
                      color: '#8b5cf6',
                      cursor: 'pointer'
                    }}
                  >
                    <Sparkles size={12} color="#8b5cf6" />
                    <span>AI Review & Fix</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompliancePanel;
