'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Plus, Edit, Trash2, Search, X, Wrench, Calendar, Settings, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/components/AuthGuard';
import { createPortal } from 'react-dom';
import { ServiceTicketService } from '@/lib/services/serviceTicketService';
import { ContactService } from '@/lib/services/contactService';
import { CatalogService } from '@/lib/services/catalogService';

export default function ServicesPage() {
  const { activeTenant, activeBranch, user } = useAuth();
  const [supabase] = useState(() => createClient());
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [originalStatus, setOriginalStatus] = useState('');
  const [formData, setFormData] = useState({
    ticket_code: '', customer_id: '', employee_id: '', service_type: '', description: '', 
    date_scheduled: '', status: 'Scheduled', labor_price: 0, duration: '', notes: ''
  });

  // Parts / Details State
  const [serviceDetails, setServiceDetails] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qtyToAdd, setQtyToAdd] = useState(1);
  const role = user?.app_metadata?.role || 'employee';

  const pendingAssignments = tickets.filter(s => s.employee_id === user?.id && s.status === 'Pending Assignment');

  const updateServiceStatus = async (id, status) => {
    try {
      await ServiceTicketService.updateTicket(supabase, activeTenant.id, id, { status });
      fetchTickets();
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const fetchTickets = async () => {
    if (!activeTenant || !activeBranch) return;
    setLoading(true);
    try {
      const t = await ServiceTicketService.getTickets(supabase, activeTenant.id, activeBranch.id, role === 'employee' ? user.id : null);
      setTickets(t || []);

      const [cust, prod] = await Promise.all([
        ContactService.getContacts(supabase, activeTenant.id),
        CatalogService.getItems(supabase, activeTenant.id)
      ]);
      setCustomers(cust || []);
      setProducts(prod || []);
      
      // Fetch Employees for branch - using tenant_memberships
      const { data: emps } = await supabase.from('tenant_memberships').select('user_id, profiles!inner(first_name, last_name)').eq('tenant_id', activeTenant.id);
      setEmployees(emps?.map(e => ({ id: e.user_id, first_name: e.profiles.first_name, last_name: e.profiles.last_name })) || []);

    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTenant) fetchTickets();
  }, [activeTenant, activeBranch, user]);

  const openModal = (ticket = null) => {
    if (ticket) {
      setEditingId(ticket.id);
      setOriginalStatus(ticket.status || 'Scheduled');
      setFormData({
        ticket_code: ticket.ticket_code || '',
        customer_id: ticket.customer_id || '',
        employee_id: ticket.employee_id || '',
        service_type: ticket.service_type || '',
        description: ticket.description || '',
        date_scheduled: ticket.date_scheduled ? ticket.date_scheduled.split('T')[0] : '',
        status: ticket.status || 'Scheduled',
        labor_price: ticket.labor_price || 0,
        duration: ticket.duration || '',
        notes: ticket.notes || ''
      });
      setServiceDetails(ticket.service_ticket_items || []);
    } else {
      setEditingId(null);
      setOriginalStatus('');
      setFormData({ 
        ticket_code: `SRV-${Math.floor(Math.random() * 10000)}`, 
        customer_id: '', employee_id: '', service_type: '', description: '', 
        date_scheduled: new Date().toISOString().split('T')[0], 
        status: 'Pending Assignment', labor_price: 0, duration: '', notes: ''
      });
      setServiceDetails([]);
    }
    setShowModal(true);
  };

  const saveService = async (e) => {
    e.preventDefault();
    if (!activeTenant || !activeBranch) return;

    const payload = { ...formData };
    
    try {
      if (editingId) {
        await ServiceTicketService.updateTicket(supabase, activeTenant.id, editingId, payload);
      } else {
        await ServiceTicketService.createTicket(supabase, activeTenant.id, activeBranch.id, payload);
      }
      
      setShowModal(false);
      fetchTickets();
    } catch (err) {
      alert(`Database Error: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this service ticket?')) {
      try {
        await ServiceTicketService.deleteTicket(supabase, activeTenant.id, id);
        fetchTickets();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const addPartToService = async () => {
    if (!editingId) return alert("Save the service ticket first before adding parts.");
    if (!selectedProduct || qtyToAdd <= 0) return;

    const prod = products.find(p => p.id === selectedProduct);
    if (!prod) return;

    try {
      await ServiceTicketService.addPartToTicket(supabase, activeTenant.id, editingId, {
        item_id: prod.id,
        quantity: qtyToAdd,
        unit_price: prod.selling_price,
        subtotal: prod.selling_price * qtyToAdd
      });
      // refresh ticket details
      const t = await ServiceTicketService.getTickets(supabase, activeTenant.id, activeBranch.id);
      setTickets(t);
      const updatedTicket = t.find(tic => tic.id === editingId);
      if (updatedTicket) setServiceDetails(updatedTicket.service_ticket_items);
      
      setSelectedProduct('');
      setQtyToAdd(1);
    } catch (err) {
      alert(err.message);
    }
  };

  const removePart = async (detailId) => {
    if (confirm('Remove this part from the ticket?')) {
      try {
        await ServiceTicketService.removePartFromTicket(supabase, activeTenant.id, detailId);
        const t = await ServiceTicketService.getTickets(supabase, activeTenant.id, activeBranch.id);
        setTickets(t);
        const updatedTicket = t.find(tic => tic.id === editingId);
        if (updatedTicket) setServiceDetails(updatedTicket.service_ticket_items);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending Assignment': return 'badge-secondary';
      case 'Scheduled': return 'badge-warning';
      case 'In Progress': return 'badge-primary';
      case 'Completed': return 'badge-success';
      case 'Declined': return 'badge-destructive';
      case 'Cancelled': return 'badge-destructive';
      default: return 'badge-secondary';
    }
  };

  const filteredTickets = tickets.filter(s => 
    s.ticket_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customer?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading service tickets...</div>;
  }

  return (
    <div className="animate-fade-in">
      {role === 'employee' && pendingAssignments.length > 0 && (
        <div className="glass" style={{ borderLeft: '4px solid #f59e0b', padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 className="heading-2" style={{ margin: 0, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} /> You have {pendingAssignments.length} new service assignment(s)
          </h3>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingAssignments.map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.ticket_code} - {s.service_type}</div>
                  <div className="text-muted" style={{ fontSize: '0.875rem' }}>Customer: {s.customer?.first_name} {s.customer?.last_name} | Scheduled: {new Date(s.date_scheduled).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => updateServiceStatus(s.id, 'Declined')}>Decline</button>
                  <button className="btn btn-primary" onClick={() => updateServiceStatus(s.id, 'Scheduled')}>Accept</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input 
            type="text" 
            placeholder="Search tickets, customers..." 
            className="input" 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} />
          New Service
        </button>
      </div>

      <div className="glass table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Customer</th>
              <th>Assigned To</th>
              <th>Service Type</th>
              <th>Scheduled</th>
              <th>Status</th>
              <th>Labor Price</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No service tickets found.</td>
              </tr>
            ) : (
              filteredTickets.map((srv) => {
                const emp = employees.find(e => e.id === srv.employee_id);
                return (
                <tr key={srv.id}>
                  <td><span className="badge badge-warning">{srv.ticket_code}</span></td>
                  <td style={{ fontWeight: 500 }}>{srv.customer?.first_name} {srv.customer?.last_name}</td>
                  <td className="text-muted">{emp ? `${emp.first_name} ${emp.last_name}` : 'Unassigned'}</td>
                  <td>{srv.service_type}</td>
                  <td className="text-muted">{srv.date_scheduled ? new Date(srv.date_scheduled).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span className={`badge ${getStatusColor(srv.status)}`}>
                      {srv.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>Ksh. {srv.labor_price?.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Edit" onClick={() => openModal(srv)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-destructive" style={{ padding: '0.5rem' }} title="Delete" onClick={() => handleDelete(srv.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>

      {showModal && typeof document !== 'undefined' && createPortal(
        <div style={{ 
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', 
          display: 'flex', alignItems: role === 'employee' ? 'center' : 'flex-start', justifyContent: 'center', 
          zIndex: 9999, padding: role === 'employee' ? '1rem' : '5rem 2rem 2rem 2rem', overflowY: 'auto' 
        }}>
          {role === 'employee' ? (
            <div className="glass" style={{ width: '100%', maxWidth: '550px', display: 'flex', flexDirection: 'column', background: 'var(--background)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                <h3 className="heading-2" style={{ margin: 0, fontSize: '1.25rem' }}>Service Assignment</h3>
                <button onClick={() => setShowModal(false)}><X size={20} className="text-muted" /></button>
              </div>
              
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ padding: '0.75rem 1rem', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>{formData.ticket_code} - {formData.service_type}</div>
                  <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                    {formData.description || 'No description provided.'}
                  </div>
                </div>

                <form id="employeeServiceForm" onSubmit={saveService}>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Update Status</label>
                      <select className="input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ background: 'var(--card)' }}>
                        <option value="Scheduled">Scheduled</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Service Notes / Mechanic Log</label>
                    <textarea className="input" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} style={{ resize: 'none' }} />
                  </div>
                </form>

                {editingId && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <h4 style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                      <Settings size={16} /> Parts Used
                    </h4>
                    
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                      <div style={{ flex: 2 }}>
                        <select className="input" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} style={{ background: 'var(--card)' }}>
                          <option value="" disabled>Select a part from inventory...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <input type="number" className="input" min="1" placeholder="Qty" value={qtyToAdd} onChange={e => setQtyToAdd(parseInt(e.target.value) || 1)} />
                      </div>
                      <button type="button" className="btn btn-secondary" onClick={addPartToService}>
                        <Plus size={16} /> Add
                      </button>
                    </div>

                    <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                      <table className="table" style={{ fontSize: '0.875rem', marginTop: '0' }}>
                        <tbody>
                          {serviceDetails.length === 0 ? (
                            <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '0.5rem' }}>No parts added yet.</td></tr>
                          ) : (
                            serviceDetails.map(detail => (
                              <tr key={detail.id}>
                                <td style={{ padding: '0.5rem' }}>{detail.catalog_items?.name}</td>
                                <td style={{ padding: '0.5rem' }}>Qty: {detail.quantity}</td>
                                <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                                  <button type="button" onClick={() => removePart(detail.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                    <X size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
                <button type="button" className="btn btn-secondary" style={{ marginRight: '1rem' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" form="employeeServiceForm" className="btn btn-primary" style={{ padding: '0.5rem 2rem' }}>Save Updates</button>
              </div>
            </div>
          ) : (
            <div className="glass" style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', background: 'var(--background)', marginBottom: '4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <h3 className="heading-2" style={{ margin: 0 }}>{editingId ? 'Edit Service Ticket' : 'Create Service Ticket'}</h3>
                <button onClick={() => setShowModal(false)}><X size={20} className="text-muted" /></button>
              </div>
              
              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                <form id="serviceForm" onSubmit={saveService} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  
                  {/* Left Column - Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h4 style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '-0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Wrench size={18} /> Service Info
                    </h4>
                    
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Ticket Code</label>
                        <input type="text" className="input" value={formData.ticket_code} onChange={e => setFormData({...formData, ticket_code: e.target.value})} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Service Type</label>
                        <input type="text" className="input" placeholder="e.g. Oil Change" value={formData.service_type} onChange={e => setFormData({...formData, service_type: e.target.value})} required />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Customer</label>
                        <select className="input" value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value || null})} style={{ background: 'var(--card)' }}>
                          <option value="">Select Customer</option>
                          {customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Assigned Employee</label>
                        <select className="input" value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value || null})} style={{ background: 'var(--card)' }}>
                          <option value="">Select Employee</option>
                          {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Service Description / Issue</label>
                      <textarea className="input" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ resize: 'vertical' }} />
                    </div>
                  </div>

                  {/* Right Column - Status & Billing */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h4 style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '-0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={18} /> Schedule & Billing
                    </h4>
                    
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Scheduled Date</label>
                        <input type="date" className="input" value={formData.date_scheduled} onChange={e => setFormData({...formData, date_scheduled: e.target.value})} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Estimated Duration</label>
                        <input type="text" className="input" placeholder="e.g. 2 Hours" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Status</label>
                        <select className="input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ background: 'var(--card)' }}>
                          <option value="Pending Assignment">Pending Assignment</option>
                          <option value="Scheduled">Scheduled</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Declined">Declined</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Labor Price (Ksh)</label>
                        <input type="number" className="input" value={formData.labor_price} onChange={e => setFormData({...formData, labor_price: parseFloat(e.target.value) || 0})} required />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Internal Notes</label>
                      <textarea className="input" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} style={{ resize: 'vertical' }} />
                    </div>
                  </div>

                </form>

                {/* Parts Usage Section */}
                {editingId && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                    <h4 style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Settings size={18} /> Parts & Materials Consumed
                    </h4>
                    
                    <div className="glass" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                      <div style={{ flex: 2 }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Search Inventory Part</label>
                        <select className="input" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} style={{ background: 'var(--card)' }}>
                          <option value="" disabled>Select a part...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} - Ksh {p.selling_price}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Qty</label>
                        <input type="number" className="input" min="1" value={qtyToAdd} onChange={e => setQtyToAdd(parseInt(e.target.value) || 1)} />
                      </div>
                      <button type="button" className="btn btn-secondary" onClick={addPartToService}>
                        <Plus size={16} /> Add Part
                      </button>
                    </div>

                    <table className="table" style={{ fontSize: '0.875rem' }}>
                      <thead>
                        <tr>
                          <th>Part Name</th>
                          <th>Qty</th>
                          <th>Unit Price</th>
                          <th>Subtotal</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviceDetails.length === 0 ? (
                          <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}>No parts added to this ticket yet.</td></tr>
                        ) : (
                          serviceDetails.map(detail => (
                            <tr key={detail.id}>
                              <td>{detail.catalog_items?.name}</td>
                              <td>{detail.quantity}</td>
                              <td>Ksh {detail.unit_price}</td>
                              <td style={{ fontWeight: 600 }}>Ksh {detail.subtotal}</td>
                              <td>
                                <button type="button" onClick={() => removePart(detail.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                  <X size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    
                    {serviceDetails.length > 0 && (
                      <div style={{ textAlign: 'right', marginTop: '1rem', fontWeight: 600, fontSize: '1.125rem' }}>
                        Parts Total: Ksh {serviceDetails.reduce((sum, d) => sum + Number(d.subtotal), 0).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                {!editingId && (
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', color: 'var(--muted-foreground)', fontSize: '0.875rem', textAlign: 'center' }}>
                    Save this service ticket first to unlock the "Parts & Materials Consumed" section.
                  </div>
                )}
                
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" style={{ marginRight: '1rem' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" form="serviceForm" className="btn btn-primary" style={{ padding: '0.75rem 2.5rem' }}>Save Ticket</button>
              </div>
            </div>
          )}
        </div>
      , document.body)}
    </div>
  );
}
