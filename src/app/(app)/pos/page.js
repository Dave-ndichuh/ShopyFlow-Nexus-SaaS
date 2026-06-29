'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ShoppingCart, Plus, Minus, Trash2, User, Search, CreditCard, Receipt as ReceiptIcon, X } from 'lucide-react';
import Receipt from '@/components/Receipt';
import { useAuth } from '@/components/AuthGuard';
import { CatalogService } from '@/lib/services/catalogService';
import { ContactService } from '@/lib/services/contactService';
import { OrderService } from '@/lib/services/orderService';
import { InventoryService } from '@/lib/services/inventoryService';
import { ShiftService } from '@/lib/services/shiftService';

export default function POSPage() {
  const { activeTenant, activeBranch, user } = useAuth();
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);

  // Data
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  
  // Shift Modal State
  const [startingCash, setStartingCash] = useState('');

  // Cart & UI State
  const [cart, setCart] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Checkout Modal
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [discount, setDiscount] = useState(0);

  // Print State
  const [printData, setPrintData] = useState(null);

  // Auto-trigger print
  useEffect(() => {
    if (printData) {
      const timer = setTimeout(() => {
        window.print();
        setPrintData(null);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [printData]);

  useEffect(() => {
    const fetchData = async () => {
      if (!activeTenant || !user) return;
      setLoading(true);
      try {
        const [catItems, cats, conts] = await Promise.all([
          CatalogService.getItems(supabase, activeTenant.id),
          CatalogService.getCategories(supabase, activeTenant.id),
          ContactService.getContacts(supabase, activeTenant.id)
        ]);
        
        setItems(catItems || []);
        setCategories(cats || []);
        setContacts(conts || []);
        
        if (activeBranch) {
          const inv = await InventoryService.getBalances(supabase, activeTenant.id, activeBranch.id);
          setInventory(inv || []);

          const shift = await ShiftService.getActiveShift(supabase, activeTenant.id, activeBranch.id, user.id);
          setActiveShift(shift);
        }

      } catch (err) {
        console.error('Error fetching POS data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTenant, activeBranch, user]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = activeCategory === 'All' || item.category_id === activeCategory;
      return matchesSearch && matchesCat && item.status === 'active';
    });
  }, [items, searchTerm, activeCategory]);

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1, PRICE: item.selling_price, NAME: item.name }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const newQ = c.quantity + delta;
        return newQ > 0 ? { ...c, quantity: newQ } : c;
      }
      return c;
    }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const subtotal = cart.reduce((acc, c) => acc + (c.PRICE * c.quantity), 0);
  const grandTotal = subtotal - discount;

  const [mpesaPhone, setMpesaPhone] = useState('');

  const handleOpenShift = async (e) => {
    e.preventDefault();
    if (!activeTenant || !activeBranch || !user) return;
    
    try {
      const shift = await ShiftService.openShift(supabase, activeTenant.id, activeBranch.id, user.id, Number(startingCash) || 0);
      setActiveShift(shift);
    } catch (err) {
      alert("Failed to open shift: " + err.message);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    if (!activeBranch) {
      alert("No active branch selected!");
      return;
    }

    if (paymentMethod === 'M-Pesa' && !mpesaPhone) {
      alert("Please enter customer M-Pesa phone number.");
      return;
    }

    const orderData = {
      contact_id: selectedContact || null,
      shift_id: activeShift.id,
      status: 'completed',
      subtotal: subtotal,
      discount_total: discount,
      grand_total: grandTotal,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'Credit' ? 'unpaid' : paymentMethod === 'M-Pesa' ? 'pending' : 'paid',
      amount_paid: paymentMethod === 'M-Pesa' ? 0 : (Number(amountPaid) || grandTotal)
    };

    const orderItems = cart.map(c => ({
      item_id: c.id,
      quantity: c.quantity,
      unit_price: c.PRICE,
      subtotal: c.PRICE * c.quantity,
      tax: 0
    }));

    try {
      const order = await OrderService.createOrder(supabase, activeTenant.id, activeBranch.id, orderData, orderItems);
      
      // Also record inventory movements for products
      const movements = cart.filter(c => c.type === 'product' && c.track_inventory !== false).map(c => ({
        item_id: c.id,
        movement_type: 'sale',
        quantity_change: -c.quantity,
        reference_id: order.id,
        notes: `Sale Order: ${order.id}`
      }));
      if (movements.length > 0) {
        await InventoryService.recordMovementsBulk(supabase, activeTenant.id, activeBranch.id, movements);
      }

      // If M-Pesa, trigger the STK Push
      if (paymentMethod === 'M-Pesa') {
        const mpesaRes = await fetch('/api/mpesa/pos-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: order.id,
            tenant_id: activeTenant.id,
            phone: mpesaPhone,
            amount: grandTotal
          })
        });

        const mpesaData = await mpesaRes.json();
        if (!mpesaRes.ok) {
          alert(`Order Created, but M-Pesa STK Push Failed: ${mpesaData.error}`);
        } else {
          alert("M-Pesa STK Push Sent! Waiting for customer to pin.");
        }
      }

      setPrintData({
        transaction: order,
        cart: cart,
        subtotal: subtotal,
        vat: 0,
        grandTotal: grandTotal,
        tenant: activeTenant
      });

      // Reset
      setCart([]);
      setSelectedContact(null);
      setDiscount(0);
      setAmountPaid('');
      setShowCheckout(false);

    } catch (err) {
      alert("Failed to create order: " + err.message);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>Loading POS System...</div>;
  }

  if (!activeShift) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 80px)' }} className="animate-fade-in">
        <div className="glass" style={{ padding: '2rem', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--card)' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 className="heading-2" style={{ margin: 0, marginBottom: '0.5rem' }}>Open Register</h2>
            <p className="text-muted" style={{ margin: 0 }}>You must open a shift to process sales.</p>
          </div>
          
          <form onSubmit={handleOpenShift} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
                Starting Float (Cash in Drawer)
              </label>
              <input 
                type="number" 
                min="0"
                className="input" 
                placeholder="e.g. 5000" 
                value={startingCash} 
                onChange={e => setStartingCash(e.target.value)} 
                required 
                style={{ fontSize: '1.25rem', textAlign: 'center' }}
              />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', fontSize: '1.1rem' }}>
              Open Shift
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', gap: '1.5rem', overflow: 'hidden' }} className="animate-fade-in">
      
      {/* LEFT: Product Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Top Controls */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <input 
              type="text" 
              placeholder="Search items by name or SKU..." 
              className="input" 
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="input" 
            style={{ width: '200px', background: 'var(--card)' }}
            value={activeCategory}
            onChange={e => setActiveCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', alignContent: 'start' }}>
          {filteredItems.map(item => {
            const stock = inventory.find(i => i.item_id === item.id)?.quantity || 0;
            return (
              <div 
                key={item.id} 
                className="glass-panel" 
                style={{ padding: '1rem', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                onClick={() => addToCart(item)}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.sku || 'N/A'}</span>
                  {item.type === 'product' && <span className={stock > 0 ? 'text-success' : 'text-destructive'}>{stock} in stock</span>}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.2, minHeight: '2.4rem', color: 'var(--foreground)' }}>
                  {item.name}
                </div>
                <div style={{ fontWeight: 700, color: 'var(--primary)', marginTop: 'auto' }}>
                  {item.selling_price?.toLocaleString()}
                </div>
              </div>
            );
          })}
          {filteredItems.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--muted-foreground)' }}>No items found.</div>}
        </div>
      </div>

      {/* RIGHT: Cart Sidebar */}
      <div className="glass-panel" style={{ width: '400px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShoppingCart size={20} className="text-primary" />
          <h3 className="heading-3" style={{ margin: 0 }}>Current Order</h3>
        </div>

        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--background)', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <User size={16} className="text-muted" />
            <select 
              className="input" 
              style={{ border: 'none', background: 'transparent', padding: 0, height: 'auto', flex: 1 }}
              value={selectedContact || ''}
              onChange={e => setSelectedContact(e.target.value)}
            >
              <option value="">Walk-in Customer</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
            </select>
          </div>
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted-foreground)', marginTop: '3rem' }}>
              <ShoppingCart size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px dashed var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--foreground)' }}>{c.NAME}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{c.PRICE.toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => updateQuantity(c.id, -1)}><Minus size={14} /></button>
                  <span style={{ width: '24px', textAlign: 'center', fontWeight: 600 }}>{c.quantity}</span>
                  <button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => updateQuantity(c.id, 1)}><Plus size={14} /></button>
                </div>
                <div style={{ fontWeight: 600, width: '70px', textAlign: 'right' }}>
                  {(c.PRICE * c.quantity).toLocaleString()}
                </div>
                <button className="text-destructive" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }} onClick={() => removeFromCart(c.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Cart Totals */}
        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--muted-foreground)' }}>
            <span>Subtotal</span>
            <span>{subtotal.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)' }}>
            <span>Total</span>
            <span>{subtotal.toLocaleString()}</span>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
            disabled={cart.length === 0}
            onClick={() => setShowCheckout(true)}
          >
            Checkout
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '2rem' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h3 className="heading-2" style={{ margin: 0 }}>Complete Payment</h3>
              <button onClick={() => setShowCheckout(false)}><X size={20} className="text-muted" /></button>
            </div>
            
            <form onSubmit={handleCheckout} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Amount Due</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{grandTotal.toLocaleString()}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  {['Cash', 'M-Pesa', 'Credit'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`btn ${paymentMethod === method ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Discount Amount</label>
                <input type="number" min="0" className="input" value={discount} onChange={e => setDiscount(Number(e.target.value) || 0)} />
              </div>

              {paymentMethod === 'M-Pesa' && (
                <div className="animate-fade-in" style={{ padding: '1rem', background: 'rgba(37, 211, 102, 0.1)', border: '1px solid #25D366', borderRadius: 'var(--radius)' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#25D366', marginBottom: '0.5rem' }}>
                    Customer M-Pesa Phone Number
                  </label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="2547XXXXXXXX" 
                    value={mpesaPhone} 
                    onChange={e => setMpesaPhone(e.target.value)} 
                    required 
                  />
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: '0.5rem', marginBottom: 0 }}>
                    Customer will receive an STK prompt on their phone.
                  </p>
                </div>
              )}

              {paymentMethod === 'Cash' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Amount Tendered</label>
                  <input type="number" min={grandTotal} className="input" placeholder={grandTotal} value={amountPaid} onChange={e => setAmountPaid(e.target.value)} required />
                  {Number(amountPaid) > grandTotal && (
                    <div style={{ marginTop: '0.5rem', color: 'var(--success)', fontWeight: 600 }}>
                      Change: {(Number(amountPaid) - grandTotal).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2.5rem', width: '100%' }}>Confirm Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
