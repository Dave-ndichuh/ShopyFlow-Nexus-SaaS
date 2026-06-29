'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { Plus, Edit, Trash2, CheckCircle, Clock, Truck, FileText, Search, X } from 'lucide-react';

export default function PurchasesPage() {
  const { activeTenant, activeBranch, user } = useAuth();
  const [supabase] = useState(() => createClient());

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [poForm, setPoForm] = useState({
    vendor_id: '',
    expected_date: '',
    items: []
  });

  const fetchPurchases = async () => {
    if (!activeTenant || !activeBranch) return;
    setLoading(true);
    
    const [poRes, vendorRes, catalogRes] = await Promise.all([
      supabase
        .from('purchase_orders')
        .select(`*, vendors(name)`)
        .eq('tenant_id', activeTenant.id)
        .eq('branch_id', activeBranch.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('vendors')
        .select('id, name')
        .eq('tenant_id', activeTenant.id),
      supabase
        .from('catalog_items')
        .select('id, name, cost_price')
        .eq('tenant_id', activeTenant.id)
        .eq('status', 'active')
    ]);

    if (poRes.data) setPurchaseOrders(poRes.data);
    if (vendorRes.data) setVendors(vendorRes.data);
    if (catalogRes.data) setCatalogItems(catalogRes.data);

    setLoading(false);
  };

  useEffect(() => {
    fetchPurchases();
  }, [activeTenant, activeBranch]);

  const openModal = () => {
    setPoForm({
      vendor_id: vendors.length > 0 ? vendors[0].id : '',
      expected_date: new Date().toISOString().split('T')[0],
      items: []
    });
    setShowModal(true);
  };

  const addPoItem = (catalogItem) => {
    // If already in list, do nothing or just focus it
    if (poForm.items.find(i => i.item_id === catalogItem.id)) return;
    
    setPoForm({
      ...poForm,
      items: [...poForm.items, {
        item_id: catalogItem.id,
        name: catalogItem.name,
        quantity: 1,
        unit_cost: catalogItem.cost_price || 0
      }]
    });
  };

  const updatePoItem = (item_id, field, value) => {
    setPoForm({
      ...poForm,
      items: poForm.items.map(i => i.item_id === item_id ? { ...i, [field]: value } : i)
    });
  };

  const removePoItem = (item_id) => {
    setPoForm({
      ...poForm,
      items: poForm.items.filter(i => i.item_id !== item_id)
    });
  };

  const handleCreatePo = async (e) => {
    e.preventDefault();
    if (!poForm.vendor_id) return alert("Please select a vendor.");
    if (poForm.items.length === 0) return alert("Please add at least one item.");

    const total_amount = poForm.items.reduce((acc, i) => acc + (i.quantity * i.unit_cost), 0);

    try {
      // 1. Insert PO
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert([{
          tenant_id: activeTenant.id,
          branch_id: activeBranch.id,
          vendor_id: poForm.vendor_id,
          status: 'Ordered',
          expected_date: poForm.expected_date,
          total_amount: total_amount,
          created_by: user?.id
        }])
        .select()
        .single();

      if (poError) throw poError;

      // 2. Insert PO Items
      const poItemsData = poForm.items.map(i => ({
        po_id: po.id,
        item_id: i.item_id,
        quantity: i.quantity,
        unit_cost: i.unit_cost
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(poItemsData);

      if (itemsError) throw itemsError;

      setShowModal(false);
      fetchPurchases();

    } catch (err) {
      alert("Error creating Purchase Order: " + err.message);
    }
  };

  const markReceived = async (po) => {
    if (!confirm(`Mark PO from ${po.vendors?.name} as Received? This will update inventory.`)) return;

    try {
      // 1. Fetch PO items
      const { data: items, error: itemsError } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('po_id', po.id);
        
      if (itemsError) throw itemsError;

      // 2. Insert into inventory_movements (Trigger will handle balances)
      const movements = items.map(item => ({
        tenant_id: activeTenant.id,
        branch_id: activeBranch.id,
        item_id: item.item_id,
        movement_type: 'receive',
        quantity_change: item.quantity,
        reference_id: po.id,
        notes: `PO Received: ${po.id}`
      }));

      const { error: moveError } = await supabase
        .from('inventory_movements')
        .insert(movements);

      if (moveError) throw moveError;

      // 3. Update PO Status
      const { error: statusError } = await supabase
        .from('purchase_orders')
        .update({ status: 'Received' })
        .eq('id', po.id);

      if (statusError) throw statusError;

      fetchPurchases();
    } catch (err) {
      alert("Error receiving PO: " + err.message);
    }
  };

  const filteredPOs = purchaseOrders.filter(po => 
    po.vendors?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!activeBranch) return <div style={{ padding: '2rem' }}>Loading or no branch selected...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="heading-2" style={{ margin: 0 }}>Purchase Orders</h1>
        <button className="btn btn-primary" onClick={openModal}>
          <Plus size={18} /> Create PO
        </button>
      </div>

      <div style={{ position: 'relative', width: '300px', marginBottom: '1.5rem' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
        <input 
          type="text" 
          placeholder="Search by vendor or status..." 
          className="input" 
          style={{ paddingLeft: '2.5rem' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="glass table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Vendor</th>
              <th>Status</th>
              <th>Expected</th>
              <th style={{ textAlign: 'right' }}>Total Amount</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading purchases...</td></tr>
            ) : filteredPOs.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No purchase orders found for this branch.</td></tr>
            ) : (
              filteredPOs.map((po) => (
                <tr key={po.id}>
                  <td>{new Date(po.created_at).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600 }}>{po.vendors?.name || 'Unknown'}</td>
                  <td>
                    <span className={`badge ${po.status === 'Received' ? 'badge-success' : po.status === 'Ordered' ? 'badge-warning' : 'badge-secondary'}`}>
                      {po.status === 'Received' && <CheckCircle size={12} style={{ marginRight: '4px' }} />}
                      {po.status === 'Ordered' && <Clock size={12} style={{ marginRight: '4px' }} />}
                      {po.status}
                    </span>
                  </td>
                  <td className="text-muted">{po.expected_date ? new Date(po.expected_date).toLocaleDateString() : 'N/A'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>Ksh {Number(po.total_amount).toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    {po.status !== 'Received' && po.status !== 'Cancelled' && (
                      <button className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }} onClick={() => markReceived(po)}>
                        <Truck size={14} style={{ marginRight: '4px' }} /> Receive
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create PO Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '2rem' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h3 className="heading-2" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} className="text-primary" /> New Purchase Order
              </h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-muted" /></button>
            </div>
            
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Left side: Catalog Browser */}
              <div style={{ width: '300px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Product Catalog</div>
                  <input type="text" className="input" placeholder="Search products..." />
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                  {catalogItems.map(item => (
                    <div 
                      key={item.id} 
                      style={{ padding: '0.75rem', borderRadius: 'var(--radius)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      className="hover-bg"
                      onClick={() => addPoItem(item)}
                    >
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Ksh {item.cost_price?.toLocaleString()}</div>
                      </div>
                      <Plus size={16} className="text-primary" />
                    </div>
                  ))}

                </div>
              </div>

              {/* Right side: PO Form */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <form onSubmit={handleCreatePo} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div>
                      <label className="label">Vendor / Supplier</label>
                      <select className="input" value={poForm.vendor_id} onChange={e => setPoForm({...poForm, vendor_id: e.target.value})} required>
                        <option value="">-- Select Vendor --</option>
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Expected Delivery Date</label>
                      <input type="date" className="input" value={poForm.expected_date} onChange={e => setPoForm({...poForm, expected_date: e.target.value})} />
                    </div>
                  </div>

                  <h4 className="heading-3" style={{ marginBottom: '1rem' }}>Order Items</h4>
                  
                  <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--card)' }}>
                    <table className="table" style={{ border: 'none' }}>
                      <thead style={{ position: 'sticky', top: 0, background: 'var(--card)', zIndex: 1 }}>
                        <tr>
                          <th>Item</th>
                          <th style={{ width: '100px' }}>Quantity</th>
                          <th style={{ width: '150px' }}>Unit Cost (Ksh)</th>
                          <th style={{ textAlign: 'right', width: '120px' }}>Subtotal</th>
                          <th style={{ width: '50px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {poForm.items.length === 0 ? (
                          <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>Click products on the left to add them to this order.</td></tr>
                        ) : poForm.items.map(item => (
                          <tr key={item.item_id}>
                            <td style={{ fontWeight: 500 }}>{item.name}</td>
                            <td>
                              <input 
                                type="number" min="1" className="input" style={{ padding: '0.25rem 0.5rem', height: 'auto' }}
                                value={item.quantity} onChange={e => updatePoItem(item.item_id, 'quantity', Number(e.target.value))} 
                              />
                            </td>
                            <td>
                              <input 
                                type="number" min="0" step="0.01" className="input" style={{ padding: '0.25rem 0.5rem', height: 'auto' }}
                                value={item.unit_cost} onChange={e => updatePoItem(item.item_id, 'unit_cost', Number(e.target.value))} 
                              />
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                              {(item.quantity * item.unit_cost).toLocaleString()}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button type="button" onClick={() => removePoItem(item.item_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                      Total: Ksh {poForm.items.reduce((sum, i) => sum + (i.quantity * i.unit_cost), 0).toLocaleString()}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={poForm.items.length === 0}>Create Purchase Order</button>
                    </div>
                  </div>

                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
