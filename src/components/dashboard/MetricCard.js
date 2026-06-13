import React from 'react';

export default function MetricCard({ title, icon, value, subline, accentColor = 'var(--primary)', className = '' }) {
  return (
    <div 
      className={`glass metric-card ${className}`} 
      style={{ 
        padding: '1.5rem', 
        borderTop: `4px solid ${accentColor}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
        {icon && <span style={{ color: accentColor, display: 'flex' }}>{icon}</span>}
        <span style={{ fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
      </div>
      
      <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.1, marginBottom: '0.5rem' }}>
        {value}
      </div>
      
      {subline && (
        <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>
          {subline}
        </div>
      )}
    </div>
  );
}
