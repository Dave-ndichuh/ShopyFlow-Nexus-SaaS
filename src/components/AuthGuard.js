'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

const AuthContext = createContext({ user: null, tenants: [], activeTenant: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [activeTenant, setActiveTenant] = useState(null);
  
  const [branches, setBranches] = useState([]);
  const [activeBranch, setActiveBranch] = useState(null);
  
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setUser(null);
        if (pathname !== '/login') {
          router.push('/login');
        }
        setLoading(false);
        return;
      }

      setUser(session.user);

      // Fetch user's tenants via RPC or direct query.
      // Wait, we have the RPC `get_user_tenant_ids()` but we also want the tenant names.
      // Let's just query the public.tenants table. RLS ensures we only see our own tenants!
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*');

      if (!tenantError && tenantData) {
        setTenants(tenantData);
        // By default, select the first active tenant if none is selected
        if (tenantData.length > 0) {
          const defaultTenant = tenantData[0];
          setActiveTenant(defaultTenant);
        }
      }

      setLoading(false);
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setTenants([]);
        setActiveTenant(null);
        setBranches([]);
        setActiveBranch(null);
        router.push('/login');
      } else if (event === 'SIGNED_IN') {
        checkAuth();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Secondary effect: when activeTenant changes, fetch its branches
  useEffect(() => {
    if (!activeTenant) return;

    const fetchBranches = async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('tenant_id', activeTenant.id)
        .eq('is_active', true)
        .order('name', { ascending: true });
        
      if (!error && data) {
        setBranches(data);
        if (data.length > 0) {
          // If we already have an active branch from this tenant, keep it. Otherwise, set to the first one.
          setActiveBranch(prev => {
            if (prev && prev.tenant_id === activeTenant.id) return prev;
            return data[0];
          });
        } else {
          setActiveBranch(null);
        }
      }
    };

    fetchBranches();
  }, [activeTenant]);

  if (loading) {
    return <div style={{ minHeight: '100vh', background: 'var(--background)' }} />;
  }

  if (!user && pathname !== '/login') return null;

  const t = (key) => {
    // Default fallback dictionary if nothing is set
    const defaults = {
      contacts: 'Contacts',
      catalog: 'Catalog',
      orders: 'Orders',
      vendors: 'Vendors',
      pos: 'Sales / POS'
    };
    
    if (!activeTenant || !activeTenant.terminology) {
      return defaults[key] || key;
    }
    return activeTenant.terminology[key] || defaults[key] || key;
  };

  return (
    <AuthContext.Provider value={{ user, tenants, activeTenant, setActiveTenant, branches, activeBranch, setActiveBranch, loading, t }}>
      {children}
    </AuthContext.Provider>
  );
}
