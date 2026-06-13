'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, UserCheck, ArrowRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const email = formData.get('email');
      const password = formData.get('password');
      
      let result;
      if (isLogin) {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await supabase.auth.signUp({ email, password });
      }
      
      if (result.error) {
        setError(result.error.message);
        setLoading(false);
      } else {
        // Success
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError(err.message);
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
      backgroundColor: '#0f172a',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style jsx>{`
        .login-box { padding: 3rem 2.5rem; }
        @media (max-width: 640px) { .login-box { padding: 2rem 1.5rem; } }
        
        .floating-icon {
          position: absolute;
          color: rgba(255, 255, 255, 0.03);
          z-index: 0;
          animation: float linear infinite;
        }
        
        @keyframes aurora {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(5vw, -5vh) scale(1.1); }
          66% { transform: translate(-5vw, 5vh) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
      `}</style>
      
      {/* Professional Ambient Gradient Background */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'aurora 20s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'aurora 25s ease-in-out infinite alternate-reverse' }} />
        <div style={{ position: 'absolute', top: '40%', left: '50%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(16,185,129,0.03) 0%, transparent 70%)', filter: 'blur(100px)', transform: 'translate(-50%, -50%)', animation: 'aurora 30s ease-in-out infinite alternate' }} />
      </div>

      <div className="glass animate-fade-in login-box" style={{
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px'
      }}>
        {/* Decorative glows */}
        <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '150px', height: '150px', background: '#3b82f6', filter: 'blur(60px)', opacity: 0.3, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '150px', height: '150px', background: '#10b981', filter: 'blur(60px)', opacity: 0.2, borderRadius: '50%' }} />

        <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
             <h1 style={{fontSize: '2.5rem', fontWeight: 'bold', color: 'white', letterSpacing: '-0.05em'}}>Nexus</h1>
          </div>
          <p style={{ fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>Business Operations Platform</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem', position: 'relative' }}>
            {error}
          </div>
        )}

        <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'white' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' }}>
                <Mail size={18} />
              </div>
              <input
                type="email"
                name="email"
                style={{ paddingLeft: '2.5rem', height: '48px', width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }}
                placeholder="user@company.com"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'white' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' }}>
                <Lock size={18} />
              </div>
              <input
                type="password"
                name="password"
                style={{ paddingLeft: '2.5rem', height: '48px', width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            style={{ width: '100%', marginTop: '0.5rem', height: '48px', fontSize: '1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            disabled={loading}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ zIndex: 10, position: 'relative', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'rgba(255,255,255,0.6)' }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            style={{ width: '100%', height: '48px', color: 'white', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            <UserCheck size={18} /> {isLogin ? 'Create Account' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
