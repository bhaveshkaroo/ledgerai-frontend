import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, AlertCircle, Clock, 
  Send, Shield, Download, RefreshCw, 
  ArrowRight, FileText, Scale, ExternalLink, HelpCircle 
} from 'lucide-react';
import { LedgerEngine, formatCurrency } from '../utils/LedgerEngine';
import { ASValidationEngine } from '../utils/ASComplianceEngine';

function CAWorkflow({ currency = 'INR' }) {
  // ─── State Management ──────────────────────────────────────────────────
  const [caName, setCaName] = useState('Rajesh Sharma & Associates');
  const [caEmail, setCaEmail] = useState('rsharma.fca@gmail.com');
  const [isInvited, setIsInvited] = useState(true);
  const [inviteTime, setInviteTime] = useState('2026-05-24 10:15 AM');

  // Checklist Items (based on Image 3 checklist)
  const [checklist, setChecklist] = useState([
    { id: 1, name: 'Bank statements reconciliation', status: 'OK', details: 'HDFC & ICICI accounts fully reconciled up to last month.' },
    { id: 2, name: 'GST filing accuracy', status: 'PENDING', details: 'Pending match with GSTR-2B ITC reports.' },
    { id: 3, name: 'Transaction categorization', status: 'OK', details: 'All transactions categorized. Rule accuracy at 92%.' },
    { id: 4, name: 'Invoice verification', status: 'OK', details: 'E-invoices validated via GST Portal API sync.' },
    { id: 5, name: 'Expense documentation', status: 'ISSUE', details: 'Rent expense above ₹5,00,000 lacks signed ROU lease deed.' },
    { id: 6, name: 'TDS compliance check', status: 'PENDING', details: 'Verifying TDS deduction rates under Sec 194C.' }
  ]);

  // Discrepancy findings (read from storage if exists or local mock)
  const [findings, setFindings] = useState([]);
  const [queries, setQueries] = useState([
    { sender: 'CA', message: 'Please upload the signed lease agreement for the factory rental. It exceeds the ₹5,00,000 threshold for Ind AS 116 capitalization.', time: 'Yesterday 04:30 PM' },
    { sender: 'MSME', message: 'We have requested the landlord for the stamped copy. Will upload it by tomorrow afternoon.', time: 'Today 09:15 AM' }
  ]);
  const [newQuery, setNewQuery] = useState('');
  
  // Sign-off State
  const [signOff, setSignOff] = useState({
    isSigned: false,
    signedBy: '',
    timestamp: '',
    hash: ''
  });

  const [activeStep, setActiveStep] = useState(2); // Review Phase is active by default

  useEffect(() => {
    // Read current compliance findings to count errors and warnings
    const saved = localStorage.getItem('ledgerai-compliance-log');
    if (saved) {
      setFindings(JSON.parse(saved));
    } else {
      // Mock validation to get initial findings
      const txs = LedgerEngine.transactions;
      const is = LedgerEngine.calcIncomeStatement('Full Year');
      const cf = LedgerEngine.calcCashFlow('Full Year');
      const bs = LedgerEngine.calcBalanceSheet('Full Year');
      const mockFindings = ASValidationEngine.runFullValidation(txs, is, cf, bs);
      setFindings(mockFindings);
    }
  }, []);

  // ─── Actions & Handlers ──────────────────────────────────────────────
  const handleInvite = (e) => {
    e.preventDefault();
    if (!caName || !caEmail) return;
    setIsInvited(true);
    setInviteTime(new Date().toLocaleString('en-IN', { hour12: true }));
  };

  const toggleChecklistStatus = (id) => {
    const statuses = ['OK', 'PENDING', 'ISSUE'];
    setChecklist(prev => prev.map(item => {
      if (item.id === id) {
        const nextIdx = (statuses.indexOf(item.status) + 1) % statuses.length;
        return { ...item, status: statuses[nextIdx] };
      }
      return item;
    }));
  };

  const handleSendQuery = () => {
    if (!newQuery.trim()) return;
    setQueries(prev => [...prev, {
      sender: 'MSME',
      message: newQuery,
      time: 'Just now'
    }]);
    setNewQuery('');
  };

  const handleSignOff = () => {
    // Allow sign off only if no issues and all are verified (or for demo allow with warning)
    const hasIssues = checklist.some(i => i.status === 'ISSUE');
    const hasPending = checklist.some(i => i.status === 'PENDING');
    
    if (hasIssues) {
      alert("Cannot sign off: Please resolve all issues in the Verification Checklist first.");
      return;
    }
    
    const randomHash = '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
    setSignOff({
      isSigned: true,
      signedBy: caName || 'Rajesh Sharma, FCA',
      timestamp: new Date().toLocaleString('en-IN', { hour12: true }),
      hash: randomHash.substring(0, 16) + '...' + randomHash.substring(34)
    });
  };

  const errorsCount = findings.filter(f => f.severity === 'ERROR' && f.status === 'Unresolved').length;
  const warningsCount = findings.filter(f => f.severity === 'WARNING' && f.status === 'Unresolved').length;

  return (
    <div className="dashboard-container" style={{ maxWidth: '100%' }}>
      
      {/* ─── Workflow Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>CA Verification & Audit Workflow</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>End-to-End CA Collaboration Process for MSME Compliance</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)', display: 'inline-block' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}>Approved</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff9500', display: 'inline-block' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}>Pending</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff3b30', display: 'inline-block' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}>Issues</span>
          </div>
        </div>
      </div>

      {/* ─── 6-Column Workflow Grid ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Step 1: ASSIGNMENT */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '380px', padding: '16px', borderColor: activeStep === 1 ? 'var(--accent-emerald)' : 'var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="sidebar-logo" style={{ width: '22px', height: '22px', fontSize: '11px', background: 'var(--accent-emerald)', color: '#ffffff' }}>1</span>
              <span style={{ fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assignment</span>
            </div>
            {isInvited ? (
              <span style={{ color: 'var(--accent-emerald)', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} /> ACTIVE
              </span>
            ) : (
              <span style={{ color: '#ff9500', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> PENDING
              </span>
            )}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>Assign a qualified Chartered Accountant to audit and verify your business books.</p>
            
            {isInvited ? (
              <div style={{ padding: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{caName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{caEmail}</div>
                <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', marginTop: '8px' }}>Assigned on {inviteTime}</div>
              </div>
            ) : (
              <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="CA Name (e.g. Rajesh Sharma)" 
                  value={caName} 
                  onChange={e => setCaName(e.target.value)}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
                />
                <input 
                  type="email" 
                  placeholder="CA Email Address" 
                  value={caEmail} 
                  onChange={e => setCaEmail(e.target.value)}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
                />
                <button type="submit" className="settings-btn" style={{ background: '#000000', color: '#ffffff', border: 'none', fontWeight: 600, padding: '8px' }}>
                  Send CA Invitation
                </button>
              </form>
            )}
            
            <ul style={{ paddingLeft: '16px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto' }}>
              <li>CA receives access link</li>
              <li>Secure portal login</li>
              <li>Read-only financial view</li>
            </ul>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status Indicator</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--accent-emerald)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)' }}></span> COMPLETED
            </span>
          </div>
        </div>

        {/* Step 2: REVIEW PHASE */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '380px', padding: '16px', borderColor: activeStep === 2 ? 'var(--accent-emerald)' : 'var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="sidebar-logo" style={{ width: '22px', height: '22px', fontSize: '11px', background: 'var(--accent-emerald)', color: '#ffffff' }}>2</span>
              <span style={{ fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Review Phase</span>
            </div>
            <span style={{ color: '#ff3b30', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> IN PROGRESS
            </span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>CA performs real-time checks on transaction records and compliance criteria.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>AS Errors</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: errorsCount > 0 ? '#ff3b30' : 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>{errorsCount}</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Warnings</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: warningsCount > 0 ? '#ff9500' : 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>{warningsCount}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-surface)', padding: '10px', borderRadius: '6px', border: '1px dashed var(--border)' }}>
              <div style={{ fontWeight: 500, fontSize: '12px' }}>Audit Engine Status:</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>- GST Mismatch Checks: OK</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>- Accrual Rules (AS 1): {errorsCount > 0 ? 'Review Required' : 'OK'}</div>
            </div>

            <button className="settings-btn" onClick={() => window.location.reload()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '6px', fontSize: '12px', marginTop: 'auto' }}>
              <RefreshCw size={12} /> Run Integrity Scan
            </button>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status Indicator</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#ff3b30' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff3b30' }}></span> IN PROGRESS
            </span>
          </div>
        </div>

        {/* Step 3: VERIFICATION CHECKLIST */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '380px', padding: '16px', borderColor: activeStep === 3 ? 'var(--accent-emerald)' : 'var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="sidebar-logo" style={{ width: '22px', height: '22px', fontSize: '11px', background: 'var(--accent-emerald)', color: '#ffffff' }}>3</span>
              <span style={{ fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verification Checklist</span>
            </div>
            <span style={{ color: '#ff9500', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> PENDING
            </span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px', lineHeight: '1.3' }}>Click on a badge to cycle status: OK (Green), ISSUE (Red), PENDING (Yellow).</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '200px' }}>
              {checklist.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => toggleChecklistStatus(item.id)}
                  style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '6px 8px', background: 'var(--bg-surface)', 
                    border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s'
                  }}
                  className="table-row-hover"
                  title={item.details}
                >
                  <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>{item.name}</span>
                  <span style={{ 
                    fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '3px',
                    background: item.status === 'OK' ? 'rgba(52, 199, 89, 0.12)' : item.status === 'ISSUE' ? 'rgba(255, 59, 48, 0.12)' : 'rgba(255, 149, 0, 0.12)',
                    color: item.status === 'OK' ? 'var(--accent-emerald)' : item.status === 'ISSUE' ? '#ff3b30' : '#ff9500',
                    border: `1px solid ${item.status === 'OK' ? 'rgba(52,199,89,0.3)' : item.status === 'ISSUE' ? 'rgba(255,59,48,0.3)' : 'rgba(255,149,0,0.3)'}`
                  }}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status Indicator</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#ff9500' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff9500' }}></span> PENDING
            </span>
          </div>
        </div>

        {/* Step 4: COMMUNICATION */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '380px', padding: '16px', borderColor: activeStep === 4 ? 'var(--accent-emerald)' : 'var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="sidebar-logo" style={{ width: '22px', height: '22px', fontSize: '11px', background: 'var(--accent-emerald)', color: '#ffffff' }}>4</span>
              <span style={{ fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Communication</span>
            </div>
            <span style={{ color: '#ff9500', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> PENDING
            </span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            {/* Chat History */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '180px', paddingRight: '4px' }}>
              {queries.map((q, idx) => (
                <div key={idx} style={{ 
                   alignSelf: q.sender === 'CA' ? 'flex-start' : 'flex-end',
                   background: q.sender === 'CA' ? 'var(--bg-surface)' : 'var(--bg-surface-hover)',
                   border: '1px solid var(--border)',
                   borderRadius: '6px',
                   padding: '8px',
                   maxWidth: '90%',
                   fontSize: '11px'
                }}>
                  <div style={{ fontWeight: 600, color: q.sender === 'CA' ? 'var(--accent-emerald)' : 'var(--text-primary)', marginBottom: '2px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <span>{q.sender === 'CA' ? 'CA (Rajesh Sharma)' : 'Client (MSME)'}</span>
                    <span style={{ fontWeight: 400, opacity: 0.5, fontSize: '9px' }}>{q.time}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: '1.3' }}>{q.message}</div>
                </div>
              ))}
            </div>

            {/* Input box */}
            <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
              <input 
                type="text" 
                placeholder="Type audit reply..." 
                value={newQuery} 
                onChange={e => setNewQuery(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSendQuery()}
                style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', outline: 'none' }}
              />
              <button onClick={handleSendQuery} style={{ background: '#000000', border: 'none', color: '#ffffff', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={12} />
              </button>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status Indicator</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#ff9500' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff9500' }}></span> PENDING
            </span>
          </div>
        </div>

        {/* Step 5: SIGN-OFF */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '380px', padding: '16px', borderColor: activeStep === 5 ? 'var(--accent-emerald)' : 'var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="sidebar-logo" style={{ width: '22px', height: '22px', fontSize: '11px', background: 'var(--accent-emerald)', color: '#ffffff' }}>5</span>
              <span style={{ fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sign-off</span>
            </div>
            {signOff.isSigned ? (
              <span style={{ color: 'var(--accent-emerald)', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} /> VERIFIED
              </span>
            ) : (
              <span style={{ color: '#ff9500', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> PENDING
              </span>
            )}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>CA signs off on books, creating a secure cryptographic proof of verification.</p>
            
            {signOff.isSigned ? (
              <div style={{ padding: '12px', background: 'rgba(52, 199, 89, 0.08)', border: '1px solid var(--accent-emerald)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Shield size={14} /> CRYPTOGRAPHIC SIGNATURE
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>Signed by: {signOff.signedBy}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Time: {signOff.timestamp}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Hash: {signOff.hash}</div>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Signing Authority:</div>
                <input 
                  type="text" 
                  value={caName}
                  disabled
                  style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '6px', borderRadius: '4px', fontSize: '12px' }}
                />
                <button 
                  onClick={handleSignOff} 
                  className="settings-btn"
                  style={{ 
                    background: '#000000', color: '#ffffff', border: 'none', fontWeight: 600, padding: '8px 12px',
                    opacity: checklist.some(i => i.status === 'ISSUE') ? 0.5 : 1
                  }}
                >
                  Apply Digital Sign-off
                </button>
                {checklist.some(i => i.status === 'ISSUE') && (
                  <span style={{ fontSize: '10px', color: '#ff3b30', textAlign: 'center' }}>⚠️ Checklist contains unresolved issues</span>
                )}
              </div>
            )}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status Indicator</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: signOff.isSigned ? 'var(--accent-emerald)' : '#ff9500' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: signOff.isSigned ? 'var(--accent-emerald)' : '#ff9500' }}></span> {signOff.isSigned ? 'VERIFIED' : 'PENDING'}
            </span>
          </div>
        </div>

        {/* Step 6: EXPORT & FILING */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '380px', padding: '16px', borderColor: activeStep === 6 ? 'var(--accent-emerald)' : 'var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="sidebar-logo" style={{ width: '22px', height: '22px', fontSize: '11px', background: 'var(--accent-emerald)', color: '#ffffff' }}>6</span>
              <span style={{ fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Export & Filing</span>
            </div>
            <span style={{ color: 'var(--accent-emerald)', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} /> COMPLETED
            </span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>Generate audit-ready documentation and direct file with tax portals.</p>
            
            <button className="settings-btn" style={{ display: 'flex', alignItems: 'center', justifySelf: 'flex-start', gap: '8px', fontSize: '12px' }}>
              <Download size={14} /> Export Audit Report (PDF)
            </button>
            <button className="settings-btn" style={{ display: 'flex', alignItems: 'center', justifySelf: 'flex-start', gap: '8px', fontSize: '12px' }}>
              <Download size={14} /> Export XML Schema
            </button>
            
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', fontSize: '11px', marginTop: 'auto' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Portal Sync Status:</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>GSTIN: 27AAAAA1111A1Z1</span>
                <span style={{ color: 'var(--accent-emerald)' }}>CONNECTED</span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status Indicator</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--accent-emerald)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)' }}></span> COMPLETED
            </span>
          </div>
        </div>

      </div>

      {/* ─── Decision Flow Logic Diagram ─── */}
      <div className="card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-surface)', borderStyle: 'dashed' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', fontSize: '12px' }}>
          
          <div style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-card)' }}>
            Review Phase (Step 2)
          </div>

          <ArrowRight size={16} color="var(--text-muted)" />

          {/* Decision Diamond 1: ISSUES FOUND? */}
          <div style={{ 
            width: '100px', height: '100px', border: `1px solid ${checklist.some(i => i.status === 'ISSUE') ? '#ff3b30' : 'var(--border)'}`, 
            background: 'var(--bg-card)', transform: 'rotate(45deg)', display: 'flex', 
            justifyContent: 'center', alignItems: 'center', position: 'relative'
          }}>
            <div style={{ transform: 'rotate(-45deg)', textAlign: 'center', fontSize: '10px', fontWeight: 600, color: checklist.some(i => i.status === 'ISSUE') ? '#ff3b30' : 'var(--text-secondary)' }}>
              ISSUES FOUND?
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#ff3b30' }}>YES</span>
              <ArrowRight size={14} color="#ff3b30" />
              <div style={{ padding: '6px 10px', border: '1px solid #ff3b30', borderRadius: '4px', background: 'rgba(255,59,48,0.06)', fontSize: '11px' }}>
                Communication Loop (Step 4)
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-emerald)' }}>NO</span>
              <ArrowRight size={14} color="var(--accent-emerald)" />
              
              {/* Decision Diamond 2: ALL RESOLVED? */}
              <div style={{ 
                width: '100px', height: '100px', border: `1px solid ${!checklist.some(i => i.status === 'ISSUE' || i.status === 'PENDING') ? 'var(--accent-emerald)' : 'var(--border)'}`, 
                background: 'var(--bg-card)', transform: 'rotate(45deg)', display: 'flex', 
                justifyContent: 'center', alignItems: 'center'
              }}>
                <div style={{ transform: 'rotate(-45deg)', textAlign: 'center', fontSize: '10px', fontWeight: 600, color: !checklist.some(i => i.status === 'ISSUE' || i.status === 'PENDING') ? 'var(--accent-emerald)' : 'var(--text-secondary)' }}>
                  ALL RESOLVED?
                </div>
              </div>

              <ArrowRight size={14} color="var(--text-muted)" />
              <div style={{ padding: '6px 10px', border: '1px solid var(--accent-emerald)', borderRadius: '4px', background: 'rgba(52,199,89,0.08)', fontSize: '11px' }}>
                Sign-off (Step 5)
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ─── Workflow Horizontal Summary Bar ─── */}
      <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: 'Assignment Initiated', active: isInvited },
            { label: 'Review in Progress', active: activeStep >= 2 },
            { label: 'Checklist Validation', active: checklist.some(i => i.status === 'OK') },
            { label: 'Issues & Comm.', active: queries.length > 0 },
            { label: 'Verified & Sign-off', active: signOff.isSigned },
            { label: 'Export & Filing', active: signOff.isSigned },
            { label: 'Compliance Complete', active: signOff.isSigned }
          ].map((step, idx) => (
            <React.Fragment key={idx}>
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px',
                color: step.active ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: step.active ? 600 : 400
              }}>
                <span style={{ 
                  width: '18px', height: '18px', borderRadius: '50%', 
                  background: step.active ? 'var(--accent-emerald)' : 'var(--bg-surface-hover)',
                  color: step.active ? '#ffffff' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800
                }}>
                  {idx + 1}
                </span>
                <span>{step.label}</span>
              </div>
              {idx < 6 && <ArrowRight size={14} color="var(--text-muted)" style={{ opacity: 0.5 }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ─── Footer Governance info ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '11px', padding: '0 4px' }}>
        <div>Secure • Transparent • Collaborative • Compliant</div>
        <div>Real-time Status Tracking • Audit Trail • Document Management • Role-based Access</div>
      </div>

    </div>
  );
}

export default CAWorkflow;
