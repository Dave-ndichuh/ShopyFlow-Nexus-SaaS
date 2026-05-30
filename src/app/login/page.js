'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, Loader2, Sparkles, UserCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
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
        <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '150px', height: '150px', background: '#f97316', filter: 'blur(60px)', opacity: 0.2, borderRadius: '50%' }} />

        <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
            marginBottom: '0.5rem'
          }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.05em', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              Jobea <Sparkles size={28} color="#8b5cf6" style={{ WebkitTextFillColor: 'initial' }} />
            </h1>
          </div>
          <p className="text-muted" style={{ fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Admin Portal</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem', position: 'relative' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Admin Email</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}>
                <Mail size={18} />
              </div>
              <input
                type="email"
                className="input"
                style={{ paddingLeft: '2.5rem', height: '48px' }}
                placeholder="admin@jobea.co.ke"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Secure Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}>
                <Lock size={18} />
              </div>
              <input
                type="password"
                className="input"
                style={{ paddingLeft: '2.5rem', height: '48px' }}
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
            style={{ width: '100%', marginTop: '0.5rem', height: '48px', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Authenticate'}
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', position: 'relative', textAlign: 'center' }}>
          <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Are you a staff member?</p>
          <Link href="/employee-login" style={{ textDecoration: 'none' }}>
            <button className="btn btn-secondary" style={{ width: '100%', height: '48px', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <UserCheck size={18} /> Employee Portal Access <ArrowRight size={16} />
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}
