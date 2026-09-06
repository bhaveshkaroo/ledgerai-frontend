import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const LiveClock = ({ style = {} }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <div 
      style={{
        fontSize: '12px',
        fontFamily: 'var(--font-mono, monospace)',
        color: 'var(--text-muted)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 10px',
        borderRadius: '6px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        ...style
      }}
      title="Live System Clock"
    >
      <Clock size={13} color="#10b981" />
      <span>{dateStr}</span>
      <span style={{ color: '#10b981', fontWeight: 600 }}>{timeStr}</span>
    </div>
  );
};

export default LiveClock;
