'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, Wrench, User as UserIcon, LogOut, ArrowRight, FileText, Activity, DollarSign, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EmployeeDashboard() {
  const [user, setUser] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [metrics, setMetrics] = useState({ todaySales: 0, todayRevenue: 0, pendingCredit: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
        fetchMetrics(user);
      }
    });
  }, [router]);

  const fetchMetrics = async (currentUser) => {
    setLoading(true);
    
    // Fetch Employee Details
    if (currentUser?.email) {
      const { data: empData } = await supabase
        .from('employee')
        .select('FIRST_NAME, LAST_NAME, USERNAME')
        .eq('EMAIL', currentUser.email)
        .maybeSingle();
      if (empData) setEmployeeDetails(empData);
    }

    // Get today's bounds in local time
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch Today's Transactions
    const { data: transData } = await supabase
      .from('transaction')
      .select('GRAND_TOTAL, ADJUSTED_TOTAL, IS_CREDIT')
      .gte('CREATED_AT', startOfDay.toISOString())
      .lte('CREATED_AT', endOfDay.toISOString());

    if (transData) {
      const todaySales = transData.length;
      const todayRevenue = transData.reduce((acc, t) => acc + (t.ADJUSTED_TOTAL || t.GRAND_TOTAL), 0);
      
      const { count: creditCount } = await supabase
        .from('transaction')
        .select('*', { count: 'exact', head: true })
        .eq('IS_CREDIT', true);

      setMetrics({ todaySales, todayRevenue, pendingCredit: creditCount || 0 });
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.body.classList.remove('sidebar-open');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 className="heading-1" style={{ marginBottom: '0.5rem' }}>Employee Dashboard</h1>
          <p className="text-muted" style={{ fontSize: '1.125rem' }}>
            Welcome back, {employeeDetails ? <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{employeeDetails.FIRST_NAME} {employeeDetails.LAST_NAME} (@{employeeDetails.USERNAME})</span> : user.email}
          </p>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ color: '#ef4444' }}>
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* KPI Cards */}
      <div className="metrics-grid" style={{ display: 'grid', gap: '1.5rem', marginBottom: '3rem' }}>
        <style jsx>{`
          .metrics-grid { grid-template-columns: repeat(3, 1fr); }
          @media (max-width: 1024px) { .metrics-grid { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 640px) { .metrics-grid { grid-template-columns: 1fr; } }
        `}</style>
        
        <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
            <Activity size={18} /> <span style={{ fontWeight: 500 }}>Transactions Today</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>
            {loading ? '-' : metrics.todaySales}
          </div>
        </div>

        <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
            <DollarSign size={18} /> <span style={{ fontWeight: 500 }}>Revenue Today</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
            {loading ? '-' : `Ksh ${(metrics.todayRevenue / 1000).toFixed(1)}k`}
          </div>
        </div>

        <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
            <CreditCard size={18} /> <span style={{ fontWeight: 500 }}>Total Credit Sales</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>
            {loading ? '-' : metrics.pendingCredit}
          </div>
        </div>
      </div>

      <h2 className="heading-2" style={{ marginBottom: '1.5rem' }}>Quick Actions</h2>
      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        
        {/* POS Module Card */}
        <Link href="/pos" style={{ textDecoration: 'none' }}>
          <div className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s', cursor: 'pointer', height: '100%' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '12px', width: 'fit-content' }}>
              <ShoppingCart size={32} color="var(--primary)" />
            </div>
            <h3 className="heading-2" style={{ margin: 0, fontSize: '1.25rem' }}>New Sale (POS)</h3>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>Process customer checkouts, handle hybrid payments, and log credit sales.</p>
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem' }}>
              Launch POS <ArrowRight size={16} />
            </div>
          </div>
        </Link>

        {/* Transactions Card */}
        <Link href="/transactions" style={{ textDecoration: 'none' }}>
          <div className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s', cursor: 'pointer', height: '100%' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: '12px', width: 'fit-content' }}>
              <FileText size={32} color="#8b5cf6" />
            </div>
            <h3 className="heading-2" style={{ margin: 0, fontSize: '1.25rem' }}>Lookup & Receipts</h3>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>Search past transactions, view details, and print customer receipts or invoices.</p>
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6', fontWeight: 600, fontSize: '0.875rem' }}>
              View History <ArrowRight size={16} />
            </div>
          </div>
        </Link>

        {/* Services Module Card */}
        <Link href="/services" style={{ textDecoration: 'none' }}>
          <div className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s', cursor: 'pointer', height: '100%' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px', width: 'fit-content' }}>
              <Wrench size={32} color="#10b981" />
            </div>
            <h3 className="heading-2" style={{ margin: 0, fontSize: '1.25rem' }}>Service Center</h3>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>Manage active repair tickets, assign inventory parts to services, and update statuses.</p>
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 600, fontSize: '0.875rem' }}>
              Manage Services <ArrowRight size={16} />
            </div>
          </div>
        </Link>

      </div>

    </div>
  );
}

