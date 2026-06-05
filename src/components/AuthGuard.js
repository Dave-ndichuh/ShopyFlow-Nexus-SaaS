'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext({ user: null, role: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setUser(null);
        setRole(null);
        if (pathname !== '/login' && pathname !== '/employee-login') {
          router.push('/login');
        } else {
          setAuthorized(true);
        }
        setLoading(false);
        return;
      }

      setUser(user);

      const { data: empData, error: empError } = await supabase
        .from('employee')
        .select('EMAIL')
        .ilike('EMAIL', user.email)
        .maybeSingle();

      const isEmployee = !!empData;
      const currentRole = isEmployee ? 'employee' : 'admin';
      setRole(currentRole);

      if (isEmployee) {
        const allowedEmployeeRoutes = ['/pos', '/customers', '/transactions', '/services', '/login', '/employee-login'];
        if (!allowedEmployeeRoutes.includes(pathname)) {
          router.push('/pos');
          return;
        }
      }

      setAuthorized(true);
      setLoading(false);
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole(null);
        router.push('/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (loading) {
    return <div style={{ minHeight: '100vh', background: 'var(--background)' }} />;
  }

  if (!authorized && pathname !== '/login' && pathname !== '/employee-login') return null;

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
