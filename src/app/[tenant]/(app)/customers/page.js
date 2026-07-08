'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { useAuth } from '@/components/AuthGuard';
import { ContactService } from '@/lib/services/contactService';

export default function ContactsPage() {
  const { activeTenant, t } = useAuth();
  const [supabase] = useState(() => createClient());

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', phone: '', email: '', address: '', type: 'customer'
  });

  const fetchContacts = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const data = await ContactService.getContacts(supabase, activeTenant.id);
      setContacts(data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [activeTenant]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await ContactService.deleteContact(supabase, id);
      fetchContacts();
    } catch (err) {
      alert('Error deleting contact: ' + err.message);
    }
  };

  const openModal = (contact = null) => {
    if (contact) {
      setEditingId(contact.id);
      setFormData({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        phone: contact.phone || '',
        email: contact.email || '',
        address: contact.address || '',
        type: contact.type || 'customer'
      });
    } else {
      setEditingId(null);
      setFormData({ 
        first_name: '', last_name: '', phone: '', email: '', address: '', type: 'customer'
      });
    }
    setShowModal(true);
  };

  const saveContact = async (e) => {
    e.preventDefault();
    if (!activeTenant) return;

    try {
      if (editingId) {
        await ContactService.updateContact(supabase, editingId, formData);
      } else {
        await ContactService.createContact(supabase, activeTenant.id, formData);
      }
      setShowModal(false);
      fetchContacts();
    } catch (err) {
      alert(`Database Error: ${err.message}`);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input 
            type="text" 
            placeholder={`Search ${t('contacts').toLowerCase()}...`} 
            className="input" 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} />
          Add {t('contacts')}
        </button>
      </div>

      <div className="glass table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Contact</th>
              <th>Contact Info</th>
              <th>Type</th>
              <th>Address</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading contacts...</td>
              </tr>
            ) : filteredContacts.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No contacts found.</td>
              </tr>
            ) : (
              filteredContacts.map((contact) => (
                <tr key={contact.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{contact.first_name} {contact.last_name}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>{contact.phone}</div>
                    {contact.email && <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{contact.email}</div>}
                  </td>
                  <td>
                    <span className={`badge badge-success`} style={{ textTransform: 'capitalize' }}>
                      {contact.type || 'customer'}
                    </span>
                  </td>
                  <td className="text-muted">{contact.address || 'N/A'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Edit" onClick={() => openModal(contact)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-destructive" style={{ padding: '0.5rem' }} title="Delete" onClick={() => handleDelete(contact.id)}>
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
              <h3 className="heading-2" style={{ margin: 0 }}>{editingId ? 'Edit Contact' : 'Add Contact'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-muted" /></button>
            </div>
            
            <form onSubmit={saveContact} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input type="text" className="input" placeholder="First Name" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required />
                  <input type="text" className="input" placeholder="Last Name" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required />
                </div>
                
                <input type="email" className="input" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                
                <input type="tel" className="input" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                
                <select className="input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ background: 'var(--card)' }}>
                  <option value="customer">Customer</option>
                  <option value="client">Client</option>
                  <option value="lead">Lead</option>
                </select>

                <textarea className="input" placeholder="Address..." rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={{ resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" style={{ marginRight: '1rem' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2.5rem' }}>Save Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
