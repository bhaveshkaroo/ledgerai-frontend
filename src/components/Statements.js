import React, { useState, useEffect } from 'react';
import IncomeStatement from './IncomeStatement';
import CashFlowStatement from './CashFlowStatement';
import BalanceSheet from './BalanceSheet';
import Ledger from './Ledger';
import { Download, Printer } from 'lucide-react';

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

  return (
    <div className="statements-container" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="pill-nav">
          {tabs.map(tab => (
            <button
              key={tab}
              className={`pill-btn ${activeSubTab === tab ? 'active' : ''}`}
              onClick={() => setActiveSubTab(tab)}
              style={{
                padding: '10px 24px',
                borderRadius: 30,
                border: activeSubTab === tab ? '1px solid var(--accent-navy)' : 'none',
                background: activeSubTab === tab ? '#fff' : '#E2E8F0',
                color: activeSubTab === tab ? 'var(--accent-navy)' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ 
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', 
            borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>
            <Printer size={16} /> Print Document
          </button>
          <button style={{ 
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', 
            borderRadius: 8, background: 'var(--accent-navy)', color: '#fff',
            border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>
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
