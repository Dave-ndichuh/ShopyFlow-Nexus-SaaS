import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getCookieDomain } from '@/utils/domain';

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|assets).*)',
  ],
};

export async function proxy(req) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || (process.env.NODE_ENV === 'development' ? 'localhost:3000' : 'nexussaas.com');
  
  let currentHost = hostname.replace(`.${rootDomain}`, '');
  
  // If the host is an IP address (e.g. 192.168.100.16) or starts with one, treat it as root
  const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(hostname);

  console.log(`[PROXY] URL: ${url.pathname}, Hostname: ${hostname}, isIpAddress: ${isIpAddress}, Initial currentHost: ${currentHost}`);

  if (currentHost === rootDomain || currentHost === 'www' || isIpAddress) {
    currentHost = '';
  }

  console.log(`[PROXY] Final currentHost: "${currentHost}"`);

  let supabaseResponse = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
             const updatedOptions = { ...options, domain: getCookieDomain() };
             req.cookies.set(name, value);
             supabaseResponse.cookies.set(name, value, updatedOptions);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!currentHost) {
    return supabaseResponse;
  }

  if (currentHost) {
    // 1. Auth pages should always be strictly on the root domain.
    // All client links have been updated to absolute URLs to prevent Next.js router from looping on these cross-origin redirects.
    if (url.pathname === '/login' || url.pathname === '/register' || url.pathname === '/onboarding') {
      const authUrl = new URL(url.pathname, `http${process.env.NODE_ENV === 'development' ? '' : 's'}://${rootDomain}`);
      return NextResponse.redirect(authUrl);
    }

    // 2. Enforce authentication for the subdomain
    if (!session) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    // 3. Rewrite the path to /[tenant]/pathname
    const rewriteUrl = new URL(`/${currentHost}${url.pathname}${url.search}`, req.url);
    const finalResponse = NextResponse.rewrite(rewriteUrl);
    
    supabaseResponse.headers.forEach((val, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        finalResponse.headers.append('set-cookie', val);
      }
    });

    return finalResponse;
  }
}