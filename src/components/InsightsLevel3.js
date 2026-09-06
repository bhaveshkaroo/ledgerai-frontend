import React, { useState, useEffect, useRef } from 'react';
import { InsightsEngine } from '../utils/InsightsEngine.js';
import { formatINR } from '../utils/LedgerEngine.js';
import { getGeminiApiKey, hasGeminiApiKey, callGeminiDirect, API_KEY_MISSING_MSG } from '../utils/aiConfig.js';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell 
} from 'recharts';
import { 
  ShieldAlert, Sliders, Activity, Sparkles, Send, RefreshCw, 
  AlertTriangle, CheckCircle, ArrowRight, Layers, DollarSign, Clock, Users, PieChart
} from 'lucide-react';

const cleanTextFormatting = (text) => {
  if (!text) return '';
  return text
    .replace(/\\frac\s*\{([^}]+)\}\s*\{([^}]+)\}/g, '($1 ÷ $2)')
    .replace(/\\(text|mathbf|textbf|mathit|mathrm)\s*\{([^}]+)\}/g, '$2')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([^\$]+)\$/g, '$1');
};

const InsightsLevel3 = () => {
  const [sliders, setSliders] = useState({
    revenueDeltaPct: 0,
    expenseDeltaPct: 0,
    dsoSlipDays: 0
  });

  const [data, setData] = useState(() => InsightsEngine.computeLevel3Metrics(sliders));
  const [aiQuestion, setAiQuestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiChat, setAiChat] = useState([
    {
      role: 'assistant',
      text: "### Meso Level 3 Strategic & Scenario Risk Advisor\n\nI provide CFA Level III strategic advisory and FRM-grounded risk quantification.\n\n* **Deterministic What-If Simulations**: Adjust the sensitivity sliders above to see real-time recalculations of your cash position and runway.\n* **FRM Risk Lens**: Concentration vulnerabilities, liquidity stress-testing, and volatility analysis are pre-computed in code.\n\nSelect a strategic prompt or ask a custom scenario question below."
    }
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    setData(InsightsEngine.computeLevel3Metrics(sliders));
  }, [sliders]);

  const { baseline, recalculated, redFlags, concentration, volatility, cccFlow, ratios } = data;

  const handleAskAI = async (queryText) => {
    const q = queryText || aiQuestion;
    if (!q.trim() || isAiLoading) return;

    setAiChat(prev => [...prev, { role: 'user', text: q.trim() }]);
    setAiQuestion('');
    setIsAiLoading(true);

    try {
      if (!hasGeminiApiKey()) {
        setAiChat(prev => [...prev, { role: 'assistant', text: `⚠️ ${API_KEY_MISSING_MSG}` }]);
        setIsAiLoading(false);
        return;
      }

      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (isHttps ? '' : 'http://localhost:8000');
      let answer = null;

      if (BACKEND_URL) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/insights/level3`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-Gemini-API-Key': getGeminiApiKey()
            },
            body: JSON.stringify({
              question: q,
              scenario_params: {
                revenueDeltaPct: sliders.revenueDeltaPct,
                expenseDeltaPct: sliders.expenseDeltaPct,
                dsoSlipDays: sliders.dsoSlipDays,
                baselineCash: baseline.cash,
                recalculatedCash: recalculated.cashBalance,
                stressRunwayMonths: recalculated.runwayMonths,
                delayedCashCollection: recalculated.delayedCashCollection
              },
              computed_risk_data: {
                concentration,
                volatility,
                activeRedFlags: redFlags,
                cccFlow
              }
            })
          });

          if (res.ok) {
            const resJson = await res.json();
            answer = resJson.answer;
          }
        } catch (backendErr) {
          console.warn('[InsightsLevel3] Backend unavailable, using direct Gemini client:', backendErr.message);
        }
      }

      if (!answer) {
        const sysPrompt = `You are a CFA Level III Corporate Financial Strategist & FRM Certified Risk Manager.
Analyze the provided stress-testing scenario parameters, cash runway recalculations, revenue volatility, and working capital delays.
Answer the user's question with strategic, actionable recommendations for corporate governance, liquidity preservation, and risk mitigation.
Always format currency figures in Indian Rupees (₹).
Always append this exact disclaimer: "⚠️ This is an AI-generated scenario stress-test simulation. Consult professional risk advisors before executing capital interventions."`;
        const contextPayload = `User Question: ${q}\n\nStress Testing Scenario Parameters:\n- Revenue Shift: ${sliders.revenueDeltaPct}%\n- OPEX Shift: ${sliders.expenseDeltaPct}%\n- DSO Slippage: +${sliders.dsoSlipDays} days\n- Baseline Cash: ₹${Math.round(baseline.cash || 0).toLocaleString('en-IN')}\n- Recalculated Stressed Cash: ₹${Math.round(recalculated.cashBalance || 0).toLocaleString('en-IN')}\n- Stressed Runway: ${recalculated.runwayMonths} months\n- Delayed Receivables Cash: ₹${Math.round(recalculated.delayedCashCollection || 0).toLocaleString('en-IN')}\n- Risk Signals: ${JSON.stringify(redFlags)}`;
        answer = await callGeminiDirect(contextPayload, sysPrompt);
      }

      if (answer) {
        setAiChat(prev => [...prev, { role: 'assistant', text: cleanTextFormatting(answer) }]);
      } else {
        setAiChat(prev => [...prev, { role: 'assistant', text: 'Unable to complete Level 3 AI analysis. Please verify your API key in Settings.' }]);
      }
    } catch (err) {
      console.warn('Level 3 call failed', err);
      setAiChat(prev => [...prev, { role: 'assistant', text: `⚠️ ${err.message || 'Error communicating with AI service.'}` }]);
    } finally {
      setIsAiLoading(false);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const concentrationChartData = [
    { name: 'Top 5 Customers', share: concentration.top5CustomerSharePct, fill: '#3b82f6' },
    { name: 'Other Customers', share: Number((100 - concentration.top5CustomerSharePct).toFixed(1)), fill: '#64748b' },
    { name: 'Top 5 Vendors', share: concentration.top5VendorSharePct, fill: '#8b5cf6' },
    { name: 'Other Vendors', share: Number((100 - concentration.top5VendorSharePct).toFixed(1)), fill: '#94a3b8' }
  ];

  return (
    <div className="tab-content" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Level 3: Strategic & Scenario Analysis
            </h1>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 600 }}>
              FRM Risk Quantification
            </span>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', fontWeight: 600 }}>
              What-If Stress Simulator
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Automated Red-Flag Heuristics • Sensitivity Stress-Testing • Cash Conversion Cycle • Concentration Risk
          </p>
        </div>
      </div>

      {/* SECTION 1: AUTOMATED RULE-BASED RED FLAGS */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} color="#ef4444" />
          <span>Active Diagnostic Red Flags & Heuristics</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
          {redFlags.map((flag, idx) => (
            <div key={idx} className="card" style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '10px', borderLeft: flag.severity === 'Critical' || flag.severity === 'High' ? '4px solid #ef4444' : '4px solid #f59e0b', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{flag.title}</span>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', background: flag.severity === 'Critical' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: flag.severity === 'Critical' ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>
                  {flag.severity}
                </span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {flag.metric}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {flag.cause}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: INTERACTIVE "WHAT-IF" SENSITIVITY SIMULATOR */}
      <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="#8b5cf6" />
              <span>Interactive "What-If" Sensitivity Stress-Testing</span>
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Adjust operational variables to simulate deterministic liquidity and runway outcomes in real time.
            </p>
          </div>
          <button
            onClick={() => setSliders({ revenueDeltaPct: 0, expenseDeltaPct: 0, dsoSlipDays: 0 })}
            style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            Reset Baseline
          </button>
        </div>

        {/* Sliders Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', padding: '18px', background: 'var(--bg-surface)', borderRadius: '10px', marginBottom: '20px' }}>
          
          {/* Slider 1 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
              <span>Revenue Shock / Growth:</span>
              <span style={{ color: sliders.revenueDeltaPct >= 0 ? '#10b981' : '#ef4444' }}>
                {sliders.revenueDeltaPct > 0 ? `+${sliders.revenueDeltaPct}%` : `${sliders.revenueDeltaPct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              step="5"
              value={sliders.revenueDeltaPct}
              onChange={(e) => setSliders(s => ({ ...s, revenueDeltaPct: Number(e.target.value) }))}
              style={{ width: '100%', accentColor: '#3b82f6' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>-30% Drop</span>
              <span>Baseline</span>
              <span>+30% Boom</span>
            </div>
          </div>

          {/* Slider 2 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
              <span>Expense Inflation:</span>
              <span style={{ color: sliders.expenseDeltaPct > 0 ? '#ef4444' : '#10b981' }}>
                {sliders.expenseDeltaPct > 0 ? `+${sliders.expenseDeltaPct}%` : `${sliders.expenseDeltaPct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-15"
              max="30"
              step="5"
              value={sliders.expenseDeltaPct}
              onChange={(e) => setSliders(s => ({ ...s, expenseDeltaPct: Number(e.target.value) }))}
              style={{ width: '100%', accentColor: '#ef4444' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>-15% Lean</span>
              <span>Baseline</span>
              <span>+30% Surge</span>
            </div>
          </div>

          {/* Slider 3 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
              <span>Receivable Collection Delay:</span>
              <span style={{ color: sliders.dsoSlipDays > 0 ? '#f59e0b' : '#10b981' }}>
                +{sliders.dsoSlipDays} Days Slip
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={sliders.dsoSlipDays}
              onChange={(e) => setSliders(s => ({ ...s, dsoSlipDays: Number(e.target.value) }))}
              style={{ width: '100%', accentColor: '#f59e0b' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>0 (On-Time)</span>
              <span>+30d Slip</span>
              <span>+60d Severe</span>
            </div>
          </div>

        </div>

        {/* Deterministic Real-Time Recalculation Output Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          
          <div style={{ padding: '14px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Simulated Revenue</div>
            <div style={{ fontSize: '18px', fontWeight: 700, margin: '6px 0', color: 'var(--text-primary)' }}>
              {formatINR(recalculated.revenue)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Baseline: {formatINR(baseline.revenue)}
            </div>
          </div>

          <div style={{ padding: '14px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Trapped Working Capital</div>
            <div style={{ fontSize: '18px', fontWeight: 700, margin: '6px 0', color: recalculated.delayedCashCollection > 0 ? '#ef4444' : '#10b981' }}>
              {formatINR(recalculated.delayedCashCollection)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Due to {sliders.dsoSlipDays}d collection lag
            </div>
          </div>

          <div style={{ padding: '14px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Stress Cash Position</div>
            <div style={{ fontSize: '18px', fontWeight: 700, margin: '6px 0', color: recalculated.cashBalance >= 0 ? '#3b82f6' : '#ef4444' }}>
              {formatINR(recalculated.cashBalance)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Baseline: {formatINR(baseline.cash)}
            </div>
          </div>

          <div style={{ padding: '14px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Stress Runway Buffer</div>
            <div style={{ fontSize: '18px', fontWeight: 700, margin: '6px 0', color: recalculated.runwayMonths >= 6 ? '#10b981' : recalculated.runwayMonths >= 3 ? '#f59e0b' : '#ef4444' }}>
              {recalculated.runwayMonths} Months
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Baseline: {baseline.runwayMonths} Months
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 3: CASH CONVERSION CYCLE FLOW DIAGRAM */}
      <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>
            Cash Conversion Cycle (CCC) Working Capital Flow
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            Visualizes operating cycle timeline: Days Inventory Outstanding + Days Sales Outstanding - Days Payable Outstanding.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr auto 1.2fr', alignItems: 'center', gap: '10px', padding: '20px', background: 'var(--bg-surface)', borderRadius: '10px' }}>
          
          <div style={{ padding: '14px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>1. Inventory (DIO)</div>
            <div style={{ fontSize: '20px', fontWeight: 700, margin: '6px 0', color: '#f59e0b' }}>{cccFlow.dio} Days</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Inventory: {formatINR(cccFlow.inventoryValuation)}</div>
          </div>

          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-muted)' }}>+</div>

          <div style={{ padding: '14px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>2. Receivables (DSO)</div>
            <div style={{ fontSize: '20px', fontWeight: 700, margin: '6px 0', color: '#3b82f6' }}>{cccFlow.dso} Days</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Receivables: {formatINR(cccFlow.receivablesValuation)}</div>
          </div>

          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-muted)' }}>-</div>

          <div style={{ padding: '14px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>3. Payables (DPO)</div>
            <div style={{ fontSize: '20px', fontWeight: 700, margin: '6px 0', color: '#10b981' }}>{cccFlow.dpo} Days</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Payables: {formatINR(cccFlow.payablesValuation)}</div>
          </div>

          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-muted)' }}>=</div>

          <div style={{ padding: '16px', background: 'rgba(16,185,129,0.08)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#10b981', fontWeight: 700 }}>Net Cash Conversion</div>
            <div style={{ fontSize: '22px', fontWeight: 800, margin: '6px 0', color: cccFlow.netCCC <= 0 ? '#10b981' : '#f59e0b' }}>
              {cccFlow.netCCC} Days
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cccFlow.netCCC <= 0 ? 'Negative (Supplier Float Advantage)' : 'Working Capital Required'}</div>
          </div>

        </div>
      </div>

      {/* SECTION 4: FRM RISK & CONCENTRATION METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' }}>
        
        {/* Customer & Vendor Concentration */}
        <div className="card" style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="#3b82f6" />
            <span>Counterparty Concentration Risk</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>Top 5 Customers Revenue Share:</span>
                <span style={{ fontWeight: 700, color: '#3b82f6' }}>{concentration.top5CustomerSharePct}%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${concentration.top5CustomerSharePct}%`, height: '100%', background: '#3b82f6' }}></div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Primary Client: <strong>{concentration.topCustomerName}</strong> ({concentration.topCustomerSharePct}% of sales)
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>Top 5 Vendors Payable Share:</span>
                <span style={{ fontWeight: 700, color: '#8b5cf6' }}>{concentration.top5VendorSharePct}%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${concentration.top5VendorSharePct}%`, height: '100%', background: '#8b5cf6' }}></div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Primary Supplier: <strong>{concentration.topVendorName}</strong> ({concentration.topVendorSharePct}% of spend)
              </div>
            </div>
          </div>
        </div>

        {/* Volatility & Runway */}
        <div className="card" style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#10b981" />
            <span>Revenue Volatility & Liquidity Coverage</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '14px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Revenue Volatility ($CV$)</div>
              <div style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0', color: 'var(--text-primary)' }}>
                {volatility.cvPct}%
              </div>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontWeight: 600 }}>
                {volatility.rating}
              </span>
            </div>

            <div style={{ padding: '14px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Standard Deviation ($\sigma$)</div>
              <div style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0', color: 'var(--text-primary)' }}>
                {formatINR(volatility.stdDev)}
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Monthly Dispersion</span>
            </div>
          </div>

          <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-secondary)', padding: '10px', background: 'rgba(59,130,246,0.06)', borderRadius: '8px', lineHeight: 1.5 }}>
            💡 <strong>FRM Benchmark:</strong> An SME revenue $CV$ under 25% represents strong recurring demand stability.
          </div>
        </div>

      </div>

      {/* SECTION 5: EMBEDDED LEVEL 3 GEMINI STRATEGIC ADVISOR PANEL */}
      <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="#8b5cf6" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Level 3 AI Strategic & Risk Advisor</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Powered by gemini-3.6-flash • CFA Level III Corporate Strategy & FRM Risk Framework
            </p>
          </div>
        </div>

        {/* Quick Analytical Presets */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {[
            "Evaluate top customer concentration and default vulnerability",
            "Assess liquidity risk if receivables slip by 45 days",
            "Analyze gross margin compression vulnerabilities against cost inflation",
            "Provide an executive debt restructuring and solvency review"
          ].map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleAskAI(preset)}
              disabled={isAiLoading}
              style={{
                fontSize: '11px',
                padding: '6px 12px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              💡 {preset}
            </button>
          ))}
        </div>

        {/* Chat History Box */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: '10px', padding: '16px', maxHeight: '380px', overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {aiChat.map((msg, i) => (
            <div 
              key={i} 
              style={{ 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '90%',
                padding: '12px 16px',
                borderRadius: '10px',
                background: msg.role === 'user' ? 'var(--text-primary)' : 'var(--bg-card)',
                color: msg.role === 'user' ? 'var(--bg-card)' : 'var(--text-primary)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                fontSize: '13px',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap'
              }}
            >
              {msg.text}
            </div>
          ))}
          {isAiLoading && (
            <div style={{ alignSelf: 'flex-start', padding: '12px 16px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={14} className="spin" />
              <span>Analyzing scenario stress vectors and counterparty risk...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Ask the Level 3 Strategic Advisor about stress-tests, concentration risks, or scenario outcomes..."
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
            disabled={isAiLoading}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <button
            onClick={() => handleAskAI()}
            disabled={isAiLoading || !aiQuestion.trim()}
            style={{
              padding: '0 20px',
              borderRadius: '8px',
              background: 'var(--text-primary)',
              color: 'var(--bg-card)',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Send size={14} /> Send
          </button>
        </div>

      </div>

    </div>
  );
};

export default InsightsLevel3;
