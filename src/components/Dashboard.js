import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function Dashboard() {
  const [plData, setPlData] = useState(null);
  const [cashflowData, setCashflowData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plRes, cfRes] = await Promise.all([
          fetch(`${API_URL}/reports/pl`),
          fetch(`${API_URL}/reports/cashflow`)
        ]);
        
        const pl = await plRes.json();
        const cf = await cfRes.json();
        
        setPlData(pl);
        setCashflowData(cf);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading dashboard data...</div>;
  }

  const formatRupees = (amount) => {
    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
  };

  const cardContainerStyle = {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px'
  };

  const cardStyle = {
    flex: 1,
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    backgroundColor: 'white',
    textAlign: 'center'
  };

  const profitColor = plData?.net_profit >= 0 ? 'green' : 'red';

  // Find max balance for chart scaling
  const maxBalance = cashflowData ? Math.max(...cashflowData.map(d => d.balance)) : 1;

  const chartContainerStyle = {
    display: 'flex',
    alignItems: 'flex-end',
    height: '200px',
    gap: '10px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    marginTop: '20px',
    overflowX: 'auto'
  };

  return (
    <div>
      <h2>Dashboard</h2>
      
      <div style={cardContainerStyle}>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 10px 0', color: '#555' }}>Total Revenue</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'green', margin: 0 }}>
            {plData && formatRupees(plData.total_revenue)}
          </p>
        </div>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 10px 0', color: '#555' }}>Total Expenses</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'red', margin: 0 }}>
            {plData && formatRupees(plData.total_expenses)}
          </p>
        </div>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 10px 0', color: '#555' }}>Net Profit</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: profitColor, margin: 0 }}>
            {plData && formatRupees(plData.net_profit)}
          </p>
        </div>
      </div>

      <h3>Cash Flow</h3>
      <div style={chartContainerStyle}>
        {cashflowData && cashflowData.map((day, index) => {
          // Calculate height as percentage of max
          const heightPercent = Math.max((day.balance / maxBalance) * 100, 5); // min 5% height
          
          return (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                height: `${heightPercent}%`,
                width: '30px',
                backgroundColor: '#1D9E75',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s'
              }}></div>
              <span style={{ fontSize: '10px', marginTop: '5px', color: '#666' }}>
                {day.date.split('-').slice(1).join('/')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;
