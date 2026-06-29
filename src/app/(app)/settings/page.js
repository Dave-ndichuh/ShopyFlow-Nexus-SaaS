'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthGuard';
import { createClient } from '@/utils/supabase/client';
import { Save, CreditCard, Settings2, Smartphone, CheckCircle2, AlertCircle, Users as UsersIcon, Lock } from 'lucide-react';
import { PLANS, getPlanConfig, canAddBranch } from '@/lib/config/plans.config';

export default function SettingsPage() {
  const { activeTenant, setActiveTenant, t, branches: contextBranches } = useAuth();
  const supabase = createClient();
  
  const [activeTab, setActiveTab] = useState('terminology'); // 'terminology' | 'billing' | 'branches' | 'staff'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [roles, setRoles] = useState([]);

  // Terminology State
  const [industry, setIndustry] = useState('');
  const [labels, setLabels] = useState({
    contacts: '',
    catalog: '',
    orders: '',
    vendors: '',
    pos: ''
  });

  // Billing State
  const [billingConfig, setBillingConfig] = useState({
    pos_enabled: false,
    pos_paybill: '',
    pos_till_number: '',
    pos_consumer_key: '',
    pos_consumer_secret: ''
  });
  
  const [subscription, setSubscription] = useState(null);
  
  // Downgrade Modal State
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [targetPlan, setTargetPlan] = useState(null);
  const [branchesToDeactivate, setBranchesToDeactivate] = useState([]);

  useEffect(() => {
    if (activeTenant) {
      setIndustry(activeTenant.industry || 'Generic');
      setLabels(activeTenant.terminology || {
        contacts: 'Contacts', catalog: 'Catalog', orders: 'Orders', vendors: 'Vendors', pos: 'Sales / POS'
      });
      setBillingConfig({
        pos_enabled: activeTenant.pos_enabled || false,
        pos_paybill: activeTenant.pos_paybill || '',
        pos_till_number: activeTenant.pos_till_number || '',
        pos_consumer_key: activeTenant.pos_consumer_key || '',
        pos_consumer_secret: activeTenant.pos_consumer_secret || ''
      });
      fetchSubscription();
      fetchRoles();
    }
  }, [activeTenant]);

  const fetchRoles = async () => {
    const { data } = await supabase.from('roles').select('*');
    if (data) setRoles(data);
  };

  const fetchSubscription = async () => {
    if (!activeTenant) return;
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', activeTenant.id)
      .single();
    if (data) setSubscription(data);
  };

  const handleIndustryChange = (e) => {
    const val = e.target.value;
    setIndustry(val);
    
    // Auto-fill presets
    let newLabels = { ...labels };
    if (val === 'Healthcare') {
      newLabels = { contacts: 'Patients', catalog: 'Services', orders: 'Visits', vendors: 'Suppliers', pos: 'Check-in' };
    } else if (val === 'Auto Repair') {
      newLabels = { contacts: 'Customers', catalog: 'Parts', orders: 'Job Cards', vendors: 'Suppliers', pos: 'Service Bay' };
    } else if (val === 'Retail') {
      newLabels = { contacts: 'Customers', catalog: 'Products', orders: 'Sales', vendors: 'Suppliers', pos: 'POS Terminal' };
    } else if (val === 'Generic') {
      newLabels = { contacts: 'Contacts', catalog: 'Catalog', orders: 'Orders', vendors: 'Vendors', pos: 'Sales / POS' };
    }
    setLabels(newLabels);
  };

  const saveTerminology = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    const { error } = await supabase
      .from('tenants')
      .update({ industry, terminology: labels })
      .eq('id', activeTenant.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Terminology settings updated successfully!' });
      setActiveTenant({ ...activeTenant, industry, terminology: labels });
    }
    setLoading(false);
  };

  const saveBillingConfig = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    const { error } = await supabase
      .from('tenants')
      .update(billingConfig)
      .eq('id', activeTenant.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'POS Billing configuration saved!' });
      setActiveTenant({ ...activeTenant, ...billingConfig });
    }
    setLoading(false);
  };

  const initiateSaaSSTKPush = async (e) => {
    e.preventDefault();
    const phone = e.target.phone.value;
    if (!phone) return;
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/billing/mpesa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount: 2000, type: 'SaaS', tenant_id: activeTenant.id })
      });
      const result = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'STK Push sent! Please check your phone to complete the payment.' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to initiate payment.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error.' });
    }
    setLoading(false);
  };

  const handlePlanChangeClick = (newPlanId) => {
    if (!activeTenant) return;
    const currentPlanId = activeTenant.plan_id || 'starter';
    const newPlan = getPlanConfig(newPlanId);
    
    // Check if it's a downgrade requiring branch deactivation
    const activeBranchCount = contextBranches.filter(b => b.is_active).length;
    if (newPlan.branchLimit < activeBranchCount) {
      setTargetPlan(newPlan);
      setShowDowngradeModal(true);
      return;
    }

    // Otherwise proceed with plan change directly
    executePlanChange(newPlanId);
  };

  const executePlanChange = async (newPlanId) => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    // If we have branches to deactivate from the downgrade modal
    if (branchesToDeactivate.length > 0) {
      const { error: deactivateError } = await supabase
        .from('branches')
        .update({ is_active: false })
        .in('id', branchesToDeactivate);
        
      if (deactivateError) {
        setMessage({ type: 'error', text: 'Failed to deactivate branches.' });
        setLoading(false);
        return;
      }
    }

    const { error } = await supabase
      .from('tenants')
      .update({ plan_id: newPlanId })
      .eq('id', activeTenant.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: `Plan successfully changed to ${PLANS[newPlanId].name}!` });
      setActiveTenant({ ...activeTenant, plan_id: newPlanId });
      setShowDowngradeModal(false);
      setBranchesToDeactivate([]);
      // force reload to update limits
      window.location.reload();
    }
    setLoading(false);
  };

  const toggleBranchDeactivation = (branchId) => {
    setBranchesToDeactivate(prev => 
      prev.includes(branchId) ? prev.filter(id => id !== branchId) : [...prev, branchId]
    );
  };

  const handleInviteStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    const formData = new FormData(e.target);
    const payload = {
      email: formData.get('email'),
      password: formData.get('password') || undefined,
      role_id: formData.get('role_id'),
      branch_ids: formData.getAll('branch_ids'), // gets multiple selects
      tenant_id: activeTenant.id
    };

    try {
      const res = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Staff member invited successfully!' });
        e.target.reset();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to invite staff.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error during invitation.' });
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="heading-1" style={{ margin: 0 }}>Workspace Settings</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('terminology')} 
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 500, cursor: 'pointer',
            color: activeTab === 'terminology' ? 'var(--primary)' : 'var(--muted-foreground)',
            borderBottom: activeTab === 'terminology' ? '2px solid var(--primary)' : 'none',
            display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap'
          }}
        >
          <Settings2 size={18} /> Terminology
        </button>
        <button 
          onClick={() => setActiveTab('billing')} 
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 500, cursor: 'pointer',
            color: activeTab === 'billing' ? 'var(--primary)' : 'var(--muted-foreground)',
            borderBottom: activeTab === 'billing' ? '2px solid var(--primary)' : 'none',
            display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap'
          }}
        >
          <CreditCard size={18} /> Billing & Subscriptions
        </button>
        <button 
          onClick={() => setActiveTab('branches')} 
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 500, cursor: 'pointer',
            color: activeTab === 'branches' ? 'var(--primary)' : 'var(--muted-foreground)',
            borderBottom: activeTab === 'branches' ? '2px solid var(--primary)' : 'none',
            display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap'
          }}
        >
          <Settings2 size={18} /> Branches
        </button>
        <button 
          onClick={() => setActiveTab('staff')} 
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 500, cursor: 'pointer',
            color: activeTab === 'staff' ? 'var(--primary)' : 'var(--muted-foreground)',
            borderBottom: activeTab === 'staff' ? '2px solid var(--primary)' : 'none',
            display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap'
          }}
        >
          <UsersIcon size={18} /> Staff
        </button>
      </div>

      {message.text && (
        <div className={`glass ${message.type === 'error' ? 'border-destructive text-destructive' : 'border-success text-success'}`} style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeftWidth: '4px', borderLeftStyle: 'solid' }}>
          {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          {message.text}
        </div>
      )}

      {/* Downgrade Modal */}
      {showDowngradeModal && targetPlan && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '2rem', borderRadius: '16px' }}>
            <h2 className="heading-2" style={{ color: 'var(--destructive)', marginBottom: '1rem' }}>Action Required</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
              The <strong>{targetPlan.name}</strong> plan only supports {targetPlan.branchLimit} active branch{targetPlan.branchLimit > 1 ? 'es' : ''}. 
              You currently have {contextBranches.filter(b => b.is_active).length} active branches. 
              Please select {(contextBranches.filter(b => b.is_active).length - targetPlan.branchLimit)} branch(es) to deactivate before continuing.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', maxHeight: '200px', overflowY: 'auto' }}>
              {contextBranches.filter(b => b.is_active).map(b => (
                <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={branchesToDeactivate.includes(b.id)}
                    onChange={() => toggleBranchDeactivation(b.id)}
                    style={{ width: '1.2rem', height: '1.2rem' }}
                  />
                  <span>{b.name}</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setShowDowngradeModal(false); setBranchesToDeactivate([]); }}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={() => executePlanChange(targetPlan.id)}
                disabled={branchesToDeactivate.length < (contextBranches.filter(b => b.is_active).length - targetPlan.branchLimit)}
                style={{ backgroundColor: 'var(--destructive)', border: 'none' }}
              >
                Confirm Downgrade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminology Tab */}
      {activeTab === 'terminology' && (
        <div className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 className="heading-2" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Industry Profile</h2>
            <p className="text-muted" style={{ marginBottom: '1rem' }}>Select an industry to auto-configure the platform's vocabulary.</p>
            <select className="input" value={industry} onChange={handleIndustryChange} style={{ maxWidth: '300px' }}>
              <option value="Generic">Generic / Other</option>
              <option value="Retail">Retail Store</option>
              <option value="Auto Repair">Auto Repair / Garage</option>
              <option value="Healthcare">Healthcare / Clinic</option>
            </select>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />

          <div>
            <h2 className="heading-2" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Custom Vocabulary</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Override specific labels to match your business needs.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label className="label">Contacts Module (e.g. Customers, Patients)</label>
                <input className="input" value={labels.contacts} onChange={e => setLabels({...labels, contacts: e.target.value})} />
              </div>
              <div>
                <label className="label">Catalog Module (e.g. Products, Services)</label>
                <input className="input" value={labels.catalog} onChange={e => setLabels({...labels, catalog: e.target.value})} />
              </div>
              <div>
                <label className="label">Orders Module (e.g. Sales, Visits)</label>
                <input className="input" value={labels.orders} onChange={e => setLabels({...labels, orders: e.target.value})} />
              </div>
              <div>
                <label className="label">Vendors Module (e.g. Suppliers, Partners)</label>
                <input className="input" value={labels.vendors} onChange={e => setLabels({...labels, vendors: e.target.value})} />
              </div>
              <div>
                <label className="label">POS Module (e.g. Sales / POS, Check-in)</label>
                <input className="input" value={labels.pos} onChange={e => setLabels({...labels, pos: e.target.value})} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={saveTerminology} disabled={loading}>
              <Save size={18} /> {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* SaaS Subscription */}
          <div className="glass" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 className="heading-2" style={{ fontSize: '1.25rem', margin: 0 }}>SaaS Subscription</h2>
                <p className="text-muted" style={{ marginTop: '0.25rem' }}>Manage your platform access.</p>
              </div>
              <span className={`badge ${subscription?.status === 'Active' ? 'badge-success' : 'badge-warning'}`} style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                {activeTenant?.subscription_status === 'pending_payment' ? 'Pending Payment' : (subscription?.status || 'Active')}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
              <div>
                <div className="text-muted" style={{ fontSize: '0.875rem' }}>Current Plan</div>
                <div style={{ fontWeight: 600, fontSize: '1.125rem', color: 'var(--primary)' }}>{getPlanConfig(activeTenant?.plan_id).name}</div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.875rem' }}>Status</div>
                <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{activeTenant?.subscription_status === 'pending_payment' ? 'Restricted (Awaiting Payment)' : 'Fully Active'}</div>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 className="heading-3" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Change Plan</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {Object.values(PLANS).map(plan => (
                  <button 
                    key={plan.id}
                    className={`btn ${activeTenant?.plan_id === plan.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handlePlanChangeClick(plan.id)}
                    disabled={activeTenant?.plan_id === plan.id || loading}
                    style={{ flex: 1 }}
                  >
                    {plan.name} <br/>
                    <small>{plan.priceKsh} Ksh/mo</small>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={initiateSaaSSTKPush} style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', background: 'var(--card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ flex: 1 }}>
                <label className="label">Pay with M-Pesa (Amount: Ksh 2,000 / month)</label>
                <div style={{ position: 'relative' }}>
                  <Smartphone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                  <input type="text" name="phone" className="input" placeholder="254712345678" style={{ paddingLeft: '2.5rem' }} required />
                </div>
              </div>
              <button type="submit" className="btn" style={{ backgroundColor: '#25D366', color: '#fff', border: 'none' }} disabled={loading}>
                {loading ? 'Processing...' : 'Pay via STK Push'}
              </button>
            </form>
          </div>

          {/* POS STK Push Credentials */}
          <div className="glass" style={{ padding: '2rem' }}>
            <h2 className="heading-2" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>POS M-Pesa Integration (Daraja)</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Enable direct STK Push payments from your customers at the Point of Sale.</p>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1.5rem' }}>
              <input type="checkbox" checked={billingConfig.pos_enabled} onChange={e => setBillingConfig({...billingConfig, pos_enabled: e.target.checked})} style={{ width: '1.25rem', height: '1.25rem' }} />
              <span style={{ fontWeight: 500 }}>Enable POS M-Pesa Checkouts</span>
            </label>

            {billingConfig.pos_enabled && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', animation: 'fadeIn 0.3s' }}>
                <div>
                  <label className="label">Paybill / Till Number</label>
                  <input className="input" value={billingConfig.pos_paybill} onChange={e => setBillingConfig({...billingConfig, pos_paybill: e.target.value})} placeholder="e.g. 174379" />
                </div>
                <div>
                  <label className="label">Passkey / Till Number</label>
                  <input className="input" value={billingConfig.pos_till_number} onChange={e => setBillingConfig({...billingConfig, pos_till_number: e.target.value})} placeholder="Passkey for Paybill" />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="label">Consumer Key</label>
                  <input type="password" className="input" value={billingConfig.pos_consumer_key} onChange={e => setBillingConfig({...billingConfig, pos_consumer_key: e.target.value})} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="label">Consumer Secret</label>
                  <input type="password" className="input" value={billingConfig.pos_consumer_secret} onChange={e => setBillingConfig({...billingConfig, pos_consumer_secret: e.target.value})} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-primary" onClick={saveBillingConfig} disabled={loading}>
                <Save size={18} /> {loading ? 'Saving...' : 'Save POS Settings'}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Branches Tab */}
      {activeTab === 'branches' && (
        <div className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 className="heading-2" style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Branches & Locations</h2>
              <p className="text-muted">Manage your physical locations, stores, or warehouses.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => alert("Branch creation modal coming soon!")}
                disabled={!canAddBranch(activeTenant?.plan_id, contextBranches?.filter(b => b.is_active).length)}
                title={!canAddBranch(activeTenant?.plan_id, contextBranches?.filter(b => b.is_active).length) ? "Branch limit reached for your plan" : ""}
              >
                {!canAddBranch(activeTenant?.plan_id, contextBranches?.filter(b => b.is_active).length) ? <><Lock size={16}/> Limit Reached</> : 'Add Branch'}
              </button>
              {!canAddBranch(activeTenant?.plan_id, contextBranches?.filter(b => b.is_active).length) && (
                <span style={{ fontSize: '0.75rem', color: 'var(--destructive)' }}>Upgrade plan to add more branches.</span>
              )}
            </div>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Branch Name</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Code</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {contextBranches && contextBranches.length > 0 ? (
                  contextBranches.map(b => (
                    <tr key={b.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>{b.name}</td>
                      <td style={{ padding: '1rem' }}><span className="badge badge-secondary">{b.code || 'N/A'}</span></td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge ${b.is_active ? 'badge-success' : 'badge-destructive'}`}>
                          {b.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                      No branches found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <div className="glass animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 className="heading-2" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Staff & Team Members</h2>
            <p className="text-muted">Invite team members, assign roles, and manage branch access.</p>
          </div>
          
          <div style={{ background: 'var(--card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <h3 className="heading-3" style={{ marginBottom: '1rem' }}>Invite New Member</h3>
            <form onSubmit={handleInviteStaff} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label className="label">Email Address</label>
                <input type="email" name="email" className="input" required />
              </div>
              <div>
                <label className="label">Temporary Password</label>
                <input type="password" name="password" className="input" placeholder="Optional" />
              </div>
              <div>
                <label className="label">Role</label>
                <select name="role_id" className="input" required>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name} - {r.description}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Allowed Branches</label>
                <select name="branch_ids" className="input" multiple style={{ height: 'auto', padding: '0.5rem' }} required>
                  {contextBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Hold CTRL/CMD to select multiple. Cashiers MUST be assigned a branch.</p>
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Inviting...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
