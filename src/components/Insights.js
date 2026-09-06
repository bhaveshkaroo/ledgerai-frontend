import React, { useState, useEffect, useRef } from 'react';
import { FinancialAnalysisEngine } from '../utils/FinancialAnalysisEngine.js';
import { formatINR } from '../utils/LedgerEngine.js';
import { 
  TrendingUp, Activity, PieChart, BarChart2, 
  Sparkles, ShieldCheck, 
  Send, Bot, RefreshCw, Layers, Calendar
} from 'lucide-react';

import { getGeminiApiKey, callGeminiDirect, API_KEY_MISSING_MSG, hasGeminiApiKey } from '../utils/aiConfig';

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

const Insights = () => {
  const [metrics, setMetrics] = useState(FinancialAnalysisEngine.computeMetrics());
  const [activeSubTab, setActiveSubTab] = useState('ratios');
  const [aiQuestion, setAiQuestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiChat, setAiChat] = useState([
    {
      role: 'assistant',
      text: "Welcome to Meso Financial Insights & Forecasting!\n\nI provide CFA-grounded financial statement analysis, ratio diagnostics, DuPont ROE decomposition, and statistical trend forecasting grounded in your actual ledger data.\n\nClick any preset below or ask a custom analytical question."
    }
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const handleUpdate = () => {
      setMetrics(FinancialAnalysisEngine.computeMetrics());
    };
    window.addEventListener('ledger-updated', handleUpdate);
    return () => window.removeEventListener('ledger-updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (activeSubTab === 'ai') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiChat, isAiLoading, activeSubTab]);

  const { financials, ratios, monthlyData, forecast } = metrics;

  const buildContextForAI = () => {
    return `
--- VERIFIED FINANCIAL DATA (FY 2025-26) ---
• Total Revenue: Rs. ${financials.revenue.toLocaleString('en-IN')}
• Cost of Goods Sold (COGS): Rs. ${financials.cogs.toLocaleString('en-IN')}
• Gross Profit: Rs. ${financials.grossProfit.toLocaleString('en-IN')} (Gross Margin: ${ratios.profitability.grossMargin}%)
• Operating Profit (EBIT): Rs. ${financials.ebit.toLocaleString('en-IN')} (Operating Margin: ${ratios.profitability.operatingMargin}%)
• Net Profit (PAT): Rs. ${financials.netProfit.toLocaleString('en-IN')} (Net Margin: ${ratios.profitability.netMargin}%)
• Cash & Bank Balance: Rs. ${financials.cash.toLocaleString('en-IN')}
• Accounts Receivable: Rs. ${financials.ar.toLocaleString('en-IN')}
• Inventory Valuation: Rs. ${financials.inventory.toLocaleString('en-IN')}
• Current Assets: Rs. ${financials.currentAssets.toLocaleString('en-IN')}
• Quick Assets (Cash + AR): Rs. ${financials.quickAssets.toLocaleString('en-IN')}
• Accounts Payable: Rs. ${financials.ap.toLocaleString('en-IN')}
• Current Liabilities: Rs. ${financials.currentLiabilities.toLocaleString('en-IN')}
• Net Working Capital: Rs. ${financials.netWorkingCapital.toLocaleString('en-IN')}
• Total Debt (Bank Loan): Rs. ${financials.totalDebt.toLocaleString('en-IN')}
• Total Equity (Share Capital + Reserves + PAT): Rs. ${financials.totalEquity.toLocaleString('en-IN')}
• Total Assets: Rs. ${financials.totalAssets.toLocaleString('en-IN')}

--- CFA RATIOS ---
• Liquidity: Current Ratio = ${ratios.liquidity.currentRatio}x, Quick Ratio = ${ratios.liquidity.quickRatio}x, Cash Ratio = ${ratios.liquidity.cashRatio}x
• Operating Efficiency: Days Sales Outstanding (DSO) = ${ratios.efficiency.dso} days, Days Payable Outstanding (DPO) = ${ratios.efficiency.dpo} days, Days Inventory Outstanding (DIO) = ${ratios.efficiency.dio} days, Cash Conversion Cycle (CCC) = ${ratios.efficiency.ccc} days, Inventory Turnover = ${ratios.efficiency.inventoryTurnover}x, Total Asset Turnover = ${ratios.efficiency.assetTurnover}x
• Solvency: Debt-to-Equity = ${ratios.solvency.debtToEquity}x, Debt-to-Assets = ${ratios.solvency.debtToAssets}x, Financial Leverage Multiplier = ${ratios.solvency.equityMultiplier}x, Interest Coverage = ${ratios.solvency.interestCoverage}x
• Profitability & Return: Gross Margin = ${ratios.profitability.grossMargin}%, Operating Margin = ${ratios.profitability.operatingMargin}%, Net Margin = ${ratios.profitability.netMargin}%, ROA = ${ratios.profitability.roa}%, ROE = ${ratios.profitability.roe}%
• DuPont 3-Step ROE Decomposition: Net Profit Margin (${ratios.dupont.netProfitMarginPct}%) × Asset Turnover (${ratios.dupont.assetTurnover}x) × Equity Multiplier (${ratios.dupont.equityMultiplier}x) = ROE (${ratios.dupont.roeResult}%)

--- MONTHLY HISTORICAL TREND (FY 2025-26) ---
${monthlyData.map(m => `• ${m.month}: Revenue Rs. ${m.revenue.toLocaleString('en-IN')}, Expenses Rs. ${m.expenses.toLocaleString('en-IN')}, Net Cashflow Rs. ${m.netCashFlow.toLocaleString('en-IN')}`).join('\n')}

--- STATISTICAL FORECAST (12-Month Run-Rate Estimate) ---
• Basis: ${forecast.basis}
• Next Month (${forecast.nextMonth.period}): Estimated Revenue Rs. ${forecast.nextMonth.estimatedRevenue.toLocaleString('en-IN')}, Estimated Expenses Rs. ${forecast.nextMonth.estimatedExpenses.toLocaleString('en-IN')}, Estimated Cash Balance Rs. ${forecast.nextMonth.estimatedCashBalance.toLocaleString('en-IN')}
• Next Quarter (${forecast.nextQuarter.period}): Estimated Revenue Rs. ${forecast.nextQuarter.estimatedRevenue.toLocaleString('en-IN')}, Estimated Expenses Rs. ${forecast.nextQuarter.estimatedExpenses.toLocaleString('en-IN')}, Estimated Cash Balance Rs. ${forecast.nextQuarter.estimatedCashBalance.toLocaleString('en-IN')}
• Disclaimer: ${forecast.disclaimer}
`;
  };

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
          const res = await fetch(`${BACKEND_URL}/api/insights/analyze`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Gemini-API-Key': getGeminiApiKey()
            },
            body: JSON.stringify({
              question: q,
              financial_context: {
                 metrics: metrics,
                 monthlyData: monthlyData,
                 forecast: forecast
              }
            })
          });

          if (res.ok) {
            const data = await res.json();
            answer = data.answer;
          }
        } catch (backendErr) {
          console.warn('[Insights] Backend unavailable, using direct Gemini client:', backendErr.message);
        }
      }

      if (!answer) {
        const contextStr = buildContextForAI();
        const sysPrompt = `You are a senior financial analyst and CFO for an Indian MSME.
Your role is to analyze the user's financial context and provide strategic, actionable insights answering their question.
Format your answer clearly using bullet points and appropriate financial terminology.
Always use the financial data provided in the context to support your analysis.
Always format currency figures in Indian Rupees with the standard ₹ symbol and INR numbering.
Always append this exact disclaimer at the very end of your response: "⚠️ This is an AI-generated analysis based on current ledger data. Please consult a qualified financial advisor before making strategic decisions."`;
        answer = await callGeminiDirect(`User Question: ${q}\n\nFinancial Context:\n${contextStr}`, sysPrompt);
      }

      if (answer) {
        setAiChat(prev => [...prev, { role: 'assistant', text: cleanTextFormatting(answer) }]);
      } else {
        setAiChat(prev => [...prev, { role: 'assistant', text: "Unable to complete AI analysis. Please check your API key." }]);
      }
    } catch (err) {
      console.error('[Insights] Error:', err);
      setAiChat(prev => [...prev, { role: 'assistant', text: `⚠️ ${err.message || 'Error communicating with AI service.'}` }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="tab-content" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Financial Insights & Forecasting</h1>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontWeight: 600 }}>CFA-Grounded</span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Financial Ratio Diagnostics • DuPont Decomposition • Run-Rate Forecasts (FY 2025-26)
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '6px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} color="var(--text-muted)" />
            <span>FY 2025-26 (Full Year)</span>
          </div>
        </div>
      </div>

      {/* Top Strategic Overview KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        
        {/* Card 1: Liquidity */}
        <div className="card" style={{ padding: '18px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>LIQUIDITY BUFFER</span>
            <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: ratios.liquidity.currentRatio >= 1.5 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: ratios.liquidity.currentRatio >= 1.5 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
              {ratios.liquidity.currentRatio >= 1.5 ? 'Optimal' : 'Tight'}
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{ratios.liquidity.currentRatio}x</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Quick Ratio: <strong>{ratios.liquidity.quickRatio}x</strong></span>
            <span>Cash Ratio: <strong>{ratios.liquidity.cashRatio}x</strong></span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px dashed var(--border)', paddingTop: '6px' }}>
            Working Capital: <strong>{formatINR(ratios.liquidity.netWorkingCapital)}</strong>
          </div>
        </div>

        {/* Card 2: Cash Conversion Cycle */}
        <div className="card" style={{ padding: '18px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>CASH CONVERSION (CCC)</span>
            <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: ratios.efficiency.ccc <= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', color: ratios.efficiency.ccc <= 0 ? '#10b981' : '#3b82f6', fontWeight: 600 }}>
              {ratios.efficiency.ccc <= 0 ? 'Negative (Advantage)' : 'Normal'}
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{ratios.efficiency.ccc} days</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
            <span>DSO: <strong>{ratios.efficiency.dso}d</strong></span>
            <span>DPO: <strong>{ratios.efficiency.dpo}d</strong></span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px dashed var(--border)', paddingTop: '6px' }}>
            DIO: <strong>{ratios.efficiency.dio} days</strong> (Turnover: {ratios.efficiency.inventoryTurnover}x)
          </div>
        </div>

        {/* Card 3: Solvency */}
        <div className="card" style={{ padding: '18px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>DEBT / EQUITY</span>
            <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: ratios.solvency.debtToEquity <= 1 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: ratios.solvency.debtToEquity <= 1 ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
              {ratios.solvency.debtToEquity <= 1 ? 'Conservative' : 'Leveraged'}
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{ratios.solvency.debtToEquity}x</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Total Debt: <strong>{formatINR(financials.totalDebt)}</strong></span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px dashed var(--border)', paddingTop: '6px' }}>
            Equity Multiplier: <strong>{ratios.solvency.equityMultiplier}x</strong>
          </div>
        </div>

        {/* Card 4: Profitability */}
        <div className="card" style={{ padding: '18px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>GROSS MARGIN</span>
            <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontWeight: 600 }}>
              Margin
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{ratios.profitability.grossMargin}%</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Net Margin: <strong>{ratios.profitability.netMargin}%</strong></span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px dashed var(--border)', paddingTop: '6px' }}>
            Return on Equity (ROE): <strong>{ratios.profitability.roe}%</strong>
          </div>
        </div>

      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '20px', paddingBottom: '2px' }}>
        {[
          { id: 'ratios', label: 'CFA Financial Ratios', icon: Activity },
          { id: 'dupont', label: 'DuPont ROE Analysis', icon: PieChart },
          { id: 'trends', label: 'Historical Trend Dynamics', icon: BarChart2 },
          { id: 'forecast', label: '30/90-Day Forecasts', icon: TrendingUp },
          { id: 'ai', label: 'AI CFA Analyst Advisor', icon: Sparkles }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
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

      {/* SUBTAB 1: RATIOS */}
      {activeSubTab === 'ratios' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          
          {/* Liquidity Section */}
          <div className="card" style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#10b981" />
              <span>Liquidity & Short-Term Solvency</span>
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Current Ratio</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Current Assets ÷ Current Liabilities</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{ratios.liquidity.currentRatio}x</div>
                  <div style={{ fontSize: '11px', color: '#10b981' }}>Benchmark: &gt; 1.33x (RBI/Tandon)</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Quick Ratio (Acid Test)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Cash + Trade Receivables) ÷ Current Liabilities</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{ratios.liquidity.quickRatio}x</div>
                  <div style={{ fontSize: '11px', color: '#10b981' }}>Benchmark: &gt; 1.0x</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Cash Ratio</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cash &amp; Bank ÷ Current Liabilities</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{ratios.liquidity.cashRatio}x</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cash buffer for immediate dues</div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '10px', background: 'rgba(59,130,246,0.06)', borderRadius: '8px', borderLeft: '3px solid #3b82f6', lineHeight: 1.5 }}>
                💡 <strong>CFA Takeaway:</strong> Current ratio of {ratios.liquidity.currentRatio}x and Quick ratio of {ratios.liquidity.quickRatio}x confirm excellent short-term solvency. The business can cover all short-term payables and statutory taxes without relying on inventory liquidations.
              </div>
            </div>
          </div>

          {/* Efficiency Section */}
          <div className="card" style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#3b82f6" />
              <span>Operating Efficiency & Working Capital Cycle</span>
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Days Sales Outstanding (DSO)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Collection velocity from customers</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{ratios.efficiency.dso} days</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Receivables: {formatINR(financials.ar)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Days Payable Outstanding (DPO)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Payment period extended to vendors</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{ratios.efficiency.dpo} days</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Payables: {formatINR(financials.ap)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Days Inventory Outstanding (DIO)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Inventory holding days (AS 2 FIFO)</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{ratios.efficiency.dio} days</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Turnover: {ratios.efficiency.inventoryTurnover}x</div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '10px', background: 'rgba(16,185,129,0.06)', borderRadius: '8px', borderLeft: '3px solid #10b981', lineHeight: 1.5 }}>
                💡 <strong>CFA Takeaway:</strong> Cash Conversion Cycle of <strong>{ratios.efficiency.ccc} days</strong> is negative because vendor credit (DPO: {ratios.efficiency.dpo}d) substantially exceeds collection period (DSO: {ratios.efficiency.dso}d). This creates significant working capital float.
              </div>
            </div>
          </div>

          {/* Solvency Section */}
          <div className="card" style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#8b5cf6" />
              <span>Capital Structure & Leverage</span>
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Debt-to-Equity</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bank Borrowings ÷ Total Equity</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{ratios.solvency.debtToEquity}x</div>
                  <div style={{ fontSize: '11px', color: '#10b981' }}>Comfortable (&lt; 1.5x)</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Financial Leverage (Equity Multiplier)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Assets ÷ Total Equity</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{ratios.solvency.equityMultiplier}x</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CFA Balance Sheet Multiplier</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Total Debt Ratio</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Debt ÷ Total Assets</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{(ratios.solvency.debtToAssets * 100).toFixed(1)}%</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Assets funded by debt</div>
                </div>
              </div>
            </div>
          </div>

          {/* Profitability Section */}
          <div className="card" style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="#f59e0b" />
              <span>Profit Margins & Asset Returns</span>
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Gross Profit Margin</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Gross Profit ÷ Total Revenue</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#10b981' }}>{ratios.profitability.grossMargin}%</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Gross Profit: {formatINR(financials.grossProfit)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Operating Margin (EBIT Margin)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Operating Profit ÷ Total Revenue</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{ratios.profitability.operatingMargin}%</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>EBIT: {formatINR(financials.ebit)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Net Profit Margin (PAT Margin)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Net Profit ÷ Total Revenue</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#ef4444' }}>{ratios.profitability.netMargin}%</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PAT: {formatINR(financials.netProfit)}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SUBTAB 2: DUPONT */}
      {activeSubTab === 'dupont' && (
        <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px 0' }}>DuPont 3-Step ROE Decomposition</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Decomposes Return on Equity into Operating Profitability (Margin), Asset Efficiency (Turnover), and Financial Leverage (Multiplier).
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr auto 1.2fr', alignItems: 'center', gap: '12px', padding: '20px', background: 'var(--bg-surface)', borderRadius: '10px', marginBottom: '20px' }}>
            
            {/* Step 1 */}
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Step 1: Profitability</div>
              <div style={{ fontSize: '18px', fontWeight: 700, margin: '8px 0', color: ratios.dupont.netProfitMarginPct >= 0 ? '#10b981' : '#ef4444' }}>
                {ratios.dupont.netProfitMarginPct}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Net Profit Margin<br />(PAT ÷ Revenue)</div>
            </div>

            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-muted)' }}>×</div>

            {/* Step 2 */}
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Step 2: Efficiency</div>
              <div style={{ fontSize: '18px', fontWeight: 700, margin: '8px 0', color: '#3b82f6' }}>
                {ratios.dupont.assetTurnover}x
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Asset Turnover<br />(Revenue ÷ Assets)</div>
            </div>

            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-muted)' }}>×</div>

            {/* Step 3 */}
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Step 3: Leverage</div>
              <div style={{ fontSize: '18px', fontWeight: 700, margin: '8px 0', color: '#8b5cf6' }}>
                {ratios.dupont.equityMultiplier}x
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Equity Multiplier<br />(Assets ÷ Equity)</div>
            </div>

            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-muted)' }}>=</div>

            {/* Result */}
            <div style={{ padding: '16px', background: 'rgba(59,130,246,0.08)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#3b82f6', fontWeight: 700 }}>Return on Equity</div>
              <div style={{ fontSize: '22px', fontWeight: 800, margin: '8px 0', color: ratios.dupont.roeResult >= 0 ? '#10b981' : '#ef4444' }}>
                {ratios.dupont.roeResult}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Calculated ROE (PAT ÷ Equity)</div>
            </div>

          </div>

          <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '8px', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            <strong>CFA Diagnostic Interpretation:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li><strong>Asset Turnover ({ratios.dupont.assetTurnover}x):</strong> Every rupee of total assets generates ₹0.55 in top-line revenue. Optimizing inventory velocity and receivables turnover will improve asset efficiency.</li>
              <li><strong>Financial Leverage ({ratios.dupont.equityMultiplier}x):</strong> Assets exceed equity by 2.82x, indicating moderate leverage primarily funded through term loans (₹20,00,000) and supplier payables (₹39,35,460).</li>
              <li><strong>Net Margin ({ratios.dupont.netProfitMarginPct}%):</strong> Operational deficit and tax provisions result in negative net margin, which is the primary driver pulling overall ROE to {ratios.dupont.roeResult}%.</li>
            </ul>
          </div>
        </div>
      )}

      {/* SUBTAB 3: TRENDS */}
      {activeSubTab === 'trends' && (
        <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px 0' }}>FY 2025-26 Month-by-Month Financial Trend</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Tracks revenue run-rate, operating expenditure, and net liquidity movement across all 12 operational months.
            </p>
          </div>

          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px' }}>Month</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Revenue</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Expenses</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Operating Spread</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Cash Inflow</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Cash Outflow</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Net Cashflow</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px', fontWeight: 600 }}>{m.month}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{formatINR(m.revenue)}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{formatINR(m.expenses)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: m.netOperating >= 0 ? '#10b981' : '#ef4444' }}>
                    {formatINR(m.netOperating)}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', color: 'var(--text-secondary)' }}>{formatINR(m.cashInflow)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: 'var(--text-secondary)' }}>{formatINR(m.cashOutflow)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: m.netCashFlow >= 0 ? '#10b981' : '#ef4444' }}>
                    {formatINR(m.netCashFlow)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ padding: '14px', background: 'var(--bg-surface)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Activity size={16} color="#3b82f6" />
            <span><strong>Seasonality Observation:</strong> Revenue peaks in October (Festive season: ₹8,00,000) and November (₹8,00,000) relative to baseline months (₹5,00,000/mo), illustrating cyclical demand.</span>
          </div>
        </div>
      )}

      {/* SUBTAB 4: FORECAST */}
      {activeSubTab === 'forecast' && (
        <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px 0' }}>Financial Projections & Run-Rate Forecast</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Historical moving-average statistical projections for near-term revenue, cost run-rates, and liquidity.
              </p>
            </div>
            <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 600 }}>
              Statistical Estimate
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            
            {/* 30-Day Forecast */}
            <div style={{ padding: '20px', background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>{forecast.nextMonth.period}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Next 30 Days</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Projected Revenue:</span>
                  <strong>{formatINR(forecast.nextMonth.estimatedRevenue)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Projected Expenses:</span>
                  <strong>{formatINR(forecast.nextMonth.estimatedExpenses)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px dashed var(--border)', paddingTop: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Est. Cash & Bank Ending:</span>
                  <strong style={{ color: '#10b981', fontSize: '15px' }}>{formatINR(forecast.nextMonth.estimatedCashBalance)}</strong>
                </div>
              </div>
            </div>

            {/* 90-Day Forecast */}
            <div style={{ padding: '20px', background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>{forecast.nextQuarter.period}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Next 90 Days</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Projected Revenue:</span>
                  <strong>{formatINR(forecast.nextQuarter.estimatedRevenue)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Projected Expenses:</span>
                  <strong>{formatINR(forecast.nextQuarter.estimatedExpenses)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px dashed var(--border)', paddingTop: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Est. Cash & Bank Ending:</span>
                  <strong style={{ color: '#10b981', fontSize: '15px' }}>{formatINR(forecast.nextQuarter.estimatedCashBalance)}</strong>
                </div>
              </div>
            </div>

          </div>

          <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.08)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)', fontSize: '12px', color: 'var(--text-secondary)' }}>
            ⚠️ <strong>Forecast Notice & Methodology:</strong> {forecast.disclaimer} Calculations assume current 12-month run-rate with normalized working capital realization. Unanticipated inventory purchases or capital outlays may cause deviations.
          </div>
        </div>
      )}

      {/* SUBTAB 5: AI ANALYST */}
      {activeSubTab === 'ai' && (
        <div className="card" style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '600px' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={20} color="#3b82f6" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>CFA Financial Advisory Assistant</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Grounded in real ledger metrics • Read-only analysis</div>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {[
              "Analyze my liquidity position",
              "How has my revenue trended this year?",
              "What's my likely cash position next month?",
              "Decompose my ROE using DuPont analysis",
              "Show me a 5-year trend"
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleAskAI(preset)}
                disabled={isAiLoading}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Sparkles size={12} color="#3b82f6" />
                <span>{preset}</span>
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '6px', marginBottom: '14px' }}>
            {aiChat.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  className={`chat-bubble ${msg.role}`}
                  style={{
                    maxWidth: '85%',
                    whiteSpace: 'pre-line',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    background: msg.role === 'user' ? 'var(--text-primary)' : 'var(--bg-surface)',
                    color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--border)'
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
                <RefreshCw size={14} className="spin" />
                <span>Computing financial diagnostics with CFA frameworks...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
              placeholder="Ask any financial analysis or forecasting question (e.g. Analyze working capital efficiency)..."
              disabled={isAiLoading}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              onClick={() => handleAskAI()}
              disabled={isAiLoading || !aiQuestion.trim()}
              className="btn-primary"
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              <Send size={14} />
              <span>Ask</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default Insights;