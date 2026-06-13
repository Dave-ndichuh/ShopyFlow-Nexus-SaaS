'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, Printer, Calendar } from 'lucide-react';
import Receipt from '@/components/Receipt';
import { useAuth } from '@/components/AuthGuard';
import { OrderService } from '@/lib/services/orderService';

export default function OrdersPage() {
  const { activeTenant, t } = useAuth();
  const [supabase] = useState(() => createClient());

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchId, setSearchId] = useState('');
  const [searchDate, setSearchDate] = useState('');
  
  // Print State
  const [printData, setPrintData] = useState(null);

  // Auto-trigger print when printData is fully rendered
  useEffect(() => {
    if (printData) {
      const timer = setTimeout(() => {
        window.print();
      }, 200); // Wait for React DOM and CSS to apply
      return () => clearTimeout(timer);
    }
  }, [printData]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!activeTenant) return;
      setLoading(true);
      try {
        const data = await OrderService.getOrders(supabase, activeTenant.id);
        setOrders(data || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [activeTenant]);

  const filteredOrders = orders.filter(o => {
    let matchesId = true;
    let matchesDate = true;

    if (searchId) {
      matchesId = o.id?.toString().includes(searchId);
    }
    
    if (searchDate) {
      const d = new Date(o.created_at);
      const oDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      matchesDate = oDate === searchDate;
    }

    return matchesId && matchesDate;
  });

  const handlePrint = async (order) => {
    try {
      const orderItems = await OrderService.getOrderDetails(supabase, order.id);
      
      const cartItems = orderItems?.map(d => ({
        id: d.item_id,
        NAME: d.catalog_items?.name || 'Unknown Item',
        PRICE: d.unit_price,
        quantity: d.quantity
      })) || [];

      setPrintData({
        transaction: order,
        cart: cartItems,
        subtotal: order.subtotal,
        vat: order.tax_total,
        grandTotal: order.grand_total,
        tenant: activeTenant
      });
    } catch (err) {
      console.error('Error fetching order items for print', err);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="heading-1" style={{ margin: 0, width: '100%' }}>{t('orders')} Management</h1>
        {/* ID Filter */}
        <div style={{ position: 'relative', flex: '1 1 250px', maxWidth: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input 
            type="text" 
            placeholder="Search Order ID..." 
            className="input" 
            style={{ paddingLeft: '2.5rem' }}
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
        </div>

        {/* Date Filter */}
        <div style={{ position: 'relative', flex: '1 1 250px', maxWidth: '100%' }}>
          <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input 
            type="date" 
            className="input" 
            style={{ paddingLeft: '2.5rem' }}
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
          />
        </div>

        {(searchId || searchDate) && (
          <button className="btn btn-secondary" onClick={() => { setSearchId(''); setSearchDate(''); }}>
            Clear Filters
          </button>
        )}
      </div>

      <div className="glass table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date & Time</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Payment Info</th>
              <th>Total</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading orders...</td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No orders match the filters.</td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{order.id.split('-')[0]}</span>
                  </td>
                  <td className="text-muted">
                    {new Date(order.created_at).toLocaleDateString()} <br/>
                    <small>{new Date(order.created_at).toLocaleTimeString()}</small>
                  </td>
                  <td>
                    {order.contact_name}
                  </td>
                  <td>
                    <span className="badge badge-success" style={{ textTransform: 'capitalize' }}>
                      {order.status}
                    </span>
                  </td>
                  <td className="text-muted">
                    {order.payment_method || 'Unknown'}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {order.grand_total?.toLocaleString()}
                    {Number(order.discount_total) !== 0 && (
                      <div style={{ fontSize: '0.75rem', color: Number(order.discount_total) > 0 ? '#10b981' : '#ef4444', fontWeight: 'normal' }}>
                        Discounted
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Print Invoice" onClick={() => handlePrint(order)}>
                      <Printer size={16} /> Print
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {printData && (
        <Receipt 
          transaction={printData.transaction} 
          cart={printData.cart} 
          subtotal={printData.subtotal} 
          vat={printData.vat} 
          grandTotal={printData.grandTotal} 
          tenant={printData.tenant}
        />
      )}
    </div>
  );
}
