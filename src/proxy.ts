import { NextRequest, NextResponse } from 'next/server';

const CSP_HEADER = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://fastly.jsdelivr.net https://*.razorpay.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' blob: data: https://*.supabase.co https://images.unsplash.com https://*.razorpay.com https://*.gstatic.com https://*.googleusercontent.com https://*.wp.com;
  connect-src 'self' https://*.supabase.co https://*.vercel.app wss://*.supabase.co https://fastly.jsdelivr.net https://*.razorpay.com ws: wss:;
  frame-src 'self' https://*.razorpay.com;
  worker-src 'self' blob:;
  media-src 'self' blob:;
  frame-ancestors 'none';
`.replace(/\s{2,}/g, ' ').trim();

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
        try {
          const remainingPath = '/' + pathParts.slice(2).join('/');
          const searchParams = url.search;
          const host = `${potentialSlug}.${baseDomain.replace(/\/$/, '')}`;
          const targetUrl = new URL(`${remainingPath}${searchParams}`, `${protocol}://${host}`);
          
          return NextResponse.redirect(targetUrl);
        } catch (e) {
          console.error('[Middleware] Failed to construct redirect URL:', e);
          // Fallback to next if URL construction fails
          return NextResponse.next();
        }
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
  // If the path already contains the slug, we redirect to the clean version first
  if (url.pathname.startsWith(`/${subdomain}/`) || url.pathname === `/${subdomain}`) {
    const remainingPath = url.pathname.replace(`/${subdomain}`, '') || '/';
    return NextResponse.redirect(new URL(`${remainingPath}${url.search}`, req.url));
  }

  // 7. Staff Base Redirect
  if (url.pathname === '/staff' || url.pathname === '/staff/') {
    return NextResponse.redirect(new URL('/staff/dashboard', req.url));
  }

  // ---- STAFF AUTH GUARD (runs before React) ----
  // If accessing any staff route that is NOT the login page, check for session cookie.
  const isStaffProtectedRoute = url.pathname.startsWith('/staff/') && !url.pathname.startsWith('/staff/login');
  if (isStaffProtectedRoute) {
    const staffSession = req.cookies.get('staff_session');
    if (!staffSession?.value) {
      // Redirect to login, preserving the subdomain (tenant) context
      const loginUrl = new URL('/staff/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  // ------------------------------------------------

  const response = NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}${url.search}`, req.url));

   
  response.headers.set('Content-Security-Policy', CSP_HEADER);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=*, microphone=(), geolocation=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}
