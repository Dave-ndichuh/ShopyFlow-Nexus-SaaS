'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, Wrench, User as UserIcon, LogOut, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EmployeeDashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
    });
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 className="heading-1" style={{ marginBottom: '0.5rem' }}>Welcome Back!</h1>
          <p className="text-muted" style={{ fontSize: '1.125rem' }}>Employee Portal: {user.email}</p>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ color: '#ef4444' }}>
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* POS Module Card */}
        <Link href="/pos" style={{ textDecoration: 'none' }}>
          <div className="glass" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', transition: 'transform 0.2s', cursor: 'pointer', borderTop: '4px solid var(--primary)' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1rem' }}>
              <ShoppingCart size={48} color="var(--primary)" />
            </div>
            <h2 className="heading-2" style={{ margin: 0 }}>Point of Sale</h2>
            <p className="text-muted">Process customer checkouts, handle hybrid payments, and log credit sales.</p>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600 }}>
              Launch POS <ArrowRight size={18} />
            </div>
          </div>
        </Link>

        {/* Services Module Card */}
        <Link href="/services" style={{ textDecoration: 'none' }}>
          <div className="glass" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', transition: 'transform 0.2s', cursor: 'pointer', borderTop: '4px solid #10b981' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1rem' }}>
              <Wrench size={48} color="#10b981" />
            </div>
            <h2 className="heading-2" style={{ margin: 0 }}>Service Center</h2>
            <p className="text-muted">Manage active repair tickets, assign inventory parts to services, and update statuses.</p>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 600 }}>
              Manage Services <ArrowRight size={18} />
            </div>
          </div>
        </Link>

        {/* Profile Card */}
        <div className="glass" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', borderTop: '4px solid #8b5cf6' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <UserIcon size={48} color="#8b5cf6" />
          </div>
          <h2 className="heading-2" style={{ margin: 0 }}>My Account</h2>
          <p className="text-muted">You are currently logged in via secure Magic Link authentication.</p>
          <div style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
            Role: <strong>Employee</strong>
          </div>
        </div>

      </div>

    </div>
  );
}
