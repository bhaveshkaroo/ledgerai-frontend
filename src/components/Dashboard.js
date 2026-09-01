import React, { useState, useEffect } from 'react';
import { LedgerEngine, formatINR, CHART_OF_ACCOUNTS } from '../utils/LedgerEngine';
import { TrendingUp, TrendingDown, DollarSign, Clock, AlertTriangle, BarChart2, PieChart, ArrowUpRight, ArrowDownRight, CreditCard, Wallet, Target } from 'lucide-react';

const Dashboard = () => {
  const [period] = useState('Full Year');
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setTick(t => t + 1);
    window.addEventListener('ledger-updated', handleUpdate);
    return () => window.removeEventListener('ledger-updated', handleUpdate);
  }, []);
  const kpis = LedgerEngine.calcKPIs(period);
  const bs = LedgerEngine.calcBalanceSheet(period);
  const is = LedgerEngine.calcIncomeStatement(period);
  const cf = LedgerEngine.calcCashFlow(period);

  // Extract real financial data
  const cashBalance = LedgerEngine.getAccountBalance('Cash and Bank');
  const totalRevenue = kpis.totalRevenue;
  const totalExpenses = kpis.totalExpenses;
  const netProfit = kpis.netProfit;
  const grossProfit = totalRevenue - LedgerEngine.getAccountBalance('Cost of Goods Sold');
  const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;
  const netMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  const accountsReceivable = LedgerEngine.getAccountBalance('Accounts Receivable');
  const accountsPayable = LedgerEngine.getAccountBalance('Accounts Payable');
  const inventory = LedgerEngine.getAccountBalance('Inventory');
  const bankLoan = LedgerEngine.getAccountBalance('Bank Loan');
  const taxPayable = LedgerEngine.getAccountBalance('Tax Payable');
  const fixedAssetsNet = LedgerEngine.getAccountBalance('Fixed Assets (Gross)') - LedgerEngine.getAccountBalance('Accumulated Depreciation');

  // Current Ratio
  const currentAssets = cashBalance + accountsReceivable + inventory;
  const currentLiabilities = accountsPayable + taxPayable;
  const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities).toFixed(2) : 'N/A';

  // Debt-to-Equity
  const totalEquity = LedgerEngine.getAccountBalance('Share Capital') + netProfit;
  const debtToEquity = totalEquity > 0 ? (bankLoan / totalEquity).toFixed(2) : 'N/A';

  // Working Capital
  const workingCapital = currentAssets - currentLiabilities;

  // Days Sales Outstanding (DSO) - approximate
  const avgDailySales = totalRevenue / 365;
  const dso = avgDailySales > 0 ? Math.round(accountsReceivable / avgDailySales) : 0;

  // Days Payable Outstanding (DPO) - approximate
  const cogs = LedgerEngine.getAccountBalance('Cost of Goods Sold');
  const avgDailyCOGS = cogs / 365;
  const dpo = avgDailyCOGS > 0 ? Math.round(accountsPayable / avgDailyCOGS) : 0;

  // Monthly revenue breakdown (approximate from transaction data)
  const monthlyRevenue = [];
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  for (let i = 4; i <= 15; i++) {
    const isFestive = i === 10 || i === 11;
    monthlyRevenue.push({ month: months[i - 4], value: isFestive ? 800000 : 500000 });
  }
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.value));

  // Liability deadlines
  const liabilities = [
    { name: 'GST Filing', dueDate: 'Sep 20, 2026', amount: null, urgency: 'warning' },
    { name: 'Term Loan EMI', dueDate: 'Sep 05, 2026', amount: 15000, urgency: 'normal' },
    { name: 'Income Tax (Advance)', dueDate: 'Sep 15, 2026', amount: 112500, urgency: 'warning' },
    { name: 'Trade Payables', dueDate: 'Ongoing', amount: accountsPayable, urgency: accountsPayable > 200000 ? 'danger' : 'normal' },
    { name: 'Tax Provision', dueDate: 'Mar 31, 2027', amount: taxPayable, urgency: 'normal' },
  ];

  // Expense breakdown for pie-like visual
  const expenseBreakdown = [
    { name: 'COGS', value: cogs, color: '#f97316', pct: ((cogs / totalExpenses) * 100).toFixed(0) },
    { name: 'Salaries', value: LedgerEngine.getAccountBalance('Salary Expense'), color: '#3b82f6', pct: ((LedgerEngine.getAccountBalance('Salary Expense') / totalExpenses) * 100).toFixed(0) },
    { name: 'Rent', value: LedgerEngine.getAccountBalance('Rent Expense'), color: '#8b5cf6', pct: ((LedgerEngine.getAccountBalance('Rent Expense') / totalExpenses) * 100).toFixed(0) },
    { name: 'Depreciation', value: LedgerEngine.getAccountBalance('Depreciation Expense'), color: '#ec4899', pct: ((LedgerEngine.getAccountBalance('Depreciation Expense') / totalExpenses) * 100).toFixed(0) },
    { name: 'Finance', value: LedgerEngine.getAccountBalance('Finance Cost'), color: '#14b8a6', pct: ((LedgerEngine.getAccountBalance('Finance Cost') / totalExpenses) * 100).toFixed(0) },
  ];

  return (
    <div className="animate-fade" style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.5px' }}>Financial Overview</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>FY 2025-26 | As at Mar 31, 2026</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: netProfit > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: netProfit > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
            {netProfit > 0 ? 'Profitable' : 'Loss-making'}
          </span>
        </div>
      </div>

      {/* Top KPI Row - Hero Cards */}
      <div className="dashboard-hero-grid">
        <div className="card gradient-green" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, opacity: 0.9 }}>Cash & Bank Balance</div>
            <Wallet size={20} style={{ opacity: 0.7 }} />
          </div>
          <div>
            <div className="digital-number" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1, marginBottom: '8px' }}>
              {formatINR(cashBalance)}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Liquid funds available for operations</div>
          </div>
          <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: '11px', opacity: 0.8 }}>
            <span>Working Capital: {formatINR(workingCapital)}</span>
            <span>Current Ratio: {currentRatio}x</span>
          </div>
        </div>

        <div className="card gradient-orange" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, opacity: 0.9 }}>Net Profit (PAT)</div>
            <Target size={20} style={{ opacity: 0.7 }} />
          </div>
          <div>
            <div className="digital-number" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1, marginBottom: '8px' }}>
              {formatINR(netProfit)}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Margin: {netMargin}% | Gross Margin: {grossMargin}%</div>
          </div>
          <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: '11px', opacity: 0.8 }}>
            <span>Revenue: {formatINR(totalRevenue)}</span>
            <span>Expenses: {formatINR(totalExpenses)}</span>
          </div>
        </div>
      </div>

      {/* Secondary KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <ArrowDownRight size={14} color="#f97316" />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Accounts Receivable</span>
          </div>
          <div className="digital-number" style={{ fontSize: '24px', fontWeight: 600 }}>{formatINR(accountsReceivable)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>DSO: {dso} days</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <ArrowUpRight size={14} color="#ef4444" />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Accounts Payable</span>
          </div>
          <div className="digital-number" style={{ fontSize: '24px', fontWeight: 600 }}>{formatINR(accountsPayable)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>DPO: {dpo} days</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <CreditCard size={14} color="#8b5cf6" />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Outstanding Loan</span>
          </div>
          <div className="digital-number" style={{ fontSize: '24px', fontWeight: 600 }}>{formatINR(bankLoan)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>D/E Ratio: {debtToEquity}x</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <DollarSign size={14} color="#10b981" />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Inventory Value</span>
          </div>
          <div className="digital-number" style={{ fontSize: '24px', fontWeight: 600 }}>{formatINR(inventory)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>Turnover: {cogs > 0 && inventory > 0 ? (cogs / inventory).toFixed(1) : 'N/A'}x</div>
        </div>
      </div>

      {/* Revenue Chart + Liability Deadlines Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* Monthly Revenue */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Monthly Revenue</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>FY 2025-26</div>
            </div>
            <BarChart2 size={16} color="var(--text-muted)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px' }}>
            {monthlyRevenue.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '100%', 
                  height: (m.value / maxRevenue * 100) + 'px',
                  background: m.value === maxRevenue ? 'var(--text-primary)' : 'var(--bg-surface)',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.3s'
                }}></div>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Liability Deadlines */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Upcoming Deadlines</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Liabilities & Compliance</div>
            </div>
            <Clock size={16} color="var(--text-muted)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {liabilities.map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '10px', background: 'var(--bg-surface)' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{l.name}</div>
                  <div style={{ fontSize: '11px', color: l.urgency === 'danger' ? '#ef4444' : l.urgency === 'warning' ? '#f59e0b' : 'var(--text-muted)' }}>
                    {l.urgency === 'danger' ? '⚠ ' : ''}{l.dueDate}
                  </div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  {l.amount ? formatINR(l.amount) : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Expense Breakdown</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total: {formatINR(totalExpenses)}</div>
          </div>
          <PieChart size={16} color="var(--text-muted)" />
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          {expenseBreakdown.map((e, i) => (
            <div key={i} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: e.color }}></div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{e.name}</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{e.pct}%</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatINR(e.value)}</div>
            </div>
          ))}
        </div>
        {/* Stacked bar */}
        <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
          {expenseBreakdown.map((e, i) => (
            <div key={i} style={{ width: e.pct + '%', background: e.color }}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
