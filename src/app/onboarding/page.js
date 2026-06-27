'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Building2, Loader2, Briefcase } from 'lucide-react';

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
      }
    };
    getUser();
  }, [router, supabase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.target);
    const businessName = formData.get('business_name');
    const industry = formData.get('industry');

    try {
      const res = await fetch('/api/tenant/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          business_name: businessName,
          industry: industry
        })
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Failed to create workspace');
      }

      // Success! Force a full page reload to the dashboard so AuthGuard runs from scratch
      // and picks up the new tenant_memberships
      window.location.href = '/dashboard';

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!user) {
    return <div style={{ minHeight: '100vh', background: '#0f172a' }} />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      backgroundColor: '#0f172a',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient Background */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="glass animate-fade-in" style={{
        width: '100%',
        maxWidth: '480px',
        position: 'relative',
        zIndex: 10,
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(16px)',
        borderRadius: '16px',
        padding: '3rem 2.5rem',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#3b82f6' }}>
            <Building2 size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>Create Your Workspace</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Tell us about your business to set up your Nexux environment.</p>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'white' }}>Business Name</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' }}>
                <Building2 size={18} />
              </div>
              <input
                type="text"
                name="business_name"
                style={{ paddingLeft: '2.5rem', height: '48px', width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }}
                placeholder="e.g. Acme Corporation"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'white' }}>Industry</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' }}>
                <Briefcase size={18} />
              </div>
              <select
                name="industry"
                style={{ paddingLeft: '2.5rem', height: '48px', width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none', appearance: 'none' }}
                required
              >
                <option value="Generic" style={{ color: '#0f172a' }}>Generic / Other</option>
                <option value="Retail" style={{ color: '#0f172a' }}>Retail Store</option>
                <option value="Auto Repair" style={{ color: '#0f172a' }}>Auto Repair / Garage</option>
                <option value="Healthcare" style={{ color: '#0f172a' }}>Healthcare / Clinic</option>
              </select>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>We'll automatically configure terminology based on your industry.</p>
          </div>

          <button 
            type="submit" 
            style={{ width: '100%', marginTop: '1rem', height: '48px', fontSize: '1rem', fontWeight: 500, backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            disabled={loading}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Complete Setup'}
          </button>
        </form>

      </div>
    </div>
  );
}
