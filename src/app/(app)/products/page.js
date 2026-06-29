'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Plus, Edit, Trash2, Search, X, Image as ImageIcon } from 'lucide-react';
import { UploadButton } from '@/utils/uploadthing';
import { useAuth } from '@/components/AuthGuard';
import { CatalogService } from '@/lib/services/catalogService';

export default function CatalogPage() {
  const { activeTenant, t } = useAuth();
  const [supabase] = useState(() => createClient());

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    sku: '', name: '', description: '', selling_price: '', category_id: '',
    status: 'active', cost_price: '', barcode: '', image_url: '', type: 'product', track_inventory: true
  });

  const fetchItems = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const data = await CatalogService.getItems(supabase, activeTenant.id);
      setItems(data || []);
      
      const catData = await CatalogService.getCategories(supabase, activeTenant.id);
      setCategories(catData || []);
    } catch (err) {
      console.error('Error fetching catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTenant]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await CatalogService.deleteItem(supabase, id);
      fetchItems();
    } catch (err) {
      alert('Error deleting item: ' + err.message);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        sku: item.sku || '',
        name: item.name || '',
        description: item.description || '',
        selling_price: item.selling_price || 0,
        category_id: item.category_id || '',
        status: item.status || 'active',
        cost_price: item.cost_price || 0,
        barcode: item.barcode || '',
        image_url: item.image_url || '',
        type: item.type || 'product',
        track_inventory: item.track_inventory ?? true
      });
    } else {
      setEditingId(null);
      setFormData({ 
        sku: '', name: '', description: '', selling_price: '', category_id: '',
        status: 'active', cost_price: '', barcode: '', image_url: '', type: 'product', track_inventory: true
      });
    }
    setShowModal(true);
  };

  const saveItem = async (e) => {
    e.preventDefault();
    if (!activeTenant) return;
    
    const payload = { 
      ...formData, 
      selling_price: Number(formData.selling_price) || 0,
      cost_price: Number(formData.cost_price) || 0,
      category_id: formData.category_id ? formData.category_id : null
    };
    
    try {
      if (editingId) {
        await CatalogService.updateItem(supabase, editingId, payload);
      } else {
        await CatalogService.createItem(supabase, activeTenant.id, payload);
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      alert(`Database Error: ${err.message}`);
    }
  };

  const filteredItems = items.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="heading-1" style={{ margin: 0, width: '100%' }}>{t('catalog')} Management</h1>
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input 
            type="text" 
            placeholder={`Search ${t('catalog').toLowerCase()}...`} 
            className="input" 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} />
          Add Item
        </button>
      </div>

      <div className="glass table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Type</th>
              <th>Status</th>
              <th>Price</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading catalog...</td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No items found.</td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id}>
                  <td><span className="badge badge-warning">{item.sku || 'N/A'}</span></td>
                  <td style={{ fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ImageIcon size={20} className="text-muted" />
                        </div>
                      )}
                      <div>
                        <div>{item.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted">{item.categories?.name || 'Uncategorized'}</td>
                  <td><span className="badge badge-secondary" style={{textTransform: 'capitalize'}}>{item.type}</span></td>
                  <td>
                    <span className={`badge ${item.status === 'inactive' ? 'badge-destructive' : 'badge-success'}`}>
                      {item.status || 'active'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {item.selling_price?.toLocaleString()}
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 'normal' }}>
                      Cost: {item.cost_price?.toLocaleString()}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Edit" onClick={() => openModal(item)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-destructive" style={{ padding: '0.5rem' }} title="Delete" onClick={() => handleDelete(item.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '2rem' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h3 className="heading-2" style={{ margin: 0 }}>{editingId ? 'Edit Item' : 'Add Item'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-muted" /></button>
            </div>
            
            <form onSubmit={saveItem} style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Basic Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h4 style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '-0.5rem' }}>Basic Info</h4>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Item Name</label>
                    <input type="text" className="input" placeholder="e.g. Premium Widget" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>SKU</label>
                    <input type="text" className="input" placeholder="e.g. WIDG-001" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Category</label>
                      <select className="input" value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value || ''})} style={{ background: 'var(--card)' }}>
                        <option value="">None</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Item Type</label>
                      <select className="input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ background: 'var(--card)' }}>
                        <option value="product">Product</option>
                        <option value="service">Service</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Description</label>
                    <textarea className="input" placeholder="Item details..." rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ resize: 'vertical' }} />
                  </div>
                </div>

                {/* Pricing & Settings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h4 style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '-0.5rem' }}>Pricing & Settings</h4>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Cost Price</label>
                      <input type="number" min="0" className="input" placeholder="0" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value === '' ? '' : Number(e.target.value)})} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Selling Price</label>
                      <input type="number" min="0" className="input" placeholder="0" value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: e.target.value === '' ? '' : Number(e.target.value)})} required />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                      <input type="checkbox" id="track_inventory" checked={formData.track_inventory} onChange={e => setFormData({...formData, track_inventory: e.target.checked})} />
                      <label htmlFor="track_inventory" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)' }}>Track Inventory</label>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Status</label>
                      <select className="input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ background: 'var(--card)' }}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', padding: '1rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <h5 style={{ fontWeight: 500, margin: 0 }}>Item Image</h5>
                    {formData.image_url && <img src={formData.image_url} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />}
                    <UploadButton
                      endpoint="imageUploader"
                      onClientUploadComplete={(res) => {
                        if (res && res[0]) {
                          setFormData({...formData, image_url: res[0].url});
                        }
                      }}
                      onUploadError={(error) => {
                        alert(`ERROR! ${error.message}`);
                      }}
                    />
                  </div>

                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" style={{ marginRight: '1rem' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2.5rem' }}>Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
