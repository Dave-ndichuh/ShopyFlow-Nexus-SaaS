'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      router.push('/');
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
      background: 'radial-gradient(circle at 50% -20%, #1e293b, #0f172a)'
    }}>
      <div className="glass animate-fade-in" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '2.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative glow */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          left: '-50px',
          width: '100px',
          height: '100px',
          background: 'var(--primary)',
          filter: 'blur(50px)',
          opacity: 0.5,
          borderRadius: '50%'
        }} />

        <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            background: 'rgba(59, 130, 246, 0.1)', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 1rem',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <Lock size={24} className="text-primary" style={{ color: 'var(--primary)' }} />
          </div>
          <h1 className="heading-2">Welcome Back</h1>
          <p className="text-muted">Enter your credentials to access the POS</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
          {error && (
            <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '0.875rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}>
                <Mail size={18} />
              </div>
              <input
                type="email"
                className="input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="admin@autospares.co.ke"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}>
                <Lock size={18} />
              </div>
              <input
                type="password"
                className="input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
