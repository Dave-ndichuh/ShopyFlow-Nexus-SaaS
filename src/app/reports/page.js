'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart3, TrendingUp, AlertCircle, PackageSearch, Download, DollarSign, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  
  // Custom Date Range
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // First day of current month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [metrics, setMetrics] = useState({
    totalSales: 0,
    grossProfit: 0,
    profitMargin: 0,
    transactionCount: 0,
  });
  
  const [lowStock, setLowStock] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [rawTransactions, setRawTransactions] = useState([]);

  const fetchAnalytics = async () => {
    setLoading(true);
    
    // 1. Fetch Transactions for Custom Period
    // Adjust endDate to include the entire day
    const endDateTime = `${endDate}T23:59:59.999Z`;
    const startDateTime = `${startDate}T00:00:00.000Z`;

    const { data: transData } = await supabase
      .from('transaction')
      .select(`
        *,
        transaction_details (
          PRODUCT_ID,
          QTY,
          UNIT_PRICE,
          product (NAME, COST_PRICE)
        )
      `)
      .gte('CREATED_AT', startDateTime)
      .lte('CREATED_AT', endDateTime)
      .order('CREATED_AT', { ascending: false });

    let tSales = 0;
    let tCost = 0;
    let tCount = 0;
    const productSales = {};

    if (transData) {
      setRawTransactions(transData);
      transData.forEach(t => {
        tCount++;
        const saleTotal = Number(t.ADJUSTED_TOTAL) || Number(t.GRAND_TOTAL) || 0;
        tSales += saleTotal;

        // Calculate Cost from details
        if (t.transaction_details) {
          t.transaction_details.forEach(d => {
            const cost = Number(d.product?.COST_PRICE) || 0;
            const qty = Number(d.QTY) || 0;
            tCost += (cost * qty);

            // Aggregate Top Products
            if (!productSales[d.PRODUCT_ID]) {
              productSales[d.PRODUCT_ID] = { name: d.product?.NAME || 'Unknown Part', qty: 0 };
            }
            productSales[d.PRODUCT_ID].qty += qty;
          });
        }
      });
    }

    const grossProfit = tSales - tCost;
    const profitMargin = tSales > 0 ? (grossProfit / tSales) * 100 : 0;

    const sortedProducts = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // 2. Fetch Low Stock Products
    const { data: prodData } = await supabase
      .from('product')
      .select('*')
      .lte('ON_HAND', 5)
      .order('ON_HAND', { ascending: true })
      .limit(5); // Only show top 5 lowest

    setMetrics({ 
      totalSales: tSales, 
      grossProfit, 
      profitMargin, 
      transactionCount: tCount 
    });
    setTopProducts(sortedProducts);
    if (prodData) setLowStock(prodData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Report Period: ${startDate} to ${endDate}\n\n`;
    
    csvContent += "Metric,Value\n";
    csvContent += `Total Sales (Ksh),${metrics.totalSales.toFixed(2)}\n`;
    csvContent += `Gross Profit (Ksh),${metrics.grossProfit.toFixed(2)}\n`;
    csvContent += `Profit Margin (%),${metrics.profitMargin.toFixed(2)}%\n`;
    csvContent += `Total Transactions,${metrics.transactionCount}\n\n`;
    
    csvContent += "Transaction ID,Date,Method,Items,Total\n";
    rawTransactions.forEach(t => {
      const itemsCount = t.transaction_details?.reduce((acc, d) => acc + d.QTY, 0) || 0;
      const total = t.ADJUSTED_TOTAL || t.GRAND_TOTAL;
      csvContent += `TRX-${t.TRANS_ID},${t.CREATED_AT.split('T')[0]},${t.PAYMENT_METHOD},${itemsCount},${total}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sales_Report_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="heading-2" style={{ margin: 0 }}>Reports & Analytics</h1>
        
        {/* Custom Period Filters */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--card)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <Calendar size={18} className="text-muted" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>From:</span>
            <input type="date" className="input" style={{ padding: '0.25rem 0.5rem', height: 'auto', background: 'rgba(0,0,0,0.2)' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>To:</span>
            <input type="date" className="input" style={{ padding: '0.25rem 0.5rem', height: 'auto', background: 'rgba(0,0,0,0.2)' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={exportCSV}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>Calculating financial data...</div>
      ) : (
        <>
          {/* Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)' }}>
                <TrendingUp size={18} />
                <span style={{ fontWeight: 500 }}>Total Sales</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--foreground)' }}>
                Ksh {metrics.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)' }}>
                <DollarSign size={18} />
                <span style={{ fontWeight: 500 }}>Gross Profit</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981' }}>
                Ksh {metrics.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)' }}>
                <BarChart3 size={18} />
                <span style={{ fontWeight: 500 }}>Profit Margin</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                {metrics.profitMargin.toFixed(1)}%
              </div>
            </div>

            <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)' }}>
                <PackageSearch size={18} />
                <span style={{ fontWeight: 500 }}>Transactions</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--foreground)' }}>
                {metrics.transactionCount}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem' }}>
            {/* Top Selling Products */}
            <div className="glass" style={{ flex: 2, padding: '1.5rem' }}>
              <h3 className="heading-2" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Most Selling Products</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th style={{ textAlign: 'right' }}>Units Sold (Period)</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.length === 0 ? (
                    <tr><td colSpan="2" style={{ textAlign: 'center' }}>No sales data for this period.</td></tr>
                  ) : topProducts.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="badge badge-primary">{p.qty} units</span>
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
                <h3 className="heading-2" style={{ fontSize: '1.25rem', margin: 0, color: '#ef4444' }}>Critical Stock Alerts</h3>
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
        </>
      )}

    </div>
  );
}
