import React, { useState } from 'react';
import IncomeStatement from './IncomeStatement';
import CashFlowStatement from './CashFlowStatement';
import BalanceSheet from './BalanceSheet';

function Statements() {
  const [activeSubTab, setActiveSubTab] = useState('Income Statement');

  const tabs = ['Income Statement', 'Cash Flow Statement', 'Balance Sheet'];

  return (
    <div className="statements-wrapper">
      {/* Sub-navigation bar */}
      <div className="sub-nav">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`sub-nav-btn ${activeSubTab === tab ? 'active' : ''}`}
            onClick={() => setActiveSubTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="statement-content">
        {activeSubTab === 'Income Statement' && <IncomeStatement />}
        {activeSubTab === 'Cash Flow Statement' && <CashFlowStatement />}
        {activeSubTab === 'Balance Sheet' && <BalanceSheet />}
      </div>

      <style jsx>{`
        .statements-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .sub-nav {
          display: flex;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
          margin-bottom: 8px;
        }
        .sub-nav-btn {
          padding: 10px 20px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          border-radius: 30px;
          transition: all 0.2s;
        }
        .sub-nav-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
        }
        .sub-nav-btn.active {
          background: rgba(59, 130, 246, 0.15);
          color: var(--accent-blue);
        }
      `}</style>
    </div>
  );
}

export default Statements;
