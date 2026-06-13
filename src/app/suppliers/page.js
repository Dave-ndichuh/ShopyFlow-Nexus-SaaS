'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { useAuth } from '@/components/AuthGuard';
import { VendorService } from '@/lib/services/vendorService';

export default function VendorsPage() {
  const { activeTenant } = useAuth();
  const [supabase] = useState(() => createClient());

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', contact_name: '', phone: '', email: '', address: ''
  });

  const fetchVendors = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const data = await VendorService.getVendors(supabase, activeTenant.id);
      setVendors(data || []);
    } catch (err) {
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [activeTenant]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;
    try {
      await VendorService.deleteVendor(supabase, id);
      fetchVendors();
    } catch (err) {
      alert('Error deleting vendor: ' + err.message);
    }
  };

  const openModal = (vendor = null) => {
    if (vendor) {
      setEditingId(vendor.id);
      setFormData({
        name: vendor.name || '',
        contact_name: vendor.contact_name || '',
        phone: vendor.phone || '',
        email: vendor.email || '',
        address: vendor.address || ''
      });
    } else {
      setEditingId(null);
      setFormData({ 
        name: '', contact_name: '', phone: '', email: '', address: ''
      });
    }
    setShowModal(true);
  };

  const saveVendor = async (e) => {
    e.preventDefault();
    if (!activeTenant) return;

    try {
      if (editingId) {
        await VendorService.updateVendor(supabase, editingId, formData);
      } else {
        await VendorService.createVendor(supabase, activeTenant.id, formData);
      }
      setShowModal(false);
      fetchVendors();
    } catch (err) {
      alert(`Database Error: ${err.message}`);
    }
  };

  const filteredVendors = vendors.filter(v => 
    v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.phone?.includes(searchTerm)
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input 
            type="text" 
            placeholder="Search vendors..." 
            className="input" 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} />
          Add Vendor
        </button>
      </div>

      <div className="glass table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Vendor Name</th>
              <th>Contact Person</th>
              <th>Contact Info</th>
              <th>Address</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading vendors...</td>
              </tr>
            ) : filteredVendors.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No vendors found.</td>
              </tr>
            ) : (
              filteredVendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{vendor.name}</div>
                  </td>
                  <td>{vendor.contact_name || 'N/A'}</td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>{vendor.phone}</div>
                    {vendor.email && <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{vendor.email}</div>}
                  </td>
                  <td className="text-muted">{vendor.address || 'N/A'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Edit" onClick={() => openModal(vendor)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-destructive" style={{ padding: '0.5rem' }} title="Delete" onClick={() => handleDelete(vendor.id)}>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '2rem' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h3 className="heading-2" style={{ margin: 0 }}>{editingId ? 'Edit Vendor' : 'Add Vendor'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-muted" /></button>
            </div>
            
            <form onSubmit={saveVendor} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="text" className="input" placeholder="Vendor Company Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                
                <input type="text" className="input" placeholder="Contact Person Name" value={formData.contact_name} onChange={e => setFormData({...formData, contact_name: e.target.value})} />
                
                <input type="email" className="input" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                
                <input type="tel" className="input" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                
                <textarea className="input" placeholder="Address..." rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={{ resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" style={{ marginRight: '1rem' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2.5rem' }}>Save Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
