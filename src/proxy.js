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
  if (currentHost === rootDomain || currentHost === 'www') {
    currentHost = '';
  }

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
    if (!session && url.pathname !== '/login' && url.pathname !== '/register' && url.pathname !== '/onboarding') {
      const loginUrl = new URL('/login', `http${process.env.NODE_ENV === 'development' ? '' : 's'}://${rootDomain}`);
      return NextResponse.redirect(loginUrl);
    }

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