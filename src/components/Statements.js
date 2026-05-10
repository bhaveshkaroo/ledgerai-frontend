import React, { useState } from 'react';
import IncomeStatement from './IncomeStatement';
import CashFlowStatement from './CashFlowStatement';
import BalanceSheet from './BalanceSheet';
import { AlertCircle } from 'lucide-react';

function Statements({ period }) {
  const [activeSubTab, setActiveSubTab] = useState('Income Statement');

  const tabs = ['Income Statement', 'Cash Flow Statement', 'Balance Sheet'];

  return (
    <div className="statements-wrapper">
      <div className="period-notice">
        <AlertCircle size={16} />
        <span>Currently viewing data for <strong>{period}</strong> | FY 2025-26</span>
      </div>

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
        {activeSubTab === 'Income Statement' && <IncomeStatement period={period} />}
        {activeSubTab === 'Cash Flow Statement' && <CashFlowStatement period={period} />}
        {activeSubTab === 'Balance Sheet' && <BalanceSheet period={period} />}
      </div>

      <style jsx>{`
        .statements-wrapper {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .period-notice {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: var(--accent-blue);
          padding: 12px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
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
          background: rgba(0, 229, 255, 0.1);
          color: var(--accent-cyan);
        }
      `}</style>
    </div>
  );
}

export default Statements;
