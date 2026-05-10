import React, { useState } from 'react';
import { Plus, ReceiptText, FilePlus, Search, Sparkles } from 'lucide-react';

const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: <ReceiptText size={18} />, label: 'Add Transaction', color: '#14B8A6' },
    { icon: <FilePlus size={18} />, label: 'Add Invoice', color: '#3B82F6' },
    { icon: <Search size={18} />, label: 'Run Audit', color: '#8B5CF6' },
    { icon: <Sparkles size={18} />, label: 'Ask AI', color: '#C9A84C' },
  ];

  return (
    <div style={{ position: 'fixed', bottom: 40, right: 40, zIndex: 2000 }}>
      {/* Speed Dial Menu */}
      <div style={{ 
        display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16,
        alignItems: 'flex-end', transition: 'all 0.3s ease',
        transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none'
      }}>
        {actions.map((action, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <span style={{ 
              backgroundColor: '#fff', padding: '4px 12px', borderRadius: 4, 
              fontSize: 12, fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              color: 'var(--accent-navy)'
            }}>
              {action.label}
            </span>
            <div style={{ 
              width: 40, height: 40, borderRadius: '50%', backgroundColor: action.color,
              display: 'flex', alignItems: 'center', justifyCenter: 'center', color: '#fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              {action.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main FAB */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: 56, height: 56, borderRadius: '50%', backgroundColor: 'var(--accent-gold)',
          display: 'flex', alignItems: 'center', justifyCenter: 'center', color: '#fff',
          boxShadow: '0 4px 20px rgba(201, 168, 76, 0.4)', cursor: 'pointer',
          transition: 'transform 0.3s ease',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0)'
        }}
      >
        <Plus size={24} strokeWidth={3} />
      </div>
      
      <style jsx>{`
        div {
            justify-content: center !important;
        }
      `}</style>
    </div>
  );
};

export default FloatingActionButton;
