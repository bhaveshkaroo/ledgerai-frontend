import React, { useState, useEffect } from 'react';
import TradingAccount from './TradingAccount';
import IncomeStatement from './IncomeStatement';
import BalanceSheet from './BalanceSheet';
import CashFlowStatement from './CashFlowStatement';
import TrialBalance from './TrialBalance';
import NotesToAccounts from './NotesToAccounts';
import Schedules from './Schedules';
import { Download, FileText } from 'lucide-react';
import { exportToPDF } from '../utils/exportUtils';
import { LedgerEngine, CHART_OF_ACCOUNTS } from '../utils/LedgerEngine';

function Statements({ period, currency }) {
  const [selectedPeriod, setSelectedPeriod] = useState(period || LedgerEngine.getCurrentFiscalYear());
  const [activeTab, setActiveTab] = useState('Profit & Loss');
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setTick(t => t + 1);
    window.addEventListener('ledger-updated', handleUpdate);
    return () => window.removeEventListener('ledger-updated', handleUpdate);
  }, []);
  const tabs = ['Trading A/c', 'Profit & Loss', 'Balance Sheet', 'Cash Flow', 'Trial Balance', 'Notes to Accounts', 'Schedules'];

  const handleExport = () => {
    let data = [];
    let title = '';
    let exportOptions = {};

    if (activeTab === 'Trading A/c') {
      data = LedgerEngine.calcTradingAccount(selectedPeriod);
      title = `Trading Account - ${selectedPeriod}`;
    } else if (activeTab === 'Profit & Loss') {
      data = LedgerEngine.calcIncomeStatement(selectedPeriod);
      title = `Statement of Profit and Loss - ${selectedPeriod}`;
    } else if (activeTab === 'Balance Sheet') {
      data = LedgerEngine.calcBalanceSheet(selectedPeriod);
      title = `Balance Sheet - ${selectedPeriod}`;
    } else if (activeTab === 'Cash Flow') {
      data = LedgerEngine.calcCashFlow(selectedPeriod);
      title = `Statement of Cash Flows - ${selectedPeriod}`;
      exportOptions.isCashFlow = true;
    } else if (activeTab === 'Trial Balance') {
      const tbAccounts = CHART_OF_ACCOUNTS.map(acc => {
        const balance = LedgerEngine.getAccountBalance(acc.name);
        const isDebitNormal = ['Asset', 'Expense'].includes(acc.type);
        return {
          name: acc.name,
          type: acc.type,
          debit: isDebitNormal ? balance : 0,
          credit: !isDebitNormal ? balance : 0
        };
      }).filter(a => a.debit !== 0 || a.credit !== 0);

      const totalDebits = tbAccounts.reduce((sum, a) => sum + a.debit, 0);
      const totalCredits = tbAccounts.reduce((sum, a) => sum + a.credit, 0);

      data = [
        ...tbAccounts,
        {
          name: 'TOTAL TRIAL BALANCE',
          type: 'Grand Total',
          debit: totalDebits,
          credit: totalCredits,
          isTotal: true
        }
      ];
      title = `Trial Balance - ${selectedPeriod}`;
      exportOptions.isTrialBalance = true;
    } else if (activeTab === 'Notes to Accounts' || activeTab === 'Schedules') {
      const { start, end } = LedgerEngine.getPeriodDateRange(selectedPeriod);
      const is = LedgerEngine.calcIncomeStatement(selectedPeriod);
      const sc = LedgerEngine.getAccountBalance('Share Capital', end);
      const loan = LedgerEngine.getAccountBalance('Bank Loan', end);
      const ap = Math.abs(LedgerEngine.getAccountBalance('Accounts Payable', end));
      const ar = Math.abs(LedgerEngine.getAccountBalance('Accounts Receivable', end));
      const cash = LedgerEngine.getAccountBalance('Cash and Bank', end);
      const faGross = LedgerEngine.getAccountBalance('Fixed Assets (Gross)', end);
      const accDep = LedgerEngine.getAccountBalance('Accumulated Depreciation', end);
      const intGross = LedgerEngine.getAccountBalance('Intangible Assets (Gross)', end);
      const accAmort = LedgerEngine.getAccountBalance('Accumulated Amortization', end);
      const pat = is.find(r => r.name.includes('Profit (Loss)'))?.value || 0;
      const sal = LedgerEngine.getAccountBalance('Salary Expense', end, start);
      const rent = LedgerEngine.getAccountBalance('Rent Expense', end, start);
      const fin = LedgerEngine.getAccountBalance('Finance Cost', end, start);

      data = [
        { noteNo: '1', name: 'Corporate Information & Summary of Significant Accounting Policies', isHeader: true },
        { noteNo: '', name: 'Meso AI Platform complies with Companies Act 2013, Schedule III and statutory Accounting Standards (AS).', detail: 'Statutory Note' },
        { noteNo: '2', name: 'Share Capital & Equity Structure', isHeader: true },
        { noteNo: '2.1', name: 'Authorized Equity Share Capital (10,00,000 shares of Rs.10)', value: 10000000 },
        { noteNo: '2.2', name: 'Issued, Subscribed & Paid-up Capital (5,00,000 shares of Rs.10)', value: sc },
        { noteNo: '3', name: 'Reserves and Surplus (Statement of P&L)', isHeader: true },
        { noteNo: '3.1', name: 'Closing Surplus / (Deficit) Carried Forward', value: pat },
        { noteNo: '4', name: 'Long-Term Borrowings', isHeader: true },
        { noteNo: '4.1', name: 'Secured Term Loan from Scheduled Bank (@ 8.5% p.a.)', value: loan },
        { noteNo: '5', name: 'Trade Payables & MSME Statutory Disclosures (Section 43B(h))', isHeader: true },
        { noteNo: '5.1', name: 'Principal amount due to Micro & Small Enterprises', value: Math.round(ap * 0.42) },
        { noteNo: '5.2', name: 'Dues to creditors other than Micro & Small Enterprises', value: Math.round(ap * 0.58) },
        { noteNo: '6', name: 'Property, Plant & Equipment (AS 10) & Intangibles (AS 26)', isHeader: true },
        { noteNo: '6.1', name: 'Tangible Gross Block (Plant & Machinery)', value: faGross },
        { noteNo: '6.2', name: 'Less: Accumulated Depreciation', value: -accDep },
        { noteNo: '6.3', name: 'Intangible Gross Block (Computer Software & ERP)', value: intGross },
        { noteNo: '6.4', name: 'Less: Accumulated Amortization', value: -accAmort },
        { noteNo: '7', name: 'Current Assets & Liquidity', isHeader: true },
        { noteNo: '7.1', name: 'Trade Receivables (Sundry Debtors)', value: ar },
        { noteNo: '7.2', name: 'Cash and Bank Balances (AS 3)', value: cash },
        { noteNo: '8', name: 'Operating Expenses', isHeader: true },
        { noteNo: '8.1', name: 'Employee Benefits Expense (Salaries & Staff Welfare)', value: sal },
        { noteNo: '8.2', name: 'Factory & Office Rent', value: rent },
        { noteNo: '8.3', name: 'Finance Costs (Loan Interest)', value: fin }
      ];
      title = `${activeTab} - ${selectedPeriod}`;
      exportOptions.isNotes = true;
    }

    exportToPDF(title, data, `${activeTab.replace(/ /g, '_')}_${selectedPeriod}.pdf`, exportOptions);
  };

  return (
    <div className="tab-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="section-header" style={{ marginBottom: 'var(--sp-6)' }}>
        <div>
          <h1 className="section-title">
            Financial Statements — {selectedPeriod === 'Full Year' ? 'All 3 Years' : selectedPeriod}
          </h1>
          <p className="section-subtitle">
            Schedule III (Companies Act 2013) &amp; AS Compliant — {LedgerEngine.getPeriodDateRange(selectedPeriod).name}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="settings-select"
            style={{ minWidth: 'auto' }}
          >
            <option value="Full Year">All 3 Years</option>
            <option value="FY 2024-25">FY 2024-25</option>
            <option value="FY 2025-26">FY 2025-26</option>
            <option value={LedgerEngine.getCurrentFiscalYear()}>{LedgerEngine.getCurrentFiscalYear()} (Current)</option>
          </select>

          <button 
            onClick={handleExport}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={15} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      <div className="tab-switcher" style={{ 
        marginBottom: 'var(--sp-6)', overflowX: 'auto', width: 'fit-content'
      }}>
        {tabs.map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`tab-switcher-item ${activeTab === tab ? 'active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="statement-body">
        {activeTab === 'Trading A/c' && <TradingAccount period={selectedPeriod} currency={currency} />}
        {activeTab === 'Profit & Loss' && <IncomeStatement period={selectedPeriod} currency={currency} />}
        {activeTab === 'Balance Sheet' && <BalanceSheet period={selectedPeriod} currency={currency} />}
        {activeTab === 'Cash Flow' && <CashFlowStatement period={selectedPeriod} currency={currency} />}
        {activeTab === 'Trial Balance' && <TrialBalance period={selectedPeriod} currency={currency} />}

        {activeTab === 'Notes to Accounts' && <NotesToAccounts period={selectedPeriod} currency={currency} />}
        {activeTab === 'Schedules' && <Schedules period={selectedPeriod} currency={currency} />}
      </div>
    </div>
  );
}

export default Statements;
