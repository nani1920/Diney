import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  const headersList = await headers();
  const host = headersList.get('host') || '';
  
  // Wildcard domain for session sharing from env
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || '';
  // Strip port and add leading dot (e.g., "lvh.me:3000" -> ".lvh.me")
  const rootDomain = baseDomain ? `.${baseDomain.split(':')[0]}` : undefined;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storageKey: 'qrsaas-auth-token',
        persistSession: true,
      },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, {
              ...options,
              domain: rootDomain || options.domain,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            });
          } catch (error) {
            // Server Component context
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set(name, '', { 
              ...options, 
              domain: rootDomain || options.domain,
              path: '/',
              sameSite: 'lax',
              maxAge: 0 
            });
          } catch (error) {
            // Server Component context
          }
        },
      },
    }
  );
}
