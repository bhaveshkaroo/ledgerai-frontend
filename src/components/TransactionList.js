import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function TransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classifyingId, setClassifyingId] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${API_URL}/transactions/all`);
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError(`Failed to fetch transactions from ${API_URL}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClassify = async (txn) => {
    setClassifyingId(txn.id);
    try {
      const response = await fetch(`${API_URL}/transactions/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: txn.description,
          amount: txn.amount
        }),
      });
      
      const data = await response.json();
      
      // Update the transaction in the list
      setTransactions(prev => prev.map(t => 
        t.id === txn.id ? { ...t, category: data.category } : t
      ));
    } catch (error) {
      console.error("Error classifying transaction:", error);
    } finally {
      setClassifyingId(null);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading transactions...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#fff1f0', border: '1px solid #ffa39e', borderRadius: '8px', color: '#cf1322' }}>
        <h3>Connection Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  };

  const thStyle = {
    textAlign: 'left',
    padding: '12px 15px',
    borderBottom: '2px solid #ddd',
    backgroundColor: '#f5f5f5',
    color: '#333'
  };

  const tdStyle = {
    padding: '12px 15px',
    borderBottom: '1px solid #ddd'
  };

  const buttonStyle = {
    backgroundColor: '#1D9E75',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  };

  return (
    <div>
      <h2>Transactions</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Description</th>
            <th style={thStyle}>Amount</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Category</th>
            <th style={thStyle}>Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(txn => (
            <tr key={txn.id}>
              <td style={tdStyle}>{txn.date}</td>
              <td style={tdStyle}>{txn.description}</td>
              <td style={{
                ...tdStyle,
                color: txn.type === 'credit' ? 'green' : 'red',
                fontWeight: 'bold'
              }}>
                ₹{txn.amount.toLocaleString('en-IN')}
              </td>
              <td style={tdStyle}>{txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}</td>
              <td style={tdStyle}>{txn.category || '-'}</td>
              <td style={tdStyle}>
                <button 
                  style={classifyingId === txn.id ? disabledButtonStyle : buttonStyle}
                  onClick={() => handleClassify(txn)}
                  disabled={classifyingId === txn.id}
                >
                  {classifyingId === txn.id ? 'Loading...' : 'Classify with AI'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionList;
