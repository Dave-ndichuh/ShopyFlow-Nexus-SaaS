'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Minus, Trash2, CreditCard, Loader2, ShoppingCart } from 'lucide-react';

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  const fetchProducts = async () => {
    const { data } = await supabase.from('product').select('*').gt('ON_HAND', 0);
    if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.NAME?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.PRODUCT_CODE?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.PRODUCT_ID === product.PRODUCT_ID);
      if (existing) {
        if (existing.quantity >= product.ON_HAND) return prev; // Max stock
        return prev.map(item => item.PRODUCT_ID === product.PRODUCT_ID ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.PRODUCT_ID === id) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return null;
        if (newQuantity > item.ON_HAND) return item;
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.PRODUCT_ID !== id));

  const subtotal = cart.reduce((acc, item) => acc + (item.PRICE * item.quantity), 0);
  const vat = subtotal * 0.16; // 16% VAT for Kenya
  const grandTotal = subtotal + vat;

  const checkout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);

    try {
      // 1. Create Transaction
      const { data: transData, error: transErr } = await supabase.from('transaction').insert([{
        SUBTOTAL: subtotal,
        TAX_AMOUNT: vat,
        GRAND_TOTAL: grandTotal,
        CASH_TENDERED: grandTotal,
        PAYMENT_METHOD: 'Cash'
      }]).select().single();

      if (transErr) throw transErr;

      // 2. Create Transaction Details
      const details = cart.map(item => ({
        TRANS_ID: transData.TRANS_ID,
        PRODUCT_ID: item.PRODUCT_ID,
        QTY: item.quantity,
        UNIT_PRICE: item.PRICE,
        SUBTOTAL: item.PRICE * item.quantity
      }));

      const { error: detErr } = await supabase.from('transaction_details').insert(details);
      if (detErr) throw detErr;

      // Note: Inventory update is now handled automatically by Postgres Triggers!

      alert(`Success! Transaction #${transData.TRANS_ID} completed.`);
      setCart([]);
      fetchProducts(); // Refresh inventory
    } catch (err) {
      alert('Error during checkout: ' + err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: '2rem', height: 'calc(100vh - 120px)' }}>
      {/* Product Selection */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input 
            type="text" 
            placeholder="Search parts by name or code..." 
            className="input" 
            style={{ paddingLeft: '2.5rem', background: 'var(--card)' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid-cards" style={{ overflowY: 'auto', paddingRight: '0.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {loading ? <p>Loading products...</p> : filteredProducts.map(product => (
            <button 
              key={product.PRODUCT_ID} 
              className="glass" 
              style={{ padding: '1rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.5rem', transition: 'transform 0.1s' }}
              onClick={() => addToCart(product)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span className="badge badge-warning">{product.PRODUCT_CODE}</span>
                <span className="text-muted" style={{ fontSize: '0.875rem' }}>Stock: {product.ON_HAND}</span>
              </div>
              <h4 style={{ fontWeight: 600, color: 'var(--foreground)' }}>{product.NAME}</h4>
              <p style={{ color: 'var(--primary)', fontWeight: 700 }}>Ksh. {product.PRICE?.toLocaleString()}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="glass" style={{ width: '400px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 className="heading-2" style={{ margin: 0 }}>Current Sale</h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {cart.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted-foreground)' }}>
              <ShoppingCart size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
              <p>Cart is empty</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.map(item => (
                <div key={item.PRODUCT_ID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                  <div style={{ flex: 1 }}>
                    <h5 style={{ fontWeight: 500 }}>{item.NAME}</h5>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>Ksh. {item.PRICE.toLocaleString()}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => updateQuantity(item.PRODUCT_ID, -1)}>
                      <Minus size={14} />
                    </button>
                    <span style={{ width: '24px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => updateQuantity(item.PRODUCT_ID, 1)}>
                      <Plus size={14} />
                    </button>
                    <button className="btn btn-destructive" style={{ padding: '0.25rem', marginLeft: '0.5rem' }} onClick={() => removeFromCart(item.PRODUCT_ID)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span className="text-muted">Subtotal</span>
            <span>Ksh. {subtotal.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span className="text-muted">VAT (16%)</span>
            <span>Ksh. {vat.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
            <span>Total</span>
            <span>Ksh. {grandTotal.toLocaleString()}</span>
          </div>
          
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }}
            disabled={cart.length === 0 || checkingOut}
            onClick={checkout}
          >
            {checkingOut ? <Loader2 size={20} className="animate-spin" /> : <CreditCard size={20} />}
            {checkingOut ? 'Processing...' : 'Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
}
