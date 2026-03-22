import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
     
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function middleware(req: NextRequest) {
   
  const hostname = req.headers.get('host') || '';
  const url = req.nextUrl;

   
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000';
  const protocol = process.env.NEXT_PUBLIC_PROTOCOL || 'http';

   
  const allowedDomains = [baseDomain, `www.${baseDomain}`];
  
   
  let subdomain = '';
   
  if (hostname.endsWith(baseDomain) && hostname !== baseDomain && hostname !== `www.${baseDomain}`) {
    subdomain = hostname.replace(`.${baseDomain}`, '');
  } else if (hostname.split('.').length >= 3 && !hostname.startsWith('www.')) {
    // Dynamic Fallback: if hostname has 3+ parts and is not www, it's a tenant subdomain
    subdomain = hostname.split('.')[0];
  }

   
  // 4. Handle Root domain
  // 4. Subdomain Enforcement & Redirection
  if (subdomain === '' || subdomain.toLowerCase() === 'www') {
    // Exact match for /admin -> redirect to /admin/dashboard
    if (url.pathname === '/admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }

    const pathParts = url.pathname.split('/');
    if (pathParts.length >= 2) {
      const potentialSlug = pathParts[1];
      const reservedPaths = ['admin', 'api', 'legal', 'favicon.ico', '_next', '_static', 'logo.png'];
      
      if (potentialSlug && !reservedPaths.includes(potentialSlug)) {
        // Force redirect from path-based to subdomain-based for tenants
        const remainingPath = '/' + pathParts.slice(2).join('/');
        const targetUrl = new URL(remainingPath, `${protocol}://${potentialSlug}.${baseDomain}`);
        return NextResponse.redirect(targetUrl);
      }
    }
    return NextResponse.next();
  }

  // 5. Root Admin Redirects (from subdomains back to main domain)
  const rootAdminPaths = ['/admin/login', '/admin/onboarding', '/admin/onboarding/identity', '/admin/onboarding/pending'];
  if (rootAdminPaths.some(path => url.pathname.startsWith(path))) {
    const mainDomainUrl = new URL(url.pathname, `${protocol}://${baseDomain}`);
    return NextResponse.redirect(mainDomainUrl);
  }

  // 6. Rewrite Store Traffic to internal [tenantSlug] structure
  const response = (url.pathname.startsWith(`/${subdomain}/`) || url.pathname === `/${subdomain}`)
    ? NextResponse.next()
    : NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}`, req.url));

   
   
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://fastly.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' blob: data: https://*.supabase.co https://images.unsplash.com;
    connect-src 'self' https://*.supabase.co https://*.vercel.app wss://*.supabase.co https://fastly.jsdelivr.net;
    worker-src 'self' blob:;
    media-src 'self' blob:;
    frame-ancestors 'none';
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=*, microphone=(), geolocation=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}
