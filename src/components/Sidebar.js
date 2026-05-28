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
  LogOut 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide sidebar on login page
  if (pathname === '/login') return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Point of Sale', path: '/pos', icon: ShoppingCart },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Suppliers', path: '/suppliers', icon: Truck },
    { name: 'Transactions', path: '/transactions', icon: FileText },
    { name: 'Employees', path: '/employees', icon: Users },
  ];

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <h2 className="heading-2" style={{ marginBottom: 0, fontSize: '1.25rem', color: 'var(--primary)' }}>AutoSpares Pro</h2>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
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
