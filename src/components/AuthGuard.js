'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { getRootUrl } from '@/utils/domain';

const AuthContext = createContext({ user: null, tenants: [], activeTenant: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const tenantSlug = params.tenant;
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [activeTenant, setActiveTenant] = useState(null);
  
  const [branches, setBranches] = useState([]);
  const [activeBranch, setActiveBranch] = useState(null);
  
  const [activeRole, setActiveRole] = useState(null);
  
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setUser(null);
        if (pathname !== '/login' && pathname !== '/register' && pathname !== '/') {
          window.location.href = getRootUrl('/login');
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
        .select('*')
        .order('created_at', { ascending: false });

      if (!tenantError && tenantData) {
        setTenants(tenantData);
        
        if (tenantData.length > 0) {
          if (tenantSlug) {
            // Find the exact tenant matching the subdomain
            const matchedTenant = tenantData.find(t => t.slug === tenantSlug);
            if (matchedTenant) {
              setActiveTenant(matchedTenant);
            } else {
              // User doesn't have access to this subdomain!
              const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || (process.env.NODE_ENV === 'development' ? 'localhost:3000' : 'nexussaas.com');
              const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
              window.location.href = `${protocol}://${rootDomain}/login`;
              return;
            }
          } else {
            // No tenant slug provided (root domain). We shouldn't really be in AuthGuard if they hit a [tenant] route,
            // but just in case, set to default.
            setActiveTenant(tenantData[0]);
          }
        } else {
          // No tenants found for this user, force onboarding
          if (pathname !== '/onboarding') {
            window.location.href = getRootUrl('/onboarding');
          }
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
        setActiveRole(null);
        window.location.href = getRootUrl('/login');
      } else if (event === 'SIGNED_IN') {
        checkAuth();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Secondary effect: when activeTenant changes, fetch its context (branches & role)
  useEffect(() => {
    if (!activeTenant || !user) return;

    const fetchContext = async () => {
      // 1. Fetch user's role in this tenant
      const { data: membership } = await supabase
        .from('tenant_memberships')
        .select('roles(name)')
        .eq('tenant_id', activeTenant.id)
        .eq('user_id', user.id)
        .single();
        
      const roleName = membership?.roles?.name || 'Owner'; // Fallback to Owner for the initial creator
      setActiveRole(roleName);

      // 2. Fetch branches
      let query = supabase
        .from('branches')
        .select('*')
        .eq('tenant_id', activeTenant.id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      // If Cashier (or not Owner/Admin/Manager), restrict to assigned branches
      if (roleName === 'Cashier') {
        const { data: userBranches } = await supabase
          .from('user_branches')
          .select('branch_id')
          .eq('tenant_id', activeTenant.id)
          .eq('user_id', user.id);
          
        if (userBranches && userBranches.length > 0) {
          const allowedIds = userBranches.map(ub => ub.branch_id);
          query = query.in('id', allowedIds);
        } else {
          // No assigned branches, force empty result
          query = query.in('id', ['00000000-0000-0000-0000-000000000000']);
        }
      }
        
      const { data, error } = await query;
      if (!error && data) {
        setBranches(data);
        if (data.length > 0) {
          // If we already have an active branch from this tenant that is allowed, keep it
          setActiveBranch(prev => {
            if (prev && prev.tenant_id === activeTenant.id && data.some(b => b.id === prev.id)) return prev;
            return data[0];
          });
        } else {
          setActiveBranch(null);
        }
      }
    };

    fetchContext();
  }, [activeTenant, user]);

  if (loading) {
    return <div style={{ minHeight: '100vh', background: 'var(--background)' }} />;
  }

  if (!user && pathname !== '/login' && pathname !== '/register' && pathname !== '/') return null;

  // If authenticated but no active tenant, block rendering of protected app routes
  // (unless they are on the onboarding page)
  if (user && !activeTenant && pathname !== '/onboarding') {
    return <div style={{ minHeight: '100vh', background: 'var(--background)' }} />;
  }

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
    <AuthContext.Provider value={{ user, tenants, activeTenant, setActiveTenant, branches, activeBranch, setActiveBranch, activeRole, loading, t }}>
      {children}
    </AuthContext.Provider>
  );
}
