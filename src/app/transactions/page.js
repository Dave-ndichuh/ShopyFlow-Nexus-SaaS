'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Printer, Calendar } from 'lucide-react';
import Receipt from '@/components/Receipt';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchId, setSearchId] = useState('');
  const [searchDate, setSearchDate] = useState('');
  
  // Print State
  const [printData, setPrintData] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('transaction')
        .select(`
          *,
          customer(FIRST_NAME, LAST_NAME),
          transaction_details(*, product(NAME))
        `)
        .order('TRANS_ID', { ascending: false });

      if (!error && data) {
        setTransactions(data);
      }
      setLoading(false);
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(t => {
    let matchesId = true;
    let matchesDate = true;

    if (searchId) {
      matchesId = t.TRANS_ID?.toString() === searchId || t.TRANS_ID?.toString().includes(searchId);
    }
    
    if (searchDate) {
      // t.CREATED_AT format: "2026-05-30T..."
      const tDate = t.CREATED_AT?.split('T')[0];
      matchesDate = tDate === searchDate;
    }

    return matchesId && matchesDate;
  });

  const handlePrint = (trans) => {
    const cartItems = trans.transaction_details?.map(d => ({
      PRODUCT_ID: d.PRODUCT_ID,
      NAME: d.product?.NAME || 'Unknown Part',
      PRICE: d.UNIT_PRICE,
      quantity: d.QTY
    })) || [];

    setPrintData({
      transaction: trans,
      cart: cartItems,
      subtotal: trans.SUBTOTAL,
      vat: trans.TAX_AMOUNT,
      grandTotal: trans.GRAND_TOTAL
    });

    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
        
        {/* ID Filter */}
        <div style={{ position: 'relative', width: '250px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input 
            type="text" 
            placeholder="Search Exact ID..." 
            className="input" 
            style={{ paddingLeft: '2.5rem' }}
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
        </div>

        {/* Date Filter */}
        <div style={{ position: 'relative', width: '250px' }}>
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
              <th>Transaction ID</th>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Payment Info</th>
              <th>Total (Ksh)</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading transactions...</td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No transactions match the filters.</td>
              </tr>
            ) : (
              filteredTransactions.map((trans) => (
                <tr key={trans.TRANS_ID}>
                  <td>
                    <span className="badge badge-warning">TRX-{trans.TRANS_ID}</span>
                    {trans.IS_CREDIT && <span className="badge badge-destructive" style={{ marginLeft: '0.5rem' }}>Credit</span>}
                  </td>
                  <td className="text-muted">
                    {new Date(trans.CREATED_AT).toLocaleDateString()} <br/>
                    <small>{new Date(trans.CREATED_AT).toLocaleTimeString()}</small>
                  </td>
                  <td>
                    {trans.customer ? `${trans.customer.FIRST_NAME} ${trans.customer.LAST_NAME}` : 'Walk-in'}
                  </td>
                  <td>
                    <span className="badge badge-success">
                      {trans.transaction_details?.reduce((acc, d) => acc + d.QTY, 0) || 0} items
                    </span>
                  </td>
                  <td className="text-muted">
                    {trans.PAYMENT_METHOD}
                    {trans.HYBRID_PAYMENT && <div style={{ fontSize: '0.75rem' }}>Cash: {trans.CASH_AMOUNT} | M-Pesa: {trans.MPESA_AMOUNT}</div>}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    Ksh {trans.ADJUSTED_TOTAL ? trans.ADJUSTED_TOTAL.toLocaleString() : trans.GRAND_TOTAL?.toLocaleString()}
                    {Number(trans.DISCOUNT_AMOUNT) !== 0 && (
                      <div style={{ fontSize: '0.75rem', color: Number(trans.DISCOUNT_AMOUNT) > 0 ? '#10b981' : '#ef4444', fontWeight: 'normal' }}>
                        {Number(trans.DISCOUNT_AMOUNT) > 0 ? 'Discounted' : 'Surcharged'}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Print Invoice" onClick={() => handlePrint(trans)}>
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
          grandTotal={printData.transaction.ADJUSTED_TOTAL || printData.grandTotal} 
        />
      )}
    </div>
  );
}
