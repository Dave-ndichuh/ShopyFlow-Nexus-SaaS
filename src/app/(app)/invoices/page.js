'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { Plus, Search, FileText, Printer, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import InvoicePrint from '@/components/InvoicePrint';
import ThermalInvoice from '@/components/ThermalInvoice';
import { createPortal } from 'react-dom';

import { InvoiceService } from '@/lib/services/invoiceService';
import { CatalogService } from '@/lib/services/catalogService';
import { OrderService } from '@/lib/services/orderService';
import { InventoryService } from '@/lib/services/inventoryService';
import { ShiftService } from '@/lib/services/shiftService';

export default function InvoicesPage() {
  const { activeTenant, activeBranch, user } = useAuth();
  const [supabase] = useState(() => createClient());
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [newInvoice, setNewInvoice] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    customer_email: '',
    notes: ''
  });
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Print
  const [printInvoice, setPrintInvoice] = useState(null);
  const [printItems, setPrintItems] = useState([]);
  const [printFormat, setPrintFormat] = useState('THERMAL'); // 'THERMAL' or 'A4'
  const printRef = useRef(null);

  // Settlement Modal
  const [settleInvoice, setSettleInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash'); 
  const [settling, setSettling] = useState(false);
  const [activeShift, setActiveShift] = useState(null);

  useEffect(() => {
    if (activeTenant && activeBranch) {
      fetchInvoices();
      fetchProducts();
      fetchActiveShift();
    }
  }, [activeTenant, activeBranch]);

  useEffect(() => {
    if (printInvoice) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [printInvoice]);

  const fetchActiveShift = async () => {
    try {
      const shift = await ShiftService.getActiveShift(supabase, activeTenant.id, activeBranch.id, user.id);
      setActiveShift(shift);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await InvoiceService.getInvoices(supabase, activeTenant.id, activeBranch.id);
      setInvoices(data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    try {
      const data = await CatalogService.getItems(supabase, activeTenant.id);
      setProducts(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const addItem = (product) => {
    const existing = invoiceItems.find(i => i.item_id === product.id);
    if (existing) {
      setInvoiceItems(invoiceItems.map(i => i.item_id === product.id ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unit_price } : i));
    } else {
      setInvoiceItems([...invoiceItems, {
        item_id: product.id,
        description: product.name,
        quantity: 1,
        unit_price: product.selling_price,
        subtotal: product.selling_price,
        type: product.type
      }]);
    }
    setProductSearch('');
  };

  const removeItem = (itemId) => {
    setInvoiceItems(invoiceItems.filter(i => i.item_id !== itemId));
  };

  const updateItemQty = (itemId, qty) => {
    if (qty < 1) return;
    setInvoiceItems(invoiceItems.map(i => i.item_id === itemId ? { ...i, quantity: qty, subtotal: qty * i.unit_price } : i));
  };

  const updateItemPrice = (itemId, price) => {
    if (price < 0) return;
    setInvoiceItems(invoiceItems.map(i => i.item_id === itemId ? { ...i, unit_price: price, subtotal: i.quantity * price } : i));
  };

  const calculateTotals = () => {
    const subtotal = invoiceItems.reduce((acc, i) => acc + i.subtotal, 0);
    const tax = 0; 
    const grandTotal = subtotal;
    return { subtotal, tax, grandTotal };
  };

  const saveInvoice = async () => {
    if (!newInvoice.customer_name) return alert("Customer name is required");
    if (invoiceItems.length === 0) return alert("Add at least one item to the invoice");
    if (!activeTenant || !activeBranch) return alert("No active branch selected");

    setSaving(true);
    const { subtotal, tax, grandTotal } = calculateTotals();

    try {
      await InvoiceService.createInvoice(supabase, activeTenant.id, activeBranch.id, {
        ...newInvoice,
        subtotal,
        tax_amount: tax,
        grand_total: grandTotal,
        status: 'Pending',
        employeeId: user.id
      }, invoiceItems);
      
      setSaving(false);
      setShowCreateModal(false);
      setNewInvoice({ customer_name: '', customer_phone: '', customer_address: '', customer_email: '', notes: '' });
      setInvoiceItems([]);
      fetchInvoices();
    } catch (err) {
      alert("Failed to save invoice: " + err.message);
      setSaving(false);
    }
  };

  const openSettleModal = (inv) => {
    if (!activeShift) {
      alert("You must open a shift in the POS terminal before you can settle invoices.");
      return;
    }
    setSettleInvoice(inv);
    setPaymentMethod('Cash');
  };

  const confirmSettlement = async () => {
    if (!settleInvoice) return;
    setSettling(true);

    try {
      const orderData = {
        shift_id: activeShift.id,
        status: 'completed',
        subtotal: settleInvoice.subtotal,
        discount_total: 0,
        grand_total: settleInvoice.grand_total,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'M-Pesa' ? 'pending' : 'paid',
        amount_paid: settleInvoice.grand_total,
        reference_notes: `Settlement for Invoice #${settleInvoice.id}`
      };

      const orderItems = settleInvoice.invoice_details.map(i => ({
        item_id: i.item_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        subtotal: i.subtotal,
        tax: 0
      }));

      const order = await OrderService.createOrder(supabase, activeTenant.id, activeBranch.id, orderData, orderItems);
      
      // Handle Inventory Movements
      const movements = settleInvoice.invoice_details.map(c => ({
        item_id: c.item_id,
        movement_type: 'sale',
        quantity_change: -c.quantity,
        reference_id: order.id,
        notes: `Invoice Settlement: ${settleInvoice.id}`
      }));
      if (movements.length > 0) {
        await InventoryService.recordMovementsBulk(supabase, activeTenant.id, activeBranch.id, movements);
      }

      await InvoiceService.markAsPaid(supabase, activeTenant.id, settleInvoice.id, order.id);

      fetchInvoices();
      alert("Invoice paid and stock deducted successfully.");
      setSettleInvoice(null);
    } catch (err) {
      alert("Failed to settle invoice: " + err.message);
    } finally {
      setSettling(false);
    }
  };

  const handlePrint = (inv) => {
    // Map to ThermalInvoice & InvoicePrint expected format
    setPrintInvoice({
      ...inv,
      CUSTOMER_NAME: inv.customer_name,
      CUSTOMER_PHONE: inv.customer_phone,
      CUSTOMER_EMAIL: inv.customer_email,
      CUSTOMER_ADDRESS: inv.customer_address,
      INVOICE_ID: inv.id,
      SUBTOTAL: inv.subtotal,
      GRAND_TOTAL: inv.grand_total,
      CREATED_AT: inv.created_at
    });
    
    setPrintItems((inv.invoice_details || []).map(i => ({
      DESCRIPTION: i.description,
      QTY: i.quantity,
      TOTAL_PRICE: i.subtotal
    })));
  };

  const filteredInvoices = invoices.filter(i => 
    i.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.id?.toString().includes(searchTerm)
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Hide main UI when printing */}
      <style jsx global>{`
        @media print {
          html, body {
            height: auto !important;
            min-height: auto !important;
            background: white !important;
          }
          .hide-on-print {
            display: none !important;
          }
          .print-action-bar {
            display: none !important;
          }
        }
      `}</style>

      <div className="hide-on-print" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="heading-2" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileText size={28} className="text-primary" />
          Invoices & Quotations
        </h1>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <input 
              type="text" 
              placeholder="Search by customer or ID..." 
              className="input" 
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} /> New Invoice
          </button>
        </div>
      </div>

      <div className="glass table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading invoices...</td></tr>
            ) : filteredInvoices.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No invoices found.</td></tr>
            ) : filteredInvoices.map((inv) => (
              <tr key={inv.id}>
                <td><span className="badge badge-primary">INV-{inv.id}</span></td>
                <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                <td style={{ fontWeight: 600 }}>{inv.customer_name}</td>
                <td style={{ fontWeight: 600 }}>Ksh {inv.grand_total?.toLocaleString()}</td>
                <td>
                  <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : inv.status === 'Pending' ? 'badge-warning' : 'badge-destructive'}`}>
                    {inv.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    {inv.status === 'Pending' && (
                      <button className="btn btn-success" style={{ padding: '0.5rem', background: '#10b981', color: 'white' }} title="Mark as Paid" onClick={() => openSettleModal(inv)}>
                        <CheckCircle size={16} />
                      </button>
                    )}
                    <button className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Print Invoice" onClick={() => handlePrint(inv)}>
                      <Printer size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      {showCreateModal && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '2rem' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h3 className="heading-2" style={{ margin: 0 }}>Create New Invoice</h3>
              <button onClick={() => setShowCreateModal(false)}><XCircle size={24} className="text-muted" /></button>
            </div>
            
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', gap: '2rem' }}>
              {/* Left Side: Details */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontWeight: 600, color: 'var(--primary)' }}>Customer Details</h4>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--muted-foreground)' }}>Customer Name</label>
                  <input type="text" className="input" placeholder="Avery Davis" value={newInvoice.customer_name} onChange={e => setNewInvoice({...newInvoice, customer_name: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--muted-foreground)' }}>Phone Number</label>
                  <input type="text" className="input" placeholder="123-456-7890" value={newInvoice.customer_phone} onChange={e => setNewInvoice({...newInvoice, customer_phone: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--muted-foreground)' }}>Email Address (Optional)</label>
                  <input type="email" className="input" placeholder="customer@example.com" value={newInvoice.customer_email || ''} onChange={e => setNewInvoice({...newInvoice, customer_email: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--muted-foreground)' }}>Address (Optional)</label>
                  <textarea className="input" placeholder="123 Anywhere St., Any City" value={newInvoice.customer_address} onChange={e => setNewInvoice({...newInvoice, customer_address: e.target.value})} rows={2} style={{ resize: 'none' }}/>
                </div>
              </div>

              {/* Right Side: Items */}
              <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontWeight: 600, color: 'var(--primary)' }}>Invoice Items</h4>
                
                {/* Search Product */}
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                  <input 
                    type="text" 
                    placeholder="Search product to add..." 
                    className="input" 
                    style={{ paddingLeft: '2.5rem' }}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                  {productSearch && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', maxHeight: '200px', overflowY: 'auto', zIndex: 10, marginTop: '4px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                      {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))).slice(0, 10).map(p => (
                        <div key={p.id} style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: '1px solid var(--border)' }} onClick={() => addItem(p)} className="hover-bg">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontWeight: 500 }}>{p.name}</span>
                          </div>
                          <span className="text-muted">Ksh {p.selling_price?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
                      <tr>
                        <th style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.875rem' }}>Item</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.875rem' }}>Price</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.875rem' }}>Qty</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right', fontSize: '0.875rem' }}>Total</th>
                        <th style={{ padding: '0.5rem' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceItems.map(item => (
                        <tr key={item.item_id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.5rem', fontSize: '0.875rem' }}>{item.description}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <input type="number" min="0" value={item.unit_price} onChange={(e) => updateItemPrice(item.item_id, parseFloat(e.target.value) || 0)} style={{ width: '80px', padding: '0.25rem', textAlign: 'right', background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '4px' }} title="Unit Price" />
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <input type="number" min="1" value={item.quantity} onChange={(e) => updateItemQty(item.item_id, parseInt(e.target.value) || 1)} style={{ width: '50px', padding: '0.25rem', textAlign: 'center', background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '4px' }} title="Quantity" />
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600 }}>Ksh {item.subtotal?.toLocaleString()}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <button onClick={() => removeItem(item.item_id)} style={{ color: 'var(--destructive)', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      ))}
                      {invoiceItems.length === 0 && (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>No items added yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div style={{ background: 'var(--card)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--muted-foreground)' }}>
                    <span>Subtotal:</span>
                    <span>Ksh {calculateTotals().subtotal.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px dashed var(--border)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--primary)' }}>
                    <span>Grand Total:</span>
                    <span>Ksh {calculateTotals().grandTotal.toLocaleString()}</span>
                  </div>
                </div>

              </div>
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveInvoice} disabled={saving}>
                {saving ? 'Saving...' : 'Save Invoice'}
              </button>
            </div>

          </div>
        </div>
      , document.body)}

      {/* Print Area Overlay */}
      {printInvoice && typeof document !== 'undefined' && createPortal(
        <div id="print-invoice-area" style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 99999, overflowY: 'auto' }}>
          <div className="print-action-bar" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b' }}>Format:</label>
              <select className="input" style={{ border: 'none', padding: '0.25rem 2rem 0.25rem 0.5rem', height: 'auto', background: 'transparent', color: '#0f172a' }} value={printFormat} onChange={e => setPrintFormat(e.target.value)}>
                <option value="THERMAL" style={{ color: '#0f172a' }}>Thermal Roll (80mm)</option>
                <option value="A4" style={{ color: '#0f172a' }}>Standard Sheet (A4)</option>
              </select>
            </div>

            <button className="btn btn-secondary" onClick={() => setPrintInvoice(null)}>
              <XCircle size={18} /> Close Preview
            </button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              <Printer size={18} /> Print
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', padding: printFormat === 'A4' ? '2rem' : '0' }}>
            {printFormat === 'THERMAL' ? (
              <ThermalInvoice ref={printRef} invoice={printInvoice} items={printItems} tenant={activeTenant} />
            ) : (
              <div style={{ width: '100%', maxWidth: '210mm', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                <InvoicePrint ref={printRef} invoice={printInvoice} items={printItems} tenant={activeTenant} />
              </div>
            )}
          </div>
        </div>
      , document.body)}

      {/* Settlement Modal */}
      {settleInvoice && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '2rem' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '400px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--background)' }}>
            <h3 className="heading-2" style={{ margin: 0 }}>Settle Invoice</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <span className="text-muted">Total Due:</span>
              <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary)' }}>Ksh {settleInvoice.grand_total?.toLocaleString()}</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--muted-foreground)' }}>Payment Method</label>
              <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="Cash">Cash</option>
                <option value="M-Pesa">M-Pesa</option>
                <option value="Credit">Credit</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSettleInvoice(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={confirmSettlement} disabled={settling}>
                {settling ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

    </div>
  );
}
