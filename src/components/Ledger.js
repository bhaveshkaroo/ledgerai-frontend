import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function Ledger() {
  const [selectedAccount, setSelectedAccount] = useState('Revenue');
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);

  const categories = [
    'Revenue', 'Salary Expense', 'Rent Expense', 'GST Payment', 
    'TDS Payment', 'Vendor Payment', 'Utility Expense', 
    'Bank Charges', 'Loan Repayment', 'Miscellaneous'
  ];

  useEffect(() => {
    fetchAccountLedger();
  }, [selectedAccount]);

  const fetchAccountLedger = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/ledger/account?name=${selectedAccount}`);
      const data = await response.json();
      setLedgerData(data);
    } catch (error) {
      console.error("Error fetching ledger:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Sharma Textiles Pvt Ltd", 14, 15);
    doc.setFontSize(12);
    doc.text(`General Ledger: ${selectedAccount}`, 14, 22);
    doc.text(`Closing Balance: Rs. ${ledgerData.closing_balance.toLocaleString('en-IN')}`, 14, 30);

    const tableRows = ledgerData.entries.map(entry => [
      entry.date,
      entry.narration,
      entry.debit > 0 ? entry.debit.toLocaleString('en-IN') : '-',
      entry.credit > 0 ? entry.credit.toLocaleString('en-IN') : '-',
      entry.balance.toLocaleString('en-IN')
    ]);

    doc.autoTable({
      startY: 35,
      head: [['Date', 'Narration', 'Debit (Dr)', 'Credit (Cr)', 'Balance']],
      body: tableRows,
    });

    doc.save(`Ledger_${selectedAccount}.pdf`);
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
    backgroundColor: 'white'
  };

  const thStyle = {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #ddd',
    backgroundColor: '#f5f5f5'
  };

  const tdStyle = {
    padding: '12px',
    borderBottom: '1px solid #eee'
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>General Ledger</h2>
        {ledgerData && (
          <button 
            onClick={downloadPDF}
            style={{ backgroundColor: '#0A1628', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Download PDF
          </button>
        )}
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Select Account:</label>
        <select 
          value={selectedAccount} 
          onChange={(e) => setSelectedAccount(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {loading ? <p>Loading ledger...</p> : ledgerData && (
        <>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div style={{ padding: '15px', backgroundColor: '#e6f7ff', borderRadius: '8px', flex: 1 }}>
              <strong>Total Debits:</strong> ₹{ledgerData.total_debits.toLocaleString('en-IN')}
            </div>
            <div style={{ padding: '15px', backgroundColor: '#f6ffed', borderRadius: '8px', flex: 1 }}>
              <strong>Total Credits:</strong> ₹{ledgerData.total_credits.toLocaleString('en-IN')}
            </div>
            <div style={{ padding: '15px', backgroundColor: '#fff7e6', borderRadius: '8px', flex: 1 }}>
              <strong>Closing Balance:</strong> ₹{ledgerData.closing_balance.toLocaleString('en-IN')}
            </div>
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Narration</th>
                <th style={thStyle}>Debit (Dr)</th>
                <th style={thStyle}>Credit (Cr)</th>
                <th style={thStyle}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledgerData.entries.map((entry, i) => (
                <tr key={i}>
                  <td style={tdStyle}>{entry.date}</td>
                  <td style={tdStyle}>{entry.narration}</td>
                  <td style={{ ...tdStyle, color: entry.debit > 0 ? 'red' : '#333' }}>
                    {entry.debit > 0 ? `₹${entry.debit.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td style={{ ...tdStyle, color: entry.credit > 0 ? 'green' : '#333' }}>
                    {entry.credit > 0 ? `₹${entry.credit.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 'bold' }}>₹{entry.balance.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default Ledger;
