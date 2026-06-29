'use client';

import { usePathname } from 'next/navigation';
import { User, Palette, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useTheme } from '@/context/ThemeContext';

import { useAuth } from '@/components/AuthGuard';

export default function Topbar() {
  const supabase = createClient();
  const pathname = usePathname();
  const { theme, changeTheme } = useTheme();
  const { user, activeTenant } = useAuth();
  const userEmail = user?.email || '';

  // Format the title based on the path
  const getTitle = () => {
    if (pathname === '/dashboard') return 'Overview';
    return pathname.charAt(1).toUpperCase() + pathname.slice(2);
  };

  const toggleSidebar = () => {
    document.body.classList.toggle('sidebar-open');
  };

  return (
    <>
      {activeTenant?.subscription_status === 'pending_payment' && (
        <div style={{ backgroundColor: 'var(--warning)', color: '#000', padding: '0.5rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
          Waiting for M-Pesa Confirmation. Some features are restricted until your payment clears.
        </div>
      )}
      <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Hamburger Menu (visible only on small screens) */}
        <button 
          onClick={toggleSidebar}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem', color: 'var(--foreground)' }}
          className="mobile-menu-btn"
        >
          <Menu size={20} />
        </button>


        <h1 className="heading-2" style={{ margin: 0, color: 'var(--foreground)' }}>
          {getTitle()}
        </h1>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        
        {/* Theme Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card)', padding: '0.5rem', borderRadius: '99px', border: '1px solid var(--border)' }}>
          <Palette size={16} className="text-muted" style={{ marginLeft: '0.25rem' }} />
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button 
              onClick={() => changeTheme('midnight')}
              style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#0f172a', border: theme === 'midnight' ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
              title="Midnight Theme"
            />
            <button 
              onClick={() => changeTheme('ocean')}
              style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#083344', border: theme === 'ocean' ? '2px solid #06b6d4' : '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
              title="Ocean Theme"
            />
            <button 
              onClick={() => changeTheme('forest')}
              style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#022c22', border: theme === 'forest' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
              title="Forest Theme"
            />
            <button 
              onClick={() => changeTheme('sunset')}
              style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#2e1065', border: theme === 'sunset' ? '2px solid #f97316' : '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
              title="Sunset Theme"
            />
          </div>
        </div>

        <div className="badge badge-success" style={{ padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
          {activeTenant ? activeTenant.name : 'No Tenant'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--card)', borderRadius: '99px', border: '1px solid var(--border)' }}>
          <User size={16} className="text-muted" />
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{userEmail || 'Guest'}</span>
        </div>
      </div>
    </header>
    </>
  );
}
