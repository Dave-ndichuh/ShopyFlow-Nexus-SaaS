'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Sparkles, UserCheck, ArrowLeft, Key, User } from 'lucide-react';
import Link from 'next/link';

export default function EmployeeLoginPage() {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleEmployeeLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // 1. Lookup Email from Username
      const { data: empData, error: dbError } = await supabase
        .from('employee')
        .select('EMAIL')
        .ilike('USERNAME', username.trim())
        .maybeSingle();

      if (dbError || !empData) {
        throw new Error('Invalid Username or PIN.');
      }

      // 2. Sign In to Supabase with Email and PIN
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: empData.EMAIL,
        password: pin,
      });

      if (authError) {
        throw new Error('Invalid Username or PIN.');
      }

      // Success, route to dashboard
      router.push('/dashboard');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <style jsx>{`
        .login-box { padding: 3rem 2.5rem; }
        @media (max-width: 640px) { .login-box { padding: 2rem 1.5rem; } }
      `}</style>
      <div className="glass animate-fade-in login-box" style={{
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)'
      }}>
        {/* Decorative glows */}
        <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '150px', height: '150px', background: 'var(--primary)', filter: 'blur(60px)', opacity: 0.3, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '150px', height: '150px', background: '#10b981', filter: 'blur(60px)', opacity: 0.2, borderRadius: '50%' }} />

        <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, var(--primary) 0%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
            marginBottom: '0.5rem'
          }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.05em', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              Employee Portal <Sparkles size={24} color="#10b981" style={{ WebkitTextFillColor: 'initial' }} />
            </h1>
          </div>
          <p className="text-muted" style={{ fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Secure Fast Access</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem', position: 'relative' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleEmployeeLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}>
                <User size={18} />
              </div>
              <input
                type="text"
                className="input"
                style={{ paddingLeft: '2.5rem', height: '48px' }}
                placeholder="e.g. Dmacharia"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Secure PIN</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}>
                <Key size={18} />
              </div>
              <input
                type="password"
                className="input"
                style={{ paddingLeft: '2.5rem', height: '48px', letterSpacing: '0.2em' }}
                placeholder="••••"
                maxLength="6"
                pattern="\d+"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '0.5rem', height: '48px', fontSize: '1rem', background: '#10b981', color: 'white', border: 'none' }}
            disabled={loading}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <><UserCheck size={18} /> Enter Portal</>}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', position: 'relative' }}>
          <Link href="/login" style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Return to Admin Login
          </Link>
        </div>

      </div>
    </div>
  );
}
