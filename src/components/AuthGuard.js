'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Is user logged in?
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        if (pathname !== '/login') {
          router.push('/login');
        } else {
          setAuthorized(true);
          setLoading(false);
        }
        return;
      }

      // 2. Determine Role
      // Admin bypasses checks. For this implementation, we check if the email exists in `employee` table.
      // If it exists, they are restricted to employee routes.
      const { data: empData } = await supabase
        .from('employee')
        .select('EMAIL')
        .eq('EMAIL', user.email)
        .single();

      const isEmployee = !!empData;
      
      // Store role locally for Sidebar UI
      localStorage.setItem('user-role', isEmployee ? 'employee' : 'admin');

      // 3. Route Guard Logic
      if (isEmployee) {
        const allowedEmployeeRoutes = ['/dashboard', '/pos', '/services', '/login'];
        if (!allowedEmployeeRoutes.includes(pathname)) {
          router.push('/dashboard');
          return;
        }
      }

      // Allow access
      setAuthorized(true);
      setLoading(false);
    };

    checkAuth();

    // Supabase Auth Listener for logout
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('user-role');
        router.push('/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
      <p style={{ color: 'var(--primary)', fontWeight: 500 }}>Authenticating Jobea Core...</p>
    </div>;
  }

  if (!authorized && pathname !== '/login') return null;

  return <>{children}</>;
}
