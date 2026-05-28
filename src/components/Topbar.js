'use client';

import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Topbar() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserEmail(user.email);
    });
  }, []);

  if (pathname === '/login') return null;

  // Format the title based on the path
  const getTitle = () => {
    if (pathname === '/') return 'Overview';
    return pathname.charAt(1).toUpperCase() + pathname.slice(2);
  };

  return (
    <header className="topbar">
      <div>
        <h1 className="heading-2" style={{ margin: 0, color: 'var(--foreground)' }}>
          {getTitle()}
        </h1>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="badge badge-success">Online</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--card)', borderRadius: '99px', border: '1px solid var(--border)' }}>
          <User size={16} className="text-muted" />
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{userEmail || 'Admin'}</span>
        </div>
      </div>
    </header>
  );
}
