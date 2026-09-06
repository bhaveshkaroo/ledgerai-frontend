import React, { useState, useEffect, useRef } from 'react';
import { InsightsEngine } from '../utils/InsightsEngine.js';
import { formatINR } from '../utils/LedgerEngine.js';
import { getGeminiApiKey, hasGeminiApiKey, callGeminiDirect, API_KEY_MISSING_MSG } from '../utils/aiConfig.js';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area, Cell
} from 'recharts';
import { 
  TrendingUp, Activity, BarChart2, Sparkles, ShieldCheck, 
  Send, Bot, RefreshCw, Calendar, ArrowUpRight, ArrowDownRight, Layers, HelpCircle, AlertCircle
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

const InsightsLevel2 = () => {
  const [data, setData] = useState(() => InsightsEngine.computeLevel2Metrics());
  const [activeChartTab, setActiveChartTab] = useState('forecast');
  const [aiQuestion, setAiQuestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiChat, setAiChat] = useState([
    {
      role: 'assistant',
      text: "### Meso Level 2 Deep Trend & Forecasting Engine\n\nI provide CFA Level II quantitative analysis grounded in your pre-computed time-series regressions, moving averages, and cash-flow waterfall dynamics.\n\n* **Deterministic Projections**: Linear regressions and 3M-SMAs are computed in code, not estimated by AI.\n* **Auditable Methodology**: All projections cite their exact mathematical foundation.\n\nSelect any analytical prompt below or submit a custom question."
    }
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const handleUpdate = () => {
      setData(InsightsEngine.computeLevel2Metrics());
    };
    window.addEventListener('ledger-updated', handleUpdate);
    return () => window.removeEventListener('ledger-updated', handleUpdate);
  }, []);

  const { historicalSeries, compositeChartData, revRegression, cashRegression, waterfallStages, l1Metrics } = data;
  const { ratios, financials } = l1Metrics;

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
          const res = await fetch(`${BACKEND_URL}/api/insights/level2`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-Gemini-API-Key': getGeminiApiKey()
            },
            body: JSON.stringify({
              question: q,
              computed_data: {
                regression: {
                  revenueSlope: revRegression.slope,
                  rSquared: revRegression.rSquared,
                  method: revRegression.method
                },
                recentTrailingPeriods: historicalSeries.slice(-6),
                projections: revRegression.projections,
                cashProjections: cashRegression.projections
              }
            })
          });

          if (res.ok) {
            const resJson = await res.json();
            answer = resJson.answer;
          }
        } catch (backendErr) {
          console.warn('[InsightsLevel2] Backend unavailable, using direct Gemini client:', backendErr.message);
        }
      }

      if (!answer) {
        const sysPrompt = `You are a CFA Level II Quantitative Financial Analyst. 
Analyze the provided regression models, historical periods, and trend projections. 
Answer the user question rigorously with statistical confidence, slope interpretations, and actionable financial commentary.
Always format currency figures in Indian Rupees (₹).
Always append this exact disclaimer: "⚠️ This is an AI-generated quantitative forecast based on linear regression. Actual future performance may vary."`;
        const contextPayload = `User Question: ${q}\n\nQuantitative Financial Models:\n- Revenue Slope: ₹${Math.round(revRegression.slope || 0).toLocaleString('en-IN')}/month (R²: ${revRegression.rSquared})\n- Method: ${revRegression.method}\n- Recent 6-Month Data: ${JSON.stringify(historicalSeries.slice(-6))}\n- Projected Revenue Next 6 Months: ${JSON.stringify(revRegression.projections)}\n- Projected Cash Balance Next 6 Months: ${JSON.stringify(cashRegression.projections)}`;
        answer = await callGeminiDirect(contextPayload, sysPrompt);
      }

      if (answer) {
        setAiChat(prev => [...prev, { role: 'assistant', text: cleanTextFormatting(answer) }]);
      } else {
        setAiChat(prev => [...prev, { role: 'assistant', text: 'Unable to complete Level 2 AI analysis. Please verify your API key in Settings.' }]);
      }
    } catch (err) {
      console.warn('Level 2 call failed', err);
      setAiChat(prev => [...prev, { role: 'assistant', text: `⚠️ ${err.message || 'Error communicating with AI service.'}` }]);
    } finally {
      setIsAiLoading(false);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="tab-content" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Level 2: Deep Trend & Forecast Engine
            </h1>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 600 }}>
              CFA Quantitative Modeling
            </span>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontWeight: 600 }}>
              OLS Linear Regression
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Deterministic Trend Analysis • Moving Average Smoothing • Cash Waterfall • DuPont ROE Decomposition
          </p>
        </div>
        <div style={{ padding: '6px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={14} color="var(--text-muted)" />
          <span>FY 2024–26 (3-Year Verified Run-Rate)</span>
        </div>
      </div>

      {/* Top 4 Quantitative Mathematical KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        
        {/* Card 1: Regression Trend Velocity */}
        <div className="card" style={{ padding: '18px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>MONTHLY RUN-RATE MOMENTUM</span>
            <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: revRegression.slope >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: revRegression.slope >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
              {revRegression.slope >= 0 ? '+ Expansion' : '- Contraction'}
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatINR(revRegression.slope)} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>/ mo</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Linear Trend Slope (OLS Regression)
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px dashed var(--border)', paddingTop: '6px' }}>
            Goodness of Fit ($R^2$): <strong>{(revRegression.rSquared * 100).toFixed(1)}%</strong>
          </div>
        </div>

        {/* Card 2: 3M-SMA Filtered Revenue */}
        <div className="card" style={{ padding: '18px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>3M MOVING AVERAGE</span>
            <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontWeight: 600 }}>
              Smoothed
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatINR(historicalSeries[historicalSeries.length - 1]?.revenue_3M_SMA || 0)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Trailing 3-Month Moving Average
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px dashed var(--border)', paddingTop: '6px' }}>
            Latest Month Actual: <strong>{formatINR(historicalSeries[historicalSeries.length - 1]?.revenue || 0)}</strong>
          </div>
        </div>

        {/* Card 3: Next Period OLS Projection */}
        <div className="card" style={{ padding: '18px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>NEXT MONTH FORECAST (P+1)</span>
            <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 600 }}>
              Estimate
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
            {formatINR(revRegression.projections[0]?.projectedValue || 0)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Method: OLS Historical Regression
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px dashed var(--border)', paddingTop: '6px' }}>
            Statistical Range: {formatINR(revRegression.projections[0]?.lowerBand || 0)} – {formatINR(revRegression.projections[0]?.upperBand || 0)}
          </div>
        </div>

        {/* Card 4: Operating Spread */}
        <div className="card" style={{ padding: '18px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>CASH CONVERSION CYCLE</span>
            <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: ratios.efficiency.ccc <= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', color: ratios.efficiency.ccc <= 0 ? '#10b981' : '#3b82f6', fontWeight: 600 }}>
              {ratios.efficiency.ccc} Days
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatINR(financials.grossProfit)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Gross Profit ({ratios.profitability.grossMargin}%)
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px dashed var(--border)', paddingTop: '6px' }}>
            Net Profit Margin: <strong>{ratios.profitability.netMargin}%</strong>
          </div>
        </div>

      </div>

      {/* Chart Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '20px', paddingBottom: '2px' }}>
        {[
          { id: 'forecast', label: 'OLS Trend & Continuous Projection Chart', icon: TrendingUp },
          { id: 'waterfall', label: 'Cash Flow Waterfall Breakdown', icon: Layers },
          { id: 'dupont', label: 'DuPont ROE Decomposition Diagram', icon: Activity },
          { id: 'table', label: 'MoM & QoQ Granular Series Table', icon: BarChart2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeChartTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveChartTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--text-primary)' : '2px solid transparent',
                background: isActive ? 'rgba(0,0,0,0.03)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <Icon size={16} color={isActive ? 'var(--text-primary)' : 'var(--text-muted)'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CHART TAB 1: CONTINUOUS FORECAST CHART */}
      {activeChartTab === 'forecast' && (
        <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>
                Historical Run-Rate vs. OLS Linear Regression Projections
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Solid lines indicate verified ledger actuals; dashed amber line indicates OLS statistical projections for the trailing 3 forecast periods.
              </p>
            </div>
            <div style={{ fontSize: '11px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
              Method: {revRegression.method}
            </div>
          </div>

          <div style={{ height: '360px', width: '100%', marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={compositeChartData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(val, name) => [formatINR(val), name === 'actualRevenue' ? 'Actual Revenue' : name === 'revenue_3M_SMA' ? '3M-SMA Trend' : name === 'projectedRevenue' ? 'Projected Revenue (OLS)' : name]}
                  contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="actualRevenue" name="Actual Revenue" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="revenue_3M_SMA" name="3-Month SMA Filter" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="projectedRevenue" name="OLS Forecast (P+1 to P+3)" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 5, fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} color="#f59e0b" />
            <span>
              <strong>Statistical Estimate Disclaimer:</strong> Future projections are mathematical extrapolations of historical 12-month trailing moving averages and do not represent contractual commitments.
            </span>
          </div>
        </div>
      )}

      {/* CHART TAB 2: CASH FLOW WATERFALL */}
      {activeChartTab === 'waterfall' && (
        <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>
              Cash Flow Waterfall: Liquidity Formation Dynamics
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Visualizes step-by-step cash inflows and operational disbursements driving net cash position.
            </p>
          </div>

          <div style={{ height: '340px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallStages} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(val) => `₹${(val/100000).toFixed(1)}L`} />
                <Tooltip 
                  formatter={(val) => [formatINR(val), 'Amount']}
                  contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {waterfallStages.map((entry, index) => {
                    const color = entry.type === 'starting' ? '#8b5cf6' 
                      : entry.type === 'inflow' ? '#10b981' 
                      : entry.type === 'outflow' ? '#ef4444' 
                      : '#3b82f6';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', background: '#8b5cf6', borderRadius: '2px' }}></div> Opening Balance</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '2px' }}></div> Operating Inflow</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '2px' }}></div> Disbursements / Outflows</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '2px' }}></div> Closing Cash</span>
          </div>
        </div>
      )}

      {/* CHART TAB 3: DUPONT ROE DECOMPOSITION DIAGRAM */}
      {activeChartTab === 'dupont' && (
        <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>
              Structural DuPont ROE Decomposition Tree
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              CFA 3-Step Driver Decomposition: Operating Margin × Asset Turnover × Financial Leverage.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr auto 1.2fr', alignItems: 'center', gap: '12px', padding: '24px', background: 'var(--bg-surface)', borderRadius: '12px', marginBottom: '20px' }}>
            
            {/* Step 1 */}
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>1. Net Profit Margin</div>
              <div style={{ fontSize: '20px', fontWeight: 700, margin: '8px 0', color: ratios.dupont.netProfitMarginPct >= 0 ? '#10b981' : '#ef4444' }}>
                {ratios.dupont.netProfitMarginPct}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PAT ÷ Revenue<br />(₹{financials.netProfit.toLocaleString('en-IN')} ÷ ₹{financials.revenue.toLocaleString('en-IN')})</div>
            </div>

            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-muted)' }}>×</div>

            {/* Step 2 */}
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>2. Asset Turnover</div>
              <div style={{ fontSize: '20px', fontWeight: 700, margin: '8px 0', color: '#3b82f6' }}>
                {ratios.dupont.assetTurnover}x
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Revenue ÷ Assets<br />(₹{financials.revenue.toLocaleString('en-IN')} ÷ ₹{financials.totalAssets.toLocaleString('en-IN')})</div>
            </div>

            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-muted)' }}>×</div>

            {/* Step 3 */}
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>3. Equity Multiplier</div>
              <div style={{ fontSize: '20px', fontWeight: 700, margin: '8px 0', color: '#8b5cf6' }}>
                {ratios.dupont.equityMultiplier}x
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Assets ÷ Equity<br />(₹{financials.totalAssets.toLocaleString('en-IN')} ÷ ₹{financials.totalEquity.toLocaleString('en-IN')})</div>
            </div>

            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-muted)' }}>=</div>

            {/* ROE Target Node */}
            <div style={{ padding: '18px', background: 'rgba(59,130,246,0.08)', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#3b82f6', fontWeight: 700 }}>Return on Equity (ROE)</div>
              <div style={{ fontSize: '24px', fontWeight: 800, margin: '8px 0', color: ratios.dupont.roeResult >= 0 ? '#10b981' : '#ef4444' }}>
                {ratios.dupont.roeResult}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Compounded ROE Return</div>
            </div>

          </div>
        </div>
      )}

      {/* CHART TAB 4: GRANULAR MOM/QOQ TABLE */}
      {activeChartTab === 'table' && (
        <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>
              Month-over-Month (MoM) Financial Velocity & Spread Table
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Computed growth percentages, 3-Month Moving Averages, and Operating Spreads.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px' }}>Month</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Revenue</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>MoM Growth</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>3M-SMA Revenue</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Operating Expenses</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Net Cashflow</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Gross Margin</th>
                </tr>
              </thead>
              <tbody>
                {historicalSeries.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px', fontWeight: 500 }}>{row.month}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>{formatINR(row.revenue)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: row.momRevGrowth >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                      {row.momRevGrowth > 0 ? `+${row.momRevGrowth}%` : `${row.momRevGrowth}%`}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', color: 'var(--text-secondary)' }}>{formatINR(row.revenue_3M_SMA)}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{formatINR(row.expenses)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: row.netCashFlow >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                      {formatINR(row.netCashFlow)}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#3b82f6', fontWeight: 600 }}>{row.grossMarginPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Embedded Level 2 Gemini CFA Quantitative Analyst Panel */}
      <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="#3b82f6" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Level 2 AI Trend & Forecast Analyst</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Powered by gemini-3.6-flash • CFA Level II Quantitative Modeling Framework
            </p>
          </div>
        </div>

        {/* Quick Analytical Presets */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {[
            "Analyze momentum and inflection points in historical revenue",
            "Explain the OLS regression slope and forecast assumptions",
            "Evaluate seasonal fluctuations vs 3M-SMA trendline",
            "Diagnose cash flow waterfall leakages across operating stages"
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
              <span>Analyzing quantitative regressions and waterfall dynamics...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Ask the Level 2 Quantitative Analyst a question about trends, regressions, or forecasts..."
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

export default InsightsLevel2;
