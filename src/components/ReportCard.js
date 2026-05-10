import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function ReportCard() {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/reports/summary`);
      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error("Error fetching summary:", error);
      setSummary("Failed to generate summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const cardStyle = {
    backgroundColor: 'var(--card)',
    borderRadius: '8px',
    padding: '30px',
    border: '1px solid #eaeaea',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    maxWidth: '600px',
    margin: '0 auto',
    marginTop: '40px'
  };

  const skeletonStyle = {
    height: '100px',
    backgroundColor: 'var(--hover-bg)',
    borderRadius: '4px',
    animation: 'pulse 1.5s infinite ease-in-out'
  };

  const buttonStyle = {
    backgroundColor: 'var(--primary)',
    color: 'var(--text)',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '20px',
    width: '100%'
  };

  return (
    <div>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}
      </style>
      
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333', textAlign: 'center' }}>
          Sharma Textiles Pvt Ltd
        </h2>
        
        {loading ? (
          <div style={skeletonStyle}></div>
        ) : (
          <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#444' }}>
            {summary}
          </p>
        )}
        
        <button 
          style={buttonStyle} 
          onClick={fetchSummary}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Regenerate Summary'}
        </button>
      </div>
    </div>
  );
}

export default ReportCard;
