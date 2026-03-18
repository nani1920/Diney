import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function middleware(req: NextRequest) {
  // Get hostname (e.g. burger.lvh.me:3000)
  const hostname = req.headers.get('host') || '';
  const url = req.nextUrl;

  // Get dynamic configuration from env
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000';
  const protocol = process.env.NEXT_PUBLIC_PROTOCOL || 'http';

  // Define allowed domains (including root domain)
  const allowedDomains = [baseDomain, `www.${baseDomain}`];
  
  // Extract the subdomain
  let subdomain = '';
  // Check if we are on a subdomain of the base domain
  if (hostname.endsWith(baseDomain) && hostname !== baseDomain && hostname !== `www.${baseDomain}`) {
    subdomain = hostname.replace(`.${baseDomain}`, '');
  }

  // If we are at the root domain or www, we show the landing page
  if (subdomain === '' || subdomain === 'www') {
    return NextResponse.next();
  }

  // Guard: Root-level admin paths should ONLY be accessed on the main domain
  const rootAdminPaths = ['/admin/login', '/admin/onboarding', '/admin/onboarding/identity', '/admin/onboarding/pending'];
  if (rootAdminPaths.some(path => url.pathname.startsWith(path))) {
    const mainDomainUrl = new URL(url.pathname, `${protocol}://${baseDomain}`);
    return NextResponse.redirect(mainDomainUrl);
  }

  // --- Advanced Security Headers ---
  const response = (url.pathname.startsWith(`/${subdomain}/`) || url.pathname === `/${subdomain}`)
    ? NextResponse.next()
    : NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}`, req.url));

  // 1. Content Security Policy (Baseline)
  // We allow scripts from self, hashes/nonces would be better but this is a solid start
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' blob: data: https://*.supabase.co https://images.unsplash.com;
    connect-src 'self' https://*.supabase.co https://*.vercel.app wss://*.supabase.co;
    frame-ancestors 'none';
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocations=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}
