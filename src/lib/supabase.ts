import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

 
const isServer = typeof window === 'undefined';
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'qrsaas-auth-token',
    storage: !isServer ? {
      getItem: (key) => {
        const name = key + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
          const c = ca[i].trim();
          if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
        }
        return null;
      },
      setItem: (key, value) => {
        const currentHost = window.location.hostname;
        const baseDomainEnv = (process.env.NEXT_PUBLIC_BASE_DOMAIN || '').split(':')[0];
        
        let domain = '';
        if (baseDomainEnv && currentHost.endsWith(baseDomainEnv)) {
          // If we're on the expected base domain or a subdomain, use the base
          domain = `; Domain=.${baseDomainEnv}`;
        } else if (currentHost.includes('.') && !/^\d+\.\d+\.\d+\.\d+$/.test(currentHost) && currentHost !== 'localhost') {
          // Fallback: try to guess the root domain (e.g., app.diney.tech -> .diney.tech)
          const parts = currentHost.split('.');
          if (parts.length >= 2) {
              domain = `; Domain=.${parts.slice(-2).join('.')}`;
          }
        }
        
        const secure = window.location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `${key}=${value}${domain}; Path=/; SameSite=Lax${secure}; Max-Age=31536000`;
      },
      removeItem: (key) => {
        const currentHost = window.location.hostname;
        const baseDomainEnv = (process.env.NEXT_PUBLIC_BASE_DOMAIN || '').split(':')[0];
        
        let domain = '';
        if (baseDomainEnv && currentHost.endsWith(baseDomainEnv)) {
          domain = `; Domain=.${baseDomainEnv}`;
        } else if (currentHost.includes('.') && !/^\d+\.\d+\.\d+\.\d+$/.test(currentHost) && currentHost !== 'localhost') {
            const parts = currentHost.split('.');
            if (parts.length >= 2) {
                domain = `; Domain=.${parts.slice(-2).join('.')}`;
            }
        }
        
        document.cookie = `${key}=; Path=/; SameSite=Lax${domain}; Max-Age=0`;
      }
    } : undefined
  }
});

 
 
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null as (ReturnType<typeof createClient> | null) as any;
