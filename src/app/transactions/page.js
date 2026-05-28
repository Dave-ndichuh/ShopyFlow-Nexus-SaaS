'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Eye } from 'lucide-react';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      // Fetch transactions with their associated customer (if any)
      const { data, error } = await supabase
        .from('transaction')
        .select(`
          *,
          customer(FIRST_NAME, LAST_NAME),
          transaction_details(QTY)
        `)
        .order('TRANS_ID', { ascending: false });

      if (!error && data) {
        setTransactions(data);
      }
      setLoading(false);
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(t => 
    t.TRANS_ID?.toString().includes(searchTerm) ||
    t.CREATED_AT?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.customer?.FIRST_NAME?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input 
            type="text" 
            placeholder="Search by ID or Date..." 
            className="input" 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total (Ksh)</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading transactions...</td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No transactions found.</td>
              </tr>
            ) : (
              filteredTransactions.map((trans) => (
                <tr key={trans.TRANS_ID}>
                  <td><span className="badge badge-warning">TRX-{trans.TRANS_ID}</span></td>
                  <td className="text-muted">{new Date(trans.CREATED_AT).toLocaleString()}</td>
                  <td>
                    {trans.customer ? `${trans.customer.FIRST_NAME} ${trans.customer.LAST_NAME}` : 'Walk-in'}
                  </td>
                  <td>
                    <span className="badge badge-success">
                      {trans.transaction_details?.reduce((acc, d) => acc + d.QTY, 0) || 0} items
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    Ksh {trans.GRAND_TOTAL?.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem' }} title="View Details">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
