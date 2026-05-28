'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    COMPANY_NAME: '', PHONE_NUMBER: '', LOCATION_CITY: ''
  });

  const fetchSuppliers = async () => {
      const { data, error } = await supabase
        .from('supplier')
        .select(`
          *,
          location(CITY, PROVINCE)
        `)
        .order('SUPPLIER_ID', { ascending: false });

      if (!error && data) {
        setSuppliers(data);
      }
      setLoading(false);
    };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const openModal = (supplier = null) => {
    if (supplier) {
      setEditingId(supplier.SUPPLIER_ID);
      setFormData({
        COMPANY_NAME: supplier.COMPANY_NAME || '',
        PHONE_NUMBER: supplier.PHONE_NUMBER || '',
        LOCATION_CITY: supplier.location?.CITY || ''
      });
    } else {
      setEditingId(null);
      setFormData({ COMPANY_NAME: '', PHONE_NUMBER: '', LOCATION_CITY: '' });
    }
    setShowModal(true);
  };

  const saveSupplier = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Resolve or Create Location ID
    let locId = null;
    if (formData.LOCATION_CITY) {
      const { data: existingLoc } = await supabase.from('location').select('LOCATION_ID').ilike('CITY', formData.LOCATION_CITY).maybeSingle();
      if (existingLoc) {
        locId = existingLoc.LOCATION_ID;
      } else {
        const { data: newLoc } = await supabase.from('location').insert([{ CITY: formData.LOCATION_CITY, PROVINCE: 'Custom' }]).select().single();
        locId = newLoc?.LOCATION_ID || null;
      }
    }

    const payload = {
      COMPANY_NAME: formData.COMPANY_NAME,
      PHONE_NUMBER: formData.PHONE_NUMBER,
      LOCATION_ID: locId
    };

    let errorMsg = null;
    if (editingId) {
      const { error } = await supabase.from('supplier').update(payload).eq('SUPPLIER_ID', editingId);
      if (error) errorMsg = error.message;
    } else {
      const { error } = await supabase.from('supplier').insert([payload]);
      if (error) errorMsg = error.message;
    }
    
    setLoading(false);
    if (errorMsg) {
      alert(`Database Error: ${errorMsg}`);
      return;
    }
    
    setShowModal(false);
    fetchSuppliers();
  };

  const deleteSupplier = async (id) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      const { error } = await supabase.from('supplier').delete().eq('SUPPLIER_ID', id);
      if (error) {
        alert(`Delete Error: ${error.message}`);
      } else {
        setLoading(true);
        fetchSuppliers();
      }
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.COMPANY_NAME?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.PHONE_NUMBER?.includes(searchTerm)
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input 
            type="text" 
            placeholder="Search suppliers..." 
            className="input" 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      <div className="glass table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Phone Number</th>
              <th>Location</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Loading suppliers...</td>
              </tr>
            ) : filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No suppliers found.</td>
              </tr>
            ) : (
              filteredSuppliers.map((sup) => (
                <tr key={sup.SUPPLIER_ID}>
                  <td style={{ fontWeight: 500 }}>{sup.COMPANY_NAME}</td>
                  <td className="text-muted">{sup.PHONE_NUMBER}</td>
                  <td>
                    {sup.location?.CITY ? `${sup.location.CITY}, ${sup.location.PROVINCE}` : 'N/A'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Edit" onClick={() => openModal(sup)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-destructive" style={{ padding: '0.5rem' }} title="Delete" onClick={() => deleteSupplier(sup.SUPPLIER_ID)}>
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

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '2rem' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '400px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h3 className="heading-2" style={{ margin: 0 }}>{editingId ? 'Edit Supplier' : 'Add Supplier'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-muted" /></button>
            </div>
            
            <form onSubmit={saveSupplier} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="text" className="input" placeholder="Company Name" value={formData.COMPANY_NAME} onChange={e => setFormData({...formData, COMPANY_NAME: e.target.value})} required />
                <input type="tel" className="input" placeholder="Phone Number" value={formData.PHONE_NUMBER} onChange={e => setFormData({...formData, PHONE_NUMBER: e.target.value})} required />
                <input type="text" className="input" placeholder="Location City (e.g. Mombasa)" value={formData.LOCATION_CITY} onChange={e => setFormData({...formData, LOCATION_CITY: e.target.value})} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" style={{ marginRight: '1rem' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2.5rem' }}>Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
