import React, { useState, useEffect } from 'react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';
import { CurrencyEngine, getCurrency, getExchangeRate } from '../utils/CurrencyEngine';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Clock, AlertTriangle, BarChart2, PieChart, ArrowUpRight, ArrowDownRight, CreditCard, Wallet, Target, X, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import LiveClock from './LiveClock';

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(20, 24, 33, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '10px',
        padding: '12px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        minWidth: '180px'
      }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
          {label}
        </div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', fontSize: '12px', margin: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color }}></div>
              <span style={{ color: '#94a3b8' }}>{entry.name}:</span>
            </div>
            <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>
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
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setTick(t => t + 1);
    window.addEventListener('ledger-updated', handleUpdate);
    window.addEventListener('currency-changed', handleUpdate);
    return () => {
      window.removeEventListener('ledger-updated', handleUpdate);
      window.removeEventListener('currency-changed', handleUpdate);
    };
  }, []);
  const kpis = LedgerEngine.calcKPIs(period);
  const is = LedgerEngine.calcIncomeStatement(period);

  const dateRange = LedgerEngine.getPeriodDateRange(period);
  const startD = new Date(dateRange.start);
  const endD = new Date(dateRange.end);
  const monthCount = (endD.getFullYear() - startD.getFullYear()) * 12 + endD.getMonth() - startD.getMonth() + 1;
  const totalOperatingDays = Math.max(365, monthCount * 30.4167);

  // Extract real financial data scoped to period
  const cashBalance = LedgerEngine.getAccountBalance('Cash and Bank', dateRange.end);
  const totalRevenue = kpis.totalRevenue;
  const totalExpenses = kpis.totalExpenses;
  const netProfit = kpis.netProfit;
  const cogs = LedgerEngine.getAccountBalance('Cost of Goods Sold', dateRange.end, dateRange.start);
  const grossProfit = totalRevenue - cogs;
  const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;
  const netMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  const accountsReceivable = LedgerEngine.getAccountBalance('Accounts Receivable');
  const accountsPayable = LedgerEngine.getAccountBalance('Accounts Payable');
  const inventory = LedgerEngine.getAccountBalance('Inventory');
  const bankLoan = LedgerEngine.getAccountBalance('Bank Loan');
  const taxPayable = LedgerEngine.getAccountBalance('Tax Payable');

  // Current Ratio
  const currentAssets = cashBalance + accountsReceivable + inventory;
  const currentLiabilities = accountsPayable + taxPayable;
  const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities).toFixed(2) : 'N/A';

  // Debt-to-Equity
  const totalEquity = LedgerEngine.getAccountBalance('Share Capital') + netProfit;
  const debtToEquity = totalEquity > 0 ? (bankLoan / totalEquity).toFixed(2) : 'N/A';

  // Working Capital
  const workingCapital = currentAssets - currentLiabilities;

  // Days Sales Outstanding (DSO)
  const avgDailySales = totalRevenue / totalOperatingDays;
  const dso = avgDailySales > 0 ? Math.round(accountsReceivable / avgDailySales) : 0;

  // Days Payable Outstanding (DPO)
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

  // Liability deadlines with rich drill-down metadata
  const liabilities = [
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

  // Comprehensive period-scoped expense breakdown
  const salaryExp = LedgerEngine.getAccountBalance('Salary Expense', dateRange.end, dateRange.start);
  const rentExp = LedgerEngine.getAccountBalance('Rent Expense', dateRange.end, dateRange.start);
  const depExp = LedgerEngine.getAccountBalance('Depreciation Expense', dateRange.end, dateRange.start);
  const finExp = LedgerEngine.getAccountBalance('Finance Cost', dateRange.end, dateRange.start);
  const otherExp = LedgerEngine.getAccountBalance('Other Expenses', dateRange.end, dateRange.start) + LedgerEngine.getAccountBalance('Bank Charges', dateRange.end, dateRange.start);
  const taxExp = LedgerEngine.getAccountBalance('Tax Expense', dateRange.end, dateRange.start);

  const rawExpenseItems = [
    { name: 'COGS', value: cogs, color: '#f97316' },
    { name: 'Salaries', value: salaryExp, color: '#3b82f6' },
    { name: 'Rent', value: rentExp, color: '#8b5cf6' },
    { name: 'Depreciation', value: depExp, color: '#ec4899' },
    { name: 'Finance Cost', value: finExp, color: '#14b8a6' },
    { name: 'Other & Power', value: otherExp, color: '#eab308' },
    { name: 'Tax Provision', value: taxExp, color: '#06b6d4' }
  ].filter(item => item.value > 0);

  const totalExpCalc = rawExpenseItems.reduce((s, x) => s + x.value, 0) || totalExpenses || 1;

  const expenseBreakdown = rawExpenseItems.map(item => ({
    ...item,
    pct: totalExpCalc > 0 ? Number(((item.value / totalExpCalc) * 100).toFixed(1)) : 0
  }));

  return (
    <div className="animate-fade" style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.5px', margin: 0 }}>Financial Overview</h1>
            <LiveClock />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>{LedgerEngine.getPeriodDateRange(period).name}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select 
            value={period} 
            onChange={e => setPeriod(e.target.value)}
            style={{ fontSize: '13px', padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
          >
            <option value="All 3 Years">All 3 Years (FY 2024-27)</option>
            <option value="FY 2024-25">FY 2024-25</option>
            <option value="FY 2025-26">FY 2025-26</option>
            <option value={LedgerEngine.getCurrentFiscalYear()}>{LedgerEngine.getCurrentFiscalYear()} (Current)</option>
          </select>
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
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>Turnover: {cogs > 0 && inventory > 0 ? (((cogs / totalOperatingDays) * 365) / inventory).toFixed(1) : 'N/A'}x</div>
        </div>
      </div>

      {/* Revenue Chart + Liability Deadlines Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* Interactive Recharts Monthly Revenue & Operating Flow */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>Monthly Revenue &amp; Cost Trend</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {LedgerEngine.getPeriodDateRange(period).name} • Hover bars for exact amounts
              </div>
            </div>
            <BarChart2 size={18} color="var(--text-muted)" />
          </div>

          <div style={{ width: '100%', height: '220px', marginTop: 'auto' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
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
                <Bar dataKey="revenue" name="Sales Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="expenses" name="Operating Expenses" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interactive Liability Deadlines */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>Upcoming Deadlines</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Click any deadline for merchant &amp; invoice details</div>
            </div>
            <Clock size={18} color="var(--text-muted)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '220px' }}>
            {liabilities.map((l) => (
              <div 
                key={l.id} 
                onClick={() => setSelectedDeadline(l)}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '10px 14px', 
                  borderRadius: '10px', 
                  background: 'var(--bg-surface)', 
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                className="table-row-hover"
                title="Click to view full payment & invoice details"
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{l.name}</span>
                    <ChevronRight size={13} style={{ opacity: 0.5 }} />
                  </div>
                  <div style={{ fontSize: '11px', color: l.urgency === 'danger' ? '#ef4444' : l.urgency === 'warning' ? '#f59e0b' : 'var(--text-muted)', marginTop: '2px' }}>
                    {l.urgency === 'danger' ? '⚠ ' : '📅 '}Due {l.dueDate} • {l.category}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {l.amount ? formatINR(l.amount) : '—'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
                    Click Details ➔
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deadline Drill-Down Modal */}
      {selectedDeadline && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          padding: '20px'
        }}>
          <div className="card animate-fade" style={{
            width: '100%', maxWidth: '560px', padding: '28px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '16px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: selectedDeadline.urgency === 'danger' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: selectedDeadline.urgency === 'danger' ? '#ef4444' : '#f59e0b', marginBottom: '6px' }}>
                  {selectedDeadline.category}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedDeadline.name}</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Due Date: {selectedDeadline.dueDate}</div>
              </div>
              <button 
                onClick={() => setSelectedDeadline(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Amount Banner */}
            <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Payable Amount</div>
                <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedDeadline.amount ? formatINR(selectedDeadline.amount) : 'Calculated at Close'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                <CheckCircle2 size={16} /> {selectedDeadline.details.status || 'Active'}
              </div>
            </div>

            {/* Description */}
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              {selectedDeadline.details.description}
            </div>

            {/* Dynamic Details Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {selectedDeadline.details.lender && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Financial Institution:</span>
                  <span style={{ fontWeight: 600 }}>{selectedDeadline.details.lender}</span>
                </div>
              )}
              {selectedDeadline.details.facilityAccount && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Loan Account Number:</span>
                  <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{selectedDeadline.details.facilityAccount}</span>
                </div>
              )}
              {selectedDeadline.details.principalOutstanding && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Principal Balance:</span>
                  <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{selectedDeadline.details.principalOutstanding}</span>
                </div>
              )}
              {selectedDeadline.details.taxableSupplies && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Billed Turnover:</span>
                  <span style={{ fontWeight: 600 }}>{selectedDeadline.details.taxableSupplies}</span>
                </div>
              )}
              {selectedDeadline.details.outwardTax && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Gross Output GST:</span>
                  <span style={{ fontWeight: 600, color: '#f97316' }}>{selectedDeadline.details.outwardTax}</span>
                </div>
              )}
              {selectedDeadline.details.eligibleITC && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Less Eligible ITC:</span>
                  <span style={{ fontWeight: 600, color: '#10b981' }}>- {selectedDeadline.details.eligibleITC}</span>
                </div>
              )}

              {/* Vendor Breakdown Table if Trade Payables */}
              {selectedDeadline.details.vendorBreakdown && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Itemized Supplier Payables Aging
                  </div>
                  <div style={{ borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                          <th style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>Supplier</th>
                          <th style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>Material</th>
                          <th style={{ padding: '8px 12px', color: 'var(--text-muted)', textAlign: 'right' }}>Amount</th>
                          <th style={{ padding: '8px 12px', color: 'var(--text-muted)', textAlign: 'right' }}>Terms</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDeadline.details.vendorBreakdown.map((vb, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 600 }}>{vb.vendor}</td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{vb.item}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 600, fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{vb.amount}</td>
                            <td style={{ padding: '8px 12px', color: '#10b981', textAlign: 'right' }}>{vb.terms}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedDeadline(null)}
                style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Expense Breakdown */}
      <div className="card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>Expense Breakdown</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Total Operating &amp; Tax Expenses: <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{formatINR(totalExpenses)}</span>
            </div>
          </div>
          <PieChart size={18} color="var(--text-muted)" />
        </div>
        
        {/* Stacked Percentage Progress Bar */}
        <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '18px', background: 'var(--bg-surface)' }}>
          {expenseBreakdown.map((e, i) => (
            <div 
              key={i} 
              style={{ width: `${e.pct}%`, background: e.color }} 
              title={`${e.name}: ${e.pct}% (${formatINR(e.value)})`}
            />
          ))}
        </div>

        {/* Expense Category Metric Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          {expenseBreakdown.map((e, i) => (
            <div key={i} style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: e.color, flexShrink: 0 }}></div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{e.pct}%</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{formatINR(e.value)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
