import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, AlertTriangle, CheckCircle2, Info, Key, Check, Paperclip, FileText, CheckCheck, Sparkles, RefreshCw } from 'lucide-react';
import { LedgerEngine, formatINR, CHART_OF_ACCOUNTS } from '../utils/LedgerEngine';
import { InventoryEngine } from '../utils/InventoryEngine';
import { InvoiceEngine } from '../utils/InvoiceEngine';
import { supabase } from '../supabaseClient';

import { getGeminiApiKey as getGeminiKey, GEMINI_MODELS, API_KEY_MISSING_MSG } from '../utils/aiConfig';

const COA_NAMES = CHART_OF_ACCOUNTS.map(a => a.name).join(', ');

const SYSTEM_INSTRUCTION = `You are Meso AI Audit & Accounting Assistant — an autonomous expert Indian Chartered Accountant embedded in the Indian MSME accounting software "Meso".

Your core capabilities:
1. Document & Photo OCR: When the user uploads an invoice, bill, receipt, or document image/PDF, analyze it, extract all details (Vendor/Customer, Date, Invoice No, GSTIN, Line items, Tax amounts, Total), and formulate the balanced double-entry journal entry.
2. Natural Language Journal Entry: When the user asks to record, add, create, or post ANY transaction (e.g. "Record rent payment of 25000", "Bought office laptop for 50000 with 18% GST via bank", "Received payment from client"), formulate the proper balanced Indian double-entry journal voucher.
3. 1-Tap Reversal & Error Rectification: When the user asks to reverse, void, cancel, reclassify, or fix an entry or audit finding (such as missing narrations, duplicated reference, or account misclassification), you have FULL AUTHORITY to propose the exact 1-tap resolution action.
4. Financial Q&A & Audit Review: Answer questions about Balance Sheet, P&L, Cash Flow, ratios, and AS compliance using the provided financial context.

Chart of Accounts in Meso:
${COA_NAMES}

MANDATORY 1-TAP ACTION PROPOSAL FORMAT:
Whenever you propose a journal entry, reversal, correction, or audit fix, you MUST include a JSON proposal block enclosed in [JOURNAL_ENTRY_PROPOSAL]...[/JOURNAL_ENTRY_PROPOSAL] tags like this:

For creating/correcting entries:
[JOURNAL_ENTRY_PROPOSAL]
{
  "action": "POST_ENTRY",
  "title": "Record Transaction / Corrective Entry",
  "date": "YYYY-MM-DD",
  "narration": "Detailed explanation of the entry",
  "category": "Expense" | "Revenue" | "Capital" | "Investing" | "Financing" | "Tax",
  "legs": [
    { "account": "Debit Account Name from COA", "type": "Debit", "amount": 10000 },
    { "account": "Credit Account Name from COA", "type": "Credit", "amount": 10000 }
  ]
}
[/JOURNAL_ENTRY_PROPOSAL]

For reversing/voiding an erroneous transaction:
[JOURNAL_ENTRY_PROPOSAL]
{
  "action": "REVERSE_ENTRY",
  "title": "Contra Reversal of Transaction",
  "targetRef": "REF-TO-REVERSE",
  "reason": "Reason for reversal"
}
[/JOURNAL_ENTRY_PROPOSAL]

For batch fixing missing narrations (AS 1):
[JOURNAL_ENTRY_PROPOSAL]
{
  "action": "FIX_NARRATIONS",
  "title": "Standardize Missing Transaction Narrations (AS 1 Compliance)"
}
[/JOURNAL_ENTRY_PROPOSAL]

Rules for Proposals:
- Total Debits MUST equal Total Credits.
- Use only valid accounts from the Chart of Accounts provided.
- If GST applies, split into Input CGST & Input SGST (intra-state) or Input IGST (inter-state), and Output CGST & Output SGST or Output IGST for sales.
- Outside the JSON block, explain your reasoning and invite the user to click the 1-Tap button below to execute the change immediately.

CRITICAL STATUTORY & DIRECT TAX PRINCIPLES (SUBSTANCE OVER FORM - AS 1):
- NEVER propose "REVERSE_ENTRY" simply because an expense is disallowed or non-deductible for income tax (e.g. Section 80G cash donation > Rs 2,000, Section 40A(3) cash expense > Rs 10,000, or CSR expenses). If the cash physically left the company's possession, reversing the entry fabricates physical cash in the ledger that does not exist in reality, creating a physical cash count violation under CARO!
- For tax disallowances where money was actually paid:
  1. Explain that the expense legitimately stays in the books and P&L under Indian GAAP / Companies Act 2013.
  2. Under AS 22, it is a Permanent Difference that must be ADDED BACK to taxable profit in Tax Audit Form 3CD and the Income Tax Return (ITR).
  3. If the user actually paid through Bank (Cheque/NEFT/UPI) but entered "Cash" by mistake, propose moving the credit leg from Cash to Bank so Section 80G tax deduction is preserved.
  4. Only propose REVERSE_ENTRY if the user explicitly states the transaction was entered by mistake and never occurred in reality.

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
  const regex = /\[JOURNAL_ENTRY_PROPOSAL\]([\s\S]*?)\[\/JOURNAL_ENTRY_PROPOSAL\]/gi;
  const proposals = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    try {
      let raw = match[1].trim();
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(raw);
      proposals.push(parsed);
    } catch (e) {
      console.warn('Could not parse journal proposal JSON', e, match[1]);
    }
  }

  const cleanText = text.replace(regex, '').trim();
  return { cleanText, proposals };
};

const CompliancePanel = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Hello! I'm your AI Audit & Accounting Assistant.\n\n• 📎 **Upload bills or receipts** — I'll scan them and formulate the balanced journal entry.\n• ✍️ **Type any transaction, correction, or reversal** — e.g. *\"Paid Rs. 15,000 for rent\"* or *\"Give Rs. 50,000 charity to NGO\"* or *\"Reverse transaction PUR-2025-102\"*.\n• 🔍 **Auto-Solve Audit Findings** — Check 'Audit Findings' to auto-diagnose and resolve ledger anomalies with 1 tap.\n• 📊 **Ask financial questions** about your Balance Sheet, P&L, and AS compliance.",
      proposals: [],
      postedState: {}
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(!getGeminiKey());
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiKey());
  const [keySaved, setKeySaved] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [, setLedgerTick] = useState(0);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Re-render and re-evaluate findings whenever ledger updates
  useEffect(() => {
    const handleUpdate = () => setLedgerTick(t => t + 1);
    window.addEventListener('ledger-updated', handleUpdate);
    return () => window.removeEventListener('ledger-updated', handleUpdate);
  }, []);

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

    // 1. Double-Entry Imbalance Check per Voucher Ref
    const refLegs = {};
    txs.forEach(t => {
      if (!refLegs[t.ref]) refLegs[t.ref] = { debits: 0, credits: 0, count: 0, date: t.date };
      if (t.type === 'Debit') refLegs[t.ref].debits += Number(t.amount);
      else refLegs[t.ref].credits += Number(t.amount);
      refLegs[t.ref].count += 1;
    });

    Object.entries(refLegs).forEach(([ref, data]) => {
      const diff = Math.abs(data.debits - data.credits);
      if (diff > 1) {
        findings.push({
          id: `imbalance-${ref}`,
          severity: 'error',
          title: 'Unbalanced Voucher (Double-Entry Violation)',
          detail: `Voucher ${ref} on ${data.date} has mismatched legs: Debits ₹${data.debits.toLocaleString('en-IN')} vs Credits ₹${data.credits.toLocaleString('en-IN')}. Discrepancy: ₹${diff.toLocaleString('en-IN')}.`,
          targetRef: ref
        });
      }
    });

    // 2. AS 1 Missing Narrations Check
    const missingNarration = txs.filter(t => !t.narration || t.narration.trim() === '');
    if (missingNarration.length > 0) {
      findings.push({
        id: 'missing-narration',
        severity: 'error',
        title: 'Missing Transaction Narrations (AS 1 Compliance)',
        detail: `${missingNarration.length} journal entries have no narration. AS 1 requires adequate disclosure and proper documentation for all ledger postings.`,
        actionType: 'FIX_NARRATIONS'
      });
    }

    // 3. Section 40A(3) & 80G High Value Cash Compliance
    const cashDonations = txs.filter(t => 
      t.type === 'Debit' && 
      ((t.narration || '').toLowerCase().includes('donation') || (t.narration || '').toLowerCase().includes('charity'))
    );
    if (cashDonations.length > 0) {
      const highCashDonations = cashDonations.filter(t => t.amount > 2000);
      if (highCashDonations.length > 0) {
        findings.push({
          id: 'sec-80g-cash',
          severity: 'warning',
          title: 'Cash Donation > ₹2,000 (Sec 80G Restriction)',
          detail: `${highCashDonations.length} donation/charity entries exceed ₹2,000 in cash. Under Section 80G of Income Tax Act, cash donations above ₹2,000 are not eligible for tax deductions.`,
          suggestion: 'Ensure future charity/donations are paid via banking channels (NEFT/RTGS/Cheque) to preserve Sec 80G tax benefit.'
        });
      }
    }

    // 4. Balance Sheet Verification
    const bs = LedgerEngine.calcBalanceSheet();
    const totalEq = bs.find(r => r.name.toLowerCase().includes('total equity and liabilities'))?.value || 0;
    const totalAssets = bs.find(r => r.name.toLowerCase().includes('total assets'))?.value || 0;
    if (Math.abs(totalEq - totalAssets) > 1) {
      findings.push({
        id: 'bs-imbalance',
        severity: 'error',
        title: 'Balance Sheet Imbalance',
        detail: `Assets (${formatINR(totalAssets)}) ≠ Equity+Liabilities (${formatINR(totalEq)}). Discrepancy: ${formatINR(Math.abs(totalEq - totalAssets))}.`
      });
    } else {
      findings.push({
        id: 'bs-balanced',
        severity: 'ok',
        title: 'Balance Sheet Verified (Balanced)',
        detail: `Total Assets = Total Equity & Liabilities = ${formatINR(totalAssets)}. Accounting equation holds true.`
      });
    }

    // 5. Trial Balance Verification
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
        detail: `Total Debits (${formatINR(totalDebits)}) ≠ Total Credits (${formatINR(totalCredits)}). Discrepancy: ${formatINR(Math.abs(totalDebits - totalCredits))}.`
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

    const recent = [...txs].slice(-12).map(t =>
      `${t.date} | ${t.type} | ${t.account} | Rs.${t.amount.toLocaleString('en-IN')} | Ref: ${t.ref} | ${t.narration || 'No narration'}`
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
    if (recent) parts.push(`Recent Transactions (last 12 with Refs):\n${recent}`);

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
      setMessages(prev => [...prev, { role: 'bot', text: `⚠️ ${API_KEY_MISSING_MSG}` }]);
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

  // 1-Tap Trigger from Audit Findings
  const handleReviewFinding = async (finding) => {
    setActiveTab('chat');
    let prompt = `Review this audit finding: "${finding.title} — ${finding.detail}". Explain the AS compliance and tax impact. Note: If this is a tax deduction disallowance (such as Section 80G cash donation or Section 40A(3)), do NOT propose reversing the entry if the cash was actually paid. Explain the Form 3CD / AS 22 permanent difference add-back, and offer options (reclassify payment channel to Bank if entered as Cash by error, or only reverse if it was a clerical mistake).`;
    
    if (finding.targetRef && finding.id === 'duplicate-jv') {
      prompt += ` If this is an unintended duplicate voucher, propose a REVERSE_ENTRY for reference "${finding.targetRef}".`;
    } else if (finding.actionType === 'FIX_NARRATIONS') {
      prompt += ` Please formulate a FIX_NARRATIONS proposal to standardize and insert compliant narrations for all un-narrated entries as required by AS 1.`;
    }
    
    setMessages(prev => [...prev, {
      role: 'user',
      text: `🔍 Please review and resolve this audit finding:\n**${finding.title}**\n${finding.detail}`
    }]);
    
    setIsTyping(true);
    const currentKey = getGeminiKey();
    if (!currentKey) {
      setShowKeyInput(true);
      setMessages(prev => [...prev, { role: 'bot', text: `⚠️ ${API_KEY_MISSING_MSG}` }]);
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

  // 1-Tap Execution Handler
  const handlePostProposal = (msgIndex, propIndex, proposal) => {
    const action = proposal.action || 'POST_ENTRY';
    console.log('[MESO AI] Executing 1-tap action:', action, proposal);

    try {
      if (action === 'REVERSE_ENTRY' && proposal.targetRef) {
        const result = LedgerEngine.reverseTransaction(proposal.targetRef, proposal.reason || 'AI Reversal of duplicate/erroneous entry');
        console.log('[MESO AI] Reversal result:', result);
      } else if (action === 'FIX_NARRATIONS') {
        const count = LedgerEngine.batchFixMissingNarrations();
        console.log('[MESO AI] Fixed narrations count:', count);
      } else if (action === 'RECLASSIFY_ENTRY' && proposal.targetRef && proposal.oldAccount && proposal.newAccount) {
        const result = LedgerEngine.reclassifyTransaction(proposal.targetRef, proposal.oldAccount, proposal.newAccount);
        console.log('[MESO AI] Reclassify result:', result);
      } else {
        // Standard Post Entry
        const date = proposal.date || new Date().toISOString().split('T')[0];
        const narration = proposal.narration || 'AI Posted Journal Entry';
        const category = proposal.category || 'Expense';

        if (proposal.legs && Array.isArray(proposal.legs)) {
          // Multi-leg entry: push each leg individually
          const maxId = LedgerEngine.transactions.reduce((max, t) => {
            const num = parseInt(t.id);
            return isNaN(num) ? max : Math.max(max, num);
          }, 0);
          const idNum = maxId + 1;
          const ref = `AI-${idNum}`;

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
          LedgerEngine.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
          console.log('[MESO AI] Posted multi-leg entry, ref:', ref, 'legs:', proposal.legs.length);
        } else if (proposal.debitAccount && proposal.creditAccount && proposal.amount) {
          const ref = `AI-${LedgerEngine.transactions.length}`;
          LedgerEngine.postTransaction(date, narration, proposal.debitAccount, proposal.creditAccount, Number(proposal.amount), category, ref);
          console.log('[MESO AI] Posted 2-leg entry, ref:', ref);
        }
      }

      console.log('[MESO AI] Total transactions after action:', LedgerEngine.transactions.length);
      console.log('[MESO AI] Cash balance after action:', LedgerEngine.getAccountBalance('Cash and Bank'));
    } catch (err) {
      console.error('[MESO AI] Error executing action:', err);
    }

    // IMMEDIATELY dispatch the event and update UI — do NOT wait for supabase
    window.dispatchEvent(new Event('ledger-updated'));
    console.log('[MESO AI] ledger-updated event dispatched');

    // Update message card to show green checkmark
    setMessages(prev => {
      const next = [...prev];
      const targetMsg = { ...next[msgIndex] };
      targetMsg.postedState = { ...targetMsg.postedState, [propIndex]: true };
      next[msgIndex] = targetMsg;
      return next;
    });

    // Sync to Supabase audit log in background (fire and forget — never blocks UI)
    supabase.from('audit_logs').insert([{
      company_id: '00000000-0000-0000-0000-000000000001',
      role: 'assistant',
      action,
      message: proposal.title || `Action: ${action}`,
      details: proposal
    }]).then(() => {
      console.log('[MESO AI] Audit log synced to Supabase');
    }).catch(() => {
      // Silently ignore — audit log sync is optional
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
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: 600 }}>1-Tap Control</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Scan • Auto-Journal • Reversal • Fix Findings</div>
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
                  <div className={`chat-bubble ${msg.role}`} style={{ whiteSpace: 'pre-line', maxWidth: '88%' }}>
                    {msg.text}
                  </div>
                )}

                {/* Proposed 1-Tap Action / Voucher Cards */}
                {msg.proposals && msg.proposals.map((prop, propIndex) => {
                  const isPosted = msg.postedState && msg.postedState[propIndex];
                  const isReversal = prop.action === 'REVERSE_ENTRY';
                  const isFixNarrations = prop.action === 'FIX_NARRATIONS';

                  return (
                    <div key={propIndex} style={{
                      marginTop: '8px',
                      padding: '14px',
                      background: 'var(--bg-surface)',
                      border: `1px solid ${isReversal ? '#ef4444' : isFixNarrations ? '#8b5cf6' : '#10b981'}`,
                      borderRadius: '10px',
                      maxWidth: '92%',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isReversal ? <RefreshCw size={15} color="#ef4444" /> : isFixNarrations ? <Sparkles size={15} color="#8b5cf6" /> : <CheckCircle2 size={15} color="#10b981" />}
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{prop.title || 'Proposed 1-Tap Resolution'}</span>
                        </div>
                        <span style={{
                          fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                          background: isReversal ? 'rgba(239,68,68,0.1)' : isFixNarrations ? 'rgba(139,92,246,0.1)' : 'rgba(16,185,129,0.1)',
                          color: isReversal ? '#ef4444' : isFixNarrations ? '#8b5cf6' : '#10b981',
                          fontWeight: 600
                        }}>
                          {prop.action || 'POST_ENTRY'}
                        </span>
                      </div>

                      {/* Reversal specifics */}
                      {isReversal && (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                          Target Voucher to Void: <strong>{prop.targetRef}</strong>
                          {prop.reason && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Reason: {prop.reason}</div>}
                        </div>
                      )}

                      {/* Fix narrations specifics */}
                      {isFixNarrations && (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                          Will automatically populate standardized, compliant transaction narrations for all un-narrated entries per AS 1.
                        </div>
                      )}

                      {/* Line Table for Standard Entries */}
                      {!isReversal && !isFixNarrations && (
                        <>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            Date: <strong>{prop.date || new Date().toISOString().split('T')[0]}</strong>
                          </div>

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

                          {prop.narration && (
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px', fontStyle: 'italic' }}>
                              Narration: {prop.narration}
                            </div>
                          )}
                        </>
                      )}

                      {/* Action Button */}
                      {isPosted ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px', fontWeight: 600, padding: '6px' }}>
                          <CheckCheck size={16} color="#10b981" />
                          <span>Correction Applied & Ledger Updated ✅</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handlePostProposal(msgIndex, propIndex, prop)}
                            className="btn-primary"
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              background: isReversal ? '#ef4444' : isFixNarrations ? '#8b5cf6' : undefined
                            }}
                          >
                            <Check size={14} />
                            <span>{isReversal ? 'Confirm & Execute 1-Tap Reversal' : isFixNarrations ? 'Confirm & Apply 1-Tap Fix' : 'Confirm & Post to Ledger'}</span>
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
                Analyzing books & formulating 1-tap resolution...
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
              placeholder={attachment ? "Add instructions or press send..." : "Type transaction, reversal (e.g. Reverse PUR-2025-101), or question..."}
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
            Click <strong>"AI Review & Fix"</strong> on any anomaly to have the AI diagnose the compliance risk and draft a 1-tap corrective action.
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
                      padding: '6px 12px',
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
                    <span>AI Review & Auto-Solve (1-Tap)</span>
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
