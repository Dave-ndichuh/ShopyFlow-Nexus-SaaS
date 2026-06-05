'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { TrendingUp, DollarSign, Activity, AlertTriangle, ShoppingCart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Metrics
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    grossProfit: 0,
    profitMargin: 0,
    transactionCount: 0,
    atv: 0,
    stockValue: 0,
    lowStockCount: 0,
    topProduct: { name: 'N/A', units: 0 }
  });

  // Chart Data
  const [salesTrend, setSalesTrend] = useState([]);
  const [paymentData, setPaymentData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      setLoading(true);

      // Date ranges
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6); // Last 7 days including today
      
      try {
        // Fetch all products for stock value & low stock
        const { data: products } = await supabase.from('product').select('PRODUCT_ID, NAME, ON_HAND, COST_PRICE');
        
        let stockVal = 0;
        let lowStock = 0;
        if (products) {
          products.forEach(p => {
            const onHand = Number(p.ON_HAND) || 0;
            const cost = Number(p.COST_PRICE) || 0;
            if (onHand > 0) stockVal += (onHand * cost);
            if (onHand <= 5) lowStock++;
          });
        }

        // Fetch transactions for this month WITH details for profit math
        const { data: currentMonthTrans } = await supabase
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
          .gte('CREATED_AT', firstDayOfMonth)
          .order('CREATED_AT', { ascending: true }); // Ascending helps with trend chart

        let tSales = 0;
        let tCost = 0;
        let tCount = 0;
        const productSales = {};
        
        // For Payment Breakdown Pie Chart
        let cashTotal = 0;
        let mpesaTotal = 0;
        let creditTotal = 0;

        // For Sales Trend Line Chart (Last 7 Days)
        const trendMap = {};
        for(let i=0; i<7; i++) {
          const d = new Date(sevenDaysAgo);
          d.setDate(d.getDate() + i);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          trendMap[`${yyyy}-${mm}-${dd}`] = 0;
        }

        if (currentMonthTrans) {
          currentMonthTrans.forEach(t => {
            tCount++;
            const saleTotal = Number(t.ADJUSTED_TOTAL) || Number(t.GRAND_TOTAL) || 0;
            tSales += saleTotal;

            // Trend Chart
            const tD = new Date(t.CREATED_AT);
            const tDate = `${tD.getFullYear()}-${String(tD.getMonth() + 1).padStart(2, '0')}-${String(tD.getDate()).padStart(2, '0')}`;
            
            if (trendMap[tDate] !== undefined) {
              trendMap[tDate] += saleTotal;
            }

            // Payment Methods
            if (t.PAYMENT_METHOD === 'Cash') cashTotal += saleTotal;
            else if (t.PAYMENT_METHOD === 'M-Pesa') mpesaTotal += saleTotal;
            else if (t.PAYMENT_METHOD === 'Credit') creditTotal += saleTotal;
            else if (t.PAYMENT_METHOD === 'Hybrid') {
              cashTotal += Number(t.CASH_AMOUNT) || 0;
              mpesaTotal += Number(t.MPESA_AMOUNT) || 0;
            }

            // Details for COGS & Top Product
            if (t.transaction_details) {
              t.transaction_details.forEach(d => {
                const cost = Number(d.product?.COST_PRICE) || 0;
                const qty = Number(d.QTY) || 0;
                tCost += (cost * qty);

                if (!productSales[d.PRODUCT_ID]) {
                  productSales[d.PRODUCT_ID] = { name: d.product?.NAME || 'Unknown Part', qty: 0 };
                }
                productSales[d.PRODUCT_ID].qty += qty;
              });
            }
          });
        }

        // Calculations
        const grossProfit = tSales - tCost;
        const profitMargin = tSales > 0 ? (grossProfit / tSales) * 100 : 0;
        const atv = tCount > 0 ? tSales / tCount : 0;

        const topP = Object.values(productSales).sort((a, b) => b.qty - a.qty)[0] || { name: 'N/A', units: 0 };

        // Formatting Chart Data
        const trendData = Object.keys(trendMap).sort().map(date => {
          const [, month, day] = date.split('-');
          return { name: `${day}/${month}`, Sales: trendMap[date] };
        });

        const payData = [
          { name: 'Cash', value: cashTotal, color: '#3b82f6' },
          { name: 'M-Pesa', value: mpesaTotal, color: '#25D366' },
          { name: 'Credit', value: creditTotal, color: '#f59e0b' }
        ].filter(d => d.value > 0);

        setMetrics({
          totalSales: tSales,
          grossProfit,
          profitMargin,
          transactionCount: tCount,
          atv,
          stockValue: stockVal,
          lowStockCount: lowStock,
          topProduct: topP
        });
        setSalesTrend(trendData);
        setPaymentData(payData);

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>Loading advanced analytics...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Row 1: Key Metrics (This Month) */}
      <div>
        <h2 className="heading-2" style={{ marginBottom: '1rem' }}>This Month's Performance</h2>
        <div className="metrics-grid" style={{ display: 'grid', gap: '1.5rem' }}>
          <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
              <TrendingUp size={18} /> <span style={{ fontWeight: 500 }}>Total Sales</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--foreground)' }}>Ksh. {metrics.totalSales.toLocaleString()}</div>
          </div>
          <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
              <DollarSign size={18} /> <span style={{ fontWeight: 500 }}>Gross Profit</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981' }}>Ksh. {metrics.grossProfit.toLocaleString()}</div>
          </div>
          <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
              <Activity size={18} /> <span style={{ fontWeight: 500 }}>Profit Margin</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#8b5cf6' }}>{metrics.profitMargin.toFixed(1)}%</div>
          </div>
          <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
              <ShoppingCart size={18} /> <span style={{ fontWeight: 500 }}>Transactions</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b' }}>{metrics.transactionCount}</div>
          </div>
        </div>
      </div>

      {/* Row 2: Alerts & Quick Insights */}
      <div>
        <h2 className="heading-2" style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Quick Insights & Alerts</h2>
        <div className="metrics-grid" style={{ display: 'grid', gap: '1.5rem' }}>
          <div className="glass" style={{ padding: '1.25rem', borderBottom: metrics.lowStockCount > 0 ? '4px solid #ef4444' : '4px solid #10b981' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Low Stock Items</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: metrics.lowStockCount > 0 ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {metrics.lowStockCount} {metrics.lowStockCount > 0 && <AlertTriangle size={16} />}
            </div>
          </div>
          <div className="glass" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Top Selling Product</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
              {metrics.topProduct.name} <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: 'var(--primary)' }}>({metrics.topProduct.qty} units)</span>
            </div>
          </div>
          <div className="glass" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Avg. Transaction Value</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Ksh. {metrics.atv.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div className="glass" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Stock Value at Risk</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f59e0b' }}>Ksh. {metrics.stockValue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Row 3: Visual Charts */}
      <div className="charts-grid" style={{ display: 'grid', gap: '1.5rem', flex: 1, minHeight: '350px' }}>
        <style jsx>{`
          .metrics-grid { grid-template-columns: repeat(4, 1fr); }
          .charts-grid { grid-template-columns: 2fr 1fr; }
          @media (max-width: 1024px) {
            .metrics-grid { grid-template-columns: repeat(2, 1fr); }
            .charts-grid { grid-template-columns: 1fr; }
          }
          @media (max-width: 640px) {
            .metrics-grid { grid-template-columns: 1fr; }
          }
        `}</style>
        <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 className="heading-2" style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>Sales Trend (Last 7 Days)</h3>
          <div className="chart-container" style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                  formatter={(value) => [`Ksh ${value.toLocaleString()}`, 'Sales']}
                />
                <Line type="monotone" dataKey="Sales" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 className="heading-2" style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>Revenue by Payment Method</h3>
          <div className="chart-container" style={{ flex: 1 }}>
            {paymentData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)' }}>No Data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `Ksh ${value.toLocaleString()}`}
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
