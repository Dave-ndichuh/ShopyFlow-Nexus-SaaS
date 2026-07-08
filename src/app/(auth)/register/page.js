'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, [supabase, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
      const result = await supabase.auth.signUp({ email, password });
      
      if (result.error) {
        setError(result.error.message);
        setLoading(false);
      } else {
        // Success
        router.push('/onboarding');
        router.refresh();
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {error && (
        <div style={{ padding: '0.75rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#ef4444', fontSize: '0.875rem', textAlign: 'center' }}>
          {error}
        </div>
      )}
      
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>Email Address</label>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
            <Mail size={18} />
          </div>
          <input
            type="email"
            name="email"
            style={{ paddingLeft: '3rem', height: '52px', width: '100%', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', fontSize: '1rem' }}
            placeholder="user@company.com"
            required
            onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>Password</label>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
            <Lock size={18} />
          </div>
          <input
            type="password"
            name="password"
            style={{ paddingLeft: '3rem', height: '52px', width: '100%', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', fontSize: '1rem' }}
            placeholder="••••••••"
            required
            onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
      </div>

      <button 
        type="submit" 
        style={{ width: '100%', marginTop: '0.5rem', height: '52px', fontSize: '1rem', fontWeight: 600, background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', color: 'white', border: 'none', borderRadius: '99px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)', transition: 'all 0.2s' }}
        disabled={loading}
        onMouseOver={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)'; } }}
        onMouseOut={(e) => { if (!loading) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(59, 130, 246, 0.39)'; } }}
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : 'Create Account'}
      </button>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#ffffff', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Left Panel - Image/Brand */}
      <div style={{ flex: 1, display: 'none', '@media (minWidth: 1024px)': { display: 'flex' }, position: 'relative', overflow: 'hidden' }} className="auth-image-panel">

        
        {/* Background Image */}
        <div style={{ 
          position: 'absolute', inset: 0, 
          backgroundImage: 'url(/assets/images/auth-bg.png)', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          filter: 'contrast(1.1) saturate(1.2)'
        }} />
        
        {/* Dark Gradient Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(30,58,138,0.6) 100%)' }} />
        
        <div style={{ position: 'relative', zIndex: 10, padding: '4rem', display: 'flex', flexDirection: 'column', height: '100%', color: 'white' }}>
          <Link href="/" style={{ display: 'inline-block', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.05em', color: 'white', textDecoration: 'none' }}>
            Nexus
          </Link>
          
          <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              Start scaling your retail operations today.
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.8)', maxWidth: '480px', lineHeight: 1.6 }}>
              Join thousands of businesses managing their inventory, sales, and analytics with Nexus.
            </p>
          </div>
          
          <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex' }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', marginRight: '4px' }} />
              ))}
            </div>
            <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Trusted by 5,000+ businesses</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative' }}>
        
        {/* Mobile Logo */}
        <div style={{ position: 'absolute', top: '2rem', left: '2rem' }} className="mobile-logo">

          <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.05em', color: '#0f172a', textDecoration: 'none' }}>
            Nexus
          </Link>
        </div>

        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>Create an account</h2>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>Enter your details to get started with Nexus.</p>
          </div>
          
          <Suspense fallback={<div>Loading form...</div>}>
            <RegisterForm />
          </Suspense>

          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.95rem', color: '#64748b' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>
                Sign in <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '2px' }} />
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
