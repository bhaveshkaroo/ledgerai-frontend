import React, { useState, useEffect } from 'react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';
import { getCurrency, getExchangeRate } from '../utils/CurrencyEngine';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { 
  BarChart2, PieChart, ArrowUpRight, ArrowDownRight, 
  CreditCard, Wallet, Target, X, CheckCircle2, ChevronRight, Clock, AlertCircle,
  ShieldCheck, Sparkles
} from 'lucide-react';
import LiveClock from './LiveClock';
import AnimatedNumber from './AnimatedNumber';

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--sp-3) var(--sp-4)',
        boxShadow: 'var(--shadow-md)',
        minWidth: '180px'
      }}>
        <div style={{ 
          fontSize: 'var(--fs-sm)', 
          fontWeight: 600, 
          color: 'var(--text-primary)', 
          marginBottom: 'var(--sp-2)', 
          borderBottom: '1px solid var(--border)', 
          paddingBottom: 'var(--sp-1)' 
        }}>
          {label}
        </div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', fontSize: 'var(--fs-xs)', margin: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color }}></div>
              <span style={{ color: 'var(--text-muted)' }}>{entry.name}:</span>
            </div>
            <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              {formatINR(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [period, setPeriod] = useState(LedgerEngine.getCurrentFiscalYear());
  const [selectedDeadline, setSelectedDeadline] = useState(null);

  // Stock-ticker reactive state
  const computeKPIs = (p) => {
    const kpis = LedgerEngine.calcKPIs(p);
    const is = LedgerEngine.calcIncomeStatement(p);
    const dateRange = LedgerEngine.getPeriodDateRange(p);
    return {
      kpis,
      is,
      dateRange,
      cashBalance: Math.round(LedgerEngine.getAccountBalance('Cash and Bank', dateRange.end)),
      accountsReceivable: Math.round(LedgerEngine.getAccountBalance('Accounts Receivable')),
      accountsPayable: Math.round(LedgerEngine.getAccountBalance('Accounts Payable')),
      inventory: Math.round(LedgerEngine.getAccountBalance('Inventory')),
      bankLoan: Math.round(LedgerEngine.getAccountBalance('Bank Loan')),
      taxPayable: Math.round(LedgerEngine.getAccountBalance('Tax Payable')),
    };
  };

  const [kpiState, setKpiState] = useState(() => computeKPIs(period));

  useEffect(() => {
    const refresh = () => setKpiState(computeKPIs(period));
    window.addEventListener('ledger-updated', refresh);
    window.addEventListener('currency-changed', refresh);
    window.addEventListener('company-switched', refresh);
    return () => {
      window.removeEventListener('ledger-updated', refresh);
      window.removeEventListener('currency-changed', refresh);
      window.removeEventListener('company-switched', refresh);
    };
  }, [period]);

  useEffect(() => {
    setKpiState(computeKPIs(period));
  }, [period]);

  // Destructure from state
  const { kpis, dateRange, cashBalance, accountsReceivable, accountsPayable, inventory, bankLoan, taxPayable } = kpiState;

  const startD = new Date(dateRange.start);
  const endD = new Date(dateRange.end);
  const monthCount = (endD.getFullYear() - startD.getFullYear()) * 12 + endD.getMonth() - startD.getMonth() + 1;
  const totalOperatingDays = Math.max(365, monthCount * 30.4167);

  const totalRevenue = kpis.totalRevenue;
  const totalExpenses = kpis.totalExpenses;
  const netProfit = kpis.netProfit;
  const cogs = Math.round(LedgerEngine.getAccountBalance('Cost of Goods Sold', dateRange.end, dateRange.start));
  const grossProfit = totalRevenue - cogs;
  const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;
  const netMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Financial ratios
  const currentAssets = cashBalance + accountsReceivable + inventory;
  const currentLiabilities = accountsPayable + taxPayable;
  const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities).toFixed(2) : 'N/A';

  const totalEquity = LedgerEngine.getAccountBalance('Share Capital') + netProfit;
  const debtToEquity = totalEquity > 0 ? (bankLoan / totalEquity).toFixed(2) : 'N/A';
  const workingCapital = currentAssets - currentLiabilities;

  const avgDailySales = totalRevenue / totalOperatingDays;
  const dso = avgDailySales > 0 ? Math.round(accountsReceivable / avgDailySales) : 0;

  const avgDailyCOGS = cogs / totalOperatingDays;
  const dpo = avgDailyCOGS > 0 ? Math.round(accountsPayable / avgDailyCOGS) : 0;

  // Monthly revenue & expense breakdown for Recharts
  const periodTx = LedgerEngine.getFilteredTransactions(period);
  const monthlyDataMap = {};
  
  periodTx.forEach(tx => {
    const date = new Date(tx.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}`;
    
    if (!monthlyDataMap[key]) {
      const monthShort = date.toLocaleString('default', { month: 'short' });
      monthlyDataMap[key] = {
        name: `${monthShort} ${String(year).slice(-2)}`,
        revenue: 0,
        expenses: 0,
        sortKey: key
      };
    }
    
    if (tx.account === 'Sales Revenue' && tx.type === 'Credit') {
      monthlyDataMap[key].revenue += tx.amount;
    }
    if (['Cost of Goods Sold', 'Salary Expense', 'Rent Expense', 'Finance Cost', 'Other Expenses', 'Bank Charges', 'Depreciation Expense'].includes(tx.account) && tx.type === 'Debit') {
      monthlyDataMap[key].expenses += tx.amount;
    }
  });
  
  const chartData = Object.values(monthlyDataMap)
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(d => ({
      ...d,
      net: d.revenue - d.expenses
    }));

  const hasOperationalData = totalRevenue > 0 || totalExpenses > 0;
  const liabilities = !hasOperationalData ? [] : [
    { 
      id: 'gst',
      name: 'GST Filing (GSTR-3B)', 
      dueDate: 'Sep 20, 2026', 
      amount: 495040, 
      urgency: 'warning',
      category: 'Statutory Tax',
      details: {
        description: 'Monthly return for outward taxable supplies and input tax credit offset under Section 39 of CGST Act.',
        taxableSupplies: formatINR(4147220),
        outwardTax: formatINR(495040),
        eligibleITC: formatINR(325448),
        netCashPayable: formatINR(169592),
        challanRef: 'PMT-06/2026/09',
        status: 'Pending Filing'
      }
    },
    { 
      id: 'loan',
      name: 'Term Loan Monthly EMI', 
      dueDate: 'Sep 05, 2026', 
      amount: 15000, 
      urgency: 'normal',
      category: 'Debt Service',
      details: {
        description: 'Monthly interest installment for Machinery & Working Capital Term Loan.',
        lender: 'State Bank of India (SME Branch)',
        facilityAccount: 'TL-3982049182',
        principalOutstanding: formatINR(3000000),
        interestRate: '9.25% p.a.',
        autoDebitAccount: 'Current A/c (SBI - 8812)',
        status: 'Scheduled for Auto-Debit'
      }
    },
    { 
      id: 'advance-tax',
      name: 'Q2 Advance Tax (Sec 211)', 
      dueDate: 'Sep 15, 2026', 
      amount: 112500, 
      urgency: 'warning',
      category: 'Direct Tax',
      details: {
        description: 'Second installment (45% cumulative) of estimated Corporate Income Tax.',
        assessmentYear: 'AY 2027-28',
        pbtEstimate: formatINR(2500000),
        applicableRate: '25% + Surcharge',
        challanType: 'ITNS-280 (Major Head 0020)',
        status: 'Challan Generated'
      }
    },
    { 
      id: 'payables',
      name: 'Trade Payables (Suppliers)', 
      dueDate: 'Sep 26, 2026', 
      amount: accountsPayable, 
      urgency: accountsPayable > 200000 ? 'danger' : 'normal',
      category: 'Procurement & Vendors',
      details: {
        description: 'Outstanding invoices for raw material textile deliveries on 35-day credit terms.',
        vendorBreakdown: [
          { vendor: 'Gujarat Cotton Mills', item: 'Cotton Fabric 60s', amount: formatINR(155200), terms: 'Due in 12 days' },
          { vendor: 'Surat Silk Suppliers', item: 'Silk Crepe Fabric', amount: formatINR(210400), terms: 'Due in 8 days' },
          { vendor: 'Vardhman Textiles', item: 'Denim Weave 12oz', amount: formatINR(148500), terms: 'Due in 15 days' },
          { vendor: 'Arvind Weaves', item: 'Organic Dyed Rayon', amount: formatINR(222267), terms: 'Due in 5 days' }
        ],
        status: 'Within 35-Day Payment Window'
      }
    },
    { 
      id: 'mat-tax',
      name: 'Annual MAT Tax Provision', 
      dueDate: 'Mar 31, 2027', 
      amount: taxPayable, 
      urgency: 'normal',
      category: 'Year-End Provision',
      details: {
        description: 'Minimum Alternate Tax (MAT under Section 115JB) calculated on book profit.',
        applicableRate: '15% on Book Profits',
        dtaAssetRecognized: `${formatINR(45000)} (AS 22)`,
        status: 'Accrued in Balance Sheet'
      }
    },
  ];

  // Expense breakdown
  const salaryExp = Math.round(LedgerEngine.getAccountBalance('Salary Expense', dateRange.end, dateRange.start));
  const rentExp = Math.round(LedgerEngine.getAccountBalance('Rent Expense', dateRange.end, dateRange.start));
  const depExp = Math.round(LedgerEngine.getAccountBalance('Depreciation Expense', dateRange.end, dateRange.start));
  const finExp = Math.round(LedgerEngine.getAccountBalance('Finance Cost', dateRange.end, dateRange.start));
  const otherExp = Math.round(LedgerEngine.getAccountBalance('Other Expenses', dateRange.end, dateRange.start) + LedgerEngine.getAccountBalance('Bank Charges', dateRange.end, dateRange.start));
  const taxExp = Math.round(LedgerEngine.getAccountBalance('Tax Expense', dateRange.end, dateRange.start));

  const rawExpenseItems = [
    { name: 'COGS', value: cogs, color: '#f59e0b' },
    { name: 'Salaries', value: salaryExp, color: '#3b82f6' },
    { name: 'Rent', value: rentExp, color: '#6366f1' },
    { name: 'Depreciation', value: depExp, color: '#8b5cf6' },
    { name: 'Finance Cost', value: finExp, color: '#10b981' },
    { name: 'Other & Power', value: otherExp, color: '#64748b' },
    { name: 'Tax Provision', value: taxExp, color: '#0ea5e9' }
  ].filter(item => item.value > 0);

  const totalExpCalc = rawExpenseItems.reduce((s, x) => s + x.value, 0) || totalExpenses || 1;

  const expenseBreakdown = rawExpenseItems.map(item => ({
    ...item,
    pct: totalExpCalc > 0 ? Number(((item.value / totalExpCalc) * 100).toFixed(1)) : 0
  }));

  const [activeCategory, setActiveCategory] = useState('hub');

  return (
    <div className="animate-fade" style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* ═══ RAFION HERO HEADER & GREETING ═══ */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 700, 
              color: 'var(--text-primary)', 
              letterSpacing: '-0.5px',
              lineHeight: 1.2
            }}>
              Hey, Finance Team!
            </h1>
            <p style={{ 
              fontSize: '15px', 
              color: 'var(--text-muted)', 
              marginTop: '4px',
              fontWeight: 400
            }}>
              Let's deploy institutional financial intelligence!
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select 
              value={period} 
              onChange={e => setPeriod(e.target.value)}
              className="settings-select"
              style={{ minWidth: 'auto', borderRadius: '9999px', padding: '6px 16px' }}
            >
              <option value="All 3 Years">All 3 Years (FY 2024-27)</option>
              <option value="FY 2024-25">FY 2024-25</option>
              <option value="FY 2025-26">FY 2025-26</option>
              <option value={LedgerEngine.getCurrentFiscalYear()}>{LedgerEngine.getCurrentFiscalYear()} (Current)</option>
            </select>
            <LiveClock />
          </div>
        </div>

        {/* 98% Confidence Metric + 4-Stage Segmented Pipeline Track */}
        <div style={{ 
          marginTop: '24px', 
          display: 'flex', 
          alignItems: 'baseline', 
          gap: '20px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ 
              fontSize: '56px', 
              fontWeight: 800, 
              fontFamily: 'var(--font-mono)', 
              color: 'var(--text-primary)', 
              letterSpacing: '-2px',
              lineHeight: 1
            }}>
              98%
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                System Confidence
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Live System Analysis · All Ledgers Reconciled
              </span>
            </div>
          </div>

          {/* 4-Stage Segmented Pipeline Track matching Rafion */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            alignItems: 'center', 
            marginLeft: 'auto',
            background: 'rgba(0, 0, 0, 0.03)',
            padding: '6px 12px',
            borderRadius: '16px',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', padding: '4px 6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f97316' }}></div>
              <span>Raw Ledgers</span>
            </div>
            <span style={{ color: 'var(--border)' }}>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', padding: '4px 6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#eab308' }}></div>
              <span>Context Layer</span>
            </div>
            <span style={{ color: 'var(--border)' }}>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', padding: '4px 6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#84cc16' }}></div>
              <span>Double-Entry Logic</span>
            </div>
            <span style={{ color: 'var(--border)' }}>•</span>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '11px', 
              color: '#10b981', 
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
              <span>Verified Action</span>
            </div>
          </div>
        </div>

        {/* Sub-tabs: Intelligence Hub, Insights, Missions */}
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          marginTop: '20px', 
          borderBottom: '1px solid var(--border)',
          paddingBottom: '12px'
        }}>
          <button 
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '13px', 
              fontWeight: activeCategory === 'hub' ? 700 : 500,
              color: activeCategory === 'hub' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setActiveCategory('hub')}
          >
            <span>Intelligence Hub</span>
            <span style={{ 
              fontSize: '10px', 
              background: activeCategory === 'hub' ? '#111111' : 'rgba(0,0,0,0.06)', 
              color: activeCategory === 'hub' ? '#ffffff' : 'var(--text-muted)',
              padding: '1px 7px', 
              borderRadius: '9999px',
              fontWeight: 600
            }}>
              12
            </span>
          </button>

          <button 
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '13px', 
              fontWeight: activeCategory === 'insights' ? 700 : 500,
              color: activeCategory === 'insights' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setActiveCategory('insights')}
          >
            <span>Insights</span>
            <span style={{ fontSize: '10px', background: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)', padding: '1px 7px', borderRadius: '9999px', fontWeight: 600 }}>
              34
            </span>
          </button>

          <button 
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '13px', 
              fontWeight: activeCategory === 'missions' ? 700 : 500,
              color: activeCategory === 'missions' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setActiveCategory('missions')}
          >
            <span>Statutory Missions</span>
            <span style={{ fontSize: '10px', background: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)', padding: '1px 7px', borderRadius: '9999px', fontWeight: 600 }}>
              8
            </span>
          </button>
        </div>
      </div>

      {/* ═══ SIGNATURE RAFION AMBIENT GRADIENT CARDS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Card 1: Moss / Lime Glow */}
        <div className="rafion-card-moss">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="rafion-badge-icon">
                <Sparkles size={18} color="#a3e635" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                Actionable Insight
              </span>
            </div>
            <button className="rafion-arrow-btn" title="View Recommendation">
              <ArrowUpRight size={16} />
            </button>
          </div>

          <div style={{ margin: '20px 0 10px 0' }}>
            <div style={{ fontSize: '30px', fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}>
              + ₹5,60,000
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.75)', marginTop: '4px' }}>
              Working Capital Optimization (ROI Impact)
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)' }}>
            <span>From Q3 Cash Cycle Analysis</span>
            <span style={{ 
              padding: '3px 10px', 
              borderRadius: '9999px', 
              background: 'rgba(163, 230, 53, 0.25)', 
              color: '#d9f99d', 
              fontWeight: 600 
            }}>
              High Impact
            </span>
          </div>
        </div>

        {/* Card 2: Amber / Terracotta Glow */}
        <div className="rafion-card-amber">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="rafion-badge-icon">
                <ShieldCheck size={18} color="#fb923c" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                Decision Audit
              </span>
            </div>
            <button className="rafion-arrow-btn" title="Audit Trail">
              <ArrowUpRight size={16} />
            </button>
          </div>

          <div style={{ margin: '20px 0 10px 0' }}>
            <div style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.3px' }}>
              Supply Chain & Tax Shield
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.75)', marginTop: '4px' }}>
              Sec 211 Advance Tax & TDS Provision Verified
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)' }}>
            <span>Completed · 100% Audit Trail</span>
            <span style={{ 
              padding: '3px 10px', 
              borderRadius: '9999px', 
              background: 'rgba(251, 146, 60, 0.25)', 
              color: '#fed7aa', 
              fontWeight: 600 
            }}>
              Verified Compliant
            </span>
          </div>
        </div>
      </div>

      {/* Top KPI Row - Hero Cards */}
      <div className="dashboard-hero-grid" style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="kpi-hero" style={{ minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-hero-label">
              <Wallet size={16} /> Cash & Bank Balance
            </span>
          </div>
          <div>
            <div className="kpi-hero-value">
              <AnimatedNumber value={cashBalance} format={formatINR} />
            </div>
            <div className="kpi-hero-subtitle">Liquid funds available for operations</div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-6)', marginTop: 'var(--sp-3)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
            <span>Working Capital: <strong style={{ color: 'var(--text-secondary)' }}>{formatINR(workingCapital)}</strong></span>
            <span>Current Ratio: <strong style={{ color: 'var(--text-secondary)' }}>{currentRatio}x</strong></span>
          </div>
        </div>

        <div className={`kpi-hero ${netProfit < 0 ? 'negative' : ''}`} style={{ minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-hero-label">
              <Target size={16} /> Net Profit (PAT)
            </span>
          </div>
          <div>
            <div className="kpi-hero-value" style={{ color: netProfit >= 0 ? 'var(--color-positive)' : 'var(--color-negative)' }}>
              <AnimatedNumber value={netProfit} format={formatINR} />
            </div>
            <div className="kpi-hero-subtitle">Margin: {netMargin}% • Gross Margin: {grossMargin}%</div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-6)', marginTop: 'var(--sp-3)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
            <span>Revenue: <strong style={{ color: 'var(--text-secondary)' }}>{formatINR(totalRevenue)}</strong></span>
            <span>Expenses: <strong style={{ color: 'var(--text-secondary)' }}>{formatINR(totalExpenses)}</strong></span>
          </div>
        </div>
      </div>

      {/* Secondary KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)' }}>
        <div className="kpi-standard">
          <div className="kpi-standard-header">
            <span className="kpi-standard-label">Accounts Receivable</span>
            <div className="kpi-standard-icon warning">
              <ArrowDownRight size={16} />
            </div>
          </div>
          <div className="kpi-standard-value"><AnimatedNumber value={accountsReceivable} format={formatINR} /></div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>DSO: {dso} days</div>
        </div>

        <div className="kpi-standard">
          <div className="kpi-standard-header">
            <span className="kpi-standard-label">Accounts Payable</span>
            <div className="kpi-standard-icon negative">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="kpi-standard-value"><AnimatedNumber value={accountsPayable} format={formatINR} /></div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>DPO: {dpo} days</div>
        </div>

        <div className="kpi-standard">
          <div className="kpi-standard-header">
            <span className="kpi-standard-label">Outstanding Loan</span>
            <div className="kpi-standard-icon info">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="kpi-standard-value"><AnimatedNumber value={bankLoan} format={formatINR} /></div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>D/E Ratio: {debtToEquity}x</div>
        </div>

        <div className="kpi-standard">
          <div className="kpi-standard-header">
            <span className="kpi-standard-label">Inventory Value</span>
            <div className="kpi-standard-icon positive">
              <Target size={16} />
            </div>
          </div>
          <div className="kpi-standard-value"><AnimatedNumber value={inventory} format={formatINR} /></div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Turnover: {cogs > 0 && inventory > 0 ? (((cogs / totalOperatingDays) * 365) / inventory).toFixed(1) : 'N/A'}x</div>
        </div>
      </div>

      {/* Revenue Chart + Liability Deadlines Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--sp-6)', marginBottom: 'var(--sp-6)' }}>
        {/* Trend Chart (restrained 2-color palette) */}
        <div className="kpi-chart" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="kpi-chart-header">
            <div>
              <div className="kpi-chart-title">Revenue & Operating Flow</div>
              <div className="kpi-chart-subtitle">
                {LedgerEngine.getPeriodDateRange(period).name}
              </div>
            </div>
            <BarChart2 size={18} color="var(--text-muted)" />
          </div>

          <div style={{ width: '100%', height: '220px', marginTop: 'auto' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-muted)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={{ stroke: 'var(--border)' }}
                />
                <YAxis 
                  stroke="var(--text-muted)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={{ stroke: 'var(--border)' }}
                  tickFormatter={(val) => {
                    const isUSD = getCurrency() === 'USD';
                    const rate = getExchangeRate();
                    return isUSD ? `$${(val / (rate * 1000)).toFixed(0)}k` : `₹${(val / 100000).toFixed(1)}L`;
                  }}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={30} 
                  iconType="circle"
                  formatter={(val) => <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 500 }}>{val}</span>}
                />
                <Bar dataKey="revenue" name="Sales Revenue" fill="var(--color-positive)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expenses" name="Operating Expenses" fill="var(--text-muted)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Liability Deadlines */}
        <div className="card" style={{ padding: 'var(--sp-5)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
            <div>
              <div style={{ fontSize: 'var(--fs-md)', fontWeight: 600, color: 'var(--text-primary)' }}>Upcoming Deadlines</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Click deadline for statutory details</div>
            </div>
            <Clock size={18} color="var(--text-muted)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', overflowY: 'auto', maxHeight: '220px' }}>
            {liabilities.length === 0 ? (
              <div style={{ padding: 'var(--sp-6)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
                No pending statutory deadlines for this period.
              </div>
            ) : (
              liabilities.map((l) => (
                <div 
                  key={l.id} 
                  onClick={() => setSelectedDeadline(l)}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: 'var(--sp-3) var(--sp-4)', 
                    borderRadius: 'var(--radius-md)', 
                    background: 'var(--bg-surface)', 
                    border: '1px solid var(--border)',
                    borderLeft: `3px solid ${l.urgency === 'danger' ? 'var(--color-negative)' : l.urgency === 'warning' ? 'var(--color-warning)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    transition: 'all var(--duration-fast) ease',
                  }}
                  className="table-row-hover"
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{l.name}</span>
                      <ChevronRight size={13} style={{ opacity: 0.5 }} />
                    </div>
                    <div style={{ 
                      fontSize: 'var(--fs-xs)', 
                      color: l.urgency === 'danger' ? 'var(--color-negative)' : l.urgency === 'warning' ? 'var(--color-warning)' : 'var(--text-muted)', 
                      marginTop: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {l.urgency === 'danger' && <AlertCircle size={11} />}
                      Due {l.dueDate} • {l.category}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {l.amount ? formatINR(l.amount) : '—'}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--color-positive)', fontWeight: 600, marginTop: '2px' }}>
                      Details
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Deadline Drill-Down Modal */}
      {selectedDeadline && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'var(--bg-overlay)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          padding: '20px'
        }}>
          <div className="card animate-fade" style={{
            width: '100%', maxWidth: '560px', padding: 'var(--sp-6)',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-5)' }}>
              <div>
                <div style={{ 
                  display: 'inline-block', 
                  fontSize: 'var(--fs-xs)', 
                  fontWeight: 600, 
                  padding: '2px 8px', 
                  borderRadius: 'var(--radius-xs)', 
                  background: selectedDeadline.urgency === 'danger' ? 'var(--color-negative-bg)' : 'var(--color-warning-bg)', 
                  color: selectedDeadline.urgency === 'danger' ? 'var(--color-negative)' : 'var(--color-warning)', 
                  marginBottom: '6px' 
                }}>
                  {selectedDeadline.category}
                </div>
                <h3 style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedDeadline.name}</h3>
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', marginTop: '2px' }}>Due Date: {selectedDeadline.dueDate}</div>
              </div>
              <button 
                onClick={() => setSelectedDeadline(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Amount Banner */}
            <div style={{ padding: 'var(--sp-4)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border)', marginBottom: 'var(--sp-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Payable Amount</div>
                <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedDeadline.amount ? formatINR(selectedDeadline.amount) : 'Calculated at Close'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-sm)', color: 'var(--color-positive)', fontWeight: 600 }}>
                <CheckCircle2 size={16} /> {selectedDeadline.details.status || 'Active'}
              </div>
            </div>

            {/* Description */}
            <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text-secondary)', marginBottom: 'var(--sp-4)', lineHeight: 'var(--lh-normal)' }}>
              {selectedDeadline.details.description}
            </div>

            {/* Dynamic Details Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginBottom: 'var(--sp-6)' }}>
              {selectedDeadline.details.lender && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Financial Institution:</span>
                  <span style={{ fontWeight: 600 }}>{selectedDeadline.details.lender}</span>
                </div>
              )}
              {selectedDeadline.details.facilityAccount && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Loan Account Number:</span>
                  <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{selectedDeadline.details.facilityAccount}</span>
                </div>
              )}
              {selectedDeadline.details.principalOutstanding && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Principal Balance:</span>
                  <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{selectedDeadline.details.principalOutstanding}</span>
                </div>
              )}
              {selectedDeadline.details.taxableSupplies && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Billed Turnover:</span>
                  <span style={{ fontWeight: 600 }}>{selectedDeadline.details.taxableSupplies}</span>
                </div>
              )}
              {selectedDeadline.details.outwardTax && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Gross Output GST:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-warning)' }}>{selectedDeadline.details.outwardTax}</span>
                </div>
              )}
              {selectedDeadline.details.eligibleITC && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Less Eligible ITC:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-positive)' }}>- {selectedDeadline.details.eligibleITC}</span>
                </div>
              )}

              {/* Vendor Breakdown Table if Trade Payables */}
              {selectedDeadline.details.vendorBreakdown && (
                <div>
                  <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--sp-2)', textTransform: 'uppercase' }}>
                    Itemized Supplier Payables Aging
                  </div>
                  <div style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-sm)' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                          <th style={{ padding: 'var(--sp-2) var(--sp-3)', color: 'var(--text-muted)' }}>Supplier</th>
                          <th style={{ padding: 'var(--sp-2) var(--sp-3)', color: 'var(--text-muted)' }}>Material</th>
                          <th style={{ padding: 'var(--sp-2) var(--sp-3)', color: 'var(--text-muted)', textAlign: 'right' }}>Amount</th>
                          <th style={{ padding: 'var(--sp-2) var(--sp-3)', color: 'var(--text-muted)', textAlign: 'right' }}>Terms</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDeadline.details.vendorBreakdown.map((vb, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: 'var(--sp-2) var(--sp-3)', fontWeight: 600 }}>{vb.vendor}</td>
                            <td style={{ padding: 'var(--sp-2) var(--sp-3)', color: 'var(--text-secondary)' }}>{vb.item}</td>
                            <td style={{ padding: 'var(--sp-2) var(--sp-3)', fontWeight: 600, fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{vb.amount}</td>
                            <td style={{ padding: 'var(--sp-2) var(--sp-3)', color: 'var(--color-positive)', textAlign: 'right' }}>{vb.terms}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedDeadline(null)}
                className="settings-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expense Breakdown */}
      <div className="card" style={{ padding: 'var(--sp-6)', marginBottom: 'var(--sp-7)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-5)' }}>
          <div>
            <div style={{ fontSize: 'var(--fs-md)', fontWeight: 600, color: 'var(--text-primary)' }}>Expense Breakdown</div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
              Total Operating &amp; Tax Expenses: <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{formatINR(totalExpenses)}</span>
            </div>
          </div>
          <PieChart size={18} color="var(--text-muted)" />
        </div>
        
        {/* Stacked Percentage Progress Bar */}
        <div style={{ display: 'flex', height: '8px', borderRadius: 'var(--radius-pill)', overflow: 'hidden', marginBottom: 'var(--sp-5)', background: 'var(--bg-surface)' }}>
          {expenseBreakdown.map((e, i) => (
            <div 
              key={i} 
              style={{ width: `${e.pct}%`, background: e.color }} 
              title={`${e.name}: ${e.pct}% (${formatINR(e.value)})`}
            />
          ))}
        </div>

        {/* Expense Category Metric Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--sp-3)' }}>
          {expenseBreakdown.map((e, i) => (
            <div key={i} style={{ padding: 'var(--sp-3) var(--sp-4)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--sp-1)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: e.color, flexShrink: 0 }}></div>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
              </div>
              <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{e.pct}%</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{formatINR(e.value)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
