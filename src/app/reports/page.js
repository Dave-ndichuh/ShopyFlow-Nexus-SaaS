'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart3, TrendingUp, AlertCircle, PackageSearch, Download } from 'lucide-react';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    todaySales: 0,
    monthlyRevenue: 0,
    transactionCount: 0,
  });
  const [lowStock, setLowStock] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      // 1. Fetch Transactions for Metrics & Top Products
      // Note: In an enterprise app with millions of rows, use Postgres Views or RPC functions.
      // For this demo, we'll fetch the last 1000 transactions and calculate in JS.
      const { data: transData } = await supabase
        .from('transaction')
        .select(`
          *,
          transaction_details (
            PRODUCT_ID,
            QTY,
            product (NAME)
          )
        `)
        .order('CREATED_AT', { ascending: false })
        .limit(1000);

      let tSales = 0;
      let mRevenue = 0;
      let tCount = 0;
      const productSales = {};

      const now = new Date();
      const todayString = now.toISOString().split('T')[0];
      const thisMonthString = todayString.slice(0, 7);

      if (transData) {
        transData.forEach(t => {
          const tDate = t.CREATED_AT.split('T')[0];
          const tMonth = tDate.slice(0, 7);
          
          if (tMonth === thisMonthString) {
            mRevenue += Number(t.GRAND_TOTAL) || 0;
            tCount++;
          }
          if (tDate === todayString) {
            tSales += Number(t.GRAND_TOTAL) || 0;
          }

          // Aggregate Top Products
          if (t.transaction_details) {
            t.transaction_details.forEach(d => {
              if (!d.product) return; // In case product was deleted
              if (!productSales[d.PRODUCT_ID]) {
                productSales[d.PRODUCT_ID] = { name: d.product.NAME, qty: 0 };
              }
              productSales[d.PRODUCT_ID].qty += Number(d.QTY);
            });
          }
        });
      }

      const sortedProducts = Object.values(productSales)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

      // 2. Fetch Low Stock Products
      const { data: prodData } = await supabase
        .from('product')
        .select('*')
        .lte('ON_HAND', 5)
        .order('ON_HAND', { ascending: true });

      setMetrics({ todaySales: tSales, monthlyRevenue: mRevenue, transactionCount: tCount });
      setTopProducts(sortedProducts);
      if (prodData) setLowStock(prodData);
      
      setLoading(false);
    };

    fetchAnalytics();
  }, []);

  const exportCSV = () => {
    // A simple CSV export for demo purposes
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Metric,Value\n";
    csvContent += `Today's Sales,${metrics.todaySales}\n`;
    csvContent += `Monthly Revenue,${metrics.monthlyRevenue}\n`;
    csvContent += `Total Monthly Transactions,${metrics.transactionCount}\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sales_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading analytics...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="heading-2" style={{ margin: 0 }}>Reports & Analytics</h1>
        <button className="btn btn-secondary" onClick={exportCSV}>
          <Download size={18} style={{ marginRight: '0.5rem' }} />
          Export Report
        </button>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <div className="glass" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)' }}>
            <TrendingUp size={18} />
            <span style={{ fontWeight: 500 }}>Today's Sales</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)' }}>
            Ksh {metrics.todaySales.toLocaleString()}
          </div>
        </div>

        <div className="glass" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)' }}>
            <BarChart3 size={18} />
            <span style={{ fontWeight: 500 }}>Monthly Revenue</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
            Ksh {metrics.monthlyRevenue.toLocaleString()}
          </div>
        </div>

        <div className="glass" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)' }}>
            <PackageSearch size={18} />
            <span style={{ fontWeight: 500 }}>Monthly Transactions</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)' }}>
            {metrics.transactionCount}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Top Selling Products */}
        <div className="glass" style={{ flex: 2, padding: '1.5rem' }}>
          <h3 className="heading-2" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Top Selling Products</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th style={{ textAlign: 'right' }}>Total Qty Sold</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr><td colSpan="2" style={{ textAlign: 'center' }}>No sales data available.</td></tr>
              ) : topProducts.map((p, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="badge badge-success">{p.qty} units</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Low Stock Alerts */}
        <div className="glass" style={{ flex: 1, padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <AlertCircle size={20} color="#ef4444" />
            <h3 className="heading-2" style={{ fontSize: '1.25rem', margin: 0, color: '#ef4444' }}>Low Stock Alerts</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {lowStock.length === 0 ? (
              <p className="text-muted">All inventory levels are healthy.</p>
            ) : lowStock.map(item => (
              <div key={item.PRODUCT_ID} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius)', borderLeft: '4px solid #ef4444' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.NAME}</div>
                  <div style={{ fontSize: '0.875rem' }} className="text-muted">{item.PRODUCT_CODE}</div>
                </div>
                <div style={{ fontWeight: 700, color: '#ef4444' }}>
                  {item.ON_HAND} left
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
