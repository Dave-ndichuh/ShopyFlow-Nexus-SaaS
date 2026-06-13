'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  Truck, 
  FileText, 
  Settings,
  LogOut,
  BarChart3,
  Wrench,
  Boxes
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/AuthGuard';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, t, branches, activeBranch, setActiveBranch } = useAuth();
  const [supabase] = useState(() => createClient());

  // Hide sidebar on login pages
  if (pathname === '/login') return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.body.classList.remove('sidebar-open');
    router.push('/login');
  };

  const closeSidebar = () => {
    document.body.classList.remove('sidebar-open');
  };

  let navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: t('pos'), path: '/pos', icon: ShoppingCart },
    { name: t('catalog'), path: '/products', icon: Package },
    { name: 'Inventory', path: '/inventory', icon: Boxes },
    { name: t('contacts'), path: '/customers', icon: Users },
    { name: t('vendors'), path: '/suppliers', icon: Truck },
    { name: t('orders'), path: '/transactions', icon: FileText },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--foreground)', letterSpacing: '-0.05em', margin: 0 }}>
          Nexus
        </h2>
        
        {branches && branches.length > 0 && (
          <select 
            className="input" 
            style={{ width: '100%', fontSize: '0.875rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)' }}
            value={activeBranch?.id || ''}
            onChange={(e) => {
              const b = branches.find(branch => branch.id === e.target.value);
              if (b) setActiveBranch(b);
            }}
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              onClick={closeSidebar}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
        <button className="nav-item" onClick={handleLogout} style={{ width: '100%', justifyContent: 'flex-start', background: 'none', border: 'none', cursor: 'pointer' }}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
