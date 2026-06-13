'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { CatalogService } from '@/lib/services/catalogService';
import { InventoryService } from '@/lib/services/inventoryService';
import { Search, Plus, Minus, ArrowRightLeft, Boxes, X } from 'lucide-react';

export default function InventoryPage() {
  const { activeTenant, activeBranch, t } = useAuth();
  const [supabase] = useState(() => createClient());

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [movementType, setMovementType] = useState('restock'); // restock, adjustment
  const [quantityChange, setQuantityChange] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (activeTenant && activeBranch) {
      fetchInventory();
    } else {
      setInventory([]);
      setLoading(false);
    }
  }, [activeTenant, activeBranch]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const products = await CatalogService.getItems(supabase, activeTenant.id);
      const balances = await InventoryService.getBalances(supabase, activeTenant.id, activeBranch.id);

      const merged = products
        .filter(p => p.type === 'product' && p.track_inventory !== false)
        .map(p => {
          const bal = balances.find(b => b.item_id === p.id);
          return {
            ...p,
            stock_quantity: bal ? bal.quantity : 0
          };
        });

      setInventory(merged);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedItem || !quantityChange || Number(quantityChange) === 0) return;

    try {
      await InventoryService.recordMovement(supabase, activeTenant.id, activeBranch.id, {
        item_id: selectedItem.id,
        movement_type: movementType,
        quantity_change: Number(quantityChange),
        notes: notes || `Manual ${movementType}`
      });
      
      setShowModal(false);
      fetchInventory();
    } catch (err) {
      alert("Failed to update inventory: " + err.message);
    }
  };

  const openAdjustmentModal = (item, type = 'restock') => {
    setSelectedItem(item);
    setMovementType(type);
    setQuantityChange('');
    setNotes('');
    setShowModal(true);
  };

  const filteredInventory = inventory.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!activeBranch) {
    return (
      <div className="animate-fade-in glass" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
        <Boxes size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
        <h2 className="heading-2">No Active Branch Selected</h2>
        <p>Please select a branch from the sidebar to view inventory.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="heading-1" style={{ margin: 0, marginBottom: '0.25rem' }}>Inventory Management</h1>
          <p className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-primary">{activeBranch.name}</span> Current Stock Levels
          </p>
        </div>

        <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input 
            type="text" 
            placeholder={`Search ${t('catalog').toLowerCase()} items...`} 
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
              <th>SKU</th>
              <th>Item Name</th>
              <th>Cost Price</th>
              <th>Selling Price</th>
              <th>Stock on Hand</th>
              <th style={{ textAlign: 'right' }}>Adjust Stock</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading inventory...</td>
              </tr>
            ) : filteredInventory.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>No trackable products found in {t('catalog')}.</td>
              </tr>
            ) : (
              filteredInventory.map((item) => (
                <tr key={item.id}>
                  <td><span className="badge badge-warning">{item.sku || 'N/A'}</span></td>
                  <td style={{ fontWeight: 500, color: 'var(--foreground)' }}>{item.name}</td>
                  <td className="text-muted">{item.cost_price?.toLocaleString()}</td>
                  <td>{item.selling_price?.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${item.stock_quantity > 10 ? 'badge-success' : item.stock_quantity > 0 ? 'badge-warning' : 'badge-destructive'}`} style={{ fontSize: '1rem', padding: '0.25rem 0.75rem' }}>
                      {item.stock_quantity}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Receive Stock" onClick={() => openAdjustmentModal(item, 'restock')}>
                        <Plus size={16} className="text-success" />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Reduce Stock" onClick={() => openAdjustmentModal(item, 'adjustment')}>
                        <Minus size={16} className="text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Adjustment Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '2rem' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h3 className="heading-2" style={{ margin: 0 }}>
                {movementType === 'restock' ? 'Receive Stock' : 'Adjust Stock'}
              </h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-muted" /></button>
            </div>
            
            <form onSubmit={handleStockAdjustment} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ padding: '1rem', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div className="text-muted" style={{ fontSize: '0.875rem' }}>Item</div>
                <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{selectedItem?.name}</div>
                <div className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Current Stock: {selectedItem?.stock_quantity}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
                  Quantity to {movementType === 'restock' ? 'Add' : 'Remove'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem', color: movementType === 'restock' ? 'var(--success)' : 'var(--destructive)', fontWeight: 800 }}>
                    {movementType === 'restock' ? '+' : '-'}
                  </span>
                  <input 
                    type="number" 
                    min="1"
                    className="input" 
                    placeholder="e.g. 50" 
                    value={Math.abs(Number(quantityChange)) || ''} 
                    onChange={e => {
                      const val = Number(e.target.value);
                      setQuantityChange(movementType === 'restock' ? val : -Math.abs(val));
                    }} 
                    required 
                    style={{ fontSize: '1.25rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Notes / Reference (Optional)</label>
                <input type="text" className="input" placeholder="e.g. PO-2024-001 or Damaged goods" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2.5rem', width: '100%' }}>Confirm Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
