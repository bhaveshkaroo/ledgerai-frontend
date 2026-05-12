import React, { useState, useEffect } from 'react';
import IncomeStatement from './IncomeStatement';
import CashFlowStatement from './CashFlowStatement';
import BalanceSheet from './BalanceSheet';
import Ledger from './Ledger';
import { Download, Printer } from 'lucide-react';
import { exportToPDF } from '../utils/exportUtils';
import { LedgerEngine } from '../utils/LedgerEngine';

function Statements({ period, initialTab }) {
  const [activeSubTab, setActiveSubTab] = useState('Income Statement');

  useEffect(() => {
    if (initialTab) {
      const tabMap = {
        'IncomeStatement': 'Income Statement',
        'BalanceSheet': 'Balance Sheet',
        'CashFlow': 'Cash Flow Statement',
        'TrialBalance': 'Trial Balance',
        'LedgerBook': 'Ledger Book'
      };
      if (tabMap[initialTab]) setActiveSubTab(tabMap[initialTab]);
    }
  }, [initialTab]);

  const tabs = ['Income Statement', 'Cash Flow Statement', 'Balance Sheet', 'Ledger Book'];

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    let title = activeSubTab;
    let headers = [];
    let data = [];

    if (activeSubTab === 'Income Statement') {
      const stmt = LedgerEngine.calcIncomeStatement(period);
      headers = ['Category', 'Amount (₹)'];
      data = [
        ['Total Revenue', stmt.totalRevenue.toLocaleString()],
        ['Total Expenses', stmt.totalExpenses.toLocaleString()],
        ['Net Profit', stmt.netProfit.toLocaleString()]
      ];
    } else if (activeSubTab === 'Balance Sheet') {
      const stmt = LedgerEngine.calcBalanceSheet(period);
      headers = ['Category', 'Amount (₹)'];
      data = [
        ['Total Assets', stmt.totalAssets.toLocaleString()],
        ['Total Liabilities', stmt.totalLiabilities.toLocaleString()],
        ['Equity', stmt.equity.toLocaleString()]
      ];
    } else {
      // Generic export for others
      headers = ['Report', 'Date', 'Status'];
      data = [[activeSubTab, period, 'Generated']];
    }

    exportToPDF(title, headers, data, `${title.replace(/ /g, '_')}_${period}.pdf`);
  };

  return (
    <div className="statements-container" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="stmt-tab-bar">
          {tabs.map(tab => (
            <button
              key={tab}
              className={`stmt-tab ${activeSubTab === tab ? 'active' : ''}`}
              onClick={() => setActiveSubTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="no-print" style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={handlePrint}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', 
              borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}
          >
            <Printer size={16} /> Print Document
          </button>
          <button 
            onClick={handleDownload}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', 
              borderRadius: 8, background: 'var(--accent-navy)', color: '#fff',
              border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}
          >
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>

      <div className="statement-render-area">
        {activeSubTab === 'Income Statement' && <IncomeStatement period={period} />}
        {activeSubTab === 'Cash Flow Statement' && <CashFlowStatement period={period} />}
        {activeSubTab === 'Balance Sheet' && <BalanceSheet period={period} />}
        {activeSubTab === 'Ledger Book' && <Ledger period={period} />}
      </div>
    </div>
  );
}

export default Statements;
