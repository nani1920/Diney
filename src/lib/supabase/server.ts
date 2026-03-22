import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  const headersList = await headers();
  const host = headersList.get('host') || '';
  
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
          const baseDomainEnv = (process.env.NEXT_PUBLIC_BASE_DOMAIN || '').split(':')[0];
          let domain = options.domain;
          
          if (baseDomainEnv && host.endsWith(baseDomainEnv)) {
            domain = `.${baseDomainEnv}`;
          } else if (host.includes('.') && !/^\d+\.\d+\.\d+\.\d+$/.test(host) && !host.includes('localhost')) {
            const parts = host.split('.');
            if (parts.length >= 2) {
              domain = `.${parts.slice(-2).join('.')}`;
            }
          }

          try {
            cookieStore.set(name, value, {
              ...options,
              domain: domain || options.domain,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            });
          } catch (error) {
             
          }
        },
        remove(name: string, options: CookieOptions) {
          const baseDomainEnv = (process.env.NEXT_PUBLIC_BASE_DOMAIN || '').split(':')[0];
          let domain = options.domain;
          
          if (baseDomainEnv && host.endsWith(baseDomainEnv)) {
            domain = `.${baseDomainEnv}`;
          } else if (host.includes('.') && !/^\d+\.\d+\.\d+\.\d+$/.test(host) && !host.includes('localhost')) {
            const parts = host.split('.');
            if (parts.length >= 2) {
              domain = `.${parts.slice(-2).join('.')}`;
            }
          }

          try {
            cookieStore.set(name, '', { 
              ...options, 
              domain: domain || options.domain,
              path: '/',
              sameSite: 'lax',
              maxAge: 0 
            });
          } catch (error) {
             
          }
        },
      },
    }
  );
}
