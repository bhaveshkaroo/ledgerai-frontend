import React, { useState, useMemo } from 'react';
import { InventoryEngine } from '../utils/InventoryEngine';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';
import { Package, ArrowDownLeft, ArrowUpRight, Search, Layers, RefreshCw } from 'lucide-react';

function Inventory({ period }) {
  const [selectedPeriod, setSelectedPeriod] = useState(period || LedgerEngine.getCurrentFiscalYear());
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const items = useMemo(() => {
    return InventoryEngine.getItemSummary();
  }, []);

  const movements = useMemo(() => {
    const { start, end } = LedgerEngine.getPeriodDateRange(selectedPeriod);
    return InventoryEngine.movements.filter(m => {
      return (!start || m.date >= start) && (!end || m.date <= end);
    });
  }, [selectedPeriod]);

  const totalValuation = useMemo(() => {
    return InventoryEngine.getStockValuation();
  }, []);

  const totalUnits = useMemo(() => {
    return items.reduce((sum, item) => sum + item.totalQty, 0);
  }, [items]);

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const matchSearch = m.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.party.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [movements, searchTerm]);

  return (
    <div className="tab-content" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Inventory Management</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            FIFO stock valuation, real-time balances &amp; movement history — {LedgerEngine.getPeriodDateRange(selectedPeriod).name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="Full Year">All 3 Years (FY 2024-27)</option>
            <option value="FY 2024-25">FY 2024-25</option>
            <option value="FY 2025-26">FY 2025-26</option>
            <option value={LedgerEngine.getCurrentFiscalYear()}>{LedgerEngine.getCurrentFiscalYear()} (Current)</option>
          </select>
        </div>
      </div>


      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Total Inventory Valuation</div>
          <div style={{ fontSize: '22px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#10b981' }}>{formatINR(totalValuation)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>AS 2 FIFO Cost Basis</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Total Stock on Hand</div>
          <div style={{ fontSize: '22px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            {totalUnits.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>Units</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>Physical Goods in Warehouse</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Product Lines</div>
          <div style={{ fontSize: '22px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            {items.length} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>Active Items</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>Integrated with Sales Invoicing</div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="statements-nav" style={{ 
        display: 'flex', gap: '24px', borderBottom: '1px solid var(--border)', marginBottom: 'var(--space-6)'
      }}>
        <div 
          onClick={() => setActiveTab('overview')}
          style={{ 
            paddingBottom: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
            color: activeTab === 'overview' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'overview' ? '2px solid var(--text-primary)' : '2px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          Stock Overview
        </div>
        <div 
          onClick={() => setActiveTab('movements')}
          style={{ 
            paddingBottom: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
            color: activeTab === 'movements' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'movements' ? '2px solid var(--text-primary)' : '2px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          Stock Movement Log ({movements.length})
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Item Name / Code</th>
                <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Active FIFO Batches</th>
                <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>On-Hand Quantity</th>
                <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Avg Unit Cost Basis</th>
                <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Total Inventory Value</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.itemCode} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ padding: '6px', borderRadius: '6px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                        <Package size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.itemCode}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>HSN: 8471 • Hardware Goods</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', background: 'var(--bg-surface)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      {item.batchesCount} {item.batchesCount === 1 ? 'batch' : 'batches'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600 }}>
                    {item.totalQty.toLocaleString()} units
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {formatINR(Math.round(item.unitCostBasis))}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#10b981' }}>
                    {formatINR(item.totalValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'movements' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <div className="command-bar-trigger" style={{ width: '280px' }}>
              <Search size={14} />
              <input 
                type="text" 
                placeholder="Search movements, party, ref..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', width: '100%' }}
              />
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                  <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description / Party</th>
                  <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Quantity</th>
                  <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Unit Cost</th>
                  <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Movement Value</th>
                  <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Balance On-Hand</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No inventory movements found.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                      <td style={{ padding: '14px 20px', fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {m.date}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: m.type === 'IN' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                          color: m.type === 'IN' ? '#10b981' : '#3b82f6'
                        }}>
                          {m.type === 'IN' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                          {m.type === 'IN' ? 'Inward / Buy' : 'Outward / Sell'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{m.party}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{m.ref}</div>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>
                        <span style={{ color: m.type === 'IN' ? '#10b981' : 'var(--text-primary)' }}>
                          {m.type === 'IN' ? '+' : '-'}{m.qty}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {formatINR(Math.round(m.unitCost))}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>
                        {formatINR(m.totalValue)}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {m.balanceQty} units
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
