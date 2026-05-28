'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Package, Users, ShoppingCart, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    products: 0,
    customers: 0,
    transactions: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch basic stats (simplified for the dashboard)
      try {
        const [
          { count: productCount },
          { count: customerCount },
          { count: transactionCount },
          { data: transData }
        ] = await Promise.all([
          supabase.from('product').select('*', { count: 'exact', head: true }),
          supabase.from('customer').select('*', { count: 'exact', head: true }),
          supabase.from('transaction').select('*', { count: 'exact', head: true }),
          supabase.from('transaction').select('GRANDTOTAL')
        ]);

        // Calculate total revenue (assuming GRANDTOTAL is string with commas)
        const revenue = transData?.reduce((acc, curr) => {
          const val = parseFloat(curr.GRANDTOTAL.replace(/,/g, ''));
          return acc + (isNaN(val) ? 0 : val);
        }, 0) || 0;

        setStats({
          products: productCount || 0,
          customers: customerCount || 0,
          transactions: transactionCount || 0,
          revenue: revenue
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [router]);

  const statCards = [
    { title: 'Total Revenue', value: `Ksh. ${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: 'var(--primary)' },
    { title: 'Total Transactions', value: stats.transactions, icon: ShoppingCart, color: '#10b981' },
    { title: 'Registered Customers', value: stats.customers, icon: Users, color: '#f59e0b' },
    { title: 'Inventory Items', value: stats.products, icon: Package, color: '#8b5cf6' },
  ];

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>Loading dashboard...</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="grid-cards" style={{ marginBottom: '2rem' }}>
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                background: `rgba(${stat.color === 'var(--primary)' ? '59, 130, 246' : stat.color === '#10b981' ? '16, 185, 129' : stat.color === '#f59e0b' ? '245, 158, 11' : '139, 92, 246'}, 0.1)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={24} style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 500 }}>{stat.title}</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--foreground)' }}>{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass" style={{ padding: '1.5rem' }}>
        <h3 className="heading-2" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Recent Activity</h3>
        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
          <p className="text-muted">Activity graph will be generated here</p>
        </div>
      </div>
    </div>
  );
}
